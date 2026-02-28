import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Search, ArrowUpDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { PaymentStatus } from '@/lib/types/api.types';

// ============================================================================
// TYPES
// ============================================================================

export type SortOption = 'date-desc' | 'date-asc' | 'price-desc' | 'price-asc';
export type QuickFilter = 'all' | 'week' | 'month' | 'custom';
export type StatusFilterOption = 'all' | PaymentStatus;

// Sort options with translation keys
export const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: 'date-desc', labelKey: 'payments.sort.dateDesc' },
  { value: 'date-asc', labelKey: 'payments.sort.dateAsc' },
  { value: 'price-desc', labelKey: 'payments.sort.priceDesc' },
  { value: 'price-asc', labelKey: 'payments.sort.priceAsc' },
];

// Status filter options with translation keys
export const STATUS_FILTER_OPTIONS: { value: StatusFilterOption; labelKey: string }[] = [
  { value: 'all', labelKey: 'payments.filters.allStatuses' },
  { value: PaymentStatus.PENDING, labelKey: 'payments.pending' },
  { value: PaymentStatus.OVERDUE, labelKey: 'payments.overdue' },
  { value: PaymentStatus.PAID, labelKey: 'payments.paid' },
];

// ============================================================================
// UTILITIES
// ============================================================================

/** Get the date range for the current week (Monday to Sunday) */
export const getWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    from: monday.toISOString().split('T')[0],
    to: sunday.toISOString().split('T')[0],
  };
};

/** Get the date range for the current month */
export const getMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    from: firstDay.toISOString().split('T')[0],
    to: lastDay.toISOString().split('T')[0],
  };
};

// ============================================================================
// DATE FILTERS COMPONENT
// ============================================================================

interface DateFiltersProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
}

/**
 * DateFilters - Quick filter buttons and custom date range picker
 * 
 * Provides preset filters (All, This Week, This Month) and a custom
 * date range picker that expands when selected.
 */
export function DateFilters({ 
  dateFrom, 
  dateTo, 
  onDateFromChange, 
  onDateToChange,
  onClearFilters,
  hasActiveFilters,
  quickFilter,
  onQuickFilterChange,
}: DateFiltersProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQuickFilter = (filter: QuickFilter) => {
    onQuickFilterChange(filter);
    
    if (filter === 'week') {
      const { from, to } = getWeekRange();
      onDateFromChange(from);
      onDateToChange(to);
      setIsExpanded(false);
    } else if (filter === 'month') {
      const { from, to } = getMonthRange();
      onDateFromChange(from);
      onDateToChange(to);
      setIsExpanded(false);
    } else if (filter === 'all') {
      onDateFromChange('');
      onDateToChange('');
      setIsExpanded(false);
    } else if (filter === 'custom') {
      setIsExpanded(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick filter buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={quickFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('all')}
          className=""
        >
          {t('payments.filters.all')}
        </Button>
        <Button
          variant={quickFilter === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('week')}
          className=""
        >
          {t('payments.filters.thisWeek')}
        </Button>
        <Button
          variant={quickFilter === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('month')}
          className=""
        >
          {t('payments.filters.thisMonth')}
        </Button>
        <Button
          variant={quickFilter === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('custom')}
          className=""
        >
          <Calendar className="h-4 w-4 mr-1.5" />
          {t('payments.filters.range')}
        </Button>
      </div>

      {/* Custom date range (expanded when "Rango" is selected) */}
      {(isExpanded || quickFilter === 'custom') && (
        <Card className="p-3 space-y-3 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="date-from" className="text-xs text-gray-500 mb-1 block">
                {t('payments.filters.from')}
              </label>
              <DatePicker
                id="date-from"
                value={dateFrom}
                onChange={(date) => {
                  onDateFromChange(date || '');
                  onQuickFilterChange('custom');
                }}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="text-xs text-gray-500 mb-1 block">
                {t('payments.filters.to')}
              </label>
              <DatePicker
                id="date-to"
                value={dateTo}
                onChange={(date) => {
                  onDateToChange(date || '');
                  onQuickFilterChange('custom');
                }}
                fromDate={dateFrom ? new Date(dateFrom) : undefined}
                className="w-full"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-gray-500">
              {t('payments.filters.clearFilters')}
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SEARCH AND FILTERS COMPONENT
// ============================================================================

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilterOption;
  onStatusFilterChange: (status: StatusFilterOption) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

/**
 * SearchAndFilters - Search input with status and sort dropdowns
 * 
 * Combines search, status filtering, and sort options in a compact layout
 * that stacks on mobile and aligns horizontally on desktop.
 */
export function SearchAndFilters({ 
  searchTerm, 
  onSearchChange, 
  statusFilter,
  onStatusFilterChange,
  sortBy, 
  onSortChange 
}: SearchAndFiltersProps) {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t('payments.filters.searchByPatient')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          aria-label={t('payments.filters.searchByPatient')}
        />
      </div>
      
      <div className="flex gap-2">
        {/* Status filter dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilterOption)}
            className="h-10 pl-8 pr-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
            aria-label={t('payments.filters.sortBy')}
          >
            {STATUS_FILTER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
          </select>
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        
        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="h-10 pl-8 pr-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
            aria-label={t('payments.filters.sortBy')}
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
          </select>
          <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
