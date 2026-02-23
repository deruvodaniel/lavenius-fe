import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Landing } from '../../../components/landing/Landing';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ============================================================================
// CLERK MOCK SETUP
// ============================================================================

let mockAuthState = {
  isSignedIn: false,
  isLoaded: true,
};

const mockOpenSignIn = vi.fn();
const mockOpenSignUp = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
  useAuth: vi.fn(() => ({
    isSignedIn: mockAuthState.isSignedIn,
    isLoaded: mockAuthState.isLoaded,
  })),
  SignedIn: ({ children }: { children: React.ReactNode }) => 
    mockAuthState.isSignedIn && mockAuthState.isLoaded ? <>{children}</> : null,
  SignedOut: ({ children }: { children: React.ReactNode }) => 
    !mockAuthState.isSignedIn && mockAuthState.isLoaded ? <>{children}</> : null,
  SignInButton: ({ children, mode }: { children?: React.ReactNode; mode?: string }) => {
    if (children) {
      return <div onClick={mockOpenSignIn}>{children}</div>;
    }
    return (
      <button data-testid="clerk-sign-in-button" data-mode={mode} onClick={mockOpenSignIn}>
        Sign In
      </button>
    );
  },
  SignUpButton: ({ children, mode }: { children?: React.ReactNode; mode?: string }) => {
    if (children) {
      return <div onClick={mockOpenSignUp}>{children}</div>;
    }
    return (
      <button data-testid="clerk-sign-up-button" data-mode={mode} onClick={mockOpenSignUp}>
        Sign Up
      </button>
    );
  },
  UserButton: ({ afterSignOutUrl }: { afterSignOutUrl?: string }) => (
    <div data-testid="clerk-user-button" data-after-sign-out-url={afterSignOutUrl}>
      <button aria-label="User menu">User</button>
    </div>
  ),
}));

