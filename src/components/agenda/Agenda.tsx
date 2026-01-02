import { useState, useEffect, useRef } from 'react';
import { Clock, Video, MapPin, Plus, Calendar, X, Edit2, CalendarX } from 'lucide-react';
import { toast } from 'sonner';
import { Turno } from '../../data/mockData';
import { TurnoDrawer } from './TurnoDrawer';
import { CalendarView, AnimatedSection, SkeletonList, EmptyState } from '../shared';
import { useAppointments, usePatients, useErrorToast } from '@/lib/hooks';
import type { CreateAppointmentDto, Appointment } from '@/lib/types/api.types';

export function Agenda() {
  const { appointments, isLoading, error, fetchUpcoming, createAppointment, updateAppointment, deleteAppointment, clearError } = useAppointments();
  const { patients, fetchPatients } = usePatients();
  
  // Auto-display error toasts
  useErrorToast(error, clearError);
  
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [turnoDrawerOpen, setTurnoDrawerOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [visibleCount, setVisibleCount] = useState(5); // For infinite scroll
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);
  const hasFetchedRef = useRef(false);
  
  // Estado para el mes/año del calendario
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Fetch data on mount (only once)
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUpcoming(100).catch(() => {}); // Get next 100 appointments
      fetchPatients().catch(() => {}); // Ignore errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          // Simular delay de carga
          setTimeout(() => {
            setVisibleCount((prev) => prev + 5);
            setIsLoadingMore(false);
          }, 800);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isLoadingMore]);

  // Map API data to component format
  const turnos = appointments.map(a => {
    const dateTime = new Date(a.dateTime);
    const fecha = dateTime.toISOString().split('T')[0];
    const hora = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
    
    // Map status to legacy format for display
    const mapEstado = (status: string): 'pendiente' | 'confirmado' | 'completado' => {
      if (status === 'confirmed') return 'confirmado';
      if (status === 'completed') return 'completado';
      if (status === 'cancelled') return 'completado'; // Treat cancelled as completed for display
      return 'pendiente';
    };

    return {
      id: parseInt(a.id),
      pacienteId: parseInt(a.patientId),
      fecha,
      hora,
      modalidad: a.sessionType === 'remote' ? 'remoto' as const : 'presencial' as const,
      estado: mapEstado(a.status),
      motivo: a.description || '',
    };
  });

  const pacientes = patients.map(p => ({
    id: parseInt(p.id),
    nombre: `${p.firstName} ${p.lastName}`,
    telefono: p.phone || '',
    email: p.email || '',
    edad: 0,
    obraSocial: p.healthInsurance || '',
    modalidad: 'presencial' as const,
    frecuencia: 'semanal' as const,
    historiaClinica: p.notes || '',
  }));

  // Get future appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futurosTurnos = turnos
    .filter((turno) => new Date(turno.fecha) >= today)
    .sort((a, b) => {
      const dateCompare = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.hora.localeCompare(b.hora);
    });

  const getPaciente = (pacienteId: number) => {
    return pacientes.find((p) => p.id === pacienteId);
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Group appointments by date
  const turnosPorDia = futurosTurnos.reduce((acc, turno) => {
    const fecha = turno.fecha;
    if (!acc[fecha]) {
      acc[fecha] = [];
    }
    acc[fecha].push(turno);
    return acc;
  }, {} as Record<string, typeof turnos>);

  // Get visible appointments based on scroll
  const turnosPorDiaEntries = Object.entries(turnosPorDia);
  const visibleTurnosPorDia = turnosPorDiaEntries.slice(0, visibleCount);
  const hasMore = visibleCount < turnosPorDiaEntries.length;

  // Calendar data
  const getTurnosPorDia = () => {
    const turnosPorDia: { [key: string]: number } = {};
    turnos.forEach((turno) => {
      if (new Date(turno.fecha) >= today) {
        turnosPorDia[turno.fecha] = (turnosPorDia[turno.fecha] || 0) + 1;
      }
    });
    return turnosPorDia;
  };

  const turnosCountPorDia = getTurnosPorDia();

  // Navigation functions for calendar
  const goToPreviousMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCalendarDate(new Date());
  };
  


  const handleNuevoTurno = () => {
    setSelectedTurno(null);
    setSelectedAppointment(null);
    setTurnoDrawerOpen(true);
  };

  const handleSaveTurno = async (appointmentData: CreateAppointmentDto) => {
    try {
      if (selectedAppointment) {
        // Update existing appointment
        await updateAppointment(selectedAppointment.id, appointmentData);
        toast.success('Turno actualizado exitosamente');
      } else {
        // Create new appointment
        await createAppointment(appointmentData);
        toast.success('Turno creado exitosamente');
      }
      setTurnoDrawerOpen(false);
      setSelectedAppointment(null);
      // Refresh list
      await fetchUpcoming(100);
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Error al guardar el turno');
    }
  };

  const handleDeleteTurno = async (appointmentId: string) => {
    try {
      await deleteAppointment(appointmentId);
      toast.success('Turno eliminado exitosamente');
      setTurnoDrawerOpen(false);
      // Refresh list
      await fetchUpcoming(100);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Error al eliminar el turno');
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 flex-shrink-0">
        <h1 className="text-gray-900">Agenda</h1>
        <div className="flex gap-2">
          {/* Botón Mostrar Calendario - solo visible en mobile/tablet */}
          <button
            onClick={() => setCalendarDrawerOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Mostrar calendario
          </button>
          <button
            onClick={handleNuevoTurno}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Turno
          </button>
        </div>
      </div>

      {/* Layout Principal - Desktop: Grid 2 columnas | Mobile: Columna única */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 flex-1 overflow-hidden">
        {/* Lista de Turnos - Izquierda */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-gray-900 px-6 pt-6 pb-4 flex-shrink-0">Próximos Turnos</h2>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {isLoading ? (
              <SkeletonList items={5} />
            ) : visibleTurnosPorDia.length === 0 ? (
              <EmptyState
                icon={CalendarX}
                title="No hay turnos programados"
                description="Aún no tienes turnos agendados. Comienza creando un nuevo turno."
                action={{
                  label: "Crear primer turno",
                  onClick: handleNuevoTurno
                }}
                variant="subtle"
              />
            ) : (
              <div className="space-y-6">
                {visibleTurnosPorDia.map(([fecha, turnosDelDia]) => {
                const isToday = new Date(fecha).toDateString() === today.toDateString();

                return (
                  <div key={fecha} className="space-y-3">
                    {/* Date Header */}
                    <div className={`pb-2 border-b-2 ${isToday ? 'border-indigo-600' : 'border-gray-200'}`}>
                      <h3 className={`capitalize ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                        {formatFecha(fecha)}
                      </h3>
                    </div>

                    {/* Appointments for this day */}
                    <div className="space-y-3">
                      {turnosDelDia.map((turno) => {
                        const paciente = getPaciente(turno.pacienteId);
                        const appointment = appointments.find(a => parseInt(a.id) === turno.id);

                        return (
                          <div
                            key={turno.id}
                            className="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              {/* Time */}
                              <div className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">{turno.hora}</span>
                              </div>

                              {/* Avatar */}
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-600 text-xs font-semibold">
                                  {paciente?.nombre.split(' ').map((n) => n[0]).join('')}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{paciente?.nombre}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <div
                                        className={`flex items-center gap-1 text-xs ${
                                          turno.modalidad === 'remoto' ? 'text-blue-600' : 'text-purple-600'
                                        }`}
                                      >
                                        {turno.modalidad === 'remoto' ? (
                                          <>
                                            <Video className="w-3 h-3" />
                                            <span>Remoto</span>
                                          </>
                                        ) : (
                                          <>
                                            <MapPin className="w-3 h-3" />
                                            <span>Presencial</span>
                                          </>
                                        )}
                                      </div>
                                      <span className="text-gray-400">•</span>
                                      <p className="text-gray-600 text-xs truncate">{turno.motivo}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                                        turno.estado === 'confirmado'
                                          ? 'bg-green-100 text-green-700'
                                          : turno.estado === 'completado'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                      }`}
                                    >
                                      {turno.estado === 'confirmado' ? 'Confirmado' : turno.estado === 'completado' ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                      onClick={() => {
                                        if (appointment) {
                                          setSelectedAppointment(appointment);
                                          setTurnoDrawerOpen(true);
                                        }
                                      }}
                                      className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                      title="Editar turno"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setSelectedPatientId(paciente?.id || null)}
                                      className="text-indigo-600 text-xs hover:text-indigo-700 transition-colors whitespace-nowrap"
                                    >
                                      Ver ficha
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Load more trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="py-6 text-center">
                  {isLoadingMore ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <p className="text-sm text-gray-500">Cargando más turnos...</p>
                    </div>
                  ) : (
                    <div className="h-4"></div>
                  )}
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Calendario - Derecha (solo visible en desktop >=1024px) */}
        <div className="hidden lg:block">
          <div className="sticky top-4 bg-white rounded-lg shadow-sm p-6">
            <CalendarView
              calendarDate={calendarDate}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
              onToday={goToToday}
              turnosCountPorDia={turnosCountPorDia}
              today={today}
            />
          </div>
        </div>
      </div>

      {/* Calendar Drawer - Solo para Mobile y Tablet */}
      {calendarDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setCalendarDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="relative ml-auto h-full w-full md:max-w-md bg-white shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl">Calendario</h2>
                <button
                  onClick={() => setCalendarDrawerOpen(false)}
                  className="text-indigo-200 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Calendar Content */}
            <div className="p-4">
              <CalendarView
                calendarDate={calendarDate}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                onToday={goToToday}
                turnosCountPorDia={turnosCountPorDia}
                today={today}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Drawers */}
      {/* TODO: Crear componente para ver detalles del paciente */}

      {/* Turno Drawer */}
      <TurnoDrawer
        isOpen={turnoDrawerOpen}
        onClose={() => {
          setTurnoDrawerOpen(false);
          setSelectedTurno(null);
          setSelectedAppointment(null);
        }}
        turno={selectedTurno}
        appointment={selectedAppointment}
        patients={patients}
        pacienteId={selectedPatientId || undefined}
        onSave={handleSaveTurno}
        onDelete={handleDeleteTurno}
      />
    </div>
  );
}