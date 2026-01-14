import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Clock, DollarSign, Calendar, Video, MapPin, Copy, MessageCircle, X, MoreVertical } from 'lucide-react';
import { usePatients } from '@/lib/hooks';
import { useSessions } from '@/lib/stores/sessionStore';

export function Cobros() {
  const { sessionsUI, fetchUpcoming } = useSessions();
  const { patients, fetchPatients } = usePatients();
  
  const [turnosCobrados, setTurnosCobrados] = useState<{ [key: number]: boolean }>({});
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [_selectedTurno, setSelectedTurno] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  // Fetch data on mount (only once)
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      const fetchData = async () => {
        setIsLoading(true);
        try {
          await Promise.all([
            fetchUpcoming(),
            fetchPatients()
          ]);
        } catch {
          // Ignore errors
        }
        setIsLoading(false);
      };
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map API data to component format
  const turnos = sessionsUI.map(s => {
    const scheduledFrom = new Date(s.scheduledFrom);
    const fecha = scheduledFrom.toISOString().split('T')[0];
    const hora = s.formattedTime || `${scheduledFrom.getHours().toString().padStart(2, '0')}:${scheduledFrom.getMinutes().toString().padStart(2, '0')}`;
    return {
      id: parseInt(s.id),
      pacienteId: s.patient ? parseInt(s.patient.id) : 0,
      fecha,
      hora,
      modalidad: s.sessionType as 'presential' | 'remote',
      estado: s.status.toLowerCase() as 'pendiente' | 'confirmado' | 'completado' | 'cancelled',
      monto: Number(s.cost) || 0,
    };
  });

  const pacientes = patients.map(p => ({
    id: parseInt(p.id),
    nombre: `${p.firstName} ${p.lastName}`,
    telefono: p.phone || '',
    email: p.email || '',
  }));

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

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
  };

  // Get current week turnos (Sunday to Saturday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get start of week (Sunday)
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Get end of week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const turnosEstaSemana = turnos
    .filter((turno) => {
      const turnoDate = new Date(turno.fecha);
      return turnoDate >= startOfWeek && turnoDate <= endOfWeek;
    })
    .sort((a, b) => {
      const dateCompare = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      if (dateCompare === 0) {
        return a.hora.localeCompare(b.hora);
      }
      return dateCompare;
    });

  const handleToggleCobrado = (turnoId: number) => {
    setTurnosCobrados((prev) => ({
      ...prev,
      [turnoId]: !prev[turnoId],
    }));
  };

  const handleOpenReminderModal = (turno: any) => {
    const paciente = getPaciente(turno.pacienteId);
    const defaultMessage = `Hola ${paciente?.nombre}! Te escribo para recordarte que tenés pendiente el pago de la sesión del ${formatFecha(turno.fecha)} a las ${turno.hora}. El monto es de ${formatMonto(turno.monto || 0)}. ¡Gracias!`;
    setReminderMessage(defaultMessage);
    setSelectedTurno(turno);
    setShowReminderModal(true);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(reminderMessage);
    alert('Mensaje copiado al portapapeles');
  };

  const handleSendWhatsApp = () => {
    // Esta funcionalidad se implementará más adelante
    console.log('Enviar por WhatsApp:', reminderMessage);
    alert('Integración con WhatsApp próximamente');
    setShowReminderModal(false);
  };

  const totalCobrado = turnosEstaSemana
    .filter((t) => turnosCobrados[t.id])
    .reduce((sum, t) => sum + (t.monto || 0), 0);

  const totalPendiente = turnosEstaSemana
    .filter((t) => !turnosCobrados[t.id])
    .reduce((sum, t) => sum + (t.monto || 0), 0);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-gray-900 mb-6">Cobros</h1>

      {/* Summary Mini Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-green-800 text-sm">Total cobrado esta semana</p>
              <p className="text-green-900 text-xl">{formatMonto(totalCobrado)}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-yellow-800 text-sm">Total pendiente esta semana</p>
              <p className="text-yellow-900 text-xl">{formatMonto(totalPendiente)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Turnos Table - Desktop */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Turnos de esta semana
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Del {formatFecha(startOfWeek.toISOString())} al {formatFecha(endOfWeek.toISOString())}
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-sm text-gray-500">Cargando turnos...</p>
            </div>
          ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600">Fecha y Hora</th>
                <th className="text-left py-3 px-4 text-gray-600">Paciente</th>
                <th className="text-left py-3 px-4 text-gray-600">Modalidad</th>
                <th className="text-right py-3 px-4 text-gray-600">Monto</th>
                <th className="text-center py-3 px-4 text-gray-600">Estado</th>
                <th className="text-center py-3 px-4 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnosEstaSemana.length > 0 ? (
                turnosEstaSemana.map((turno) => {
                  const paciente = getPaciente(turno.pacienteId);
                  const turnoDate = new Date(turno.fecha);
                  const isPast = turnoDate < today;
                  const isToday = turnoDate.toDateString() === today.toDateString();
                  const isCobrado = turnosCobrados[turno.id];

                  return (
                    <tr
                      key={turno.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        isCobrado ? 'bg-green-50/50' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-gray-900 capitalize">
                            {formatFecha(turno.fecha)}
                          </p>
                          <p className="text-gray-500 text-sm">{turno.hora}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 text-xs">
                              {paciente?.nombre.split(' ').map((n) => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-gray-900">{paciente?.nombre}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {/* @ts-expect-error - using mock data structure */}
                          {turno.modalidad === 'remoto' ? (
                            <>
                              <Video className="w-4 h-4 text-blue-600" />
                              <span className="text-gray-700 text-sm">Remoto</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4 text-purple-600" />
                              <span className="text-gray-700 text-sm">Presencial</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-gray-900">
                          {formatMonto(turno.monto || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isCobrado ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            Cobrado
                          </span>
                        ) : isPast ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
                            <DollarSign className="w-3 h-3" />
                            Vencido
                          </span>
                        ) : isToday ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700">
                            <Clock className="w-3 h-3" />
                            Hoy
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === turno.id ? null : turno.id)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                            title="Más opciones"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openMenuId === turno.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                <div className="py-1">
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    onClick={() => {
                                      handleToggleCobrado(turno.id);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    {isCobrado ? 'Marcar como no cobrado' : 'Marcar como cobrado'}
                                  </button>
                                  {!isCobrado && (
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      onClick={() => {
                                        handleOpenReminderModal(turno);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      <Bell className="w-4 h-4" />
                                      Enviar recordatorio de pago
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No hay turnos programados para esta semana
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden p-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-sm text-gray-500">Cargando turnos...</p>
            </div>
          ) : turnosEstaSemana.length > 0 ? (
            <div className="space-y-3">
              {turnosEstaSemana.map((turno) => {
                const paciente = getPaciente(turno.pacienteId);
                const turnoDate = new Date(turno.fecha);
                const isPast = turnoDate < today;
                const isToday = turnoDate.toDateString() === today.toDateString();
                const isCobrado = turnosCobrados[turno.id];

                return (
                  <div
                    key={turno.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      isCobrado 
                        ? 'bg-green-50 border-green-200' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {/* Header: Fecha y Estado */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {formatFecha(turno.fecha)}
                        </p>
                        <p className="text-xs text-gray-500">{turno.hora}</p>
                      </div>
                      {isCobrado ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Cobrado
                        </span>
                      ) : isPast ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                          <DollarSign className="w-3 h-3" />
                          Vencido
                        </span>
                      ) : isToday ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                          <Clock className="w-3 h-3" />
                          Hoy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                          <Clock className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                    </div>

                    {/* Body: Paciente y Detalles */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 text-sm font-semibold">
                            {paciente?.nombre.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {paciente?.nombre}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {/* @ts-expect-error - using mock data structure */}
                            {turno.modalidad === 'remoto' ? (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Video className="w-3 h-3" />
                                <span>Remoto</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-purple-600">
                                <MapPin className="w-3 h-3" />
                                <span>Presencial</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Monto */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-600">Monto</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatMonto(turno.monto || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                      <button
                        onClick={() => handleToggleCobrado(turno.id)}
                        className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                          isCobrado
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isCobrado ? 'Desmarcar' : 'Marcar cobrado'}
                      </button>
                      {!isCobrado && (
                        <button
                          onClick={() => handleOpenReminderModal(turno)}
                          className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Bell className="w-3 h-3" />
                          Recordatorio
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No hay turnos programados para esta semana
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {!isLoading && turnosEstaSemana.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Total de turnos: {turnosEstaSemana.length}
              </span>
              <div className="flex items-center gap-6">
                <span className="text-green-700">
                  Cobrados: {Object.values(turnosCobrados).filter(Boolean).length}
                </span>
                <span className="text-yellow-700">
                  Pendientes: {turnosEstaSemana.length - Object.values(turnosCobrados).filter(Boolean).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Recordatorio de Pago</h3>
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => setShowReminderModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="text-gray-700 text-sm block mb-2">Mensaje</label>
              <textarea
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                onClick={handleCopyMessage}
              >
                <Copy className="w-4 h-4" />
                <span>Copiar mensaje</span>
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                onClick={handleSendWhatsApp}
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}