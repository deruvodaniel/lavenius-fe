import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  calendarDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  turnosCountPorDia: Record<string, number>;
  today: Date;
  isMobile?: boolean;
}

export function CalendarView({
  calendarDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  turnosCountPorDia,
  today,
  isMobile = false
}: CalendarViewProps) {
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthName = calendarDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const currentDate = new Date();

  return (
    <div className={isMobile ? "" : "h-full flex flex-col"}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPreviousMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Mes anterior"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <div className="flex items-center gap-3">
          <h2 className="text-foreground capitalize font-medium">{monthName}</h2>
          <button
            onClick={onToday}
            className="text-sm px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
          >
            Hoy
          </button>
        </div>
        
        <button
          onClick={onNextMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Mes siguiente"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={`grid grid-cols-7 ${isMobile ? 'gap-1' : 'gap-2'}`}>
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-muted-foreground text-sm p-2">
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const turnosCount = turnosCountPorDia[dateStr] || 0;
          const isToday = 
            day === currentDate.getDate() && 
            calendarMonth === currentDate.getMonth() && 
            calendarYear === currentDate.getFullYear();
          const isPast = new Date(dateStr) < today;

          return (
            <div
              key={day}
              className={`aspect-square p-2 rounded-lg border transition-colors flex flex-col items-center justify-center ${
                isToday
                  ? 'border-indigo-600 bg-indigo-50'
                  : isPast
                  ? 'border-border bg-muted'
                  : 'border-border hover:border-indigo-300'
              } ${isMobile && isToday ? 'bg-indigo-600 text-white font-bold' : ''}`}
            >
              <span
                className={`text-sm ${
                  isToday && isMobile ? 'text-white' : isToday ? 'text-indigo-600' : isPast ? 'text-muted-foreground' : 'text-foreground'
                }`}
              >
                {day}
              </span>
              {turnosCount > 0 && (
                <span className={`${isToday && isMobile ? 'text-white' : 'bg-indigo-600 text-white'} text-xs px-2 py-0.5 rounded-full mt-1`}>
                  {turnosCount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
