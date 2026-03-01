import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/components/ui/utils';

type CardVariant = 'default' | 'gradient' | 'outlined' | 'elevated' | 'interactive';

interface EnhancedCardProps {
  /** Visual variant of the card */
  variant?: CardVariant;
  /** Card content */
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** Click handler (adds interactive styles) */
  onClick?: () => void;
  /** Whether to animate on mount */
  animate?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-card',
  gradient: cn(
    'bg-gradient-to-br from-card via-muted/50 to-indigo-50/30',
    'dark:from-card dark:via-card dark:to-indigo-950/20',
    'border-indigo-100/50 dark:border-indigo-900/30'
  ),
  outlined: cn(
    'bg-transparent border-2',
    'border-border',
    'hover:border-indigo-300 dark:hover:border-indigo-700'
  ),
  elevated: cn(
    'bg-card',
    'shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50',
    'border-0'
  ),
  interactive: cn(
    'bg-card',
    'card-hover-lift cursor-pointer',
    'hover:border-indigo-200 dark:hover:border-indigo-700'
  ),
};

/**
 * Enhanced card component with multiple visual variants.
 * Extends shadcn/ui Card with gradient, outlined, and elevated styles.
 */
export function EnhancedCard({
  variant = 'default',
  children,
  className,
  onClick,
  animate = false,
}: EnhancedCardProps) {
  // If onClick is provided, use interactive variant styles automatically
  const effectiveVariant = onClick && variant === 'default' ? 'interactive' : variant;

  return (
    <Card
      className={cn(
        'p-4 transition-all duration-200',
        variantStyles[effectiveVariant],
        animate && 'animate-fade-in',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

/* ============================================================================
   Empty State Component
   ============================================================================ */

interface EmptyStateProps {
  /** Icon to display */
  icon: React.ElementType;
  /** Icon color class */
  iconColor?: string;
  /** Main message */
  message: string;
  /** Optional secondary description */
  description?: string;
  /** Optional action button */
  action?: ReactNode;
}

/**
 * Consistent empty state design for dashboard cards.
 * Displays icon, message, and optional action.
 */
export function EmptyState({
  icon: Icon,
  iconColor = 'text-muted-foreground',
  message,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div
        className={cn(
          'w-14 h-14 rounded-full mb-3',
          'bg-muted',
          'flex items-center justify-center'
        )}
      >
        <Icon className={cn('w-7 h-7', iconColor)} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        {message}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ============================================================================
   Metric Card Component
   ============================================================================ */

interface MetricCardProps {
  /** Metric label */
  label: string;
  /** Metric value (formatted string) */
  value: string | number;
  /** Icon component */
  icon: React.ElementType;
  /** Background color for icon container */
  iconBg: string;
  /** Icon color class */
  iconColor: string;
  /** Optional subtitle/secondary info */
  subtitle?: string;
  /** Optional trend indicator */
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  /** Click handler */
  onClick?: () => void;
}

/**
 * Compact metric card for displaying KPIs.
 * Used in stats grids and summary widgets.
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  subtitle,
  trend,
  onClick,
}: MetricCardProps) {
  return (
    <EnhancedCard
      variant={onClick ? 'interactive' : 'default'}
      onClick={onClick}
      className="p-3 sm:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {label}
          </p>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground truncate tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-[10px] sm:text-xs',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              <svg
                className={cn('w-3 h-3', !trend.isPositive && 'rotate-180')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <span className="truncate">
                {trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12',
            iconBg,
            'rounded-lg flex items-center justify-center flex-shrink-0'
          )}
        >
          <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6', iconColor)} />
        </div>
      </div>
    </EnhancedCard>
  );
}
