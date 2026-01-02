import { useState, useEffect } from 'react';
import { Video, MapPin, Calendar, Filter, Plus } from 'lucide-react';
import { Paciente } from '../../data/mockData';
import { FichaClinica } from '../dashboard';
import { PacienteDrawer } from './PacienteDrawer';
import { usePatients, useAppointments } from '@/lib/hooks';

export function Pacientes() {
  const { patients, isLoading, fetchPatients } = usePatients();
  const { appointments, fetchAppointments } = useAppointments();
  
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [modalidadFilter, setModalidadFilter] = useState<'todas' | 'presencial' | 'remoto' | 'mixto'>('todas');
  const [frecuenciaFilter, setFrecuenciaFilter] = useState<'todas' | 'semanal' | 'quincenal' | 'mensual'>('todas');
  const [soloTurnosEstaSemana, setSoloTurnosEstaSemana] = useState(false);
  const [pacienteDrawerOpen, setPacienteDrawerOpen] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, [fetchPatients, fetchAppointments]);

  // If a patient is selected, show their clinical record
  if (selectedPatientId !== null) {
    return (
      <FichaClinica
        pacienteId={selectedPatientId}
        onBack={() => setSelectedPatientId(null)}
      />
    );
  }

  const handleNuevoPaciente = () => {
    setPacienteDrawerOpen(true);
  };

  const handleSavePaciente = async (pacienteData: Partial<Paciente>) => {
    // TODO: Integrate with createPatient from usePatients hook
    // await createPatient(pacienteData);
    console.log('Create patient:', pacienteData);
  };

  // Map API data to component format
  const pacientes = patients.map(p => ({
    id: parseInt(p.id),
    nombre: `${p.firstName} ${p.lastName}`,
    telefono: p.phone || '',
    email: p.email || '',
    edad: 0,
    obraSocial: p.healthInsurance || '',
    modalidad: 'presencial' as const,
    frecuencia: 'semanal' as const,
    historiaClinica: p.notes || '',
  }));

  // Map appointments to turnos format
  const turnos = appointments.map(a => {
    const dateTime = new Date(a.dateTime);
    const fecha = dateTime.toISOString().split('T')[0];
    const hora = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
    return {
      id: parseInt(a.id),
      pacienteId: parseInt(a.patientId),
      fecha,
      hora,
      modalidad: 'presencial' as const,
    };
  });

  // Get today and end of this week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  // Filter patients
  const filteredPacientes = pacientes.filter((paciente) => {
    // Modalidad filter
    if (modalidadFilter !== 'todas' && paciente.modalidad !== modalidadFilter) {
      return false;
    }

    // Frecuencia filter
    if (frecuenciaFilter !== 'todas' && paciente.frecuencia !== frecuenciaFilter) {
      return false;
    }

    // Appointments this week filter
    if (soloTurnosEstaSemana) {
      const tieneTurnoEstaSemana = turnos.some((turno) => {
        const turnoDate = new Date(turno.fecha);
        return turno.pacienteId === paciente.id && turnoDate >= today && turnoDate <= endOfWeek;
      });
      if (!tieneTurnoEstaSemana) {
        return false;
      }
    }

    return true;
  });

  // Get next appointment for a patient
  const getProximoTurno = (pacienteId: number) => {
    const turnosPaciente = turnos
      .filter((t) => t.pacienteId === pacienteId && new Date(t.fecha) >= today)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    if (turnosPaciente.length === 0) return null;

    const proximoTurno = turnosPaciente[0];
    const turnoDate = new Date(proximoTurno.fecha);
    const diffTime = turnoDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { turno: proximoTurno, dias: diffDays };
  };

  const getModalidadLabel = (modalidad: string) => {
    switch (modalidad) {
      case 'presencial':
        return 'Presencial';
      case 'remoto':
        return 'Remoto';
      case 'mixto':
        return 'Mixto';
      default:
        return modalidad;
    }
  };

  const getFrecuenciaLabel = (frecuencia: string) => {
    switch (frecuencia) {
      case 'semanal':
        return 'Semanal';
      case 'quincenal':
        return 'Quincenal';
      case 'mensual':
        return 'Mensual';
      default:
        return frecuencia;
    }
  };

  // Otherwise, show the list of patients
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-gray-600">
          <h1 className="text-gray-900">Pacientes</h1>
          <Filter className="w-4 h-4 ml-4" />
          <span className="text-sm">{filteredPacientes.length} pacientes</span>
        </div>
        <button
          onClick={handleNuevoPaciente}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Paciente
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Modalidad Filter */}
          <div>
            <label className="block text-gray-700 mb-2 text-sm">Modalidad</label>
            <select
              value={modalidadFilter}
              onChange={(e) => setModalidadFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="todas">Todas</option>
              <option value="presencial">Presencial</option>
              <option value="remoto">Remoto</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>

          {/* Frecuencia Filter */}
          <div>
            <label className="block text-gray-700 mb-2 text-sm">Frecuencia</label>
            <select
              value={frecuenciaFilter}
              onChange={(e) => setFrecuenciaFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="todas">Todas</option>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

          {/* This Week Checkbox */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soloTurnosEstaSemana}
                onChange={(e) => setSoloTurnosEstaSemana(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700 text-sm">Solo turnos esta semana</span>
            </label>
          </div>
        </div>
      </div>

      {/* Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPacientes.map((paciente) => {
          const proximoTurno = getProximoTurno(paciente.id);

          return (
            <div
              key={paciente.id}
              onClick={() => setSelectedPatientId(paciente.id)}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-lg transition-all border border-gray-200 cursor-pointer hover:border-indigo-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600">
                      {paciente.nombre.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-gray-900">{paciente.nombre}</h3>
                    <p className="text-gray-500 text-sm">{paciente.edad} años</p>
                  </div>
                </div>
              </div>

              {/* Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                    paciente.modalidad === 'remoto'
                      ? 'bg-blue-100 text-blue-700'
                      : paciente.modalidad === 'presencial'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-teal-100 text-teal-700'
                  }`}
                >
                  {paciente.modalidad === 'remoto' ? (
                    <Video className="w-3 h-3" />
                  ) : (
                    <MapPin className="w-3 h-3" />
                  )}
                  <span>{getModalidadLabel(paciente.modalidad)}</span>
                </span>

                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                  {getFrecuenciaLabel(paciente.frecuencia)}
                </span>

                <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                  {paciente.obraSocial}
                </span>
              </div>

              {/* Next Appointment */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {proximoTurno ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-gray-600">
                      Próximo turno en{' '}
                      <span className="text-indigo-600">
                        {proximoTurno.dias === 0
                          ? 'hoy'
                          : proximoTurno.dias === 1
                          ? '1 día'
                          : `${proximoTurno.dias} días`}
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Sin turnos próximos</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPacientes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron pacientes con los filtros seleccionados</p>
        </div>
      )}

      {/* Paciente Drawer */}
      <PacienteDrawer
        isOpen={pacienteDrawerOpen}
        onClose={() => setPacienteDrawerOpen(false)}
        onSave={handleSavePaciente}
      />
    </div>
  );
}