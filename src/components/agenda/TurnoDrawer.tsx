import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { usePatientStore } from '@/lib/stores';
import { useAuth } from '@/lib/hooks';
import { ConfirmDialog, BaseDrawer, DrawerBody, DrawerFooter } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import type { Patient } from '@/lib/types/api.types';
import { SessionType, SessionStatus } from '@/lib/types/session';
import type { CreateSessionDto, SessionResponse } from '@/lib/types/session';

// Format date-time keeping the user's local offset so the backend stores the expected slot
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

interface TurnoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session?: SessionResponse | null;
  patients: Patient[];
  pacienteId?: string | number;
  initialDate?: Date; // Pre-fill date when creating from calendar selection
  onSave: (session: CreateSessionDto) => Promise<void>;
  onDelete?: (sessionId: string) => Promise<void>;
}

/**
 * TurnoDrawer Component
 * Modal drawer for creating/editing session appointments
 * 
 * Features:
 * - Focus trap for keyboard navigation
 * - ESC key to close
 * - Confirmation dialogs for save/delete
 * - Accessible with proper ARIA attributes
 */
export function TurnoDrawer({ isOpen, onClose, session, patients, pacienteId, initialDate, onSave, onDelete }: TurnoDrawerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fetchPatientById = usePatientStore(state => state.fetchPatientById);
  const selectedPatientFromStore = usePatientStore(state => state.selectedPatient);
  
  // Store the full patient data (with email) when a patient is selected
  const [fullPatientData, setFullPatientData] = useState<Patient | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  
  const [formData, setFormData] = useState({
    pacienteId: '',
    fecha: '',
    horaInicio: '09:00',
    horaFin: '10:00',
    motivo: '',
    sessionType: SessionType.PRESENTIAL,
    estado: SessionStatus.CONFIRMED,
    monto: 8500,
  });

  const [selectedDuration, setSelectedDuration] = useState(() => {
    try {
      const stored = localStorage.getItem('lavenius_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.defaultSessionDuration) return settings.defaultSessionDuration as number;
      }
    } catch { /* use fallback */ }
    return 60;
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      // Reset form when creating new session
      const newFormData = {
        pacienteId: pacienteId ? String(pacienteId) : '',
        fecha: '',
        horaInicio: '09:00',
        horaFin: '10:00',
        motivo: '',
        sessionType: SessionType.PRESENTIAL,
        estado: SessionStatus.CONFIRMED,
        monto: 8500,
      };
      
      // Pre-fill date and time from calendar selection
      if (initialDate) {
        const year = initialDate.getFullYear();
        const month = (initialDate.getMonth() + 1).toString().padStart(2, '0');
        const day = initialDate.getDate().toString().padStart(2, '0');
        newFormData.fecha = `${year}-${month}-${day}`;
        
        // Pre-fill time from calendar selection
        const hours = initialDate.getHours();
        const minutes = initialDate.getMinutes();
        
        // If hours > 0 or minutes > 0, it's definitely a time slot selection
        if (hours > 0 || minutes > 0) {
          newFormData.horaInicio = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          // Set end time 1 hour later
          const endHours = Math.min(hours + 1, 23);
          newFormData.horaFin = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
      
      setFormData(newFormData);
    }
  }, [session, pacienteId, initialDate]);

  // Fetch full patient data when patient is selected (to get email)
  const loadFullPatientData = useCallback(async (patientId: string) => {
    if (!patientId) {
      setFullPatientData(null);
      return;
    }
    
    setIsLoadingPatient(true);
    try {
      await fetchPatientById(patientId);
    } catch (error) {
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

  // Load patient data when pacienteId changes in form
  useEffect(() => {
    if (formData.pacienteId) {
      loadFullPatientData(formData.pacienteId);
    } else {
      setFullPatientData(null);
    }
  }, [formData.pacienteId, loadFullPatientData]);

  // Compute end time from start time + duration
  const addMinutesToTime = (time: string, minutes: number): string => {
    const [h, m] = time.split(':').map(Number);
    const totalMin = h * 60 + m + minutes;
    const newH = Math.floor(totalMin / 60) % 24;
    const newM = totalMin % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  const handleStartTimeChange = (newStart: string) => {
    const newEnd = addMinutesToTime(newStart, selectedDuration);
    setFormData(prev => ({ ...prev, horaInicio: newStart, horaFin: newEnd }));
  };

  const handleDurationChange = (minutes: number) => {
    setSelectedDuration(minutes);
    const newEnd = addMinutesToTime(formData.horaInicio, minutes);
    setFormData(prev => ({ ...prev, horaFin: newEnd }));
  };

  // Sync duration when editing an existing session
  useEffect(() => {
    if (session && formData.horaInicio && formData.horaFin) {
      const [sh, sm] = formData.horaInicio.split(':').map(Number);
      const [eh, em] = formData.horaFin.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if ([30, 45, 60, 90, 120].includes(diff)) {
        setSelectedDuration(diff);
      }
    }
  }, [session, formData.horaInicio, formData.horaFin]);

  const durationOptions = [
    { value: 30, labelKey: 'agenda.duration.thirtyMin' },
    { value: 45, labelKey: 'agenda.duration.fortyFiveMin' },
    { value: 60, labelKey: 'agenda.duration.oneHour' },
    { value: 90, labelKey: 'agenda.duration.ninetyMin' },
    { value: 120, labelKey: 'agenda.duration.twoHours' },
  ];

  const isEditing = !!session;
  
  // Validate form - also require full patient data to be loaded (with email)
  const isFormValid = formData.pacienteId && formData.fecha && formData.horaInicio && formData.horaFin && formData.sessionType && formData.estado && fullPatientData?.email && !isLoadingPatient;

  const handleSave = () => {
    // Validate before showing confirmation
    if (!formData.pacienteId) {
      toast.error(t('agenda.validation.selectPatient'));
      return;
    }
    if (!formData.fecha) {
      toast.error(t('agenda.validation.selectDate'));
      return;
    }
    
    // Validate that date is not in the past
    const selectedDate = new Date(`${formData.fecha}T${formData.horaInicio}:00`);
    const now = new Date();
    if (selectedDate < now && !session) {
      // Only block past dates for new appointments, allow editing existing ones
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

    // Combine fecha and hora into ISO dateTime strings
    const scheduledFromStr = `${formData.fecha}T${formData.horaInicio}:00`;
    const scheduledToStr = `${formData.fecha}T${formData.horaFin}:00`;
    const scheduledFrom = new Date(scheduledFromStr);
    const scheduledTo = new Date(scheduledToStr);
    
    // Use full patient data (fetched via fetchPatientById) to get email
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
      // Error is handled by parent component (shows toast)
      // Keep drawer open so user can retry
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
        // Error is handled by parent component
        setShowDeleteConfirm(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <>
      <BaseDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? t('agenda.editSession') : t('agenda.newSession')}
        icon={Calendar}
        maxWidth="md:max-w-lg"
        closeLabel={t('common.close')}
        titleId="turno-drawer-title"
        initialFocus="#turno-paciente"
      >
        <DrawerBody>
          {/* Paciente */}
          <div>
            <label htmlFor="turno-paciente" className="flex items-center gap-2 text-gray-700 mb-2">
              <User className="w-4 h-4" />
              {t('agenda.fields.patient')} <span className="text-red-500">{t('agenda.drawer.required')}</span>
            </label>
            <select
              id="turno-paciente"
              value={formData.pacienteId}
              onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                !formData.pacienteId ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              required
            >
              <option value="">{t('agenda.drawer.selectPatient')}</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            {/* Loading indicator or email status */}
            {formData.pacienteId && isLoadingPatient && (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('agenda.drawer.loadingPatientData')}</span>
              </div>
            )}
            {formData.pacienteId && !isLoadingPatient && fullPatientData && !fullPatientData.email && (
              <div className="mt-1 text-sm text-red-500">
                {t('agenda.messages.patientEmailRequired')}
              </div>
            )}
            {formData.pacienteId && !isLoadingPatient && fullPatientData?.email && (
              <div className="mt-1 text-sm text-green-600">
                {t('agenda.drawer.emailLabel')}: {fullPatientData.email}
              </div>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="turno-fecha" className="flex items-center gap-2 text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              {t('agenda.fields.date')} <span className="text-red-500">{t('agenda.drawer.required')}</span>
            </label>
            <DatePicker
              id="turno-fecha"
              value={formData.fecha}
              onChange={(date) => setFormData({ ...formData, fecha: date || '' })}
              placeholder={t('common.datePicker.selectDate')}
              aria-invalid={!formData.fecha}
            />
          </div>

          {/* Start Time & Duration */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="turno-hora-inicio" className="flex items-center gap-2 text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                {t('agenda.fields.startTime')} <span className="text-red-500">{t('agenda.drawer.required')}</span>
              </label>
              <select
                id="turno-hora-inicio"
                value={formData.horaInicio}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label htmlFor="turno-duration" className="flex items-center gap-2 text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                {t('agenda.duration.label')}
              </label>
              <select
                id="turno-duration"
                value={selectedDuration}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {durationOptions.map(({ value, labelKey }) => (
                  <option key={value} value={value}>
                    {addMinutesToTime(formData.horaInicio, value)} ({t(labelKey)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label htmlFor="turno-motivo" className="block text-gray-700 mb-2">
              {t('agenda.fields.reason')}
            </label>
            <input
              id="turno-motivo"
              type="text"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder={t('agenda.fields.reasonPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Tipo de Sesi\u00F3n */}
          <div>
            <label htmlFor="turno-tipo-sesion" className="block text-gray-700 mb-2">{t('agenda.fields.type')}</label>
            <select
              id="turno-tipo-sesion"
              value={formData.sessionType}
              onChange={(e) => setFormData({ ...formData, sessionType: e.target.value as SessionType })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="presential">{t('agenda.sessionTypes.presential')}</option>
              <option value="remote">{t('agenda.sessionTypes.remote')}</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label htmlFor="turno-estado" className="block text-gray-700 mb-2">{t('agenda.fields.status')}</label>
            <select
              id="turno-estado"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as SessionStatus })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pending">{t('agenda.status.scheduled')}</option>
              <option value="confirmed">{t('agenda.status.confirmed')}</option>
              <option value="completed">{t('agenda.status.completed')}</option>
              <option value="cancelled">{t('agenda.status.cancelled')}</option>
            </select>
          </div>

          {/* Monto */}
          <div>
            <label htmlFor="turno-monto" className="block text-gray-700 mb-2">
              {t('agenda.fields.amount')}
            </label>
            <input
              id="turno-monto"
              type="number"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className={`flex-1 ${
              isFormValid
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isEditing ? t('agenda.drawer.saveChanges') : t('agenda.drawer.createAppointment')}
          </Button>
          {isEditing && onDelete && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6"
            >
              {t('common.delete')}
            </Button>
          )}
        </DrawerFooter>
      </BaseDrawer>

      {/* Save Confirmation Dialog */}
      <ConfirmDialog
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        title={isEditing ? t('agenda.drawer.saveConfirmTitle') : t('agenda.drawer.saveConfirmTitleCreate')}
        description={
          isEditing
            ? t('agenda.drawer.saveConfirmDescription')
            : t('agenda.drawer.saveConfirmDescriptionCreate')
        }
        confirmLabel={isSaving ? t('agenda.drawer.saving') : t('common.confirm')}
        cancelLabel={t('common.cancel')}
        variant="default"
        icon={Calendar}
        onConfirm={confirmSave}
        isLoading={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('agenda.drawer.deleteConfirmTitle')}
        description={t('agenda.drawer.deleteConfirmDescription')}
        confirmLabel={isSaving ? t('agenda.drawer.deleting') : t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={confirmDelete}
        isLoading={isSaving}
      />
    </>
  );
}
