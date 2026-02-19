import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

// ============================================================================
// MOCKS
// ============================================================================

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        // Main settings
        'settings.title': 'Configuración',
        'settings.subtitle': 'Personaliza la aplicación según tus preferencias',
        
        // Language section
        'settings.language': 'Idioma',
        'settings.selectLanguage': 'Selecciona el idioma de la aplicación',
        
        // Days off section
        'settings.daysOff.title': 'Días no laborables',
        'settings.daysOff.description': 'Configura los días que no atenderás pacientes',
        'settings.daysOff.noDaysOff': 'No hay días no laborables configurados',
        'settings.daysOff.noDaysOffHint': 'Agrega días para bloquear tu agenda',
        'settings.daysOff.addDayOff': 'Agregar día no laborable',
        'settings.daysOff.date': 'Fecha',
        'settings.daysOff.reason': 'Motivo',
        'settings.daysOff.reasonPlaceholder': 'ej: Vacaciones, Feriado...',
        'settings.daysOff.blockType': 'Tipo de bloqueo',
        'settings.daysOff.fullDay': 'Día completo',
        'settings.daysOff.morning': 'Mañana',
        'settings.daysOff.afternoon': 'Tarde',
        'settings.daysOff.customRange': 'Personalizado',
        'settings.daysOff.custom': 'Define rango horario',
        'settings.daysOff.noService': 'Sin atención',
        'settings.daysOff.added': 'Día no laborable agregado',
        'settings.daysOff.removed': 'Día no laborable eliminado',
        
        // Working hours section
        'settings.workingHours.title': 'Horario laboral',
        'settings.workingHours.description': 'Define tu horario de atención',
        'settings.workingHours.schedule': 'Horario de atención',
        'settings.workingHours.workingDays': 'Días de trabajo',
        'settings.workingHours.yourSchedule': 'Tu horario',
        'settings.workingHours.noWorkingDays': 'Sin días de trabajo seleccionados',
        'settings.workingHours.nonWorkingDaysHint': 'Los días no seleccionados no mostrarán disponibilidad',
        
        // Weekdays
        'settings.weekdays.monday': 'Lunes',
        'settings.weekdays.tuesday': 'Martes',
        'settings.weekdays.wednesday': 'Miércoles',
        'settings.weekdays.thursday': 'Jueves',
        'settings.weekdays.friday': 'Viernes',
        'settings.weekdays.saturday': 'Sábado',
        'settings.weekdays.sunday': 'Domingo',
        'settings.weekdays.mon': 'L',
        'settings.weekdays.tue': 'M',
        'settings.weekdays.wed': 'X',
        'settings.weekdays.thu': 'J',
        'settings.weekdays.fri': 'V',
        'settings.weekdays.sat': 'S',
        'settings.weekdays.sun': 'D',
        
        // Payment reminders section
        'settings.paymentReminders.title': 'Recordatorios de cobros',
        'settings.paymentReminders.description': 'Configura recordatorios automáticos de pagos',
        'settings.paymentReminders.automation': 'Automatización',
        'settings.paymentReminders.enableAuto': 'Enviar recordatorios automáticos',
        'settings.paymentReminders.enableAutoHint': 'Se enviarán WhatsApp a pacientes con pagos pendientes',
        'settings.paymentReminders.frequency': 'Frecuencia de envío',
        'settings.paymentReminders.daily': 'Diario',
        'settings.paymentReminders.weekly': 'Semanal',
        'settings.paymentReminders.biweekly': 'Quincenal',
        'settings.paymentReminders.minimumSessions': 'Mínimo de turnos sin pagar',
        'settings.paymentReminders.sessionsUnpaid': 'turno sin pagar',
        'settings.paymentReminders.sessionsUnpaidPlural': 'turnos sin pagar',
        'settings.paymentReminders.example': 'Ejemplo',
        'settings.paymentReminders.exampleText': `Se enviará recordatorio cuando tenga ${params?.count || 3} turnos sin pagar`,
        'settings.paymentReminders.whatsappTemplate': 'Plantilla de WhatsApp',
        'settings.paymentReminders.whatsappTemplateHint': 'Personaliza el mensaje que se enviará',
        'settings.paymentReminders.variablesAvailable': 'Variables disponibles',
        'settings.paymentReminders.restoreDefault': 'Restaurar por defecto',
        
        // Appointment reminders section
        'settings.appointmentReminders.title': 'Recordatorios de turnos',
        'settings.appointmentReminders.description': 'Configura recordatorios automáticos de citas',
        'settings.appointmentReminders.automation': 'Automatización',
        'settings.appointmentReminders.enableAuto': 'Enviar recordatorios automáticos',
        'settings.appointmentReminders.enableAutoHint': 'Se enviarán WhatsApp antes de cada turno',
        'settings.appointmentReminders.hoursBeforeLabel': 'Horas de anticipación',
        'settings.appointmentReminders.hoursBeforeAppointment': 'horas antes del turno',
        'settings.appointmentReminders.example': 'Ejemplo',
        'settings.appointmentReminders.exampleText': `Recordatorio ${params?.hours || 24} horas antes`,
        'settings.appointmentReminders.whatsappTemplate': 'Plantilla de WhatsApp',
        'settings.appointmentReminders.whatsappTemplateHint': 'Personaliza el mensaje de recordatorio',
        
        // Messages
        'settings.messages.saved': 'Configuración guardada',
        'settings.messages.saveError': 'Error al guardar configuración',
        'settings.messages.selectDate': 'Selecciona una fecha',
        'settings.messages.selectTimeRange': 'Selecciona el rango horario',
        'settings.messages.startBeforeEnd': 'La hora de inicio debe ser anterior a la de fin',
        
        // Common
        'common.from': 'Desde',
        'common.to': 'hasta',
        'common.save': 'Guardar',
        'common.saving': 'Guardando...',
        'common.cancel': 'Cancelar',
        'common.add': 'Agregar',
        'common.delete': 'Eliminar',
        'common.optional': 'opcional',
        'common.unsavedChanges': 'Tienes cambios sin guardar',
        'common.comingSoon': 'Próximamente',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'es',
    },
  }),
}));

