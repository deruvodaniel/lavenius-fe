import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Repeat, Calendar } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import type { SessionRecurrence, SessionRecurrenceType } from '@/lib/types/session';
import { SessionRecurrenceType as RecurrenceType } from '@/lib/types/session';

interface RecurrenceSelectorProps {
  value?: SessionRecurrence;
  onChange: (value: SessionRecurrence | undefined) => void;
  sessionDate?: string; // ISO date string (YYYY-MM-DD) of the session
  className?: string;
}

const DAYS_OF_WEEK = [
  { value: 1, labelKey: 'agenda.recurrence.daysOfWeek.monday' },
  { value: 2, labelKey: 'agenda.recurrence.daysOfWeek.tuesday' },
  { value: 3, labelKey: 'agenda.recurrence.daysOfWeek.wednesday' },
  { value: 4, labelKey: 'agenda.recurrence.daysOfWeek.thursday' },
  { value: 5, labelKey: 'agenda.recurrence.daysOfWeek.friday' },
  { value: 6, labelKey: 'agenda.recurrence.daysOfWeek.saturday' },
  { value: 7, labelKey: 'agenda.recurrence.daysOfWeek.sunday' },
];

/**
 * Get the day of week (1-7, Monday=1) from an ISO date string
 */
function getDayOfWeek(isoDate: string): number {
  const date = new Date(isoDate + 'T00:00:00');
  const day = date.getDay();
  // Convert JS day (0=Sunday) to ISO day (1=Monday, 7=Sunday)
  return day === 0 ? 7 : day;
}

/**
 * RecurrenceSelector Component
 *
 * Allows users to configure session recurrence patterns.
 * Supports: working_days, weekly, biweekly, monthly
 *
 * Features:
 * - Enable/disable recurrence with checkbox
 * - Select recurrence type via radio group
 * - Choose end date with date picker
 * - Select specific days of week for weekly/biweekly patterns
 * - Validates that session day is included in selected days
 */
