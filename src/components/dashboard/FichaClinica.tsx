import { ArrowLeft, Mail, Phone, Heart, Calendar, FileText, User, Clock, Flag, Edit2, Save, X, Plus, MessageCircle, Pencil, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { TurnoDrawer } from '../agenda';
import { NoteDrawer } from '../notes/NoteDrawer';
import { NoteList } from '../notes/NoteList';
import { PacienteDrawer } from '../pacientes/PacienteDrawer';
import { usePatients } from '@/lib/hooks';
import { useNotes } from '@/lib/hooks/useNotes';
import { useSessions } from '@/lib/stores/sessionStore';
import { SkeletonNotes, SkeletonSessionCard } from '../shared/Skeleton';
import type { Patient, CreateNoteDto, UpdateNoteDto, Note, CreatePatientDto } from '@/lib/types/api.types';
import type { CreateSessionDto } from '@/lib/types/session';

interface FichaClinicaProps {
  patient: Patient | null;
  onBack: () => void;
}

// Helper to format frequency label
const getFrecuenciaLabel = (frecuencia?: string) => {
  switch (frecuencia?.toLowerCase()) {
    case 'semanal':
      return 'Semanal';
    case 'quincenal':
      return 'Quincenal';
    case 'mensual':
      return 'Mensual';
    default:
      return frecuencia || 'No especificada';
  }
};

export function FichaClinica({ patient, onBack }: FichaClinicaProps) {
  const { updatePatient, fetchPatients } = usePatients();
  const { sessionsUI, isLoading: isLoadingSessions, fetchUpcoming, createSession } = useSessions();
  const { notes, isLoading: isLoadingNotes, fetchNotesByPatient, createNote, updateNote, deleteNote, clearNotes } = useNotes();
  
  // Estado para gestionar flag (basado en riskLevel del paciente)
  const [isFlagged, setIsFlagged] = useState(patient?.riskLevel === 'high');
  const [isSavingFlag, setIsSavingFlag] = useState(false);
  
  // Estado para modo edición inline (contacto)
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para drawer de edición completa del paciente
  const [isPacienteDrawerOpen, setIsPacienteDrawerOpen] = useState(false);
  
  // Estado para datos editables
  const [editableData, setEditableData] = useState({
    telefono: patient?.phone || '',
    email: patient?.email || '',
    diagnostico: patient?.diagnosis || '',
    tratamientoActual: patient?.currentTreatment || '',
    observaciones: patient?.observations || '',
  });

  // Estado para drawer de turnos y notas
  const [isTurnoDrawerOpen, setIsTurnoDrawerOpen] = useState(false);
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Update flag state when patient changes
  useEffect(() => {
    if (patient) {
      setIsFlagged(patient.riskLevel === 'high');
    }
  }, [patient]);

  // Load notes when patient changes
  useEffect(() => {
    if (patient) {
      fetchNotesByPatient(patient.id);
      fetchUpcoming(); // Load upcoming sessions
    }
    return () => {
      clearNotes();
    };
  }, [patient, fetchNotesByPatient, clearNotes, fetchUpcoming]);

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

  // Toggle flag and persist to backend
  const handleToggleFlag = async () => {
    const newFlagValue = !isFlagged;
    setIsFlagged(newFlagValue);
    setIsSavingFlag(true);
    
    try {
      await updatePatient(patient.id, {
        riskLevel: newFlagValue ? 'high' : 'low',
      });
      toast.success(newFlagValue ? 'Paciente marcado como riesgo alto' : 'Marcador de riesgo removido');
      // Refresh patients list to update other views
      await fetchPatients();
    } catch (error) {
      // Revert on error
      setIsFlagged(!newFlagValue);
      console.error('Error updating patient flag:', error);
      toast.error('Error al actualizar el marcador');
    } finally {
      setIsSavingFlag(false);
    }
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

  const handleSaveTurno = async (sessionData: CreateSessionDto) => {
    try {
      await createSession(sessionData);
      toast.success('Turno creado exitosamente');
      await fetchUpcoming();
      setIsTurnoDrawerOpen(false);
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Error al crear el turno');
    }
  };

  const handleSaveNote = async (data: CreateNoteDto | UpdateNoteDto, noteId?: string) => {
    try {
      if (noteId) {
        await updateNote(noteId, data as UpdateNoteDto);
        toast.success('Nota actualizada exitosamente');
      } else {
        await createNote(data as CreateNoteDto);
        toast.success('Nota creada exitosamente');
      }
      setIsNoteDrawerOpen(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Error al guardar la nota');
    }
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsNoteDrawerOpen(true);
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      toast.success('Nota eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error al eliminar la nota');
    }
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setIsNoteDrawerOpen(true);
  };

  // Handler para guardar paciente desde el drawer
  const handleSavePatientFromDrawer = async (patientData: CreatePatientDto) => {
    try {
      await updatePatient(patient.id, patientData);
      toast.success('Paciente actualizado exitosamente');
      setIsPacienteDrawerOpen(false);
      // Refresh para actualizar la vista
      await fetchPatients();
      // Actualizar datos locales editables
      setEditableData({
        telefono: patientData.phone || '',
        email: patientData.email || '',
        diagnostico: patientData.diagnosis || '',
        tratamientoActual: patientData.currentTreatment || '',
        observaciones: patientData.observations || '',
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Error al actualizar el paciente');
    }
  };

  // Send WhatsApp message to patient
  const handleSendWhatsApp = (message?: string) => {
    if (!editableData.telefono) {
      toast.info('El paciente no tiene número de teléfono registrado');
      return;
    }

    const phone = editableData.telefono.replace(/\D/g, '');
    const defaultMessage = `Hola ${patient.firstName}!`;
    const encodedMessage = encodeURIComponent(message || defaultMessage);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  // Get patient's sessions
  const turnosPaciente = sessionsUI.filter((s) => s.patient?.id === patient.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const proximosTurnos = turnosPaciente
    .filter((a) => new Date(a.scheduledFrom) >= today)
    .sort((a, b) => new Date(a.scheduledFrom).getTime() - new Date(b.scheduledFrom).getTime());

  // Get last completed session (past sessions, sorted descending)
  const ultimaConsulta = turnosPaciente
    .filter((s) => new Date(s.scheduledFrom) < today && s.status === 'completed')
    .sort((a, b) => new Date(b.scheduledFrom).getTime() - new Date(a.scheduledFrom).getTime())[0];

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
      <div className={`bg-gradient-to-r ${isFlagged ? 'from-red-900 to-red-700' : 'from-indigo-900 to-indigo-700'} text-white rounded-lg p-4 md:p-6 lg:p-8 mb-6 transition-colors`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 ${isFlagged ? 'bg-red-600' : 'bg-indigo-600'} rounded-full flex items-center justify-center flex-shrink-0 relative`}>
            <span className="text-white text-xl sm:text-2xl md:text-3xl">
              {`${patient.firstName} ${patient.lastName}`.split(' ').map((n) => n[0]).join('')}
            </span>
            {isFlagged && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Flag className="w-3.5 h-3.5 text-red-900 fill-current" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <h1 className="text-white text-2xl md:text-3xl">{patient.firstName} {patient.lastName}</h1>
              {isFlagged && (
                <span className="px-2 py-0.5 bg-yellow-400 text-red-900 text-xs font-bold rounded">
                  RIESGO ALTO
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-indigo-200">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{edad} años</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>{patient.healthInsurance || 'Sin obra social'}</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>{getFrecuenciaLabel(patient.frequency)}</span>
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPacienteDrawerOpen(true)}
              className={`p-3 rounded-lg ${isFlagged ? 'hover:bg-red-600' : 'hover:bg-indigo-600'} transition-colors`}
              title="Editar información del paciente"
            >
              <Pencil className={`w-6 h-6 ${isFlagged ? 'text-red-200 hover:text-white' : 'text-indigo-200 hover:text-white'}`} />
            </button>
            <button
              onClick={handleToggleFlag}
              disabled={isSavingFlag}
              className={`p-3 rounded-lg ${isFlagged ? 'hover:bg-red-600' : 'hover:bg-indigo-600'} transition-colors disabled:opacity-50`}
              title={isFlagged ? "Quitar marcador de riesgo" : "Marcar como riesgo alto"}
            >
              <Flag
                className={`w-6 h-6 ${isFlagged ? 'fill-yellow-400 text-yellow-400' : 'text-indigo-200'}`}
              />
            </button>
          </div>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{editableData.telefono || 'No registrado'}</span>
                    </div>
                    {editableData.telefono && (
                      <button
                        onClick={() => handleSendWhatsApp()}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
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
                    <span className="text-sm">{editableData.email || 'No registrado'}</span>
                  </div>
                )}
              </div>
              {ultimaConsulta && (
                <div>
                  <label className="text-gray-500 text-sm block mb-1">Última Consulta</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatFecha(ultimaConsulta.scheduledFrom)}</span>
                  </div>
                </div>
              )}
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
            {isLoadingSessions ? (
              <div className="space-y-3">
                <SkeletonSessionCard />
                <SkeletonSessionCard />
              </div>
            ) : proximosTurnos.length > 0 ? (
              <div className="space-y-3">
                {proximosTurnos.map((turno) => {
                  const dateTime = new Date(turno.scheduledFrom);
                  const fecha = dateTime.toISOString().split('T')[0];
                  const hora = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
                  
                  return (
                    <div key={turno.id} className="p-3 bg-indigo-50 rounded border border-indigo-100">
                      <p className="text-gray-900 text-sm mb-1">{formatFecha(fecha)}</p>
                      <p className="text-gray-600 text-sm">{hora} - {turno.sessionSummary || 'Sesión'}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No hay turnos próximos</p>
            )}
            
            {/* Botón Agendar Turno - ahora debajo de Próximos Turnos */}
            <button
              onClick={() => setIsTurnoDrawerOpen(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agendar Turno
            </button>
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
                {editableData.diagnostico || 'Sin diagnóstico registrado'}
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
                {editableData.tratamientoActual || 'Sin tratamiento registrado'}
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

          {/* Notas de Sesión */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Notas de Sesión
              </h3>
              <button
                onClick={handleCreateNote}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Nota
              </button>
            </div>
            
            {isLoadingNotes ? (
              <SkeletonNotes items={3} />
            ) : (
              <NoteList
                notes={notes}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                emptyMessage="No hay notas registradas para este paciente"
              />
            )}
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

      {/* Note Drawer */}
      <NoteDrawer
        isOpen={isNoteDrawerOpen}
        onClose={() => {
          setIsNoteDrawerOpen(false);
          setSelectedNote(null);
        }}
        onSave={handleSaveNote}
        note={selectedNote}
        patientId={patient.id}
      />

      {/* Paciente Drawer - para edición completa */}
      <PacienteDrawer
        isOpen={isPacienteDrawerOpen}
        onClose={() => setIsPacienteDrawerOpen(false)}
        onSave={handleSavePatientFromDrawer}
        patient={patient}
      />
    </div>
  );
}