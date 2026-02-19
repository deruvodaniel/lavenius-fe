import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================================
// MOCKS
// ============================================================================

// Mock calendarStore
const mockCheckConnection = vi.fn();
const mockConnectCalendar = vi.fn();
const mockSyncCalendar = vi.fn();

vi.mock('@/lib/stores/calendarStore', () => ({
  useCalendarStore: vi.fn(),
}));

// Import after mocks
import CalendarSyncButton from '../../../components/config/CalendarSyncButton';
import { useCalendarStore } from '@/lib/stores/calendarStore';

// ============================================================================
// HELPERS
// ============================================================================

const mockCalendarStoreState = (overrides: Partial<ReturnType<typeof useCalendarStore>> = {}) => {
  const defaultState = {
    isConnected: false,
    isSyncing: false,
    connectCalendar: mockConnectCalendar,
    syncCalendar: mockSyncCalendar,
    checkConnection: mockCheckConnection,
  };

  vi.mocked(useCalendarStore).mockReturnValue({
    ...defaultState,
    ...overrides,
  } as ReturnType<typeof useCalendarStore>);
};

interface RenderOptions {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
}

const renderCalendarSyncButton = (options: RenderOptions = {}) => {
  return render(
    <CalendarSyncButton
      variant={options.variant}
      size={options.size}
      showIcon={options.showIcon}
    />
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('CalendarSyncButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalendarStoreState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders button element', () => {
      renderCalendarSyncButton();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls checkConnection on mount', () => {
      renderCalendarSyncButton();
      expect(mockCheckConnection).toHaveBeenCalledTimes(1);
    });

    it('shows calendar icon by default', () => {
      renderCalendarSyncButton();
      // Icon is rendered via lucide-react, checking button has SVG
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      renderCalendarSyncButton({ showIcon: false });
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DISCONNECTED STATE
  // ==========================================================================

  describe('Disconnected State', () => {
    beforeEach(() => {
      mockCalendarStoreState({
        isConnected: false,
        isSyncing: false,
      });
    });

    it('shows "Conectar Google Calendar" text', () => {
      renderCalendarSyncButton();
      expect(screen.getByText('Conectar Google Calendar')).toBeInTheDocument();
    });

    it('calls connectCalendar when clicked', async () => {
      const user = userEvent.setup();
      renderCalendarSyncButton();
      
      await user.click(screen.getByRole('button'));
      
      expect(mockConnectCalendar).toHaveBeenCalledTimes(1);
      expect(mockSyncCalendar).not.toHaveBeenCalled();
    });

    it('button is enabled', () => {
      renderCalendarSyncButton();
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  // ==========================================================================
  // CONNECTED STATE
  // ==========================================================================

  describe('Connected State', () => {
    beforeEach(() => {
      mockCalendarStoreState({
        isConnected: true,
        isSyncing: false,
      });
    });

    it('shows "Sincronizar Google Calendar" text', () => {
      renderCalendarSyncButton();
      expect(screen.getByText('Sincronizar Google Calendar')).toBeInTheDocument();
    });

    it('calls syncCalendar when clicked', async () => {
      const user = userEvent.setup();
      renderCalendarSyncButton();
      
      await user.click(screen.getByRole('button'));
      
      expect(mockSyncCalendar).toHaveBeenCalledTimes(1);
      expect(mockConnectCalendar).not.toHaveBeenCalled();
    });

    it('button is enabled', () => {
      renderCalendarSyncButton();
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  // ==========================================================================
  // SYNCING STATE
  // ==========================================================================

  describe('Syncing State', () => {
    beforeEach(() => {
      mockCalendarStoreState({
        isConnected: true,
        isSyncing: true,
      });
    });

    it('shows "Sincronizando..." text', () => {
      renderCalendarSyncButton();
      expect(screen.getByText('Sincronizando...')).toBeInTheDocument();
    });

    it('button is disabled while syncing', () => {
      renderCalendarSyncButton();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows spinning refresh icon', () => {
      renderCalendarSyncButton();
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Check for animate-spin class on the icon
      expect(svg).toHaveClass('animate-spin');
    });

    it('does not call any action when clicked while syncing', async () => {
      const user = userEvent.setup();
      renderCalendarSyncButton();
      
      // Button is disabled, clicking won't trigger action
      await user.click(screen.getByRole('button'));
      
      expect(mockSyncCalendar).not.toHaveBeenCalled();
      expect(mockConnectCalendar).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // VARIANT PROPS
  // ==========================================================================

  describe('Variant Props', () => {
    it('renders with default variant', () => {
      renderCalendarSyncButton({ variant: 'default' });
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with outline variant', () => {
      renderCalendarSyncButton({ variant: 'outline' });
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with ghost variant', () => {
      renderCalendarSyncButton({ variant: 'ghost' });
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SIZE PROPS
  // ==========================================================================

  describe('Size Props', () => {
    it('renders with default size', () => {
      renderCalendarSyncButton({ size: 'default' });
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with small size', () => {
      renderCalendarSyncButton({ size: 'sm' });
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with large size', () => {
      renderCalendarSyncButton({ size: 'lg' });
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe('Accessibility', () => {
    it('button has accessible role', () => {
      renderCalendarSyncButton();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('button is keyboard accessible when disconnected', async () => {
      const user = userEvent.setup();
      mockCalendarStoreState({
        isConnected: false,
      });

      renderCalendarSyncButton();
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockConnectCalendar).toHaveBeenCalled();
    });

    it('button is keyboard accessible when connected', async () => {
      const user = userEvent.setup();
      mockCalendarStoreState({
        isConnected: true,
      });

      renderCalendarSyncButton();
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockSyncCalendar).toHaveBeenCalled();
    });

    it('button is keyboard accessible with Space key', async () => {
      const user = userEvent.setup();
      mockCalendarStoreState({
        isConnected: false,
      });

      renderCalendarSyncButton();
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard(' ');
      expect(mockConnectCalendar).toHaveBeenCalled();
    });

    it('disabled button cannot be activated via keyboard', async () => {
      const user = userEvent.setup();
      mockCalendarStoreState({
        isConnected: true,
        isSyncing: true,
      });

      renderCalendarSyncButton();
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(mockSyncCalendar).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // STATE TRANSITIONS
  // ==========================================================================

  describe('State Transitions', () => {
    it('updates text when state changes from disconnected to connected', () => {
      mockCalendarStoreState({
        isConnected: false,
      });

      const { rerender } = render(<CalendarSyncButton />);
      expect(screen.getByText('Conectar Google Calendar')).toBeInTheDocument();
      
      mockCalendarStoreState({
        isConnected: true,
      });
      
      rerender(<CalendarSyncButton />);
      expect(screen.getByText('Sincronizar Google Calendar')).toBeInTheDocument();
    });

    it('updates text when syncing starts', () => {
      mockCalendarStoreState({
        isConnected: true,
        isSyncing: false,
      });

      const { rerender } = render(<CalendarSyncButton />);
      expect(screen.getByText('Sincronizar Google Calendar')).toBeInTheDocument();
      
      mockCalendarStoreState({
        isConnected: true,
        isSyncing: true,
      });
      
      rerender(<CalendarSyncButton />);
      expect(screen.getByText('Sincronizando...')).toBeInTheDocument();
    });

    it('button becomes disabled when syncing starts', () => {
      mockCalendarStoreState({
        isConnected: true,
        isSyncing: false,
      });

      const { rerender } = render(<CalendarSyncButton />);
      expect(screen.getByRole('button')).not.toBeDisabled();
      
      mockCalendarStoreState({
        isConnected: true,
        isSyncing: true,
      });
      
      rerender(<CalendarSyncButton />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  // ==========================================================================
  // ASYNC BEHAVIOR
  // ==========================================================================

  describe('Async Behavior', () => {
    it('handles async connectCalendar correctly', async () => {
      const user = userEvent.setup();
      mockConnectCalendar.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      mockCalendarStoreState({
        isConnected: false,
      });

      renderCalendarSyncButton();
      
      await user.click(screen.getByRole('button'));
      
      expect(mockConnectCalendar).toHaveBeenCalledTimes(1);
    });

    it('handles async syncCalendar correctly', async () => {
      const user = userEvent.setup();
      mockSyncCalendar.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      mockCalendarStoreState({
        isConnected: true,
      });

      renderCalendarSyncButton();
      
      await user.click(screen.getByRole('button'));
      
      expect(mockSyncCalendar).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ICON BEHAVIOR
  // ==========================================================================

  describe('Icon Behavior', () => {
    it('shows calendar icon when not syncing and showIcon is true', () => {
      mockCalendarStoreState({
        isConnected: false,
        isSyncing: false,
      });

      renderCalendarSyncButton({ showIcon: true });
      
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).not.toHaveClass('animate-spin');
    });

    it('shows spinning refresh icon when syncing', () => {
      mockCalendarStoreState({
        isConnected: true,
        isSyncing: true,
      });

      renderCalendarSyncButton({ showIcon: true });
      
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('animate-spin');
    });

    it('does not show any icon when showIcon is false and syncing', () => {
      mockCalendarStoreState({
        isConnected: true,
        isSyncing: true,
      });

      renderCalendarSyncButton({ showIcon: false });
      
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });
});
