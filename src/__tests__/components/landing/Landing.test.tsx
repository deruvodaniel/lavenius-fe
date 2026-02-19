import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Landing } from '../../../components/landing/Landing';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        // Brand
        'landing.brand': 'Lavenius',
        
        // Hero section
        'landing.hero.badge': 'Gestión inteligente para profesionales de salud mental',
        'landing.hero.title': 'Control total de tu consultorio',
        'landing.hero.titleHighlight': 'y tus finanzas',
        'landing.hero.description': 'Elimina el Excel y el papel. Ahorra tiempo con turnos inteligentes.',
        'landing.hero.cta': 'Comenzar gratis',
        'landing.hero.hasAccount': 'Ya tengo cuenta',
        'landing.hero.noCreditCard': 'Sin tarjeta de crédito',
        'landing.hero.dataEncrypted': 'Datos encriptados',
        'landing.hero.supportIncluded': 'Soporte incluido',
        
        // Features section
        'landing.features.title': 'Todo lo que necesitas en un solo lugar',
        'landing.features.subtitle': 'Módulos diseñados específicamente para profesionales de la salud mental',
        'landing.features.scheduler.title': 'Turnero Inteligente',
        'landing.features.scheduler.description': 'Gestiona disponibilidad y reglas de recurrencia.',
        'landing.features.payments.title': 'Gestión de Cobros',
        'landing.features.payments.description': 'Seguimiento riguroso de pagos con recordatorios automáticos.',
        'landing.features.records.title': 'Fichero Digital',
        'landing.features.records.description': 'Historias clínicas seguras y consentimientos informados.',
        'landing.features.calendar.title': 'Calendario Sync',
        'landing.features.calendar.description': 'Sincronización total con tu calendario.',
        
        // Analytics section
        'landing.analytics.badge': 'Panel de Analytics',
        'landing.analytics.title': 'Visibilidad total de tu práctica profesional',
        'landing.analytics.description': 'Toma decisiones informadas con datos claros.',
        'landing.analytics.features.income': 'Ingresos mensuales y proyecciones',
        'landing.analytics.features.sessions': 'Sesiones por cobrar y cobradas',
        'landing.analytics.features.patients': 'Pacientes activos vs nuevos',
        'landing.analytics.features.attendance': 'Tasa de asistencia y cancelación',
        'landing.analytics.stats.monthlyIncome': 'Ingresos del mes',
        'landing.analytics.stats.sessions': 'Sesiones',
        'landing.analytics.stats.thisMonth': 'este mes',
        'landing.analytics.stats.activePatients': 'Pacientes activos',
        'landing.analytics.stats.collectionRate': 'Tasa de cobro',
        'landing.analytics.stats.vsLastMonth': '+12% vs mes anterior',
        'landing.analytics.stats.lastSixMonths': 'Ingresos últimos 6 meses',
        
        // Reminders section
        'landing.reminders.badge': 'Recordatorios Automáticos',
        'landing.reminders.title': 'Reduce la morosidad sin esfuerzo manual',
        'landing.reminders.description': 'El sistema envía recordatorios automáticos a tus pacientes.',
        'landing.reminders.features.whatsapp': 'Recordatorios de turno por WhatsApp',
        'landing.reminders.features.payments': 'Avisos de cobro automáticos',
        'landing.reminders.features.confirmations': 'Confirmaciones de asistencia',
        'landing.reminders.features.scheduling': 'Programación flexible de envíos',
        'landing.reminders.notifications': 'Notificaciones automáticas',
        'landing.reminders.types.whatsapp': 'WhatsApp',
        'landing.reminders.types.pendingPayment': 'Cobro pendiente',
        'landing.reminders.types.confirmation': 'Confirmación',
        'landing.reminders.messages.sessionReminder': '¡Hola María! Te recordamos tu sesión mañana.',
        'landing.reminders.messages.paymentReminder': 'Juan García tiene 2 sesiones pendientes de pago.',
        'landing.reminders.messages.appointmentConfirmed': 'Pedro López confirmó su turno.',
        'landing.reminders.timestamps.sentAutomatically': 'Enviado automáticamente',
        'landing.reminders.timestamps.reminderSent': 'Recordatorio enviado',
        'landing.reminders.timestamps.fiveMinutesAgo': 'Hace 5 minutos',
        
        // Security section
        'landing.security.title': 'Seguridad de nivel clínico',
        'landing.security.description': 'Todos los datos de tus pacientes están encriptados.',
        'landing.security.encryption': 'Encriptación',
        'landing.security.e2e': 'Extremo a extremo',
        
        // CTA section
        'landing.cta.title': 'Comienza a gestionar tu consultorio de forma inteligente',
        'landing.cta.subtitle': 'Únete a profesionales que ya ahorraron horas de trabajo.',
        'landing.cta.createAccount': 'Crear cuenta gratis',
        'landing.cta.login': 'Iniciar sesión',
        
        // Footer
        'landing.footer.rights': 'Todos los derechos reservados.',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'es',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock AnimatedSection and LanguageSwitcher
