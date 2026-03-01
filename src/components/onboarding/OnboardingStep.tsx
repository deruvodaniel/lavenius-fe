import type { LucideIcon } from 'lucide-react';

interface OnboardingStepProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
}

/**
 * Componente de un paso individual del onboarding
 */
export function OnboardingStep({ 
  title, 
  description, 
  icon: Icon,
  children 
}: OnboardingStepProps) {
  return (
    <div className="w-full flex flex-col items-center text-center px-4 py-6 sm:px-6">
      {/* Icon */}
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6 transition-transform hover:scale-110">
        <Icon className="w-10 h-10 text-indigo-600" />
      </div>
      
      {/* Title */}
      <h2 className="text-xl font-semibold text-foreground mb-3">
        {title}
      </h2>

      {/* Description */}
      <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed break-words text-balance">
        {description}
      </p>
      
      {/* Custom content (actions, etc.) */}
      {children && (
        <div className="w-full max-w-sm">
          {children}
        </div>
      )}
    </div>
  );
}
