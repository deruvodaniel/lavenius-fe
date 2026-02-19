import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from '../../../components/shared/NotFound';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderNotFound = () => {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  );
};

describe('NotFound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders 404 text', () => {
      renderNotFound();

      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('renders page not found heading', () => {
      renderNotFound();

      expect(screen.getByRole('heading', { level: 1, name: /pagina no encontrada/i })).toBeInTheDocument();
    });

    it('renders description text', () => {
      renderNotFound();

      expect(screen.getByText(/lo sentimos, la pagina que buscas no existe o fue movida/i)).toBeInTheDocument();
      expect(screen.getByText(/verifica la URL o vuelve al inicio/i)).toBeInTheDocument();
    });

    it('renders go back button', () => {
      renderNotFound();

      expect(screen.getByRole('button', { name: /volver atras/i })).toBeInTheDocument();
    });

    it('renders go to home button', () => {
      renderNotFound();

      expect(screen.getByRole('button', { name: /ir al inicio/i })).toBeInTheDocument();
    });

    it('renders support section', () => {
      renderNotFound();

      expect(screen.getByText(/si el problema persiste, contacta a soporte tecnico/i)).toBeInTheDocument();
    });

    it('renders support email link', () => {
      renderNotFound();

      const emailLink = screen.getByRole('link', { name: /soporte@lavenius.com/i });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:soporte@lavenius.com');
    });

    it('renders footer with brand name', () => {
      renderNotFound();

      expect(screen.getByText('Lavenius - Gestion de Pacientes')).toBeInTheDocument();
    });

    it('renders search icon with question mark', () => {
      renderNotFound();

      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates back when go back button is clicked', async () => {
      const user = userEvent.setup();
      renderNotFound();

      await user.click(screen.getByRole('button', { name: /volver atras/i }));

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('navigates to home when go to home button is clicked', async () => {
      const user = userEvent.setup();
      renderNotFound();

      await user.click(screen.getByRole('button', { name: /ir al inicio/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Styling', () => {
    it('has gradient background', () => {
      const { container } = renderNotFound();

      const backgroundDiv = container.firstChild;
      expect(backgroundDiv).toHaveClass('bg-gradient-to-br');
      expect(backgroundDiv).toHaveClass('from-indigo-50');
      expect(backgroundDiv).toHaveClass('to-purple-50');
    });

    it('has centered layout', () => {
      const { container } = renderNotFound();

      const backgroundDiv = container.firstChild;
      expect(backgroundDiv).toHaveClass('flex');
      expect(backgroundDiv).toHaveClass('items-center');
      expect(backgroundDiv).toHaveClass('justify-center');
    });

    it('404 text has appropriate styling', () => {
      renderNotFound();

      const errorCode = screen.getByText('404');
      expect(errorCode).toHaveClass('font-black');
      expect(errorCode).toHaveClass('text-indigo-100');
    });

    it('go to home button has primary styling', () => {
      renderNotFound();

      const homeButton = screen.getByRole('button', { name: /ir al inicio/i });
      expect(homeButton).toHaveClass('bg-indigo-600');
      expect(homeButton).toHaveClass('text-white');
    });
  });

  describe('Icons', () => {
    it('renders icons in buttons', () => {
      renderNotFound();

      // Check SVG icons exist in buttons
      const goBackButton = screen.getByRole('button', { name: /volver atras/i });
      const homeButton = screen.getByRole('button', { name: /ir al inicio/i });

      expect(goBackButton.querySelector('svg')).toBeInTheDocument();
      expect(homeButton.querySelector('svg')).toBeInTheDocument();
    });

    it('renders mail icon in support section', () => {
      renderNotFound();

      const emailLink = screen.getByRole('link', { name: /soporte@lavenius.com/i });
      expect(emailLink.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderNotFound();

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/pagina no encontrada/i);
    });

    it('buttons are focusable', () => {
      renderNotFound();

      const goBackButton = screen.getByRole('button', { name: /volver atras/i });
      const homeButton = screen.getByRole('button', { name: /ir al inicio/i });

      goBackButton.focus();
      expect(goBackButton).toHaveFocus();

      homeButton.focus();
      expect(homeButton).toHaveFocus();
    });

    it('email link is focusable', () => {
      renderNotFound();

      const emailLink = screen.getByRole('link', { name: /soporte@lavenius.com/i });
      emailLink.focus();
      expect(emailLink).toHaveFocus();
    });

    it('buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      renderNotFound();

      const homeButton = screen.getByRole('button', { name: /ir al inicio/i });
      homeButton.focus();

      await user.keyboard('{Enter}');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('go back button is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderNotFound();

      const goBackButton = screen.getByRole('button', { name: /volver atras/i });
      goBackButton.focus();

      await user.keyboard('{Enter}');
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Responsive Layout', () => {
    it('has responsive button layout classes', () => {
      renderNotFound();

      const goBackButton = screen.getByRole('button', { name: /volver atras/i });
      const homeButton = screen.getByRole('button', { name: /ir al inicio/i });

      // Buttons have responsive width classes
      expect(goBackButton).toHaveClass('w-full');
      expect(goBackButton).toHaveClass('sm:w-auto');
      expect(homeButton).toHaveClass('w-full');
      expect(homeButton).toHaveClass('sm:w-auto');
    });

    it('has responsive 404 text size', () => {
      renderNotFound();

      const errorCode = screen.getByText('404');
      // The component has responsive text sizes
      expect(errorCode.className).toContain('text-[150px]');
      expect(errorCode.className).toContain('sm:text-[180px]');
    });

    it('has responsive heading size', () => {
      renderNotFound();

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-2xl');
      expect(heading).toHaveClass('sm:text-3xl');
    });
  });

  describe('Support Section', () => {
    it('support section has proper styling', () => {
      renderNotFound();

      const supportText = screen.getByText(/si el problema persiste/i);
      const supportSection = supportText.closest('div');

      expect(supportSection).toHaveClass('bg-white/60');
      expect(supportSection).toHaveClass('backdrop-blur-sm');
      expect(supportSection).toHaveClass('rounded-xl');
    });

    it('email link has hover styling classes', () => {
      renderNotFound();

      const emailLink = screen.getByRole('link', { name: /soporte@lavenius.com/i });
      expect(emailLink).toHaveClass('text-indigo-600');
      expect(emailLink).toHaveClass('hover:text-indigo-700');
      expect(emailLink).toHaveClass('transition-colors');
    });
  });
});
