import { useTranslation } from 'react-i18next';
import { Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface TodaySummaryWidgetProps {
  /** Number of sessions completed today */
  sessionsCompleted: number;
  /** Total sessions scheduled for today */
  sessionsTotal: number;
  /** Income collected today */
  incomeToday: number;
  /** Number of active patients this period */
  activePatients?: number;
  /** Optional click handler for navigation */
  onSessionsClick?: () => void;
  /** Optional click handler for payments */
  onIncomeClick?: () => void;
  /** Optional click handler for patients */
  onPatientsClick?: () => void;
}

/**
 * Compact horizontal widget showing today's key metrics.
 * Designed to sit near the header for quick daily overview.
 */
export function TodaySummaryWidget({
  sessionsCompleted,
  sessionsTotal,
  incomeToday,
  activePatients,
  onSessionsClick,
  onIncomeClick,
  onPatientsClick,
}: TodaySummaryWidgetProps) {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const sessionProgress = sessionsTotal > 0 
    ? Math.round((sessionsCompleted / sessionsTotal) * 100) 
    : 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-indigo-100 dark:border-indigo-900/50',
        'bg-gradient-to-r from-indigo-50 via-background to-purple-50',
        'dark:from-indigo-950/30 dark:via-background dark:to-purple-950/30',
        'p-4 shadow-sm',
        'animate-fade-in'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t('dashboard.todaySummary.title')}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Sessions Metric */}
        <button
          onClick={onSessionsClick}
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg',
            'hover:bg-white/60 dark:hover:bg-gray-800/60',
            'transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            onSessionsClick && 'cursor-pointer'
          )}
          disabled={!onSessionsClick}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            {/* Mini progress ring */}
            <svg
              className="absolute -top-0.5 -right-0.5 w-4 h-4"
              viewBox="0 0 16 16"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-border"
              />
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${(sessionProgress / 100) * 37.7} 37.7`}
                strokeLinecap="round"
                transform="rotate(-90 8 8)"
                className="text-green-500"
              />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">
              {t('dashboard.todaySummary.sessions')}
            </p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {sessionsCompleted}
              <span className="text-sm font-normal text-muted-foreground">
                /{sessionsTotal}
              </span>
            </p>
          </div>
        </button>

        {/* Income Metric */}
        <button
          onClick={onIncomeClick}
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg',
            'hover:bg-white/60 dark:hover:bg-gray-800/60',
            'transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            onIncomeClick && 'cursor-pointer'
          )}
          disabled={!onIncomeClick}
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">
              {t('dashboard.todaySummary.income')}
            </p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {formatCurrency(incomeToday)}
            </p>
          </div>
        </button>

        {/* Active Patients (optional) */}
        {activePatients !== undefined && (
          <button
            onClick={onPatientsClick}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg',
              'hover:bg-white/60 dark:hover:bg-gray-800/60',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              onPatientsClick && 'cursor-pointer',
              'hidden sm:flex'
            )}
            disabled={!onPatientsClick}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">
                {t('analytics.stats.patientsAttended')}
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {activePatients}
              </p>
            </div>
          </button>
        )}

        {/* Quick Status Indicator */}
        <div className="hidden lg:flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">
              {t('analytics.stats.attendanceRate')}
            </p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {sessionProgress}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
