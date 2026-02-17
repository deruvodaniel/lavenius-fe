import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Calendar, X, CalendarX, Search, List, LayoutGrid, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { TurnoDrawer } from './TurnoDrawer';
import { TurnoCard } from './TurnoCard';
import { SessionDetailsModal } from './SessionDetailsModal';
import { SkeletonList, EmptyState, ConfirmDialog } from '../shared';
import { FullCalendarView } from './FullCalendarView';
import CalendarSyncButton from '../config/CalendarSyncButton';
import { FichaClinica } from '../dashboard/FichaClinica';
import { TipBanner } from '../onboarding';
import { usePatients, useResponsive } from '@/lib/hooks';
import { useSessions } from '@/lib/stores/sessionStore';
import { usePayments } from '@/lib/hooks/usePayments';
import { useCalendarStore } from '@/lib/stores/calendarStore';
import { Input } from '@/components/ui/input';
import type { CreateSessionDto, SessionResponse, UpdateSessionDto } from '@/lib/types/session';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'list' | 'calendar' | 'both';

// ============================================================================
// VIEW MODE TOGGLE COMPONENT
// ============================================================================

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  isMobile: boolean;
}

const ViewModeToggle = ({ value, onChange, isMobile }: ViewModeToggleProps) => {
  // Mobile: Only list and calendar options (segmented control)
  // Desktop: List, Calendar, Both options
  const options: { value: ViewMode; label: string; icon: React.ReactNode }[] = isMobile
    ? [
        { value: 'list', label: 'Lista', icon: <List className="w-4 h-4" /> },
        { value: 'calendar', label: 'Calendario', icon: <Calendar className="w-4 h-4" /> },
      ]
    : [
        { value: 'list', label: 'Lista', icon: <List className="w-4 h-4" /> },
        { value: 'both', label: 'Ambos', icon: <LayoutGrid className="w-4 h-4" /> },
        { value: 'calendar', label: 'Calendario', icon: <Calendar className="w-4 h-4" /> },
      ];

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${isActive 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {option.icon}
            <span className={isMobile ? 'hidden xs:inline' : ''}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export function Agenda() {
  const { sessionsUI, isLoading, error, fetchUpcoming, createSession, updateSession, deleteSession, clearError } = useSessions();
  const { patients, fetchPatients } = usePatients();
  const { isSessionPaid, fetchPayments } = usePayments();
  const { isMobile, isDesktop } = useResponsive();
  const { isConnected: isCalendarConnected, connectCalendar, syncCalendar, isSyncing, lastSyncAt, checkConnection } = useCalendarStore();
  
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
  const hasFetchedRef = useRef(false);
  
  // View mode state - default to 'both' on desktop, 'list' on mobile
  const [viewMode, setViewMode] = useState<ViewMode>(() => isDesktop ? 'both' : 'list');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; patientName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estado para el mes/año del calendario
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Update view mode when screen size changes
  useEffect(() => {
    if (isMobile && viewMode === 'both') {
      setViewMode('list');
    }
  }, [isMobile, viewMode]);

  // Fetch data on mount (only once)
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUpcoming();
      fetchPatients();
      fetchPayments();
      checkConnection(); // Check calendar connection status
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

  // Helper to get patient name for a turno
  const getPatientNameForTurno = (turno: typeof turnos[0]) => {
    const paciente = pacientes.find(p => 
      p.rawId === turno.pacienteRawId || p.id === turno.pacienteId
    );
    return paciente?.nombre || '';
  };

  // Fallback function to get patient name by ID (used when session.patientName is not available)
  const getPatientNameById = (patientId: string | undefined): string | undefined => {
    if (!patientId) return undefined;
    const paciente = pacientes.find(p => p.rawId === patientId);
    return paciente?.nombre;
  };

  // Filter and sort future appointments
  const futurosTurnos = useMemo(() => {
    return turnos
      .filter((turno) => {
        // Parse fecha string as local date, not UTC
        const [year, month, day] = turno.fecha.split('-').map(Number);
        const turnoDate = new Date(year, month - 1, day);
        const isFuture = turnoDate >= today;
        
        // Apply search filter
        if (searchTerm.trim()) {
          const patientName = getPatientNameForTurno(turno).toLowerCase();
          const search = searchTerm.toLowerCase().trim();
          if (!patientName.includes(search)) {
            return false;
          }
        }
        
        return isFuture;
      })
      .sort((a, b) => {
        const dateCompare = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.hora.localeCompare(b.hora);
      });
  }, [turnos, pacientes, searchTerm, today]);

  // Filter sessions for calendar (apply search filter too)
  const filteredSessionsForCalendar = useMemo(() => {
    if (!searchTerm.trim()) return sessionsUI;
    
    const search = searchTerm.toLowerCase().trim();
    return sessionsUI.filter(session => {
      const patientName = (session.patientName || '').toLowerCase();
      return patientName.includes(search);
    });
  }, [sessionsUI, searchTerm]);

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
  const turnosPorDia = useMemo(() => {
    return futurosTurnos.reduce((acc, turno) => {
      const fecha = turno.fecha;
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push(turno);
      return acc;
    }, {} as Record<string, typeof turnos>);
  }, [futurosTurnos]);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(5);
  }, [searchTerm]);

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
      toast.error('Error al eliminar el turno');
      throw error; // Re-throw so drawer can handle it
    }
  };

  const handleRequestDeleteTurno = (sessionId: string, patientName: string) => {
    setSessionToDelete({ id: sessionId, patientName });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTurno = async () => {
    if (!sessionToDelete) return;

    setIsDeleting(true);
    try {
      await deleteSession(sessionToDelete.id);
      toast.success('Turno eliminado exitosamente');
      setDeleteConfirmOpen(false);
      setSessionToDelete(null);
      // Refresh list
      await fetchUpcoming();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Error al eliminar el turno');
    } finally {
      setIsDeleting(false);
    }
  };

  // Send WhatsApp confirmation request for a turno
  const handleSendWhatsAppConfirmation = (paciente: { nombre: string; telefono: string } | undefined, turno: { fecha: string; hora: string }) => {
    if (!paciente?.telefono) {
      toast.info('El paciente no tiene número de teléfono registrado');
      return;
    }

    const fechaFormateada = formatFecha(turno.fecha);
    const message = `Hola ${paciente.nombre}! Tenés un turno agendado para el ${fechaFormateada} a las ${turno.hora}. ¿Confirmás tu asistencia? Respondé "Sí" para confirmar o "No" si necesitás cancelar. ¡Gracias!`;
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
      <div className="flex flex-col gap-3 flex-shrink-0">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Agenda</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
              Gestiona tus turnos y citas
            </p>
          </div>
          <button
            onClick={handleNuevoTurno}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Turno
          </button>
        </div>

        {/* Search + View Toggle row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <ViewModeToggle 
            value={viewMode} 
            onChange={setViewMode} 
            isMobile={!isDesktop}
          />
        </div>

        {/* Search results count */}
        {searchTerm && (
          <p className="text-sm text-gray-500">
            {futurosTurnos.length} turno{futurosTurnos.length !== 1 ? 's' : ''} encontrado{futurosTurnos.length !== 1 ? 's' : ''}
            {searchTerm && ` para "${searchTerm}"`}
          </p>
        )}

        {/* Calendar connection status */}
        {!isCalendarConnected ? (
          <TipBanner
            tipId="agenda-connect-calendar"
            title="Conecta tu Google Calendar"
            description="Sincroniza tus turnos con Google Calendar para recibir recordatorios y que tus pacientes reciban invitaciones automáticas."
            variant="info"
            action={{
              label: "Conectar ahora",
              onClick: connectCalendar
            }}
          />
        ) : (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Google Calendar conectado</span>
              {lastSyncAt && (
                <span className="text-xs text-green-600">
                  · Última sincronización: {new Date(lastSyncAt).toLocaleString('es-AR', { 
                    day: 'numeric', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
            <button
              onClick={() => syncCalendar()}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-900 px-3 py-1.5 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        )}
      </div>

      {/* Layout Principal - Based on viewMode */}
      <div className={`flex-1 overflow-hidden ${
        viewMode === 'both' 
          ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
          : 'flex'
      }`}>
        {/* Lista de Turnos */}
        {(viewMode === 'list' || viewMode === 'both') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
            <h2 className="text-gray-900 px-6 pt-6 pb-4 flex-shrink-0">Próximos Turnos</h2>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {isLoading ? (
                <SkeletonList items={5} />
              ) : visibleTurnosPorDia.length === 0 ? (
                <div className="space-y-6">
                  <EmptyState
                    icon={searchTerm ? Search : CalendarX}
                    title={searchTerm ? "Sin resultados" : "No hay turnos programados"}
                    description={searchTerm 
                      ? `No se encontraron turnos para "${searchTerm}"`
                      : "Aún no tienes turnos agendados. Comienza creando un nuevo turno o sincroniza con Google Calendar."
                    }
                    action={searchTerm ? {
                      label: "Limpiar búsqueda",
                      onClick: () => setSearchTerm('')
                    } : {
                      label: "Crear primer turno",
                      onClick: handleNuevoTurno
                    }}
                    variant="subtle"
                  />
                  {!searchTerm && (
                    <div className="flex justify-center pt-4">
                      <CalendarSyncButton variant="outline" />
                    </div>
                  )}
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
                          const originalPatient = patients.find(p => p.id === paciente?.rawId);

                          if (!session) return null;

                          return (
                            <TurnoCard
                              key={turno.rawId ?? turno.id}
                              session={session}
                              patient={paciente ? {
                                id: paciente.rawId,
                                nombre: paciente.nombre,
                                telefono: paciente.telefono,
                                riskLevel: originalPatient?.riskLevel,
                              } : undefined}
                              hora={turno.hora}
                              isPaid={isPaid}
                              isCompactView={viewMode === 'both'}
                              onPatientClick={(patientId) => setSelectedPatientId(patientId)}
                              onEditClick={() => {
                                setSelectedSession(session);
                                setTurnoDrawerOpen(true);
                              }}
                              onDeleteClick={() => {
                                handleRequestDeleteTurno(session.id, paciente?.nombre || 'este paciente');
                              }}
                              onWhatsAppClick={() => handleSendWhatsAppConfirmation(paciente, turno)}
                            />
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
        )}

        {/* FullCalendar - Shows based on viewMode */}
        {(viewMode === 'calendar' || viewMode === 'both') && (
          <div className="overflow-auto flex-1">
            <div className="sticky top-4">
              <FullCalendarView
                sessions={filteredSessionsForCalendar}
                isLoading={isLoading}
                isSessionPaid={isSessionPaid}
                getPatientNameFallback={getPatientNameById}
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
        )}
      </div>

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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar turno"
        description={`¿Estás seguro de que deseas eliminar el turno de ${sessionToDelete?.patientName}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteTurno}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setSessionToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
}