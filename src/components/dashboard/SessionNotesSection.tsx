/**
 * Session Notes Section Component
 * Displays and manages session notes for a patient
 */

import { useTranslation } from 'react-i18next';
import { FileText, Plus } from 'lucide-react';
import { NoteList } from '../notes/NoteList';
import { SkeletonNotes } from '../shared/Skeleton';
import type { Note } from '@/lib/types/api.types';

interface SessionNotesSectionProps {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  onCreateNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onRetry: () => void;
}

export function SessionNotesSection({
  notes,
  isLoading,
  error,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onRetry,
}: SessionNotesSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          {t('clinicalFile.sections.sessionNotes')}
        </h3>
        <button
          onClick={onCreateNote}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('clinicalFile.newNote')}
        </button>
      </div>
      
      {isLoading ? (
        <SkeletonNotes items={3} />
      ) : error ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-foreground text-sm mb-1">{t('clinicalFile.notes.loadError')}</p>
          <p className="text-muted-foreground text-xs mb-3">
            {error.includes('validación') 
              ? t('clinicalFile.notes.canCreateNew')
              : t('clinicalFile.notes.tryAgainLater')}
          </p>
          <button
            onClick={onRetry}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            {t('clinicalFile.notes.retry')}
          </button>
        </div>
      ) : (
        <NoteList
          notes={notes}
          onEdit={onEditNote}
          onDelete={onDeleteNote}
          emptyMessage={t('clinicalFile.notes.noNotes')}
        />
      )}
    </div>
  );
}
