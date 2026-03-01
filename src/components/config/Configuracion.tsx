import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, DollarSign, Calendar, X, Plus, Save, Clock, Globe, Loader2, Sun } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import CalendarSync from './CalendarSync';
import { useSearchParams } from 'react-router-dom';
import { LanguageSwitcher, ThemeToggle } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Perfil, type PerfilHandle } from '@/components/perfil/Perfil';
import { User } from 'lucide-react';
import { useSettingStore, settingSelectors } from '@/lib/stores/setting.store';
import { type DayOffConfig, type DayOffSetting } from '@/lib/types/setting.types';
import { cn } from '@/components/ui/utils';
import { apiClient } from '@/lib/api/client';

// ============================================================================
// NAVIGATION SECTIONS
// ============================================================================

type SectionId = 'profile' | 'preferences' | 'calendar';

interface NavigationSection {
  id: SectionId;
  labelKey: string;
  icon: React.ElementType;
}

const NAVIGATION_SECTIONS: NavigationSection[] = [
  { id: 'profile', labelKey: 'settings.sections.profile', icon: User },
  { id: 'preferences', labelKey: 'settings.sections.preferences', icon: Globe },
  { id: 'calendar', labelKey: 'settings.sections.calendar', icon: Calendar },
];

// ============================================================================
// SETTINGS STORAGE (localStorage for non-API settings)
// ============================================================================

const SETTINGS_KEY = 'lavenius_settings';

// Days of the week (0 = Sunday, 1 = Monday, etc.)
// Translations are handled via t() function
const WEEKDAY_KEYS = [
  { id: 1, nameKey: 'settings.weekdays.monday', shortKey: 'settings.weekdays.mon' },
  { id: 2, nameKey: 'settings.weekdays.tuesday', shortKey: 'settings.weekdays.tue' },
  { id: 3, nameKey: 'settings.weekdays.wednesday', shortKey: 'settings.weekdays.wed' },
  { id: 4, nameKey: 'settings.weekdays.thursday', shortKey: 'settings.weekdays.thu' },
  { id: 5, nameKey: 'settings.weekdays.friday', shortKey: 'settings.weekdays.fri' },
  { id: 6, nameKey: 'settings.weekdays.saturday', shortKey: 'settings.weekdays.sat' },
  { id: 0, nameKey: 'settings.weekdays.sunday', shortKey: 'settings.weekdays.sun' },
];

// Día Off types (UI representation)
type DiaOffTipo = 'full' | 'morning' | 'afternoon' | 'custom';

const DIA_OFF_TIPO_KEYS: { value: DiaOffTipo; labelKey: string; descriptionKey: string }[] = [
  { value: 'full', labelKey: 'settings.daysOff.fullDay', descriptionKey: 'settings.daysOff.noService' },
  { value: 'morning', labelKey: 'settings.daysOff.morning', descriptionKey: '00:00 - 12:00' },
  { value: 'afternoon', labelKey: 'settings.daysOff.afternoon', descriptionKey: '12:00 - 23:59' },
  { value: 'custom', labelKey: 'settings.daysOff.customRange', descriptionKey: 'settings.daysOff.custom' },
];

// UI representation of a day off (for form state)
interface DiaOffUI {
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  tipo: DiaOffTipo;
  startTime?: string; // Only for 'custom' type
  endTime?: string;   // Only for 'custom' type
}

interface WorkingHours {
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  workingDays: number[]; // [1, 2, 3, 4, 5] = Mon-Fri
}

// LocalStorage settings (non-API settings)
// Note: Reminder settings and WhatsApp templates are managed by the backend
interface LocalSettings {
  workingHours: WorkingHours;
  defaultSessionDuration: number; // minutes: 30, 45, 60, 90, 120
}

const defaultLocalSettings: LocalSettings = {
  workingHours: {
    startTime: '09:00',
    endTime: '18:00',
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  },
  defaultSessionDuration: 60,
};

const loadLocalSettings = (): LocalSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultLocalSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return defaultLocalSettings;
};

