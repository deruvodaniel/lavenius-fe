import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, DateSelectArg, EventContentArg, EventDropArg } from '@fullcalendar/core';
import { useTranslation } from 'react-i18next';
import { SessionType, SessionStatus, type SessionUI } from '@/lib/types/session';
import { SESSION_STATUS_COLORS } from '@/lib/constants/sessionColors';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, Grid3x3, Clock } from 'lucide-react';
import { LoadingOverlay } from '../shared/Skeleton';
import { toast } from 'sonner';
import { useResponsive } from '@/lib/hooks';
import { useSettingStore, settingSelectors } from '@/lib/stores/setting.store';
import type { DayOffSetting } from '@/lib/types/setting.types';

// ============================================================================
// SETTINGS TYPES & LOADER
// ============================================================================

type DiaOffTipo = 'full' | 'morning' | 'afternoon' | 'custom';

interface DiaOff {
  id: string; // Changed to string to match API setting id
  fecha: string;
  motivo: string;
  tipo?: DiaOffTipo; // Optional for backwards compatibility
  startTime?: string; // Solo para tipo 'custom'
  endTime?: string;   // Solo para tipo 'custom'
}

interface WorkingHours {
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  workingDays: number[]; // [1, 2, 3, 4, 5] = Mon-Fri (0 = Sunday)
}

interface CalendarSettings {
  workingHours: WorkingHours;
}

const SETTINGS_KEY = 'lavenius_settings';

const defaultWorkingHours: WorkingHours = {
  startTime: '09:00',
  endTime: '18:00',
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
};

// Get time range for a día off based on its tipo
const getDiaOffTimeRange = (dia: DiaOff): { start: string; end: string } => {
  const tipo = dia.tipo || 'full'; // Default to 'full' for backwards compatibility
  switch (tipo) {
    case 'full':
      return { start: '00:00', end: '23:59' };
    case 'morning':
      return { start: '00:00', end: '12:00' };
    case 'afternoon':
      return { start: '12:00', end: '23:59' };
    case 'custom':
      return { start: dia.startTime || '00:00', end: dia.endTime || '23:59' };
    default:
      return { start: '00:00', end: '23:59' };
  }
};

// Load working hours from localStorage (days off now come from API)
const loadCalendarSettings = (): CalendarSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        workingHours: settings.workingHours || defaultWorkingHours,
      };
    }
  } catch (error) {
    console.error('Error loading calendar settings:', error);
  }
  return { workingHours: defaultWorkingHours };
};

/**
 * Convert API DayOffSetting to calendar DiaOff format
 * The API stores date ranges, but for the calendar we need individual dates
 */