// Mock react-i18next with complete translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        // Brand
        'landing.brand': 'Lavenius',
        
        // Nav
        'landing.nav.features': 'Funcionalidades',
        'landing.nav.pricing': 'Precios',
        'landing.nav.faq': 'FAQ',
        'landing.nav.dashboard': 'Dashboard',
        
        // Hero section
        'landing.hero.badge': 'Gestion inteligente para profesionales de salud mental',
        'landing.hero.title': 'Control total de tu consultorio',
        'landing.hero.titleHighlight': 'y tus finanzas',
        'landing.hero.description': 'Elimina el Excel y el papel. Ahorra tiempo con turnos inteligentes.',
        'landing.hero.cta': 'Comenzar gratis',
        'landing.hero.hasAccount': 'Ya tengo cuenta',
        'landing.hero.noCreditCard': 'Sin tarjeta de credito',
        'landing.hero.dataEncrypted': 'Datos encriptados',
        'landing.hero.supportIncluded': 'Soporte incluido',
        'landing.hero.preview.income': 'Ingresos',
        'landing.hero.preview.sessions': 'Sesiones',
        'landing.hero.preview.patients': 'Pacientes',
        'landing.hero.preview.thisMonth': 'este mes',
        'landing.hero.preview.active': 'activos',
        'landing.hero.preview.todayAgenda': 'Agenda de hoy',
        'landing.hero.preview.appointments': 'turnos',
        'landing.hero.preview.pendingPayment': '2 cobros pendientes por $24.000',
        
        // Features section
        'landing.features.title': 'Todo lo que necesitas en un solo lugar',
        'landing.features.subtitle': 'Modulos disenados especificamente para profesionales de la salud mental',
        'landing.features.scheduler.title': 'Turnero Inteligente',
        'landing.features.scheduler.description': 'Gestiona disponibilidad y reglas de recurrencia.',
        'landing.features.payments.title': 'Gestion de Cobros',
        'landing.features.payments.description': 'Seguimiento riguroso de pagos con recordatorios automaticos.',
        'landing.features.records.title': 'Fichero Digital',
        'landing.features.records.description': 'Historias clinicas seguras y consentimientos informados.',
        'landing.features.calendar.title': 'Calendario Sync',
        'landing.features.calendar.description': 'Sincronizacion total con tu calendario.',
        
        // Analytics section
        'landing.analytics.badge': 'Panel de Analytics',
        'landing.analytics.title': 'Visibilidad total de tu practica profesional',
        'landing.analytics.description': 'Toma decisiones informadas con datos claros.',
        'landing.analytics.features.income': 'Ingresos mensuales y proyecciones',
        'landing.analytics.features.sessions': 'Sesiones por cobrar y cobradas',
        'landing.analytics.features.patients': 'Pacientes activos vs nuevos',
        'landing.analytics.features.attendance': 'Tasa de asistencia y cancelacion',
        'landing.analytics.stats.monthlyIncome': 'Ingresos del mes',
        'landing.analytics.stats.sessions': 'Sesiones',
        'landing.analytics.stats.thisMonth': 'este mes',
        'landing.analytics.stats.activePatients': 'Pacientes activos',
        'landing.analytics.stats.collectionRate': 'Tasa de cobro',
        'landing.analytics.stats.vsLastMonth': '+12% vs mes anterior',
        'landing.analytics.stats.lastSixMonths': 'Ingresos ultimos 6 meses',
        
        // Reminders section
        'landing.reminders.badge': 'Recordatorios Automaticos',
        'landing.reminders.title': 'Reduce la morosidad sin esfuerzo manual',
        'landing.reminders.description': 'El sistema envia recordatorios automaticos a tus pacientes.',
        'landing.reminders.features.whatsapp': 'Recordatorios de turno por WhatsApp',
        'landing.reminders.features.payments': 'Avisos de cobro automaticos',
        'landing.reminders.features.confirmations': 'Confirmaciones de asistencia',
        'landing.reminders.features.scheduling': 'Programacion flexible de envios',
        'landing.reminders.notifications': 'Notificaciones automaticas',
        'landing.reminders.types.whatsapp': 'WhatsApp',
        'landing.reminders.types.pendingPayment': 'Cobro pendiente',
        'landing.reminders.types.confirmation': 'Confirmacion',
        'landing.reminders.messages.sessionReminder': 'Hola Maria! Te recordamos tu sesion manana.',
        'landing.reminders.messages.paymentReminder': 'Juan Garcia tiene 2 sesiones pendientes de pago.',
        'landing.reminders.messages.appointmentConfirmed': 'Pedro Lopez confirmo su turno.',
        'landing.reminders.timestamps.sentAutomatically': 'Enviado automaticamente',
        'landing.reminders.timestamps.reminderSent': 'Recordatorio enviado',
        'landing.reminders.timestamps.fiveMinutesAgo': 'Hace 5 minutos',
        
        // Security section
        'landing.security.title': 'Seguridad de nivel clinico',
        'landing.security.description': 'Todos los datos de tus pacientes estan encriptados.',
        'landing.security.encryption': 'Encriptacion',
        'landing.security.e2e': 'Extremo a extremo',
        
        // Social Proof section
        'landing.socialProof.badge': 'Comunidad',
        'landing.socialProof.title': 'Profesionales que confian en nosotros',
        'landing.socialProof.stats.professionalsLabel': 'Profesionales',
        'landing.socialProof.stats.sessionsLabel': 'Sesiones gestionadas',
        'landing.socialProof.stats.collectedLabel': 'Cobrado',
        'landing.socialProof.testimonials.1.quote': 'Lavenius me ahorra horas de trabajo administrativo.',
        'landing.socialProof.testimonials.1.name': 'Dra. Maria Garcia',
        'landing.socialProof.testimonials.1.role': 'Psicologa Clinica',
        'landing.socialProof.testimonials.2.quote': 'La gestion de cobros es excelente.',
        'landing.socialProof.testimonials.2.name': 'Dr. Carlos Lopez',
        'landing.socialProof.testimonials.2.role': 'Psiquiatra',
        'landing.socialProof.testimonials.3.quote': 'Por fin puedo enfocarme en mis pacientes.',
        'landing.socialProof.testimonials.3.name': 'Lic. Ana Martinez',
        'landing.socialProof.testimonials.3.role': 'Psicoanalista',
        
        // Why Lavenius section
        'landing.whyLavenius.badge': 'Por que elegirnos',
        'landing.whyLavenius.title': 'Por que Lavenius',
        'landing.whyLavenius.subtitle': 'Disenado por y para profesionales de la salud mental',
        'landing.whyLavenius.features.unlimited.title': 'Pacientes ilimitados',
        'landing.whyLavenius.features.unlimited.description': 'Sin limites en la cantidad de pacientes.',
        'landing.whyLavenius.features.unlimited.highlight': 'Sin limites',
        'landing.whyLavenius.features.encryption.title': 'Encriptacion total',
        'landing.whyLavenius.features.encryption.description': 'Datos protegidos con encriptacion de grado clinico.',
        'landing.whyLavenius.features.encryption.highlight': '256-bit',
        'landing.whyLavenius.features.localPricing.title': 'Precios locales',
        'landing.whyLavenius.features.localPricing.description': 'Paga en tu moneda local.',
        'landing.whyLavenius.features.localPricing.highlight': 'ARS/USD',
        'landing.whyLavenius.features.noContracts.title': 'Sin contratos',
        'landing.whyLavenius.features.noContracts.description': 'Cancela cuando quieras.',
        'landing.whyLavenius.features.noContracts.highlight': 'Flexible',
        
        // FAQ section
        'landing.faq.badge': 'Preguntas frecuentes',
        'landing.faq.title': 'Preguntas Frecuentes',
        'landing.faq.subtitle': 'Todo lo que necesitas saber',
        'landing.faq.questions.security.question': 'Como se protegen mis datos?',
        'landing.faq.questions.security.answer': 'Utilizamos encriptacion AES-256 y cumplimos con normativas de proteccion de datos.',
        'landing.faq.questions.cancel.question': 'Puedo cancelar en cualquier momento?',
        'landing.faq.questions.cancel.answer': 'Si, puedes cancelar tu suscripcion cuando quieras sin penalidades.',
        'landing.faq.questions.modality.question': 'Sirve para sesiones online?',
        'landing.faq.questions.modality.answer': 'Si, Lavenius soporta tanto sesiones presenciales como online.',
        'landing.faq.questions.patientLimit.question': 'Hay limite de pacientes?',
        'landing.faq.questions.patientLimit.answer': 'No, todos los planes incluyen pacientes ilimitados.',
        'landing.faq.questions.trial.question': 'Hay periodo de prueba?',
        'landing.faq.questions.trial.answer': 'Si, ofrecemos 14 dias de prueba gratuita sin tarjeta de credito.',
        'landing.faq.questions.support.question': 'Que soporte ofrecen?',
        'landing.faq.questions.support.answer': 'Soporte por email y chat en horario laboral.',
        
        // Pricing section
        'landing.pricing.badge': 'Precios',
        'landing.pricing.title': 'Planes simples y transparentes',
        'landing.pricing.subtitle': 'Elige el plan que mejor se adapte a tus necesidades',
        'landing.pricing.period': '/mes',
        'landing.pricing.popular': 'Mas popular',
        'landing.pricing.cta': 'Comenzar',
        'landing.pricing.plans.basic.name': 'Basico',
        'landing.pricing.plans.basic.price': '$9.900',
        'landing.pricing.plans.basic.description': 'Para comenzar',
        'landing.pricing.plans.basic.features.patients': 'Pacientes ilimitados',
        'landing.pricing.plans.basic.features.agenda': 'Agenda completa',
        'landing.pricing.plans.basic.features.clinicalFiles': 'Fichas clinicas',
        'landing.pricing.plans.basic.features.payments': 'Gestion de cobros',
        'landing.pricing.plans.basic.features.googleCalendar': 'Sync Google Calendar',
        'landing.pricing.plans.basic.features.encryption': 'Encriptacion AES-256',
        'landing.pricing.plans.basic.notIncluded.whatsapp': 'Recordatorios WhatsApp',
        'landing.pricing.plans.basic.notIncluded.analytics': 'Analytics avanzados',
        'landing.pricing.plans.basic.notIncluded.ai': 'Asistente IA',
        'landing.pricing.plans.professional.name': 'Profesional',
        'landing.pricing.plans.professional.price': '$14.900',
        'landing.pricing.plans.professional.description': 'El mas completo',
        'landing.pricing.plans.professional.features.allBasic': 'Todo lo del plan Basico',
        'landing.pricing.plans.professional.features.whatsapp': 'Recordatorios WhatsApp',
        'landing.pricing.plans.professional.features.analytics': 'Analytics avanzados',
        'landing.pricing.plans.professional.features.paymentTracking': 'Seguimiento de cobros',
        'landing.pricing.plans.professional.features.reports': 'Reportes detallados',
        'landing.pricing.plans.professional.features.prioritySupport': 'Soporte prioritario',
        'landing.pricing.plans.professional.notIncluded.ai': 'Asistente IA',
        'landing.pricing.plans.premium.name': 'Premium',
        'landing.pricing.plans.premium.price': '$24.900',
        'landing.pricing.plans.premium.description': 'Para clinicas',
        'landing.pricing.plans.premium.features.allProfessional': 'Todo lo del plan Profesional',
        'landing.pricing.plans.premium.features.aiNotes': 'Notas con IA',
        'landing.pricing.plans.premium.features.aiSummaries': 'Resumenes automaticos',
        'landing.pricing.plans.premium.features.customBranding': 'Branding personalizado',
        'landing.pricing.plans.premium.features.apiAccess': 'Acceso API',
        'landing.pricing.plans.premium.features.dedicatedSupport': 'Soporte dedicado',
        'landing.pricing.trustBadges.encryption': 'Encriptacion de grado clinico',
        'landing.pricing.trustBadges.cancelAnytime': 'Cancela cuando quieras',
        'landing.pricing.trustBadges.freeTrial': '14 dias de prueba gratis',
        
        // CTA section
        'landing.cta.title': 'Comienza a gestionar tu consultorio de forma inteligente',
        'landing.cta.subtitle': 'Unete a profesionales que ya ahorraron horas de trabajo.',
        'landing.cta.createAccount': 'Crear cuenta gratis',
        'landing.cta.login': 'Iniciar sesion',
        
        // Footer
        'landing.footer.rights': 'Todos los derechos reservados.',
      };
      return translations[key] || fallback || key;
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

