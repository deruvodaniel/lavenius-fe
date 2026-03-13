import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Calendar, CalendarRange } from 'lucide-react';
import { useResponsive } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { SessionDeleteScope } from '@/lib/types/session';

interface DeleteScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scope: SessionDeleteScope) => Promise<void>;
  isLoading?: boolean;
}

/**
 * DeleteScopeDialog Component
 *
 * Dialog shown when deleting a recurring session.
 * Allows user to choose between:
 * - Delete only this session (single)
 * - Delete this and following sessions (this_and_future)
 *
 * Features:
 * - Responsive: uses AlertDialog on desktop, Drawer on mobile
 * - Radio group for scope selection with visual distinction
 * - Accessible with proper ARIA attributes
 * - Loading state during deletion
 * - Dark mode support
 */
export function DeleteScopeDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteScopeDialogProps) {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const [selectedScope, setSelectedScope] = useState<SessionDeleteScope>(
    SessionDeleteScope.SINGLE
  );

  // Reset to default when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedScope(SessionDeleteScope.SINGLE);
    }
  }, [open]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (isLoading) return;
    await onConfirm(selectedScope);
  };

  const scopeOptions = [
    {
      value: SessionDeleteScope.SINGLE,
      icon: Calendar,
      titleKey: 'agenda.deleteScope.single.title',
      descriptionKey: 'agenda.deleteScope.single.description',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      value: SessionDeleteScope.THIS_AND_FUTURE,
      icon: CalendarRange,
      titleKey: 'agenda.deleteScope.thisAndFuture.title',
      descriptionKey: 'agenda.deleteScope.thisAndFuture.description',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
  ];

  const content = (
    <div className="space-y-4">
      <RadioGroup
        value={selectedScope}
        onValueChange={(value) => setSelectedScope(value as SessionDeleteScope)}
        className="gap-3"
      >
        {scopeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedScope === option.value;
          return (
            <label
              key={option.value}
              htmlFor={`scope-${option.value}`}
              className={`
                flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                ${isSelected ? option.borderColor : 'border-border'}
                ${isSelected ? option.bgColor : 'hover:bg-muted/50'}
              `}
            >
              <RadioGroupItem
                value={option.value}
                id={`scope-${option.value}`}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-foreground shrink-0" />
                  <span className="font-medium text-sm text-foreground">
                    {t(option.titleKey)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(option.descriptionKey)}
                </p>
              </div>
            </label>
          );
        })}
      </RadioGroup>

      {/* Additional context */}
      <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground">
        {t('agenda.deleteScope.hint')}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] bg-background">
          <DrawerHeader className="text-left border-b border-border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <DrawerTitle className="text-foreground">
                  {t('agenda.deleteScope.title')}
                </DrawerTitle>
                <DrawerDescription className="mt-1 text-muted-foreground">
                  {t('agenda.deleteScope.description')}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <div className="px-4 py-4 overflow-y-auto">{content}</div>
          <DrawerFooter className="gap-2 border-t border-border">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="border-border text-foreground hover:bg-muted w-full"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? t('agenda.drawer.deleting') : t('common.delete')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="z-[90] bg-background max-w-[calc(100%-2rem)] sm:max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/20 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-foreground">
                {t('agenda.deleteScope.title')}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-muted-foreground">
                {t('agenda.deleteScope.description')}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <div className="py-4">{content}</div>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="border-border text-foreground hover:bg-muted w-full sm:w-auto"
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? t('agenda.drawer.deleting') : t('common.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
