import { useRef, useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, DateSelectArg, EventContentArg } from '@fullcalendar/core';
import { SessionType, SessionStatus, type SessionUI } from '@/lib/types/session';
import { SESSION_STATUS_COLORS } from '@/lib/constants/sessionColors';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, Grid3x3, Clock } from 'lucide-react';
import { LoadingOverlay } from '../shared/Skeleton';
import { toast } from 'sonner';

// ============================================================================
// SETTINGS TYPES & LOADER
// ============================================================================

interface DiaOff {
  id: number;
  fecha: string;
  motivo: string;
}

const SETTINGS_KEY = 'lavenius_settings';

const loadDiasOff = (): DiaOff[] => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      return settings.diasOff || [];
    }
  } catch (error) {
    console.error('Error loading dias off:', error);
  }
  return [];
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
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState('timeGridWeek');

  // Load días off from settings
  const diasOff = useMemo(() => loadDiasOff(), []);

  // Generate a key based on sessions data to force FullCalendar to re-render when sessions change
  const calendarKey = useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return 'empty';
    return sessions.map(s => `${s.id}-${s.status}-${s.scheduledFrom}`).join('|');
  }, [sessions]);

  // Check if a date is a día off
  const isDiaOff = (date: Date): DiaOff | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return diasOff.find(d => d.fecha === dateStr);
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
          || 'Sin paciente';

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
  }, [sessions, isSessionPaid, getPatientNameFallback]);

  // Create background events for días off
  const diaOffEvents = useMemo(() => {
    if (!diasOff || !Array.isArray(diasOff)) return [];
    return diasOff.flatMap(dia => [
      // Background event for the striped pattern
      {
        id: `dia-off-bg-${dia.id}`,
        start: dia.fecha,
        allDay: true,
        display: 'background' as const,
        classNames: ['dia-off-event'],
      },
      // Regular all-day event for the label
      {
        id: `dia-off-label-${dia.id}`,
        title: dia.motivo || 'Día Off',
        start: dia.fecha,
        allDay: true,
        classNames: ['dia-off-label'],
        extendedProps: {
          isDiaOff: true,
          motivo: dia.motivo,
        },
      },
    ]);
  }, [diasOff]);

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
      toast.warning(`Este día está marcado como día off${diaOff.motivo ? `: ${diaOff.motivo}` : ''}`);
      return;
    }
    onDateSelect?.(selectInfo.start, selectInfo.end);
  };

  const handleEventDrop = (dropInfo: any) => {
    const session = dropInfo.event.extendedProps.session as SessionUI;
    onEventDrop?.(session.id, dropInfo.event.start, dropInfo.event.end);
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    return (
      <div className="fc-event-main-frame px-1 py-0.5 text-xs">
        <div className="fc-event-time font-semibold">
          {eventInfo.timeText}
        </div>
        <div className="fc-event-title truncate">{eventInfo.event.title}</div>
      </div>
    );
  };

  const changeView = (view: string) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
      setCurrentView(view);
    }
  };

  return (
    <Card className="p-4 sm:p-5 relative bg-white">
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message="Cargando turnos..." />}
      
      {/* Toolbar personalizado */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 gap-3">
        {/* Botones de vista */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
          <Button
            variant={currentView === 'dayGridMonth' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changeView('dayGridMonth')}
            className={`h-8 px-2 sm:px-3 text-xs flex-1 sm:flex-none ${currentView === 'dayGridMonth' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-transparent'}`}
          >
            <Grid3x3 className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Mes</span>
          </Button>
          <Button
            variant={currentView === 'timeGridWeek' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changeView('timeGridWeek')}
            className={`h-8 px-2 sm:px-3 text-xs flex-1 sm:flex-none ${currentView === 'timeGridWeek' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-transparent'}`}
          >
            <Calendar className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Semana</span>
          </Button>
          <Button
            variant={currentView === 'timeGridDay' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changeView('timeGridDay')}
            className={`h-8 px-2 sm:px-3 text-xs flex-1 sm:flex-none ${currentView === 'timeGridDay' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-transparent'}`}
          >
            <Clock className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Día</span>
          </Button>
        </div>

        {/* Leyenda de estados */}
        <div className="flex items-center justify-center sm:justify-end gap-3 text-[11px] flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-gray-600">Agendada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="text-gray-600">Confirmada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
            <span className="text-gray-600">Completada</span>
          </div>
        </div>
      </div>

      {/* FullCalendar */}
      <div className="fullcalendar-wrapper">
        <FullCalendar
          key={calendarKey}
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="timeGridWeek"
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
        />
      </div>

      {/* Estilos personalizados */}
      <style>{`
        .fullcalendar-wrapper {
          --fc-border-color: #e5e7eb;
          --fc-button-bg-color: #4f46e5;
          --fc-button-border-color: #4f46e5;
          --fc-button-hover-bg-color: #4338ca;
          --fc-button-hover-border-color: #4338ca;
          --fc-button-active-bg-color: #3730a3;
          --fc-button-active-border-color: #3730a3;
          --fc-today-bg-color: #eef2ff;
          --fc-page-bg-color: #ffffff;
          --fc-neutral-bg-color: #f9fafb;
          --fc-list-event-hover-bg-color: #f3f4f6;
        }

        .fullcalendar-wrapper .fc {
          font-family: inherit;
          background: white;
        }

        /* Toolbar styling - Responsive */
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
          color: #111827;
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

        .fullcalendar-wrapper .fc-button {
          text-transform: capitalize;
          font-weight: 500;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.15s ease;
        }

        .fullcalendar-wrapper .fc-button:focus {
          box-shadow: 0 0 0 2px white, 0 0 0 4px #4f46e5;
        }

        .fullcalendar-wrapper .fc-button:disabled {
          opacity: 0.5;
        }

        .fullcalendar-wrapper .fc-button-primary:not(:disabled).fc-button-active,
        .fullcalendar-wrapper .fc-button-primary:not(:disabled):active {
          background-color: #3730a3;
          border-color: #3730a3;
        }

        /* Header cells */
        .fullcalendar-wrapper .fc-col-header-cell {
          background-color: #f9fafb;
          font-weight: 600;
          padding: 0.75rem 0.5rem;
          font-size: 0.75rem;
          letter-spacing: 0.025em;
          color: #6b7280;
          border-color: #e5e7eb;
        }

        .fullcalendar-wrapper .fc-col-header-cell-cushion {
          color: #6b7280;
          text-decoration: none;
        }

        /* Day cells */
        .fullcalendar-wrapper .fc-daygrid-day {
          transition: background-color 0.15s ease;
        }

        .fullcalendar-wrapper .fc-daygrid-day:hover {
          background-color: #f9fafb;
        }

        .fullcalendar-wrapper .fc-daygrid-day-number {
          padding: 0.5rem;
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        .fullcalendar-wrapper .fc-day-today {
          background-color: #eef2ff !important;
        }

        .fullcalendar-wrapper .fc-day-today .fc-daygrid-day-number {
          background-color: #4f46e5;
          color: white;
          border-radius: 9999px;
          width: 1.75rem;
          height: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0.25rem;
        }

        /* Events */
        .fullcalendar-wrapper .fc-event {
          border-radius: 6px;
          padding: 2px 6px;
          margin: 1px 2px;
          cursor: pointer;
          transition: all 0.15s ease;
          border-width: 0;
          font-size: 0.75rem;
        }

        .fullcalendar-wrapper .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .fullcalendar-wrapper .fc-daygrid-event {
          white-space: normal;
        }

        .fullcalendar-wrapper .fc-daygrid-dot-event {
          padding: 4px 6px;
        }

        /* Time grid */
        .fullcalendar-wrapper .fc-timegrid-slot {
          height: 3rem;
          border-color: #f3f4f6;
        }

        .fullcalendar-wrapper .fc-timegrid-slot-label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
        }

        .fullcalendar-wrapper .fc-timegrid-event {
          border-radius: 6px;
          padding: 4px 8px;
          border-left-width: 3px;
        }

        .fullcalendar-wrapper .fc-timegrid-now-indicator-line {
          border-color: #ef4444;
          border-width: 2px;
        }

        .fullcalendar-wrapper .fc-timegrid-now-indicator-arrow {
          border-color: #ef4444;
          border-top-color: transparent;
          border-bottom-color: transparent;
        }

        /* All day slot */
        .fullcalendar-wrapper .fc-timegrid-axis {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* Scrollbar styling */
        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }

        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        /* Event colors */
        .fullcalendar-wrapper .fc-event-main {
          color: white !important;
        }

        .fullcalendar-wrapper .fc-event-title,
        .fullcalendar-wrapper .fc-event-time {
          color: white !important;
        }

        /* Session status colors */
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

        /* Días Off - Background events with striped pattern */
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

        /* Días Off - Label styling */
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

        /* List view */
        .fullcalendar-wrapper .fc-list {
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .fullcalendar-wrapper .fc-list-day-cushion {
          background-color: #f9fafb;
          padding: 0.75rem 1rem;
        }

        .fullcalendar-wrapper .fc-list-event:hover td {
          background-color: #f3f4f6;
        }

        .fullcalendar-wrapper .fc-list-event-dot {
          border-radius: 4px;
        }
      `}</style>
    </Card>
  );
}
