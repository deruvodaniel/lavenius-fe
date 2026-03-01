import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface StepConfig {
  id: string;
  title: string;
  shortTitle?: string;
  icon?: LucideIcon;
}

interface StepperHeaderProps {
  steps: StepConfig[];
  currentStep: number;
  className?: string;
}

/**
 * Horizontal stepper header with step indicators and progress bar
 * - Shows numbered circles with checkmarks for completed steps
 * - Progress bar animates between steps
 * - Responsive: Shows full titles on desktop, abbreviated on mobile
 */
export function StepperHeader({ steps, currentStep, className = '' }: StepperHeaderProps) {
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop: Full stepper */}
      <div className="hidden sm:block">
        <div className="relative">
          {/* Progress bar background */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border mx-12" />
          
          {/* Progress bar fill - animated */}
          <div 
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 mx-12 transition-all duration-500 ease-out"
            style={{ width: `calc(${progressPercent}% - 3rem)` }}
          />

          {/* Step indicators */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isFuture = index > currentStep;
              const StepIcon = step.icon;

              return (
                <div 
                  key={step.id}
                  className="flex flex-col items-center"
                >
                  {/* Circle indicator */}
                  <div
                    className={`
                      relative z-10 flex items-center justify-center w-10 h-10 rounded-full
                      transition-all duration-300 ease-out
                      ${isCompleted 
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200' 
                        : isCurrent 
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 ring-4 ring-indigo-100 shadow-lg shadow-indigo-200' 
                          : 'bg-muted border-2 border-border'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white animate-stepper-check" />
                    ) : StepIcon ? (
                      <StepIcon className={`w-5 h-5 ${isFuture ? 'text-muted-foreground' : 'text-white'}`} />
                    ) : (
                      <span className={`text-sm font-semibold ${isFuture ? 'text-muted-foreground' : 'text-white'}`}>
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Step title */}
                  <span 
                    className={`
                      mt-2 text-xs font-medium text-center max-w-[80px] leading-tight
                      transition-colors duration-300
                      ${isCompleted ? 'text-indigo-600' : isCurrent ? 'text-foreground' : 'text-muted-foreground'}
                    `}
                  >
                    {step.shortTitle || step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Simplified stepper */}
      <div className="sm:hidden">
        <div className="flex flex-col items-center gap-3">
          {/* Step counter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-indigo-600">
              Paso {currentStep + 1}
            </span>
            <span className="text-sm text-muted-foreground">de {totalSteps}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Current step title */}
          <span className="text-sm font-medium text-foreground">
            {steps[currentStep]?.title}
          </span>
        </div>
      </div>
    </div>
  );
}
