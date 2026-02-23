import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { cn } from '@/components/ui/utils';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

// Lazy load framer-motion
const MotionDiv = lazy(() => 
  import('framer-motion').then(mod => ({ 
    default: mod.motion.div 
  }))
);

// ============================================================================
// useScrollPosition Hook - Detect scroll for sticky header behavior
// ============================================================================

export function useScrollPosition(threshold = 50): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollY > threshold);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return isScrolled;
}

// ============================================================================
// Radial Progress Component
// ============================================================================

interface RadialProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  trackColor?: string;
  showValue?: boolean;
  label?: string;
}

export function RadialProgress({
  value,
  size = 80,
  strokeWidth = 8,
  className,
  color = '#4f46e5',
  trackColor = '#e5e7eb',
  showValue = true,
  label,
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
          className="dark:opacity-30"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {Math.round(value)}%
          </span>
          {label && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sparkline Component - Mini trend chart
// ============================================================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = '#4f46e5',
  fillColor,
  className,
}: SparklineProps) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg 
      width={width} 
      height={height} 
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      {fillColor && (
        <polygon
          points={areaPoints}
          fill={fillColor}
          className="opacity-20"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// Mini Stat Card - Compact stat with optional sparkline
// ============================================================================

interface MiniStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: { value: number; isPositive: boolean };
  trendLabel?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  onClick?: () => void;
  compact?: boolean;
}

export function MiniStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendLabel,
  sparklineData,
  sparklineColor = '#4f46e5',
  onClick,
  compact = false,
}: MiniStatCardProps) {
  return (
    <Card 
      className={cn(
        'bg-white dark:bg-gray-800 transition-all duration-200',
        compact ? 'p-3' : 'p-4',
        onClick && 'cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className={cn(
              'font-bold text-gray-900 dark:text-gray-100 truncate',
              compact ? 'text-lg' : 'text-xl sm:text-2xl'
            )}>
              {value}
            </p>
            {trend && (
              <div className={cn(
                'flex items-center gap-0.5 text-[10px] font-medium',
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
          )}
          {sparklineData && sparklineData.length > 1 && (
            <div className="mt-2">
              <Sparkline 
                data={sparklineData} 
                color={sparklineColor}
                fillColor={sparklineColor}
                width={100}
                height={20}
              />
            </div>
          )}
        </div>
        <div className={cn(
          'rounded-lg flex items-center justify-center flex-shrink-0',
          iconBg,
          compact ? 'w-8 h-8' : 'w-10 h-10'
        )}>
          <Icon className={cn(iconColor, compact ? 'w-4 h-4' : 'w-5 h-5')} />
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Animated Progress Bar
// ============================================================================

interface AnimatedProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedProgress({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'bg-indigo-600',
  className,
  size = 'md',
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={cn('space-y-1', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs">
          {label && <span className="text-gray-600 dark:text-gray-400">{label}</span>}
          {showValue && (
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', heightClass)}>
        <div 
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            color
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Compact Header with Sticky Behavior
// ============================================================================

interface CompactHeaderProps {
  greeting: string;
  userName?: string;
  subtitle: string;
  isScrolled: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function CompactHeader({
  greeting,
  userName,
  subtitle,
  isScrolled,
  actions,
  className,
}: CompactHeaderProps) {
  return (
    <div 
      className={cn(
        'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg transition-all duration-300',
        isScrolled 
          ? 'sticky top-0 z-40 rounded-none py-3 px-4 sm:px-6' 
          : 'rounded-2xl p-6 sm:p-8',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className={cn('transition-all duration-300', isScrolled && 'flex items-center gap-3')}>
          {!isScrolled && (
            <p className="text-indigo-200 text-sm font-medium mb-1">
              {subtitle}
            </p>
          )}
          <h1 className={cn(
            'font-bold transition-all duration-300',
            isScrolled ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl lg:text-4xl'
          )}>
            {greeting}{userName && `, ${userName}`}
          </h1>
        </div>
        {actions && (
          <div className={cn(
            'transition-all duration-300',
            isScrolled && 'flex-shrink-0'
          )}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Quick Actions Bar (Sticky)
// ============================================================================

interface QuickAction {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  onClick: () => void;
  color: string;
  hoverBg: string;
  hoverBorder: string;
}

interface QuickActionsBarProps {
  actions: QuickAction[];
  isScrolled: boolean;
  isMobile: boolean;
  className?: string;
}

export function QuickActionsBar({
  actions,
  isScrolled,
  isMobile,
  className,
}: QuickActionsBarProps) {
  return (
    <div 
      className={cn(
        'grid gap-2 sm:gap-3 transition-all duration-300',
        isScrolled 
          ? 'sticky top-[52px] sm:top-[60px] z-30 bg-gray-50 dark:bg-gray-900 py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-gray-200 dark:border-gray-700' 
          : '',
        isMobile ? 'grid-cols-4' : 'grid-cols-4',
        className
      )}
    >
      {actions.map(action => (
        <button
          key={action.id}
          onClick={action.onClick}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg border bg-white dark:bg-gray-800 transition-all duration-200',
            isScrolled || isMobile
              ? 'p-2 sm:p-2.5 flex-col sm:flex-row' 
              : 'p-3 flex-col sm:flex-row',
            action.hoverBg,
            action.hoverBorder,
            'border-gray-200 dark:border-gray-700'
          )}
        >
          <action.icon className={cn('w-4 h-4 sm:w-5 sm:h-5', action.color)} />
          <span className={cn(
            'text-gray-700 dark:text-gray-200',
            isScrolled || isMobile ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'
          )}>
            {(isScrolled || isMobile) && action.shortLabel ? action.shortLabel : action.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Today Summary Widget (Enhanced)
// ============================================================================

interface TodaySummaryData {
  sessionsTotal: number;
  sessionsCompleted: number;
  incomeToday: number;
  patientsSeenToday?: number;
  nextSession?: {
    time: string;
    patientName: string;
    minutesUntil: number;
  };
  completionRate?: number;
}

interface TodaySummaryWidgetProps {
  data: TodaySummaryData;
  formatCurrency: (amount: number) => string;
  t: (key: string, options?: Record<string, unknown>) => string;
  onViewAgenda?: () => void;
  className?: string;
}

export function TodaySummaryWidget({
  data,
  formatCurrency,
  t,
  onViewAgenda,
  className,
}: TodaySummaryWidgetProps) {
  const completionRate = data.sessionsTotal > 0 
    ? Math.round((data.sessionsCompleted / data.sessionsTotal) * 100)
    : 0;

  return (
    <Card className={cn('p-4 bg-white dark:bg-gray-800', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {t('dashboard.todaySummary.title')}
          </h3>
        </div>
        {onViewAgenda && (
          <button
            onClick={onViewAgenda}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {t('dashboard.quickActions.viewAgenda')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Sessions Progress */}
        <div className="flex items-center gap-3">
          <RadialProgress 
            value={completionRate} 
            size={48}
            strokeWidth={5}
            color={completionRate >= 75 ? '#22c55e' : completionRate >= 50 ? '#f59e0b' : '#4f46e5'}
          />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('dashboard.todaySummary.sessions')}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {data.sessionsCompleted}/{data.sessionsTotal}
            </p>
          </div>
        </div>

        {/* Income */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-green-600 dark:text-green-400 text-lg font-bold">$</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('dashboard.todaySummary.income')}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(data.incomeToday)}
            </p>
          </div>
        </div>

        {/* Next Session */}
        {data.nextSession ? (
          <div className="flex items-center gap-3 col-span-2 sm:col-span-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('dashboard.todaySummary.nextSession')}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {data.nextSession.time} - {data.nextSession.patientName}
              </p>
              {data.nextSession.minutesUntil > 0 && (
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                  {t('dashboard.todaySummary.inMinutes', { minutes: data.nextSession.minutesUntil })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 col-span-2 sm:col-span-2">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('dashboard.todaySummary.nextSession')}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {t('dashboard.todaySummary.noMoreSessions')}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// Stats Overview Widget with Radial Progress
// ============================================================================

interface StatsOverviewProps {
  completionRate: number;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  t: (key: string) => string;
  className?: string;
}

export function StatsOverview({
  completionRate,
  totalSessions,
  completedSessions,
  cancelledSessions,
  t,
  className,
}: StatsOverviewProps) {
  return (
    <Card className={cn('p-4 bg-white dark:bg-gray-800', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">{t('analytics.labels.completed')}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{completedSessions}</span>
            </div>
            <Progress value={(completedSessions / totalSessions) * 100 || 0} className="h-1.5 bg-green-100" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">{t('analytics.labels.cancelled')}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{cancelledSessions}</span>
            </div>
            <Progress value={(cancelledSessions / totalSessions) * 100 || 0} className="h-1.5 bg-red-100" />
          </div>
        </div>
        <RadialProgress
          value={completionRate}
          size={72}
          strokeWidth={6}
          color={completionRate >= 80 ? '#22c55e' : completionRate >= 60 ? '#f59e0b' : '#ef4444'}
          label={t('analytics.stats.rate')}
        />
      </div>
    </Card>
  );
}
