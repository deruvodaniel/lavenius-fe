import { ArrowLeft, Mail, Phone, Heart, Calendar, FileText, User, Clock, Flag, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { TurnoDrawer } from '../agenda';
import { usePatients, useAppointments } from '@/lib/hooks';
import type { Patient, CreateAppointmentDto } from '@/lib/types/api.types';

interface FichaClinicaProps {
  patient: Patient | null;
  onBack: () => void;
}

export function FichaClinica({ patient, onBack }: FichaClinicaProps) {
  const { updatePatient } = usePatients();
  const { appointments, fetchAppointments, createAppointment } = useAppointments();
  
  // Estado para gestionar flag
  const [isFlagged, setIsFlagged] = useState(false);
  
  // Estado para modo edición
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para datos editables
  const [editableData, setEditableData] = useState({
    telefono: patient?.phone || '',
    email: patient?.email || '',
    diagnostico: patient?.diagnosis || '',
    tratamientoActual: patient?.currentTreatment || '',
    observaciones: patient?.observations || '',
  });

  // Estado para drawer de turnos
  const [isTurnoDrawerOpen, setIsTurnoDrawerOpen] = useState(false);

  if (!patient) return null;

  // Calculate age
  let edad = patient.age || 0;
  if (patient.birthDate && !patient.age) {
    const birthDate = new Date(patient.birthDate);
    const today = new Date();
    edad = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      edad--;
    }
  }

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSaveEdit = async () => {
    try {
      await updatePatient(patient.id, {
        phone: editableData.telefono || undefined,
        email: editableData.email || undefined,
        diagnosis: editableData.diagnostico || undefined,
        currentTreatment: editableData.tratamientoActual || undefined,
        observations: editableData.observaciones || undefined,
      });
      setIsEditing(false);
      toast.success('Información actualizada exitosamente');
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Error al actualizar la información');
    }
  };

  const handleCancelEdit = () => {
    // Restaurar datos originales
    setEditableData({
      telefono: patient.phone || '',
      email: patient.email || '',
      diagnostico: patient.diagnosis || '',
      tratamientoActual: patient.currentTreatment || '',
      observaciones: patient.observations || '',
    });
    setIsEditing(false);
  };

  const handleSaveTurno = async (appointmentData: CreateAppointmentDto) => {
    try {
      await createAppointment(appointmentData);
      toast.success('Turno creado exitosamente');
      await fetchAppointments();
      setIsTurnoDrawerOpen(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Error al crear el turno');
    }
  };

  // Get patient's appointments
  const turnosPaciente = appointments.filter((a) => a.patientId === patient.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const proximosTurnos = turnosPaciente
    .filter((a) => new Date(a.dateTime) >= today)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Volver a Pacientes</span>
      </button>

      {/* Patient Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white rounded-lg p-4 md:p-6 lg:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl sm:text-2xl md:text-3xl">
              {`${patient.firstName} ${patient.lastName}`.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-white text-2xl md:text-3xl mb-2">{patient.firstName} {patient.lastName}</h1>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-indigo-200">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{edad} años</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>{patient.healthInsurance || 'Sin obra social'}</span>
              </div>
            </div>
          </div>
          {/* Flag Icon */}
          <button
            onClick={() => setIsFlagged(!isFlagged)}
            className="p-3 rounded-lg hover:bg-indigo-600 transition-colors"
            title={isFlagged ? "Quitar marcador" : "Marcar paciente"}
          >
            <Flag
              className={`w-6 h-6 ${isFlagged ? 'fill-yellow-400 text-yellow-400' : 'text-indigo-200'}`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact & Basic Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Información de Contacto
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Editar información"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-500 text-sm block mb-1">Teléfono</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editableData.telefono}
                    onChange={(e) => setEditableData({ ...editableData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{editableData.telefono}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-gray-500 text-sm block mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editableData.email}
                    onChange={(e) => setEditableData({ ...editableData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{editableData.email}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-gray-500 text-sm block mb-1">Última Consulta</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{patient.updatedAt ? formatFecha(patient.updatedAt) : 'Sin consultas'}</span>
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            )}
          </div>

          {/* Próximos Turnos */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Próximos Turnos
            </h3>
            {proximosTurnos.length > 0 ? (
              <div className="space-y-3">
                {proximosTurnos.map((turno) => {
                  const dateTime = new Date(turno.dateTime);
                  const fecha = dateTime.toISOString().split('T')[0];
                  const hora = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
                  
                  return (
                    <div key={turno.id} className="p-3 bg-indigo-50 rounded border border-indigo-100">
                      <p className="text-gray-900 text-sm mb-1">{formatFecha(fecha)}</p>
                      <p className="text-gray-600 text-sm">{hora} - {turno.description || 'Sesión'}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No hay turnos próximos</p>
            )}
          </div>
        </div>

        {/* Middle & Right Columns - Clinical History */}
        <div className="col-span-2 space-y-6">
          {/* Diagnóstico */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">Diagnóstico</h3>
            {isEditing ? (
              <textarea
                value={editableData.diagnostico}
                onChange={(e) => setEditableData({ ...editableData, diagnostico: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {editableData.diagnostico}
              </p>
            )}
          </div>

          {/* Tratamiento Actual */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">Tratamiento Actual</h3>
            {isEditing ? (
              <textarea
                value={editableData.tratamientoActual}
                onChange={(e) => setEditableData({ ...editableData, tratamientoActual: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {editableData.tratamientoActual}
              </p>
            )}
          </div>

          {/* Observaciones */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">Observaciones Clínicas</h3>
            {isEditing ? (
              <textarea
                value={editableData.observaciones}
                onChange={(e) => setEditableData({ ...editableData, observaciones: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {editableData.observaciones || 'Sin observaciones registradas'}
              </p>
            )}
          </div>

          {/* Notas de Sesión - Placeholder para futuras implementaciones */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">Notas de Sesión</h3>
            <p className="text-gray-500 text-sm italic">
              Las notas de sesión estarán disponibles próximamente. Por ahora, puedes usar el campo de observaciones clínicas para guardar información importante.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsTurnoDrawerOpen(true)}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Agendar Turno
            </button>
          </div>
        </div>
      </div>

      {/* Turno Drawer */}
      <TurnoDrawer
        isOpen={isTurnoDrawerOpen}
        onClose={() => setIsTurnoDrawerOpen(false)}
        pacienteId={patient.id}
        patients={[patient]}
        onSave={handleSaveTurno}
      />
    </div>
  );
}