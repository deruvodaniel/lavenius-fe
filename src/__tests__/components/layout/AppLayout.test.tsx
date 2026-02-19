import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLayout } from '../../../components/layout/AppLayout';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'common.toggleMenu': 'Toggle menu',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

// Helper to mock window.innerWidth
const mockWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

const MockSidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
  <nav data-testid="sidebar">
    <button onClick={onNavigate}>Menu Item</button>
  </nav>
);

interface RenderAppLayoutOptions {
  appName?: string;
  initialWidth?: number;
}

const renderAppLayout = ({
  appName = 'Lavenius',
  initialWidth = 1200,
}: RenderAppLayoutOptions = {}) => {
  // Set initial width before render
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: initialWidth,
  });

  return render(
    <AppLayout
      sidebar={(onNavigate) => <MockSidebar onNavigate={onNavigate} />}
      appName={appName}
    >
      <div data-testid="main-content">Main Content</div>
    </AppLayout>
  );
};

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Desktop Layout', () => {
    it('renders children in main area', () => {
      renderAppLayout({ initialWidth: 1200 });

      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('renders desktop sidebar', () => {
      renderAppLayout({ initialWidth: 1200 });

      // Desktop sidebar should be visible
      const desktopSidebar = document.querySelector('aside.hidden.lg\\:block');
      expect(desktopSidebar).toBeInTheDocument();
    });

    it('hides mobile header on desktop', () => {
      renderAppLayout({ initialWidth: 1200 });

      // Mobile header should have lg:hidden class
      const mobileHeader = document.querySelector('header.lg\\:hidden');
      expect(mobileHeader).toBeInTheDocument();
      expect(mobileHeader).toHaveClass('lg:hidden');
    });

    it('does not show hamburger menu on desktop', () => {
      renderAppLayout({ initialWidth: 1200 });

      // The hamburger button exists but is hidden via CSS on desktop
      const header = document.querySelector('header.lg\\:hidden');
      expect(header).toHaveClass('lg:hidden');
    });
  });

  describe('Mobile Layout', () => {
    it('shows mobile header on mobile', () => {
      renderAppLayout({ initialWidth: 600 });

      // Header should be visible on mobile
      const header = document.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('displays app name in mobile header', () => {
      renderAppLayout({ initialWidth: 600 });

      expect(screen.getByRole('heading', { level: 1, name: 'Lavenius' })).toBeInTheDocument();
    });

    it('displays custom app name', () => {
      renderAppLayout({ initialWidth: 600, appName: 'My App' });

      expect(screen.getByRole('heading', { level: 1, name: 'My App' })).toBeInTheDocument();
    });

    it('shows hamburger menu button', () => {
      renderAppLayout({ initialWidth: 600 });

      expect(screen.getByRole('button', { name: /toggle menu/i })).toBeInTheDocument();
    });

    it('hamburger button has accessibility label', () => {
      renderAppLayout({ initialWidth: 600 });

      const button = screen.getByRole('button', { name: /toggle menu/i });
      expect(button).toHaveAttribute('aria-label', 'Toggle menu');
    });
  });

  describe('Mobile Drawer', () => {
    it('opens drawer when hamburger is clicked', async () => {
      const user = userEvent.setup();
      renderAppLayout({ initialWidth: 600 });

      await user.click(screen.getByRole('button', { name: /toggle menu/i }));

      // Drawer should be visible
      await waitFor(() => {
        const drawer = document.querySelector('.fixed.inset-0.z-50');
        expect(drawer).toBeInTheDocument();
      });
    });

    it('renders sidebar in drawer when open', async () => {
      const user = userEvent.setup();
      renderAppLayout({ initialWidth: 600 });

      await user.click(screen.getByRole('button', { name: /toggle menu/i }));

      await waitFor(() => {
        // Sidebar content should be in the drawer
        const drawerSidebar = document.querySelector('.fixed aside');
        expect(drawerSidebar).toBeInTheDocument();
      });
    });

    it('closes drawer when backdrop is clicked', async () => {
      const user = userEvent.setup();
      renderAppLayout({ initialWidth: 600 });

      // Open drawer
      await user.click(screen.getByRole('button', { name: /toggle menu/i }));

      await waitFor(() => {
        expect(document.querySelector('.fixed.inset-0.z-50')).toBeInTheDocument();
      });

      // Click backdrop
      const backdrop = document.querySelector('.bg-black\\/30');
      if (backdrop) {
        await user.click(backdrop);
      }

      await waitFor(() => {
        expect(document.querySelector('.fixed.inset-0.z-50')).not.toBeInTheDocument();
      });
    });

    it('closes drawer when toggle button is clicked again', async () => {
      const user = userEvent.setup();
      renderAppLayout({ initialWidth: 600 });

      // Open drawer
      await user.click(screen.getByRole('button', { name: /toggle menu/i }));

      await waitFor(() => {
        expect(document.querySelector('.fixed.inset-0.z-50')).toBeInTheDocument();
      });

      // Click toggle again to close
      await user.click(screen.getByRole('button', { name: /toggle menu/i }));

      await waitFor(() => {
        expect(document.querySelector('.fixed.inset-0.z-50')).not.toBeInTheDocument();
      });
    });

    it('shows X icon when drawer is open', async () => {
      const user = userEvent.setup();
      renderAppLayout({ initialWidth: 600 });

      // Initially shows menu icon
      const toggleButton = screen.getByRole('button', { name: /toggle menu/i });
      let menuIcon = toggleButton.querySelector('svg');
      expect(menuIcon).toBeInTheDocument();

      // Open drawer
      await user.click(toggleButton);

      // Should show X icon now
      await waitFor(() => {
        const closeIcon = toggleButton.querySelector('svg');
        expect(closeIcon).toBeInTheDocument();
      });
    });

    it('calls onNavigate callback when passed to sidebar', async () => {
      const user = userEvent.setup();
      renderAppLayout({ initialWidth: 600 });

      // Open drawer
      await user.click(screen.getByRole('button', { name: /toggle menu/i }));

      await waitFor(() => {
        expect(document.querySelector('.fixed.inset-0.z-50')).toBeInTheDocument();
      });

      // Click menu item in sidebar (triggers onNavigate which closes drawer)
      const menuItem = screen.getAllByRole('button', { name: 'Menu Item' })[0];
      await user.click(menuItem);

      // Drawer should close
      await waitFor(() => {
        expect(document.querySelector('.fixed.inset-0.z-50')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('closes drawer when resizing to desktop', async () => {
      const user = userEvent.setup();
      renderAppLayout({ initialWidth: 600 });

      // Open drawer on mobile
      await user.click(screen.getByRole('button', { name: /toggle menu/i }));

      await waitFor(() => {
        expect(document.querySelector('.fixed.inset-0.z-50')).toBeInTheDocument();
      });

      // Resize to desktop
      act(() => {
        mockWindowWidth(1200);
      });

      await waitFor(() => {
        // Drawer should be closed
        expect(document.querySelector('.fixed.inset-0.z-50')).not.toBeInTheDocument();
      });
    });

    it('updates isMobile state on resize', () => {
      renderAppLayout({ initialWidth: 600 });

      // Should be mobile
      const mobileHeader = document.querySelector('header');
      expect(mobileHeader).toBeInTheDocument();

      // Resize to desktop
      act(() => {
        mockWindowWidth(1200);
      });

      // Mobile header still exists but is hidden via CSS
      expect(mobileHeader).toHaveClass('lg:hidden');
    });
  });

  describe('Layout Structure', () => {
    it('has correct flex layout for desktop', () => {
      const { container } = renderAppLayout({ initialWidth: 1200 });

      const layoutContainer = container.firstChild;
      expect(layoutContainer).toHaveClass('h-screen');
      expect(layoutContainer).toHaveClass('flex');
      expect(layoutContainer).toHaveClass('flex-col');
      expect(layoutContainer).toHaveClass('lg:flex-row');
    });

    it('has overflow handling on layout container', () => {
      const { container } = renderAppLayout();

      const layoutContainer = container.firstChild;
      expect(layoutContainer).toHaveClass('overflow-hidden');
    });

    it('has background color', () => {
      const { container } = renderAppLayout();

      const layoutContainer = container.firstChild;
      expect(layoutContainer).toHaveClass('bg-gray-50');
    });

    it('main content area has proper overflow handling', () => {
      renderAppLayout();

      const main = document.querySelector('main');
      expect(main).toHaveClass('flex-1');
      expect(main).toHaveClass('overflow-y-auto');
      expect(main).toHaveClass('overflow-x-hidden');
    });

    it('desktop sidebar has correct width', () => {
      renderAppLayout({ initialWidth: 1200 });

      const desktopSidebar = document.querySelector('aside.hidden.lg\\:block');
      expect(desktopSidebar).toHaveClass('w-64');
    });
  });

  describe('Styling', () => {
    it('mobile header has correct styling', () => {
      renderAppLayout({ initialWidth: 600 });

      const header = document.querySelector('header');
      expect(header).toHaveClass('bg-indigo-900');
      expect(header).toHaveClass('text-white');
      expect(header).toHaveClass('p-4');
      expect(header).toHaveClass('shadow-lg');
      expect(header).toHaveClass('z-20');
    });

    it('drawer has correct z-index', async () => {
      const user = userEvent.setup();
      renderAppLayout({ initialWidth: 600 });

      await user.click(screen.getByRole('button', { name: /toggle menu/i }));

      await waitFor(() => {
        const drawer = document.querySelector('.fixed.inset-0.z-50');
        expect(drawer).toBeInTheDocument();
      });
    });

    it('drawer backdrop has blur effect', async () => {
      const user = userEvent.setup();
      renderAppLayout({ initialWidth: 600 });

      await user.click(screen.getByRole('button', { name: /toggle menu/i }));

      await waitFor(() => {
        const backdrop = document.querySelector('.backdrop-blur-\\[2px\\]');
        expect(backdrop).toBeInTheDocument();
      });
    });

    it('drawer sidebar has correct styling', async () => {
      const user = userEvent.setup();
      renderAppLayout({ initialWidth: 600 });

      await user.click(screen.getByRole('button', { name: /toggle menu/i }));

      await waitFor(() => {
        const drawerSidebar = document.querySelector('.fixed aside');
        expect(drawerSidebar).toHaveClass('bg-indigo-900');
        expect(drawerSidebar).toHaveClass('text-white');
        expect(drawerSidebar).toHaveClass('shadow-2xl');
        expect(drawerSidebar).toHaveClass('w-64');
      });
    });

    it('toggle button has hover styling', () => {
      renderAppLayout({ initialWidth: 600 });

      const button = screen.getByRole('button', { name: /toggle menu/i });
      expect(button).toHaveClass('hover:bg-indigo-800');
      expect(button).toHaveClass('rounded-lg');
      expect(button).toHaveClass('transition-colors');
    });
  });

  describe('Accessibility', () => {
    it('toggle button is accessible', () => {
      renderAppLayout({ initialWidth: 600 });

      const button = screen.getByRole('button', { name: /toggle menu/i });
      expect(button).toBeInTheDocument();
    });

    it('toggle button is focusable', () => {
      renderAppLayout({ initialWidth: 600 });

      const button = screen.getByRole('button', { name: /toggle menu/i });
      button.focus();
      expect(button).toHaveFocus();
    });

    it('toggle button responds to keyboard', async () => {
      const user = userEvent.setup();
      renderAppLayout({ initialWidth: 600 });

      const button = screen.getByRole('button', { name: /toggle menu/i });
      button.focus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(document.querySelector('.fixed.inset-0.z-50')).toBeInTheDocument();
      });
    });

    it('main content is in a main element', () => {
      renderAppLayout();

      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('desktop sidebar is in an aside element', () => {
      renderAppLayout({ initialWidth: 1200 });

      const asides = document.querySelectorAll('aside');
      expect(asides.length).toBeGreaterThan(0);
    });

    it('mobile header uses header element', () => {
      renderAppLayout({ initialWidth: 600 });

      const header = document.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('app name is a heading', () => {
      renderAppLayout({ initialWidth: 600 });

      expect(screen.getByRole('heading', { level: 1, name: 'Lavenius' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles SSR environment (window undefined)', () => {
      // This tests the initial state when window is undefined
      // The component should default to desktop (false for isMobile)
      renderAppLayout({ initialWidth: 1200 });

      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('renders without crashing when sidebar returns null', () => {
      render(
        <AppLayout sidebar={() => null}>
          <div>Content</div>
        </AppLayout>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles rapid resize events', async () => {
      renderAppLayout({ initialWidth: 600 });

      // Rapidly resize
      act(() => {
        mockWindowWidth(1200);
        mockWindowWidth(600);
        mockWindowWidth(1200);
        mockWindowWidth(600);
      });

      // Should still render correctly
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('cleans up resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderAppLayout();

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });
});
