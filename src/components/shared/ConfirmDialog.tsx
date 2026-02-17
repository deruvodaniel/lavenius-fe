import { AlertTriangle, Info, HelpCircle, Trash2, LucideIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'default';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  /** Custom icon to override the variant's default icon */
  icon?: LucideIcon;
}

const variantConfig: Record<ConfirmDialogVariant, {
  icon: typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  confirmButton: string;
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  default: {
    icon: HelpCircle,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    confirmButton: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
};

/**
 * ConfirmDialog - Responsive confirmation dialog
 * 
 * Uses AlertDialog with CSS-based responsive styling.
 * On mobile it appears as a bottom sheet style, on desktop as centered modal.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white max-w-[calc(100%-2rem)] sm:max-w-lg fixed bottom-0 sm:bottom-auto sm:top-[50%] left-[50%] translate-x-[-50%] translate-y-0 sm:translate-y-[-50%] rounded-t-xl sm:rounded-lg rounded-b-none sm:rounded-b-lg">
        {/* Mobile handle bar - only visible on mobile */}
        <div className="flex justify-center pt-1 pb-2 sm:hidden">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-gray-900">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-gray-600">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <AlertDialogCancel 
            onClick={handleCancel}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={`${config.confirmButton} w-full sm:w-auto`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
