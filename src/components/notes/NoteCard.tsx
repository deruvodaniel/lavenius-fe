import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, Trash2, Edit } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../shared';
import { formatDateTime, formatDate } from '@/lib/utils/dateFormatters';
import type { Note } from '@/lib/types/api.types';

interface NoteCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

/**
 * NoteCard Component
 * Displays a single note with edit/delete actions
 */
export function NoteCard({ note, onEdit, onDelete, readOnly = false }: NoteCardProps) {
  const { t } = useTranslation();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(note);
    }
  };

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(note.id);
    }
    setDeleteConfirmOpen(false);
  };

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(note.noteDate)}</span>
          </div>
          
          {!readOnly && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-7 w-7 p-0"
                  aria-label={t('notes.card.editNote')}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  aria-label={t('notes.card.deleteNote')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Note Content */}
        <div className="text-sm text-foreground whitespace-pre-wrap break-words">
          {note.text}
        </div>

        {/* Footer - Updated timestamp if edited */}
        {note.updatedAt && note.createdAt && 
         typeof note.updatedAt === 'string' && 
         typeof note.createdAt === 'string' &&
         note.updatedAt !== note.createdAt && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t('notes.card.edited')} {formatDateTime(note.updatedAt)}
            </span>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('notes.deleteConfirm.title')}
        description={t('notes.deleteConfirm.description')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
}
