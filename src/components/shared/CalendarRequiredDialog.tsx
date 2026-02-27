import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
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

interface CalendarRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => void;
  onLater?: () => void;
}

/**
 * Shared dialog shown when a blocked action requires Google Calendar connection.
 */
export function CalendarRequiredDialog({
  open,
  onOpenChange,
  onConnect,
  onLater,
}: CalendarRequiredDialogProps) {
  const { t } = useTranslation();

  const handleLater = () => {
    onLater?.();
    onOpenChange(false);
  };

  const handleConnect = () => {
    onOpenChange(false);
    onConnect();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white max-w-[calc(100%-2rem)] sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {t('agenda.googleCalendar.connectNow')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
