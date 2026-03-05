/**
 * Onboarding Progress Card
 * Shows user's setup completion progress with actionable steps
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Calendar,
  UserPlus,
  CalendarPlus,
  DollarSign,
  Check,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSetupProgressStore, useDashboardSettingsStore, type SetupStepId } from '@/lib/stores';
import { usePatients } from '@/lib/hooks';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { usePayments } from '@/lib/hooks/usePayments';
import { useMemo, useEffect, useRef } from 'react';

// Step configuration with icons and routes
const STEP_CONFIG: Record<
  SetupStepId,
  {
    icon: React.ComponentType<{ className?: string }>;
    route: string;
    colorClass: string;
    bgClass: string;
  }
> = {
  configureProfile: {
    icon: User,
    route: '/dashboard/perfil',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  connectCalendar: {
    icon: Calendar,
    route: '/dashboard/configuracion',
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
  },
  addFirstPatient: {
    icon: UserPlus,
    route: '/dashboard/pacientes?action=new',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
  },
  scheduleFirstSession: {
    icon: CalendarPlus,
    route: '/dashboard/agenda?action=new',
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
  },
  registerFirstPayment: {
    icon: DollarSign,
    route: '/dashboard/cobros?action=new',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
  },
};

interface OnboardingProgressCardProps {
  className?: string;
}

export function OnboardingProgressCard({ className = '' }: OnboardingProgressCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Get store state with stable selectors
  const steps = useSetupProgressStore((state) => state.steps);
  
  // Use dashboard settings for visibility control
  const sections = useDashboardSettingsStore((state) => state.sections);
  const setSectionVisibility = useDashboardSettingsStore((state) => state.setSectionVisibility);
  const isVisible = sections.find((s) => s.id === 'setupProgress')?.visible ?? true;

  // Get data for auto-detection
  const { patients } = usePatients();
  const { user, hasCompletedOnboarding } = useAuth();
  const sessions = useSessionStore((state) => state.sessions);
  const { payments } = usePayments();
  
  // Track if we've synced to avoid loops
  const hasSynced = useRef(false);
  
  // Sync progress based on existing data (run once on mount)
  useEffect(() => {
    if (hasSynced.current) return;
    
    // Wait until we have some data loaded
    const hasLoadedData = patients !== undefined || sessions !== undefined || payments !== undefined;
    if (!hasLoadedData) return;
    
    hasSynced.current = true;
    
    const store = useSetupProgressStore.getState();
    store.syncFromData({
      hasPatients: patients && patients.length > 0,
      hasSessions: sessions && sessions.length > 0,
      hasPayments: payments && payments.length > 0,
      hasProfile: hasCompletedOnboarding || !!user?.licenseNumber,
      hasCalendar: false, // Calendar connection would need to be checked separately
    });
  }, [patients, sessions, payments, hasCompletedOnboarding, user?.licenseNumber]);

  // Calculate progress
  const { completed, total, percentage } = useMemo(() => {
    const completedCount = steps.filter((s) => s.completed).length;
    const totalCount = steps.length;
    return {
      completed: completedCount,
      total: totalCount,
      percentage: Math.round((completedCount / totalCount) * 100),
    };
  }, [steps]);

  // Check if all complete
  const allComplete = completed === total;

  // Memoize step order for display
  const orderedSteps = useMemo(() => {
    // Sort: incomplete first, then completed
    return [...steps].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  }, [steps]);

  // Don't render if card shouldn't be shown
  if (!isVisible || allComplete) {
    return null;
  }

  const handleStepClick = (stepId: SetupStepId) => {
    const config = STEP_CONFIG[stepId];
    navigate(config.route);
  };

  const handleDismiss = () => {
    setSectionVisibility('setupProgress', false);
  };

  return (
    <Card className={`p-4 sm:p-6 bg-white dark:bg-card relative overflow-hidden ${className}`}>
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent dark:from-indigo-900/20 rounded-bl-full pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {t('dashboard.setupProgress.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.setupProgress.subtitle')}
            </p>
          </div>
        </div>
        
        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground -mt-1 -mr-2"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {t('dashboard.setupProgress.progress', { completed, total })}
          </span>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {percentage}%
          </span>
        </div>
        <Progress 
          value={percentage} 
          className="h-2 bg-gray-100 dark:bg-gray-800"
        />
      </div>

      {/* Steps list */}
      <div className="space-y-2">
        {orderedSteps.map((step) => {
          const config = STEP_CONFIG[step.id];
          const Icon = config.icon;
          const isComplete = step.completed;

          return (
            <button
              key={step.id}
              onClick={() => !isComplete && handleStepClick(step.id)}
              disabled={isComplete}
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg text-left
                transition-all duration-200
                ${isComplete
                  ? 'bg-green-50 dark:bg-green-900/20 cursor-default'
                  : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer hover:shadow-sm'
                }
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              `}
            >
              {/* Step icon */}
              <div
                className={`
                  p-2 rounded-lg shrink-0
                  ${isComplete
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : config.bgClass
                  }
                `}
              >
                {isComplete ? (
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${config.colorClass}`} />
                )}
              </div>

              {/* Step text */}
              <div className="flex-1 min-w-0">
                <span
                  className={`
                    text-sm font-medium block
                    ${isComplete
                      ? 'text-green-700 dark:text-green-400 line-through'
                      : 'text-foreground'
                    }
                  `}
                >
                  {t(`dashboard.setupProgress.steps.${step.id}`)}
                </span>
              </div>

              {/* Action indicator */}
              {!isComplete && (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        {t('dashboard.setupProgress.dismissHint')}
      </p>
    </Card>
  );
}
