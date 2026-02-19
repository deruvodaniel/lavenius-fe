import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileText, Calendar as CalendarIcon, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex !top-0 !mt-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-full md:max-w-2xl bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <h2 className="text-white text-xl">
                {note ? t('notes.editNote') : t('notes.newNote')}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-indigo-200 hover:text-white transition-colors"
              disabled={isSaving}
              aria-label={t('notes.drawer.closePanel')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 md:p-6 space-y-6">
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
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.text.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
        </div>
      </div>
    </div>
  );
}
