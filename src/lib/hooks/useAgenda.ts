/**
 * Custom hook for Agenda component logic
 * Extracts complex state management and data transformations
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { usePatients, useResponsive } from '@/lib/hooks';
import { useSessions } from '@/lib/stores/sessionStore';
import { usePayments } from '@/lib/hooks/usePayments';
import { useCalendarStore } from '@/lib/stores/calendarStore';
import { patientService } from '@/lib/services/patient.service';
import { formatTurnoReminderMessage, openWhatsApp } from '@/lib/utils/whatsappTemplates';
import { getErrorMessage } from '@/lib/utils/error';
import type { CreateSessionDto, SessionResponse, UpdateSessionDto } from '@/lib/types/session';
import type { Patient } from '@/lib/types/api.types';

export type ViewMode = 'list' | 'calendar' | 'both';

export interface TurnoUI {
  id: string;
  pacienteId: string;
  fecha: string;
  hora: string;
  modalidad: 'remoto' | 'presencial';
  estado: 'pendiente' | 'confirmado' | 'completado';
  motivo: string;
}

export interface PacienteUI {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  edad: number;
  coberturaMedica: string;
  modalidad: 'presencial';
  frecuencia: 'semanal';
  historiaClinica: string;
}

/**
 * Helper to sanitize string fields that may come as "undefined" from backend
 */
const sanitizeString = (value: string | undefined): string => {
  if (!value || value === 'undefined' || value === 'null') return '';
  return value;
};

