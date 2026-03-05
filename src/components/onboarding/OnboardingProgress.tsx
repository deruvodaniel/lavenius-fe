interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * Indicador de progreso del onboarding (dots)
 * Note: These are visual indicators, not interactive buttons
 */
export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => (
        <span
          key={index}
          role="presentation"
          className={`
            w-2 h-2 rounded-full transition-all duration-300
            ${index === currentStep 
              ? 'bg-indigo-600 w-6' 
              : index < currentStep 
                ? 'bg-indigo-400' 
                : 'bg-border'
            }
          `}
          aria-label={`Paso ${index + 1} de ${totalSteps}`}
          aria-current={index === currentStep ? 'step' : undefined}
        />
      ))}
    </div>
  );
}
