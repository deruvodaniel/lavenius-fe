/**
 * FichaClinica Component
 * Clinical file view for a single patient
 * 
 * Refactored to use sub-components:
 * - PatientHeader
 * - ContactInfoCard
 * - UpcomingSessionsCard
 * - ClinicalSectionCard
 * - SessionNotesSection
 */

import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TurnoDrawer } from '../agenda';
import { NoteDrawer } from '../notes/NoteDrawer';
import { PacienteDrawer } from '../pacientes/PacienteDrawer';
import { PatientHeader } from './PatientHeader';
import { ContactInfoCard } from './ContactInfoCard';
import { UpcomingSessionsCard } from './UpcomingSessionsCard';
import { ClinicalSectionCard } from './ClinicalSectionCard';
import { SessionNotesSection } from './SessionNotesSection';
import { usePatients } from '@/lib/hooks';
import { useNotes } from '@/lib/hooks/useNotes';
import { useSessions } from '@/lib/stores/sessionStore';
import { getErrorMessage } from '@/lib/utils/error';
import type { Patient, CreatePatientDto, Note } from '@/lib/types/api.types';
import type { CreateSessionDto } from '@/lib/types/session';

interface FichaClinicaProps {
  patient: Patient | null;
  onBack: () => void;
}

export function FichaClinica({ patient, onBack }: FichaClinicaProps) {
  const { t } = useTranslation();
  const { updatePatient, fetchPatients } = usePatients();
  const { sessionsUI, isLoading: isLoadingSessions, fetchUpcoming, createSession } = useSessions();
  const { notes, isLoading: isLoadingNotes, error: notesError, fetchNotesByPatient, createNote, updateNote, deleteNote, clearNotes, clearError: clearNotesError } = useNotes();
  
  // Flag state
  const [isFlagged, setIsFlagged] = useState(patient?.riskLevel === 'high');
  const [isSavingFlag, setIsSavingFlag] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isPacienteDrawerOpen, setIsPacienteDrawerOpen] = useState(false);
  
  // Editable data
  const [editableData, setEditableData] = useState({
    telefono: patient?.phone || '',
    email: patient?.email || '',
    diagnostico: patient?.diagnosis || '',
    tratamientoActual: patient?.currentTreatment || '',
    observaciones: patient?.observations || '',
  });

  // Drawer state
  const [isTurnoDrawerOpen, setIsTurnoDrawerOpen] = useState(false);
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Update flag when patient changes
  useEffect(() => {
    if (patient) {
      setIsFlagged(patient.riskLevel === 'high');
    }
  }, [patient?.riskLevel]);

  // Load data when patient changes
  useEffect(() => {
    if (patient?.id) {
      fetchNotesByPatient(patient.id);
      fetchUpcoming();
    }
    return () => {
      clearNotes();
      clearNotesError();
    };
  }, [patient?.id, fetchNotesByPatient, clearNotes, fetchUpcoming, clearNotesError]);

  if (!patient) return null;

  // Calculate age
  let edad = patient.age || 0;
  if (patient.birthDate && !patient.age) {
    const birthDate = new Date(patient.birthDate);
    const today = new Date();
    edad = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      edad--;
    }
  }

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Event handlers
  const handleToggleFlag = async () => {
    const newFlagValue = !isFlagged;
    setIsFlagged(newFlagValue);
    setIsSavingFlag(true);
    
    try {
      await updatePatient(patient.id, {
        riskLevel: newFlagValue ? 'high' : 'low',
      });
      toast.success(newFlagValue ? t('clinicalFile.messages.riskMarked') : t('clinicalFile.messages.riskRemoved'));
      await fetchPatients();
    } catch (error: unknown) {
      setIsFlagged(!newFlagValue);
      console.error('Error updating patient flag:', error);
      toast.error(t('clinicalFile.messages.riskUpdateError'));
    } finally {
      setIsSavingFlag(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updatePatient(patient.id, {
        phone: editableData.telefono || undefined,
        email: editableData.email || undefined,
        diagnosis: editableData.diagnostico || undefined,
        currentTreatment: editableData.tratamientoActual || undefined,
        observations: editableData.observaciones || undefined,
      });
      setIsEditing(false);
      toast.success(t('clinicalFile.messages.infoUpdateSuccess'));
    } catch (error: unknown) {
      console.error('Error updating patient:', error);
      toast.error(t('clinicalFile.messages.infoUpdateError'));
    }
  };

  const handleCancelEdit = () => {
    setEditableData({
      telefono: patient.phone || '',
      email: patient.email || '',
      diagnostico: patient.diagnosis || '',
      tratamientoActual: patient.currentTreatment || '',
      observaciones: patient.observations || '',
    });
    setIsEditing(false);
  };

  const handleSaveTurno = async (sessionData: CreateSessionDto) => {
    try {
      await createSession(sessionData);
      toast.success(t('clinicalFile.messages.appointmentCreateSuccess'));
      await fetchUpcoming();
      setIsTurnoDrawerOpen(false);
    } catch (error: unknown) {
      console.error('Error creating session:', error);
      const errorMessage = getErrorMessage(error, t('clinicalFile.messages.appointmentCreateError'));
      toast.error(errorMessage);
    }
  };

  const handleSaveNote = async (data: Parameters<typeof createNote>[0] | Parameters<typeof updateNote>[1], noteId?: string) => {
    try {
      if (noteId) {
        await updateNote(noteId, data);
        toast.success(t('clinicalFile.messages.noteUpdateSuccess'));
      } else {
        await createNote(data as Parameters<typeof createNote>[0]);
        toast.success(t('clinicalFile.messages.noteCreateSuccess'));
      }
      setIsNoteDrawerOpen(false);
      setSelectedNote(null);
    } catch (error: unknown) {
      console.error('Error saving note:', error);
      toast.error(t('clinicalFile.messages.noteSaveError'));
    }
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsNoteDrawerOpen(true);
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      toast.success(t('clinicalFile.messages.noteDeleteSuccess'));
    } catch (error: unknown) {
      console.error('Error deleting note:', error);
      toast.error(t('clinicalFile.messages.noteDeleteError'));
    }
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setIsNoteDrawerOpen(true);
  };

  const handleSavePatientFromDrawer = async (patientData: CreatePatientDto) => {
    try {
      await updatePatient(patient.id, patientData);
      toast.success(t('clinicalFile.messages.patientUpdateSuccess'));
      setIsPacienteDrawerOpen(false);
      await fetchPatients();
      setEditableData({
        telefono: patientData.phone || '',
        email: patientData.email || '',
        diagnostico: patientData.diagnosis || '',
        tratamientoActual: patientData.currentTreatment || '',
        observaciones: patientData.observations || '',
      });
    } catch (error: unknown) {
      console.error('Error updating patient:', error);
      toast.error(t('clinicalFile.messages.patientUpdateError'));
    }
  };

  const handleSendWhatsApp = (message?: string) => {
    if (!editableData.telefono) {
      toast.info(t('clinicalFile.messages.noPhone'));
      return;
    }

    const phone = editableData.telefono.replace(/\D/g, '');
    const defaultMessage = t('clinicalFile.whatsapp.defaultMessage', { name: patient.firstName });
    const encodedMessage = encodeURIComponent(message || defaultMessage);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  // Get patient's sessions
  const turnosPaciente = sessionsUI.filter((s) => s.patient?.id === patient.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const proximosTurnos = turnosPaciente
    .filter((a) => new Date(a.scheduledFrom) >= today)
    .sort((a, b) => new Date(a.scheduledFrom).getTime() - new Date(b.scheduledFrom).getTime());

  const ultimaConsulta = turnosPaciente
    .filter((s) => new Date(s.scheduledFrom) < today && s.status === 'completed')
    .sort((a, b) => new Date(b.scheduledFrom).getTime() - new Date(a.scheduledFrom).getTime())[0];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t('clinicalFile.backToPatients')}</span>
      </button>

      {/* Patient Header */}
      <PatientHeader
        patient={patient}
        edad={edad}
        isFlagged={isFlagged}
        isSavingFlag={isSavingFlag}
        onEditPatient={() => setIsPacienteDrawerOpen(true)}
        onToggleFlag={handleToggleFlag}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contact Info */}
          <ContactInfoCard
            telefono={editableData.telefono}
            email={editableData.email}
            ultimaConsulta={ultimaConsulta?.scheduledFrom}
            isEditing={isEditing}
            onTelefonoChange={(value) => setEditableData({ ...editableData, telefono: value })}
            onEmailChange={(value) => setEditableData({ ...editableData, email: value })}
            onStartEdit={() => setIsEditing(true)}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onSendWhatsApp={() => handleSendWhatsApp()}
            formatFecha={formatFecha}
          />

          {/* Upcoming Sessions */}
          <UpcomingSessionsCard
            sessions={proximosTurnos}
            isLoading={isLoadingSessions}
            formatFecha={formatFecha}
            onScheduleClick={() => setIsTurnoDrawerOpen(true)}
          />
        </div>

        {/* Middle & Right Columns */}
        <div className="col-span-2 space-y-6">
          {/* Diagnosis */}
          <ClinicalSectionCard
            title={t('clinicalFile.sections.diagnosis')}
            content={editableData.diagnostico}
            emptyMessage={t('clinicalFile.noDiagnosis')}
            isEditing={isEditing}
            onContentChange={(value) => setEditableData({ ...editableData, diagnostico: value })}
          />

          {/* Current Treatment */}
          <ClinicalSectionCard
            title={t('clinicalFile.sections.currentTreatment')}
            content={editableData.tratamientoActual}
            emptyMessage={t('clinicalFile.noTreatment')}
            isEditing={isEditing}
            onContentChange={(value) => setEditableData({ ...editableData, tratamientoActual: value })}
          />

          {/* Observations */}
          <ClinicalSectionCard
            title={t('clinicalFile.sections.observations')}
            content={editableData.observaciones}
            emptyMessage={t('clinicalFile.noObservations')}
            isEditing={isEditing}
            onContentChange={(value) => setEditableData({ ...editableData, observaciones: value })}
          />

          {/* Session Notes */}
          <SessionNotesSection
            notes={notes}
            isLoading={isLoadingNotes}
            error={notesError}
            onCreateNote={handleCreateNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onRetry={() => patient?.id && fetchNotesByPatient(patient.id)}
          />
        </div>
      </div>

      {/* Drawers */}
      <TurnoDrawer
        isOpen={isTurnoDrawerOpen}
        onClose={() => setIsTurnoDrawerOpen(false)}
        pacienteId={patient.id}
        patients={[patient]}
        onSave={handleSaveTurno}
      />

      <NoteDrawer
        isOpen={isNoteDrawerOpen}
        onClose={() => {
          setIsNoteDrawerOpen(false);
          setSelectedNote(null);
        }}
        onSave={handleSaveNote}
        note={selectedNote}
        patientId={patient.id}
      />

      <PacienteDrawer
        isOpen={isPacienteDrawerOpen}
        onClose={() => setIsPacienteDrawerOpen(false)}
        onSave={handleSavePatientFromDrawer}
        patient={patient}
      />
    </div>
  );
}