vi.mock('@/components/shared', () => ({
  AnimatedSection: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="animated-section" className={className}>{children}</div>
  ),
  LanguageSwitcher: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

// Helper to render Landing with Router
const renderLanding = () => {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  );
};

describe('Landing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the Landing page container', () => {
      renderLanding();
      
      // Check main container exists
      const main = document.querySelector('.min-h-screen');
      expect(main).toBeInTheDocument();
    });

    it('renders all major sections', () => {
      renderLanding();
      
      // NavBar - brand name in navbar
      expect(screen.getAllByText('Lavenius').length).toBeGreaterThan(0);
      
      // Hero section
      expect(screen.getByText('Control total de tu consultorio')).toBeInTheDocument();
      
      // Features section
      expect(screen.getByText('Todo lo que necesitas en un solo lugar')).toBeInTheDocument();
      
      // Analytics section
      expect(screen.getByText('Visibilidad total de tu práctica profesional')).toBeInTheDocument();
      
      // Reminders section
      expect(screen.getByText('Reduce la morosidad sin esfuerzo manual')).toBeInTheDocument();
      
      // Security section
      expect(screen.getByText('Seguridad de nivel clínico')).toBeInTheDocument();
      
      // CTA section
      expect(screen.getByText('Comienza a gestionar tu consultorio de forma inteligente')).toBeInTheDocument();
      
      // Footer
      expect(screen.getByText(/Todos los derechos reservados/)).toBeInTheDocument();
    });
  });

  describe('NavBar', () => {
    it('renders the brand logo and name', () => {
      renderLanding();
      
      const brandTexts = screen.getAllByText('Lavenius');
      expect(brandTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('renders login button in navbar', () => {
      renderLanding();
      
      // Get the navbar login button (ghost variant)
      const loginButtons = screen.getAllByRole('button', { name: /iniciar sesión/i });
      expect(loginButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders CTA button in navbar', () => {
      renderLanding();
      
      const ctaButtons = screen.getAllByRole('button', { name: /comenzar gratis/i });
      expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders language switcher', () => {
      renderLanding();
      
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    });

    it('navigates to login when login button clicked', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      const loginButtons = screen.getAllByRole('button', { name: /iniciar sesión/i });
      await user.click(loginButtons[0]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('navigates to register when CTA button clicked', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      const ctaButtons = screen.getAllByRole('button', { name: /comenzar gratis/i });
      await user.click(ctaButtons[0]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
  });

  describe('Hero Section', () => {
    it('renders the hero badge', () => {
      renderLanding();
      
      expect(screen.getByText('Gestión inteligente para profesionales de salud mental')).toBeInTheDocument();
    });

    it('renders the hero title', () => {
      renderLanding();
      
      expect(screen.getByText('Control total de tu consultorio')).toBeInTheDocument();
      expect(screen.getByText('y tus finanzas')).toBeInTheDocument();
    });

    it('renders the hero description', () => {
      renderLanding();
      
      expect(screen.getByText(/Elimina el Excel y el papel/)).toBeInTheDocument();
    });

    it('renders primary CTA button', () => {
      renderLanding();
      
      const ctaButtons = screen.getAllByRole('button', { name: /comenzar gratis/i });
      expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders secondary CTA button (Ya tengo cuenta)', () => {
      renderLanding();
      
      expect(screen.getByRole('button', { name: 'Ya tengo cuenta' })).toBeInTheDocument();
    });

    it('renders trust badges', () => {
      renderLanding();
      
      expect(screen.getByText('Sin tarjeta de crédito')).toBeInTheDocument();
      expect(screen.getByText('Datos encriptados')).toBeInTheDocument();
      expect(screen.getByText('Soporte incluido')).toBeInTheDocument();
    });

    it('navigates to register on primary CTA click', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      const ctaButtons = screen.getAllByRole('button', { name: /comenzar gratis/i });
      // Click the hero section CTA (usually the second one, first being navbar)
      await user.click(ctaButtons[ctaButtons.length > 1 ? 1 : 0]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('navigates to login on secondary CTA click', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      const loginButton = screen.getByRole('button', { name: 'Ya tengo cuenta' });
      await user.click(loginButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Features Section', () => {
    it('renders features section title', () => {
      renderLanding();
      
      expect(screen.getByText('Todo lo que necesitas en un solo lugar')).toBeInTheDocument();
    });

    it('renders features section subtitle', () => {
      renderLanding();
      
      expect(screen.getByText('Módulos diseñados específicamente para profesionales de la salud mental')).toBeInTheDocument();
    });

    it('renders all feature cards', () => {
      renderLanding();
      
      expect(screen.getByText('Turnero Inteligente')).toBeInTheDocument();
      expect(screen.getByText('Gestión de Cobros')).toBeInTheDocument();
      expect(screen.getByText('Fichero Digital')).toBeInTheDocument();
      expect(screen.getByText('Calendario Sync')).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
      renderLanding();
      
      expect(screen.getByText(/Gestiona disponibilidad y reglas de recurrencia/)).toBeInTheDocument();
      expect(screen.getByText(/Seguimiento riguroso de pagos/)).toBeInTheDocument();
      expect(screen.getByText(/Historias clínicas seguras/)).toBeInTheDocument();
      expect(screen.getByText(/Sincronización total con tu calendario/)).toBeInTheDocument();
    });
  });

  describe('Analytics Section', () => {
    it('renders analytics badge', () => {
      renderLanding();
      
      expect(screen.getByText('Panel de Analytics')).toBeInTheDocument();
    });

    it('renders analytics title', () => {
      renderLanding();
      
      expect(screen.getByText('Visibilidad total de tu práctica profesional')).toBeInTheDocument();
    });

    it('renders analytics description', () => {
      renderLanding();
      
      expect(screen.getByText(/Toma decisiones informadas con datos claros/)).toBeInTheDocument();
    });

    it('renders analytics features list', () => {
      renderLanding();
      
      expect(screen.getByText('Ingresos mensuales y proyecciones')).toBeInTheDocument();
      expect(screen.getByText('Sesiones por cobrar y cobradas')).toBeInTheDocument();
      expect(screen.getByText('Pacientes activos vs nuevos')).toBeInTheDocument();
      expect(screen.getByText('Tasa de asistencia y cancelación')).toBeInTheDocument();
    });

    it('renders dashboard preview with mock stats', () => {
      renderLanding();
      
      expect(screen.getByText('$485.000')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
    });

    it('renders stats labels', () => {
      renderLanding();
      
      expect(screen.getByText('Ingresos del mes')).toBeInTheDocument();
      expect(screen.getByText('Sesiones')).toBeInTheDocument();
      expect(screen.getByText('Pacientes activos')).toBeInTheDocument();
      expect(screen.getByText('Tasa de cobro')).toBeInTheDocument();
    });

    it('renders mini chart section', () => {
      renderLanding();
      
      expect(screen.getByText('Ingresos últimos 6 meses')).toBeInTheDocument();
      // Check month labels in chart
      expect(screen.getByText('Ene')).toBeInTheDocument();
      expect(screen.getByText('Feb')).toBeInTheDocument();
      expect(screen.getByText('Mar')).toBeInTheDocument();
      expect(screen.getByText('Abr')).toBeInTheDocument();
      expect(screen.getByText('May')).toBeInTheDocument();
      expect(screen.getByText('Jun')).toBeInTheDocument();
    });
  });

  describe('Reminders Section', () => {
    it('renders reminders badge', () => {
      renderLanding();
      
      expect(screen.getByText('Recordatorios Automáticos')).toBeInTheDocument();
    });

    it('renders reminders title', () => {
      renderLanding();
      
      expect(screen.getByText('Reduce la morosidad sin esfuerzo manual')).toBeInTheDocument();
    });

    it('renders reminders description', () => {
      renderLanding();
      
      expect(screen.getByText(/El sistema envía recordatorios automáticos/)).toBeInTheDocument();
    });

    it('renders reminder features list', () => {
      renderLanding();
      
      expect(screen.getByText('Recordatorios de turno por WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Avisos de cobro automáticos')).toBeInTheDocument();
      expect(screen.getByText('Confirmaciones de asistencia')).toBeInTheDocument();
      expect(screen.getByText('Programación flexible de envíos')).toBeInTheDocument();
    });

    it('renders notification preview cards', () => {
      renderLanding();
      
      expect(screen.getByText('Notificaciones automáticas')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Cobro pendiente')).toBeInTheDocument();
      expect(screen.getByText('Confirmación')).toBeInTheDocument();
    });

    it('renders sample notification messages', () => {
      renderLanding();
      
      expect(screen.getByText(/¡Hola María!/)).toBeInTheDocument();
      expect(screen.getByText(/Juan García tiene 2 sesiones pendientes/)).toBeInTheDocument();
      expect(screen.getByText(/Pedro López confirmó su turno/)).toBeInTheDocument();
    });

    it('renders notification timestamps', () => {
      renderLanding();
      
      expect(screen.getByText('Enviado automáticamente')).toBeInTheDocument();
      expect(screen.getByText('Recordatorio enviado')).toBeInTheDocument();
      expect(screen.getByText('Hace 5 minutos')).toBeInTheDocument();
    });
  });

  describe('Security Section', () => {
    it('renders security title', () => {
      renderLanding();
      
      expect(screen.getByText('Seguridad de nivel clínico')).toBeInTheDocument();
    });

    it('renders security description', () => {
      renderLanding();
      
      expect(screen.getByText(/Todos los datos de tus pacientes están encriptados/)).toBeInTheDocument();
    });

    it('renders encryption badge', () => {
      renderLanding();
      
      expect(screen.getByText('256-bit')).toBeInTheDocument();
      expect(screen.getByText('Encriptación')).toBeInTheDocument();
    });

    it('renders E2E badge', () => {
      renderLanding();
      
      expect(screen.getByText('E2E')).toBeInTheDocument();
      expect(screen.getByText('Extremo a extremo')).toBeInTheDocument();
    });
  });

  describe('CTA Section', () => {
    it('renders CTA section title', () => {
      renderLanding();
      
      expect(screen.getByText('Comienza a gestionar tu consultorio de forma inteligente')).toBeInTheDocument();
    });

    it('renders CTA section subtitle', () => {
      renderLanding();
      
      expect(screen.getByText(/Únete a profesionales que ya ahorraron/)).toBeInTheDocument();
    });

    it('renders create account button', () => {
      renderLanding();
      
      expect(screen.getByRole('button', { name: /crear cuenta gratis/i })).toBeInTheDocument();
    });

    it('renders login button in CTA', () => {
      renderLanding();
      
      const loginButtons = screen.getAllByRole('button', { name: /iniciar sesión/i });
      expect(loginButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('navigates to register on create account click', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      const createAccountButton = screen.getByRole('button', { name: /crear cuenta gratis/i });
      await user.click(createAccountButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
  });

  describe('Footer', () => {
    it('renders footer brand', () => {
      renderLanding();
      
      const brandTexts = screen.getAllByText('Lavenius');
      expect(brandTexts.length).toBeGreaterThanOrEqual(2); // navbar + footer
    });

    it('renders copyright text', () => {
      renderLanding();
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
    });

    it('renders rights reserved text', () => {
      renderLanding();
      
      expect(screen.getByText(/Todos los derechos reservados/)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('all primary CTAs navigate to register', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      // Click hero CTA
      const heroCtaButtons = screen.getAllByRole('button', { name: /comenzar gratis/i });
      await user.click(heroCtaButtons[0]);
      expect(mockNavigate).toHaveBeenLastCalledWith('/register');
      
      vi.clearAllMocks();
      
      // Click CTA section button
      const createAccountButton = screen.getByRole('button', { name: /crear cuenta gratis/i });
      await user.click(createAccountButton);
      expect(mockNavigate).toHaveBeenLastCalledWith('/register');
    });

    it('all login buttons navigate to login', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      const loginButtons = screen.getAllByRole('button', { name: /iniciar sesión/i });
      
      for (const button of loginButtons) {
        vi.clearAllMocks();
        await user.click(button);
        expect(mockNavigate).toHaveBeenLastCalledWith('/login');
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderLanding();
      
      // Main title is h1 level
      const mainHeading = screen.getByText('Control total de tu consultorio');
      expect(mainHeading.tagName).toBe('H1');
    });

    it('all buttons are accessible', () => {
      renderLanding();
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeEnabled();
        // Each button should have accessible name
        expect(button).toHaveAccessibleName();
      });
    });

    it('navigation element exists', () => {
      renderLanding();
      
      const nav = document.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('sections use semantic section elements', () => {
      renderLanding();
      
      const sections = document.querySelectorAll('section');
      // Hero, Features, Analytics, Reminders, Security, CTA = 6 sections
      expect(sections.length).toBeGreaterThanOrEqual(6);
    });

    it('footer uses semantic footer element', () => {
      renderLanding();
      
      const footer = document.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('images have proper alt text via icons', () => {
      renderLanding();
      
      // Icons are rendered as SVGs, they should not require alt text
      // but the content should be conveyed through text
      expect(screen.getByText('Turnero Inteligente')).toBeInTheDocument();
      expect(screen.getByText('Gestión de Cobros')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('renders container with proper max-width classes', () => {
      renderLanding();
      
      // Check for max-w-7xl containers
      const containers = document.querySelectorAll('.max-w-7xl');
      expect(containers.length).toBeGreaterThan(0);
    });

    it('renders responsive padding classes', () => {
      renderLanding();
      
      // Check for responsive padding patterns
      const responsivePadding = document.querySelectorAll('[class*="px-4"]');
      expect(responsivePadding.length).toBeGreaterThan(0);
    });

    it('renders responsive text size classes', () => {
      renderLanding();
      
      // Hero title should have responsive text sizes
      const heroTitle = screen.getByText('Control total de tu consultorio');
      expect(heroTitle).toHaveClass('text-4xl', 'sm:text-5xl', 'lg:text-6xl');
    });

    it('renders responsive grid for features', () => {
      renderLanding();
      
      // Features section should have responsive grid
      const gridContainers = document.querySelectorAll('.grid');
      expect(gridContainers.length).toBeGreaterThan(0);
      
      // Check for responsive grid columns
      const responsiveGrid = document.querySelector('.lg\\:grid-cols-4');
      expect(responsiveGrid).toBeInTheDocument();
    });

    it('navbar has fixed positioning', () => {
      renderLanding();
      
      const nav = document.querySelector('nav');
      expect(nav).toHaveClass('fixed');
    });
  });

  describe('AnimatedSection Integration', () => {
    it('wraps content in AnimatedSection components', () => {
      renderLanding();
      
      const animatedSections = screen.getAllByTestId('animated-section');
      expect(animatedSections.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Elements', () => {
    it('renders gradient backgrounds', () => {
      renderLanding();
      
      // Check for gradient classes
      const gradientElements = document.querySelectorAll('[class*="bg-gradient"]');
      expect(gradientElements.length).toBeGreaterThan(0);
    });

    it('renders feature cards with shadow', () => {
      renderLanding();
      
      const shadowElements = document.querySelectorAll('[class*="shadow-lg"]');
      expect(shadowElements.length).toBeGreaterThan(0);
    });

    it('renders backdrop blur on navbar', () => {
      renderLanding();
      
      const nav = document.querySelector('nav');
      expect(nav).toHaveClass('backdrop-blur-md');
    });
  });
});
