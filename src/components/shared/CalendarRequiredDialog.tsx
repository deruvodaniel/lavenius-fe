import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { useResponsive } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';

interface CalendarRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => void;
  onLater?: () => void;
}

/**
 * Shared dialog shown when a blocked action requires Google Calendar connection.
 * Responsive: Drawer on mobile, AlertDialog on desktop.
 */
export function CalendarRequiredDialog({
  open,
  onOpenChange,
  onConnect,
  onLater,
}: CalendarRequiredDialogProps) {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();

  const handleLater = () => {
    onLater?.();
    onOpenChange(false);
  };

  const handleConnect = () => {
    onOpenChange(false);
    onConnect();
  };

  const icon = (
    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
      <Calendar className="w-6 h-6 text-indigo-600" />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[75vh] bg-background">
          <DrawerHeader className="text-left border-b border-border">
            <div className="flex items-start gap-4">
              {icon}
              <div className="flex-1 min-w-0">
                <DrawerTitle className="text-foreground">
                  {t('agenda.googleCalendar.modalTitle')}
                </DrawerTitle>
                <DrawerDescription className="mt-1 text-muted-foreground">
                  {t('agenda.googleCalendar.modalDescription')}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <DrawerFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleLater}
              className="border-border text-foreground hover:bg-muted w-full"
            >
              {t('agenda.googleCalendar.later')}
            </Button>
            <Button
              onClick={handleConnect}
              className="w-full"
            >
              {t('agenda.googleCalendar.connectNow')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="z-[90] bg-background max-w-[calc(100%-2rem)] sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            {icon}
            <div className="flex-1 min-w-0">
              <AlertDialogTitle>{t('agenda.googleCalendar.modalTitle')}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                {t('agenda.googleCalendar.modalDescription')}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleLater}>
            {t('agenda.googleCalendar.later')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConnect}
          >
            {t('agenda.googleCalendar.connectNow')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
