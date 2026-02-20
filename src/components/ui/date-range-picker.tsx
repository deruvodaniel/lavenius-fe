"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";

import { cn } from "./utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

// ============================================================================
// TYPES
// ============================================================================

interface DateRangePickerProps {
  /** Selected date range */
  dateRange?: DateRange;
  /** Callback when date range changes */
  onDateRangeChange: (range: DateRange | undefined) => void;
  /** Placeholder text when no range is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Whether to show a clear button */
  clearable?: boolean;
  /** Additional class names for the trigger button */
  className?: string;
  /** Minimum selectable date */
  fromDate?: Date;
  /** Maximum selectable date */
  toDate?: Date;
  /** Number of months to display (1 on mobile, 2 on desktop by default) */
  numberOfMonths?: number;
  /** ID for the trigger button (for form labels) */
  id?: string;
  /** aria-label for accessibility */
  "aria-label"?: string;
  /** aria-invalid for form validation */
  "aria-invalid"?: boolean;
}

// ============================================================================
// LOCALE MAPPING
// ============================================================================

const localeMap: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format a Date for display using locale
 */
function formatDisplayDate(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(locale, options || {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to detect if we're on a mobile device
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * DateRangePicker Component
 * 
 * A styled date range picker using Popover and Calendar components.
 * Shows two months side by side on desktop, single month on mobile.
 * Supports localization, disabled state, and clearable option.
 * 
 * @example
 * ```tsx
 * <DateRangePicker
 *   dateRange={{ from: startDate, to: endDate }}
 *   onDateRangeChange={({ from, to }) => {
 *     setStartDate(from);
 *     setEndDate(to);
 *   }}
 *   placeholder="Select date range"
 *   clearable
 * />
 * ```
 */
function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder,
  disabled = false,
  clearable = false,
  className,
  fromDate,
  toDate,
  numberOfMonths,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: DateRangePickerProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  // Get the current locale for formatting
  const locale = localeMap[i18n.language] || "es-ES";

  // Get placeholder text
  const placeholderText = placeholder || t("common.datePicker.selectRange");

  // Determine number of months to show
  const monthsToShow = numberOfMonths ?? (isMobile ? 1 : 2);

  // Format the displayed date range
  const formatDisplayValue = () => {
    if (!dateRange?.from) {
      return placeholderText;
    }

    if (!dateRange.to) {
      return formatDisplayDate(dateRange.from, locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    return `${formatDisplayDate(dateRange.from, locale)} - ${formatDisplayDate(
      dateRange.to,
      locale
    )}`;
  };

  const displayValue = formatDisplayValue();

  // Handle date range selection
  const handleSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range);
    // Only close when both dates are selected
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  // Handle clear button click
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel || placeholderText}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateRange?.from && "text-muted-foreground",
            ariaInvalid && "border-red-300 bg-red-50",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">{displayValue}</span>
          {clearable && dateRange?.from && !disabled && (
            <X
              className="ml-2 h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
              aria-label={t("common.clear")}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-auto p-0",
          monthsToShow > 1 && "min-w-[540px]"
        )} 
        align="start"
      >
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={monthsToShow}
          fromDate={fromDate}
          toDate={toDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DateRangePicker };
export type { DateRangePickerProps };
