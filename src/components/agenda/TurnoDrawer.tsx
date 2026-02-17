import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
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
  const user = useAuthStore(state => state.user);
  
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
        
        console.log('📅 TurnoDrawer - initialDate received:', initialDate, 'hours:', hours, 'minutes:', minutes);
      }
      
      setFormData(newFormData);
    }
  }, [session, pacienteId, initialDate]);

  if (!isOpen) return null;

  const isEditing = !!session;
  
  // Validate form
  const isFormValid = formData.pacienteId && formData.fecha && formData.horaInicio && formData.horaFin && formData.sessionType && formData.estado;

  const handleSave = () => {
    // Validate before showing confirmation
    if (!formData.pacienteId) {
      alert('Por favor seleccione un paciente');
      return;
    }
    if (!formData.fecha) {
      alert('Por favor seleccione una fecha');
      return;
    }
    
    // Validate that date is not in the past
    const selectedDate = new Date(`${formData.fecha}T${formData.horaInicio}:00`);
    const now = new Date();
    if (selectedDate < now && !session) {
      // Only block past dates for new appointments, allow editing existing ones
      alert('No se pueden agendar turnos en fechas pasadas. Por favor seleccione una fecha futura.');
      return;
    }
    
    if (!formData.horaInicio || !formData.horaFin) {
      alert('Por favor seleccione hora de inicio y fin');
      return;
    }
    if (!formData.sessionType) {
      alert('Por favor seleccione un tipo de sesión');
      return;
    }
    if (!formData.estado) {
      alert('Por favor seleccione un estado');
      return;
    }
    
    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    if (!user?.id) {
      alert('Error: No se pudo obtener el ID del usuario. Por favor, inicie sesión nuevamente.');
      return;
    }

    if (!formData.pacienteId || !formData.fecha || !formData.horaInicio || !formData.horaFin) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    // Combine fecha and hora into ISO dateTime strings
    const scheduledFromStr = `${formData.fecha}T${formData.horaInicio}:00`;
    const scheduledToStr = `${formData.fecha}T${formData.horaFin}:00`;
    const scheduledFrom = new Date(scheduledFromStr);
    const scheduledTo = new Date(scheduledToStr);
    
    // Get patient email for calendar invite
    const selectedPatient = patients.find(p => p.id === formData.pacienteId);
    if (!selectedPatient?.email) {
      alert('El paciente seleccionado no tiene email configurado. Por favor, actualice la información del paciente.');
      return;
    }

    const sessionDto: CreateSessionDto = {
      patientId: formData.pacienteId,
      scheduledFrom: formatLocalDateTime(scheduledFrom),
      scheduledTo: formatLocalDateTime(scheduledTo),
      attendeeEmail: selectedPatient.email,
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
              {isEditing ? 'Editar Turno' : 'Nuevo Turno'}
            </h2>
            <button
              onClick={onClose}
              className="text-indigo-200 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Paciente */}
          <div>
            <label className="flex items-center gap-2 text-gray-700 mb-2">
              <User className="w-4 h-4" />
              Paciente <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.pacienteId}
              onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                !formData.pacienteId ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="flex items-center gap-2 text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
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
            <label className="flex items-center gap-2 text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              Hora Inicio <span className="text-red-500">*</span>
            </label>
            <select
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
            <label className="flex items-center gap-2 text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              Hora Fin <span className="text-red-500">*</span>
            </label>
            <select
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
            <label className="block text-gray-700 mb-2">
              Motivo de consulta
            </label>
            <input
              type="text"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Ej: Sesión de seguimiento"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Tipo de Sesión */}
          <div>
            <label className="block text-gray-700 mb-2">Tipo de Sesión</label>
            <select
              value={formData.sessionType}
              onChange={(e) => setFormData({ ...formData, sessionType: e.target.value as SessionType })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="presential">Presencial</option>
              <option value="remote">Remoto</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-gray-700 mb-2">Estado</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as SessionStatus })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pending">Agendada</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-gray-700 mb-2">
              Monto (ARS)
            </label>
            <input
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
              {isEditing ? 'Guardar cambios' : 'Crear turno'}
            </button>
            {isEditing && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Confirmation Dialog */}
      {showSaveConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-gray-900">
                {isEditing ? '¿Guardar cambios?' : '¿Crear turno?'}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              {isEditing
                ? 'Los cambios se aplicarán al turno seleccionado.'
                : 'Se creará un nuevo turno con la información ingresada.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveConfirm(false)}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-gray-900">¿Eliminar turno?</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Esta acción no se puede deshacer. El turno será eliminado permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}