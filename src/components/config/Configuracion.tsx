import { useState, useEffect, useCallback } from 'react';
import { Bell, DollarSign, Calendar, X, Plus, Save, Clock, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CalendarSync from './CalendarSync';

// ============================================================================
// SETTINGS STORAGE
// ============================================================================

const SETTINGS_KEY = 'lavenius_settings';

// Days of the week (0 = Sunday, 1 = Monday, etc.)
const WEEKDAYS = [
  { id: 1, name: 'Lunes', short: 'L' },
  { id: 2, name: 'Martes', short: 'M' },
  { id: 3, name: 'Miércoles', short: 'X' },
  { id: 4, name: 'Jueves', short: 'J' },
  { id: 5, name: 'Viernes', short: 'V' },
  { id: 6, name: 'Sábado', short: 'S' },
  { id: 0, name: 'Domingo', short: 'D' },
];

// Día Off types
type DiaOffTipo = 'full' | 'morning' | 'afternoon' | 'custom';

const DIA_OFF_TIPOS: { value: DiaOffTipo; label: string; description: string }[] = [
  { value: 'full', label: 'Todo el día', description: 'Sin atención' },
  { value: 'morning', label: 'Mañana', description: '00:00 - 12:00' },
  { value: 'afternoon', label: 'Tarde', description: '12:00 - 23:59' },
  { value: 'custom', label: 'Rango horario', description: 'Personalizado' },
];

interface DiaOff {
  id: number;
  fecha: string;
  motivo: string;
  tipo: DiaOffTipo;
  startTime?: string; // Solo para tipo 'custom'
  endTime?: string;   // Solo para tipo 'custom'
}

interface WorkingHours {
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  workingDays: number[]; // [1, 2, 3, 4, 5] = Mon-Fri
}

interface WhatsAppTemplates {
  turnoReminder: string;
  paymentReminder: string;
}

interface AppSettings {
  recordatoriosCobros: boolean;
  frecuenciaRecordatorio: string;
  minimoTurnos: number;
  recordatoriosPacientes: boolean;
  horasAnticipacion: number;
  diasOff: DiaOff[];
  workingHours: WorkingHours;
  whatsappTemplates: WhatsAppTemplates;
}

// Default WhatsApp templates with placeholders
const DEFAULT_TURNO_TEMPLATE = 'Hola {nombre}! Te recuerdo que tenes un turno agendado para el *{fecha}* a las *{hora}*. Podes confirmar tu asistencia? Responde *Si* para confirmar o *No* si necesitas cancelar. Gracias!';
const DEFAULT_PAYMENT_TEMPLATE = 'Hola {nombre}! Te escribo para recordarte que tenes un pago pendiente del *{fecha}* por *{monto}*. Podes abonar por transferencia o en efectivo en tu proxima sesion. Gracias!';

const defaultSettings: AppSettings = {
  recordatoriosCobros: true,
  frecuenciaRecordatorio: 'semanal',
  minimoTurnos: 3,
  recordatoriosPacientes: true,
  horasAnticipacion: 24,
  diasOff: [
    { id: 1, fecha: '2025-12-25', motivo: 'Navidad', tipo: 'full' },
    { id: 2, fecha: '2026-01-01', motivo: 'Año Nuevo', tipo: 'full' },
  ],
  workingHours: {
    startTime: '09:00',
    endTime: '18:00',
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  },
  whatsappTemplates: {
    turnoReminder: DEFAULT_TURNO_TEMPLATE,
    paymentReminder: DEFAULT_PAYMENT_TEMPLATE,
  },
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
// COMING SOON WRAPPER (for partial overlay within a section)
// ============================================================================

interface ComingSoonWrapperProps {
  children: React.ReactNode;
}

const ComingSoonWrapper = ({ children }: ComingSoonWrapperProps) => (
  <div className="relative select-none">
    <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
      <div className="bg-white/90 border border-gray-200 shadow-lg rounded-lg px-3 py-1.5 transform -rotate-2">
        <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">
          Proximamente
        </span>
      </div>
    </div>
    {children}
  </div>
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
  const [newDiaOff, setNewDiaOff] = useState<Omit<DiaOff, 'id'>>({ 
    fecha: '', 
    motivo: '', 
    tipo: 'full',
    startTime: '12:00',
    endTime: '18:00',
  });

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
    if (newDiaOff.tipo === 'custom') {
      if (!newDiaOff.startTime || !newDiaOff.endTime) {
        toast.error('Selecciona el rango horario');
        return;
      }
      if (newDiaOff.startTime >= newDiaOff.endTime) {
        toast.error('La hora de inicio debe ser menor a la hora de fin');
        return;
      }
    }
    
    const diaOffToAdd: DiaOff = {
      id: Date.now(),
      fecha: newDiaOff.fecha,
      motivo: newDiaOff.motivo,
      tipo: newDiaOff.tipo,
      ...(newDiaOff.tipo === 'custom' && {
        startTime: newDiaOff.startTime,
        endTime: newDiaOff.endTime,
      }),
    };
    
    updateSetting('diasOff', [...settings.diasOff, diaOffToAdd]);
    setNewDiaOff({ fecha: '', motivo: '', tipo: 'full', startTime: '12:00', endTime: '18:00' });
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

  const formatDiaOffTime = (dia: DiaOff): string => {
    switch (dia.tipo) {
      case 'full':
        return 'Todo el día';
      case 'morning':
        return 'Mañana (00:00 - 12:00)';
      case 'afternoon':
        return 'Tarde (12:00 - 23:59)';
      case 'custom':
        return `${dia.startTime} - ${dia.endTime}`;
      default:
        return 'Todo el día';
    }
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-rose-600 font-medium">{formatDiaOffTime(dia)}</span>
                          {dia.motivo && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-gray-500 truncate">{dia.motivo}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDiaOff(dia.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar"
                      aria-label="Eliminar día off"
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

            {/* Formulario para agregar */}
            {showAddDiaOff ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                {/* Fecha y Motivo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="diaoff-fecha" className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                    <input
                      id="diaoff-fecha"
                      type="date"
                      value={newDiaOff.fecha}
                      onChange={(e) => setNewDiaOff({ ...newDiaOff, fecha: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="diaoff-motivo" className="block text-xs font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                    <input
                      id="diaoff-motivo"
                      type="text"
                      value={newDiaOff.motivo}
                      onChange={(e) => setNewDiaOff({ ...newDiaOff, motivo: e.target.value })}
                      placeholder="Ej: Feriado, Vacaciones..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>

                {/* Tipo de día off */}
                <fieldset>
                  <legend className="block text-xs font-medium text-gray-700 mb-2">Tipo de bloqueo</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Tipo de bloqueo">
                    {DIA_OFF_TIPOS.map((tipo) => (
                      <button
                        key={tipo.value}
                        type="button"
                        onClick={() => setNewDiaOff({ ...newDiaOff, tipo: tipo.value })}
                        className={`
                          p-2 rounded-lg border text-left transition-all
                          ${newDiaOff.tipo === tipo.value
                            ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                          }
                        `}
                      >
                        <p className={`text-sm font-medium ${newDiaOff.tipo === tipo.value ? 'text-rose-700' : 'text-gray-900'}`}>
                          {tipo.label}
                        </p>
                        <p className="text-xs text-gray-500">{tipo.description}</p>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Rango horario personalizado */}
                {newDiaOff.tipo === 'custom' && (
                  <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <label htmlFor="diaoff-start-time" className="text-sm text-gray-500">Desde</label>
                      <input
                        id="diaoff-start-time"
                        type="time"
                        value={newDiaOff.startTime}
                        onChange={(e) => setNewDiaOff({ ...newDiaOff, startTime: e.target.value })}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="diaoff-end-time" className="text-sm text-gray-500">hasta</label>
                      <input
                        id="diaoff-end-time"
                        type="time"
                        value={newDiaOff.endTime}
                        onChange={(e) => setNewDiaOff({ ...newDiaOff, endTime: e.target.value })}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 justify-end pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddDiaOff(false);
                      setNewDiaOff({ fecha: '', motivo: '', tipo: 'full', startTime: '12:00', endTime: '18:00' });
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

        {/* Horario Laboral */}
        <ConfigSection
          icon={Clock}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-100"
          title="Horario Laboral"
          description="Define tu horario de atención y días de trabajo"
        >
          <div className="space-y-6">
            {/* Horario de atención */}
            <fieldset className="space-y-3">
              <legend className="block text-sm font-medium text-gray-700">
                Horario de atención
              </legend>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="working-hours-start" className="text-sm text-gray-500">Desde</label>
                  <input
                    id="working-hours-start"
                    type="time"
                    value={settings.workingHours.startTime}
                    onChange={(e) => updateSetting('workingHours', {
                      ...settings.workingHours,
                      startTime: e.target.value,
                    })}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="working-hours-end" className="text-sm text-gray-500">hasta</label>
                  <input
                    id="working-hours-end"
                    type="time"
                    value={settings.workingHours.endTime}
                    onChange={(e) => updateSetting('workingHours', {
                      ...settings.workingHours,
                      endTime: e.target.value,
                    })}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
            </fieldset>

            {/* Días de trabajo */}
            <fieldset className="space-y-3">
              <legend className="block text-sm font-medium text-gray-700">
                Días de trabajo
              </legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Seleccionar días de trabajo">
                {WEEKDAYS.map((day) => {
                  const isSelected = settings.workingHours.workingDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => {
                        const newDays = isSelected
                          ? settings.workingHours.workingDays.filter(d => d !== day.id)
                          : [...settings.workingHours.workingDays, day.id];
                        updateSetting('workingHours', {
                          ...settings.workingHours,
                          workingDays: newDays,
                        });
                      }}
                      className={`
                        w-10 h-10 rounded-full text-sm font-medium transition-all
                        ${isSelected 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }
                      `}
                      title={day.name}
                      aria-label={day.name}
                      aria-pressed={isSelected}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                Los días no seleccionados aparecerán bloqueados en tu calendario
              </p>
            </fieldset>

            {/* Preview */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-xs sm:text-sm text-indigo-800">
                <span className="font-medium">Tu horario:</span>{' '}
                {settings.workingHours.workingDays.length > 0 ? (
                  <>
                    {WEEKDAYS.filter(d => settings.workingHours.workingDays.includes(d.id))
                      .map(d => d.name)
                      .join(', ')}{' '}
                    de {settings.workingHours.startTime} a {settings.workingHours.endTime}
                  </>
                ) : (
                  'No hay días de trabajo seleccionados'
                )}
              </p>
            </div>
          </div>
        </ConfigSection>

        {/* Recordatorios de Cobros */}
        <ConfigSection
          icon={DollarSign}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
          title="Recordatorios de Cobros"
          description="Configura notificaciones y mensajes para cobros pendientes"
        >
          <div className="space-y-6">
            {/* Automatización - Coming Soon */}
            <ComingSoonWrapper>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Automatización de recordatorios</h3>
                <ToggleRow
                  checked={settings.recordatoriosCobros}
                  onChange={(v) => updateSetting('recordatoriosCobros', v)}
                  label="Activar recordatorios automáticos de cobros pendientes"
                  description="Te notificaremos cuando tengas turnos realizados sin marcar como cobrados"
                />

                {settings.recordatoriosCobros && (
                  <div className="pl-4 sm:pl-14 space-y-4 pt-4 border-t border-gray-200">
                    {/* Frecuencia */}
                    <div className="space-y-2">
                      <label htmlFor="frecuencia-recordatorio" className="block text-sm font-medium text-gray-700">
                        Frecuencia de recordatorio
                      </label>
                      <select
                        id="frecuencia-recordatorio"
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
                      <label htmlFor="minimo-turnos" className="block text-sm font-medium text-gray-700">
                        Recordar cuando haya al menos
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="minimo-turnos"
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
            </ComingSoonWrapper>

            {/* Payment Reminder Template - ENABLED */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <label htmlFor="whatsapp-payment-template" className="block text-sm font-medium text-gray-700">
                  Mensaje de WhatsApp para recordatorio de pago
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Este mensaje se usará cuando envíes recordatorios de pago a tus pacientes.
                Variables disponibles: <code className="bg-gray-100 px-1 rounded">{'{nombre}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{fecha}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{monto}'}</code>
              </p>
              <textarea
                id="whatsapp-payment-template"
                value={settings.whatsappTemplates.paymentReminder}
                onChange={(e) => updateSetting('whatsappTemplates', {
                  ...settings.whatsappTemplates,
                  paymentReminder: e.target.value
                })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Escribe tu mensaje de recordatorio de pago..."
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => updateSetting('whatsappTemplates', {
                    ...settings.whatsappTemplates,
                    paymentReminder: DEFAULT_PAYMENT_TEMPLATE
                  })}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Restaurar mensaje por defecto
                </button>
              </div>
            </div>
          </div>
        </ConfigSection>

        {/* Recordatorios de Turnos */}
        <ConfigSection
          icon={Bell}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          title="Recordatorios de Turnos"
          description="Configura notificaciones y mensajes para turnos de pacientes"
        >
          <div className="space-y-6">
            {/* Automatización - Coming Soon */}
            <ComingSoonWrapper>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Automatización de recordatorios</h3>
                <ToggleRow
                  checked={settings.recordatoriosPacientes}
                  onChange={(v) => updateSetting('recordatoriosPacientes', v)}
                  label="Activar recordatorios automáticos para pacientes"
                  description="Te avisaremos cuando sea momento de recordar a tus pacientes sus turnos"
                />

                {settings.recordatoriosPacientes && (
                  <div className="pl-4 sm:pl-14 space-y-4 pt-4 border-t border-gray-200">
                    {/* Horas de anticipación */}
                    <div className="space-y-2">
                      <label htmlFor="horas-anticipacion" className="block text-sm font-medium text-gray-700">
                        Horas de anticipación
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="horas-anticipacion"
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
            </ComingSoonWrapper>

            {/* Turno Reminder Template - ENABLED */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <label htmlFor="whatsapp-turno-template" className="block text-sm font-medium text-gray-700">
                  Mensaje de WhatsApp para recordatorio de turno
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Este mensaje se usará cuando envíes recordatorios de turno a tus pacientes.
                Variables disponibles: <code className="bg-gray-100 px-1 rounded">{'{nombre}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{fecha}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{hora}'}</code>
              </p>
              <textarea
                id="whatsapp-turno-template"
                value={settings.whatsappTemplates.turnoReminder}
                onChange={(e) => updateSetting('whatsappTemplates', {
                  ...settings.whatsappTemplates,
                  turnoReminder: e.target.value
                })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Escribe tu mensaje de recordatorio de turno..."
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => updateSetting('whatsappTemplates', {
                    ...settings.whatsappTemplates,
                    turnoReminder: DEFAULT_TURNO_TEMPLATE
                  })}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Restaurar mensaje por defecto
                </button>
              </div>
            </div>
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
