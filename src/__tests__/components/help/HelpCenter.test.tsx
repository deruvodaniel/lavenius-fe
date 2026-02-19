import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string | string[]> = {
        // Main help center
        'help.title': 'Centro de Ayuda',
        'help.subtitle': 'Encuentra respuestas a tus preguntas',
        'help.searchPlaceholder': 'Buscar en la ayuda...',
        'help.backToCategories': 'Volver a categorías',
        'help.backTo': `Volver a ${params?.category || ''}`,
        'help.article': 'artículo',
        'help.articles': 'artículos',
        'help.relatedTopics': 'Temas relacionados',
        'help.noResults': `No se encontraron resultados para "${params?.search || ''}"`,
        'help.notFound': '¿No encontraste lo que buscabas?',
        'help.contactUs': 'Contáctanos en',

        // Categories
        'help.categories.agenda.title': 'Agenda',
        'help.categories.agenda.description': 'Gestión de turnos y calendario',
        'help.categories.pacientes.title': 'Pacientes',
        'help.categories.pacientes.description': 'Gestión de pacientes',
        'help.categories.cobros.title': 'Cobros',
        'help.categories.cobros.description': 'Gestión de pagos y facturación',
        'help.categories.configuracion.title': 'Configuración',
        'help.categories.configuracion.description': 'Personaliza la aplicación',

        // Agenda articles
        'help.categories.agenda.articles.createSession.title': 'Crear un turno',
        'help.categories.agenda.articles.createSession.content': 'Para crear un turno:\n1. Ve a la sección Agenda\n2. Haz clic en "Nuevo Turno"\n3. Completa los datos del paciente',
        'help.categories.agenda.articles.createSession.tags': ['turno', 'cita', 'agenda'],
        'help.categories.agenda.articles.editSession.title': 'Editar un turno',
        'help.categories.agenda.articles.editSession.content': '**Editar turno existente**\nPuedes modificar cualquier turno haciendo clic en él.',
        'help.categories.agenda.articles.editSession.tags': ['editar', 'modificar'],
        'help.categories.agenda.articles.googleCalendar.title': 'Google Calendar',
        'help.categories.agenda.articles.googleCalendar.content': 'Sincroniza tu agenda con Google Calendar para tener todo en un solo lugar.',
        'help.categories.agenda.articles.googleCalendar.tags': ['google', 'sincronización'],

        // Pacientes articles
        'help.categories.pacientes.articles.createPatient.title': 'Crear un paciente',
        'help.categories.pacientes.articles.createPatient.content': 'Agrega nuevos pacientes desde la sección Pacientes.',
        'help.categories.pacientes.articles.createPatient.tags': ['paciente', 'nuevo'],
        'help.categories.pacientes.articles.clinicalFile.title': 'Ficha clínica',
        'help.categories.pacientes.articles.clinicalFile.content': 'La ficha clínica contiene toda la información del paciente.',
        'help.categories.pacientes.articles.clinicalFile.tags': ['ficha', 'historial'],
        'help.categories.pacientes.articles.searchPatients.title': 'Buscar pacientes',
        'help.categories.pacientes.articles.searchPatients.content': 'Utiliza la barra de búsqueda para encontrar pacientes rápidamente.',
        'help.categories.pacientes.articles.searchPatients.tags': ['buscar', 'filtrar'],

        // Cobros articles
        'help.categories.cobros.articles.registerPayment.title': 'Registrar un pago',
        'help.categories.cobros.articles.registerPayment.content': 'Registra los pagos de tus pacientes fácilmente.',
        'help.categories.cobros.articles.registerPayment.tags': ['pago', 'cobro'],
        'help.categories.cobros.articles.paymentHistory.title': 'Historial de pagos',
        'help.categories.cobros.articles.paymentHistory.content': 'Consulta el historial completo de pagos.',
        'help.categories.cobros.articles.paymentHistory.tags': ['historial', 'pagos'],
        'help.categories.cobros.articles.sendReminder.title': 'Enviar recordatorio',
        'help.categories.cobros.articles.sendReminder.content': 'Envía recordatorios de pago a tus pacientes.',
        'help.categories.cobros.articles.sendReminder.tags': ['recordatorio', 'whatsapp'],

        // Configuracion articles
        'help.categories.configuracion.articles.profile.title': 'Perfil de usuario',
        'help.categories.configuracion.articles.profile.content': 'Actualiza tu información personal y profesional.',
        'help.categories.configuracion.articles.profile.tags': ['perfil', 'usuario'],
        'help.categories.configuracion.articles.calendarConfig.title': 'Configuración del calendario',
        'help.categories.configuracion.articles.calendarConfig.content': 'Personaliza tu horario de atención y días laborables.',
        'help.categories.configuracion.articles.calendarConfig.tags': ['calendario', 'horario'],
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'es',
    },
  }),
}));

