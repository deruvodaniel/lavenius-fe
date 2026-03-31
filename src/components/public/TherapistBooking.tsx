import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Home, Loader2, RefreshCw } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { ApiClientError } from '@/lib/api/client';
import { publicBookingService, type AvailabilitySlot } from '@/lib/services/publicBooking.service';
import { SessionType } from '@/lib/types/session';

interface BookingFormState {
  patientFirstName: string;
  patientEmail: string;
  patientPhone: string;
  sessionType: SessionType;
  bookingMessage: string;
}

const BOOKING_MESSAGE_MAX_LENGTH = 500;
const DISPLAY_TIMEZONE = 'America/Argentina/Buenos_Aires';

function formatSlotDateLabel(slot: AvailabilitySlot): string {
  return new Date(slot.from).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: DISPLAY_TIMEZONE,
  });
}

function formatSlotTimeLabel(slot: AvailabilitySlot): string {
  const from = new Date(slot.from).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: DISPLAY_TIMEZONE,
  });
  const to = new Date(slot.to).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: DISPLAY_TIMEZONE,
  });
  return `${from} - ${to}`;
}

function getSlotDurationMinutes(slot: AvailabilitySlot): number {
  const from = new Date(slot.from).getTime();
  const to = new Date(slot.to).getTime();
  return Math.max(0, Math.round((to - from) / 60000));
}