const saveLocalSettings = (settings: LocalSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

// ============================================================================
// MAPPING FUNCTIONS: UI <-> API
// ============================================================================

/**
 * Build a description for the day off based on type and time range
 */
function buildDayOffDescription(diaOff: DiaOffUI): string {
  const parts: string[] = [];
  
  if (diaOff.motivo) {
    parts.push(diaOff.motivo);
  }
  
  switch (diaOff.tipo) {
    case 'morning':
      parts.push('Morning (00:00 - 12:00)');
      break;
    case 'afternoon':
      parts.push('Afternoon (12:00 - 23:59)');
      break;
    case 'custom':
      if (diaOff.startTime && diaOff.endTime) {
        parts.push(`${diaOff.startTime} - ${diaOff.endTime}`);
      }
      break;
    // 'full' doesn't need additional description
  }
  
  return parts.join(' - ');
}

/**
 * Convert UI day off to API format (DayOffConfig)
 * BE uses fromDate/toDate, UI uses fechaInicio/fechaFin with tipo
 */
function uiToApiDayOff(diaOff: DiaOffUI): { config: DayOffConfig; description: string } {
  // Map UI dates to API format
  const config: DayOffConfig = {
    fromDate: diaOff.fechaInicio,
    toDate: diaOff.fechaFin,
  };
  
  const description = buildDayOffDescription(diaOff);
  
  return { config, description };
}

/**
 * Parse description to extract type and time range
 */
function parseDescriptionForType(description?: string): { tipo: DiaOffTipo; motivo: string; startTime?: string; endTime?: string } {
  if (!description) {
    return { tipo: 'full', motivo: '' };
  }
  
  // Check for morning pattern
  if (description.includes('Morning (00:00 - 12:00)')) {
    const motivo = description.replace(' - Morning (00:00 - 12:00)', '').replace('Morning (00:00 - 12:00)', '').trim();
    return { tipo: 'morning', motivo };
  }
  
  // Check for afternoon pattern
  if (description.includes('Afternoon (12:00 - 23:59)')) {
    const motivo = description.replace(' - Afternoon (12:00 - 23:59)', '').replace('Afternoon (12:00 - 23:59)', '').trim();
    return { tipo: 'afternoon', motivo };
  }
  
  // Check for custom time range pattern (HH:MM - HH:MM)
  const timeRangeMatch = description.match(/(\d{2}:\d{2}) - (\d{2}:\d{2})$/);
  if (timeRangeMatch) {
    const motivo = description.replace(` - ${timeRangeMatch[0]}`, '').replace(timeRangeMatch[0], '').trim();
    return { 
      tipo: 'custom', 
      motivo, 
      startTime: timeRangeMatch[1], 
      endTime: timeRangeMatch[2] 
    };
  }
  
  // Default: full day with description as motivo
  return { tipo: 'full', motivo: description };
}

/**
 * Convert API day off (DayOffSetting) to UI display format
 */
function apiToUiDayOff(setting: DayOffSetting): { id: string; fechaInicio: string; fechaFin: string; motivo: string; tipo: DiaOffTipo; startTime?: string; endTime?: string } {
  const { tipo, motivo, startTime, endTime } = parseDescriptionForType(setting.description);
  
  return {
    id: setting.id,
    fechaInicio: setting.config.fromDate,
    fechaFin: setting.config.toDate,
    motivo,
    tipo,
    startTime,
    endTime,
  };
}

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
  comingSoonText?: string;
}

const ConfigSection = ({ icon: Icon, iconColor, iconBg, title, description, children, comingSoon, comingSoonText = 'Coming soon' }: ConfigSectionProps) => (
  <Card className={`relative bg-card ${comingSoon ? 'select-none' : ''}`}>
    {/* Coming Soon Overlay */}
    {comingSoon && (
      <div className="absolute inset-0 bg-muted/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
        <div className="bg-card/90 border border-border shadow-lg rounded-lg px-4 py-2 transform -rotate-3">
          <span className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
            {comingSoonText}
          </span>
        </div>
      </div>
    )}
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  </Card>
);

// ============================================================================
// COMING SOON WRAPPER (for partial overlay within a section)
// ============================================================================

interface ComingSoonWrapperProps {
  children: React.ReactNode;
  text?: string;
}

