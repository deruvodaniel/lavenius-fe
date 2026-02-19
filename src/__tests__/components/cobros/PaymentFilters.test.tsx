import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DateFilters,
  SearchAndFilters,
  getWeekRange,
  getMonthRange,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from '@/components/cobros/PaymentFilters';
import { PaymentStatus } from '@/lib/types/api.types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'payments.filters.all': 'Todos',
        'payments.filters.thisWeek': 'Esta semana',
        'payments.filters.thisMonth': 'Este mes',
        'payments.filters.range': 'Rango',
        'payments.filters.from': 'Desde',
        'payments.filters.to': 'Hasta',
        'payments.filters.clearFilters': 'Limpiar filtros',
        'payments.filters.searchByPatient': 'Buscar por paciente',
        'payments.filters.sortBy': 'Ordenar por',
        'payments.filters.allStatuses': 'Todos los estados',
        'payments.sort.dateDesc': 'Fecha (más reciente)',
        'payments.sort.dateAsc': 'Fecha (más antigua)',
        'payments.sort.priceDesc': 'Precio (mayor)',
        'payments.sort.priceAsc': 'Precio (menor)',
        'payments.pending': 'Pendiente',
        'payments.overdue': 'Vencido',
        'payments.paid': 'Pagado',
      };
      return translations[key] || key;
    },
  }),
}));

describe('PaymentFilters - Utility Functions', () => {
  describe('getWeekRange', () => {
    it('returns an object with from and to properties', () => {
      const range = getWeekRange();

      expect(range).toHaveProperty('from');
      expect(range).toHaveProperty('to');
    });

    it('returns dates in YYYY-MM-DD format', () => {
      const range = getWeekRange();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      expect(range.from).toMatch(dateRegex);
      expect(range.to).toMatch(dateRegex);
    });

    it('returns a 7-day range (Monday to Sunday)', () => {
      const range = getWeekRange();
      // Parse the dates properly to avoid timezone issues
      const [fromYear, fromMonth, fromDay] = range.from.split('-').map(Number);
      const [toYear, toMonth, toDay] = range.to.split('-').map(Number);
      const fromDate = new Date(fromYear, fromMonth - 1, fromDay);
      const toDate = new Date(toYear, toMonth - 1, toDay);
      const diffInDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);

      expect(diffInDays).toBe(6);
    });

    it('from date string ends with day that represents Monday', () => {
      const range = getWeekRange();
      // Parse properly to check the weekday
      const [year, month, day] = range.from.split('-').map(Number);
      const fromDate = new Date(year, month - 1, day);

      // getDay() returns 1 for Monday
      expect(fromDate.getDay()).toBe(1);
    });
  });

  describe('getMonthRange', () => {
    it('returns an object with from and to properties', () => {
      const range = getMonthRange();

      expect(range).toHaveProperty('from');
      expect(range).toHaveProperty('to');
    });

    it('returns dates in YYYY-MM-DD format', () => {
      const range = getMonthRange();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      expect(range.from).toMatch(dateRegex);
      expect(range.to).toMatch(dateRegex);
    });

    it('from date string ends with 01 (first day of month)', () => {
      const range = getMonthRange();
      // Just check the string ends with -01
      expect(range.from).toMatch(/-01$/);
    });

    it('to date is the last day of the month', () => {
      const range = getMonthRange();
      // Parse properly to check
      const [year, month, day] = range.to.split('-').map(Number);
      const toDate = new Date(year, month - 1, day);
      const nextDay = new Date(year, month - 1, day + 1);

      // The next day should be the 1st of the following month
      expect(nextDay.getDate()).toBe(1);
    });
  });

  describe('SORT_OPTIONS', () => {
    it('contains 4 sort options', () => {
      expect(SORT_OPTIONS).toHaveLength(4);
    });

    it('includes date-desc option', () => {
      const option = SORT_OPTIONS.find((o) => o.value === 'date-desc');
      expect(option).toBeDefined();
      expect(option?.labelKey).toBe('payments.sort.dateDesc');
    });

    it('includes date-asc option', () => {
      const option = SORT_OPTIONS.find((o) => o.value === 'date-asc');
      expect(option).toBeDefined();
      expect(option?.labelKey).toBe('payments.sort.dateAsc');
    });

    it('includes price-desc option', () => {
      const option = SORT_OPTIONS.find((o) => o.value === 'price-desc');
      expect(option).toBeDefined();
      expect(option?.labelKey).toBe('payments.sort.priceDesc');
    });

    it('includes price-asc option', () => {
      const option = SORT_OPTIONS.find((o) => o.value === 'price-asc');
      expect(option).toBeDefined();
      expect(option?.labelKey).toBe('payments.sort.priceAsc');
    });
  });

  describe('STATUS_FILTER_OPTIONS', () => {
    it('contains 4 status options', () => {
      expect(STATUS_FILTER_OPTIONS).toHaveLength(4);
    });

    it('includes "all" option', () => {
      const option = STATUS_FILTER_OPTIONS.find((o) => o.value === 'all');
      expect(option).toBeDefined();
      expect(option?.labelKey).toBe('payments.filters.allStatuses');
    });

    it('includes PENDING status option', () => {
      const option = STATUS_FILTER_OPTIONS.find((o) => o.value === PaymentStatus.PENDING);
      expect(option).toBeDefined();
      expect(option?.labelKey).toBe('payments.pending');
    });

    it('includes OVERDUE status option', () => {
      const option = STATUS_FILTER_OPTIONS.find((o) => o.value === PaymentStatus.OVERDUE);
      expect(option).toBeDefined();
      expect(option?.labelKey).toBe('payments.overdue');
    });

    it('includes PAID status option', () => {
      const option = STATUS_FILTER_OPTIONS.find((o) => o.value === PaymentStatus.PAID);
      expect(option).toBeDefined();
      expect(option?.labelKey).toBe('payments.paid');
    });
  });
});

