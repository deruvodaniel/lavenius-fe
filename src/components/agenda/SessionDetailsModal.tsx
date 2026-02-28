import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/lib/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '../ui/drawer';
import { SessionType, type SessionUI } from '@/lib/types/session';
import { SESSION_STATUS_BADGE_CLASSES, SESSION_STATUS_LABELS } from '@/lib/constants/sessionColors';
import { formatTime, formatDate, formatDuration } from '@/lib/utils/dateFormatters';
import { Calendar, Clock, DollarSign, MapPin, Monitor, Edit2 } from 'lucide-react';

interface SessionDetailsModalProps {
  session: SessionUI | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  isPaid?: boolean;
}

const SESSION_TYPE_LABELS = {
  [SessionType.PRESENTIAL]: 'Presencial',
  [SessionType.REMOTE]: 'Remota',
} as const;

const SESSION_TYPE_ICONS = {
  [SessionType.PRESENTIAL]: <MapPin className="h-4 w-4" />,
  [SessionType.REMOTE]: <Monitor className="h-4 w-4" />,
} as const;

function SessionDetailsContent({ session, isPaid }: { session: SessionUI; isPaid?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 py-4 text-gray-900">
      {/* Paciente */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-1">{t('agenda.details.patient')}</h3>
        <p className="text-base font-medium text-gray-900">{session.patientName || t('agenda.details.noPatient')}</p>
      </div>

      {/* Fecha y hora */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {t('agenda.details.date')}
          </h3>
          <p className="text-sm">{formatDate(session.scheduledFrom)}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {t('agenda.details.schedule')}
          </h3>
          <p className="text-sm">
            {formatTime(session.scheduledFrom)} - {formatTime(session.scheduledTo)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDuration(session.scheduledFrom, session.scheduledTo)}
          </p>
        </div>
      </div>

      {/* Tipo de sesión */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-1">{t('agenda.details.modality')}</h3>
        <div className="flex items-center gap-2">
          {SESSION_TYPE_ICONS[session.sessionType]}
          <span className="text-sm">{SESSION_TYPE_LABELS[session.sessionType]}</span>
        </div>
      </div>

      {/* Costo */}
      {session.cost && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            {t('agenda.details.cost')}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-base font-medium">
              ${session.cost.toLocaleString('es-AR')}
            </p>
            {isPaid && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                <DollarSign className="w-3 h-3" />
                {t('agenda.details.paid')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Resumen de sesión */}
      {session.sessionSummary && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1">{t('agenda.details.summary')}</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {session.sessionSummary}
          </p>
        </div>
      )}
    </div>
  );
}

export function SessionDetailsModal({
  session,
  isOpen,
  onClose,
  onEdit,
  isPaid
}: SessionDetailsModalProps) {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();

  if (!session) return null;

  const statusBadge = (
    <Badge className={SESSION_STATUS_BADGE_CLASSES[session.status]}>
      {SESSION_STATUS_LABELS[session.status]}
    </Badge>
  );

  const actionButtons = (
    <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
      <Button variant="outline" onClick={onClose} className={isMobile ? 'w-full' : ''}>
        {t('common.close')}
      </Button>
      <Button
        onClick={onEdit}
        className={`gap-2 ${isMobile ? 'w-full' : ''}`}
      >
        <Edit2 className="h-4 w-4" />
        {t('agenda.details.editSession')}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh] bg-white">
          <DrawerHeader className="text-left border-b border-gray-100">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-gray-900">
                {t('agenda.details.title')}
              </DrawerTitle>
              {statusBadge}
            </div>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto">
            <SessionDetailsContent session={session} isPaid={isPaid} />
          </div>
          <DrawerFooter className="gap-2">
            {actionButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] !bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-gray-900">
            <span>{t('agenda.details.title')}</span>
            {statusBadge}
          </DialogTitle>
        </DialogHeader>
        <SessionDetailsContent session={session} isPaid={isPaid} />
        {actionButtons}
      </DialogContent>
    </Dialog>
  );
}