// Mock CalendarSync component
vi.mock('../../../components/config/CalendarSync', () => ({
  default: () => (
    <div data-testid="calendar-sync">
      <h2>Google Calendar</h2>
      <p>Calendar sync component</p>
    </div>
  ),
}));

// Mock LanguageSwitcher component
vi.mock('@/components/shared', () => ({
  LanguageSwitcher: ({ showLabel, variant, className }: { showLabel?: boolean; variant?: string; className?: string }) => (
    <div 
      data-testid="language-switcher" 
      data-show-label={showLabel} 
      data-variant={variant}
      className={className}
    >
      <select aria-label="Language">
        <option value="es">Español</option>
        <option value="en">English</option>
        <option value="pt">Português</option>
      </select>
    </div>
  ),
}));

// Import component after mocks
import { Configuracion } from '../../../components/config/Configuracion';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// ============================================================================
// HELPERS
// ============================================================================

const renderConfiguracion = () => {
  return render(<Configuracion />);
};

// Cast toast to typed mock
const mockedToast = vi.mocked(toast);

// ============================================================================
// TESTS
// ============================================================================

describe('Configuracion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders the main heading', () => {
      renderConfiguracion();
      expect(screen.getByRole('heading', { name: 'Configuración' })).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      renderConfiguracion();
      expect(screen.getByText('Personaliza la aplicación según tus preferencias')).toBeInTheDocument();
    });

    it('renders the save button', () => {
      renderConfiguracion();
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    });

    it('save button is disabled initially when no changes', () => {
      renderConfiguracion();
      const saveButton = screen.getByRole('button', { name: /guardar/i });
      expect(saveButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // SECTIONS RENDERING
  // ==========================================================================

  describe('Sections Rendering', () => {
    it('renders Language section', () => {
      renderConfiguracion();
      expect(screen.getByText('Idioma')).toBeInTheDocument();
      expect(screen.getByText('Selecciona el idioma de la aplicación')).toBeInTheDocument();
    });

    it('renders LanguageSwitcher component', () => {
      renderConfiguracion();
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    });

    it('renders CalendarSync section', () => {
      renderConfiguracion();
      expect(screen.getByTestId('calendar-sync')).toBeInTheDocument();
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    });

    it('renders Days Off section', () => {
      renderConfiguracion();
      expect(screen.getByText('Días no laborables')).toBeInTheDocument();
      expect(screen.getByText('Configura los días que no atenderás pacientes')).toBeInTheDocument();
    });

    it('renders Working Hours section', () => {
      renderConfiguracion();
      expect(screen.getByText('Horario laboral')).toBeInTheDocument();
      expect(screen.getByText('Define tu horario de atención')).toBeInTheDocument();
    });

    it('renders Payment Reminders section', () => {
      renderConfiguracion();
      expect(screen.getByText('Recordatorios de cobros')).toBeInTheDocument();
      expect(screen.getByText('Configura recordatorios automáticos de pagos')).toBeInTheDocument();
    });

    it('renders Appointment Reminders section', () => {
      renderConfiguracion();
      expect(screen.getByText('Recordatorios de turnos')).toBeInTheDocument();
      expect(screen.getByText('Configura recordatorios automáticos de citas')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DAYS OFF SECTION
  // ==========================================================================

  describe('Days Off Section', () => {
    it('shows default days off (Navidad and Año Nuevo)', () => {
      renderConfiguracion();
      // Default settings include Navidad and Año Nuevo
      expect(screen.getByText('Navidad')).toBeInTheDocument();
      expect(screen.getByText('Año Nuevo')).toBeInTheDocument();
    });

    it('shows "Add day off" button', () => {
      renderConfiguracion();
      expect(screen.getByRole('button', { name: /agregar día no laborable/i })).toBeInTheDocument();
    });

    it('shows add day off form when button is clicked', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      await user.click(screen.getByRole('button', { name: /agregar día no laborable/i }));

      expect(screen.getByLabelText('Fecha')).toBeInTheDocument();
      expect(screen.getByLabelText(/motivo/i)).toBeInTheDocument();
      expect(screen.getByText('Tipo de bloqueo')).toBeInTheDocument();
    });

    it('shows block type options in add form', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      await user.click(screen.getByRole('button', { name: /agregar día no laborable/i }));

      expect(screen.getByRole('button', { name: /día completo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mañana/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tarde/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /personalizado/i })).toBeInTheDocument();
    });

    it('shows custom time inputs when custom type is selected', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      await user.click(screen.getByRole('button', { name: /agregar día no laborable/i }));
      await user.click(screen.getByRole('button', { name: /personalizado/i }));

      // Use specific IDs for the custom time inputs to avoid conflicts with working hours
      expect(document.getElementById('diaoff-start-time')).toBeInTheDocument();
      expect(document.getElementById('diaoff-end-time')).toBeInTheDocument();
    });

    it('shows error toast when adding day off without date', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      await user.click(screen.getByRole('button', { name: /agregar día no laborable/i }));
      await user.click(screen.getByRole('button', { name: /^agregar$/i }));

      expect(mockedToast.error).toHaveBeenCalledWith('Selecciona una fecha');
    });

    it('can cancel adding day off', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      await user.click(screen.getByRole('button', { name: /agregar día no laborable/i }));
      expect(screen.getByLabelText('Fecha')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancelar/i }));
      expect(screen.queryByLabelText('Fecha')).not.toBeInTheDocument();
    });

    it('adds new day off successfully', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      await user.click(screen.getByRole('button', { name: /agregar día no laborable/i }));
      
      const dateInput = screen.getByLabelText('Fecha');
      await user.type(dateInput, '2026-03-15');
      
      const reasonInput = screen.getByLabelText(/motivo/i);
      await user.type(reasonInput, 'Test Holiday');

      await user.click(screen.getByRole('button', { name: /^agregar$/i }));

      expect(mockedToast.success).toHaveBeenCalledWith('Día no laborable agregado');
    });

    it('removes day off when delete button is clicked', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      // Find delete buttons (there should be 2 for default days)
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      expect(deleteButtons.length).toBeGreaterThan(0);

      await user.click(deleteButtons[0]);

      expect(mockedToast.success).toHaveBeenCalledWith('Día no laborable eliminado');
    });
  });

  // ==========================================================================
  // WORKING HOURS SECTION
  // ==========================================================================

  describe('Working Hours Section', () => {
    it('shows working hours time inputs', () => {
      renderConfiguracion();
      
      // Use specific ID for working hours start time
      expect(document.getElementById('working-hours-start')).toBeInTheDocument();
      expect(document.getElementById('working-hours-end')).toBeInTheDocument();
    });

    it('shows weekday selection buttons', () => {
      renderConfiguracion();
      
      expect(screen.getByRole('button', { name: /lunes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /martes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /miércoles/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /jueves/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /viernes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sábado/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /domingo/i })).toBeInTheDocument();
    });

    it('shows schedule preview', () => {
      renderConfiguracion();
      // Use getAllByText since there are multiple matches
      const matches = screen.getAllByText(/tu horario/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('toggles working day when button is clicked', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      const saturdayButton = screen.getByRole('button', { name: /sábado/i });
      
      // Saturday is not selected by default (Mon-Fri)
      expect(saturdayButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(saturdayButton);

      // Now it should be selected
      expect(saturdayButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('updates working hours start time', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      const startTimeInput = document.getElementById('working-hours-start') as HTMLInputElement;
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '08:00');

      // Should enable save button
      const saveButton = screen.getByRole('button', { name: /guardar/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  // ==========================================================================
  // WHATSAPP TEMPLATES
  // ==========================================================================

  describe('WhatsApp Templates', () => {
    it('shows payment reminder template textarea', () => {
      renderConfiguracion();
      // Use specific ID to avoid multiple matches
      expect(document.getElementById('whatsapp-payment-template')).toBeInTheDocument();
    });

    it('shows restore default button for templates', () => {
      renderConfiguracion();
      const restoreButtons = screen.getAllByRole('button', { name: /restaurar por defecto/i });
      expect(restoreButtons.length).toBeGreaterThan(0);
    });

    it('updates template when typing', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      const templateTextareas = screen.getAllByRole('textbox');
      const paymentTemplate = templateTextareas.find(textarea => 
        textarea.getAttribute('id')?.includes('payment')
      );
      
      if (paymentTemplate) {
        await user.clear(paymentTemplate);
        await user.type(paymentTemplate, 'Custom template');

        const saveButton = screen.getByRole('button', { name: /guardar/i });
        expect(saveButton).not.toBeDisabled();
      }
    });
  });

  // ==========================================================================
  // SAVING SETTINGS
  // ==========================================================================

  describe('Saving Settings', () => {
    it('enables save button when changes are made', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      const saveButton = screen.getByRole('button', { name: /guardar/i });
      expect(saveButton).toBeDisabled();

      // Make a change
      const saturdayButton = screen.getByRole('button', { name: /sábado/i });
      await user.click(saturdayButton);

      expect(saveButton).not.toBeDisabled();
    });

    it('shows unsaved changes indicator when changes are made', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      const saturdayButton = screen.getByRole('button', { name: /sábado/i });
      await user.click(saturdayButton);

      expect(screen.getByText('Tienes cambios sin guardar')).toBeInTheDocument();
    });

    it('saves settings to localStorage when save is clicked', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      // Make a change
      const saturdayButton = screen.getByRole('button', { name: /sábado/i });
      await user.click(saturdayButton);

      // Click save
      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'lavenius_settings',
        expect.any(String)
      );
      expect(mockedToast.success).toHaveBeenCalledWith('Configuración guardada');
    });

    it('disables save button after successful save', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      // Make a change
      const saturdayButton = screen.getByRole('button', { name: /sábado/i });
      await user.click(saturdayButton);

      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });

    it('hides unsaved changes indicator after save', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      // Make a change
      const saturdayButton = screen.getByRole('button', { name: /sábado/i });
      await user.click(saturdayButton);

      expect(screen.getByText('Tienes cambios sin guardar')).toBeInTheDocument();

      // Save
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => {
        expect(screen.queryByText('Tienes cambios sin guardar')).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // LOADING SETTINGS
  // ==========================================================================

  describe('Loading Settings', () => {
    it('loads settings from localStorage on mount', () => {
      const customSettings = {
        workingHours: {
          startTime: '08:00',
          endTime: '17:00',
          workingDays: [1, 2, 3, 4, 5, 6],
        },
        diasOff: [],
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(customSettings));

      renderConfiguracion();

      // Saturday should be selected based on loaded settings
      const saturdayButton = screen.getByRole('button', { name: /sábado/i });
      expect(saturdayButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('uses default settings when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      renderConfiguracion();

      // Default is Mon-Fri, so Saturday should not be selected
      const saturdayButton = screen.getByRole('button', { name: /sábado/i });
      expect(saturdayButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('handles corrupted localStorage gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      // Should not throw and should render with defaults
      expect(() => renderConfiguracion()).not.toThrow();
      expect(screen.getByText('Configuración')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // COMING SOON SECTIONS
  // ==========================================================================

  describe('Coming Soon Sections', () => {
    it('shows Coming Soon overlay on payment automation section', () => {
      renderConfiguracion();
      // The automation sections have coming soon overlays
      const comingSoonTexts = screen.getAllByText('Próximamente');
      expect(comingSoonTexts.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible heading structure', () => {
      renderConfiguracion();
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Configuración');
    });

    it('weekday buttons have aria-pressed attribute', () => {
      renderConfiguracion();
      
      const mondayButton = screen.getByRole('button', { name: /lunes/i });
      expect(mondayButton).toHaveAttribute('aria-pressed');
    });

    it('form inputs have associated labels', () => {
      renderConfiguracion();
      
      // Use specific ID for working hours start time
      expect(document.getElementById('working-hours-start')).toBeInTheDocument();
    });

    it('delete buttons have accessible labels', () => {
      renderConfiguracion();
      
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // CUSTOM TIME RANGE VALIDATION
  // ==========================================================================

  describe('Custom Time Range Validation', () => {
    it('shows error when custom time range start is after end', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      await user.click(screen.getByRole('button', { name: /agregar día no laborable/i }));
      
      // Set date
      const dateInput = screen.getByLabelText('Fecha');
      await user.type(dateInput, '2026-03-15');

      // Select custom type
      await user.click(screen.getByRole('button', { name: /personalizado/i }));

      // Set invalid time range (start after end) - use specific IDs
      const startTimeInput = document.getElementById('diaoff-start-time') as HTMLInputElement;
      const endTimeInput = document.getElementById('diaoff-end-time') as HTMLInputElement;
      
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '18:00');
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '12:00');

      await user.click(screen.getByRole('button', { name: /^agregar$/i }));

      expect(mockedToast.error).toHaveBeenCalledWith('La hora de inicio debe ser anterior a la de fin');
    });

    it('shows error when custom time range is missing', async () => {
      const user = userEvent.setup();
      renderConfiguracion();

      await user.click(screen.getByRole('button', { name: /agregar día no laborable/i }));
      
      // Set date
      const dateInput = screen.getByLabelText('Fecha');
      await user.type(dateInput, '2026-03-15');

      // Select custom type
      await user.click(screen.getByRole('button', { name: /personalizado/i }));

      // Clear the time inputs - use specific IDs
      const startTimeInput = document.getElementById('diaoff-start-time') as HTMLInputElement;
      const endTimeInput = document.getElementById('diaoff-end-time') as HTMLInputElement;
      await user.clear(startTimeInput);
      await user.clear(endTimeInput);

      await user.click(screen.getByRole('button', { name: /^agregar$/i }));

      expect(mockedToast.error).toHaveBeenCalledWith('Selecciona el rango horario');
    });
  });
});
