import { useState } from 'react';
import { Bell, DollarSign, Calendar, Clock, X, Plus } from 'lucide-react';

export function Configuracion() {
  const [recordatoriosCobros, setRecordatoriosCobros] = useState(true);
  const [frecuenciaRecordatorio, setFrecuenciaRecordatorio] = useState('semanal');
  const [minimoTurnos, setMinimoTurnos] = useState(3);
  
  // Recordatorios para pacientes
  const [recordatoriosPacientes, setRecordatoriosPacientes] = useState(true);
  const [horasAnticipacion, setHorasAnticipacion] = useState(24);
  
  // Días/horarios off
  const [diasOff, setDiasOff] = useState<{ id: number; fecha: string; motivo: string }[]>([
    { id: 1, fecha: '2025-12-25', motivo: 'Navidad' },
    { id: 2, fecha: '2026-01-01', motivo: 'Año Nuevo' },
  ]);
  const [showAddDiaOff, setShowAddDiaOff] = useState(false);
  const [newDiaOff, setNewDiaOff] = useState({ fecha: '', motivo: '' });

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-gray-900 mb-6">Configuración</h1>

      <div className="space-y-6">
        {/* Recordatorios de Cobros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Recordatorios de Cobros
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-2">Notificaciones de turnos sin cobrar</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Recibe recordatorios cuando tengas turnos realizados que aún no has marcado como cobrados
                </p>

                <div className="space-y-4">
                  {/* Toggle principal */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordatoriosCobros}
                      onChange={(e) => setRecordatoriosCobros(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-gray-700">Activar recordatorios de cobros pendientes</span>
                  </label>

                  {/* Opciones adicionales cuando está activo */}
                  {recordatoriosCobros && (
                    <div className="ml-8 space-y-4 pt-4 border-t border-gray-200">
                      {/* Frecuencia */}
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm">
                          Frecuencia de recordatorio
                        </label>
                        <select
                          value={frecuenciaRecordatorio}
                          onChange={(e) => setFrecuenciaRecordatorio(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="diario">Diariamente</option>
                          <option value="semanal">Semanalmente (lunes)</option>
                          <option value="quincenal">Cada 15 días</option>
                        </select>
                      </div>

                      {/* Mínimo de turnos */}
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm">
                          Recordar cuando haya al menos
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={minimoTurnos}
                            onChange={(e) => setMinimoTurnos(Number(e.target.value))}
                            className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-gray-700 text-sm">
                            {minimoTurnos === 1 ? 'turno sin cobrar' : 'turnos sin cobrar'}
                          </span>
                        </div>
                      </div>

                      {/* Preview/Example */}
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-orange-800 text-sm">
                          <strong>Ejemplo de notificación:</strong> Tienes {minimoTurnos} {minimoTurnos === 1 ? 'turno' : 'turnos'} de la semana pasada sin marcar como {minimoTurnos === 1 ? 'cobrado' : 'cobrados'}. Revisa la sección de Cobros.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recordatorios para pacientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Recordatorios para pacientes
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-2">Notificaciones de turnos próximos</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Recibe recordatorios cuando tengas turnos próximos para que los pacientes no se olviden
                </p>

                <div className="space-y-4">
                  {/* Toggle principal */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordatoriosPacientes}
                      onChange={(e) => setRecordatoriosPacientes(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-gray-700">Activar recordatorios para pacientes</span>
                  </label>

                  {/* Opciones adicionales cuando está activo */}
                  {recordatoriosPacientes && (
                    <div className="ml-8 space-y-4 pt-4 border-t border-gray-200">
                      {/* Horas de anticipación */}
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm">
                          Horas de anticipación
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={horasAnticipacion}
                            onChange={(e) => setHorasAnticipacion(Number(e.target.value))}
                            className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-gray-700 text-sm">
                            horas antes del turno
                          </span>
                        </div>
                      </div>

                      {/* Preview/Example */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                          <strong>Ejemplo de notificación:</strong> Tu turno con Dr. Smith está programado para {horasAnticipacion} {horasAnticipacion === 1 ? 'hora' : 'horas'} desde ahora. Por favor, acuérdate de llegar a tiempo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Días/Horarios Off */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Días/Horarios Off
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-2">Días/Horarios Off</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Configura los días y horarios en los que no estarás disponible
                </p>

                <div className="space-y-4">
                  {/* Lista de días off */}
                  <div className="space-y-2">
                    {diasOff.map(dia => (
                      <div key={dia.id} className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700">{dia.fecha}</span>
                        <span className="text-gray-500">({dia.motivo})</span>
                        <button
                          className="ml-auto px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          onClick={() => setDiasOff(diasOff.filter(d => d.id !== dia.id))}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Formulario para agregar nuevo día off */}
                  {showAddDiaOff && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <input
                          type="date"
                          value={newDiaOff.fecha}
                          onChange={(e) => setNewDiaOff({ ...newDiaOff, fecha: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <input
                          type="text"
                          value={newDiaOff.motivo}
                          onChange={(e) => setNewDiaOff({ ...newDiaOff, motivo: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Motivo"
                        />
                      </div>
                      <button
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        onClick={() => {
                          setDiasOff([...diasOff, { id: diasOff.length + 1, ...newDiaOff }]);
                          setNewDiaOff({ fecha: '', motivo: '' });
                          setShowAddDiaOff(false);
                        }}
                      >
                        Agregar
                      </button>
                    </div>
                  )}

                  {/* Botón para agregar nuevo día off */}
                  {!showAddDiaOff && (
                    <button
                      className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      onClick={() => setShowAddDiaOff(true)}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Día Off</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end">
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}