describe('DateFilters', () => {
  const defaultProps = {
    dateFrom: '',
    dateTo: '',
    onDateFromChange: vi.fn(),
    onDateToChange: vi.fn(),
    onClearFilters: vi.fn(),
    hasActiveFilters: false,
    quickFilter: 'all' as const,
    onQuickFilterChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('renders all quick filter buttons', () => {
      render(<DateFilters {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Esta semana' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Este mes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Rango/i })).toBeInTheDocument();
    });

    it('highlights the active quick filter button', () => {
      render(<DateFilters {...defaultProps} quickFilter="week" />);

      const weekButton = screen.getByRole('button', { name: 'Esta semana' });
      expect(weekButton).toHaveClass('bg-indigo-600', 'text-white');
    });

    it('does not show date inputs by default', () => {
      render(<DateFilters {...defaultProps} />);

      expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Hasta')).not.toBeInTheDocument();
    });

    it('shows date inputs when custom filter is selected', () => {
      render(<DateFilters {...defaultProps} quickFilter="custom" />);

      expect(screen.getByLabelText('Desde')).toBeInTheDocument();
      expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
    });

    it('shows clear filters button when hasActiveFilters is true and custom filter is active', () => {
      render(<DateFilters {...defaultProps} hasActiveFilters={true} quickFilter="custom" />);

      expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeInTheDocument();
    });

    it('does not show clear filters button when hasActiveFilters is false', () => {
      render(<DateFilters {...defaultProps} hasActiveFilters={false} quickFilter="custom" />);

      expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument();
    });
  });

  // ==================== QUICK FILTER INTERACTIONS ====================
  describe('Quick Filter Interactions', () => {
    it('calls handlers with empty dates when "all" is clicked', async () => {
      const user = userEvent.setup();
      const onDateFromChange = vi.fn();
      const onDateToChange = vi.fn();
      const onQuickFilterChange = vi.fn();

      render(
        <DateFilters
          {...defaultProps}
          quickFilter="week"
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
          onQuickFilterChange={onQuickFilterChange}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Todos' }));

      expect(onQuickFilterChange).toHaveBeenCalledWith('all');
      expect(onDateFromChange).toHaveBeenCalledWith('');
      expect(onDateToChange).toHaveBeenCalledWith('');
    });

    it('calls handlers with week range when "Esta semana" is clicked', async () => {
      const user = userEvent.setup();
      const onDateFromChange = vi.fn();
      const onDateToChange = vi.fn();
      const onQuickFilterChange = vi.fn();

      render(
        <DateFilters
          {...defaultProps}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
          onQuickFilterChange={onQuickFilterChange}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Esta semana' }));

      expect(onQuickFilterChange).toHaveBeenCalledWith('week');
      expect(onDateFromChange).toHaveBeenCalled();
      expect(onDateToChange).toHaveBeenCalled();
    });

    it('calls handlers with month range when "Este mes" is clicked', async () => {
      const user = userEvent.setup();
      const onDateFromChange = vi.fn();
      const onDateToChange = vi.fn();
      const onQuickFilterChange = vi.fn();

      render(
        <DateFilters
          {...defaultProps}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
          onQuickFilterChange={onQuickFilterChange}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Este mes' }));

      expect(onQuickFilterChange).toHaveBeenCalledWith('month');
      expect(onDateFromChange).toHaveBeenCalled();
      expect(onDateToChange).toHaveBeenCalled();
    });

    it('expands date inputs when "Rango" is clicked', async () => {
      const user = userEvent.setup();
      const onQuickFilterChange = vi.fn();

      render(<DateFilters {...defaultProps} onQuickFilterChange={onQuickFilterChange} />);

      await user.click(screen.getByRole('button', { name: /Rango/i }));

      expect(onQuickFilterChange).toHaveBeenCalledWith('custom');
    });
  });

  // ==================== DATE INPUT INTERACTIONS ====================
  describe('Date Input Interactions', () => {
    it('calls onDateFromChange when from date is changed', async () => {
      const user = userEvent.setup();
      const onDateFromChange = vi.fn();
      const onQuickFilterChange = vi.fn();

      render(
        <DateFilters
          {...defaultProps}
          quickFilter="custom"
          onDateFromChange={onDateFromChange}
          onQuickFilterChange={onQuickFilterChange}
        />
      );

      const fromInput = screen.getByLabelText('Desde');
      await user.clear(fromInput);
      await user.type(fromInput, '2024-03-01');

      expect(onDateFromChange).toHaveBeenCalled();
      expect(onQuickFilterChange).toHaveBeenCalledWith('custom');
    });

    it('calls onDateToChange when to date is changed', async () => {
      const user = userEvent.setup();
      const onDateToChange = vi.fn();
      const onQuickFilterChange = vi.fn();

      render(
        <DateFilters
          {...defaultProps}
          quickFilter="custom"
          onDateToChange={onDateToChange}
          onQuickFilterChange={onQuickFilterChange}
        />
      );

      const toInput = screen.getByLabelText('Hasta');
      await user.clear(toInput);
      await user.type(toInput, '2024-03-31');

      expect(onDateToChange).toHaveBeenCalled();
      expect(onQuickFilterChange).toHaveBeenCalledWith('custom');
    });

    it('displays provided date values', () => {
      render(
        <DateFilters {...defaultProps} quickFilter="custom" dateFrom="2024-03-01" dateTo="2024-03-31" />
      );

      expect(screen.getByLabelText('Desde')).toHaveValue('2024-03-01');
      expect(screen.getByLabelText('Hasta')).toHaveValue('2024-03-31');
    });
  });

  // ==================== CLEAR FILTERS ====================
  describe('Clear Filters', () => {
    it('calls onClearFilters when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onClearFilters = vi.fn();

      render(
        <DateFilters {...defaultProps} hasActiveFilters={true} quickFilter="custom" onClearFilters={onClearFilters} />
      );

      await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

      expect(onClearFilters).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== ACCESSIBILITY ====================
  describe('Accessibility', () => {
    it('date inputs have proper labels', () => {
      render(<DateFilters {...defaultProps} quickFilter="custom" />);

      expect(screen.getByLabelText('Desde')).toBeInTheDocument();
      expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
    });

    it('all buttons are focusable', () => {
      render(<DateFilters {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        button.focus();
        expect(button).toHaveFocus();
      });
    });

    it('date inputs are keyboard accessible', async () => {
      const user = userEvent.setup();
      const onDateFromChange = vi.fn();

      render(<DateFilters {...defaultProps} quickFilter="custom" onDateFromChange={onDateFromChange} />);

      const fromInput = screen.getByLabelText('Desde');
      fromInput.focus();
      expect(fromInput).toHaveFocus();

      await user.keyboard('2024-03-01');
      expect(onDateFromChange).toHaveBeenCalled();
    });
  });
});

describe('SearchAndFilters', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    statusFilter: 'all' as const,
    onStatusFilterChange: vi.fn(),
    sortBy: 'date-desc' as const,
    onSortChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('renders search input with placeholder', () => {
      render(<SearchAndFilters {...defaultProps} />);

      expect(screen.getByPlaceholderText('Buscar por paciente')).toBeInTheDocument();
    });

    it('renders status filter dropdown', () => {
      render(<SearchAndFilters {...defaultProps} />);

      const statusSelect = screen.getAllByRole('combobox')[0];
      expect(statusSelect).toBeInTheDocument();
    });

    it('renders sort dropdown', () => {
      render(<SearchAndFilters {...defaultProps} />);

      const sortSelect = screen.getAllByRole('combobox')[1];
      expect(sortSelect).toBeInTheDocument();
    });

    it('displays all status filter options', () => {
      render(<SearchAndFilters {...defaultProps} />);

      expect(screen.getByRole('option', { name: 'Todos los estados' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pendiente' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Vencido' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pagado' })).toBeInTheDocument();
    });

    it('displays all sort options', () => {
      render(<SearchAndFilters {...defaultProps} />);

      expect(screen.getByRole('option', { name: 'Fecha (más reciente)' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Fecha (más antigua)' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Precio (mayor)' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Precio (menor)' })).toBeInTheDocument();
    });

    it('displays the current search term', () => {
      render(<SearchAndFilters {...defaultProps} searchTerm="Juan" />);

      expect(screen.getByPlaceholderText('Buscar por paciente')).toHaveValue('Juan');
    });

    it('displays the current status filter', () => {
      render(<SearchAndFilters {...defaultProps} statusFilter={PaymentStatus.PENDING} />);

      const statusSelect = screen.getAllByRole('combobox')[0];
      expect(statusSelect).toHaveValue('pending');
    });

    it('displays the current sort option', () => {
      render(<SearchAndFilters {...defaultProps} sortBy="price-desc" />);

      const sortSelect = screen.getAllByRole('combobox')[1];
      expect(sortSelect).toHaveValue('price-desc');
    });
  });

  // ==================== SEARCH INTERACTIONS ====================
  describe('Search Interactions', () => {
    it('calls onSearchChange when typing in search input', async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();

      render(<SearchAndFilters {...defaultProps} onSearchChange={onSearchChange} />);

      const searchInput = screen.getByPlaceholderText('Buscar por paciente');
      await user.type(searchInput, 'Juan');

      expect(onSearchChange).toHaveBeenCalled();
      // Called once per character typed
      expect(onSearchChange).toHaveBeenCalledTimes(4);
    });

    it('calls onSearchChange with correct value', async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();

      render(<SearchAndFilters {...defaultProps} onSearchChange={onSearchChange} />);

      const searchInput = screen.getByPlaceholderText('Buscar por paciente');
      await user.type(searchInput, 'P');

      expect(onSearchChange).toHaveBeenLastCalledWith('P');
    });
  });

  // ==================== STATUS FILTER INTERACTIONS ====================
  describe('Status Filter Interactions', () => {
    it('calls onStatusFilterChange when status is changed', async () => {
      const user = userEvent.setup();
      const onStatusFilterChange = vi.fn();

      render(<SearchAndFilters {...defaultProps} onStatusFilterChange={onStatusFilterChange} />);

      const statusSelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(statusSelect, 'pending');

      expect(onStatusFilterChange).toHaveBeenCalledWith('pending');
    });

    it('can select all status options', async () => {
      const user = userEvent.setup();
      const onStatusFilterChange = vi.fn();

      render(<SearchAndFilters {...defaultProps} onStatusFilterChange={onStatusFilterChange} />);

      const statusSelect = screen.getAllByRole('combobox')[0];

      await user.selectOptions(statusSelect, 'pending');
      expect(onStatusFilterChange).toHaveBeenCalledWith('pending');

      await user.selectOptions(statusSelect, 'overdue');
      expect(onStatusFilterChange).toHaveBeenCalledWith('overdue');

      await user.selectOptions(statusSelect, 'paid');
      expect(onStatusFilterChange).toHaveBeenCalledWith('paid');

      await user.selectOptions(statusSelect, 'all');
      expect(onStatusFilterChange).toHaveBeenCalledWith('all');
    });
  });

  // ==================== SORT INTERACTIONS ====================
  describe('Sort Interactions', () => {
    it('calls onSortChange when sort is changed', async () => {
      const user = userEvent.setup();
      const onSortChange = vi.fn();

      render(<SearchAndFilters {...defaultProps} onSortChange={onSortChange} />);

      const sortSelect = screen.getAllByRole('combobox')[1];
      await user.selectOptions(sortSelect, 'price-desc');

      expect(onSortChange).toHaveBeenCalledWith('price-desc');
    });

    it('can select all sort options', async () => {
      const user = userEvent.setup();
      const onSortChange = vi.fn();

      render(<SearchAndFilters {...defaultProps} onSortChange={onSortChange} />);

      const sortSelect = screen.getAllByRole('combobox')[1];

      await user.selectOptions(sortSelect, 'date-asc');
      expect(onSortChange).toHaveBeenCalledWith('date-asc');

      await user.selectOptions(sortSelect, 'price-desc');
      expect(onSortChange).toHaveBeenCalledWith('price-desc');

      await user.selectOptions(sortSelect, 'price-asc');
      expect(onSortChange).toHaveBeenCalledWith('price-asc');

      await user.selectOptions(sortSelect, 'date-desc');
      expect(onSortChange).toHaveBeenCalledWith('date-desc');
    });
  });

  // ==================== ACCESSIBILITY ====================
  describe('Accessibility', () => {
    it('search input has accessible aria-label', () => {
      render(<SearchAndFilters {...defaultProps} />);

      const searchInput = screen.getByLabelText('Buscar por paciente');
      expect(searchInput).toBeInTheDocument();
    });

    it('select elements have accessible aria-labels', () => {
      render(<SearchAndFilters {...defaultProps} />);

      const selects = screen.getAllByLabelText('Ordenar por');
      expect(selects.length).toBeGreaterThanOrEqual(1);
    });

    it('search input is focusable', () => {
      render(<SearchAndFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Buscar por paciente');
      searchInput.focus();
      expect(searchInput).toHaveFocus();
    });

    it('dropdowns are focusable', () => {
      render(<SearchAndFilters {...defaultProps} />);

      const selects = screen.getAllByRole('combobox');
      selects.forEach((select) => {
        select.focus();
        expect(select).toHaveFocus();
      });
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles empty search term', () => {
      render(<SearchAndFilters {...defaultProps} searchTerm="" />);

      expect(screen.getByPlaceholderText('Buscar por paciente')).toHaveValue('');
    });

    it('handles very long search term', async () => {
      const longTerm = 'A'.repeat(100);
      const onSearchChange = vi.fn();

      render(<SearchAndFilters {...defaultProps} searchTerm={longTerm} onSearchChange={onSearchChange} />);

      expect(screen.getByPlaceholderText('Buscar por paciente')).toHaveValue(longTerm);
    });

    it('handles special characters in search', async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();

      render(<SearchAndFilters {...defaultProps} onSearchChange={onSearchChange} />);

      const searchInput = screen.getByPlaceholderText('Buscar por paciente');
      await user.type(searchInput, '@#$');

      expect(onSearchChange).toHaveBeenCalledTimes(3);
    });
  });
});
