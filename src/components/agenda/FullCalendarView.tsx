import { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, DateSelectArg, EventContentArg } from '@fullcalendar/core';
import { SessionStatus, SessionType, type SessionUI } from '@/lib/types/session';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, List, Grid3x3, Clock } from 'lucide-react';

interface FullCalendarViewProps {
  sessions: SessionUI[];
  onEventClick?: (session: SessionUI) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  onEventDrop?: (sessionId: string, newStart: Date, newEnd: Date) => void;
}

export function FullCalendarView({ 
  sessions, 
  onEventClick, 
  onDateSelect,
  onEventDrop 
}: FullCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState('dayGridMonth');

  // Convert sessions to FullCalendar events
  const events = sessions.map(session => {
    const statusColors: Record<SessionStatus, string> = {
      [SessionStatus.PENDING]: '#f59e0b',
      [SessionStatus.CONFIRMED]: '#3b82f6',
      [SessionStatus.COMPLETED]: '#10b981',
      [SessionStatus.CANCELLED]: '#ef4444',
    };

    const typeIcons: Record<SessionType, string> = {
      [SessionType.PRESENTIAL]: '📍',
      [SessionType.REMOTE]: '💻',
    };

    return {
      id: session.id,
      title: `${typeIcons[session.sessionType]} ${session.patientName || 'Sin paciente'}`,
      start: session.scheduledFrom,
      end: session.scheduledTo,
      backgroundColor: statusColors[session.status],
      borderColor: statusColors[session.status],
      extendedProps: {
        session,
        status: session.status,
        type: session.sessionType,
        patientName: session.patientName,
        cost: session.cost,
      },
    };
  });

  const handleEventClick = (clickInfo: EventClickArg) => {
    const session = clickInfo.event.extendedProps.session as SessionUI;
    onEventClick?.(session);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    onDateSelect?.(selectInfo.start, selectInfo.end);
  };

  const handleEventDrop = (dropInfo: any) => {
    const session = dropInfo.event.extendedProps.session as SessionUI;
    onEventDrop?.(session.id, dropInfo.event.start, dropInfo.event.end);
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { status, patientName, cost } = eventInfo.event.extendedProps;
    
    return (
      <div className="fc-event-main-frame px-1 py-0.5 text-xs">
        <div className="fc-event-time font-semibold">{eventInfo.timeText}</div>
        <div className="fc-event-title truncate">{eventInfo.event.title}</div>
        {cost && (
          <div className="fc-event-cost text-[10px] opacity-90">
            ${cost.toLocaleString()}
          </div>
        )}
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
    <Card className="p-4">
      {/* Toolbar personalizado */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={currentView === 'dayGridMonth' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeView('dayGridMonth')}
          >
            <Grid3x3 className="h-4 w-4 mr-1" />
            Mes
          </Button>
          <Button
            variant={currentView === 'timeGridWeek' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeView('timeGridWeek')}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Semana
          </Button>
          <Button
            variant={currentView === 'timeGridDay' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeView('timeGridDay')}
          >
            <Clock className="h-4 w-4 mr-1" />
            Día
          </Button>
          <Button
            variant={currentView === 'listWeek' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeView('listWeek')}
          >
            <List className="h-4 w-4 mr-1" />
            Lista
          </Button>
        </div>

        {/* Leyenda de estados */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span>Pendiente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Confirmada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Completada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>Cancelada</span>
          </div>
        </div>
      </div>

      {/* FullCalendar */}
      <div className="fullcalendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
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
          allDaySlot={false}
          nowIndicator={true}
          eventClassNames={(arg) => {
            const status = arg.event.extendedProps.status as SessionStatus;
            return [`session-${status}`];
          }}
        />
      </div>

      {/* Estilos personalizados */}
      <style>{`
        .fullcalendar-wrapper {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-today-bg-color: hsl(var(--accent));
        }

        .fullcalendar-wrapper .fc {
          font-family: inherit;
        }

        .fullcalendar-wrapper .fc-button {
          text-transform: capitalize;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: var(--radius);
        }

        .fullcalendar-wrapper .fc-button:disabled {
          opacity: 0.5;
        }

        .fullcalendar-wrapper .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }

        .fullcalendar-wrapper .fc-col-header-cell {
          background-color: hsl(var(--muted));
          font-weight: 600;
          padding: 0.75rem 0.5rem;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }

        .fullcalendar-wrapper .fc-daygrid-day-number {
          padding: 0.5rem;
          font-weight: 500;
        }

        .fullcalendar-wrapper .fc-event {
          border-radius: 4px;
          padding: 2px 4px;
          margin: 1px 0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fullcalendar-wrapper .fc-event:hover {
          opacity: 0.9;
          transform: scale(1.02);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .fullcalendar-wrapper .fc-daygrid-event {
          white-space: normal;
        }

        .fullcalendar-wrapper .fc-list-event:hover {
          background-color: hsl(var(--accent));
        }

        .fullcalendar-wrapper .fc-timegrid-slot {
          height: 3rem;
        }

        .fullcalendar-wrapper .fc-timegrid-event {
          border-radius: 4px;
          padding: 2px 4px;
        }

        /* Dark mode support */
        .dark .fullcalendar-wrapper {
          --fc-neutral-bg-color: hsl(var(--background));
          --fc-neutral-text-color: hsl(var(--foreground));
          --fc-page-bg-color: hsl(var(--background));
        }

        .dark .fullcalendar-wrapper .fc-col-header-cell {
          background-color: hsl(var(--muted));
        }
      `}</style>
    </Card>
  );
}
