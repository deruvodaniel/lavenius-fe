import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SessionType, type SessionUI } from '@/lib/types/session';
import { SESSION_STATUS_BADGE_CLASSES, SESSION_STATUS_LABELS } from '@/lib/constants/sessionColors';
import { formatTime, formatDate, formatDuration } from '@/lib/utils/dateFormatters';
import { Calendar, Clock, DollarSign, MapPin, Monitor, Edit2 } from 'lucide-react';

interface SessionDetailsModalProps {
  session: SessionUI | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const SESSION_TYPE_LABELS = {
  [SessionType.PRESENTIAL]: 'Presencial',
  [SessionType.REMOTE]: 'Remota',
} as const;

const SESSION_TYPE_ICONS = {
  [SessionType.PRESENTIAL]: <MapPin className="h-4 w-4" />,
  [SessionType.REMOTE]: <Monitor className="h-4 w-4" />,
} as const;

export function SessionDetailsModal({ 
  session, 
  isOpen, 
  onClose,
  onEdit 
}: SessionDetailsModalProps) {
  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] !bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-gray-900">
            <span>Detalles de la Sesión</span>
            <Badge className={SESSION_STATUS_BADGE_CLASSES[session.status]}>
              {SESSION_STATUS_LABELS[session.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 text-gray-900">
          {/* Paciente */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Paciente</h3>
            <p className="text-base font-medium text-gray-900">{session.patientName || 'Sin paciente'}</p>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Fecha
              </h3>
              <p className="text-sm">
                {formatDate(session.scheduledFrom)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Horario
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
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Modalidad</h3>
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
                Costo
              </h3>
              <p className="text-base font-medium">
                ${session.cost.toLocaleString('es-AR')}
              </p>
            </div>
          )}

          {/* Resumen de sesión */}
          {session.sessionSummary && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Resumen</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {session.sessionSummary}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onEdit} className="gap-2">
            <Edit2 className="h-4 w-4" />
            Editar Sesión
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
