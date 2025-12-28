import { useState } from 'react';
import { X, User, Phone, Mail, Heart, Video, MapPin, Calendar } from 'lucide-react';
import { Paciente } from '../data/mockData';

interface PacienteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paciente: Partial<Paciente>) => void;
}

export function PacienteDrawer({ isOpen, onClose, onSave }: PacienteDrawerProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    edad: 30,
    telefono: '',
    email: '',
    obraSocial: '',
    modalidad: 'presencial' as 'presencial' | 'remoto' | 'mixto',
    frecuencia: 'semanal' as 'semanal' | 'quincenal' | 'mensual',
    diagnostico: '',
    tratamientoActual: '',
    observaciones: '',
  });

  if (!isOpen) return null;

  const handleSave = () => {
    const newPaciente: Partial<Paciente> = {
      nombre: formData.nombre,
      edad: formData.edad,
      telefono: formData.telefono,
      email: formData.email,
      obraSocial: formData.obraSocial,
      modalidad: formData.modalidad,
      frecuencia: formData.frecuencia,
      historiaClinica: {
        diagnostico: formData.diagnostico,
        tratamientoActual: formData.tratamientoActual,
        observaciones: formData.observaciones,
        ultimaConsulta: new Date().toISOString().split('T')[0],
      },
    };

    onSave(newPaciente);
    onClose();
    
    // Reset form
    setFormData({
      nombre: '',
      edad: 30,
      telefono: '',
      email: '',
      obraSocial: '',
      modalidad: 'presencial',
      frecuencia: 'semanal',
      diagnostico: '',
      tratamientoActual: '',
      observaciones: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl">Nuevo Paciente</h2>
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
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-indigo-800 text-sm">
              Todos los campos son opcionales. Completa solo la información que tengas disponible.
            </p>
          </div>

          {/* Información Personal */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Información Personal
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Nombre completo</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Edad</label>
                <input
                  type="number"
                  value={formData.edad}
                  onChange={(e) => setFormData({ ...formData, edad: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+54 11 1234-5678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ejemplo@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Obra Social
                </label>
                <input
                  type="text"
                  value={formData.obraSocial}
                  onChange={(e) => setFormData({ ...formData, obraSocial: e.target.value })}
                  placeholder="Ej: OSDE, Swiss Medical, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Modalidad y Frecuencia */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Modalidad de Tratamiento
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Modalidad</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, modalidad: 'presencial' })}
                    className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      formData.modalidad === 'presencial'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-300 text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">Presencial</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, modalidad: 'remoto' })}
                    className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      formData.modalidad === 'remoto'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    <span className="text-sm">Remoto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, modalidad: 'mixto' })}
                    className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      formData.modalidad === 'mixto'
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-gray-300 text-gray-700 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex gap-1">
                      <MapPin className="w-4 h-4" />
                      <Video className="w-4 h-4" />
                    </div>
                    <span className="text-sm">Mixto</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Frecuencia</label>
                <select
                  value={formData.frecuencia}
                  onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            </div>
          </div>

          {/* Historia Clínica */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">Historia Clínica</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Diagnóstico</label>
                <textarea
                  value={formData.diagnostico}
                  onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                  placeholder="Diagnóstico principal..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Tratamiento Actual</label>
                <textarea
                  value={formData.tratamientoActual}
                  onChange={(e) => setFormData({ ...formData, tratamientoActual: e.target.value })}
                  placeholder="Plan de tratamiento..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Observaciones clínicas adicionales..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              disabled={!formData.nombre}
            >
              Crear Paciente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
