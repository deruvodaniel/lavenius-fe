import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Video, MapPin, AlertTriangle } from 'lucide-react';
import { Turno, Paciente } from '../../data/mockData';
import { useAuthStore } from '@/lib/stores';
import type { CreateAppointmentDto, Appointment, SessionType, AppointmentStatus, Patient } from '@/lib/types/api.types';

interface TurnoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  turno?: Turno | null;
  appointment?: Appointment | null;
  patients: Patient[];
  pacienteId?: number;
  onSave: (appointment: CreateAppointmentDto) => void;
  onDelete?: (appointmentId: string) => void;
}

export function TurnoDrawer({ isOpen, onClose, turno, appointment, patients, pacienteId, onSave, onDelete }: TurnoDrawerProps) {
  const user = useAuthStore(state => state.user);
  
  const [formData, setFormData] = useState({
    pacienteId: '',
    fecha: '',
    hora: '09:00',
    motivo: '',
    sessionType: 'presential' as SessionType,
    estado: 'pending' as AppointmentStatus,
    monto: 8500,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Load appointment data when editing
  useEffect(() => {
    if (appointment) {
      const dateTime = new Date(appointment.dateTime);
      const fecha = dateTime.toISOString().split('T')[0];
      const hora = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
      
      setFormData({
        pacienteId: appointment.patientId,
        fecha,
        hora,
        motivo: appointment.description || '',
        sessionType: appointment.sessionType,
        estado: appointment.status,
        monto: appointment.cost,
      });
    } else if (turno) {
      // Support legacy turno format - map old values to new
      const mapEstado = (estado: string): AppointmentStatus => {
        if (estado === 'confirmado') return 'confirmed';
        if (estado === 'completado') return 'completed';
        if (estado === 'cancelado') return 'cancelled';
        return 'pending';
      };

      setFormData({
        pacienteId: turno.pacienteId?.toString() || pacienteId?.toString() || '',
        fecha: turno.fecha || '',
        hora: turno.hora || '09:00',
        motivo: turno.motivo || '',
        sessionType: 'presential',
        estado: mapEstado(turno.estado || 'pendiente'),
        monto: turno.monto || 8500,
      });
    } else if (pacienteId) {
      setFormData(prev => ({ ...prev, pacienteId: pacienteId.toString() }));
    }
  }, [appointment, turno, pacienteId]);

  if (!isOpen) return null;

  const isEditing = !!appointment || !!turno;

  const handleSave = () => {
    setShowSaveConfirm(true);
  };

  const confirmSave = () => {
    console.log('confirmSave called');
    console.log('User:', user);
    console.log('FormData:', formData);
    
    if (!user?.id) {
      console.error('No user ID available');
      alert('Error: No se pudo obtener el ID del usuario. Por favor, inicie sesión nuevamente.');
      return;
    }

    // Validate required fields
    if (!formData.pacienteId) {
      alert('Por favor seleccione un paciente');
      return;
    }

    if (!formData.fecha) {
      alert('Por favor seleccione una fecha');
      return;
    }

    // Combine fecha and hora into ISO dateTime
    const dateTimeStr = `${formData.fecha}T${formData.hora}:00`;
    const dateTime = new Date(dateTimeStr);

    const appointmentDto: CreateAppointmentDto = {
      therapistId: user.id,
      patientId: formData.pacienteId,
      dateTime: dateTime.toISOString(),
      description: formData.motivo || undefined,
      sessionType: formData.sessionType,
      status: formData.estado,
      cost: formData.monto,
    };

    console.log('Appointment DTO:', appointmentDto);

    onSave(appointmentDto);
    setShowSaveConfirm(false);
    onClose();
  };

  const confirmDelete = () => {
    if (appointment && onDelete) {
      onDelete(appointment.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
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
              Paciente
            </label>
            <select
              value={formData.pacienteId}
              onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              Fecha
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Hora */}
          <div>
            <label className="flex items-center gap-2 text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              Hora
            </label>
            <select
              value={formData.hora}
              onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map((h) => (
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
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as AppointmentStatus })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
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
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSave}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Confirmar
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}