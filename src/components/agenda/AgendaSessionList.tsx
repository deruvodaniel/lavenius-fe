/**
 * Agenda Session List Component
 * Displays grouped sessions by date with infinite scroll
 */

import { useTranslation } from 'react-i18next';
import { CalendarX, Search } from 'lucide-react';
import { TurnoCard } from './TurnoCard';
import { SkeletonList, EmptyState } from '../shared';
import CalendarSyncButton from '../config/CalendarSyncButton';
import type { SessionUI } from '@/lib/types/session';
import type { TurnoUI, PacienteUI } from '@/lib/hooks/useAgenda';
import type { Patient } from '@/lib/types/api.types';

interface AgendaSessionListProps {
  isLoading: boolean;
  visibleTurnosPorDia: [string, TurnoUI[]][];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  searchTerm: string;
  today: Date;
  pacientes: PacienteUI[];
  patients: Patient[];
  sessionsUI: SessionUI[];
  isCompactView: boolean;
  formatFecha: (fecha: string) => string;
  getPaciente: (pacienteId: string | null) => PacienteUI | undefined;
  isSessionPaid: (sessionId: string) => boolean;
  onClearSearch: () => void;
  onNewTurno: () => void;
  onPatientClick: (patientId: string) => void;
  onEditClick: (session: SessionUI) => void;
  onDeleteClick: (sessionId: string, patientName: string) => void;
  onWhatsAppClick: (paciente: PacienteUI | undefined, turno: TurnoUI) => void;
}

export function AgendaSessionList({
  isLoading,
  visibleTurnosPorDia,
  hasMore,
  isLoadingMore,
  loadMoreRef,
  searchTerm,
  today,
  pacientes,
  patients,
  sessionsUI,
  isCompactView,
  formatFecha,
  getPaciente,
  isSessionPaid,
  onClearSearch,
  onNewTurno,
  onPatientClick,
  onEditClick,
  onDeleteClick,
  onWhatsAppClick,
}: AgendaSessionListProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col flex-1">
      <h2 className="text-foreground px-6 pt-6 pb-4 flex-shrink-0">{t('agenda.upcoming')}</h2>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <SkeletonList items={5} />
        ) : visibleTurnosPorDia.length === 0 ? (
          <div className="space-y-6">
            <EmptyState
              icon={searchTerm ? Search : CalendarX}
              title={searchTerm ? t('agenda.noResults') : t('agenda.noSessions')}
              description={searchTerm 
                ? t('agenda.noResultsDescription', { search: searchTerm })
                : t('agenda.noSessionsDescription')
              }
              action={searchTerm ? {
                label: t('agenda.clearSearch'),
                onClick: onClearSearch
              } : {
                label: t('agenda.addFirstSession'),
                onClick: onNewTurno
              }}
              variant="subtle"
            />
            {!searchTerm && (
              <div className="flex justify-center pt-4">
                <CalendarSyncButton variant="outline" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {visibleTurnosPorDia.map(([fecha, turnosDelDia]) => {
              const isToday = new Date(fecha).toDateString() === today.toDateString();

              return (
                <div key={fecha} className="space-y-3">
                  {/* Date Header */}
                  <div className={`pb-2 border-b-2 ${isToday ? 'border-indigo-600' : 'border-border'}`}>
                    <h3 className={`capitalize ${isToday ? 'text-indigo-600' : 'text-foreground'}`}>
                      {formatFecha(fecha)}
                    </h3>
                  </div>

                  {/* Appointments for this day */}
                  <div className="space-y-3">
                    {turnosDelDia.map((turno) => {
                      const paciente = getPaciente(turno.pacienteId ?? null);
                      const session = sessionsUI.find(s => s.id === turno.id);
                      const isPaid = session ? isSessionPaid(session.id) : false;
                      const originalPatient = patients.find(p => p.id === paciente?.id);

                      if (!session) return null;

                      return (
                        <TurnoCard
                          key={turno.id}
                          session={session}
                          patient={paciente ? {
                            id: paciente.id,
                            nombre: paciente.nombre,
                            telefono: paciente.telefono,
                            riskLevel: originalPatient?.riskLevel,
                          } : undefined}
                          hora={turno.hora}
                          isPaid={isPaid}
                          isCompactView={isCompactView}
                          onPatientClick={(patientId) => onPatientClick(patientId)}
                          onEditClick={() => onEditClick(session)}
                          onDeleteClick={() => onDeleteClick(session.id, paciente?.nombre || 'este paciente')}
                          onWhatsAppClick={() => onWhatsAppClick(paciente, turno)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-6 text-center">
                {isLoadingMore ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('agenda.loadingMore')}</p>
                  </div>
                ) : (
                  <div className="h-4"></div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
