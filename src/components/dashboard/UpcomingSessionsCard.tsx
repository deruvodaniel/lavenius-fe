/**
 * Upcoming Sessions Card Component
 * Displays upcoming appointments for a patient
 */

import { useTranslation } from 'react-i18next';
import { Clock, Plus } from 'lucide-react';
import { SkeletonSessionCard } from '../shared/Skeleton';
import type { SessionUI } from '@/lib/types/session';

interface UpcomingSessionsCardProps {
  sessions: SessionUI[];
  isLoading: boolean;
  formatFecha: (fecha: string) => string;
  onScheduleClick: () => void;
}

export function UpcomingSessionsCard({
  sessions,
  isLoading,
  formatFecha,
  onScheduleClick,
}: UpcomingSessionsCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="text-foreground mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-indigo-600" />
        {t('clinicalFile.sections.upcomingAppointments')}
      </h3>
      {isLoading ? (
        <div className="space-y-3">
          <SkeletonSessionCard />
          <SkeletonSessionCard />
        </div>
      ) : sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((turno) => {
            const dateTime = new Date(turno.scheduledFrom);
            const fecha = dateTime.toISOString().split('T')[0];
            const hora = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
            
            return (
              <div key={turno.id} className="p-3 bg-indigo-50 rounded border border-indigo-100">
                <p className="text-foreground text-sm mb-1">{formatFecha(fecha)}</p>
                <p className="text-muted-foreground text-sm">{hora} - {turno.sessionSummary || t('clinicalFile.defaultSession')}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{t('clinicalFile.noUpcomingAppointments')}</p>
      )}
      
      <button
        onClick={onScheduleClick}
        className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t('clinicalFile.scheduleAppointment')}
      </button>
    </div>
  );
}
