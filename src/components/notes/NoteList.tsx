import { FileText } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { EmptyState } from '../shared/EmptyState';
import type { Note } from '@/lib/types/api.types';

interface NoteListProps {
  notes: Note[];
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  onCreateNew?: () => void;
  readOnly?: boolean;
  emptyMessage?: string;
}

/**
 * NoteList Component
 * Displays a list of notes with empty state
 */
export function NoteList({ 
  notes, 
  onEdit, 
  onDelete, 
  onCreateNew,
  readOnly = false,
  emptyMessage = 'No hay notas registradas'
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={emptyMessage}
        description="Las notas se muestran ordenadas por fecha de creación"
        variant="subtle"
        action={onCreateNew ? {
          label: 'Crear primera nota',
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
