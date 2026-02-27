/**
 * Patient Header Component
 * Displays patient avatar, name, and key info in the FichaClinica
 */

import { useTranslation } from 'react-i18next';
import { User, Heart, RefreshCw, Flag, Pencil } from 'lucide-react';
import type { Patient } from '@/lib/types/api.types';
import { getNameInitials } from '@/lib/utils/nameInitials';

interface PatientHeaderProps {
  patient: Patient;
  edad: number;
  isFlagged: boolean;
  isSavingFlag: boolean;
  onEditPatient: () => void;
  onToggleFlag: () => void;
}

/**
 * Helper to format frequency label
 */
function getFrecuenciaLabel(frecuencia: string | undefined, t: ReturnType<typeof useTranslation>['t']) {
  switch (frecuencia?.toLowerCase()) {
    case 'semanal':
      return t('clinicalFile.frequency.weekly');
    case 'quincenal':
      return t('clinicalFile.frequency.biweekly');
    case 'mensual':
      return t('clinicalFile.frequency.monthly');
    default:
      return frecuencia || t('clinicalFile.frequency.notSpecified');
  }
}

export function PatientHeader({
  patient,
  edad,
  isFlagged,
  isSavingFlag,
  onEditPatient,
  onToggleFlag,
}: PatientHeaderProps) {
  const { t } = useTranslation();

  const initials = getNameInitials(`${patient.firstName} ${patient.lastName || ''}`);

  return (
    <div className={`bg-gradient-to-r ${isFlagged ? 'from-red-900 to-red-700' : 'from-indigo-900 to-indigo-700'} text-white rounded-lg p-4 md:p-6 lg:p-8 mb-6 transition-colors`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        {/* Avatar */}
        <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 ${isFlagged ? 'bg-red-600' : 'bg-indigo-600'} rounded-full flex items-center justify-center flex-shrink-0 relative`}>
          <span className="text-white text-xl sm:text-2xl md:text-3xl">
            {initials}
          </span>
          {isFlagged && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Flag className="w-3.5 h-3.5 text-red-900 fill-current" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <h1 className="text-white text-2xl md:text-3xl">{patient.firstName} {patient.lastName}</h1>
            {isFlagged && (
              <span className="px-2 py-0.5 bg-yellow-400 text-red-900 text-xs font-bold rounded">
                {t('clinicalFile.highRisk')}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-indigo-200">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{edad} años</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>{patient.healthInsurance || t('clinicalFile.noHealthInsurance')}</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>{getFrecuenciaLabel(patient.frequency, t)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEditPatient}
            className={`p-3 rounded-lg ${isFlagged ? 'hover:bg-red-600' : 'hover:bg-indigo-600'} transition-colors`}
            title={t('clinicalFile.actions.editPatient')}
            aria-label={t('clinicalFile.actions.editPatient')}
          >
            <Pencil className={`w-6 h-6 ${isFlagged ? 'text-red-200 hover:text-white' : 'text-indigo-200 hover:text-white'}`} />
          </button>
          <button
            onClick={onToggleFlag}
            disabled={isSavingFlag}
            className={`p-3 rounded-lg ${isFlagged ? 'hover:bg-red-600' : 'hover:bg-indigo-600'} transition-colors disabled:opacity-50`}
            title={isFlagged ? t('clinicalFile.actions.removeRisk') : t('clinicalFile.actions.markHighRisk')}
            aria-label={isFlagged ? t('clinicalFile.actions.removeRisk') : t('clinicalFile.actions.markHighRisk')}
          >
            <Flag
              className={`w-6 h-6 ${isFlagged ? 'fill-yellow-400 text-yellow-400' : 'text-indigo-200'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
