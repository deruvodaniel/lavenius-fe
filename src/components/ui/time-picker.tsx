"use client";

import * as React from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "./utils";

// ============================================================================
// TYPES
// ============================================================================

interface TimePickerProps {
  /** Selected time as string (HH:mm format) */
  value?: string;
  /** Callback when time changes - returns string (HH:mm) */
  onChange: (time: string) => void;
  /** Placeholder text when no time is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Additional class names for the trigger button */
  className?: string;
  /** ID for the trigger button (for form labels) */
  id?: string;
  /** aria-label for accessibility */
  "aria-label"?: string;
  /** Minimum hour (0-23), default 0 */
  minHour?: number;
  /** Maximum hour (0-23), default 23 */
  maxHour?: number;
  /** Minute step (5, 10, 15, 30), default 5 */
  minuteStep?: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse time string to hours and minutes
 */
function parseTime(value: string | undefined): { hours: number; minutes: number } {
  if (!value) return { hours: 9, minutes: 0 };
  const [h, m] = value.split(":").map(Number);
  return {
    hours: isNaN(h) ? 9 : Math.min(23, Math.max(0, h)),
    minutes: isNaN(m) ? 0 : Math.min(59, Math.max(0, m)),
  };
}

/**
 * Format hours and minutes to time string (HH:mm)
 */
function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Format time for display (e.g., "9:00 AM" or "14:30")
 */
function formatDisplayTime(hours: number, minutes: number, use24Hour: boolean): string {
  if (use24Hour) {
    return formatTime(hours, minutes);
  }
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Generate array of hours
 */
function generateHours(min: number, max: number): number[] {
  const hours: number[] = [];
  for (let i = min; i <= max; i++) {
    hours.push(i);
  }
  return hours;
}

/**
 * Generate array of minutes based on step
 */
function generateMinutes(step: number): number[] {
  const minutes: number[] = [];
  for (let i = 0; i < 60; i += step) {
    minutes.push(i);
  }
  return minutes;
}

// ============================================================================
// SCROLL COLUMN COMPONENT
// ============================================================================

interface ScrollColumnProps {
  values: number[];
  selected: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
  label: string;
}

function ScrollColumn({ values, selected, onChange, formatValue, label }: ScrollColumnProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selectedIndex = values.indexOf(selected);

  // Scroll to selected value when opening
  React.useEffect(() => {
    if (containerRef.current && selectedIndex >= 0) {
      const itemHeight = 36; // h-9 = 36px
      containerRef.current.scrollTop = selectedIndex * itemHeight;
    }
  }, [selectedIndex]);

  const handleIncrement = () => {
    const currentIndex = values.indexOf(selected);
    if (currentIndex < values.length - 1) {
      onChange(values[currentIndex + 1]);
    }
  };

  const handleDecrement = () => {
    const currentIndex = values.indexOf(selected);
    if (currentIndex > 0) {
      onChange(values[currentIndex - 1]);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <span className="sr-only">{label}</span>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={values.indexOf(selected) === 0}
        className="p-1 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label={`Decrease ${label}`}
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <div
        ref={containerRef}
        className="h-[108px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        role="listbox"
        aria-label={label}
      >
        {values.map((value) => (
          <button
            key={value}
            type="button"
            role="option"
            aria-selected={value === selected}
            onClick={() => onChange(value)}
            className={cn(
              "w-12 h-9 flex items-center justify-center text-sm rounded transition-colors",
              value === selected
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-accent text-foreground"
            )}
          >
            {formatValue(value)}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={values.indexOf(selected) === values.length - 1}
        className="p-1 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label={`Increase ${label}`}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * TimePicker Component
 * 
 * A styled time picker using Popover with scrollable hour/minute columns.
 * Supports 24-hour format and configurable ranges.
 * 
 * @example
 * ```tsx
 * <TimePicker
 *   value={formData.startTime}
 *   onChange={(time) => setFormData({ ...formData, startTime: time })}
 *   placeholder="Select time"
 * />
 * ```
 */
function TimePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  id,
  "aria-label": ariaLabel,
  minHour = 0,
  maxHour = 23,
  minuteStep = 5,
}: TimePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  // Parse current value
  const { hours, minutes } = parseTime(value);

  // Generate options
  const hourOptions = React.useMemo(() => generateHours(minHour, maxHour), [minHour, maxHour]);
  const minuteOptions = React.useMemo(() => generateMinutes(minuteStep), [minuteStep]);

  // Find closest valid minute if current minute doesn't match step
  const validMinutes = React.useMemo(() => {
    if (minuteOptions.includes(minutes)) return minutes;
    return minuteOptions.reduce((prev, curr) =>
      Math.abs(curr - minutes) < Math.abs(prev - minutes) ? curr : prev
    );
  }, [minutes, minuteOptions]);

  // Get placeholder text
  const placeholderText = placeholder || t("common.timePicker.selectTime");

  // Format the displayed time (always use 24h format for now)
  const displayValue = value
    ? formatDisplayTime(hours, validMinutes, true)
    : placeholderText;

  // Handle hour change
  const handleHourChange = (newHour: number) => {
    onChange(formatTime(newHour, validMinutes));
  };

  // Handle minute change
  const handleMinuteChange = (newMinute: number) => {
    onChange(formatTime(hours, newMinute));
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel || placeholderText}
          className={cn(
            "flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
            "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{displayValue}</span>
          </span>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-[9999] bg-popover text-popover-foreground rounded-md border shadow-lg p-3"
        >
          <div className="flex items-center gap-2">
            <ScrollColumn
              values={hourOptions}
              selected={hours}
              onChange={handleHourChange}
              formatValue={(v) => v.toString().padStart(2, "0")}
              label={t("common.timePicker.hours")}
            />
            <span className="text-xl font-medium text-muted-foreground">:</span>
            <ScrollColumn
              values={minuteOptions}
              selected={validMinutes}
              onChange={handleMinuteChange}
              formatValue={(v) => v.toString().padStart(2, "0")}
              label={t("common.timePicker.minutes")}
            />
          </div>
          <div className="mt-3 pt-3 border-t flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              {t("common.done")}
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { TimePicker };
export type { TimePickerProps };
