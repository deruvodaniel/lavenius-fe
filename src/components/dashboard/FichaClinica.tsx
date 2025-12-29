import { ArrowLeft, Mail, Phone, Heart, Calendar, FileText, User, Clock, Flag, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { pacientes, allTurnos as turnos, sesiones, Turno } from '../../data/mockData';
import { useState } from 'react';
import { TurnoDrawer } from '../agenda';

interface FichaClinicaProps {
  pacienteId: number;
  onBack: () => void;
}

export function FichaClinica({ pacienteId, onBack }: FichaClinicaProps) {
  const paciente = pacientes.find((p) => p.id === pacienteId);

  // Estado para gestionar flag
  const [isFlagged, setIsFlagged] = useState(paciente?.flagged || false);
  
  // Estado para modo edición
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para datos editables
  const [editableData, setEditableData] = useState({
    telefono: paciente?.telefono || '',
    email: paciente?.email || '',
    diagnostico: paciente?.historiaClinica.diagnostico || '',
    tratamientoActual: paciente?.historiaClinica.tratamientoActual || '',
    observaciones: paciente?.historiaClinica.observaciones || '',
  });

  // Estado para nueva nota
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    fecha: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    notas: '',
  });

  // Estado para edición de notas
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Estado para notas (mock - en producción vendría de la base de datos)
  const [localSesiones, setLocalSesiones] = useState(
    sesiones.filter((s) => s.pacienteId === pacienteId)
  );

  // Estado para drawer de turnos
  const [isTurnoDrawerOpen, setIsTurnoDrawerOpen] = useState(false);

  if (!paciente) return null;

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSaveEdit = () => {
    // Aquí se guardarían los cambios en la base de datos
    // Por ahora solo cerramos el modo edición
    setIsEditing(false);
    console.log('Datos guardados:', editableData);
  };

  const handleCancelEdit = () => {
    // Restaurar datos originales
    setEditableData({
      telefono: paciente.telefono,
      email: paciente.email,
      diagnostico: paciente.historiaClinica.diagnostico,
      tratamientoActual: paciente.historiaClinica.tratamientoActual,
      observaciones: paciente.historiaClinica.observaciones,
    });
    setIsEditing(false);
  };

  const handleAddNote = () => {
    if (!newNote.notas.trim()) return;

    // Crear nueva sesión
    const nuevaSesion = {
      id: Math.max(...localSesiones.map(s => s.id), 0) + 1,
      pacienteId: pacienteId,
      fecha: newNote.fecha,
      duracion: 60,
      tipo: 'Terapia Individual',
      notas: newNote.notas,
    };

    // Agregar a la lista local
    setLocalSesiones([nuevaSesion, ...localSesiones]);

    // Limpiar formulario
    setNewNote({
      fecha: new Date().toISOString().split('T')[0],
      notas: '',
    });
    setIsAddingNote(false);
  };

  const handleEditNote = (sesionId: number, notas: string) => {
    setEditingNoteId(sesionId);
    setEditingNoteText(notas);
  };

  const handleSaveNoteEdit = (sesionId: number) => {
    setLocalSesiones(localSesiones.map(s =>
      s.id === sesionId ? { ...s, notas: editingNoteText } : s
    ));
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleDeleteNote = (sesionId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
      setLocalSesiones(localSesiones.filter(s => s.id !== sesionId));
    }
  };

  const handleSaveTurno = (turnoData: Partial<Turno>) => {
    // Aquí se guardaría el turno en la base de datos
    console.log('Turno creado:', turnoData);
    // En producción, esto actualizaría la lista de turnos
  };

  // Get patient's appointments
  const turnosPaciente = turnos.filter((t) => t.pacienteId === pacienteId);
  const proximosTurnos = turnosPaciente
    .filter((t) => new Date(t.fecha) >= new Date())
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  
  const turnosPasados = turnosPaciente
    .filter((t) => new Date(t.fecha) < new Date())
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

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
              {paciente.nombre.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-white text-2xl md:text-3xl mb-2">{paciente.nombre}</h1>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-indigo-200">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{paciente.edad} años</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>{paciente.obraSocial}</span>
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
                  <span>{formatFecha(paciente.historiaClinica.ultimaConsulta)}</span>
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
                {proximosTurnos.map((turno) => (
                  <div key={turno.id} className="p-3 bg-indigo-50 rounded border border-indigo-100">
                    <p className="text-gray-900 text-sm mb-1">{formatFecha(turno.fecha)}</p>
                    <p className="text-gray-600 text-sm">{turno.hora} - {turno.motivo}</p>
                  </div>
                ))}
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
                {editableData.observaciones}
              </p>
            )}
          </div>

          {/* Agregar Nueva Nota */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Nueva Nota de Sesión</h3>
              {!isAddingNote && (
                <button
                  onClick={() => setIsAddingNote(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Nota</span>
                </button>
              )}
            </div>

            {isAddingNote && (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-700 text-sm block mb-2">Fecha de la sesión</label>
                  <input
                    type="date"
                    value={newNote.fecha}
                    onChange={(e) => setNewNote({ ...newNote, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-gray-700 text-sm block mb-2">Notas de la sesión</label>
                  <textarea
                    value={newNote.notas}
                    onChange={(e) => setNewNote({ ...newNote, notas: e.target.value })}
                    placeholder="Escribe aquí las notas de la sesión..."
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNote}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Nota</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNote(false);
                      setNewNote({ fecha: new Date().toISOString().split('T')[0], notas: '' });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Historial de Sesiones con Notas */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">Historial de Sesiones</h3>
            {localSesiones.length > 0 ? (
              <div className="space-y-4">
                {localSesiones
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .map((sesion) => (
                    <div
                      key={sesion.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span className="text-gray-900">{formatFecha(sesion.fecha)}</span>
                      </div>
                      {editingNoteId === sesion.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveNoteEdit(sesion.id)}
                              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors"
                            >
                              <Save className="w-4 h-4" />
                              <span>Guardar</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditingNoteText('');
                              }}
                              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-gray-700 text-sm leading-relaxed">{sesion.notas}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditNote(sesion.id, sesion.notas)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Editar nota"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(sesion.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Eliminar nota"
                            >
                              <Trash2 className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No hay sesiones registradas</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsTurnoDrawerOpen(true)}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Agendar Turno
            </button>
            <button className="flex-1 bg-white text-gray-700 border-2 border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Turno Drawer */}
      <TurnoDrawer
        isOpen={isTurnoDrawerOpen}
        onClose={() => setIsTurnoDrawerOpen(false)}
        pacienteId={pacienteId}
        pacientes={pacientes}
        onSave={handleSaveTurno}
      />
    </div>
  );
}