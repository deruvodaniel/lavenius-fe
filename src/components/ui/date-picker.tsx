"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "./utils";
import { Calendar } from "./calendar";

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
    e.preventDefault();
    onChange(undefined);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel || placeholderText}
          aria-invalid={ariaInvalid}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
            "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !date && "text-muted-foreground",
            ariaInvalid && "border-destructive bg-destructive/10",
            className
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{displayValue}</span>
          </span>
          {clearable && date && !disabled && (
            <X
              className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={handleClear}
              aria-label={t("common.clear")}
            />
          )}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-[9999] bg-popover text-popover-foreground rounded-md border shadow-lg p-0"
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            fromDate={fromDate}
            toDate={toDate}
            initialFocus
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { DatePicker };
export type { DatePickerProps };
