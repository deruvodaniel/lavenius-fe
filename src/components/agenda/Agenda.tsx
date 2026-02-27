/**
 * Agenda Component
 * Main view for session/appointment management
 * 
 * Refactored to use:
 * - useAgenda hook for state management
 * - AgendaHeader for header section
 * - AgendaSessionList for session list
 * - ViewModeToggle for view switching
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TurnoDrawer } from './TurnoDrawer';
import { SessionDetailsModal } from './SessionDetailsModal';
import { ConfirmDialog, CalendarRequiredDialog } from '../shared';
import { FullCalendarView } from './FullCalendarView';
import { FichaClinica } from '../dashboard/FichaClinica';
import { AgendaHeader } from './AgendaHeader';
import { AgendaSessionList } from './AgendaSessionList';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useAgenda } from '@/lib/hooks/useAgenda';

const CALENDAR_PROMPTED_KEY = 'lavenius-calendar-prompted';

export function Agenda() {
  const { t } = useTranslation();
  const {
    // State
    isLoading,
    selectedPatientId,
    isLoadingPatientDetails,
    selectedPatient,
    turnoDrawerOpen,
    setTurnoDrawerOpen,
    detailsModalOpen,
    setDetailsModalOpen,
    selectedSession,
    setSelectedSession,
    selectedInitialDate,
    setSelectedInitialDate,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    sessionToDelete,
    setSessionToDelete,
    isDeleting,
    loadMoreRef,
    isLoadingMore,

    // Computed data
    today,
    patients,
    pacientes,
    sessionsUI,
    futurosTurnos,
    filteredSessionsForCalendar,
    visibleTurnosPorDia,
    hasMore,

    // Calendar state
    isCalendarConnected,
    connectCalendar,
    syncCalendar,
    isSyncing,
    lastSyncAt,

    // Responsive
    isDesktop,

    // Helper functions
    formatFecha,
    getPaciente,
    getPatientNameById,
    isSessionPaid,

    // Event handlers
    handleNuevoTurno,
    handleSaveTurno,
    handleDeleteTurno,
    handleRequestDeleteTurno,
    confirmDeleteTurno,
    handleSendWhatsAppConfirmation,
    handleSelectPatient,
    handleBackFromFicha,
    handleEventDrop,
  } = useAgenda();

  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Show calendar sync modal on first visit if not connected
  useEffect(() => {
    if (!isCalendarConnected && !localStorage.getItem(CALENDAR_PROMPTED_KEY)) {
      const timer = window.setTimeout(() => {
        setShowCalendarModal(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isCalendarConnected]);

  const handleDismissCalendarModal = () => {
    localStorage.setItem(CALENDAR_PROMPTED_KEY, 'true');
    setShowCalendarModal(false);
  };

  const handleConnectFromModal = () => {
    localStorage.setItem(CALENDAR_PROMPTED_KEY, 'true');
    setShowCalendarModal(false);
    connectCalendar();
  };

  // Gate new session creation when calendar is not connected
  const handleNewTurnoGated = () => {
    if (!isCalendarConnected) {
      setShowCalendarModal(true);
      return;
    }
    handleNuevoTurno();
  };

  // If a patient is selected, show their FichaClinica
  if (selectedPatientId !== null) {
    if (isLoadingPatientDetails || !selectedPatient) {
      return (
        <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner message={t('agenda.loadingPatientDetails')} />
        </div>
      );
    }
    
    return (
      <FichaClinica
        patient={selectedPatient}
        onBack={handleBackFromFicha}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <AgendaHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchResultsCount={futurosTurnos.length}
        isDesktop={isDesktop}
        isCalendarConnected={isCalendarConnected}
        isSyncing={isSyncing}
        lastSyncAt={lastSyncAt}
        onConnectCalendar={connectCalendar}
        onSyncCalendar={syncCalendar}
        onNewTurno={handleNewTurnoGated}
      />

      {/* Layout Principal - Based on viewMode */}
      <div className={`flex-1 overflow-hidden ${
        viewMode === 'both' 
          ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
          : 'flex'
      }`}>
        {/* Lista de Turnos */}
        {(viewMode === 'list' || viewMode === 'both') && (
          <AgendaSessionList
            isLoading={isLoading}
            visibleTurnosPorDia={visibleTurnosPorDia}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMoreRef={loadMoreRef}
            searchTerm={searchTerm}
            today={today}
            pacientes={pacientes}
            patients={patients}
            sessionsUI={sessionsUI}
            isCompactView={viewMode === 'both'}
            formatFecha={formatFecha}
            getPaciente={getPaciente}
            isSessionPaid={isSessionPaid}
            onClearSearch={() => setSearchTerm('')}
            onNewTurno={handleNewTurnoGated}
            onPatientClick={handleSelectPatient}
            onEditClick={(session) => {
              setSelectedSession(session);
              setTurnoDrawerOpen(true);
            }}
            onDeleteClick={handleRequestDeleteTurno}
            onWhatsAppClick={handleSendWhatsAppConfirmation}
          />
        )}

        {/* FullCalendar - Shows based on viewMode */}
        {(viewMode === 'calendar' || viewMode === 'both') && (
          <div className="overflow-auto flex-1">
            <div className="sticky top-4">
              <FullCalendarView
                sessions={filteredSessionsForCalendar}
                isLoading={isLoading}
                isSessionPaid={isSessionPaid}
                getPatientNameFallback={getPatientNameById}
                onEventClick={(session) => {
                  setSelectedSession(session);
                  setDetailsModalOpen(true);
                }}
                onDateSelect={(start) => {
                  if (!isCalendarConnected) {
                    setShowCalendarModal(true);
                    return;
                  }
                  setSelectedSession(null);
                  setSelectedInitialDate(start);
                  setTurnoDrawerOpen(true);
                }}
                onEventDrop={handleEventDrop}
              />
            </div>
          </div>
        )}
      </div>

      {/* Turno Drawer */}
      <TurnoDrawer
        isOpen={turnoDrawerOpen}
        onClose={() => {
          setTurnoDrawerOpen(false);
          setSelectedSession(null);
          setSelectedInitialDate(undefined);
        }}
        session={selectedSession}
        patients={patients}
        pacienteId={selectedPatientId || undefined}
        initialDate={selectedInitialDate}
        onSave={handleSaveTurno}
        onDelete={handleDeleteTurno}
      />

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        isOpen={detailsModalOpen}
        isPaid={selectedSession ? isSessionPaid(selectedSession.id) : false}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedSession(null);
        }}
        onEdit={() => {
          setDetailsModalOpen(false);
          setTurnoDrawerOpen(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('agenda.messages.deleteConfirmTitle')}
        description={t('agenda.messages.deleteConfirmDescription', { patientName: sessionToDelete?.patientName })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={confirmDeleteTurno}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setSessionToDelete(null);
        }}
        isLoading={isDeleting}
      />

      <CalendarRequiredDialog
        open={showCalendarModal}
        onOpenChange={setShowCalendarModal}
        onLater={handleDismissCalendarModal}
        onConnect={handleConnectFromModal}
      />
    </div>
  );
}
