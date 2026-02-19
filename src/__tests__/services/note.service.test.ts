import { describe, it, expect, vi, beforeEach } from 'vitest';
import { noteService, NoteService } from '../../lib/services/note.service';
import { apiClient } from '../../lib/api/client';
import type { Note, CreateNoteDto, UpdateNoteDto, NoteType } from '../../lib/types/api.types';

vi.mock('../../lib/api/client');

describe('NoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockNote: Note = {
    id: 'note-1',
    text: 'Session notes: Patient showed improvement in anxiety management.',
    noteDate: '2024-01-15',
    patientId: 'patient-1',
    patient: {
      id: 'patient-1',
      firstName: 'Maria',
      lastName: 'Garcia',
      active: true,
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  const mockNote2: Note = {
    id: 'note-2',
    text: 'Treatment plan: Continue CBT techniques.',
    noteDate: '2024-01-16',
    patientId: 'patient-1',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  };

  describe('getByPatientId', () => {
    it('should fetch notes for a specific patient', async () => {
      const mockNotes = [mockNote, mockNote2];
      vi.mocked(apiClient.get).mockResolvedValue(mockNotes);

      const result = await noteService.getByPatientId('patient-1');

      expect(apiClient.get).toHaveBeenCalledWith('/notes?patientId=patient-1');
      expect(result).toHaveLength(2);
      expect(result[0].patientId).toBe('patient-1');
    });

    it('should return empty array when patient has no notes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      const result = await noteService.getByPatientId('patient-no-notes');

      expect(apiClient.get).toHaveBeenCalledWith('/notes?patientId=patient-no-notes');
      expect(result).toHaveLength(0);
    });
  });

  describe('getBySessionId', () => {
    it('should fetch notes for a specific session', async () => {
      const sessionNotes = [mockNote];
      vi.mocked(apiClient.get).mockResolvedValue(sessionNotes);

      const result = await noteService.getBySessionId('session-1');

      expect(apiClient.get).toHaveBeenCalledWith('/notes/session/session-1');
      expect(result).toHaveLength(1);
    });

    it('should return empty array when session has no notes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      const result = await noteService.getBySessionId('session-no-notes');

      expect(result).toHaveLength(0);
    });
  });

  describe('getByType', () => {
    it('should fetch notes by type for a patient', async () => {
      const sessionNotes = [mockNote];
      vi.mocked(apiClient.get).mockResolvedValue(sessionNotes);

      const result = await noteService.getByType('patient-1', 'SESSION' as NoteType);

      expect(apiClient.get).toHaveBeenCalledWith('/notes?patientId=patient-1&noteType=SESSION');
      expect(result).toHaveLength(1);
    });

    it('should fetch treatment plan notes', async () => {
      const treatmentNotes = [mockNote2];
      vi.mocked(apiClient.get).mockResolvedValue(treatmentNotes);

      const result = await noteService.getByType('patient-1', 'TREATMENT_PLAN' as NoteType);

      expect(apiClient.get).toHaveBeenCalledWith('/notes?patientId=patient-1&noteType=TREATMENT_PLAN');
      expect(result).toHaveLength(1);
    });

    it('should fetch general notes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      await noteService.getByType('patient-1', 'GENERAL' as NoteType);

      expect(apiClient.get).toHaveBeenCalledWith('/notes?patientId=patient-1&noteType=GENERAL');
    });

    it('should fetch progress notes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      await noteService.getByType('patient-1', 'PROGRESS' as NoteType);

      expect(apiClient.get).toHaveBeenCalledWith('/notes?patientId=patient-1&noteType=PROGRESS');
    });
  });

  describe('getById', () => {
    it('should fetch a single note by ID', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockNote);

      const result = await noteService.getById('note-1');

      expect(apiClient.get).toHaveBeenCalledWith('/notes/note-1');
      expect(result.id).toBe('note-1');
      expect(result.text).toBe('Session notes: Patient showed improvement in anxiety management.');
    });
  });

  describe('create', () => {
    it('should create a new note', async () => {
      const createData: CreateNoteDto = {
        text: 'New session note with patient observations.',
        noteDate: '2024-01-20',
        patientId: 'patient-1',
      };

      const createdNote: Note = {
        ...mockNote,
        id: 'note-new',
        text: createData.text,
        noteDate: createData.noteDate,
      };

      vi.mocked(apiClient.post).mockResolvedValue(createdNote);

      const result = await noteService.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/notes', createData);
      expect(result.id).toBe('note-new');
      expect(result.text).toBe(createData.text);
      expect(result.noteDate).toBe(createData.noteDate);
      expect(result.patientId).toBe(createData.patientId);
    });

    it('should create a note with minimal data', async () => {
      const createData: CreateNoteDto = {
        text: 'Brief note',
        noteDate: '2024-01-21',
        patientId: 'patient-2',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        id: 'note-minimal',
        ...createData,
        createdAt: '2024-01-21T10:00:00Z',
        updatedAt: '2024-01-21T10:00:00Z',
      });

      const result = await noteService.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/notes', createData);
      expect(result.text).toBe('Brief note');
    });

    it('should handle long note text', async () => {
      const longText = 'A'.repeat(5000); // Simulate a long clinical note
      const createData: CreateNoteDto = {
        text: longText,
        noteDate: '2024-01-22',
        patientId: 'patient-1',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        id: 'note-long',
        ...createData,
        createdAt: '2024-01-22T10:00:00Z',
        updatedAt: '2024-01-22T10:00:00Z',
      });

      const result = await noteService.create(createData);

      expect(result.text).toHaveLength(5000);
    });
  });

  describe('update', () => {
    it('should update note text', async () => {
      const updateData: UpdateNoteDto = {
        text: 'Updated session notes with new observations.',
      };

      const updatedNote: Note = {
        ...mockNote,
        text: updateData.text!,
        updatedAt: '2024-01-15T15:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue(updatedNote);

      const result = await noteService.update('note-1', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/notes/note-1', updateData);
      expect(result.text).toBe(updateData.text);
    });

    it('should update note date', async () => {
      const updateData: UpdateNoteDto = {
        noteDate: '2024-01-18',
      };

      const updatedNote: Note = {
        ...mockNote,
        noteDate: updateData.noteDate!,
      };

      vi.mocked(apiClient.patch).mockResolvedValue(updatedNote);

      const result = await noteService.update('note-1', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/notes/note-1', updateData);
      expect(result.noteDate).toBe('2024-01-18');
    });

    it('should update both text and date', async () => {
      const updateData: UpdateNoteDto = {
        text: 'Completely revised note',
        noteDate: '2024-01-19',
      };

      const updatedNote: Note = {
        ...mockNote,
        text: updateData.text!,
        noteDate: updateData.noteDate!,
      };

      vi.mocked(apiClient.patch).mockResolvedValue(updatedNote);

      const result = await noteService.update('note-1', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/notes/note-1', updateData);
      expect(result.text).toBe(updateData.text);
      expect(result.noteDate).toBe(updateData.noteDate);
    });

    it('should handle empty update', async () => {
      const updateData: UpdateNoteDto = {};

      vi.mocked(apiClient.patch).mockResolvedValue(mockNote);

      const result = await noteService.update('note-1', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/notes/note-1', updateData);
      expect(result).toEqual(mockNote);
    });
  });

  describe('delete', () => {
    it('should delete a note', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await noteService.delete('note-1');

      expect(apiClient.delete).toHaveBeenCalledWith('/notes/note-1');
    });

    it('should delete note by ID', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await noteService.delete('note-xyz-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/notes/note-xyz-123');
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(noteService).toBeInstanceOf(NoteService);
    });

    it('should be the same class type for all methods', () => {
      // Verify the service has all expected methods
      expect(typeof noteService.getByPatientId).toBe('function');
      expect(typeof noteService.getBySessionId).toBe('function');
      expect(typeof noteService.getByType).toBe('function');
      expect(typeof noteService.getById).toBe('function');
      expect(typeof noteService.create).toBe('function');
      expect(typeof noteService.update).toBe('function');
      expect(typeof noteService.delete).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should propagate API errors on getByPatientId', async () => {
      const error = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(noteService.getByPatientId('patient-1')).rejects.toThrow('Network error');
    });

    it('should propagate API errors on create', async () => {
      const error = new Error('Validation failed');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const createData: CreateNoteDto = {
        text: 'Test',
        noteDate: '2024-01-20',
        patientId: 'patient-1',
      };

      await expect(noteService.create(createData)).rejects.toThrow('Validation failed');
    });

    it('should propagate API errors on update', async () => {
      const error = new Error('Not found');
      vi.mocked(apiClient.patch).mockRejectedValue(error);

      await expect(noteService.update('invalid-id', { text: 'test' })).rejects.toThrow('Not found');
    });

    it('should propagate API errors on delete', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      await expect(noteService.delete('note-1')).rejects.toThrow('Unauthorized');
    });
  });
});