// Import component after mocks
import { HelpCenter } from '../../../components/help/HelpCenter';

// ============================================================================
// HELPERS
// ============================================================================

const renderHelpCenter = () => {
  return render(<HelpCenter />);
};

// ============================================================================
// TESTS
// ============================================================================

describe('HelpCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders the main heading', () => {
      renderHelpCenter();
      expect(screen.getByRole('heading', { level: 1, name: 'Centro de Ayuda' })).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      renderHelpCenter();
      expect(screen.getByText('Encuentra respuestas a tus preguntas')).toBeInTheDocument();
    });

    it('renders the help icon in header', () => {
      renderHelpCenter();
      // The icon is in a container div
      const iconContainer = document.querySelector('.bg-indigo-100.rounded-full');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders the search input', () => {
      renderHelpCenter();
      expect(screen.getByPlaceholderText('Buscar en la ayuda...')).toBeInTheDocument();
    });

    it('renders contact support section', () => {
      renderHelpCenter();
      expect(screen.getByText('¿No encontraste lo que buscabas?')).toBeInTheDocument();
      expect(screen.getByText('Contáctanos en')).toBeInTheDocument();
    });

    it('renders support email link', () => {
      renderHelpCenter();
      const emailLink = screen.getByRole('link', { name: 'soporte@lavenius.com' });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:soporte@lavenius.com');
    });
  });

  // ==========================================================================
  // CATEGORY CARDS
  // ==========================================================================

  describe('Category Cards', () => {
    it('renders all four category cards', () => {
      renderHelpCenter();
      expect(screen.getByText('Agenda')).toBeInTheDocument();
      expect(screen.getByText('Pacientes')).toBeInTheDocument();
      expect(screen.getByText('Cobros')).toBeInTheDocument();
      expect(screen.getByText('Configuración')).toBeInTheDocument();
    });

    it('renders category descriptions', () => {
      renderHelpCenter();
      expect(screen.getByText('Gestión de turnos y calendario')).toBeInTheDocument();
      expect(screen.getByText('Gestión de pacientes')).toBeInTheDocument();
      expect(screen.getByText('Gestión de pagos y facturación')).toBeInTheDocument();
      expect(screen.getByText('Personaliza la aplicación')).toBeInTheDocument();
    });

    it('renders article count for each category', () => {
      renderHelpCenter();
      // Each category shows article count (3 articles each for agenda, pacientes, cobros; 2 for config)
      const articleCountTexts = screen.getAllByText(/artículos?/);
      expect(articleCountTexts.length).toBe(4);
    });

    it('renders category icons', () => {
      renderHelpCenter();
      // Each category card has an icon container
      const iconContainers = document.querySelectorAll('.w-10.h-10.bg-indigo-100');
      expect(iconContainers.length).toBe(4);
    });

    it('category cards are clickable buttons', () => {
      renderHelpCenter();
      const categoryButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('Agenda') || 
               btn.textContent?.includes('Pacientes') ||
               btn.textContent?.includes('Cobros') ||
               btn.textContent?.includes('Configuración')
      );
      expect(categoryButtons.length).toBe(4);
    });
  });

  // ==========================================================================
  // CATEGORY NAVIGATION
  // ==========================================================================

  describe('Category Navigation', () => {
    it('shows article list when category is clicked', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const agendaCard = screen.getByRole('button', { name: /agenda/i });
      await user.click(agendaCard);

      expect(screen.getByText('Crear un turno')).toBeInTheDocument();
      expect(screen.getByText('Editar un turno')).toBeInTheDocument();
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    });

    it('shows back button in article list view', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));

      expect(screen.getByRole('button', { name: /volver a categorías/i })).toBeInTheDocument();
    });

    it('returns to categories when back button is clicked', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));
      expect(screen.getByText('Crear un turno')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /volver a categorías/i }));

      // Should see all categories again
      expect(screen.getByText('Gestión de turnos y calendario')).toBeInTheDocument();
      expect(screen.getByText('Gestión de pacientes')).toBeInTheDocument();
    });

    it('shows category title in article list view', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /pacientes/i }));

      // Category title should be displayed as heading
      const headings = screen.getAllByText('Pacientes');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // ARTICLE VIEW
  // ==========================================================================

  describe('Article View', () => {
    it('shows article content when article is clicked', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));
      await user.click(screen.getByRole('button', { name: /crear un turno/i }));

      expect(screen.getByText(/ve a la sección agenda/i)).toBeInTheDocument();
    });

    it('shows back button in article view', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));
      await user.click(screen.getByRole('button', { name: /crear un turno/i }));

      expect(screen.getByRole('button', { name: /volver a/i })).toBeInTheDocument();
    });

    it('returns to article list when back button is clicked from article', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));
      await user.click(screen.getByRole('button', { name: /crear un turno/i }));

      await user.click(screen.getByRole('button', { name: /volver a/i }));

      // Should see article list again
      expect(screen.getByText('Crear un turno')).toBeInTheDocument();
      expect(screen.getByText('Editar un turno')).toBeInTheDocument();
    });

    it('renders article title as heading', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /cobros/i }));
      await user.click(screen.getByRole('button', { name: /registrar un pago/i }));

      expect(screen.getByRole('heading', { level: 2, name: 'Registrar un pago' })).toBeInTheDocument();
    });

    it('renders related topics tags', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));
      await user.click(screen.getByRole('button', { name: /crear un turno/i }));

      expect(screen.getByText('Temas relacionados')).toBeInTheDocument();
      expect(screen.getByText('turno')).toBeInTheDocument();
      expect(screen.getByText('cita')).toBeInTheDocument();
      expect(screen.getByText('agenda')).toBeInTheDocument();
    });

    it('renders bold text formatting in content', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));
      await user.click(screen.getByRole('button', { name: /editar un turno/i }));

      // Content with **bold** should render - the mock has "**Editar turno existente**"
      // The component renders these as <p> with font-semibold class for lines that start and end with **
      const boldParagraph = screen.getByText('Editar turno existente');
      expect(boldParagraph).toHaveClass('font-semibold');
    });
  });

  // ==========================================================================
  // SEARCH FUNCTIONALITY
  // ==========================================================================

  describe('Search Functionality', () => {
    it('shows search results when typing', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      await user.type(searchInput, 'turno');

      // Should show matching articles
      await waitFor(() => {
        expect(screen.getByText('Crear un turno')).toBeInTheDocument();
      });
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      await user.type(searchInput, 'xyznonexistent');

      await waitFor(() => {
        expect(screen.getByText(/no se encontraron resultados para "xyznonexistent"/i)).toBeInTheDocument();
      });
    });

    it('clears search and shows article when result is clicked', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      await user.type(searchInput, 'pago');

      await waitFor(() => {
        expect(screen.getByText('Registrar un pago')).toBeInTheDocument();
      });

      // Click the search result
      const searchResult = screen.getByRole('button', { name: /registrar un pago/i });
      await user.click(searchResult);

      // Should show article content and clear search
      expect(screen.getByText(/registra los pagos de tus pacientes/i)).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });

    it('searches in article titles', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      await user.type(searchInput, 'Google');

      await waitFor(() => {
        expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      });
    });

    it('searches in article content', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      await user.type(searchInput, 'sincroniza');

      await waitFor(() => {
        expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      });
    });

    it('searches in article tags', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      await user.type(searchInput, 'whatsapp');

      await waitFor(() => {
        expect(screen.getByText('Enviar recordatorio')).toBeInTheDocument();
      });
    });

    it('search is case insensitive', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      await user.type(searchInput, 'PACIENTE');

      await waitFor(() => {
        expect(screen.getByText('Crear un paciente')).toBeInTheDocument();
      });
    });

    it('shows category name in search results', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      await user.type(searchInput, 'pago');

      await waitFor(() => {
        // Search results show article title and category
        const dropdown = document.querySelector('.absolute.top-full');
        expect(dropdown).toBeInTheDocument();
        // Use getAllByText since there are multiple "Cobros" entries (one per matching result)
        const categoryLabels = within(dropdown as HTMLElement).getAllByText('Cobros');
        expect(categoryLabels.length).toBeGreaterThan(0);
      });
    });

    it('does not show search results when search is empty', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      await user.type(searchInput, 'test');
      await user.clear(searchInput);

      // No dropdown should be visible
      expect(document.querySelector('.absolute.top-full')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderHelpCenter();
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Centro de Ayuda');
    });

    it('search input is accessible', () => {
      renderHelpCenter();
      
      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('category cards are keyboard accessible', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const agendaCard = screen.getByRole('button', { name: /agenda/i });
      agendaCard.focus();
      expect(agendaCard).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByText('Crear un turno')).toBeInTheDocument();
    });

    it('back button is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));
      
      const backButton = screen.getByRole('button', { name: /volver a categorías/i });
      backButton.focus();
      expect(backButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByText('Gestión de turnos y calendario')).toBeInTheDocument();
    });

    it('article buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));
      
      const articleButton = screen.getByRole('button', { name: /crear un turno/i });
      articleButton.focus();
      expect(articleButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByText(/ve a la sección agenda/i)).toBeInTheDocument();
    });

    it('email link is focusable', () => {
      renderHelpCenter();
      
      const emailLink = screen.getByRole('link', { name: 'soporte@lavenius.com' });
      emailLink.focus();
      expect(emailLink).toHaveFocus();
    });

    it('article heading has correct level in article view', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /configuración/i }));
      await user.click(screen.getByRole('button', { name: /perfil de usuario/i }));

      expect(screen.getByRole('heading', { level: 2, name: 'Perfil de usuario' })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles rapid navigation between categories', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      // Quick navigation
      await user.click(screen.getByRole('button', { name: /agenda/i }));
      await user.click(screen.getByRole('button', { name: /volver a categorías/i }));
      await user.click(screen.getByRole('button', { name: /pacientes/i }));
      await user.click(screen.getByRole('button', { name: /volver a categorías/i }));
      await user.click(screen.getByRole('button', { name: /cobros/i }));

      expect(screen.getByText('Registrar un pago')).toBeInTheDocument();
    });

    it('handles navigation from article directly back to categories', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));
      await user.click(screen.getByRole('button', { name: /crear un turno/i }));
      
      // Going back should go to article list, not categories
      await user.click(screen.getByRole('button', { name: /volver a/i }));
      expect(screen.getByText('Crear un turno')).toBeInTheDocument();
      
      // Then back to categories
      await user.click(screen.getByRole('button', { name: /volver a categorías/i }));
      expect(screen.getByText('Gestión de turnos y calendario')).toBeInTheDocument();
    });

    it('handles search with whitespace only', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      await user.type(searchInput, '   ');

      // Component shows "no results" for whitespace-only search
      // This is expected behavior - it treats whitespace as a search term with no matches
      expect(screen.getByText(/no se encontraron resultados/i)).toBeInTheDocument();
    });

    it('handles search result click and clears selection state', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      await user.type(searchInput, 'perfil');

      await waitFor(() => {
        expect(screen.getByText('Perfil de usuario')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /perfil de usuario/i }));

      // Should be in article view
      expect(screen.getByText(/actualiza tu información personal/i)).toBeInTheDocument();
      
      // Search should be cleared
      expect(searchInput).toHaveValue('');
    });

    it('handles multiple search queries', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      const searchInput = screen.getByPlaceholderText('Buscar en la ayuda...');
      
      // First search
      await user.type(searchInput, 'paciente');
      await waitFor(() => {
        expect(screen.getByText('Crear un paciente')).toBeInTheDocument();
      });

      // Clear and search again
      await user.clear(searchInput);
      await user.type(searchInput, 'google');
      
      await waitFor(() => {
        expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // CONTENT FORMATTING
  // ==========================================================================

  describe('Content Formatting', () => {
    it('renders numbered list items correctly', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));
      await user.click(screen.getByRole('button', { name: /crear un turno/i }));

      // Content has numbered steps
      expect(screen.getByText(/1\. Ve a la sección Agenda/)).toBeInTheDocument();
      expect(screen.getByText(/2\. Haz clic en "Nuevo Turno"/)).toBeInTheDocument();
    });

    it('renders article in a styled card', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /agenda/i }));
      await user.click(screen.getByRole('button', { name: /crear un turno/i }));

      // Article should be in a card with border
      const articleCard = document.querySelector('.bg-white.rounded-lg.border');
      expect(articleCard).toBeInTheDocument();
    });

    it('renders tags in styled badges', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /cobros/i }));
      await user.click(screen.getByRole('button', { name: /enviar recordatorio/i }));

      const tagBadges = document.querySelectorAll('.bg-gray-100.text-gray-600');
      expect(tagBadges.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // LAYOUT AND STYLING
  // ==========================================================================

  describe('Layout and Styling', () => {
    it('renders category cards in a grid', () => {
      renderHelpCenter();
      
      const grid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('contact section has correct styling', () => {
      renderHelpCenter();
      
      const contactSection = screen.getByText('¿No encontraste lo que buscabas?').closest('div');
      expect(contactSection).toHaveClass('bg-gray-50');
      expect(contactSection).toHaveClass('rounded-lg');
    });

    it('search input has search icon', () => {
      renderHelpCenter();
      
      // Search icon should be present in the search container
      const searchContainer = screen.getByPlaceholderText('Buscar en la ayuda...').closest('div');
      const searchIcon = searchContainer?.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });

    it('category cards have hover styles class', () => {
      renderHelpCenter();
      
      const categoryCard = screen.getByRole('button', { name: /agenda/i });
      expect(categoryCard).toHaveClass('hover:border-indigo-300');
      expect(categoryCard).toHaveClass('hover:shadow-md');
    });
  });

  // ==========================================================================
  // DIFFERENT CATEGORIES
  // ==========================================================================

  describe('Different Categories', () => {
    it('Pacientes category shows correct articles', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /pacientes/i }));

      expect(screen.getByText('Crear un paciente')).toBeInTheDocument();
      expect(screen.getByText('Ficha clínica')).toBeInTheDocument();
      expect(screen.getByText('Buscar pacientes')).toBeInTheDocument();
    });

    it('Cobros category shows correct articles', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /cobros/i }));

      expect(screen.getByText('Registrar un pago')).toBeInTheDocument();
      expect(screen.getByText('Historial de pagos')).toBeInTheDocument();
      expect(screen.getByText('Enviar recordatorio')).toBeInTheDocument();
    });

    it('Configuracion category shows correct articles', async () => {
      const user = userEvent.setup();
      renderHelpCenter();

      await user.click(screen.getByRole('button', { name: /configuración/i }));

      expect(screen.getByText('Perfil de usuario')).toBeInTheDocument();
      expect(screen.getByText('Configuración del calendario')).toBeInTheDocument();
    });
  });
});