const _ComingSoonWrapper = ({ children, text = 'Coming soon' }: ComingSoonWrapperProps) => (
  <div className="relative select-none">
    <div className="absolute inset-0 bg-muted/80 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
      <div className="bg-card/90 border border-border shadow-lg rounded-lg px-3 py-1.5 transform -rotate-2">
        <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
          {text}
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
  <div className="flex items-start gap-3">
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      className="switch-lg mt-0.5 flex-shrink-0"
    />
    <div className="flex-1 cursor-pointer" onClick={() => onChange(!checked)}>
      <span className="text-sm font-medium text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{label}</span>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Configuracion() {
  const { t, i18n } = useTranslation();
  
  // Navigation state - read initial tab from URL query params
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const tab = searchParams.get('tab') as SectionId | null;
    if (tab && NAVIGATION_SECTIONS.some(s => s.id === tab)) return tab;
    return 'profile';
  });
  
  // Profile ref for save delegation + state tracking
  const perfilRef = useRef<PerfilHandle>(null);
  const [profileHasChanges, setProfileHasChanges] = useState(false);
  const [profileIsSaving, setProfileIsSaving] = useState(false);

  const handleProfileStateChange = useCallback((state: { hasChanges: boolean; isSaving: boolean }) => {
    setProfileHasChanges(state.hasChanges);
    setProfileIsSaving(state.isSaving);
  }, []);

  // Load localStorage settings on mount (for working hours, templates, etc.)
  const [localSettings, setLocalSettings] = useState<LocalSettings>(loadLocalSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Day off API state from store
  const { 
    settings: allSettings,
    fetchStatus,
    createDayOff,
    deleteSetting,
    upsertNextSessionReminder,
    upsertDuePaymentReminder,
  } = useSettingStore();
  
  // Get settings from the store using selectors
  const dayOffSettings = settingSelectors.getDayOffSettings({ settings: allSettings, fetchStatus, error: null, lastFetchTime: null });
  const paymentReminderSetting = settingSelectors.getDuePaymentReminderSetting({ settings: allSettings, fetchStatus, error: null, lastFetchTime: null });
  const sessionReminderSetting = settingSelectors.getNextSessionReminderSetting({ settings: allSettings, fetchStatus, error: null, lastFetchTime: null });
  const isLoadingSettings = fetchStatus === 'loading';
  
  // Reminder state from backend settings (with local UI state for editing)
  // Note: Message templates are managed by backend (Meta API approved templates)
  const [paymentReminderEnabled, setPaymentReminderEnabled] = useState(false);
  const [paymentReminderFrequency, setPaymentReminderFrequency] = useState<'daily' | 'weekly' | 'biweekly'>('weekly');
  const [paymentReminderLimit, setPaymentReminderLimit] = useState(3);
  
  const [sessionReminderEnabled, setSessionReminderEnabled] = useState(false);
  const [sessionReminderHours, setSessionReminderHours] = useState(24);
  
  // Track saving state for reminders
  const [isSavingReminders, setIsSavingReminders] = useState(false);
  const [hasReminderChanges, setHasReminderChanges] = useState(false);
  
  // Convert API day off settings to UI format
  const diasOffFromApi = dayOffSettings.map(apiToUiDayOff);
  
  // Track which day off is being deleted
  const [deletingDayOffId, setDeletingDayOffId] = useState<string | null>(null);
  // Track if we're adding a day off
  const [isAddingDayOff, setIsAddingDayOff] = useState(false);
  
  // UI state
  const [showAddDiaOff, setShowAddDiaOff] = useState(false);
  const [newDiaOff, setNewDiaOff] = useState<DiaOffUI>({ 
    fechaInicio: '', 
    fechaFin: '',
    motivo: '', 
    tipo: 'full',
    startTime: '12:00',
    endTime: '18:00',
  });
  
  // Fetch settings on mount
  useEffect(() => {
    let cancelled = false;
    const maxAttempts = 30; // ~9s
    let attempts = 0;

    const tryFetchSettings = () => {
      if (cancelled) return;

      if (!apiClient.hasUserKey()) {
        attempts += 1;
        if (attempts < maxAttempts) {
          setTimeout(tryFetchSettings, 300);
        } else {
          console.warn('[Configuracion] Skipping /settings fetch: userKey not initialized');
        }
        return;
      }

      useSettingStore.getState().fetchSettings().catch((error) => {
        console.error('Failed to fetch settings:', error);
        // Don't show toast on initial load failure - graceful degradation
      });
    };

    tryFetchSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync reminder state from backend settings when they load
  useEffect(() => {
    if (paymentReminderSetting) {
      setPaymentReminderEnabled(paymentReminderSetting.active);
      setPaymentReminderFrequency(paymentReminderSetting.config.frequency as 'daily' | 'weekly' | 'biweekly');
      setPaymentReminderLimit(paymentReminderSetting.config.remindDuePaymentLimit);
    }
  }, [paymentReminderSetting]);

  useEffect(() => {
    if (sessionReminderSetting) {
      setSessionReminderEnabled(sessionReminderSetting.active);
      setSessionReminderHours(sessionReminderSetting.config.hoursBeforeSession);
    }
  }, [sessionReminderSetting]);

  // Update a local setting and mark as changed
  const updateLocalSetting = useCallback(<K extends keyof LocalSettings>(key: K, value: LocalSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges || hasReminderChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, hasReminderChanges]);

  const handleSave = async () => {
    // When on profile tab, delegate save to Perfil component
    if (activeSection === 'profile' && perfilRef.current) {
      await perfilRef.current.save();
      return;
    }
    // When on preferences tab, save local settings + reminders
    if (activeSection === 'preferences') {
      setIsSaving(true);
      try {
        // Save local settings (language, session duration)
        if (hasChanges) {
          saveLocalSettings(localSettings);
          setHasChanges(false);
        }
        // Save reminder settings to backend
        if (hasReminderChanges) {
          await handleSaveReminders();
        }
        toast.success(t('settings.messages.saved'));
      } catch {
        toast.error(t('settings.messages.saveError'));
      } finally {
        setIsSaving(false);
      }
      return;
    }
    // Calendar tab — save local settings (working hours, days)
    setIsSaving(true);
    try {
      saveLocalSettings(localSettings);
      setHasChanges(false);
      toast.success(t('settings.messages.saved'));
    } catch {
      toast.error(t('settings.messages.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle saving reminder settings to backend
  // Note: Message templates are managed by backend (Meta API approved templates)
  const handleSaveReminders = async () => {
    setIsSavingReminders(true);
    try {
      // Save both reminder settings in parallel
      await Promise.all([
        upsertDuePaymentReminder(
          {
            frequency: paymentReminderFrequency,
            remindDuePaymentLimit: paymentReminderLimit,
            message: 'Recordatorio: tienes pagos pendientes por registrar.',
          },
          paymentReminderEnabled
        ),
        upsertNextSessionReminder(
          {
            hoursBeforeSession: sessionReminderHours,
            message: 'Recordatorio: tienes una sesión agendada próximamente.',
          },
          sessionReminderEnabled
        ),
      ]);
      
      setHasReminderChanges(false);
      toast.success(t('settings.messages.saved'));
    } catch (error) {
      console.error('Failed to save reminder settings:', error);
      toast.error(t('settings.messages.saveError'));
    } finally {
      setIsSavingReminders(false);
    }
  };

  // Helper to mark reminder changes
  const markReminderChanged = useCallback(() => {
    setHasReminderChanges(true);
  }, []);

  const handleAddDiaOff = async () => {
    if (!newDiaOff.fechaInicio || !newDiaOff.fechaFin) {
      toast.error(t('settings.messages.selectDate'));
      return;
    }
    if (newDiaOff.fechaFin < newDiaOff.fechaInicio) {
      toast.error(t('settings.messages.endDateBeforeStart'));
      return;
    }
    if (newDiaOff.tipo === 'custom') {
      if (!newDiaOff.startTime || !newDiaOff.endTime) {
        toast.error(t('settings.messages.selectTimeRange'));
        return;
      }
      if (newDiaOff.startTime >= newDiaOff.endTime) {
        toast.error(t('settings.messages.startBeforeEnd'));
        return;
      }
    }
    
    setIsAddingDayOff(true);
    
    try {
      // Convert UI format to API format
      const { config, description } = uiToApiDayOff(newDiaOff);
      
      // Call the API to create the day off
      await createDayOff(config, description);
      
      // Reset form and close
      setNewDiaOff({ fechaInicio: '', fechaFin: '', motivo: '', tipo: 'full', startTime: '12:00', endTime: '18:00' });
      setShowAddDiaOff(false);
      toast.success(t('settings.daysOff.added'));
    } catch (error) {
      console.error('Failed to add day off:', error);
      toast.error(t('settings.messages.saveError'));
    } finally {
      setIsAddingDayOff(false);
    }
  };

  const handleRemoveDiaOff = async (id: string) => {
    setDeletingDayOffId(id);
    
    try {
      await deleteSetting(id);
      toast.success(t('settings.daysOff.removed'));
    } catch (error) {
      console.error('Failed to remove day off:', error);
      toast.error(t('settings.messages.saveError'));
    } finally {
      setDeletingDayOffId(null);
    }
  };

  const formatDateDisplay = (fecha: string) => {
    const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-AR';
    return new Date(fecha + 'T00:00:00').toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateRangeDisplay = (fechaInicio: string, fechaFin: string) => {
    if (fechaInicio === fechaFin) {
      return formatDateDisplay(fechaInicio);
    }
    const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-AR';
    const startDate = new Date(fechaInicio + 'T00:00:00').toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const endDate = new Date(fechaFin + 'T00:00:00').toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${startDate} - ${endDate}`;
  };

  const formatDiaOffTime = (dia: { tipo: DiaOffTipo; startTime?: string; endTime?: string }): string => {
    switch (dia.tipo) {
      case 'full':
        return t('settings.daysOff.fullDay');
      case 'morning':
        return `${t('settings.daysOff.morning')} (00:00 - 12:00)`;
      case 'afternoon':
        return `${t('settings.daysOff.afternoon')} (12:00 - 23:59)`;
      case 'custom':
        return `${dia.startTime} - ${dia.endTime}`;
      default:
        return t('settings.daysOff.fullDay');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-lg font-semibold text-foreground">{t('settings.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        {/* Main Settings Container - Notion-style side-by-side layout */}
        <div className="flex flex-col md:flex-row gap-6 max-w-6xl">
        {/* ============================================ */}
        {/* Left Navigation Sidebar */}
        {/* ============================================ */}
        <nav
          className="md:w-56 flex-shrink-0"
          aria-label={t('settings.title')}
        >
          {/* Mobile: Equal-width tab bar with bottom border indicator */}
          <div className="md:hidden grid border-b border-border" style={{ gridTemplateColumns: `repeat(${NAVIGATION_SECTIONS.length}, 1fr)` }}>
            {NAVIGATION_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-1 py-3 text-xs font-medium transition-all relative",
                    isActive
                      ? "text-indigo-600"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-indigo-600" : "text-muted-foreground"
                  )} />
                  <span className="truncate w-full text-center">{t(section.labelKey)}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop: Vertical sidebar navigation */}
          <div className="hidden md:flex md:flex-col">
            {NAVIGATION_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors w-full text-left border-l-2",
                    isActive
                      ? "border-indigo-600 text-indigo-700 font-medium"
                      : "border-transparent text-muted-foreground font-normal hover:text-foreground hover:border-border"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-indigo-600" : "text-muted-foreground"
                  )} />
                  <span>{t(section.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ============================================ */}
        {/* Right Content Area */}
        {/* ============================================ */}
        <div className="flex-1 min-w-0">
          {/* ============================================ */}
          {/* SECTION: Profile */}
          {/* ============================================ */}
          {activeSection === 'profile' && (
            <Perfil ref={perfilRef} onStateChange={handleProfileStateChange} />
          )}

          {/* ============================================ */}
          {/* SECTION: Preferences (Language + Duration + Reminders) */}
          {/* ============================================ */}
          {activeSection === 'preferences' && (
            <div className="space-y-4">
            {/* Appearance / Theme */}
            <ConfigSection
              icon={Sun}
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
              title={t('settings.theme.title')}
              description={t('settings.theme.description')}
            >
              <ThemeToggle />
            </ConfigSection>

            {/* Language Section */}
            <ConfigSection
              icon={Globe}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
              title={t('settings.language')}
              description={t('settings.selectLanguage')}
            >
              <LanguageSwitcher showLabel={false} variant="dropdown" className="max-w-xs" />
            </ConfigSection>

            {/* Default Session Duration */}
            <ConfigSection
              icon={Clock}
              iconColor="text-teal-600"
              iconBg="bg-teal-100"
              title={t('settings.sessionDuration.title')}
              description={t('settings.sessionDuration.description')}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('settings.sessionDuration.title')}>
                  {[
                    { value: 30, labelKey: 'agenda.duration.thirtyMin' },
                    { value: 45, labelKey: 'agenda.duration.fortyFiveMin' },
                    { value: 60, labelKey: 'agenda.duration.oneHour' },
                    { value: 90, labelKey: 'agenda.duration.ninetyMin' },
                    { value: 120, labelKey: 'agenda.duration.twoHours' },
                  ].map(({ value, labelKey }) => {
                    const isSelected = localSettings.defaultSessionDuration === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => updateLocalSetting('defaultSessionDuration', value)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-card text-foreground border-border hover:border-indigo-300 hover:bg-indigo-50"
                        )}
                      >
                        {t(labelKey)}
                      </button>
                    );
                  })}
                </div>
                {/* Custom duration input */}
                <div className="flex items-center gap-2">
                  <label htmlFor="custom-duration" className="text-sm text-muted-foreground">{t('settings.sessionDuration.custom')}:</label>
                  <Input
                    id="custom-duration"
                    type="number"
                    min="15"
                    max="240"
                    step="5"
                    value={localSettings.defaultSessionDuration}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 15 && val <= 240) {
                        updateLocalSetting('defaultSessionDuration', val);
                      }
                    }}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
            </ConfigSection>

            {/* Recordatorios de Cobros */}
            <ConfigSection
              icon={DollarSign}
              iconColor="text-orange-600"
              iconBg="bg-orange-100"
              title={t('settings.paymentReminders.title')}
              description={t('settings.paymentReminders.description')}
            >
              <div className="space-y-6">
                <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
                  <h3 className="text-sm font-medium text-foreground">{t('settings.paymentReminders.automation')}</h3>
                  <ToggleRow
                    checked={paymentReminderEnabled}
                    onChange={(v) => {
                      setPaymentReminderEnabled(v);
                      markReminderChanged();
                    }}
                    label={t('settings.paymentReminders.enableAuto')}
                    description={t('settings.paymentReminders.enableAutoHint')}
                  />

                  {paymentReminderEnabled && (
                    <div className="pl-4 sm:pl-14 space-y-4 pt-4 border-t border-border">
                      <div className="space-y-2">
                        <label htmlFor="frecuencia-recordatorio" className="block text-sm font-medium text-foreground">
                          {t('settings.paymentReminders.frequency')}
                        </label>
                        <Select
                          value={paymentReminderFrequency}
                          onValueChange={(value: 'daily' | 'weekly' | 'biweekly') => {
                            setPaymentReminderFrequency(value);
                            markReminderChanged();
                          }}
                        >
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">{t('settings.paymentReminders.daily')}</SelectItem>
                            <SelectItem value="weekly">{t('settings.paymentReminders.weekly')}</SelectItem>
                            <SelectItem value="biweekly">{t('settings.paymentReminders.biweekly')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="minimo-turnos" className="block text-sm font-medium text-foreground">
                          {t('settings.paymentReminders.minimumSessions')}
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="minimo-turnos"
                            type="number"
                            min="1"
                            max="20"
                            value={paymentReminderLimit}
                            onChange={(e) => {
                              setPaymentReminderLimit(Number(e.target.value));
                              markReminderChanged();
                            }}
                            className="w-20 text-center"
                          />
                          <span className="text-sm text-muted-foreground">
                            {paymentReminderLimit === 1 ? t('settings.paymentReminders.sessionsUnpaid') : t('settings.paymentReminders.sessionsUnpaidPlural')}
                          </span>
                        </div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <p className="text-xs sm:text-sm text-orange-800">
                          <span className="font-medium">{t('settings.paymentReminders.example')}:</span> {t('settings.paymentReminders.exampleText', { count: paymentReminderLimit })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ConfigSection>

            {/* Recordatorios de Turnos */}
            <ConfigSection
              icon={Bell}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
              title={t('settings.appointmentReminders.title')}
              description={t('settings.appointmentReminders.description')}
            >
              <div className="space-y-6">
                <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
                  <h3 className="text-sm font-medium text-foreground">{t('settings.appointmentReminders.automation')}</h3>
                  <ToggleRow
                    checked={sessionReminderEnabled}
                    onChange={(v) => {
                      setSessionReminderEnabled(v);
                      markReminderChanged();
                    }}
                    label={t('settings.appointmentReminders.enableAuto')}
                    description={t('settings.appointmentReminders.enableAutoHint')}
                  />

                  {sessionReminderEnabled && (
                    <div className="pl-4 sm:pl-14 space-y-4 pt-4 border-t border-border">
                      <div className="space-y-2">
                        <label htmlFor="horas-anticipacion" className="block text-sm font-medium text-foreground">
                          {t('settings.appointmentReminders.hoursBeforeLabel')}
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="horas-anticipacion"
                            type="number"
                            min="1"
                            max="72"
                            value={sessionReminderHours}
                            onChange={(e) => {
                              setSessionReminderHours(Number(e.target.value));
                              markReminderChanged();
                            }}
                            className="w-20 text-center"
                          />
                          <span className="text-sm text-muted-foreground">{t('settings.appointmentReminders.hoursBeforeAppointment')}</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs sm:text-sm text-blue-800">
                          <span className="font-medium">{t('settings.appointmentReminders.example')}:</span> {t('settings.appointmentReminders.exampleText', { hours: sessionReminderHours })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ConfigSection>
          </div>
          )}

          {/* ============================================ */}
          {/* SECTION: Calendar (Sync + Working Hours + Days Off) */}
          {/* ============================================ */}
          {activeSection === 'calendar' && (
            <div className="space-y-4">
            {/* Google Calendar Sync */}
            <CalendarSync />

            {/* Working Hours & Days */}
            <ConfigSection
              icon={Clock}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-100"
              title={t('settings.workingHours.title')}
              description={t('settings.workingHours.description')}
            >
              <div className="space-y-5">
                <fieldset className="space-y-2">
                  <legend className="block text-sm font-medium text-foreground">
                    {t('settings.workingHours.schedule')}
                  </legend>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label htmlFor="working-hours-start" className="text-sm text-muted-foreground">{t('common.from')}</label>
                      <TimePicker
                        id="working-hours-start"
                        value={localSettings.workingHours.startTime}
                        onChange={(time) => updateLocalSetting('workingHours', {
                          ...localSettings.workingHours,
                          startTime: time,
                        })}
                        className="w-28"
                        minHour={5}
                        maxHour={22}
                        minuteStep={30}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="working-hours-end" className="text-sm text-muted-foreground">{t('common.to').toLowerCase()}</label>
                      <TimePicker
                        id="working-hours-end"
                        value={localSettings.workingHours.endTime}
                        onChange={(time) => updateLocalSetting('workingHours', {
                          ...localSettings.workingHours,
                          endTime: time,
                        })}
                        className="w-28"
                        minHour={5}
                        maxHour={23}
                        minuteStep={30}
                      />
                    </div>
                  </div>
                </fieldset>

                <fieldset className="space-y-2">
                  <legend className="block text-sm font-medium text-foreground">
                    {t('settings.workingHours.workingDays')}
                  </legend>
                  <div className="flex flex-wrap gap-2" role="group" aria-label={t('settings.workingHours.workingDays')}>
                    {WEEKDAY_KEYS.map((day) => {
                      const isSelected = localSettings.workingHours.workingDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            const newDays = isSelected
                              ? localSettings.workingHours.workingDays.filter(d => d !== day.id)
                              : [...localSettings.workingHours.workingDays, day.id];
                            updateLocalSetting('workingHours', {
                              ...localSettings.workingHours,
                              workingDays: newDays,
                            });
                          }}
                          className={`
                            w-9 h-9 rounded-full text-xs font-medium transition-all
                            ${isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-muted text-muted-foreground hover:bg-muted'
                            }
                          `}
                          title={t(day.nameKey)}
                          aria-label={t(day.nameKey)}
                          aria-pressed={isSelected}
                        >
                          {t(day.shortKey)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.workingHours.nonWorkingDaysHint')}
                  </p>
                </fieldset>
              </div>
            </ConfigSection>

            {/* Días Off */}
            <ConfigSection
              icon={Calendar}
              iconColor="text-rose-600"
              iconBg="bg-rose-100"
              title={t('settings.daysOff.title')}
              description={t('settings.daysOff.description')}
            >
              <div className="space-y-4">
                {/* Loading state */}
                {isLoadingSettings && diasOffFromApi.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Lista de días off */}
                    {diasOffFromApi.length > 0 ? (
                      <div className="space-y-2">
                        {diasOffFromApi.map(dia => (
                          <div 
                            key={dia.id} 
                            className={`flex items-center justify-between gap-3 p-3 bg-muted border border-border rounded-lg group hover:bg-muted transition-colors ${deletingDayOffId === dia.id ? 'opacity-50' : ''}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{formatDateRangeDisplay(dia.fechaInicio, dia.fechaFin)}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-rose-600 font-medium">{formatDiaOffTime(dia)}</span>
                                  {dia.motivo && (
                                    <>
                                      <span className="text-muted-foreground">•</span>
                                      <span className="text-xs text-muted-foreground truncate">{dia.motivo}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveDiaOff(dia.id)}
                              disabled={deletingDayOffId === dia.id}
                              className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t('common.delete')}
                              aria-label={t('common.delete')}
                            >
                              {deletingDayOffId === dia.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-muted rounded-lg border border-dashed border-border">
                        <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{t('settings.daysOff.noDaysOff')}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('settings.daysOff.noDaysOffHint')}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Formulario para agregar */}
                {showAddDiaOff ? (
                  <div className="p-4 bg-muted rounded-lg border border-border space-y-4">
                    {/* Fecha Inicio y Fecha Fin */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="diaoff-fecha-inicio" className="block text-xs font-medium text-foreground mb-1">{t('settings.daysOff.startDate')}</label>
                        <DatePicker
                          id="diaoff-fecha-inicio"
                          value={newDiaOff.fechaInicio}
                          onChange={(date) => setNewDiaOff({ ...newDiaOff, fechaInicio: date || '', fechaFin: newDiaOff.fechaFin || date || '' })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor="diaoff-fecha-fin" className="block text-xs font-medium text-foreground mb-1">{t('settings.daysOff.endDate')}</label>
                        <DatePicker
                          id="diaoff-fecha-fin"
                          value={newDiaOff.fechaFin}
                          onChange={(date) => setNewDiaOff({ ...newDiaOff, fechaFin: date || '' })}
                          fromDate={newDiaOff.fechaInicio ? new Date(newDiaOff.fechaInicio) : undefined}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Motivo */}
                    <div>
                      <label htmlFor="diaoff-motivo" className="block text-xs font-medium text-foreground mb-1">{t('settings.daysOff.reason')} ({t('common.optional')})</label>
                      <Input
                        id="diaoff-motivo"
                        type="text"
                        value={newDiaOff.motivo}
                        onChange={(e) => setNewDiaOff({ ...newDiaOff, motivo: e.target.value })}
                        placeholder={t('settings.daysOff.reasonPlaceholder')}
                        className="w-full"
                      />
                    </div>

                    {/* Tipo de día off */}
                    <fieldset>
                      <legend className="block text-xs font-medium text-foreground mb-2">{t('settings.daysOff.blockType')}</legend>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label={t('settings.daysOff.blockType')}>
                        {DIA_OFF_TIPO_KEYS.map((tipo) => (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() => setNewDiaOff({ ...newDiaOff, tipo: tipo.value })}
                            className={`
                              p-2 rounded-lg border text-left transition-all
                              ${newDiaOff.tipo === tipo.value
                                ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500'
                                : 'border-border hover:border-border hover:bg-muted'
                              }
                            `}
                          >
                            <p className={`text-sm font-medium ${newDiaOff.tipo === tipo.value ? 'text-rose-700' : 'text-foreground'}`}>
                              {t(tipo.labelKey)}
                            </p>
                            <p className="text-xs text-muted-foreground">{tipo.descriptionKey.startsWith('settings.') ? t(tipo.descriptionKey) : tipo.descriptionKey}</p>
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    {/* Rango horario personalizado */}
                    {newDiaOff.tipo === 'custom' && (
                      <div className="flex flex-wrap items-center gap-3 p-3 bg-background rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                          <label htmlFor="diaoff-start-time" className="text-sm text-muted-foreground">{t('common.from')}</label>
                          <TimePicker
                            id="diaoff-start-time"
                            value={newDiaOff.startTime}
                            onChange={(time) => setNewDiaOff({ ...newDiaOff, startTime: time })}
                            className="w-28"
                            minHour={0}
                            maxHour={23}
                            minuteStep={15}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label htmlFor="diaoff-end-time" className="text-sm text-muted-foreground">{t('common.to').toLowerCase()}</label>
                          <TimePicker
                            id="diaoff-end-time"
                            value={newDiaOff.endTime}
                            onChange={(time) => setNewDiaOff({ ...newDiaOff, endTime: time })}
                            className="w-28"
                            minHour={0}
                            maxHour={23}
                            minuteStep={15}
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
                          setNewDiaOff({ fechaInicio: '', fechaFin: '', motivo: '', tipo: 'full', startTime: '12:00', endTime: '18:00' });
                        }}
                        disabled={isAddingDayOff}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddDiaOff}
                        disabled={isAddingDayOff}
                      >
                        {isAddingDayOff ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-1" />
                        )}
                        {t('common.add')}
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
                    {t('settings.daysOff.addDayOff')}
                  </Button>
                )}
              </div>
            </ConfigSection>
          </div>
          )}

        </div>
        </div>
      </div>
      {/* ============================================ */}
      {/* Fixed Footer - Save Button */}
      {/* ============================================ */}
      {(() => {
        // Compute footer state per section
        const sectionHasChanges =
          activeSection === 'profile' ? profileHasChanges
          : activeSection === 'preferences' ? (hasChanges || hasReminderChanges)
          : hasChanges;
        const sectionIsSaving =
          activeSection === 'profile' ? profileIsSaving
          : activeSection === 'preferences' ? (isSaving || isSavingReminders)
          : isSaving;

        return sectionHasChanges ? (
          <div className="flex-shrink-0 bg-background border-t border-border px-4 md:px-6 lg:px-8 py-4">
            <div className="max-w-6xl ml-auto flex items-center justify-end gap-3">
              <span className="text-sm text-amber-600">{t('common.unsavedChanges')}</span>
              <Button
                onClick={handleSave}
                disabled={sectionIsSaving}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {sectionIsSaving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}
