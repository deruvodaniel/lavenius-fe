import { useState, useEffect, useRef } from 'react';
import { Clock, Video, MapPin, Plus, Calendar, X, Edit2, CalendarX, MessageCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { TurnoDrawer } from './TurnoDrawer';
import { SessionDetailsModal } from './SessionDetailsModal';
import { SkeletonList, EmptyState } from '../shared';
import { FullCalendarView } from './FullCalendarView';
import CalendarSyncButton from '../config/CalendarSyncButton';
import { FichaClinica } from '../dashboard/FichaClinica';
import { usePatients } from '@/lib/hooks';
import { useSessions } from '@/lib/stores/sessionStore';
import { usePayments } from '@/lib/hooks/usePayments';
import type { CreateSessionDto, SessionResponse, UpdateSessionDto } from '@/lib/types/session';
import { SESSION_STATUS_BADGE_CLASSES, SESSION_STATUS_LABELS } from '@/lib/constants/sessionColors';

export function Agenda() {
  const { sessionsUI, isLoading, error, fetchUpcoming, createSession, updateSession, deleteSession, clearError } = useSessions();
  const { patients, fetchPatients } = usePatients();
  const { isSessionPaid, fetchPayments } = usePayments();
  
  // Auto-display error toasts
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [turnoDrawerOpen, setTurnoDrawerOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);
  const [selectedInitialDate, setSelectedInitialDate] = useState<Date | undefined>(undefined);
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
      fetchUpcoming();
      fetchPatients();
      fetchPayments();
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
  const turnos = sessionsUI.map((s, index) => {
    const scheduledFrom = new Date(s.scheduledFrom);
    // Use local date, not UTC
    const year = scheduledFrom.getFullYear();
    const month = (scheduledFrom.getMonth() + 1).toString().padStart(2, '0');
    const day = scheduledFrom.getDate().toString().padStart(2, '0');
    const fecha = `${year}-${month}-${day}`;
    const hora = `${scheduledFrom.getHours().toString().padStart(2, '0')}:${scheduledFrom.getMinutes().toString().padStart(2, '0')}`;
    const numericId = Number.parseInt(s.id, 10);
    const safeId = Number.isNaN(numericId) ? index : numericId;

    // Map status to legacy format for display
    const mapEstado = (status: string): 'pendiente' | 'confirmado' | 'completado' => {
      if (status === 'confirmed') return 'confirmado';
      if (status === 'completed') return 'completado';
      if (status === 'cancelled') return 'completado'; // Treat cancelled as completed for display
      return 'pendiente';
    };

    const patientId = s.patient?.id || '';
    const numericPatientId = Number.parseInt(patientId, 10);

    return {
      id: safeId,
      rawId: s.id,
      pacienteId: Number.isNaN(numericPatientId) ? null : numericPatientId,
      pacienteRawId: patientId,
      fecha,
      hora,
      modalidad: s.sessionType === 'remote' ? 'remoto' as const : 'presencial' as const,
      estado: mapEstado(s.status),
      motivo: s.sessionSummary || '',
    };
  });

  const pacientes = patients.map((p, index) => {
    const numericId = Number.parseInt(p.id, 10);
    const safeId = Number.isNaN(numericId) ? index : numericId;

    return {
      id: safeId,
      rawId: p.id,
      nombre: `${p.firstName} ${p.lastName}`,
      telefono: p.phone || '',
      email: p.email || '',
      edad: 0,
      obraSocial: p.healthInsurance || '',
      modalidad: 'presencial' as const,
      frecuencia: 'semanal' as const,
      historiaClinica: p.notes || '',
    };
  });

  // Get future appointments (including today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futurosTurnos = turnos
    .filter((turno) => {
      // Parse fecha string as local date, not UTC
      const [year, month, day] = turno.fecha.split('-').map(Number);
      const turnoDate = new Date(year, month - 1, day);
      return turnoDate >= today;
    })
    .sort((a, b) => {
      const dateCompare = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.hora.localeCompare(b.hora);
    });

  const getPaciente = (pacienteId: number | string | null) => {
    if (pacienteId === null || pacienteId === undefined) {
      return undefined;
    }

    if (typeof pacienteId === 'string') {
      return pacientes.find((p) => p.rawId === pacienteId);
    }

    return pacientes.find((p) => p.id === pacienteId);
  };

  const formatFecha = (fecha: string) => {
    // Parse fecha string as local date to avoid timezone issues
    const [year, month, day] = fecha.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    if (targetDate.getTime() === today.getTime()) {
      return 'Hoy';
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return 'Mañana';
    }
    
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

  const _turnosCountPorDia = getTurnosPorDia();

  // Navigation functions for calendar
  const _goToPreviousMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const _goToNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const _goToToday = () => {
    setCalendarDate(new Date());
  };
  


  const handleNuevoTurno = () => {
    setSelectedSession(null);
    setSelectedInitialDate(undefined);
    setTurnoDrawerOpen(true);
  };

  const handleSaveTurno = async (sessionData: CreateSessionDto) => {
    try {
      if (selectedSession) {
        // Update existing session - only send fields that actually changed
        const updateData: UpdateSessionDto = {};
        
        // Compare dates by timestamp (ms) to avoid timezone/format issues
        const originalFromMs = new Date(selectedSession.scheduledFrom).getTime();
        const originalToMs = new Date(selectedSession.scheduledTo).getTime();
        const newFromMs = new Date(sessionData.scheduledFrom).getTime();
        const newToMs = new Date(sessionData.scheduledTo).getTime();
        
        // Only include scheduledFrom/scheduledTo if they actually changed (to avoid triggering calendar update)
        const datesChanged = originalFromMs !== newFromMs || originalToMs !== newToMs;
        
        if (datesChanged) {
          updateData.scheduledFrom = sessionData.scheduledFrom;
          updateData.scheduledTo = sessionData.scheduledTo;
        }
        
        // Only include fields that have values
        if (sessionData.status) updateData.status = sessionData.status;
        if (sessionData.sessionSummary !== undefined) updateData.sessionSummary = sessionData.sessionSummary;
        if (sessionData.cost !== undefined) updateData.cost = sessionData.cost;
        if (sessionData.type) updateData.type = sessionData.type;
        
        console.log('📝 Update session data:', { datesChanged, updateData });
        
        await updateSession(selectedSession.id, updateData);
        toast.success('Turno actualizado exitosamente');
        // Refresh to ensure UI is in sync
        await fetchUpcoming();
      } else {
        // Create new session
        await createSession(sessionData);
        toast.success('Turno creado exitosamente');
        // Refresh to ensure UI is in sync
        await fetchUpcoming();
      }
      setTurnoDrawerOpen(false);
      setSelectedSession(null);
    } catch (error: any) {
      console.error('Error saving session:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Error al guardar el turno';
      
      if (error?.message?.includes('already exists')) {
        errorMessage = 'Ya existe una sesión en este horario. Por favor elige otro horario.';
      } else if (error?.statusCode === 409) {
        errorMessage = 'Conflicto de horarios. Ya tienes una sesión programada en este momento.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleDeleteTurno = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      toast.success('Turno eliminado exitosamente');
      setTurnoDrawerOpen(false);
      // Refresh list
      await fetchUpcoming();
    } catch (error) {
      console.error('Error deleting session:', error);
      // Error toast is handled by the store
    }
  };

  // Send WhatsApp reminder for a turno
  const handleSendWhatsAppReminder = (paciente: { nombre: string; telefono: string } | undefined, turno: { fecha: string; hora: string }) => {
    if (!paciente?.telefono) {
      toast.info('El paciente no tiene número de teléfono registrado');
      return;
    }

    const fechaFormateada = formatFecha(turno.fecha);
    const message = `Hola ${paciente.nombre}! Te recuerdo tu turno el ${fechaFormateada} a las ${turno.hora}. ¡Te espero!`;
    const phone = paciente.telefono.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  // If a patient is selected, show their FichaClinica
  if (selectedPatientId !== null) {
    const selectedPatient = patients.find(p => p.id === selectedPatientId);
    return (
      <FichaClinica
        patient={selectedPatient || null}
        onBack={() => setSelectedPatientId(null)}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Gestiona tus turnos y citas
          </p>
        </div>
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

      {/* Layout Principal - Desktop: Grid 2 columnas 50-50 | Mobile: Columna única */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Lista de Turnos - Izquierda */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-gray-900 px-6 pt-6 pb-4 flex-shrink-0">Próximos Turnos</h2>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {isLoading ? (
              <SkeletonList items={5} />
            ) : visibleTurnosPorDia.length === 0 ? (
              <div className="space-y-6">
                <EmptyState
                  icon={CalendarX}
                  title="No hay turnos programados"
                  description="Aún no tienes turnos agendados. Comienza creando un nuevo turno o sincroniza con Google Calendar."
                  action={{
                    label: "Crear primer turno",
                    onClick: handleNuevoTurno
                  }}
                  variant="subtle"
                />
                <div className="flex justify-center pt-4">
                  <CalendarSyncButton variant="outline" />
                </div>
              </div>
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
                        const paciente = getPaciente(turno.pacienteRawId ?? turno.pacienteId ?? null);
                        const session = sessionsUI.find(s => s.id === turno.rawId);
                        const isPaid = session && isSessionPaid(session.id);

                        return (
                          <div
                            key={turno.rawId ?? turno.id}
                            className="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors group"
                          >
                            {/* Mobile Layout (< sm) */}
                            <div className="sm:hidden space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-indigo-600 text-xs font-semibold">
                                      {paciente ? paciente.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2) : '?'}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{paciente?.nombre || 'Sin nombre'}</p>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <Clock className="w-3 h-3" />
                                      <span>{turno.hora}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleSendWhatsAppReminder(paciente, turno)}
                                    className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (session) {
                                        setSelectedSession(session);
                                        setTurnoDrawerOpen(true);
                                      }
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs ${
                                      session ? SESSION_STATUS_BADGE_CLASSES[session.status] : ''
                                    }`}
                                  >
                                    {session ? SESSION_STATUS_LABELS[session.status] : ''}
                                  </span>
                                  {isPaid && (
                                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                                      <DollarSign className="w-3 h-3" />
                                      Pagado
                                    </span>
                                  )}
                                  <span
                                    className={`flex items-center gap-0.5 text-xs ${
                                      turno.modalidad === 'remoto' ? 'text-blue-600' : 'text-purple-600'
                                    }`}
                                  >
                                    {turno.modalidad === 'remoto' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                    {turno.modalidad === 'remoto' ? 'Remoto' : 'Presencial'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setSelectedPatientId(paciente?.rawId || null)}
                                  className="text-indigo-600 text-xs hover:text-indigo-700 transition-colors whitespace-nowrap"
                                >
                                  Ver ficha
                                </button>
                              </div>
                            </div>

                            {/* Desktop Layout (>= sm) */}
                            <div className="hidden sm:flex items-center gap-3">
                              {/* Time */}
                              <div className="flex items-center gap-1 text-gray-600 flex-shrink-0 w-16">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">{turno.hora}</span>
                              </div>

                              {/* Avatar */}
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-600 text-xs font-semibold">
                                  {paciente ? paciente.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2) : '?'}
                                </span>
                              </div>

                              {/* Patient Name */}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{paciente?.nombre || 'Paciente sin nombre'}</p>
                                <div
                                  className={`flex items-center gap-1 text-xs ${
                                    turno.modalidad === 'remoto' ? 'text-blue-600' : 'text-purple-600'
                                  }`}
                                >
                                  {turno.modalidad === 'remoto' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                  <span>{turno.modalidad === 'remoto' ? 'Remoto' : 'Presencial'}</span>
                                </div>
                              </div>

                              {/* Badges */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                                    session ? SESSION_STATUS_BADGE_CLASSES[session.status] : ''
                                  }`}
                                >
                                  {session ? SESSION_STATUS_LABELS[session.status] : ''}
                                </span>
                                {isPaid && (
                                  <span
                                    className="flex items-center gap-0.5 px-2 py-0.5 rounded text-xs whitespace-nowrap bg-green-100 text-green-700"
                                    title="Pagado"
                                  >
                                    <DollarSign className="w-3 h-3" />
                                    Pagado
                                  </span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleSendWhatsAppReminder(paciente, turno)}
                                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Enviar recordatorio por WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (session) {
                                      setSelectedSession(session);
                                      setTurnoDrawerOpen(true);
                                    }
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title="Editar turno"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setSelectedPatientId(paciente?.rawId || null)}
                                  className="text-indigo-600 text-xs hover:text-indigo-700 transition-colors whitespace-nowrap ml-1"
                                >
                                  Ver ficha
                                </button>
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

        {/* FullCalendar - Derecha (solo visible en desktop >=1024px) */}
        <div className="hidden lg:block overflow-auto">
          <div className="sticky top-4">
            <FullCalendarView
              sessions={sessionsUI}
              isSessionPaid={isSessionPaid}
              onEventClick={(session) => {
                setSelectedSession(session);
                setDetailsModalOpen(true);
              }}
              onDateSelect={(start, _end) => {
                // Abrir drawer para crear nueva sesión con la fecha seleccionada
                setSelectedSession(null);
                setSelectedInitialDate(start);
                setTurnoDrawerOpen(true);
              }}
              onEventDrop={async (sessionId, _newStart, _newEnd) => {
                try {
                  await updateSession(sessionId, {
                    scheduledFrom: _newStart.toISOString(),
                    scheduledTo: _newEnd.toISOString(),
                  });
                  toast.success('Turno reagendado exitosamente');
                  await fetchUpcoming();
                } catch (error) {
                  console.error('Error rescheduling session:', error);
                  toast.error('Error al reagendar el turno');
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Calendar Drawer - Solo para Mobile y Tablet */}
      {calendarDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden !top-0 !mt-0">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setCalendarDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="relative ml-auto h-full w-full bg-white shadow-2xl overflow-y-auto">
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

            {/* FullCalendar Content */}
            <div className="p-4">
              <FullCalendarView
                sessions={sessionsUI}
                isSessionPaid={isSessionPaid}
                onEventClick={(session) => {
                  setSelectedSession(session);
                  setCalendarDrawerOpen(false);
                  setDetailsModalOpen(true);
                }}
                onDateSelect={(start, _end) => {
                  setSelectedSession(null);
                  setSelectedInitialDate(start);
                  setCalendarDrawerOpen(false);
                  setTurnoDrawerOpen(true);
                }}
                onEventDrop={async (sessionId, newStart, newEnd) => {
                  try {
                    await updateSession(sessionId, {
                      scheduledFrom: newStart.toISOString(),
                      scheduledTo: newEnd.toISOString(),
                    });
                    toast.success('Turno reagendado exitosamente');
                    await fetchUpcoming();
                  } catch (error) {
                    console.error('Error rescheduling session:', error);
                    toast.error('Error al reagendar el turno');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Turno Drawer */}
      <TurnoDrawer
        isOpen={turnoDrawerOpen}
        onClose={() => {
          setTurnoDrawerOpen(false);
          setSelectedSession(null);
          setSelectedInitialDate(undefined);
        }}
        session={selectedSession}
        patients={patients}
        pacienteId={selectedPatientId || undefined}
        initialDate={selectedInitialDate}
        onSave={handleSaveTurno}
        onDelete={handleDeleteTurno}
      />

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        isOpen={detailsModalOpen}
        isPaid={selectedSession ? isSessionPaid(selectedSession.id) : false}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedSession(null);
        }}
        onEdit={() => {
          setDetailsModalOpen(false);
          setTurnoDrawerOpen(true);
        }}
      />
    </div>
  );
}