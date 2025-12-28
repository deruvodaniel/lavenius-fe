import { useState } from 'react';
import { Clock, Video, MapPin, Plus, Edit2 } from 'lucide-react';
import { allTurnos, pacientes, Turno } from '../data/mockData';
import { PatientDrawer } from './PatientDrawer';
import { TurnoDrawer } from './TurnoDrawer';

export function Agenda() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [turnoDrawerOpen, setTurnoDrawerOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>(allTurnos);

  // Get future appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futurosTurnos = turnos
    .filter((turno) => new Date(turno.fecha) >= today)
    .sort((a, b) => {
      const dateCompare = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.hora.localeCompare(b.hora);
    });

  const getPaciente = (pacienteId: number) => {
    return pacientes.find((p) => p.id === pacienteId);
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Group appointments by date
  const turnosPorDia = futurosTurnos.reduce((acc, turno) => {
    const fecha = turno.fecha;
    if (!acc[fecha]) {
      acc[fecha] = [];
    }
    acc[fecha].push(turno);
    return acc;
  }, {} as Record<string, typeof turnos>);

  // Calendar data
  const getTurnosPorDia = () => {
    const turnosPorDia: { [key: string]: number } = {};
    turnos.forEach((turno) => {
      if (new Date(turno.fecha) >= today) {
        turnosPorDia[turno.fecha] = (turnosPorDia[turno.fecha] || 0) + 1;
      }
    });
    return turnosPorDia;
  };

  const turnosCountPorDia = getTurnosPorDia();

  // Generate calendar days for current month
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthName = currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const calendarDays = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handleNuevoTurno = () => {
    setSelectedTurno(null);
    setTurnoDrawerOpen(true);
  };

  const handleEditarTurno = (turno: Turno) => {
    setSelectedTurno(turno);
    setTurnoDrawerOpen(true);
  };

  const handleSaveTurno = (turnoData: Partial<Turno>) => {
    if (selectedTurno) {
      // Editar turno existente
      setTurnos(prevTurnos =>
        prevTurnos.map(t => t.id === selectedTurno.id ? { ...t, ...turnoData } : t)
      );
    } else {
      // Crear nuevo turno
      const newTurno: Turno = {
        id: Math.max(...turnos.map(t => t.id)) + 1,
        ...turnoData as Turno,
      };
      setTurnos(prevTurnos => [...prevTurnos, newTurno]);
    }
  };

  const handleDeleteTurno = (turnoId: number) => {
    setTurnos(prevTurnos => prevTurnos.filter(t => t.id !== turnoId));
  };

  return (
    <div className=\"p-8\">
      <div className=\"flex items-center justify-between mb-6\">
        <h1 className=\"text-gray-900\">Agenda</h1>
        <button
          onClick={handleNuevoTurno}
          className=\"flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors\"
        >
          <Plus className=\"w-4 h-4\" />
          Nuevo Turno
        </button>
      </div>

      <div className=\"grid grid-cols-2 gap-6\">
        {/* Left Column - Upcoming Appointments by Day */}
        <div className=\"bg-white rounded-lg shadow-sm p-6\">
          <h2 className=\"text-gray-900 mb-4\">Próximos Turnos</h2>

          <div className=\"space-y-6\">
            {Object.entries(turnosPorDia).slice(0, 10).map(([fecha, turnosDelDia]) => {
              const isToday = new Date(fecha).toDateString() === today.toDateString();

              return (
                <div key={fecha} className=\"space-y-3\">
                  {/* Date Header */}
                  <div className={`pb-2 border-b-2 ${isToday ? 'border-indigo-600' : 'border-gray-200'}`}>
                    <h3 className={`capitalize ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                      {formatFecha(fecha)}
                    </h3>
                  </div>

                  {/* Appointments for this day */}
                  <div className=\"space-y-3\">
                    {turnosDelDia.map((turno) => {
                      const paciente = getPaciente(turno.pacienteId);

                      return (
                        <div
                          key={turno.id}
                          className=\"p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors group\"
                        >
                          <div className=\"flex items-start gap-4\">
                            {/* Time */}
                            <div className=\"flex items-center gap-2 text-gray-600 min-w-[60px]\">
                              <Clock className=\"w-4 h-4\" />
                              <span className=\"text-sm\">{turno.hora}</span>
                            </div>

                            {/* Avatar */}
                            <div className=\"w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0\">
                              <span className=\"text-indigo-600 text-sm\">
                                {paciente?.nombre.split(' ').map((n) => n[0]).join('')}
                              </span>
                            </div>

                            {/* Info */}
                            <div className=\"flex-1\">
                              <div className=\"flex items-start justify-between mb-2\">
                                <div>
                                  <p className=\"text-gray-900\">{paciente?.nombre}</p>
                                  <p className=\"text-gray-600 text-sm\">{turno.motivo}</p>
                                </div>
                                <div className=\"flex items-center gap-2\">
                                  <span
                                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                                      turno.estado === 'confirmado'
                                        ? 'bg-green-100 text-green-700'
                                        : turno.estado === 'completado'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}
                                  >
                                    {turno.estado === 'confirmado' ? 'Confirmado' : turno.estado === 'completado' ? 'Completado' : 'Pendiente'}
                                  </span>
                                  <button
                                    onClick={() => handleEditarTurno(turno)}
                                    className=\"opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-indigo-100 rounded\"
                                  >
                                    <Edit2 className=\"w-4 h-4 text-indigo-600\" />
                                  </button>
                                </div>
                              </div>

                              <div className=\"flex items-center justify-between\">
                                <div
                                  className={`flex items-center gap-1 text-xs ${
                                    turno.modalidad === 'remoto' ? 'text-blue-600' : 'text-purple-600'
                                  }`}
                                >
                                  {turno.modalidad === 'remoto' ? (
                                    <>
                                      <Video className=\"w-3 h-3\" />
                                      <span>Remoto</span>
                                    </>
                                  ) : (
                                    <>
                                      <MapPin className=\"w-3 h-3\" />
                                      <span>Presencial</span>
                                    </>
                                  )}
                                </div>

                                <button
                                  onClick={() => setSelectedPatientId(paciente?.id || null)}
                                  className=\"text-indigo-600 text-sm hover:text-indigo-700 transition-colors\"
                                >
                                  Ver ficha
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Calendar */}
        <div className=\"bg-white rounded-lg shadow-sm p-6\">
          <h2 className=\"text-gray-900 mb-4 capitalize\">{monthName}</h2>

          <div className=\"grid grid-cols-7 gap-2\">
            {/* Day headers */}
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className=\"text-center text-gray-500 text-sm p-2\">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className=\"aspect-square\" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const turnosCount = turnosCountPorDia[dateStr] || 0;
              const isToday = day === currentDate.getDate();
              const isPast = new Date(dateStr) < today;

              return (
                <div
                  key={day}
                  className={`aspect-square p-2 rounded-lg border transition-colors ${
                    isToday
                      ? 'border-indigo-600 bg-indigo-50'
                      : isPast
                      ? 'border-gray-100 bg-gray-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className=\"flex flex-col items-center justify-center h-full\">
                    <span
                      className={`text-sm mb-1 ${
                        isToday ? 'text-indigo-600' : isPast ? 'text-gray-400' : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </span>
                    {turnosCount > 0 && (
                      <span className=\"bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full\">
                        {turnosCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Patient Drawer */}
      <PatientDrawer
        pacienteId={selectedPatientId}
        isOpen={selectedPatientId !== null}
        onClose={() => setSelectedPatientId(null)}
      />

      {/* Turno Drawer */}
      <TurnoDrawer
        isOpen={turnoDrawerOpen}
        onClose={() => {
          setTurnoDrawerOpen(false);
          setSelectedTurno(null);
        }}
        turno={selectedTurno}
        pacientes={pacientes}
        onSave={handleSaveTurno}
        onDelete={handleDeleteTurno}
      />
    </div>
  );
}
