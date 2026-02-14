import { useState } from 'react';
import { Bell, DollarSign, Calendar, X, Plus, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CalendarSync from './CalendarSync';

// ============================================================================
// SECTION WRAPPER COMPONENT
// ============================================================================

interface ConfigSectionProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

const ConfigSection = ({ icon: Icon, iconColor, iconBg, title, description, children }: ConfigSectionProps) => (
  <Card className="overflow-hidden">
    <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-4 sm:p-6">
      {children}
    </div>
  </Card>
);

// ============================================================================
// TOGGLE ROW COMPONENT
// ============================================================================

interface ToggleRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

const ToggleRow = ({ checked, onChange, label, description }: ToggleRowProps) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <div className="relative mt-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
    </div>
    <div className="flex-1">
      <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{label}</span>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
  </label>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Configuracion() {
  // Recordatorios de cobros
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

  const handleSave = () => {
    toast.success('Configuración guardada correctamente');
  };

  const handleAddDiaOff = () => {
    if (!newDiaOff.fecha) {
      toast.error('Selecciona una fecha');
      return;
    }
    setDiasOff([...diasOff, { id: Date.now(), ...newDiaOff }]);
    setNewDiaOff({ fecha: '', motivo: '' });
    setShowAddDiaOff(false);
    toast.success('Día off agregado');
  };

  const handleRemoveDiaOff = (id: number) => {
    setDiasOff(diasOff.filter(d => d.id !== id));
    toast.success('Día off eliminado');
  };

  const formatDateDisplay = (fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Configuración</h1>
        <p className="text-sm text-gray-500">Personaliza tu experiencia en Lavenius</p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Google Calendar Sync */}
        <CalendarSync />

        {/* Recordatorios de Cobros */}
        <ConfigSection
          icon={DollarSign}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
          title="Recordatorios de Cobros"
          description="Recibe notificaciones de turnos sin cobrar"
        >
          <div className="space-y-4">
            <ToggleRow
              checked={recordatoriosCobros}
              onChange={setRecordatoriosCobros}
              label="Activar recordatorios de cobros pendientes"
              description="Te notificaremos cuando tengas turnos realizados sin marcar como cobrados"
            />

            {recordatoriosCobros && (
              <div className="pl-4 sm:pl-14 space-y-4 pt-4 border-t border-gray-100">
                {/* Frecuencia */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Frecuencia de recordatorio
                  </label>
                  <select
                    value={frecuenciaRecordatorio}
                    onChange={(e) => setFrecuenciaRecordatorio(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="diario">Diariamente</option>
                    <option value="semanal">Semanalmente (lunes)</option>
                    <option value="quincenal">Cada 15 días</option>
                  </select>
                </div>

                {/* Mínimo de turnos */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Recordar cuando haya al menos
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={minimoTurnos}
                      onChange={(e) => setMinimoTurnos(Number(e.target.value))}
                      className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                    />
                    <span className="text-sm text-gray-600">
                      {minimoTurnos === 1 ? 'turno sin cobrar' : 'turnos sin cobrar'}
                    </span>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-orange-800">
                    <span className="font-medium">Ejemplo:</span> Tienes {minimoTurnos} {minimoTurnos === 1 ? 'turno' : 'turnos'} de la semana pasada sin marcar como {minimoTurnos === 1 ? 'cobrado' : 'cobrados'}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ConfigSection>

        {/* Recordatorios para Pacientes */}
        <ConfigSection
          icon={Bell}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          title="Recordatorios para Pacientes"
          description="Notificaciones de turnos próximos"
        >
          <div className="space-y-4">
            <ToggleRow
              checked={recordatoriosPacientes}
              onChange={setRecordatoriosPacientes}
              label="Activar recordatorios para pacientes"
              description="Te avisaremos cuando sea momento de recordar a tus pacientes sus turnos"
            />

            {recordatoriosPacientes && (
              <div className="pl-4 sm:pl-14 space-y-4 pt-4 border-t border-gray-100">
                {/* Horas de anticipación */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Horas de anticipación
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="72"
                      value={horasAnticipacion}
                      onChange={(e) => setHorasAnticipacion(Number(e.target.value))}
                      className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                    />
                    <span className="text-sm text-gray-600">horas antes del turno</span>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-blue-800">
                    <span className="font-medium">Ejemplo:</span> Recordatorio para paciente con turno en {horasAnticipacion} {horasAnticipacion === 1 ? 'hora' : 'horas'}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ConfigSection>

        {/* Días Off */}
        <ConfigSection
          icon={Calendar}
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
          title="Días Off"
          description="Configura los días en los que no atenderás"
        >
          <div className="space-y-4">
            {/* Lista de días off */}
            {diasOff.length > 0 ? (
              <div className="space-y-2">
                {diasOff.map(dia => (
                  <div 
                    key={dia.id} 
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{formatDateDisplay(dia.fecha)}</p>
                        {dia.motivo && <p className="text-xs text-gray-500 truncate">{dia.motivo}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDiaOff(dia.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay días off configurados</p>
            )}

            {/* Formulario para agregar */}
            {showAddDiaOff ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={newDiaOff.fecha}
                      onChange={(e) => setNewDiaOff({ ...newDiaOff, fecha: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                    <input
                      type="text"
                      value={newDiaOff.motivo}
                      onChange={(e) => setNewDiaOff({ ...newDiaOff, motivo: e.target.value })}
                      placeholder="Ej: Feriado, Vacaciones..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddDiaOff(false);
                      setNewDiaOff({ fecha: '', motivo: '' });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddDiaOff}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDiaOff(true)}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Día Off
              </Button>
            )}
          </div>
        </ConfigSection>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button 
            onClick={handleSave} 
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
