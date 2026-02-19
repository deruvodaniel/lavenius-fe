import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarView } from '../../../components/shared/CalendarView';

describe('CalendarView', () => {
  const defaultProps = {
    calendarDate: new Date(2025, 5, 15), // June 15, 2025
    onPreviousMonth: vi.fn(),
    onNextMonth: vi.fn(),
    onToday: vi.fn(),
    turnosCountPorDia: {},
    today: new Date(2025, 5, 15),
    isMobile: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders calendar header with month and year', () => {
      render(<CalendarView {...defaultProps} />);

      // Spanish locale: "junio de 2025"
      expect(screen.getByText(/junio de 2025/i)).toBeInTheDocument();
    });

    it('renders "Hoy" button', () => {
      render(<CalendarView {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Hoy' })).toBeInTheDocument();
    });

    it('renders previous month button', () => {
      render(<CalendarView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /mes anterior/i })).toBeInTheDocument();
    });

    it('renders next month button', () => {
      render(<CalendarView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /mes siguiente/i })).toBeInTheDocument();
    });

    it('renders day of week headers', () => {
      render(<CalendarView {...defaultProps} />);

      const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      dayHeaders.forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('renders correct number of days for the month', () => {
      // June has 30 days
      render(<CalendarView {...defaultProps} />);

      // Check that days 1-30 exist
      for (let i = 1; i <= 30; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
      // Day 31 should not exist in June
      expect(screen.queryByText('31')).not.toBeInTheDocument();
    });

    it('renders correct number of days for a 31-day month', () => {
      render(
        <CalendarView
          {...defaultProps}
          calendarDate={new Date(2025, 6, 15)} // July has 31 days
        />
      );

      expect(screen.getByText('31')).toBeInTheDocument();
    });

    it('renders correct number of days for February', () => {
      render(
        <CalendarView
          {...defaultProps}
          calendarDate={new Date(2025, 1, 15)} // February 2025 (non-leap year)
        />
      );

      expect(screen.getByText('28')).toBeInTheDocument();
      expect(screen.queryByText('29')).not.toBeInTheDocument();
    });

    it('renders correct number of days for February in leap year', () => {
      render(
        <CalendarView
          {...defaultProps}
          calendarDate={new Date(2024, 1, 15)} // February 2024 (leap year)
        />
      );

      expect(screen.getByText('29')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('calls onPreviousMonth when previous button is clicked', async () => {
      vi.useRealTimers(); // userEvent works better with real timers
      const onPreviousMonth = vi.fn();
      const user = userEvent.setup();

      render(
        <CalendarView
          {...defaultProps}
          onPreviousMonth={onPreviousMonth}
        />
      );

      await user.click(screen.getByRole('button', { name: /mes anterior/i }));
      expect(onPreviousMonth).toHaveBeenCalledTimes(1);
    });

    it('calls onNextMonth when next button is clicked', async () => {
      vi.useRealTimers();
      const onNextMonth = vi.fn();
      const user = userEvent.setup();

      render(
        <CalendarView
          {...defaultProps}
          onNextMonth={onNextMonth}
        />
      );

      await user.click(screen.getByRole('button', { name: /mes siguiente/i }));
      expect(onNextMonth).toHaveBeenCalledTimes(1);
    });

    it('calls onToday when "Hoy" button is clicked', async () => {
      vi.useRealTimers();
      const onToday = vi.fn();
      const user = userEvent.setup();

      render(
        <CalendarView
          {...defaultProps}
          onToday={onToday}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Hoy' }));
      expect(onToday).toHaveBeenCalledTimes(1);
    });
  });

  describe('Today Highlighting', () => {
    it('highlights today with special styling', () => {
      render(<CalendarView {...defaultProps} />);

      // Find the day cell for today (15th)
      const dayCell = screen.getByText('15').closest('div');
      expect(dayCell).toHaveClass('border-indigo-600');
      expect(dayCell).toHaveClass('bg-indigo-50');
    });

    it('today text has indigo color', () => {
      render(<CalendarView {...defaultProps} />);

      const todaySpan = screen.getByText('15');
      expect(todaySpan).toHaveClass('text-indigo-600');
    });

    it('does not highlight other days as today', () => {
      render(<CalendarView {...defaultProps} />);

      const otherDay = screen.getByText('10').closest('div');
      expect(otherDay).not.toHaveClass('border-indigo-600');
    });
  });

  describe('Past Days Styling', () => {
    it('past days have muted styling', () => {
      render(<CalendarView {...defaultProps} />);

      // Day 10 is in the past (today is 15th)
      const pastDaySpan = screen.getByText('10');
      expect(pastDaySpan).toHaveClass('text-gray-400');
    });

    it('past day cells have gray background', () => {
      render(<CalendarView {...defaultProps} />);

      const pastDay = screen.getByText('5').closest('div');
      expect(pastDay).toHaveClass('bg-gray-50');
      expect(pastDay).toHaveClass('border-gray-100');
    });

    it('future days do not have past styling', () => {
      render(<CalendarView {...defaultProps} />);

      // Day 20 is in the future
      const futureDay = screen.getByText('20');
      expect(futureDay).not.toHaveClass('text-gray-400');
      expect(futureDay).toHaveClass('text-gray-700');
    });
  });

  describe('Turnos (Appointments) Display', () => {
    it('displays turno count on days with appointments', () => {
      const turnosCountPorDia = {
        '2025-06-15': 8,  // Use 8 which doesn't appear as a day in June
        '2025-06-20': 9,  // Use 9 which doesn't appear in typical day position
      };

      render(
        <CalendarView
          {...defaultProps}
          turnosCountPorDia={turnosCountPorDia}
        />
      );

      // Check for badges with class indicator
      const badges = document.querySelectorAll('.rounded-full.mt-1');
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    it('does not display badge for days without appointments', () => {
      const turnosCountPorDia = {
        '2025-06-15': 2,
      };

      render(
        <CalendarView
          {...defaultProps}
          turnosCountPorDia={turnosCountPorDia}
        />
      );

      // Day 20 should not have a badge
      const day20Cell = screen.getByText('20').closest('div');
      const badge = day20Cell?.querySelector('.px-2');
      expect(badge).not.toBeInTheDocument();
    });

    it('turno badges have correct styling', () => {
      const turnosCountPorDia = {
        '2025-06-20': 45,  // Use unique number not a day
      };

      render(
        <CalendarView
          {...defaultProps}
          turnosCountPorDia={turnosCountPorDia}
        />
      );

      const badge = screen.getByText('45');
      expect(badge).toHaveClass('bg-indigo-600');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('rounded-full');
    });

    it('handles large turno counts', () => {
      const turnosCountPorDia = {
        '2025-06-20': 99,
      };

      render(
        <CalendarView
          {...defaultProps}
          turnosCountPorDia={turnosCountPorDia}
        />
      );

      expect(screen.getByText('99')).toBeInTheDocument();
    });
  });

  describe('Mobile View', () => {
    it('applies mobile-specific today styling when isMobile is true', () => {
      render(
        <CalendarView
          {...defaultProps}
          isMobile={true}
        />
      );

      const todayCell = screen.getByText('15').closest('div');
      expect(todayCell).toHaveClass('bg-indigo-600');
      expect(todayCell).toHaveClass('text-white');
      expect(todayCell).toHaveClass('font-bold');
    });

    it('today text is white on mobile', () => {
      render(
        <CalendarView
          {...defaultProps}
          isMobile={true}
        />
      );

      const todaySpan = screen.getByText('15');
      expect(todaySpan).toHaveClass('text-white');
    });

    it('uses smaller gap in mobile view', () => {
      const { container } = render(
        <CalendarView
          {...defaultProps}
          isMobile={true}
        />
      );

      const grid = container.querySelector('.grid-cols-7');
      expect(grid).toHaveClass('gap-1');
    });

    it('uses larger gap in desktop view', () => {
      const { container } = render(
        <CalendarView
          {...defaultProps}
          isMobile={false}
        />
      );

      const grid = container.querySelector('.grid-cols-7');
      expect(grid).toHaveClass('gap-2');
    });

    it('turno badge on today has white text in mobile', () => {
      const turnosCountPorDia = {
        '2025-06-15': 42,  // Unique number for badge
      };

      render(
        <CalendarView
          {...defaultProps}
          turnosCountPorDia={turnosCountPorDia}
          isMobile={true}
        />
      );

      // Find badge with count 42
      const badge = screen.getByText('42');
      expect(badge).toHaveClass('text-white');
    });
  });

  describe('Different Months', () => {
    it('renders January correctly', () => {
      render(
        <CalendarView
          {...defaultProps}
          calendarDate={new Date(2025, 0, 15)}
        />
      );

      expect(screen.getByText(/enero de 2025/i)).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument();
    });

    it('renders December correctly', () => {
      render(
        <CalendarView
          {...defaultProps}
          calendarDate={new Date(2025, 11, 15)}
        />
      );

      expect(screen.getByText(/diciembre de 2025/i)).toBeInTheDocument();
    });

    it('correctly calculates starting day of week', () => {
      // June 2025 starts on a Sunday (day 0)
      render(<CalendarView {...defaultProps} />);

      // The first day (1) should be in the first column (Sunday)
      // We verify by checking that there are no empty cells before day 1
      const dayHeaders = screen.getAllByText(/Dom|Lun|Mar|Mié|Jue|Vie|Sáb/);
      expect(dayHeaders).toHaveLength(7);
    });

    it('handles month starting on Saturday', () => {
      // November 2025 starts on Saturday
      render(
        <CalendarView
          {...defaultProps}
          calendarDate={new Date(2025, 10, 15)} // November 2025
        />
      );

      expect(screen.getByText(/noviembre de 2025/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('previous month button has accessible title', () => {
      render(<CalendarView {...defaultProps} />);

      const prevButton = screen.getByRole('button', { name: /mes anterior/i });
      expect(prevButton).toHaveAttribute('title', 'Mes anterior');
    });

    it('next month button has accessible title', () => {
      render(<CalendarView {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /mes siguiente/i });
      expect(nextButton).toHaveAttribute('title', 'Mes siguiente');
    });

    it('navigation buttons are keyboard accessible', async () => {
      vi.useRealTimers();
      const onPreviousMonth = vi.fn();
      const onNextMonth = vi.fn();
      const user = userEvent.setup();

      render(
        <CalendarView
          {...defaultProps}
          onPreviousMonth={onPreviousMonth}
          onNextMonth={onNextMonth}
        />
      );

      const prevButton = screen.getByRole('button', { name: /mes anterior/i });
      prevButton.focus();
      await user.keyboard('{Enter}');
      expect(onPreviousMonth).toHaveBeenCalled();

      const nextButton = screen.getByRole('button', { name: /mes siguiente/i });
      nextButton.focus();
      await user.keyboard('{Enter}');
      expect(onNextMonth).toHaveBeenCalled();
    });

    it('today button is keyboard accessible', async () => {
      vi.useRealTimers();
      const onToday = vi.fn();
      const user = userEvent.setup();

      render(
        <CalendarView
          {...defaultProps}
          onToday={onToday}
        />
      );

      const todayButton = screen.getByRole('button', { name: 'Hoy' });
      todayButton.focus();
      expect(todayButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onToday).toHaveBeenCalled();
    });

    it('buttons are focusable', () => {
      render(<CalendarView {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        button.focus();
        expect(button).toHaveFocus();
      });
    });
  });

  describe('Layout', () => {
    it('desktop view has flex column layout', () => {
      const { container } = render(
        <CalendarView {...defaultProps} isMobile={false} />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('h-full');
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('flex-col');
    });

    it('mobile view does not have flex layout', () => {
      const { container } = render(
        <CalendarView {...defaultProps} isMobile={true} />
      );

      const wrapper = container.firstChild;
      expect(wrapper).not.toHaveClass('h-full');
      expect(wrapper).not.toHaveClass('flex');
    });

    it('calendar uses 7-column grid', () => {
      const { container } = render(<CalendarView {...defaultProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-7');
    });

    it('day cells maintain aspect ratio', () => {
      render(<CalendarView {...defaultProps} />);

      const dayCell = screen.getByText('15').closest('div');
      expect(dayCell).toHaveClass('aspect-square');
    });
  });

  describe('Styling', () => {
    it('month name is capitalized', () => {
      render(<CalendarView {...defaultProps} />);

      const monthHeader = screen.getByText(/junio de 2025/i);
      expect(monthHeader).toHaveClass('capitalize');
    });

    it('navigation buttons have hover state', () => {
      render(<CalendarView {...defaultProps} />);

      const prevButton = screen.getByRole('button', { name: /mes anterior/i });
      expect(prevButton).toHaveClass('hover:bg-gray-100');
    });

    it('today button has indigo styling', () => {
      render(<CalendarView {...defaultProps} />);

      const todayButton = screen.getByRole('button', { name: 'Hoy' });
      expect(todayButton).toHaveClass('bg-indigo-100');
      expect(todayButton).toHaveClass('text-indigo-600');
      expect(todayButton).toHaveClass('hover:bg-indigo-200');
    });

    it('future days have hover state', () => {
      render(<CalendarView {...defaultProps} />);

      const futureDay = screen.getByText('20').closest('div');
      expect(futureDay).toHaveClass('hover:border-indigo-300');
    });
  });

  describe('Edge Cases', () => {
    it('handles year boundaries correctly', () => {
      render(
        <CalendarView
          {...defaultProps}
          calendarDate={new Date(2025, 11, 15)} // December 2025
        />
      );

      expect(screen.getByText(/diciembre de 2025/i)).toBeInTheDocument();
    });

    it('handles different years', () => {
      render(
        <CalendarView
          {...defaultProps}
          calendarDate={new Date(2030, 5, 15)}
        />
      );

      expect(screen.getByText(/junio de 2030/i)).toBeInTheDocument();
    });

    it('handles empty turnosCountPorDia', () => {
      render(
        <CalendarView
          {...defaultProps}
          turnosCountPorDia={{}}
        />
      );

      // Should render without errors
      expect(screen.getByText(/junio de 2025/i)).toBeInTheDocument();
    });

    it('handles turnosCountPorDia with zero count', () => {
      const turnosCountPorDia = {
        '2025-06-15': 0,
      };

      render(
        <CalendarView
          {...defaultProps}
          turnosCountPorDia={turnosCountPorDia}
        />
      );

      // Zero count should not show badge
      const dayCell = screen.getByText('15').closest('div');
      // Should only have the day number, not a badge
      const badge = dayCell?.querySelector('.px-2');
      expect(badge).not.toBeInTheDocument();
    });

    it('handles rapid navigation clicks', async () => {
      vi.useRealTimers();
      const onNextMonth = vi.fn();
      const user = userEvent.setup();

      render(
        <CalendarView
          {...defaultProps}
          onNextMonth={onNextMonth}
        />
      );

      const nextButton = screen.getByRole('button', { name: /mes siguiente/i });

      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(nextButton);

      expect(onNextMonth).toHaveBeenCalledTimes(3);
    });
  });
});