// ============================================================================
// INTERSECTION OBSERVER MOCK
// ============================================================================

let intersectionCallback: IntersectionObserverCallback | null = null;
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

const setupIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn((callback: IntersectionObserverCallback) => {
    intersectionCallback = callback;
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    };
  });
  
  vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
};

const triggerIntersection = (element: Element, isIntersecting: boolean) => {
  if (intersectionCallback) {
    intersectionCallback(
      [{ isIntersecting, target: element } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
  }
};

// ============================================================================
// TEST HELPER
// ============================================================================

const renderLanding = () => {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('Landing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = { isSignedIn: false, isLoaded: true };
    setupIntersectionObserver();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // ==========================================================================
  // BASIC RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders the Landing page container', () => {
      renderLanding();
      
      const main = document.querySelector('.min-h-screen');
      expect(main).toBeInTheDocument();
    });

    it('renders all major sections', () => {
      renderLanding();
      
      // NavBar - brand name
      expect(screen.getAllByText('Lavenius').length).toBeGreaterThan(0);
      
      // Hero section
      expect(screen.getByText('Control total de tu consultorio')).toBeInTheDocument();
      
      // Features section
      expect(screen.getByText('Todo lo que necesitas en un solo lugar')).toBeInTheDocument();
      
      // Analytics section
      expect(screen.getByText('Visibilidad total de tu practica profesional')).toBeInTheDocument();
      
      // Reminders section
      expect(screen.getByText('Reduce la morosidad sin esfuerzo manual')).toBeInTheDocument();
      
      // Security section
      expect(screen.getByText('Seguridad de nivel clinico')).toBeInTheDocument();
      
      // Social Proof section
      expect(screen.getByText('Profesionales que confian en nosotros')).toBeInTheDocument();
      
      // Why Lavenius section
      expect(screen.getByText('Por que Lavenius')).toBeInTheDocument();
      
      // FAQ section
      expect(screen.getByText('Preguntas Frecuentes')).toBeInTheDocument();
      
      // Pricing section
      expect(screen.getByText('Planes simples y transparentes')).toBeInTheDocument();
      
      // CTA section
      expect(screen.getByText('Comienza a gestionar tu consultorio de forma inteligente')).toBeInTheDocument();
      
      // Footer
      expect(screen.getByText(/Todos los derechos reservados/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // NAVBAR TESTS
  // ==========================================================================

  describe('NavBar', () => {
    it('renders the brand logo and name', () => {
      renderLanding();
      
      const brandTexts = screen.getAllByText('Lavenius');
      expect(brandTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('renders navigation links on desktop', () => {
      renderLanding();
      
      expect(screen.getByRole('button', { name: 'Funcionalidades' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Precios' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'FAQ' })).toBeInTheDocument();
    });

    it('renders mobile menu toggle button', () => {
      renderLanding();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('opens mobile menu when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(menuButton);
      
      // Mobile menu should show navigation links
      const mobileNav = document.querySelector('.md\\:hidden.py-4');
      expect(mobileNav).toBeInTheDocument();
    });

    it('closes mobile menu when navigation link is clicked', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      // Mock scrollIntoView
      const mockScrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;
      
      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(menuButton);
      
      // Click a navigation link in mobile menu
      const mobileNavLinks = document.querySelectorAll('.md\\:hidden.py-4 button');
      expect(mobileNavLinks.length).toBeGreaterThan(0);
      
      await user.click(mobileNavLinks[0]);
      
      // Menu should close
      const mobileNav = document.querySelector('.md\\:hidden.py-4');
      expect(mobileNav).not.toBeInTheDocument();
    });

    it('scrolls to section when navigation link is clicked', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      // Mock scrollIntoView
      const mockScrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;
      
      // Click Features link
      const featuresButton = screen.getByRole('button', { name: 'Funcionalidades' });
      await user.click(featuresButton);
      
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    it('renders language switcher', () => {
      renderLanding();
      
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    });

    describe('when signed out', () => {
      beforeEach(() => {
        mockAuthState = { isSignedIn: false, isLoaded: true };
      });

      it('renders Sign In and Sign Up buttons via Clerk', () => {
        renderLanding();
        
        // The CTA button wraps SignUpButton
        const ctaButtons = screen.getAllByRole('button', { name: /comenzar gratis/i });
        expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('when signed in', () => {
      beforeEach(() => {
        mockAuthState = { isSignedIn: true, isLoaded: true };
      });

      it('renders Dashboard button(s)', () => {
        renderLanding();
        
        // Dashboard button appears in navbar and sticky CTA
        const dashboardButtons = screen.getAllByRole('button', { name: 'Dashboard' });
        expect(dashboardButtons.length).toBeGreaterThanOrEqual(1);
      });

      it('renders UserButton', () => {
        renderLanding();
        
        expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument();
      });

      it('navigates to dashboard when Dashboard button clicked', async () => {
        const user = userEvent.setup();
        renderLanding();
        
        // Get the first (navbar) Dashboard button
        const dashboardButtons = screen.getAllByRole('button', { name: 'Dashboard' });
        await user.click(dashboardButtons[0]);
        
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  // ==========================================================================
  // HERO SECTION TESTS
  // ==========================================================================

  describe('Hero Section', () => {
    it('renders the hero badge', () => {
      renderLanding();
      
      expect(screen.getByText('Gestion inteligente para profesionales de salud mental')).toBeInTheDocument();
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
      
      expect(screen.getByText('Sin tarjeta de credito')).toBeInTheDocument();
      expect(screen.getByText('Datos encriptados')).toBeInTheDocument();
      expect(screen.getByText('Soporte incluido')).toBeInTheDocument();
    });

    it('renders dashboard preview mockup', () => {
      renderLanding();
      
      // Browser chrome elements
      expect(screen.getByText('app.lavenius.com')).toBeInTheDocument();
      
      // Stats preview - values appear in both Hero and Analytics sections
      const incomeElements = screen.getAllByText('$485.000');
      expect(incomeElements.length).toBeGreaterThanOrEqual(1);
      
      // "42" and "18" may appear multiple times
      const sessionsElements = screen.getAllByText('42');
      expect(sessionsElements.length).toBeGreaterThanOrEqual(1);
      
      const patientsElements = screen.getAllByText('18');
      expect(patientsElements.length).toBeGreaterThanOrEqual(1);
      
      // Agenda preview - names are hardcoded with accents
      expect(screen.getByText('Agenda de hoy')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
      expect(screen.getByText('Ana Martínez')).toBeInTheDocument();
    });

    it('navigates to register on primary CTA click', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      const ctaButtons = screen.getAllByRole('button', { name: /comenzar gratis/i });
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

  // ==========================================================================
  // FEATURES SECTION TESTS
  // ==========================================================================

  describe('Features Section', () => {
    it('renders features section title', () => {
      renderLanding();
      
      expect(screen.getByText('Todo lo que necesitas en un solo lugar')).toBeInTheDocument();
    });

    it('renders features section subtitle', () => {
      renderLanding();
      
      expect(screen.getByText('Modulos disenados especificamente para profesionales de la salud mental')).toBeInTheDocument();
    });

    it('renders all feature cards', () => {
      renderLanding();
      
      expect(screen.getByText('Turnero Inteligente')).toBeInTheDocument();
      expect(screen.getByText('Gestion de Cobros')).toBeInTheDocument();
      expect(screen.getByText('Fichero Digital')).toBeInTheDocument();
      expect(screen.getByText('Calendario Sync')).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
      renderLanding();
      
      expect(screen.getByText(/Gestiona disponibilidad y reglas de recurrencia/)).toBeInTheDocument();
      expect(screen.getByText(/Seguimiento riguroso de pagos/)).toBeInTheDocument();
      expect(screen.getByText(/Historias clinicas seguras/)).toBeInTheDocument();
      expect(screen.getByText(/Sincronizacion total con tu calendario/)).toBeInTheDocument();
    });

    it('has features section with correct ID for navigation', () => {
      renderLanding();
      
      const featuresSection = document.getElementById('features');
      expect(featuresSection).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ANALYTICS SECTION TESTS
  // ==========================================================================

  describe('Analytics Section', () => {
    it('renders analytics badge', () => {
      renderLanding();
      
      expect(screen.getByText('Panel de Analytics')).toBeInTheDocument();
    });

    it('renders analytics title', () => {
      renderLanding();
      
      expect(screen.getByText('Visibilidad total de tu practica profesional')).toBeInTheDocument();
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
      expect(screen.getByText('Tasa de asistencia y cancelacion')).toBeInTheDocument();
    });

    it('renders dashboard preview with mock stats', () => {
      renderLanding();
      
      // Stats appear in multiple places - use getAllBy
      const incomeElements = screen.getAllByText('$485.000');
      expect(incomeElements.length).toBeGreaterThanOrEqual(1);
      
      const sessionsElements = screen.getAllByText('42');
      expect(sessionsElements.length).toBeGreaterThanOrEqual(1);
      
      const patientsElements = screen.getAllByText('18');
      expect(patientsElements.length).toBeGreaterThanOrEqual(1);
      
      expect(screen.getByText('94%')).toBeInTheDocument();
    });

    it('renders mini chart section', () => {
      renderLanding();
      
      expect(screen.getByText('Ingresos ultimos 6 meses')).toBeInTheDocument();
      // Check month labels in chart
      expect(screen.getByText('Ene')).toBeInTheDocument();
      expect(screen.getByText('Feb')).toBeInTheDocument();
      expect(screen.getByText('Mar')).toBeInTheDocument();
      expect(screen.getByText('Abr')).toBeInTheDocument();
      expect(screen.getByText('May')).toBeInTheDocument();
      expect(screen.getByText('Jun')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // REMINDERS SECTION TESTS
  // ==========================================================================

  describe('Reminders Section', () => {
    it('renders reminders badge', () => {
      renderLanding();
      
      expect(screen.getByText('Recordatorios Automaticos')).toBeInTheDocument();
    });

    it('renders reminders title', () => {
      renderLanding();
      
      expect(screen.getByText('Reduce la morosidad sin esfuerzo manual')).toBeInTheDocument();
    });

    it('renders reminders description', () => {
      renderLanding();
      
      expect(screen.getByText(/El sistema envia recordatorios automaticos/)).toBeInTheDocument();
    });

    it('renders reminder features list', () => {
      renderLanding();
      
      expect(screen.getByText('Recordatorios de turno por WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Avisos de cobro automaticos')).toBeInTheDocument();
      expect(screen.getByText('Confirmaciones de asistencia')).toBeInTheDocument();
      expect(screen.getByText('Programacion flexible de envios')).toBeInTheDocument();
    });

    it('renders notification preview cards', () => {
      renderLanding();
      
      expect(screen.getByText('Notificaciones automaticas')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Cobro pendiente')).toBeInTheDocument();
      expect(screen.getByText('Confirmacion')).toBeInTheDocument();
    });

    it('renders sample notification messages', () => {
      renderLanding();
      
      expect(screen.getByText(/Hola Maria!/)).toBeInTheDocument();
      expect(screen.getByText(/Juan Garcia tiene 2 sesiones pendientes/)).toBeInTheDocument();
      expect(screen.getByText(/Pedro Lopez confirmo su turno/)).toBeInTheDocument();
    });

    it('renders notification timestamps', () => {
      renderLanding();
      
      expect(screen.getByText('Enviado automaticamente')).toBeInTheDocument();
      expect(screen.getByText('Recordatorio enviado')).toBeInTheDocument();
      expect(screen.getByText('Hace 5 minutos')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SECURITY SECTION TESTS
  // ==========================================================================

  describe('Security Section', () => {
    it('renders security title', () => {
      renderLanding();
      
      expect(screen.getByText('Seguridad de nivel clinico')).toBeInTheDocument();
    });

    it('renders security description', () => {
      renderLanding();
      
      expect(screen.getByText(/Todos los datos de tus pacientes estan encriptados/)).toBeInTheDocument();
    });

    it('renders encryption badge', () => {
      renderLanding();
      
      // "256-bit" appears in both Security and WhyLavenius sections
      const encryptionBits = screen.getAllByText('256-bit');
      expect(encryptionBits.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Encriptacion')).toBeInTheDocument();
    });

    it('renders E2E badge', () => {
      renderLanding();
      
      expect(screen.getByText('E2E')).toBeInTheDocument();
      expect(screen.getByText('Extremo a extremo')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SOCIAL PROOF SECTION TESTS
  // ==========================================================================

  describe('Social Proof Section', () => {
    it('renders social proof badge', () => {
      renderLanding();
      
      expect(screen.getByText('Comunidad')).toBeInTheDocument();
    });

    it('renders social proof title', () => {
      renderLanding();
      
      expect(screen.getByText('Profesionales que confian en nosotros')).toBeInTheDocument();
    });

    it('renders stat cards', () => {
      renderLanding();
      
      expect(screen.getByText('Profesionales')).toBeInTheDocument();
      expect(screen.getByText('Sesiones gestionadas')).toBeInTheDocument();
      expect(screen.getByText('Cobrado')).toBeInTheDocument();
    });

    it('renders testimonials', () => {
      renderLanding();
      
      // Testimonial quotes - use regex for partial match as text may be split by elements
      expect(screen.getByText(/Lavenius me ahorra horas/)).toBeInTheDocument();
      expect(screen.getByText(/gestion de cobros es excelente/i)).toBeInTheDocument();
      expect(screen.getByText(/puedo enfocarme en mis pacientes/i)).toBeInTheDocument();
    });

    it('renders testimonial authors', () => {
      renderLanding();
      
      expect(screen.getByText('Dra. Maria Garcia')).toBeInTheDocument();
      expect(screen.getByText('Psicologa Clinica')).toBeInTheDocument();
      expect(screen.getByText('Dr. Carlos Lopez')).toBeInTheDocument();
      expect(screen.getByText('Psiquiatra')).toBeInTheDocument();
      expect(screen.getByText('Lic. Ana Martinez')).toBeInTheDocument();
      expect(screen.getByText('Psicoanalista')).toBeInTheDocument();
    });

    it('renders star ratings for testimonials', () => {
      renderLanding();
      
      // Each testimonial has 5 stars, so 15 total
      const stars = document.querySelectorAll('.fill-amber-400');
      expect(stars.length).toBe(15);
    });
  });

  // ==========================================================================
  // WHY LAVENIUS SECTION TESTS
  // ==========================================================================

  describe('Why Lavenius Section', () => {
    it('renders section badge', () => {
      renderLanding();
      
      expect(screen.getByText('Por que elegirnos')).toBeInTheDocument();
    });

    it('renders section title', () => {
      renderLanding();
      
      expect(screen.getByText('Por que Lavenius')).toBeInTheDocument();
    });

    it('renders section subtitle', () => {
      renderLanding();
      
      expect(screen.getByText('Disenado por y para profesionales de la salud mental')).toBeInTheDocument();
    });

    it('renders all feature cards', () => {
      renderLanding();
      
      // "Pacientes ilimitados" appears in both WhyLavenius and Pricing sections
      const pacientesElements = screen.getAllByText('Pacientes ilimitados');
      expect(pacientesElements.length).toBeGreaterThanOrEqual(1);
      
      expect(screen.getByText('Encriptacion total')).toBeInTheDocument();
      expect(screen.getByText('Precios locales')).toBeInTheDocument();
      expect(screen.getByText('Sin contratos')).toBeInTheDocument();
    });

    it('renders feature highlights', () => {
      renderLanding();
      
      expect(screen.getByText('Sin limites')).toBeInTheDocument();
      // Note: "256-bit" appears in multiple sections
      expect(screen.getAllByText('256-bit').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('ARS/USD')).toBeInTheDocument();
      expect(screen.getByText('Flexible')).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
      renderLanding();
      
      expect(screen.getByText('Sin limites en la cantidad de pacientes.')).toBeInTheDocument();
      expect(screen.getByText('Datos protegidos con encriptacion de grado clinico.')).toBeInTheDocument();
      expect(screen.getByText('Paga en tu moneda local.')).toBeInTheDocument();
      expect(screen.getByText('Cancela cuando quieras.')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FAQ SECTION TESTS
  // ==========================================================================

  describe('FAQ Section', () => {
    it('renders FAQ badge', () => {
      renderLanding();
      
      expect(screen.getByText('Preguntas frecuentes')).toBeInTheDocument();
    });

    it('renders FAQ title', () => {
      renderLanding();
      
      expect(screen.getByText('Preguntas Frecuentes')).toBeInTheDocument();
    });

    it('renders FAQ subtitle', () => {
      renderLanding();
      
      expect(screen.getByText('Todo lo que necesitas saber')).toBeInTheDocument();
    });

    it('has FAQ section with correct ID for navigation', () => {
      renderLanding();
      
      const faqSection = document.getElementById('faq');
      expect(faqSection).toBeInTheDocument();
    });

    it('renders all FAQ questions', () => {
      renderLanding();
      
      expect(screen.getByText('Como se protegen mis datos?')).toBeInTheDocument();
      expect(screen.getByText('Puedo cancelar en cualquier momento?')).toBeInTheDocument();
      expect(screen.getByText('Sirve para sesiones online?')).toBeInTheDocument();
      expect(screen.getByText('Hay limite de pacientes?')).toBeInTheDocument();
      expect(screen.getByText('Hay periodo de prueba?')).toBeInTheDocument();
      expect(screen.getByText('Que soporte ofrecen?')).toBeInTheDocument();
    });

    it('expands accordion item when clicked', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      // Find the first FAQ question trigger
      const firstQuestion = screen.getByText('Como se protegen mis datos?');
      await user.click(firstQuestion);
      
      // Answer should be visible
      await waitFor(() => {
        expect(screen.getByText(/Utilizamos encriptacion AES-256/)).toBeInTheDocument();
      });
    });

    it('collapses accordion item when clicked again', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      // Click to expand
      const firstQuestion = screen.getByText('Como se protegen mis datos?');
      await user.click(firstQuestion);
      
      await waitFor(() => {
        expect(screen.getByText(/Utilizamos encriptacion AES-256/)).toBeInTheDocument();
      });
      
      // Click to collapse
      await user.click(firstQuestion);
      
      // Wait for collapse animation - content may be hidden or removed from DOM
      await waitFor(() => {
        const answer = screen.queryByText(/Utilizamos encriptacion AES-256/);
        // When collapsed, element is either removed from DOM (null) or hidden
        expect(answer === null || !answer.checkVisibility()).toBe(true);
      });
    });

    it('only one accordion item is expanded at a time', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      // Click first question
      const firstQuestion = screen.getByText('Como se protegen mis datos?');
      await user.click(firstQuestion);
      
      await waitFor(() => {
        expect(screen.getByText(/Utilizamos encriptacion AES-256/)).toBeInTheDocument();
      });
      
      // Click second question
      const secondQuestion = screen.getByText('Puedo cancelar en cualquier momento?');
      await user.click(secondQuestion);
      
      await waitFor(() => {
        expect(screen.getByText(/puedes cancelar tu suscripcion/)).toBeInTheDocument();
      });
      
      // First answer should no longer be visible (either removed or hidden)
      await waitFor(() => {
        const firstAnswer = screen.queryByText(/Utilizamos encriptacion AES-256/);
        // When collapsed, element is either removed from DOM (null) or hidden
        expect(firstAnswer === null || !firstAnswer.checkVisibility()).toBe(true);
      });
    });
  });

  // ==========================================================================
  // PRICING SECTION TESTS
  // ==========================================================================

  describe('Pricing Section', () => {
    it('renders pricing badge', () => {
      renderLanding();
      
      // "Precios" appears in nav and as badge - check that at least one exists
      const preciosElements = screen.getAllByText('Precios');
      expect(preciosElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders pricing title', () => {
      renderLanding();
      
      expect(screen.getByText('Planes simples y transparentes')).toBeInTheDocument();
    });

    it('renders pricing subtitle', () => {
      renderLanding();
      
      expect(screen.getByText('Elige el plan que mejor se adapte a tus necesidades')).toBeInTheDocument();
    });

    it('has pricing section with correct ID for navigation', () => {
      renderLanding();
      
      const pricingSection = document.getElementById('pricing');
      expect(pricingSection).toBeInTheDocument();
    });

    it('renders all plan cards', () => {
      renderLanding();
      
      expect(screen.getByText('Basico')).toBeInTheDocument();
      expect(screen.getByText('Profesional')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('renders plan prices', () => {
      renderLanding();
      
      expect(screen.getByText('$9.900')).toBeInTheDocument();
      expect(screen.getByText('$14.900')).toBeInTheDocument();
      expect(screen.getByText('$24.900')).toBeInTheDocument();
    });

    it('renders plan descriptions', () => {
      renderLanding();
      
      expect(screen.getByText('Para comenzar')).toBeInTheDocument();
      expect(screen.getByText('El mas completo')).toBeInTheDocument();
      expect(screen.getByText('Para clinicas')).toBeInTheDocument();
    });

    it('highlights the popular plan', () => {
      renderLanding();
      
      expect(screen.getByText('Mas popular')).toBeInTheDocument();
    });

    it('renders plan features with checkmarks', () => {
      renderLanding();
      
      // "Pacientes ilimitados" appears in both WhyLavenius and Pricing - use getAllBy
      const pacientesElements = screen.getAllByText('Pacientes ilimitados');
      expect(pacientesElements.length).toBeGreaterThanOrEqual(1);
      
      // Features unique to pricing
      expect(screen.getByText('Agenda completa')).toBeInTheDocument();
      expect(screen.getByText('Fichas clinicas')).toBeInTheDocument();
      
      // Professional plan features
      expect(screen.getByText('Todo lo del plan Basico')).toBeInTheDocument();
      
      // WhatsApp appears multiple times
      const whatsappElements = screen.getAllByText('Recordatorios WhatsApp');
      expect(whatsappElements.length).toBeGreaterThanOrEqual(1);
      
      // Analytics also appears multiple times  
      const analyticsElements = screen.getAllByText('Analytics avanzados');
      expect(analyticsElements.length).toBeGreaterThanOrEqual(1);
      
      // Premium plan features
      expect(screen.getByText('Todo lo del plan Profesional')).toBeInTheDocument();
      expect(screen.getByText('Notas con IA')).toBeInTheDocument();
      expect(screen.getByText('Resumenes automaticos')).toBeInTheDocument();
    });

    it('renders not included features with X marks', () => {
      renderLanding();
      
      // Basic plan excluded features - check there are some with opacity-50
      const listItems = document.querySelectorAll('li.opacity-50');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('renders CTA buttons for each plan', () => {
      renderLanding();
      
      const ctaButtons = screen.getAllByRole('button', { name: /comenzar/i });
      // At least 3 plan CTAs + hero CTA
      expect(ctaButtons.length).toBeGreaterThanOrEqual(3);
    });

    it('navigates to register when plan CTA clicked', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      // Find pricing section and get its CTA buttons
      const pricingSection = document.getElementById('pricing');
      expect(pricingSection).toBeInTheDocument();
      
      // Get buttons within pricing section
      const pricingButtons = pricingSection!.querySelectorAll('button');
      const ctaButton = Array.from(pricingButtons).find(btn => 
        btn.textContent?.toLowerCase().includes('comenzar')
      );
      
      expect(ctaButton).toBeDefined();
      if (ctaButton) {
        await user.click(ctaButton);
        expect(mockNavigate).toHaveBeenCalledWith('/register');
      }
    });

    it('renders trust badges below pricing', () => {
      renderLanding();
      
      expect(screen.getByText('Encriptacion de grado clinico')).toBeInTheDocument();
      expect(screen.getByText('Cancela cuando quieras')).toBeInTheDocument();
      expect(screen.getByText('14 dias de prueba gratis')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CTA SECTION TESTS
  // ==========================================================================

  describe('CTA Section', () => {
    it('renders CTA section title', () => {
      renderLanding();
      
      expect(screen.getByText('Comienza a gestionar tu consultorio de forma inteligente')).toBeInTheDocument();
    });

    it('renders CTA section subtitle', () => {
      renderLanding();
      
      expect(screen.getByText(/Unete a profesionales que ya ahorraron/)).toBeInTheDocument();
    });

    it('renders create account button', () => {
      renderLanding();
      
      expect(screen.getByRole('button', { name: /crear cuenta gratis/i })).toBeInTheDocument();
    });

    it('renders login button in CTA', () => {
      renderLanding();
      
      const loginButtons = screen.getAllByRole('button', { name: /iniciar sesion/i });
      expect(loginButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('navigates to register on create account click', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      const createAccountButton = screen.getByRole('button', { name: /crear cuenta gratis/i });
      await user.click(createAccountButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('navigates to login on login button click', async () => {
      const user = userEvent.setup();
      renderLanding();
      
      const loginButtons = screen.getAllByRole('button', { name: /iniciar sesion/i });
      // Click the CTA section login button (last one)
      await user.click(loginButtons[loginButtons.length - 1]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  // ==========================================================================
  // FOOTER TESTS
  // ==========================================================================

  describe('Footer', () => {
    it('renders footer brand', () => {
      renderLanding();
      
      const brandTexts = screen.getAllByText('Lavenius');
      expect(brandTexts.length).toBeGreaterThanOrEqual(2); // navbar + footer
    });

    it('renders copyright text with current year', () => {
      renderLanding();
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    });

    it('renders rights reserved text', () => {
      renderLanding();
      
      expect(screen.getByText(/Todos los derechos reservados/)).toBeInTheDocument();
    });

    it('uses semantic footer element', () => {
      renderLanding();
      
      const footer = document.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // STICKY MOBILE CTA TESTS
  // ==========================================================================

  describe('StickyMobileCTA', () => {
    beforeEach(() => {
      // Mock window.scrollY
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 0,
      });
    });

    it('renders sticky CTA container', () => {
      renderLanding();
      
      // The sticky CTA is fixed at bottom
      const stickyCta = document.querySelector('.fixed.bottom-0');
      expect(stickyCta).toBeInTheDocument();
    });

    it('is hidden when at top of page (scrollY = 0)', () => {
      renderLanding();
      
      const stickyCta = document.querySelector('.fixed.bottom-0');
      expect(stickyCta).toHaveClass('translate-y-full');
    });

    it('becomes visible after scrolling past hero', () => {
      renderLanding();
      
      // Simulate scroll past hero
      Object.defineProperty(window, 'scrollY', { value: 600 });
      
      // Trigger scroll event
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      
      const stickyCta = document.querySelector('.fixed.bottom-0');
      expect(stickyCta).toHaveClass('translate-y-0');
    });

    it('is hidden on md screens and above', () => {
      renderLanding();
      
      const stickyCta = document.querySelector('.fixed.bottom-0');
      expect(stickyCta).toHaveClass('md:hidden');
    });

    describe('when signed out', () => {
      beforeEach(() => {
        mockAuthState = { isSignedIn: false, isLoaded: true };
      });

      it('shows sign up CTA', () => {
        renderLanding();
        
        // The sticky CTA should have a sign up button via Clerk
        const stickyCta = document.querySelector('.fixed.bottom-0');
        const ctaButton = within(stickyCta as HTMLElement).getByRole('button', { name: /comenzar gratis/i });
        expect(ctaButton).toBeInTheDocument();
      });
    });

    describe('when signed in', () => {
      beforeEach(() => {
        mockAuthState = { isSignedIn: true, isLoaded: true };
      });

      it('shows dashboard CTA', () => {
        renderLanding();
        
        const stickyCta = document.querySelector('.fixed.bottom-0');
        const dashboardButton = within(stickyCta as HTMLElement).getByRole('button', { name: 'Dashboard' });
        expect(dashboardButton).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderLanding();
      
      // Main title is h1 level
      const mainHeading = screen.getByText('Control total de tu consultorio');
      expect(mainHeading.tagName).toBe('H1');
      
      // Section titles are h2 level
      const featureTitle = screen.getByText('Todo lo que necesitas en un solo lugar');
      expect(featureTitle.tagName).toBe('H2');
    });

    it('all buttons are accessible', () => {
      renderLanding();
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeEnabled();
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
      // Hero, Features, Analytics, Reminders, Security, SocialProof, WhyLavenius, FAQ, Pricing, CTA
      expect(sections.length).toBeGreaterThanOrEqual(10);
    });

    it('footer uses semantic footer element', () => {
      renderLanding();
      
      const footer = document.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('mobile menu toggle has aria-label', () => {
      renderLanding();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      expect(menuButton).toHaveAttribute('aria-label');
    });
  });

  // ==========================================================================
  // RESPONSIVE LAYOUT TESTS
  // ==========================================================================

  describe('Responsive Layout', () => {
    it('renders container with proper max-width classes', () => {
      renderLanding();
      
      const containers = document.querySelectorAll('.max-w-7xl');
      expect(containers.length).toBeGreaterThan(0);
    });

    it('renders responsive padding classes', () => {
      renderLanding();
      
      const responsivePadding = document.querySelectorAll('[class*="px-4"]');
      expect(responsivePadding.length).toBeGreaterThan(0);
    });

    it('renders responsive text size classes', () => {
      renderLanding();
      
      const heroTitle = screen.getByText('Control total de tu consultorio');
      expect(heroTitle).toHaveClass('text-4xl', 'sm:text-5xl', 'lg:text-6xl');
    });

    it('renders responsive grid for features', () => {
      renderLanding();
      
      const gridContainers = document.querySelectorAll('.grid');
      expect(gridContainers.length).toBeGreaterThan(0);
      
      const responsiveGrid = document.querySelector('.lg\\:grid-cols-4');
      expect(responsiveGrid).toBeInTheDocument();
    });

    it('navbar has fixed positioning', () => {
      renderLanding();
      
      const nav = document.querySelector('nav');
      expect(nav).toHaveClass('fixed');
    });

    it('desktop navigation is hidden on mobile', () => {
      renderLanding();
      
      const desktopNav = document.querySelector('.hidden.md\\:flex');
      expect(desktopNav).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ANIMATED SECTION INTEGRATION TESTS
  // ==========================================================================

  describe('AnimatedSection Integration', () => {
    it('wraps content in AnimatedSection components', () => {
      renderLanding();
      
      const animatedSections = screen.getAllByTestId('animated-section');
      expect(animatedSections.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // VISUAL ELEMENTS TESTS
  // ==========================================================================

  describe('Visual Elements', () => {
    it('renders gradient backgrounds', () => {
      renderLanding();
      
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

    it('renders rounded corners on cards', () => {
      renderLanding();
      
      const roundedElements = document.querySelectorAll('[class*="rounded-"]');
      expect(roundedElements.length).toBeGreaterThan(0);
    });
  });
});