export function useAgenda() {
  const { t } = useTranslation();
  const { sessionsUI, isLoading, error, fetchUpcoming, createSession, updateSession, deleteSession, clearError } = useSessions();
  const { patients, selectedPatient, fetchPatients, fetchPatientById, setSelectedPatient } = usePatients();
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
  const [isLoadingPatientDetails, setIsLoadingPatientDetails] = useState(false);
  const [turnoDrawerOpen, setTurnoDrawerOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);
  const [selectedInitialDate, setSelectedInitialDate] = useState<Date | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>(() => isDesktop ? 'both' : 'list');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; patientName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update view mode when screen size changes
  useEffect(() => {
    if (isMobile && viewMode === 'both') {
      setViewMode('list');
    }
  }, [isMobile, viewMode]);

  // Fetch data on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUpcoming();
      fetchPatients();
      fetchPayments();
      checkConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
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

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(5);
  }, [searchTerm]);

  // Transform sessions to UI format
  const turnos: TurnoUI[] = sessionsUI.map((s) => {
    const scheduledFrom = new Date(s.scheduledFrom);
    const year = scheduledFrom.getFullYear();
    const month = (scheduledFrom.getMonth() + 1).toString().padStart(2, '0');
    const day = scheduledFrom.getDate().toString().padStart(2, '0');
    const fecha = `${year}-${month}-${day}`;
    const hora = `${scheduledFrom.getHours().toString().padStart(2, '0')}:${scheduledFrom.getMinutes().toString().padStart(2, '0')}`;

    const mapEstado = (status: string): 'pendiente' | 'confirmado' | 'completado' => {
      if (status === 'confirmed') return 'confirmado';
      if (status === 'completed') return 'completado';
      if (status === 'cancelled') return 'completado';
      return 'pendiente';
    };

    return {
      id: s.id,
      pacienteId: s.patient?.id || '',
      fecha,
      hora,
      modalidad: s.sessionType === 'remote' ? 'remoto' as const : 'presencial' as const,
      estado: mapEstado(s.status),
      motivo: s.sessionSummary || '',
    };
  });

  // Transform patients to UI format
  const pacientes: PacienteUI[] = patients.map((p) => ({
    id: p.id,
    nombre: `${p.firstName} ${p.lastName}`,
    telefono: sanitizeString(p.phone),
    email: sanitizeString(p.email),
    edad: 0,
    coberturaMedica: sanitizeString(p.healthInsurance),
    modalidad: 'presencial' as const,
    frecuencia: 'semanal' as const,
    historiaClinica: sanitizeString(p.notes),
  }));

  // Get today's date (normalized)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Helper functions
  const getPatientNameForTurno = useCallback((turno: TurnoUI) => {
    const paciente = pacientes.find(p => p.id === turno.pacienteId);
    return paciente?.nombre || '';
  }, [pacientes]);

  const getPatientNameById = useCallback((patientId: string | undefined): string | undefined => {
    if (!patientId) return undefined;
    const paciente = pacientes.find(p => p.id === patientId);
    return paciente?.nombre;
  }, [pacientes]);

  const getPaciente = useCallback((pacienteId: string | null) => {
    if (pacienteId === null || pacienteId === undefined) return undefined;
    return pacientes.find((p) => p.id === pacienteId);
  }, [pacientes]);

  // Filter and sort future appointments
  const futurosTurnos = useMemo(() => {
    return turnos
      .filter((turno) => {
        const [year, month, day] = turno.fecha.split('-').map(Number);
        const turnoDate = new Date(year, month - 1, day);
        const isFuture = turnoDate >= today;

        if (searchTerm.trim()) {
          const patientName = getPatientNameForTurno(turno).toLowerCase();
          const search = searchTerm.toLowerCase().trim();
          if (!patientName.includes(search)) return false;
        }

        return isFuture;
      })
      .sort((a, b) => {
        const dateCompare = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.hora.localeCompare(b.hora);
      });
  }, [turnos, searchTerm, today, getPatientNameForTurno]);

  // Filter sessions for calendar
  const filteredSessionsForCalendar = useMemo(() => {
    if (!searchTerm.trim()) return sessionsUI;

    const search = searchTerm.toLowerCase().trim();
    return sessionsUI.filter(session => {
      const patientName = (session.patientName || '').toLowerCase();
      return patientName.includes(search);
    });
  }, [sessionsUI, searchTerm]);

  // Group appointments by date
  const turnosPorDia = useMemo(() => {
    return futurosTurnos.reduce((acc, turno) => {
      const fecha = turno.fecha;
      if (!acc[fecha]) acc[fecha] = [];
      acc[fecha].push(turno);
      return acc;
    }, {} as Record<string, TurnoUI[]>);
  }, [futurosTurnos]);

  const turnosPorDiaEntries = Object.entries(turnosPorDia);
  const visibleTurnosPorDia = turnosPorDiaEntries.slice(0, visibleCount);
  const hasMore = visibleCount < turnosPorDiaEntries.length;

  // Date formatter
  const formatFecha = useCallback((fecha: string) => {
    const [year, month, day] = fecha.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate.getTime() === todayDate.getTime()) {
      return t('agenda.today');
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return t('agenda.tomorrow');
    }

    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, [t]);

  // Event handlers
  const handleNuevoTurno = useCallback(() => {
    setSelectedSession(null);
    setSelectedInitialDate(undefined);
    setTurnoDrawerOpen(true);
  }, []);

  const handleSaveTurno = useCallback(async (sessionData: CreateSessionDto) => {
    try {
      if (selectedSession) {
        const updateData: UpdateSessionDto = {};

        const originalFromMs = new Date(selectedSession.scheduledFrom).getTime();
        const originalToMs = new Date(selectedSession.scheduledTo).getTime();
        const newFromMs = new Date(sessionData.scheduledFrom).getTime();
        const newToMs = new Date(sessionData.scheduledTo).getTime();

        const datesChanged = originalFromMs !== newFromMs || originalToMs !== newToMs;

        if (datesChanged) {
          updateData.scheduledFrom = sessionData.scheduledFrom;
          updateData.scheduledTo = sessionData.scheduledTo;
        }

        if (sessionData.status) updateData.status = sessionData.status;
        if (sessionData.sessionSummary !== undefined) updateData.sessionSummary = sessionData.sessionSummary;
        if (sessionData.cost !== undefined) updateData.cost = sessionData.cost;
        if (sessionData.type) updateData.type = sessionData.type;

        await updateSession(selectedSession.id, updateData);
        toast.success(t('agenda.messages.updateSuccess'));
        await Promise.all([fetchUpcoming(), fetchPayments(true)]);
      } else {
        await createSession(sessionData);
        toast.success(t('agenda.messages.createSuccess'));
        await Promise.all([fetchUpcoming(), fetchPayments(true)]);
      }
      setTurnoDrawerOpen(false);
      setSelectedSession(null);
    } catch (error: unknown) {
      console.error('Error saving session:', error);

      let errorMessage = t('agenda.messages.saveError');
      const errMsg = getErrorMessage(error, '');

      if (errMsg.includes('already exists')) {
        errorMessage = t('agenda.messages.conflictError');
      } else if (errMsg) {
        errorMessage = errMsg;
      }

      toast.error(errorMessage);
    }
  }, [selectedSession, updateSession, createSession, fetchUpcoming, fetchPayments, t]);

  const handleDeleteTurno = useCallback(async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      toast.success(t('agenda.messages.deleteSuccess'));
      setTurnoDrawerOpen(false);
      await Promise.all([fetchUpcoming(), fetchPayments(true)]);
    } catch (error: unknown) {
      console.error('Error deleting session:', error);
      toast.error(t('agenda.messages.deleteError'));
      throw error;
    }
  }, [deleteSession, fetchUpcoming, fetchPayments, t]);

  const handleRequestDeleteTurno = useCallback((sessionId: string, patientName: string) => {
    setSessionToDelete({ id: sessionId, patientName });
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteTurno = useCallback(async () => {
    if (!sessionToDelete) return;

    setIsDeleting(true);
    try {
      await deleteSession(sessionToDelete.id);
      toast.success(t('agenda.messages.deleteSuccess'));
      setDeleteConfirmOpen(false);
      setSessionToDelete(null);
      await Promise.all([fetchUpcoming(), fetchPayments(true)]);
    } catch (error: unknown) {
      console.error('Error deleting session:', error);
      toast.error(t('agenda.messages.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  }, [sessionToDelete, deleteSession, fetchUpcoming, fetchPayments, t]);

  const handleSendWhatsAppConfirmation = useCallback(async (
    paciente: { id?: string; nombre: string; telefono: string } | undefined,
    turno: { fecha: string; hora: string }
  ) => {
    if (!paciente) {
      toast.info(t('agenda.messages.patientNotFound'));
      return;
    }

    let phoneNumber = paciente.telefono;

    if (!phoneNumber && paciente.id) {
      try {
        toast.loading(t('agenda.messages.fetchingPatientData'), { id: 'whatsapp-fetch' });
        const patientDetails = await patientService.getById(paciente.id);
        phoneNumber = sanitizeString(patientDetails.phone);
        toast.dismiss('whatsapp-fetch');
      } catch (error: unknown) {
        toast.dismiss('whatsapp-fetch');
        console.error('Error fetching patient for WhatsApp:', error);
        toast.error(t('agenda.messages.fetchPatientError'));
        return;
      }
    }

    if (!phoneNumber) {
      toast.info(t('agenda.messages.patientNoPhone'));
      return;
    }

    const fechaFormateada = formatFecha(turno.fecha);
    const message = formatTurnoReminderMessage(paciente.nombre, fechaFormateada, turno.hora);
    openWhatsApp(phoneNumber, message);
  }, [formatFecha, t]);

  const handleSelectPatient = useCallback(async (patientId: string) => {
    setSelectedPatientId(patientId);
    setIsLoadingPatientDetails(true);
    try {
      await fetchPatientById(patientId);
    } catch (err: unknown) {
      console.error('Error fetching patient details:', err);
      toast.error(t('agenda.messages.loadPatientError'));
    } finally {
      setIsLoadingPatientDetails(false);
    }
  }, [fetchPatientById, t]);

  const handleBackFromFicha = useCallback(() => {
    setSelectedPatientId(null);
    setSelectedPatient(null);
  }, [setSelectedPatient]);

  const handleEventDrop = useCallback(async (sessionId: string, newStart: Date, newEnd: Date) => {
    try {
      await updateSession(sessionId, {
        scheduledFrom: newStart.toISOString(),
        scheduledTo: newEnd.toISOString(),
      });
      toast.success(t('agenda.messages.rescheduleSuccess'));
      await fetchUpcoming();
    } catch (error: unknown) {
      console.error('Error rescheduling session:', error);
      toast.error(t('agenda.messages.rescheduleError'));
    }
  }, [updateSession, fetchUpcoming, t]);

  return {
    // State
    isLoading,
    selectedPatientId,
    isLoadingPatientDetails,
    selectedPatient,
    turnoDrawerOpen,
    setTurnoDrawerOpen,
    detailsModalOpen,
    setDetailsModalOpen,
    selectedSession,
    setSelectedSession,
    selectedInitialDate,
    setSelectedInitialDate,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    sessionToDelete,
    setSessionToDelete,
    isDeleting,
    loadMoreRef,
    isLoadingMore,

    // Computed data
    today,
    patients,
    pacientes,
    sessionsUI,
    futurosTurnos,
    filteredSessionsForCalendar,
    visibleTurnosPorDia,
    hasMore,

    // Calendar state
    isCalendarConnected,
    connectCalendar,
    syncCalendar,
    isSyncing,
    lastSyncAt,

    // Responsive
    isMobile,
    isDesktop,

    // Helper functions
    formatFecha,
    getPaciente,
    getPatientNameById,
    isSessionPaid,

    // Event handlers
    handleNuevoTurno,
    handleSaveTurno,
    handleDeleteTurno,
    handleRequestDeleteTurno,
    confirmDeleteTurno,
    handleSendWhatsAppConfirmation,
    handleSelectPatient,
    handleBackFromFicha,
    handleEventDrop,
  };
}
