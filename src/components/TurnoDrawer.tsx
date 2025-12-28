import { useState } from 'react';
import { X, Calendar, Clock, User, Video, MapPin, AlertTriangle } from 'lucide-react';
import { Turno, Paciente } from '../data/mockData';

interface TurnoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  turno?: Turno | null;
  pacientes: Paciente[];
  pacienteId?: number; // Paciente preseleccionado
  onSave: (turno: Partial<Turno>) => void;
  onDelete?: (turnoId: number) => void;
}

export function TurnoDrawer({ isOpen, onClose, turno, pacientes, pacienteId, onSave, onDelete }: TurnoDrawerProps) {
  const [formData, setFormData] = useState({
    pacienteId: turno?.pacienteId || pacienteId || pacientes[0]?.id || 1,
    fecha: turno?.fecha || '',
    hora: turno?.hora || '09:00',
    motivo: turno?.motivo || '',
    modalidad: turno?.modalidad || 'presencial' as 'presencial' | 'remoto',
    estado: turno?.estado || 'pendiente' as 'pendiente' | 'confirmado' | 'completado',
    monto: turno?.monto || 8500,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  if (!isOpen) return null;

  const isEditing = !!turno;

  const handleSave = () => {
    setShowSaveConfirm(true);
  };

  const confirmSave = () => {
    if (isEditing) {
      onSave({ ...formData, id: turno.id });
    } else {
      onSave(formData);
    }
    setShowSaveConfirm(false);
    onClose();
  };

  const confirmDelete = () => {
    if (turno && onDelete) {
      onDelete(turno.id);
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
      <div className="relative ml-auto h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-6">
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
        <div className="p-6 space-y-6">
          {/* Paciente */}
          <div>
            <label className="block text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Paciente
            </label>
            <select
              value={formData.pacienteId}
              onChange={(e) => setFormData({ ...formData, pacienteId: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-gray-700 mb-2 flex items-center gap-2">
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
            <label className="block text-gray-700 mb-2 flex items-center gap-2">
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

          {/* Modalidad */}
          <div>
            <label className="block text-gray-700 mb-2">Modalidad</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, modalidad: 'presencial' })}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  formData.modalidad === 'presencial'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-300 text-gray-700 hover:border-purple-300'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Presencial
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, modalidad: 'remoto' })}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  formData.modalidad === 'remoto'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-blue-300'
                }`}
              >
                <Video className="w-4 h-4" />
                Remoto
              </button>
            </div>
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

          {/* Estado */}
          <div>
            <label className="block text-gray-700 mb-2">Estado</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="completado">Completado</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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