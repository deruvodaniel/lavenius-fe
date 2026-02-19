import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { EmptyState } from '../shared/EmptyState';
import { SkeletonNotes } from '../shared/Skeleton';
import type { Note } from '@/lib/types/api.types';

interface NoteListProps {
  notes: Note[];
  isLoading?: boolean;
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  onCreateNew?: () => void;
  readOnly?: boolean;
  emptyMessage?: string;
}

/**
 * NoteList Component
 * Displays a list of notes with empty state and loading skeleton
 */
export function NoteList({ 
  notes, 
  isLoading = false,
  onEdit, 
  onDelete, 
  onCreateNew,
  readOnly = false,
  emptyMessage
}: NoteListProps) {
  const { t } = useTranslation();
  
  if (isLoading) {
    return <SkeletonNotes items={3} />;
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={emptyMessage || t('notes.emptyState.title')}
        description={t('notes.emptyState.description')}
        variant="subtle"
        action={onCreateNew ? {
          label: t('notes.emptyState.createFirst'),
          onClick: onCreateNew
        } : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
