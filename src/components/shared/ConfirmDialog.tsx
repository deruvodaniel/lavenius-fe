import { AlertTriangle, Info, HelpCircle, Trash2, LucideIcon } from 'lucide-react';
import { useResponsive } from '@/lib/hooks';
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

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
 * Renders as AlertDialog on desktop and bottom Drawer on mobile.
 * Use for confirmations before destructive/important actions.
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
  const { isMobile } = useResponsive();
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

  // Shared content for both desktop and mobile
  const IconHeader = (
    <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center shrink-0`}>
      <Icon className={`w-6 h-6 ${config.iconColor}`} />
    </div>
  );

  // Mobile: Bottom Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <div className="flex items-start gap-4">
              {IconHeader}
              <div className="flex-1 min-w-0">
                <DrawerTitle className="text-gray-900">{title}</DrawerTitle>
                <DrawerDescription className="mt-1 text-gray-600">
                  {description}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <DrawerFooter className="pt-2">
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={config.confirmButton}
            >
              {isLoading ? 'Procesando...' : confirmLabel}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: AlertDialog (centered modal)
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            {IconHeader}
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-gray-900">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-gray-600">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleCancel}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={config.confirmButton}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