const convertApiDayOffToCalendarFormat = (setting: DayOffSetting): DiaOff[] => {
  const { config, description, id } = setting;
  const result: DiaOff[] = [];
  
  // Parse dates - API returns ISO strings like "2026-12-25"
  const fromDate = new Date(config.fromDate);
  const toDate = new Date(config.toDate);
  
  // Generate a DiaOff for each date in the range
  const currentDate = new Date(fromDate);
  let dayIndex = 0;
  
  while (currentDate <= toDate) {
    result.push({
      id: `${id}-${dayIndex}`, // Unique id for each day in the range
      fecha: currentDate.toISOString().split('T')[0],
      motivo: description || '',
      tipo: 'full', // API only supports full day off
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
    dayIndex++;
  }
  
  return result;
};

// ============================================================================
// COMPONENT
// ============================================================================

interface FullCalendarViewProps {
  sessions: SessionUI[];
  isLoading?: boolean;
  onEventClick?: (session: SessionUI) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  onEventDrop?: (sessionId: string, newStart: Date, newEnd: Date) => void;
  isSessionPaid?: (sessionId: string) => boolean;
  /** Fallback function to get patient name when session.patientName is not available */
  getPatientNameFallback?: (patientId: string | undefined) => string | undefined;
}

export function FullCalendarView({ 
  sessions, 
  isLoading = false,
  onEventClick, 
  onDateSelect,
  onEventDrop,
  isSessionPaid,
  getPatientNameFallback
}: FullCalendarViewProps) {
  const { t } = useTranslation();
  const calendarRef = useRef<FullCalendar>(null);
  const { isMobile } = useResponsive();
  
  // Default to day view on both mobile and desktop
  const defaultView = 'timeGridDay';
  const [currentView, setCurrentView] = useState(defaultView);

  // Change calendar view function
  const changeView = useCallback((view: string) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
      setCurrentView(view);
    }
  }, []);

  // Keep day view on mobile (week view not ideal for small screens)
  // This effect only syncs with the external FullCalendar API, not React state directly
  useEffect(() => {
    if (isMobile && currentView === 'timeGridWeek') {
      // Only call the calendar API - the state update happens in the callback
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.changeView('timeGridDay');
        // Use a microtask to batch with React's updates
        queueMicrotask(() => setCurrentView('timeGridDay'));
      }
    }
  }, [isMobile, currentView]);

  // Load working hours from localStorage
  const calendarSettings = useMemo(() => loadCalendarSettings(), []);
  const { workingHours } = calendarSettings;
  
  // Get days off from the settings store (API)
  const allSettings = useSettingStore((state) => state.settings);
  const fetchSettings = useSettingStore((state) => state.fetchSettings);
  const fetchStatus = useSettingStore((state) => state.fetchStatus);
  
  // Fetch settings on mount if not already loaded
  useEffect(() => {
    if (fetchStatus === 'idle') {
      fetchSettings().catch((error) => {
        console.error('Failed to fetch settings for calendar:', error);
      });
    }
  }, [fetchSettings, fetchStatus]);
  
  // Convert API day off settings to calendar format
  const diasOff = useMemo(() => {
    const dayOffSettings = settingSelectors.getDayOffSettings({ settings: allSettings, fetchStatus, error: null, lastFetchTime: null });
    // Flatten all day off ranges into individual days
    return dayOffSettings
      .filter(setting => setting.active) // Only active settings
      .flatMap(convertApiDayOffToCalendarFormat);
  }, [allSettings, fetchStatus]);

  // Generate a key based on sessions data to force FullCalendar to re-render when sessions change
  const calendarKey = useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return 'empty';
    return sessions.map(s => `${s.id}-${s.status}-${s.scheduledFrom}`).join('|');
  }, [sessions]);

  // Check if a date is a día off (returns the día off if it matches date AND time)
  const isDiaOff = (date: Date): DiaOff | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    const diaOff = diasOff.find(d => d.fecha === dateStr);
    
    if (!diaOff) return undefined;
    
    // Check if the time is within the día off range
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    const { start, end } = getDiaOffTimeRange(diaOff);
    
    // Check if time is within the día off range
    if (timeStr >= start && timeStr < end) {
      return diaOff;
    }
    
    return undefined;
  };
  
  // Check if a date has any día off configured (for all-day events display)
  const getDiaOffForDate = (date: Date): DiaOff | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return diasOff.find(d => d.fecha === dateStr);
  };

  // Check if a date is a non-working day
  const isNonWorkingDay = (date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return !workingHours.workingDays.includes(dayOfWeek);
  };

  // Check if time is outside working hours
  const isOutsideWorkingHours = (date: Date): boolean => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return timeStr < workingHours.startTime || timeStr >= workingHours.endTime;
  };

  // Convert sessions to FullCalendar events (filter out cancelled sessions)
  const sessionEvents = useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return [];
    return sessions
      .filter(session => session.status !== SessionStatus.CANCELLED)
      .map(session => {
        const typeIcons: Record<SessionType, string> = {
          [SessionType.PRESENTIAL]: '📍',
          [SessionType.REMOTE]: '💻',
        };

        const isPaid = isSessionPaid?.(session.id) ?? false;
        const className = `session-${session.status}`;
        
        // Try to get patient name from session, or use fallback
        const patientName = session.patientName 
          || getPatientNameFallback?.(session.patient?.id) 
          || t('agenda.details.noPatient');

        return {
          id: session.id,
          title: `${typeIcons[session.sessionType]} ${patientName}`,
          start: session.scheduledFrom,
          end: session.scheduledTo,
          classNames: [className],
          extendedProps: {
            session,
            status: session.status,
            type: session.sessionType,
            patientName,
            cost: session.cost,
            isPaid,
          },
        };
      });
  }, [sessions, isSessionPaid, getPatientNameFallback, t]);

  // Create background events for días off
  const diaOffEvents = useMemo(() => {
    if (!diasOff || !Array.isArray(diasOff)) return [];
    
    const events: Array<{
      id: string;
      start: string;
      end?: string;
      allDay?: boolean;
      display?: 'background';
      title?: string;
      classNames: string[];
      extendedProps?: {
        isDiaOff: boolean;
        motivo: string;
        tipo?: string;
      };
    }> = [];
    
    diasOff.forEach(dia => {
      const tipo = dia.tipo || 'full';
      const { start: startTime, end: endTime } = getDiaOffTimeRange(dia);
      const isFullDay = tipo === 'full';
      
      // Build label with time info for partial days
      let label = dia.motivo || t('agenda.calendar.allDay');
      if (!isFullDay) {
        const timeLabel = tipo === 'morning' ? t('agenda.dayOff.morning') : tipo === 'afternoon' ? t('agenda.dayOff.afternoon') : `${startTime}-${endTime}`;
        label = `${label} (${timeLabel})`;
      }
      
      if (isFullDay) {
        // Full day: use allDay events
        events.push({
          id: `dia-off-bg-${dia.id}`,
          start: dia.fecha,
          allDay: true,
          display: 'background',
          classNames: ['dia-off-event'],
        });
        events.push({
          id: `dia-off-label-${dia.id}`,
          title: label,
          start: dia.fecha,
          allDay: true,
          classNames: ['dia-off-label'],
          extendedProps: {
            isDiaOff: true,
            motivo: dia.motivo,
          },
        });
      } else {
        // Partial day: use timed events
        events.push({
          id: `dia-off-bg-${dia.id}`,
          start: `${dia.fecha}T${startTime}:00`,
          end: `${dia.fecha}T${endTime}:00`,
          display: 'background',
          classNames: ['dia-off-event', 'dia-off-partial'],
        });
        events.push({
          id: `dia-off-label-${dia.id}`,
          title: label,
          start: `${dia.fecha}T${startTime}:00`,
          end: `${dia.fecha}T${endTime}:00`,
          classNames: ['dia-off-label', 'dia-off-timed'],
          extendedProps: {
            isDiaOff: true,
            motivo: dia.motivo,
            tipo: dia.tipo,
          },
        });
      }
    });
    
    return events;
  }, [diasOff, t]);

  // Combine all events
  const events = [...sessionEvents, ...diaOffEvents];

  const handleEventClick = (clickInfo: EventClickArg) => {
    // Ignore clicks on día off background events
    if (clickInfo.event.extendedProps.isDiaOff) {
      return;
    }
    const session = clickInfo.event.extendedProps.session as SessionUI;
    onEventClick?.(session);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // Check if the selected date is a día off
    const diaOff = isDiaOff(selectInfo.start);
    if (diaOff) {
      const { start, end } = getDiaOffTimeRange(diaOff);
      const tipo = diaOff.tipo || 'full';
      const timeInfo = tipo === 'full' ? '' : ` (${start} - ${end})`;
      const message = diaOff.motivo 
        ? t('agenda.dayOff.warningWithReason', { reason: diaOff.motivo }) + timeInfo
        : t('agenda.dayOff.warning') + timeInfo;
      toast.warning(message);
      return;
    }
    
    // Check if it's a non-working day
    if (isNonWorkingDay(selectInfo.start)) {
      toast.warning(t('agenda.dayOff.nonWorkingDay'));
      return;
    }
    
    // Check if time is outside working hours (only for time-based selections)
    if (!selectInfo.allDay && isOutsideWorkingHours(selectInfo.start)) {
      toast.warning(t('agenda.dayOff.outsideWorkingHours', { start: workingHours.startTime, end: workingHours.endTime }));
      return;
    }
    
    onDateSelect?.(selectInfo.start, selectInfo.end);
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    const session = dropInfo.event.extendedProps.session as SessionUI;
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;
    
    if (!newStart || !newEnd) {
      dropInfo.revert();
      return;
    }
    
    // Check if dropped on a día off
    const diaOff = isDiaOff(newStart);
    if (diaOff) {
      const { start, end } = getDiaOffTimeRange(diaOff);
      const tipo = diaOff.tipo || 'full';
      const timeInfo = tipo === 'full' ? '' : ` (${start} - ${end})`;
      const message = diaOff.motivo 
        ? t('agenda.dayOff.cannotMoveToOff') + timeInfo + `: ${diaOff.motivo}`
        : t('agenda.dayOff.cannotMoveToOff') + timeInfo;
      toast.warning(message);
      dropInfo.revert();
      return;
    }
    
    // Check if dropped on a non-working day
    if (isNonWorkingDay(newStart)) {
      toast.warning(t('agenda.dayOff.cannotMoveToNonWorking'));
      dropInfo.revert();
      return;
    }
    
    // Check if dropped outside working hours
    if (isOutsideWorkingHours(newStart)) {
      toast.warning(t('agenda.dayOff.cannotMoveOutsideHours', { start: workingHours.startTime, end: workingHours.endTime }));
      dropInfo.revert();
      return;
    }
    
    onEventDrop?.(session.id, newStart, newEnd);
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { extendedProps } = eventInfo.event;
    const isTimeGrid = currentView.startsWith('timeGrid');
    const isDayView = currentView === 'timeGridDay';
    
    // For time grid views (day/week), show more detailed content
    if (isTimeGrid) {
      return (
        <div className="fc-event-main-frame h-full flex flex-col overflow-hidden p-1">
          {/* Time - always visible */}
          <div className="fc-event-time text-[10px] font-bold opacity-90 shrink-0">
            {eventInfo.timeText}
          </div>
          {/* Patient name - truncate if needed */}
          <div className={`fc-event-title font-medium leading-tight ${isDayView ? 'text-sm' : 'text-xs'} truncate`}>
            {extendedProps.patientName || eventInfo.event.title}
          </div>
          {/* Show modality icon in day view */}
          {isDayView && (
            <div className="text-[10px] opacity-80 mt-0.5">
              {extendedProps.type === SessionType.REMOTE ? `💻 ${t('agenda.sessionTypes.remote')}` : `📍 ${t('agenda.sessionTypes.presential')}`}
            </div>
          )}
        </div>
      );
    }
    
    // For month view, keep it compact
    return (
      <div className="fc-event-main-frame px-1 py-0.5 text-xs">
        <div className="fc-event-time font-semibold">
          {eventInfo.timeText}
        </div>
        <div className="fc-event-title truncate">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <Card className="p-4 sm:p-5 relative bg-card">
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message="Cargando turnos..." />}
      
      {/* Toolbar personalizado */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 gap-3">
        {/* Botones de vista */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
          <Button
            variant={currentView === 'dayGridMonth' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changeView('dayGridMonth')}
            className={`h-8 px-2 sm:px-3 text-xs flex-1 sm:flex-none ${currentView === 'dayGridMonth' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'}`}
          >
            <Grid3x3 className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Mes</span>
          </Button>
          <Button
            variant={currentView === 'timeGridWeek' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changeView('timeGridWeek')}
            className={`h-8 px-2 sm:px-3 text-xs flex-1 sm:flex-none ${currentView === 'timeGridWeek' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'}`}
          >
            <Calendar className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Semana</span>
          </Button>
          <Button
            variant={currentView === 'timeGridDay' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changeView('timeGridDay')}
            className={`h-8 px-2 sm:px-3 text-xs flex-1 sm:flex-none ${currentView === 'timeGridDay' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'}`}
          >
            <Clock className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Día</span>
          </Button>
        </div>

        {/* Leyenda de estados */}
        <div className="flex items-center justify-center sm:justify-end gap-3 text-[11px] flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-muted-foreground">Agendada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="text-muted-foreground">Confirmada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
            <span className="text-muted-foreground">Completada</span>
          </div>
        </div>
      </div>

      {/* FullCalendar */}
      <div className="fullcalendar-wrapper overflow-hidden rounded-lg">
        <FullCalendar
          key={calendarKey}
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={defaultView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '', // Usamos nuestro toolbar personalizado
          }}
          events={events}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          editable={true}
          eventContent={renderEventContent}
          locale="es"
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            list: 'Lista',
          }}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          height="auto"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          allDaySlot={true}
          allDayText="Día Off"
          nowIndicator={true}
          // Business hours - visually highlight working hours
          businessHours={{
            daysOfWeek: workingHours.workingDays,
            startTime: workingHours.startTime,
            endTime: workingHours.endTime,
          }}
          // Constrain selection to business hours
          selectConstraint="businessHours"
          // Hide days not in working days
          hiddenDays={[0, 1, 2, 3, 4, 5, 6].filter(d => !workingHours.workingDays.includes(d))}
        />
      </div>

      {/* Estilos personalizados */}
      <style>{`
        /* ================================================================
           FC CUSTOM PROPERTIES — light mode base
           ================================================================ */
        .fullcalendar-wrapper {
          --fc-border-color: var(--border);
          --fc-button-bg-color: #4f46e5;
          --fc-button-border-color: #4f46e5;
          --fc-button-hover-bg-color: #4338ca;
          --fc-button-hover-border-color: #4338ca;
          --fc-button-active-bg-color: #3730a3;
          --fc-button-active-border-color: #3730a3;
          --fc-today-bg-color: color-mix(in srgb, var(--primary) 10%, transparent);
          --fc-page-bg-color: var(--background);
          --fc-neutral-bg-color: var(--muted);
          --fc-list-event-hover-bg-color: var(--muted);
          --fc-non-business-color: rgba(0, 0, 0, 0.04);
          --fc-highlight-color: color-mix(in srgb, var(--primary) 8%, transparent);
        }

        /* Dark mode custom property overrides */
        .dark .fullcalendar-wrapper {
          --fc-border-color: var(--border);
          --fc-today-bg-color: color-mix(in srgb, var(--primary) 14%, transparent);
          --fc-page-bg-color: var(--background);
          --fc-neutral-bg-color: var(--muted);
          --fc-list-event-hover-bg-color: var(--muted);
          --fc-non-business-color: rgba(0, 0, 0, 0.25);
          --fc-highlight-color: color-mix(in srgb, var(--primary) 12%, transparent);
        }

        /* ================================================================
           ROOT ELEMENT — backgrounds & font
           ================================================================ */
        .fullcalendar-wrapper .fc {
          font-family: inherit;
          background: var(--background);
          color: var(--foreground);
        }

        .dark .fullcalendar-wrapper .fc {
          background: var(--background);
          color: var(--foreground);
        }

        /* Scrollgrid table and cells */
        .fullcalendar-wrapper .fc-scrollgrid {
          border-color: var(--border);
          background: var(--background);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .fullcalendar-wrapper .fc-scrollgrid-sync-table td,
        .fullcalendar-wrapper .fc-scrollgrid-sync-table th {
          border-color: color-mix(in srgb, var(--border) 70%, transparent);
        }

        .fullcalendar-wrapper .fc-scrollgrid td,
        .fullcalendar-wrapper .fc-scrollgrid th {
          border-color: color-mix(in srgb, var(--border) 70%, transparent);
        }

        /* Daygrid and timegrid body backgrounds */
        .fullcalendar-wrapper .fc-daygrid-body,
        .fullcalendar-wrapper .fc-timegrid-body {
          background: var(--background);
        }

        .dark .fullcalendar-wrapper .fc-daygrid-body,
        .dark .fullcalendar-wrapper .fc-timegrid-body {
          background: var(--background);
        }

        /* Individual day cells in daygrid */
        .fullcalendar-wrapper .fc-daygrid-day {
          background: var(--background);
          border-color: var(--border);
          transition: background-color 0.15s ease;
        }

        .dark .fullcalendar-wrapper .fc-daygrid-day {
          background: var(--background);
        }

        /* Timegrid columns */
        .fullcalendar-wrapper .fc-timegrid-col {
          background: var(--background);
          border-color: var(--border);
        }

        .dark .fullcalendar-wrapper .fc-timegrid-col {
          background: var(--background);
        }

        /* ================================================================
           TOOLBAR — navigation buttons and title
           ================================================================ */
        .fullcalendar-wrapper .fc-toolbar {
          margin-bottom: 1rem !important;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .fullcalendar-wrapper .fc-toolbar-chunk {
          display: flex;
          align-items: center;
        }

        .fullcalendar-wrapper .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--foreground);
        }

        .fullcalendar-wrapper .fc-button {
          text-transform: capitalize;
          font-weight: 500;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.15s ease;
          border: none !important;
        }

        /* Gradient on toolbar buttons — matches app primary button style */
        .fullcalendar-wrapper .fc-button-primary {
          background: linear-gradient(to right, #4f46e5, #6366f1, #9333ea) !important;
          border: none !important;
          box-shadow: 0 1px 3px rgba(79, 70, 229, 0.3);
        }

        .fullcalendar-wrapper .fc-button-primary:hover:not(:disabled) {
          background: linear-gradient(to right, #6366f1, #818cf8, #a855f7) !important;
          box-shadow: 0 2px 6px rgba(79, 70, 229, 0.4);
        }

        .fullcalendar-wrapper .fc-button-primary:not(:disabled).fc-button-active,
        .fullcalendar-wrapper .fc-button-primary:not(:disabled):active {
          background: linear-gradient(to right, #4338ca, #4f46e5, #7c3aed) !important;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        /* Dark mode gradient */
        .dark .fullcalendar-wrapper .fc-button-primary {
          background: linear-gradient(to right, #6366f1, #8b5cf6, #a855f7) !important;
          box-shadow: 0 1px 3px rgba(99, 102, 241, 0.3);
        }

        .dark .fullcalendar-wrapper .fc-button-primary:hover:not(:disabled) {
          background: linear-gradient(to right, #818cf8, #a78bfa, #c084fc) !important;
        }

        .dark .fullcalendar-wrapper .fc-button-primary:not(:disabled).fc-button-active,
        .dark .fullcalendar-wrapper .fc-button-primary:not(:disabled):active {
          background: linear-gradient(to right, #4f46e5, #6366f1, #9333ea) !important;
        }

        .fullcalendar-wrapper .fc-button:focus {
          box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--primary);
        }

        .fullcalendar-wrapper .fc-button:disabled {
          opacity: 0.5;
        }

        /* Mobile: Stack toolbar vertically */
        @media (max-width: 640px) {
          .fullcalendar-wrapper .fc-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .fullcalendar-wrapper .fc-toolbar-chunk {
            justify-content: center;
          }

          .fullcalendar-wrapper .fc-toolbar-chunk:first-child {
            order: 2;
          }

          .fullcalendar-wrapper .fc-toolbar-chunk:nth-child(2) {
            order: 1;
          }

          .fullcalendar-wrapper .fc-toolbar-title {
            font-size: 1.1rem;
            text-align: center;
          }

          .fullcalendar-wrapper .fc-button {
            padding: 0.4rem 0.75rem !important;
            font-size: 0.8rem !important;
          }

          .fullcalendar-wrapper .fc-button-group {
            display: flex;
            gap: 2px;
          }
        }

        /* Small tablets */
        @media (min-width: 641px) and (max-width: 768px) {
          .fullcalendar-wrapper .fc-toolbar {
            gap: 0.5rem;
          }

          .fullcalendar-wrapper .fc-toolbar-title {
            font-size: 1.1rem;
          }

          .fullcalendar-wrapper .fc-button {
            padding: 0.4rem 0.75rem !important;
            font-size: 0.8rem !important;
          }
        }

        /* ================================================================
           COLUMN HEADERS — week/day view day-of-week labels
           ================================================================ */
        .fullcalendar-wrapper .fc-col-header-cell {
          background-color: var(--muted);
          border-color: var(--border);
          padding: 0;
        }

        .dark .fullcalendar-wrapper .fc-col-header-cell {
          background-color: var(--muted);
        }

        .fullcalendar-wrapper .fc-col-header-cell-cushion {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.15rem;
          padding: 0.5rem 0.25rem;
          text-decoration: none;
          color: var(--muted-foreground);
        }

        /* Week view: day abbreviation (Mon, Tue…) */
        .fullcalendar-wrapper .fc-col-header-cell-cushion .fc-col-header-cell-abbr {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted-foreground);
        }

        /* Week view: day number */
        .fullcalendar-wrapper .fc-col-header-cell-cushion .fc-col-header-cell-date {
          font-size: 1rem;
          font-weight: 600;
          color: var(--foreground);
          line-height: 1;
        }

        /* Today column header highlight */
        .fullcalendar-wrapper .fc-day-today .fc-col-header-cell-cushion .fc-col-header-cell-date {
          background-color: var(--primary);
          color: var(--primary-foreground);
          border-radius: 9999px;
          width: 1.75rem;
          height: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Fallback for when FullCalendar renders header as plain text */
        .fullcalendar-wrapper .fc-col-header-cell a {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.025em;
          color: var(--muted-foreground);
          text-decoration: none;
        }

        /* ================================================================
           DAY CELLS — month grid
           ================================================================ */
        .fullcalendar-wrapper .fc-daygrid-day:hover {
          background-color: var(--muted);
        }

        .fullcalendar-wrapper .fc-daygrid-day-number {
          padding: 0.5rem;
          font-weight: 500;
          color: var(--foreground);
          font-size: 0.875rem;
          text-decoration: none;
        }

        /* Today highlight — uses --fc-today-bg-color (CSS variable, no hardcode) */
        .fullcalendar-wrapper .fc-day-today {
          background-color: var(--fc-today-bg-color) !important;
        }

        /* Today day number badge */
        .fullcalendar-wrapper .fc-day-today .fc-daygrid-day-number {
          background-color: var(--primary);
          color: var(--primary-foreground);
          border-radius: 9999px;
          width: 1.75rem;
          height: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0.25rem;
          padding: 0;
        }

        /* ================================================================
           NON-BUSINESS HOURS — outside working hours shading
           ================================================================ */
        .fullcalendar-wrapper .fc-non-business {
          background: rgba(0, 0, 0, 0.04) !important;
        }

        .dark .fullcalendar-wrapper .fc-non-business {
          background: rgba(0, 0, 0, 0.28) !important;
        }

        /* ================================================================
           EVENTS — base styles
           ================================================================ */
        .fullcalendar-wrapper .fc-event {
          border-radius: 6px;
          padding: 2px 6px;
          margin: 1px 2px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
          border-width: 0;
          font-size: 0.75rem;
        }

        .fullcalendar-wrapper .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.18), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
          opacity: 0.95;
        }

        .fullcalendar-wrapper .fc-daygrid-event {
          white-space: normal;
        }

        .fullcalendar-wrapper .fc-daygrid-dot-event {
          padding: 4px 6px;
        }

        /* Event text — always white regardless of mode */
        .fullcalendar-wrapper .fc-event-main {
          color: white !important;
        }

        .fullcalendar-wrapper .fc-event-title,
        .fullcalendar-wrapper .fc-event-time {
          color: white !important;
        }

        /* ================================================================
           TIMEGRID EVENTS — card-like with border-left status indicator
           ================================================================ */
        .fullcalendar-wrapper .fc-timegrid-event {
          border-radius: 6px;
          border-left-width: 4px;
          border-left-style: solid;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
        }

        .dark .fullcalendar-wrapper .fc-timegrid-event {
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.25);
        }

        .fullcalendar-wrapper .fc-timegrid-event:hover {
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18), 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .dark .fullcalendar-wrapper .fc-timegrid-event:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45), 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .fullcalendar-wrapper .fc-timegrid-event .fc-event-main {
          padding: 3px 5px;
        }

        /* Event harness spacing */
        .fullcalendar-wrapper .fc-timegrid-col-events {
          margin: 0 2px;
        }

        .fullcalendar-wrapper .fc-timegrid-event-harness {
          min-height: 2.5rem;
        }

        /* ================================================================
           TIME GRID — slot rows and labels
           ================================================================ */
        .fullcalendar-wrapper .fc-timegrid-slot {
          height: 3rem;
          border-color: var(--border);
        }

        /* Day view — slightly taller slots for readability */
        .fullcalendar-wrapper .fc-timeGridDay-view .fc-timegrid-slot {
          height: 3.5rem;
        }

        .fullcalendar-wrapper .fc-timegrid-slot-label {
          font-size: 0.7rem;
          color: var(--muted-foreground);
          font-weight: 500;
          letter-spacing: 0.025em;
          border-color: var(--border);
          vertical-align: top;
          padding-top: 0.25rem;
        }

        .fullcalendar-wrapper .fc-timegrid-slot-label-cushion {
          font-size: 0.7rem;
          letter-spacing: 0.025em;
        }

        /* Minor slot line (30-min mark) — lighter than border */
        .fullcalendar-wrapper .fc-timegrid-slot-minor {
          border-top-style: dashed;
          border-color: color-mix(in srgb, var(--border) 50%, transparent);
        }

        .dark .fullcalendar-wrapper .fc-timegrid-slot-minor {
          border-color: color-mix(in srgb, var(--border) 60%, transparent);
        }

        /* Axis column (time labels) */
        .fullcalendar-wrapper .fc-timegrid-axis {
          font-size: 0.7rem;
          color: var(--muted-foreground);
          border-color: var(--border);
        }

        /* All-day row */
        .fullcalendar-wrapper .fc-timegrid-axis-cushion {
          font-size: 0.65rem;
          color: var(--muted-foreground);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* ================================================================
           NOW INDICATOR — current time line with dot
           ================================================================ */
        .fullcalendar-wrapper .fc-timegrid-now-indicator-line {
          border-color: #ef4444;
          border-width: 2px;
          position: relative;
        }

        .fullcalendar-wrapper .fc-timegrid-now-indicator-line::before {
          content: '';
          position: absolute;
          left: -5px;
          top: -4px;
          width: 10px;
          height: 10px;
          background: #ef4444;
          border-radius: 9999px;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25);
        }

        .fullcalendar-wrapper .fc-timegrid-now-indicator-arrow {
          border-color: #ef4444;
          border-top-color: transparent;
          border-bottom-color: transparent;
          display: none; /* Hidden in favour of the dot above */
        }

        /* ================================================================
           MOBILE — compact sizing
           ================================================================ */
        @media (max-width: 768px) {
          .fullcalendar-wrapper .fc-timegrid-slot,
          .fullcalendar-wrapper .fc-timeGridDay-view .fc-timegrid-slot {
            height: 2.5rem;
          }

          .fullcalendar-wrapper .fc-col-header-cell-cushion {
            padding: 0.35rem 0.15rem;
            gap: 0.1rem;
          }

          .fullcalendar-wrapper .fc-col-header-cell-cushion .fc-col-header-cell-abbr {
            font-size: 0.6rem;
          }

          .fullcalendar-wrapper .fc-col-header-cell-cushion .fc-col-header-cell-date {
            font-size: 0.85rem;
          }

          .fullcalendar-wrapper .fc-col-header-cell a {
            font-size: 0.65rem;
          }

          .fullcalendar-wrapper .fc-timegrid-slot-label,
          .fullcalendar-wrapper .fc-timegrid-slot-label-cushion {
            font-size: 0.6rem;
          }

          .fullcalendar-wrapper .fc-timegrid-axis {
            font-size: 0.6rem;
          }
        }

        /* ================================================================
           SCROLLBAR — custom slim scrollbar inside calendar
           ================================================================ */
        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar-track {
          background: var(--muted);
          border-radius: 3px;
        }

        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }

        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: var(--muted-foreground);
        }

        /* ================================================================
           SESSION STATUS COLORS — DO NOT CHANGE
           ================================================================ */
        .fullcalendar-wrapper .session-pending {
          background-color: ${SESSION_STATUS_COLORS.pending} !important;
          border-left-color: #d97706 !important;
        }

        .fullcalendar-wrapper .session-confirmed {
          background-color: ${SESSION_STATUS_COLORS.confirmed} !important;
          border-left-color: #2563eb !important;
        }

        .fullcalendar-wrapper .session-completed {
          background-color: ${SESSION_STATUS_COLORS.completed} !important;
          border-left-color: #16a34a !important;
        }

        .fullcalendar-wrapper .session-cancelled {
          background-color: ${SESSION_STATUS_COLORS.cancelled} !important;
          border-left-color: #dc2626 !important;
        }

        /* ================================================================
           DÍAS OFF — striped background + label badge
           ================================================================ */
        .fullcalendar-wrapper .dia-off-event {
          background: repeating-linear-gradient(
            45deg,
            rgba(244, 63, 94, 0.12),
            rgba(244, 63, 94, 0.12) 5px,
            rgba(244, 63, 94, 0.06) 5px,
            rgba(244, 63, 94, 0.06) 10px
          ) !important;
          border: none !important;
        }

        .dark .fullcalendar-wrapper .dia-off-event {
          background: repeating-linear-gradient(
            45deg,
            rgba(244, 63, 94, 0.18),
            rgba(244, 63, 94, 0.18) 5px,
            rgba(244, 63, 94, 0.09) 5px,
            rgba(244, 63, 94, 0.09) 10px
          ) !important;
        }

        .fullcalendar-wrapper .dia-off-label {
          background-color: #f43f5e !important;
          border-color: #e11d48 !important;
          color: white !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          pointer-events: none !important;
        }

        .fullcalendar-wrapper .dia-off-label .fc-event-main {
          padding: 2px 6px !important;
        }

        .fullcalendar-wrapper .fc-day-today.fc-day-disabled,
        .fullcalendar-wrapper .fc-day.fc-day-disabled {
          background: repeating-linear-gradient(
            45deg,
            rgba(244, 63, 94, 0.12),
            rgba(244, 63, 94, 0.12) 5px,
            rgba(244, 63, 94, 0.06) 5px,
            rgba(244, 63, 94, 0.06) 10px
          ) !important;
        }

        /* ================================================================
           LIST VIEW
           ================================================================ */
        .fullcalendar-wrapper .fc-list {
          border-radius: 0.5rem;
          overflow: hidden;
          border-color: var(--border);
          background: var(--background);
        }

        .dark .fullcalendar-wrapper .fc-list {
          background: var(--background);
        }

        .fullcalendar-wrapper .fc-list-day-cushion {
          background-color: var(--muted);
          padding: 0.75rem 1rem;
          color: var(--foreground);
        }

        .dark .fullcalendar-wrapper .fc-list-day-cushion {
          background-color: var(--muted);
          color: var(--foreground);
        }

        .fullcalendar-wrapper .fc-list-event td {
          border-color: var(--border);
          background: var(--background);
          color: var(--foreground);
        }

        .dark .fullcalendar-wrapper .fc-list-event td {
          border-color: var(--border);
          background: var(--background);
          color: var(--foreground);
        }

        .fullcalendar-wrapper .fc-list-event:hover td {
          background-color: var(--muted);
        }

        .dark .fullcalendar-wrapper .fc-list-event:hover td {
          background-color: var(--muted);
        }

        .fullcalendar-wrapper .fc-list-empty {
          background: var(--background);
          color: var(--muted-foreground);
        }

        .dark .fullcalendar-wrapper .fc-list-empty {
          background: var(--background);
          color: var(--muted-foreground);
        }

        .fullcalendar-wrapper .fc-list-event-dot {
          border-radius: 4px;
        }

        .fullcalendar-wrapper .fc-list-day-text,
        .fullcalendar-wrapper .fc-list-day-side-text {
          color: var(--foreground);
          text-decoration: none;
        }

        .dark .fullcalendar-wrapper .fc-list-day-text,
        .dark .fullcalendar-wrapper .fc-list-day-side-text {
          color: var(--foreground);
        }
      `}</style>
    </Card>
  );
}
