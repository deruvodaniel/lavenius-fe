import { useState, useEffect } from 'react';
import { X, FileText, Calendar as CalendarIcon, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { NoteType } from '@/lib/types/api.types';
import type { Note, CreateNoteDto, UpdateNoteDto } from '@/lib/types/api.types';

interface NoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateNoteDto | UpdateNoteDto, noteId?: string) => Promise<void>;
  note?: Note | null;
  patientId: string;
  sessionId?: string;
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
  patientId,
  sessionId
}: NoteDrawerProps) {
  const [formData, setFormData] = useState({
    content: '',
    noteType: NoteType.SESSION,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load note data when editing
  useEffect(() => {
    if (note) {
      setFormData({
        content: note.content || '',
        noteType: note.noteType || NoteType.SESSION,
      });
    } else {
      // Reset form when creating new note
      setFormData({
        content: '',
        noteType: NoteType.SESSION,
      });
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!formData.content.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      if (note) {
        // Update existing note
        const updateData: UpdateNoteDto = {
          content: formData.content,
          noteType: formData.noteType,
        };
        await onSave(updateData, note.id);
      } else {
        // Create new note
        const createData: CreateNoteDto = {
          content: formData.content,
          noteType: formData.noteType,
          patientId,
          sessionId,
        };
        await onSave(createData);
      }

      // Reset form and close
      setFormData({
        content: '',
        noteType: NoteType.SESSION,
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
        content: '',
        noteType: NoteType.SESSION,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
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
                {note ? 'Editar Nota' : 'Nueva Nota'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-indigo-200 hover:text-white transition-colors"
              disabled={isSaving}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Note Type Selector */}
          <div>
            <label className="block text-gray-700 mb-2">
              Tipo de nota
            </label>
            <select
              value={formData.noteType}
              onChange={(e) => setFormData({ ...formData, noteType: e.target.value as NoteType })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSaving}
            >
              <option value="SESSION">Sesión</option>
              <option value="GENERAL">General</option>
              <option value="TREATMENT_PLAN">Plan de tratamiento</option>
              <option value="PROGRESS">Progreso</option>
            </select>
          </div>

          {/* Note Content */}
          <div>
            <label className="block text-gray-700 mb-2">
              Contenido de la nota
            </label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Escribe aquí las observaciones de la sesión..."
              className="min-h-[300px] resize-none"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Esta nota se encriptará automáticamente para proteger la privacidad del paciente
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
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.content.trim()}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700"
          >
            {isSaving ? (
              'Guardando...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {note ? 'Actualizar' : 'Guardar'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
