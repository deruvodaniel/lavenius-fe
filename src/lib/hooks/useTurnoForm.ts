/**
 * Custom hook for TurnoDrawer form logic
 * Handles form state, validation, and submission
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuthStore, usePatientStore } from '@/lib/stores';
import { SessionType, SessionStatus } from '@/lib/types/session';
import type { CreateSessionDto, SessionResponse } from '@/lib/types/session';
import type { Patient } from '@/lib/types/api.types';

interface UseTurnoFormProps {
  session?: SessionResponse | null;
  pacienteId?: string | number;
  initialDate?: Date;
  onSave: (session: CreateSessionDto) => Promise<void>;
  onDelete?: (sessionId: string) => Promise<void>;
  onClose: () => void;
}

interface TurnoFormData {
  pacienteId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  sessionType: SessionType;
  estado: SessionStatus;
  monto: number;
}

/**
 * Format date-time keeping the user's local offset
 */
const formatLocalDateTime = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const offsetMinutes = date.getTimezoneOffset();
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absoluteOffset / 60));
  const offsetRemainingMinutes = pad(absoluteOffset % 60);
  const sign = offsetMinutes <= 0 ? '+' : '-';

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetRemainingMinutes}`;
};

export function useTurnoForm({
  session,
  pacienteId,
  initialDate,
  onSave,
  onDelete,
  onClose,
}: UseTurnoFormProps) {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const fetchPatientById = usePatientStore(state => state.fetchPatientById);
  const selectedPatientFromStore = usePatientStore(state => state.selectedPatient);

  const [fullPatientData, setFullPatientData] = useState<Patient | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);

  const [formData, setFormData] = useState<TurnoFormData>({
    pacienteId: '',
    fecha: '',
    horaInicio: '09:00',
    horaFin: '10:00',
    motivo: '',
    sessionType: SessionType.PRESENTIAL,
    estado: SessionStatus.CONFIRMED,
    monto: 8500,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!session;

  // Load session data when editing
  useEffect(() => {
    if (session) {
      const scheduledFrom = new Date(session.scheduledFrom);
      const scheduledTo = new Date(session.scheduledTo);
      const fecha = scheduledFrom.toISOString().split('T')[0];
      const horaInicio = `${scheduledFrom.getHours().toString().padStart(2, '0')}:${scheduledFrom.getMinutes().toString().padStart(2, '0')}`;
      const horaFin = `${scheduledTo.getHours().toString().padStart(2, '0')}:${scheduledTo.getMinutes().toString().padStart(2, '0')}`;

      setFormData({
        pacienteId: session.patient?.id || '',
        fecha,
        horaInicio,
        horaFin,
        motivo: session.sessionSummary || '',
        sessionType: session.sessionType,
        estado: session.status,
        monto: session.cost || 8500,
      });
    } else {
      const newFormData: TurnoFormData = {
        pacienteId: pacienteId ? String(pacienteId) : '',
        fecha: '',
        horaInicio: '09:00',
        horaFin: '10:00',
        motivo: '',
        sessionType: SessionType.PRESENTIAL,
        estado: SessionStatus.CONFIRMED,
        monto: 8500,
      };

      if (initialDate) {
        const year = initialDate.getFullYear();
        const month = (initialDate.getMonth() + 1).toString().padStart(2, '0');
        const day = initialDate.getDate().toString().padStart(2, '0');
        newFormData.fecha = `${year}-${month}-${day}`;

        const hours = initialDate.getHours();
        const minutes = initialDate.getMinutes();

        if (hours > 0 || minutes > 0) {
          newFormData.horaInicio = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          const endHours = Math.min(hours + 1, 23);
          newFormData.horaFin = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }

      setFormData(newFormData);
    }
  }, [session, pacienteId, initialDate]);

  // Fetch full patient data when patient is selected
  const loadFullPatientData = useCallback(async (patientId: string) => {
    if (!patientId) {
      setFullPatientData(null);
      return;
    }

    setIsLoadingPatient(true);
    try {
      await fetchPatientById(patientId);
    } catch (error: unknown) {
      console.error('Error loading patient data:', error);
      toast.error(t('agenda.messages.loadPatientDataError'));
    } finally {
      setIsLoadingPatient(false);
    }
  }, [fetchPatientById, t]);

  // Update fullPatientData when selectedPatientFromStore changes
  useEffect(() => {
    if (selectedPatientFromStore && selectedPatientFromStore.id === formData.pacienteId) {
      setFullPatientData(selectedPatientFromStore);
    }
  }, [selectedPatientFromStore, formData.pacienteId]);

  // Load patient data when pacienteId changes
  useEffect(() => {
    if (formData.pacienteId) {
      loadFullPatientData(formData.pacienteId);
    } else {
      setFullPatientData(null);
    }
  }, [formData.pacienteId, loadFullPatientData]);

  const isFormValid = formData.pacienteId && 
    formData.fecha && 
    formData.horaInicio && 
    formData.horaFin && 
    formData.sessionType && 
    formData.estado && 
    fullPatientData?.email && 
    !isLoadingPatient;

  const updateFormField = <K extends keyof TurnoFormData>(field: K, value: TurnoFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.pacienteId) {
      toast.error(t('agenda.validation.selectPatient'));
      return;
    }
    if (!formData.fecha) {
      toast.error(t('agenda.validation.selectDate'));
      return;
    }

    const selectedDate = new Date(`${formData.fecha}T${formData.horaInicio}:00`);
    const now = new Date();
    if (selectedDate < now && !session) {
      toast.error(t('agenda.messages.pastDateError'));
      return;
    }

    if (!formData.horaInicio || !formData.horaFin) {
      toast.error(t('agenda.validation.selectTime'));
      return;
    }
    if (!formData.sessionType) {
      toast.error(t('agenda.validation.selectSessionType'));
      return;
    }
    if (!formData.estado) {
      toast.error(t('agenda.validation.selectStatus'));
      return;
    }

    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    if (!user?.id) {
      toast.error(t('agenda.validation.userIdError'));
      return;
    }

    if (!formData.pacienteId || !formData.fecha || !formData.horaInicio || !formData.horaFin) {
      toast.error(t('agenda.validation.completeAllFields'));
      return;
    }

    const scheduledFromStr = `${formData.fecha}T${formData.horaInicio}:00`;
    const scheduledToStr = `${formData.fecha}T${formData.horaFin}:00`;
    const scheduledFrom = new Date(scheduledFromStr);
    const scheduledTo = new Date(scheduledToStr);

    if (!fullPatientData?.email) {
      toast.error(t('agenda.messages.patientNoEmail'));
      return;
    }

    const sessionDto: CreateSessionDto = {
      patientId: formData.pacienteId,
      scheduledFrom: formatLocalDateTime(scheduledFrom),
      scheduledTo: formatLocalDateTime(scheduledTo),
      attendeeEmail: fullPatientData.email,
      sessionSummary: formData.motivo || undefined,
      type: formData.sessionType,
      status: formData.estado,
      cost: typeof formData.monto === 'number' && !isNaN(formData.monto) ? formData.monto : undefined,
    };

    setIsSaving(true);
    try {
      await onSave(sessionDto);
      setShowSaveConfirm(false);
      onClose();
    } catch {
      setShowSaveConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (session && onDelete) {
      setIsSaving(true);
      try {
        await onDelete(session.id);
        setShowDeleteConfirm(false);
        onClose();
      } catch {
        setShowDeleteConfirm(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return {
    formData,
    updateFormField,
    isEditing,
    isFormValid,
    isLoadingPatient,
    fullPatientData,
    showSaveConfirm,
    setShowSaveConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isSaving,
    handleSave,
    confirmSave,
    confirmDelete,
  };
}
