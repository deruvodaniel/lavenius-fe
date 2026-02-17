import { X, Lightbulb, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';

interface TipBannerProps {
  /** Unique identifier for this tip (used for dismissal) */
  tipId: string;
  /** Title of the tip */
  title: string;
  /** Description/body of the tip */
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Visual variant */
  variant?: 'info' | 'warning' | 'success';
  /** Custom icon override */
  icon?: LucideIcon;
  /** Whether the tip can be permanently dismissed */
  dismissible?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const variantStyles = {
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-900',
    description: 'text-blue-700',
    action: 'text-blue-700 hover:text-blue-900 hover:bg-blue-100',
    dismiss: 'text-blue-400 hover:text-blue-600 hover:bg-blue-100',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-500',
    title: 'text-amber-900',
    description: 'text-amber-700',
    action: 'text-amber-700 hover:text-amber-900 hover:bg-amber-100',
    dismiss: 'text-amber-400 hover:text-amber-600 hover:bg-amber-100',
  },
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    title: 'text-green-900',
    description: 'text-green-700',
    action: 'text-green-700 hover:text-green-900 hover:bg-green-100',
    dismiss: 'text-green-400 hover:text-green-600 hover:bg-green-100',
  },
};

const defaultIcons: Record<string, LucideIcon> = {
  info: Lightbulb,
  warning: AlertCircle,
  success: CheckCircle2,
};

/**
 * Banner component for showing contextual tips to users
 * Can be dismissed permanently using the onboarding store
 */
export function TipBanner({
  tipId,
  title,
  description,
  action,
  variant = 'info',
  icon,
  dismissible = true,
  className = '',
}: TipBannerProps) {
  const { shouldShowTip, dismissTip } = useOnboarding();

  // Don't render if tip has been dismissed
  if (!shouldShowTip(tipId)) {
    return null;
  }

  const styles = variantStyles[variant];
  const Icon = icon || defaultIcons[variant];

  const handleDismiss = () => {
    dismissTip(tipId);
  };

  return (
    <div className={`border rounded-lg p-4 ${styles.container} ${className}`}>
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-5 h-5 ${styles.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${styles.title}`}>
            {title}
          </h4>
          <p className={`mt-1 text-sm ${styles.description}`}>
            {description}
          </p>

          {/* Action button */}
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-2 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${styles.action}`}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 p-1 rounded-md transition-colors ${styles.dismiss}`}
            aria-label="Descartar tip"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