export function TherapistBooking() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { therapistId } = useParams<{ therapistId: string }>();

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  const [formData, setFormData] = useState<BookingFormState>({
    patientFirstName: user?.firstName ?? '',
    patientEmail: user?.primaryEmailAddress?.emailAddress ?? '',
    patientPhone: '',
    sessionType: SessionType.REMOTE,
    bookingMessage: '',
  });

  useEffect(() => {
    setFormData((previous) => ({
      ...previous,
      patientFirstName: user?.firstName ?? previous.patientFirstName,
      patientEmail: user?.primaryEmailAddress?.emailAddress ?? previous.patientEmail,
    }));
  }, [user]);

  const groupedSlots = useMemo(() => {
    const groups = new Map<string, AvailabilitySlot[]>();
    slots.forEach((slot) => {
      const key = formatSlotDateLabel(slot);
      const current = groups.get(key) ?? [];
      current.push(slot);
      groups.set(key, current);
    });
    return Array.from(groups.entries());
  }, [slots]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.from === selectedSlotId) ?? null,
    [selectedSlotId, slots],
  );
  const selectedSlotDurationMinutes = useMemo(
    () => (selectedSlot ? getSlotDurationMinutes(selectedSlot) : null),
    [selectedSlot],
  );
  const selectedSlotDateLabel = useMemo(
    () => (selectedSlot ? formatSlotDateLabel(selectedSlot) : null),
    [selectedSlot],
  );
  const selectedSlotTimeLabel = useMemo(
    () => (selectedSlot ? formatSlotTimeLabel(selectedSlot) : null),
    [selectedSlot],
  );

  const fetchAvailability = async () => {
    if (!therapistId) {
      setFormError(t('publicBooking.errors.invalidTherapist'));
      setIsLoadingSlots(false);
      return;
    }

    setIsLoadingSlots(true);
    setFormError(null);

    try {
      const response = await publicBookingService.getAvailability(therapistId);
      const nextSlots = response.slots ?? [];
      setSlots(nextSlots);
      setSelectedSlotId(nextSlots[0]?.from ?? null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.statusCode === 404) {
          setFormError(t('publicBooking.errors.therapistUnavailable'));
        } else if (error.statusCode === 403) {
          setFormError(t('publicBooking.errors.forbidden'));
        } else {
          setFormError(error.message || t('publicBooking.errors.generic'));
        }
      } else {
        setFormError(t('publicBooking.errors.generic'));
      }
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    void fetchAvailability();
  }, [therapistId]);

  const validateForm = (): string | null => {
    if (!selectedSlot) {
      return t('publicBooking.validation.slotRequired');
    }
    if (new Date(selectedSlot.from).getTime() <= Date.now()) {
      return t('publicBooking.validation.pastSlot');
    }
    if (!formData.patientFirstName.trim()) {
      return t('publicBooking.validation.firstNameRequired');
    }
    if (!formData.patientEmail.trim() || !formData.patientEmail.includes('@')) {
      return t('publicBooking.validation.emailRequired');
    }
    const phoneDigits = formData.patientPhone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      return t('publicBooking.validation.phoneRequired');
    }
    if (formData.bookingMessage.length > BOOKING_MESSAGE_MAX_LENGTH) {
      return t('publicBooking.validation.messageTooLong', { max: BOOKING_MESSAGE_MAX_LENGTH });
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setRetryAfterSeconds(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!therapistId || !selectedSlot) {
      setFormError(t('publicBooking.errors.invalidTherapist'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await publicBookingService.createBooking(therapistId, {
        scheduledFrom: selectedSlot.from,
        scheduledTo: selectedSlot.to,
        sessionType: formData.sessionType,
        patientEmail: formData.patientEmail.trim(),
        patientFirstName: formData.patientFirstName.trim(),
        patientPhone: formData.patientPhone.trim(),
        bookingMessage: formData.bookingMessage.trim() || undefined,
      });

      setSuccessBookingId(response.id);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.statusCode === 409) {
          setFormError(t('publicBooking.errors.conflict'));
          void fetchAvailability();
        } else if (error.statusCode === 429) {
          setRetryAfterSeconds(error.retryAfterSeconds ?? null);
          setFormError(
            error.retryAfterSeconds
              ? t('publicBooking.errors.rateLimitedWithRetry', { seconds: error.retryAfterSeconds })
              : t('publicBooking.errors.rateLimited'),
          );
        } else if (error.statusCode === 403) {
          setFormError(t('publicBooking.errors.forbidden'));
        } else {
          setFormError(error.message || t('publicBooking.errors.generic'));
        }
      } else {
        setFormError(t('publicBooking.errors.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successBookingId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-4">
        <div className="max-w-xl mx-auto pt-16">
          <Card className="overflow-hidden border-indigo-500/30 shadow-2xl">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
            <CardHeader className="text-center space-y-3 pt-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl">{t('publicBooking.success.title')}</CardTitle>
              <CardDescription className="text-base">{t('publicBooking.success.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pb-6">
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  {t('publicBooking.success.statusLabel')}
                </p>
                <p className="font-semibold text-foreground">{t('agenda.status.pendingApproval')}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('publicBooking.success.pendingHelp', 'El terapeuta revisará tu solicitud y te confirmará el turno.')}
                </p>
              </div>

              {selectedSlotDateLabel && selectedSlotTimeLabel ? (
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                    {t('publicBooking.success.sessionDetailsTitle', 'Detalles del turno')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('common.date')}</p>
                      <p className="text-sm font-medium text-foreground">{selectedSlotDateLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('common.time')}</p>
                      <p className="text-sm font-medium text-foreground">{selectedSlotTimeLabel}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rounded-md bg-muted/40 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  {t('publicBooking.success.bookingId')}: <code className="text-foreground break-all">{successBookingId}</code>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  className="w-full sm:flex-1 sm:w-auto"
                  onClick={() => {
                    setSuccessBookingId(null);
                    void fetchAvailability();
                  }}
                >
                  {t('publicBooking.actions.bookAnother')}
                </Button>
                <Button asChild type="button" variant="outline" className="w-full sm:w-auto">
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    {t('publicBooking.actions.goHome')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-4">
      <div className="max-w-3xl mx-auto pt-8 pb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              {t('publicBooking.title')}
            </CardTitle>
            <CardDescription>{t('publicBooking.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSlots ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t('publicBooking.fields.slot')}</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void fetchAvailability()} disabled={isSubmitting}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {t('publicBooking.actions.refresh')}
                    </Button>
                  </div>
                  {selectedSlotDurationMinutes ? (
                    <p className="text-xs text-muted-foreground">
                      {t('publicBooking.details.sessionDuration', { minutes: selectedSlotDurationMinutes })}
                    </p>
                  ) : null}

                  {groupedSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('publicBooking.emptySlots')}</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-3 bg-muted/20">
                      {groupedSlots.map(([dayLabel, daySlots]) => (
                        <div key={dayLabel}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{dayLabel}</p>
                          <div className="flex flex-wrap gap-2">
                            {daySlots.map((slot) => (
                              <Button
                                key={slot.from}
                                type="button"
                                size="sm"
                                variant={selectedSlotId === slot.from ? 'default' : 'outline'}
                                onClick={() => setSelectedSlotId(slot.from)}
                                disabled={isSubmitting}
                              >
                                {formatSlotTimeLabel(slot)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="booking-first-name">{t('publicBooking.fields.firstName')}</Label>
                    <Input
                      id="booking-first-name"
                      value={formData.patientFirstName}
                      onChange={(event) => setFormData((prev) => ({ ...prev, patientFirstName: event.target.value }))}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="booking-email">{t('publicBooking.fields.email')}</Label>
                    <Input
                      id="booking-email"
                      type="email"
                      value={formData.patientEmail}
                      onChange={(event) => setFormData((prev) => ({ ...prev, patientEmail: event.target.value }))}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="booking-phone">{t('publicBooking.fields.phone')}</Label>
                    <PhoneInput
                      id="booking-phone"
                      value={formData.patientPhone}
                      onChange={(phone) => setFormData((prev) => ({ ...prev, patientPhone: phone }))}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="booking-session-type">{t('publicBooking.fields.sessionType')}</Label>
                    <select
                      id="booking-session-type"
                      value={formData.sessionType}
                      onChange={(event) => setFormData((prev) => ({ ...prev, sessionType: event.target.value as SessionType }))}
                      className="w-full h-9 rounded-md border border-input bg-input-background px-3 text-sm"
                      disabled={isSubmitting}
                    >
                      <option value={SessionType.REMOTE}>{t('agenda.sessionTypes.remote')}</option>
                      <option value={SessionType.PRESENTIAL}>{t('agenda.sessionTypes.presential')}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booking-message">{t('publicBooking.fields.message')}</Label>
                  <Textarea
                    id="booking-message"
                    value={formData.bookingMessage}
                    onChange={(event) => setFormData((prev) => ({ ...prev, bookingMessage: event.target.value }))}
                    maxLength={BOOKING_MESSAGE_MAX_LENGTH}
                    disabled={isSubmitting}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.bookingMessage.length}/{BOOKING_MESSAGE_MAX_LENGTH}
                  </p>
                </div>

                {formError && (
                  <div className="rounded-md border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
                    {formError}
                    {retryAfterSeconds ? (
                      <p className="mt-1 text-xs">{t('publicBooking.errors.retryAfterHint', { seconds: retryAfterSeconds })}</p>
                    ) : null}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" className="w-full sm:flex-1 sm:w-auto" disabled={isSubmitting || groupedSlots.length === 0}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('publicBooking.actions.submitting')}
                      </>
                    ) : (
                      t('publicBooking.actions.submit')
                    )}
                  </Button>
                  <Button asChild type="button" variant="outline" className="w-full sm:w-auto">
                    <Link to="/">{t('publicBooking.actions.goHome')}</Link>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TherapistBooking;