export function RecurrenceSelector({
  value,
  onChange,
  sessionDate,
  className,
}: RecurrenceSelectorProps) {
  const { t } = useTranslation();

  const [enabled, setEnabled] = useState(!!value);
  const [recurrenceType, setRecurrenceType] = useState<SessionRecurrenceType>(
    value?.type || RecurrenceType.WEEKLY
  );
  const [untilDate, setUntilDate] = useState<string>(value?.until || '');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    value?.daysOfWeek || []
  );

  // Sync with external value changes
  useEffect(() => {
    if (value) {
      setEnabled(true);
      setRecurrenceType(value.type);
      setUntilDate(value.until);
      setDaysOfWeek(value.daysOfWeek || []);
    } else {
      setEnabled(false);
    }
  }, [value]);

  // Update parent when internal state changes
  useEffect(() => {
    if (!enabled) {
      onChange(undefined);
      return;
    }

    if (!untilDate) {
      // Don't emit incomplete recurrence config
      return;
    }

    const needsDaysOfWeek =
      recurrenceType === RecurrenceType.WEEKLY ||
      recurrenceType === RecurrenceType.BIWEEKLY;

    if (needsDaysOfWeek && daysOfWeek.length === 0) {
      // Don't emit incomplete config
      return;
    }

    // Convert date to ISO string with end of day time (23:59:59)
    const untilDateTime = untilDate.includes('T')
      ? untilDate
      : `${untilDate}T23:59:59Z`;

    const recurrence: SessionRecurrence = {
      type: recurrenceType,
      until: untilDateTime,
      ...(needsDaysOfWeek && { daysOfWeek }),
    };

    onChange(recurrence);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, recurrenceType, untilDate, daysOfWeek]);

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      onChange(undefined);
    }
  };

  const handleTypeChange = (type: string) => {
    const newType = type as SessionRecurrenceType;
    setRecurrenceType(newType);

    // Auto-populate daysOfWeek with session day when switching to weekly/biweekly
    if (
      (newType === RecurrenceType.WEEKLY || newType === RecurrenceType.BIWEEKLY) &&
      sessionDate &&
      daysOfWeek.length === 0
    ) {
      const sessionDay = getDayOfWeek(sessionDate);
      setDaysOfWeek([sessionDay]);
    }
  };

  const handleDayToggle = (day: number, checked: boolean) => {
    setDaysOfWeek((prev) => {
      if (checked) {
        return [...prev, day].sort();
      } else {
        return prev.filter((d) => d !== day);
      }
    });
  };

  const showDaysOfWeek =
    enabled &&
    (recurrenceType === RecurrenceType.WEEKLY ||
     recurrenceType === RecurrenceType.BIWEEKLY);

  // Validate: if session date is set, it must be included in selected days
  const sessionDay = sessionDate ? getDayOfWeek(sessionDate) : null;
  const hasValidationError =
    showDaysOfWeek &&
    sessionDay &&
    daysOfWeek.length > 0 &&
    !daysOfWeek.includes(sessionDay);

  // Calculate minimum until date (must be after session date)
  const minUntilDate = sessionDate ? new Date(sessionDate + 'T00:00:00') : new Date();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Enable Recurrence Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="recurrence-enabled"
          checked={enabled}
          onCheckedChange={handleEnabledChange}
          aria-describedby="recurrence-enabled-description"
        />
        <label
          htmlFor="recurrence-enabled"
          className="flex items-center gap-2 text-sm font-medium cursor-pointer text-foreground"
        >
          <Repeat className="w-4 h-4" />
          {t('agenda.recurrence.enableRecurrence')}
        </label>
      </div>
      <p id="recurrence-enabled-description" className="sr-only">
        {t('agenda.recurrence.enableRecurrenceDescription')}
      </p>

      {/* Recurrence Configuration (shown when enabled) */}
      {enabled && (
        <div className="space-y-4 pl-6 border-l-2 border-border">
          {/* Recurrence Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('agenda.recurrence.type')}
            </label>
            <RadioGroup
              value={recurrenceType}
              onValueChange={handleTypeChange}
              className="gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value={RecurrenceType.WORKING_DAYS}
                  id="recurrence-working-days"
                />
                <label
                  htmlFor="recurrence-working-days"
                  className="text-sm cursor-pointer text-foreground"
                >
                  {t('agenda.recurrence.types.workingDays')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value={RecurrenceType.WEEKLY}
                  id="recurrence-weekly"
                />
                <label
                  htmlFor="recurrence-weekly"
                  className="text-sm cursor-pointer text-foreground"
                >
                  {t('agenda.recurrence.types.weekly')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value={RecurrenceType.BIWEEKLY}
                  id="recurrence-biweekly"
                />
                <label
                  htmlFor="recurrence-biweekly"
                  className="text-sm cursor-pointer text-foreground"
                >
                  {t('agenda.recurrence.types.biweekly')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value={RecurrenceType.MONTHLY}
                  id="recurrence-monthly"
                />
                <label
                  htmlFor="recurrence-monthly"
                  className="text-sm cursor-pointer text-foreground"
                >
                  {t('agenda.recurrence.types.monthly')}
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Days of Week (only for weekly/biweekly) */}
          {showDaysOfWeek && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('agenda.recurrence.daysOfWeek.label')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSessionDay = sessionDay === day.value;
                  return (
                    <div
                      key={day.value}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md',
                        isSessionDay && 'bg-blue-50 dark:bg-blue-950/20'
                      )}
                    >
                      <Checkbox
                        id={`recurrence-day-${day.value}`}
                        checked={daysOfWeek.includes(day.value)}
                        onCheckedChange={(checked) =>
                          handleDayToggle(day.value, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`recurrence-day-${day.value}`}
                        className="text-sm cursor-pointer text-foreground flex-1"
                      >
                        {t(day.labelKey)}
                        {isSessionDay && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                            ({t('agenda.recurrence.sessionDay')})
                          </span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
              {hasValidationError && (
                <p className="text-sm text-red-500 mt-2">
                  {t('agenda.recurrence.validation.mustIncludeSessionDay')}
                </p>
              )}
            </div>
          )}

          {/* Until Date */}
          <div>
            <label htmlFor="recurrence-until" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4" />
              {t('agenda.recurrence.until')}
              <span className="text-red-500">*</span>
            </label>
            <DatePicker
              id="recurrence-until"
              value={untilDate}
              onChange={(date) => setUntilDate(date || '')}
              placeholder={t('agenda.recurrence.untilPlaceholder')}
              fromDate={minUntilDate}
              aria-invalid={!untilDate}
            />
            {untilDate && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('agenda.recurrence.untilHelp')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
