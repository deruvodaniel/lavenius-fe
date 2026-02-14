import { useState, useEffect, useCallback } from 'react';
import { Bell, DollarSign, Calendar, X, Plus, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CalendarSync from './CalendarSync';

// ============================================================================
// SETTINGS STORAGE
// ============================================================================

const SETTINGS_KEY = 'lavenius_settings';

interface AppSettings {
  recordatoriosCobros: boolean;
  frecuenciaRecordatorio: string;
  minimoTurnos: number;
  recordatoriosPacientes: boolean;
  horasAnticipacion: number;
  diasOff: { id: number; fecha: string; motivo: string }[];
}

const defaultSettings: AppSettings = {
  recordatoriosCobros: true,
  frecuenciaRecordatorio: 'semanal',
  minimoTurnos: 3,
  recordatoriosPacientes: true,
  horasAnticipacion: 24,
  diasOff: [
    { id: 1, fecha: '2025-12-25', motivo: 'Navidad' },
    { id: 2, fecha: '2026-01-01', motivo: 'Año Nuevo' },
  ],
};

const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return defaultSettings;
};

const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

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
  comingSoon?: boolean;
}

const ConfigSection = ({ icon: Icon, iconColor, iconBg, title, description, children, comingSoon }: ConfigSectionProps) => (
  <Card className={`overflow-hidden relative bg-white ${comingSoon ? 'select-none' : ''}`}>
    {/* Coming Soon Overlay */}
    {comingSoon && (
      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
        <div className="bg-white/90 border border-gray-200 shadow-lg rounded-lg px-4 py-2 transform -rotate-3">
          <span className="text-sm font-bold text-gray-500 tracking-wider uppercase">
            Proximamente
          </span>
        </div>
      </div>
    )}
    <div className="p-4 sm:p-6 border-b border-gray-100">
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
  // Load settings from localStorage on mount
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI state
  const [showAddDiaOff, setShowAddDiaOff] = useState(false);
  const [newDiaOff, setNewDiaOff] = useState({ fecha: '', motivo: '' });

  // Update a setting and mark as changed
  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const handleSave = () => {
    setIsSaving(true);
    try {
      saveSettings(settings);
      setHasChanges(false);
      toast.success('Configuración guardada correctamente');
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDiaOff = () => {
    if (!newDiaOff.fecha) {
      toast.error('Selecciona una fecha');
      return;
    }
    updateSetting('diasOff', [...settings.diasOff, { id: Date.now(), ...newDiaOff }]);
    setNewDiaOff({ fecha: '', motivo: '' });
    setShowAddDiaOff(false);
    toast.success('Día off agregado');
  };

  const handleRemoveDiaOff = (id: number) => {
    updateSetting('diasOff', settings.diasOff.filter(d => d.id !== id));
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

        {/* Días Off - Right after Calendar Sync */}
        <ConfigSection
          icon={Calendar}
          iconColor="text-rose-600"
          iconBg="bg-rose-100"
          title="Días Off"
          description="Configura los días en los que no atenderás"
        >
          <div className="space-y-4">
            {/* Lista de días off */}
            {settings.diasOff.length > 0 ? (
              <div className="space-y-2">
                {settings.diasOff.map(dia => (
                  <div 
                    key={dia.id} 
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg group hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{formatDateDisplay(dia.fecha)}</p>
                        {dia.motivo && (
                          <p className="text-xs text-gray-500 truncate">{dia.motivo}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDiaOff(dia.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay días off configurados</p>
                <p className="text-xs text-gray-400 mt-1">Agrega días para bloquearlos en tu agenda</p>
              </div>
            )}

            {/* Coming soon: Time slots feature */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-xs sm:text-sm text-indigo-700">
                <span className="font-medium">Próximamente:</span> Podrás configurar franjas horarias específicas para cada día (ej: no atender de 12:00 a 14:00).
              </p>
            </div>

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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                    <input
                      type="text"
                      value={newDiaOff.motivo}
                      onChange={(e) => setNewDiaOff({ ...newDiaOff, motivo: e.target.value })}
                      placeholder="Ej: Feriado, Vacaciones..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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
                    <Plus className="w-4 h-4 mr-1" />
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
                <Plus className="w-4 h-4 mr-2 text-rose-600" />
                Agregar Día Off
              </Button>
            )}
          </div>
        </ConfigSection>

        {/* Recordatorios de Cobros */}
        <ConfigSection
          icon={DollarSign}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
          title="Recordatorios de Cobros"
          description="Recibe notificaciones de turnos sin cobrar"
          comingSoon
        >
          <div className="space-y-4">
            <ToggleRow
              checked={settings.recordatoriosCobros}
              onChange={(v) => updateSetting('recordatoriosCobros', v)}
              label="Activar recordatorios de cobros pendientes"
              description="Te notificaremos cuando tengas turnos realizados sin marcar como cobrados"
            />

            {settings.recordatoriosCobros && (
              <div className="pl-4 sm:pl-14 space-y-4 pt-4 border-t border-gray-100">
                {/* Frecuencia */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Frecuencia de recordatorio
                  </label>
                  <select
                    value={settings.frecuenciaRecordatorio}
                    onChange={(e) => updateSetting('frecuenciaRecordatorio', e.target.value)}
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
                      value={settings.minimoTurnos}
                      onChange={(e) => updateSetting('minimoTurnos', Number(e.target.value))}
                      className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                    />
                    <span className="text-sm text-gray-600">
                      {settings.minimoTurnos === 1 ? 'turno sin cobrar' : 'turnos sin cobrar'}
                    </span>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-orange-800">
                    <span className="font-medium">Ejemplo:</span> Tienes {settings.minimoTurnos} {settings.minimoTurnos === 1 ? 'turno' : 'turnos'} de la semana pasada sin marcar como {settings.minimoTurnos === 1 ? 'cobrado' : 'cobrados'}.
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
          comingSoon
        >
          <div className="space-y-4">
            <ToggleRow
              checked={settings.recordatoriosPacientes}
              onChange={(v) => updateSetting('recordatoriosPacientes', v)}
              label="Activar recordatorios para pacientes"
              description="Te avisaremos cuando sea momento de recordar a tus pacientes sus turnos"
            />

            {settings.recordatoriosPacientes && (
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
                      value={settings.horasAnticipacion}
                      onChange={(e) => updateSetting('horasAnticipacion', Number(e.target.value))}
                      className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                    />
                    <span className="text-sm text-gray-600">horas antes del turno</span>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-blue-800">
                    <span className="font-medium">Ejemplo:</span> Recordatorio para paciente con turno en {settings.horasAnticipacion} {settings.horasAnticipacion === 1 ? 'hora' : 'horas'}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ConfigSection>

        {/* Botón Guardar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {hasChanges && (
            <span className="text-sm text-amber-600">Hay cambios sin guardar</span>
          )}
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}
