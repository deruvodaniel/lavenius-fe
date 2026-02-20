"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "./utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

// ============================================================================
// TYPES
// ============================================================================

interface DatePickerProps {
  /** Selected date as ISO string (YYYY-MM-DD) or Date object */
  value?: string | Date;
  /** Callback when date changes - returns ISO string (YYYY-MM-DD) or undefined */
  onChange: (date: string | undefined) => void;
  /** Placeholder text when no date is selected */
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
 * Parse a value to a Date object
 */
function parseValue(value: string | Date | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  // Parse ISO string (YYYY-MM-DD)
  const date = new Date(value + "T00:00:00");
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Format a Date to ISO string (YYYY-MM-DD)
 */
function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format a Date for display using locale
 */
function formatDisplayDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * DatePicker Component
 * 
 * A styled date picker using Popover and Calendar components.
 * Supports localization, disabled state, and clearable option.
 * Accepts and returns ISO date strings (YYYY-MM-DD) for easy form handling.
 * 
 * @example
 * ```tsx
 * <DatePicker
 *   value={formData.date}
 *   onChange={(date) => setFormData({ ...formData, date })}
 *   placeholder="Select date"
 *   clearable
 * />
 * ```
 */
function DatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  clearable = false,
  className,
  fromDate,
  toDate,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);

  // Get the current locale for formatting
  const locale = localeMap[i18n.language] || "es-ES";

  // Parse value to Date
  const date = parseValue(value);

  // Get placeholder text
  const placeholderText = placeholder || t("common.datePicker.selectDate");

  // Format the displayed date
  const displayValue = date
    ? formatDisplayDate(date, locale)
    : placeholderText;

  // Handle date selection
  const handleSelect = (selectedDate: Date | undefined) => {
    onChange(selectedDate ? toISODateString(selectedDate) : undefined);
    setOpen(false);
  };

  // Handle clear button click
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel || placeholderText}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            ariaInvalid && "border-red-300 bg-red-50",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">{displayValue}</span>
          {clearable && date && !disabled && (
            <X
              className="ml-2 h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
              aria-label={t("common.clear")}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          fromDate={fromDate}
          toDate={toDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
export type { DatePickerProps };
