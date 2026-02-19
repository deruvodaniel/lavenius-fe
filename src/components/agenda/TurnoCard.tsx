import { Clock, Video, MapPin, MoreVertical, MessageCircle, Edit2, Trash2, AlertTriangle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { SESSION_STATUS_BORDER_CLASSES } from '@/lib/constants/sessionColors';
import type { SessionResponse, SessionStatus } from '@/lib/types/session';

// ============================================================================
// TYPES
// ============================================================================

interface PatientInfo {
  id: string;
  nombre: string;
  telefono?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

interface TurnoCardProps {
  session: SessionResponse;
  patient?: PatientInfo;
  hora: string;
  isPaid?: boolean;
  isCompactView?: boolean;
  onPatientClick: (patientId: string) => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onWhatsAppClick: () => void;
}

// ============================================================================
// STATUS KEY MAPPING
// ============================================================================

const STATUS_KEY_MAP: Record<SessionStatus, string> = {
  pending: 'scheduled',
  confirmed: 'confirmed',
  completed: 'completed',
  cancelled: 'cancelled',
};

// ============================================================================
// RISK INDICATOR
// ============================================================================

const RiskIndicator = ({ level, t }: { level: 'low' | 'medium' | 'high'; t: TFunction }) => {
  if (level === 'low') return null;
  
  const config = {
    medium: { 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50',
      labelKey: 'agenda.card.riskMedium' 
    },
    high: { 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      labelKey: 'agenda.card.riskHigh' 
    },
  };
  
  const { color, bg, labelKey } = config[level];
  
  return (
    <span 
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${bg} ${color}`}
      title={t(labelKey)}
    >
      <AlertTriangle className="w-3 h-3" />
    </span>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TurnoCard({
  session,
  patient,
  hora,
  isPaid = false,
  isCompactView = false,
  onPatientClick,
  onEditClick,
  onDeleteClick,
  onWhatsAppClick,
}: TurnoCardProps) {
  const { t } = useTranslation();
  const status = session.status as SessionStatus;
  const borderClass = SESSION_STATUS_BORDER_CLASSES[status] || 'border-l-gray-300';
  const statusKey = STATUS_KEY_MAP[status] || 'unknown';
  const statusLabel = t(`agenda.status.${statusKey}`);
  const isRemote = session.sessionType === 'remote';
  
  // Get patient initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };
  
  const initials = patient ? getInitials(patient.nombre) : '?';
  const patientName = patient?.nombre || t('agenda.details.noPatient');

  return (
    <Card className={`p-3 sm:p-4 border-l-4 bg-white hover:shadow-md transition-shadow ${borderClass}`}>
      <div className="flex items-center gap-3">
        {/* Time */}
        <div className="flex items-center gap-1.5 text-gray-600 min-w-[60px]">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{hora}</span>
        </div>

        {/* Avatar + Name (clickable) */}
        <button
          onClick={() => patient && onPatientClick(patient.id)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors group"
          disabled={!patient}
        >
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
            <span className="text-indigo-600 text-xs font-semibold">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {patientName}
            </p>
            {/* Secondary info line - status + modality */}
            {!isCompactView && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{statusLabel}</span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  {isRemote ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                  {isRemote ? t('agenda.sessionTypes.remote') : t('agenda.sessionTypes.presential')}
                </span>
              </div>
            )}
          </div>
        </button>

        {/* Indicators */}
        <div className="flex items-center gap-1.5">
          {/* Risk indicator */}
          {patient?.riskLevel && patient.riskLevel !== 'low' && (
            <RiskIndicator level={patient.riskLevel} t={t} />
          )}
          
          {/* Paid indicator */}
          {isPaid && (
            <span 
              className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700"
              title={t('agenda.card.paid')}
            >
              {t('agenda.card.paid')}
            </span>
          )}
          
          {/* Compact view: show modality icon */}
          {isCompactView && (
            <span 
              className={`p-1 rounded ${isRemote ? 'text-blue-600' : 'text-purple-600'}`}
              title={isRemote ? t('agenda.sessionTypes.remote') : t('agenda.sessionTypes.presential')}
            >
              {isRemote ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            </span>
          )}
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label={t('agenda.card.actions')}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg">
            <DropdownMenuItem 
              onClick={() => patient && onPatientClick(patient.id)} 
              disabled={!patient}
              className="cursor-pointer"
            >
              <User className="w-4 h-4 mr-2" />
              {t('agenda.card.viewFile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEditClick} className="cursor-pointer">
              <Edit2 className="w-4 h-4 mr-2" />
              {t('agenda.card.editAppointment')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onWhatsAppClick} 
              disabled={!patient}
              className="cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('agenda.card.sendWhatsApp')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDeleteClick}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('agenda.card.deleteAppointment')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
