import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuthStore, usePatientStore } from '@/lib/stores';
import { ConfirmDialog } from '@/components/shared';
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

export function TurnoDrawer({ isOpen, onClose, session, patients, pacienteId, initialDate, onSave, onDelete }: TurnoDrawerProps) {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
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
  }, [fetchPatientById]);

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex !top-0 !mt-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-full md:max-w-lg bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl">
              {isEditing ? t('agenda.editSession') : t('agenda.newSession')}
            </h2>
            <button
              onClick={onClose}
              className="text-indigo-200 hover:text-white transition-colors"
              aria-label={t('common.close')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
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
            <input
              id="turno-fecha"
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                !formData.fecha ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              required
            />
          </div>

          {/* Hora Inicio */}
          <div>
            <label htmlFor="turno-hora-inicio" className="flex items-center gap-2 text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              {t('agenda.fields.startTime')} <span className="text-red-500">{t('agenda.drawer.required')}</span>
            </label>
            <select
              id="turno-hora-inicio"
              value={formData.horaInicio}
              onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Hora Fin */}
          <div>
            <label htmlFor="turno-hora-fin" className="flex items-center gap-2 text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              {t('agenda.fields.endTime')} <span className="text-red-500">{t('agenda.drawer.required')}</span>
            </label>
            <select
              id="turno-hora-fin"
              value={formData.horaFin}
              onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'].map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
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

          {/* Tipo de Sesión */}
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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={!isFormValid}
              className={`flex-1 py-3 rounded-lg transition-colors ${
                isFormValid
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isEditing ? t('agenda.drawer.saveChanges') : t('agenda.drawer.createAppointment')}
            </button>
            {isEditing && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}