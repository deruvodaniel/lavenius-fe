import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar as CalendarIcon, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { BaseDrawer, DrawerBody, DrawerFooter } from '../shared/BaseDrawer';
import { formatISODate } from '@/lib/utils/dateFormatters';
import type { Note, CreateNoteDto, UpdateNoteDto } from '@/lib/types/api.types';

interface NoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateNoteDto | UpdateNoteDto, noteId?: string) => Promise<void>;
  note?: Note | null;
  patientId: string;
}

/**
 * NoteDrawer Component
 * Modal drawer for creating/editing notes
 * 
 * Features:
 * - Focus trap for keyboard navigation
 * - ESC key to close
 * - Accessible with proper ARIA attributes
 */
export function NoteDrawer({ 
  isOpen, 
  onClose, 
  onSave, 
  note, 
  patientId
}: NoteDrawerProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    text: '',
    noteDate: new Date().toISOString(),
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load note data when editing
  useEffect(() => {
    if (note) {
      setFormData({
        text: note.text || '',
        noteDate: note.noteDate ? new Date(note.noteDate).toISOString() : new Date().toISOString(),
      });
    } else {
      // Reset form when creating new note
      setFormData({
        text: '',
        noteDate: new Date().toISOString(),
      });
    }
  }, [note, isOpen]);

  const handleSave = async () => {
    if (!formData.text.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      if (note) {
        // Update existing note
        const updateData: UpdateNoteDto = {
          text: formData.text,
          noteDate: formData.noteDate,
        };
        await onSave(updateData, note.id);
      } else {
        // Create new note
        const createData: CreateNoteDto = {
          text: formData.text,
          noteDate: formData.noteDate,
          patientId,
        };
        await onSave(createData);
      }

      // Reset form and close
      setFormData({
        text: '',
        noteDate: new Date().toISOString(),
      });
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setFormData({
        text: '',
        noteDate: new Date().toISOString(),
      });
      onClose();
    }
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title={note ? t('notes.editNote') : t('notes.newNote')}
      icon={FileText}
      maxWidth="md:max-w-2xl"
      closeLabel={t('notes.drawer.closePanel')}
      disableClose={isSaving}
      titleId="note-drawer-title"
      initialFocus="#note-date"
    >
      <DrawerBody>
        {/* Note Date */}
        <div>
          <label htmlFor="note-date" className="block text-gray-700 mb-2">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            {t('notes.drawer.noteDate')}
          </label>
          <input
            id="note-date"
            type="date"
            value={formatISODate(new Date(formData.noteDate))}
            onChange={(e) => {
              // Combine the date from input with current time
              const selectedDate = new Date(e.target.value);
              const now = new Date();
              selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
              setFormData({ ...formData, noteDate: selectedDate.toISOString() });
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isSaving}
          />
        </div>

        {/* Note Content */}
        <div>
          <label htmlFor="note-content" className="block text-gray-700 mb-2">
            {t('notes.drawer.noteContent')}
          </label>
          <Textarea
            id="note-content"
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            placeholder={t('notes.drawer.placeholder')}
            className="min-h-[300px] resize-none"
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {t('notes.drawer.encryptionNote')}
          </p>
        </div>
      </DrawerBody>

      <DrawerFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isSaving}
          className="flex-1 sm:flex-none"
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !formData.text.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-none"
        >
          {isSaving ? (
            t('notes.drawer.saving')
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {note ? t('notes.drawer.update') : t('notes.drawer.save')}
            </>
          )}
        </Button>
      </DrawerFooter>
    </BaseDrawer>
  );
}
