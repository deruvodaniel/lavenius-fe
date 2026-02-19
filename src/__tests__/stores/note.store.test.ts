import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useNoteStore } from '../../lib/stores/note.store';
import { noteService } from '../../lib/services/note.service';
import { ApiClientError } from '../../lib/api/client';
import type { Note, CreateNoteDto, UpdateNoteDto } from '../../lib/types/api.types';

// Mock the note service
vi.mock('../../lib/services/note.service', () => ({
  noteService: {
    getByPatientId: vi.fn(),
    getBySessionId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useNoteStore', () => {
  // Mock note data
  const mockNotes: Note[] = [
    {
      id: 'note-1',
      patientId: 'patient-1',
      text: 'Primera sesión con el paciente. Se observa ansiedad leve.',
      noteDate: '2024-01-15',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'note-2',
      patientId: 'patient-1',
      text: 'Seguimiento. Mejora notable en manejo del estrés.',
      noteDate: '2024-01-22',
      createdAt: '2024-01-22T10:00:00Z',
      updatedAt: '2024-01-22T10:00:00Z',
    },
    {
      id: 'note-3',
      patientId: 'patient-2',
      text: 'Nota de otro paciente para testing.',
      noteDate: '2024-01-20',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    },
  ];

  const initialState = {
    notes: [],
    selectedNote: null,
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    // Reset store to initial state before each test
    useNoteStore.setState(initialState);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Initial State Tests ====================
  describe('Initial State', () => {
    it('should have empty notes array by default', () => {
      const { notes } = useNoteStore.getState();
      expect(notes).toEqual([]);
    });

    it('should have null selectedNote by default', () => {
      const { selectedNote } = useNoteStore.getState();
      expect(selectedNote).toBeNull();
    });

    it('should have isLoading false by default', () => {
      const { isLoading } = useNoteStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should have null error by default', () => {
      const { error } = useNoteStore.getState();
      expect(error).toBeNull();
    });
  });

  // ==================== fetchNotesByPatient Tests ====================
  describe('fetchNotesByPatient', () => {
    const patientId = 'patient-1';
    const patientNotes = mockNotes.filter((n) => n.patientId === patientId);

    it('should call noteService.getByPatientId with correct patientId', async () => {
      vi.mocked(noteService.getByPatientId).mockResolvedValue(patientNotes);

      await act(async () => {
        await useNoteStore.getState().fetchNotesByPatient(patientId);
      });

      expect(noteService.getByPatientId).toHaveBeenCalledTimes(1);
      expect(noteService.getByPatientId).toHaveBeenCalledWith(patientId);
    });

    it('should set isLoading to true during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(noteService.getByPatientId).mockImplementation(async () => {
        loadingDuringRequest = useNoteStore.getState().isLoading;
        return patientNotes;
      });

      await act(async () => {
        await useNoteStore.getState().fetchNotesByPatient(patientId);
      });

      expect(loadingDuringRequest).toBe(true);
    });

    it('should set isLoading to false after successful request', async () => {
      vi.mocked(noteService.getByPatientId).mockResolvedValue(patientNotes);

      await act(async () => {
        await useNoteStore.getState().fetchNotesByPatient(patientId);
      });

      expect(useNoteStore.getState().isLoading).toBe(false);
    });

    it('should populate notes array on success', async () => {
      vi.mocked(noteService.getByPatientId).mockResolvedValue(patientNotes);

      await act(async () => {
        await useNoteStore.getState().fetchNotesByPatient(patientId);
      });

      expect(useNoteStore.getState().notes).toEqual(patientNotes);
      expect(useNoteStore.getState().notes).toHaveLength(2);
    });

    it('should clear error on successful request', async () => {
      // First set an error
      useNoteStore.setState({ error: 'Previous error' });
      vi.mocked(noteService.getByPatientId).mockResolvedValue(patientNotes);

      await act(async () => {
        await useNoteStore.getState().fetchNotesByPatient(patientId);
      });

      expect(useNoteStore.getState().error).toBeNull();
    });

    it('should set error on failure with ApiClientError', async () => {
      const apiError = new ApiClientError(500, 'ServerError', 'Error del servidor');
      vi.mocked(noteService.getByPatientId).mockRejectedValue(apiError);

      await act(async () => {
        // This action gracefully handles errors without throwing
        await useNoteStore.getState().fetchNotesByPatient(patientId);
      });

      expect(useNoteStore.getState().error).toBe('Error del servidor');
      expect(useNoteStore.getState().isLoading).toBe(false);
    });

    it('should set default error message for non-API errors', async () => {
      vi.mocked(noteService.getByPatientId).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useNoteStore.getState().fetchNotesByPatient(patientId);
      });

      expect(useNoteStore.getState().error).toBe('Error al cargar notas');
    });

    it('should set notes to empty array on failure (graceful degradation)', async () => {
      useNoteStore.setState({ notes: mockNotes });
      vi.mocked(noteService.getByPatientId).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useNoteStore.getState().fetchNotesByPatient(patientId);
      });

      expect(useNoteStore.getState().notes).toEqual([]);
    });

    it('should not throw error on failure (graceful handling)', async () => {
      vi.mocked(noteService.getByPatientId).mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(
        act(async () => {
          await useNoteStore.getState().fetchNotesByPatient(patientId);
        })
      ).resolves.not.toThrow();
    });
  });

  // ==================== fetchNotesBySession Tests ====================
  describe('fetchNotesBySession', () => {
    const sessionId = 'session-1';
    const sessionNotes = [mockNotes[0]];

    it('should call noteService.getBySessionId with correct sessionId', async () => {
      vi.mocked(noteService.getBySessionId).mockResolvedValue(sessionNotes);

      await act(async () => {
        await useNoteStore.getState().fetchNotesBySession(sessionId);
      });

      expect(noteService.getBySessionId).toHaveBeenCalledTimes(1);
      expect(noteService.getBySessionId).toHaveBeenCalledWith(sessionId);
    });

    it('should set isLoading to true during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(noteService.getBySessionId).mockImplementation(async () => {
        loadingDuringRequest = useNoteStore.getState().isLoading;
        return sessionNotes;
      });

      await act(async () => {
        await useNoteStore.getState().fetchNotesBySession(sessionId);
      });

      expect(loadingDuringRequest).toBe(true);
    });

    it('should set isLoading to false after successful request', async () => {
      vi.mocked(noteService.getBySessionId).mockResolvedValue(sessionNotes);

      await act(async () => {
        await useNoteStore.getState().fetchNotesBySession(sessionId);
      });

      expect(useNoteStore.getState().isLoading).toBe(false);
    });

    it('should populate notes array on success', async () => {
      vi.mocked(noteService.getBySessionId).mockResolvedValue(sessionNotes);

      await act(async () => {
        await useNoteStore.getState().fetchNotesBySession(sessionId);
      });

      expect(useNoteStore.getState().notes).toEqual(sessionNotes);
    });

    it('should clear error on successful request', async () => {
      useNoteStore.setState({ error: 'Previous error' });
      vi.mocked(noteService.getBySessionId).mockResolvedValue(sessionNotes);

      await act(async () => {
        await useNoteStore.getState().fetchNotesBySession(sessionId);
      });

      expect(useNoteStore.getState().error).toBeNull();
    });

    it('should set error on failure with ApiClientError', async () => {
      const apiError = new ApiClientError(404, 'NotFound', 'Sesión no encontrada');
      vi.mocked(noteService.getBySessionId).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useNoteStore.getState().fetchNotesBySession(sessionId);
        } catch {
          // Expected to throw
        }
      });

      expect(useNoteStore.getState().error).toBe('Sesión no encontrada');
      expect(useNoteStore.getState().isLoading).toBe(false);
    });

    it('should set default error message for non-API errors', async () => {
      vi.mocked(noteService.getBySessionId).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        try {
          await useNoteStore.getState().fetchNotesBySession(sessionId);
        } catch {
          // Expected to throw
        }
      });

      expect(useNoteStore.getState().error).toBe('Error al cargar notas de sesión');
    });

    it('should throw error on failure', async () => {
      vi.mocked(noteService.getBySessionId).mockRejectedValue(new Error('Network error'));

      await expect(
        useNoteStore.getState().fetchNotesBySession(sessionId)
      ).rejects.toThrow('Network error');
    });
  });

  // ==================== createNote Tests ====================
  describe('createNote', () => {
    const newNoteData: CreateNoteDto = {
      patientId: 'patient-1',
      text: 'Nueva nota de sesión con observaciones importantes.',
      noteDate: '2024-01-29',
    };

    const createdNote: Note = {
      id: 'note-4',
      patientId: 'patient-1',
      text: 'Nueva nota de sesión con observaciones importantes.',
      noteDate: '2024-01-29',
      createdAt: '2024-01-29T10:00:00Z',
      updatedAt: '2024-01-29T10:00:00Z',
    };

    it('should call noteService.create with correct data', async () => {
      vi.mocked(noteService.create).mockResolvedValue(createdNote);

      await act(async () => {
        await useNoteStore.getState().createNote(newNoteData);
      });

      expect(noteService.create).toHaveBeenCalledWith(newNoteData);
    });

    it('should prepend new note to notes list', async () => {
      useNoteStore.setState({ notes: mockNotes.slice(0, 2) });
      vi.mocked(noteService.create).mockResolvedValue(createdNote);

      await act(async () => {
        await useNoteStore.getState().createNote(newNoteData);
      });

      const { notes } = useNoteStore.getState();
      expect(notes).toHaveLength(3);
      expect(notes[0]).toEqual(createdNote); // New note should be first
    });

    it('should return created note', async () => {
      vi.mocked(noteService.create).mockResolvedValue(createdNote);

      let result: Note | undefined;
      await act(async () => {
        result = await useNoteStore.getState().createNote(newNoteData);
      });

      expect(result).toEqual(createdNote);
    });

    it('should set isLoading to true during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(noteService.create).mockImplementation(async () => {
        loadingDuringRequest = useNoteStore.getState().isLoading;
        return createdNote;
      });

      await act(async () => {
        await useNoteStore.getState().createNote(newNoteData);
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useNoteStore.getState().isLoading).toBe(false);
    });

    it('should clear error before request', async () => {
      useNoteStore.setState({ error: 'Previous error' });
      vi.mocked(noteService.create).mockResolvedValue(createdNote);

      await act(async () => {
        await useNoteStore.getState().createNote(newNoteData);
      });

      expect(useNoteStore.getState().error).toBeNull();
    });

    it('should set error on failure with ApiClientError', async () => {
      const apiError = new ApiClientError(400, 'BadRequest', 'Datos inválidos');
      vi.mocked(noteService.create).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useNoteStore.getState().createNote(newNoteData);
        } catch {
          // Expected
        }
      });

      expect(useNoteStore.getState().error).toBe('Datos inválidos');
    });

    it('should set default error message for non-API errors', async () => {
      vi.mocked(noteService.create).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        try {
          await useNoteStore.getState().createNote(newNoteData);
        } catch {
          // Expected
        }
      });

      expect(useNoteStore.getState().error).toBe('Error al crear nota');
    });

    it('should throw error on failure', async () => {
      vi.mocked(noteService.create).mockRejectedValue(new Error('Create failed'));

      await expect(
        useNoteStore.getState().createNote(newNoteData)
      ).rejects.toThrow('Create failed');
    });

    it('should set isLoading to false on failure', async () => {
      vi.mocked(noteService.create).mockRejectedValue(new Error('Create failed'));

      await act(async () => {
        try {
          await useNoteStore.getState().createNote(newNoteData);
        } catch {
          // Expected
        }
      });

      expect(useNoteStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== updateNote Tests ====================
  describe('updateNote', () => {
    const updateData: UpdateNoteDto = {
      text: 'Texto actualizado con nuevas observaciones.',
    };

    const updatedNote: Note = {
      ...mockNotes[0],
      text: 'Texto actualizado con nuevas observaciones.',
      updatedAt: '2024-01-30T10:00:00Z',
    };

    it('should call noteService.update with correct id and data', async () => {
      vi.mocked(noteService.update).mockResolvedValue(updatedNote);

      await act(async () => {
        await useNoteStore.getState().updateNote('note-1', updateData);
      });

      expect(noteService.update).toHaveBeenCalledWith('note-1', updateData);
    });

    it('should update note in notes list', async () => {
      useNoteStore.setState({ notes: mockNotes });
      vi.mocked(noteService.update).mockResolvedValue(updatedNote);

      await act(async () => {
        await useNoteStore.getState().updateNote('note-1', updateData);
      });

      const { notes } = useNoteStore.getState();
      const note = notes.find((n) => n.id === 'note-1');
      expect(note?.text).toBe('Texto actualizado con nuevas observaciones.');
    });

    it('should not modify other notes in the list', async () => {
      useNoteStore.setState({ notes: mockNotes });
      vi.mocked(noteService.update).mockResolvedValue(updatedNote);

      await act(async () => {
        await useNoteStore.getState().updateNote('note-1', updateData);
      });

      const { notes } = useNoteStore.getState();
      const otherNote = notes.find((n) => n.id === 'note-2');
      expect(otherNote).toEqual(mockNotes[1]);
    });

    it('should return updated note', async () => {
      vi.mocked(noteService.update).mockResolvedValue(updatedNote);

      let result: Note | undefined;
      await act(async () => {
        result = await useNoteStore.getState().updateNote('note-1', updateData);
      });

      expect(result).toEqual(updatedNote);
    });

    it('should set isLoading to true during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(noteService.update).mockImplementation(async () => {
        loadingDuringRequest = useNoteStore.getState().isLoading;
        return updatedNote;
      });

      await act(async () => {
        await useNoteStore.getState().updateNote('note-1', updateData);
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useNoteStore.getState().isLoading).toBe(false);
    });

    it('should clear error before request', async () => {
      useNoteStore.setState({ error: 'Previous error' });
      vi.mocked(noteService.update).mockResolvedValue(updatedNote);

      await act(async () => {
        await useNoteStore.getState().updateNote('note-1', updateData);
      });

      expect(useNoteStore.getState().error).toBeNull();
    });

    it('should set error on failure with ApiClientError', async () => {
      const apiError = new ApiClientError(404, 'NotFound', 'Nota no encontrada');
      vi.mocked(noteService.update).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useNoteStore.getState().updateNote('note-999', updateData);
        } catch {
          // Expected
        }
      });

      expect(useNoteStore.getState().error).toBe('Nota no encontrada');
    });

    it('should set default error message for non-API errors', async () => {
      vi.mocked(noteService.update).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        try {
          await useNoteStore.getState().updateNote('note-1', updateData);
        } catch {
          // Expected
        }
      });

      expect(useNoteStore.getState().error).toBe('Error al actualizar nota');
    });

    it('should throw error on failure', async () => {
      vi.mocked(noteService.update).mockRejectedValue(new Error('Update failed'));

      await expect(
        useNoteStore.getState().updateNote('note-1', updateData)
      ).rejects.toThrow('Update failed');
    });

    it('should update noteDate when provided', async () => {
      const updateWithDate: UpdateNoteDto = {
        noteDate: '2024-02-01',
      };
      const updatedNoteWithDate: Note = {
        ...mockNotes[0],
        noteDate: '2024-02-01',
        updatedAt: '2024-01-30T10:00:00Z',
      };

      useNoteStore.setState({ notes: mockNotes });
      vi.mocked(noteService.update).mockResolvedValue(updatedNoteWithDate);

      await act(async () => {
        await useNoteStore.getState().updateNote('note-1', updateWithDate);
      });

      const { notes } = useNoteStore.getState();
      const note = notes.find((n) => n.id === 'note-1');
      expect(note?.noteDate).toBe('2024-02-01');
    });
  });

  // ==================== deleteNote Tests ====================
  describe('deleteNote', () => {
    it('should call noteService.delete with correct id', async () => {
      useNoteStore.setState({ notes: mockNotes });
      vi.mocked(noteService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useNoteStore.getState().deleteNote('note-1');
      });

      expect(noteService.delete).toHaveBeenCalledWith('note-1');
    });

    it('should remove note from notes list', async () => {
      useNoteStore.setState({ notes: mockNotes });
      vi.mocked(noteService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useNoteStore.getState().deleteNote('note-1');
      });

      const { notes } = useNoteStore.getState();
      expect(notes.find((n) => n.id === 'note-1')).toBeUndefined();
      expect(notes).toHaveLength(2);
    });

    it('should not modify other notes when deleting', async () => {
      useNoteStore.setState({ notes: mockNotes });
      vi.mocked(noteService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useNoteStore.getState().deleteNote('note-1');
      });

      const { notes } = useNoteStore.getState();
      expect(notes.find((n) => n.id === 'note-2')).toEqual(mockNotes[1]);
      expect(notes.find((n) => n.id === 'note-3')).toEqual(mockNotes[2]);
    });

    it('should set isLoading to true during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(noteService.delete).mockImplementation(async () => {
        loadingDuringRequest = useNoteStore.getState().isLoading;
      });

      await act(async () => {
        await useNoteStore.getState().deleteNote('note-1');
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useNoteStore.getState().isLoading).toBe(false);
    });

    it('should clear error before request', async () => {
      useNoteStore.setState({ error: 'Previous error' });
      vi.mocked(noteService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useNoteStore.getState().deleteNote('note-1');
      });

      expect(useNoteStore.getState().error).toBeNull();
    });

    it('should set error on failure with ApiClientError', async () => {
      const apiError = new ApiClientError(404, 'NotFound', 'Nota no encontrada');
      vi.mocked(noteService.delete).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useNoteStore.getState().deleteNote('note-999');
        } catch {
          // Expected
        }
      });

      expect(useNoteStore.getState().error).toBe('Nota no encontrada');
    });

    it('should set default error message for non-API errors', async () => {
      vi.mocked(noteService.delete).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        try {
          await useNoteStore.getState().deleteNote('note-1');
        } catch {
          // Expected
        }
      });

      expect(useNoteStore.getState().error).toBe('Error al eliminar nota');
    });

    it('should throw error on failure', async () => {
      vi.mocked(noteService.delete).mockRejectedValue(new Error('Delete failed'));

      await expect(
        useNoteStore.getState().deleteNote('note-1')
      ).rejects.toThrow('Delete failed');
    });

    it('should set isLoading to false on failure', async () => {
      vi.mocked(noteService.delete).mockRejectedValue(new Error('Delete failed'));

      await act(async () => {
        try {
          await useNoteStore.getState().deleteNote('note-1');
        } catch {
          // Expected
        }
      });

      expect(useNoteStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== setSelectedNote Tests ====================
  describe('setSelectedNote', () => {
    it('should set selectedNote to provided note', () => {
      useNoteStore.getState().setSelectedNote(mockNotes[0]);

      expect(useNoteStore.getState().selectedNote).toEqual(mockNotes[0]);
    });

    it('should set selectedNote to null when clearing', () => {
      useNoteStore.setState({ selectedNote: mockNotes[0] });

      useNoteStore.getState().setSelectedNote(null);

      expect(useNoteStore.getState().selectedNote).toBeNull();
    });

    it('should update selectedNote when changing selection', () => {
      useNoteStore.setState({ selectedNote: mockNotes[0] });

      useNoteStore.getState().setSelectedNote(mockNotes[1]);

      expect(useNoteStore.getState().selectedNote).toEqual(mockNotes[1]);
    });

    it('should not affect other state when setting selectedNote', () => {
      useNoteStore.setState({
        notes: mockNotes,
        isLoading: false,
        error: null,
      });

      useNoteStore.getState().setSelectedNote(mockNotes[0]);

      expect(useNoteStore.getState().notes).toEqual(mockNotes);
      expect(useNoteStore.getState().isLoading).toBe(false);
      expect(useNoteStore.getState().error).toBeNull();
    });
  });

  // ==================== clearError Tests ====================
  describe('clearError', () => {
    it('should clear error when set', () => {
      useNoteStore.setState({ error: 'Some error' });

      useNoteStore.getState().clearError();

      expect(useNoteStore.getState().error).toBeNull();
    });

    it('should have no effect when error is already null', () => {
      useNoteStore.setState({ error: null });

      useNoteStore.getState().clearError();

      expect(useNoteStore.getState().error).toBeNull();
    });

    it('should not affect other state when clearing error', () => {
      useNoteStore.setState({
        notes: mockNotes,
        selectedNote: mockNotes[0],
        isLoading: false,
        error: 'Test error',
      });

      useNoteStore.getState().clearError();

      expect(useNoteStore.getState().notes).toEqual(mockNotes);
      expect(useNoteStore.getState().selectedNote).toEqual(mockNotes[0]);
      expect(useNoteStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== clearNotes Tests ====================
  describe('clearNotes', () => {
    it('should clear notes array', () => {
      useNoteStore.setState({ notes: mockNotes });

      useNoteStore.getState().clearNotes();

      expect(useNoteStore.getState().notes).toEqual([]);
    });

    it('should clear selectedNote', () => {
      useNoteStore.setState({
        notes: mockNotes,
        selectedNote: mockNotes[0],
      });

      useNoteStore.getState().clearNotes();

      expect(useNoteStore.getState().selectedNote).toBeNull();
    });

    it('should not affect error and isLoading state', () => {
      useNoteStore.setState({
        notes: mockNotes,
        selectedNote: mockNotes[0],
        error: 'Test error',
        isLoading: true,
      });

      useNoteStore.getState().clearNotes();

      expect(useNoteStore.getState().error).toBe('Test error');
      expect(useNoteStore.getState().isLoading).toBe(true);
    });

    it('should have no effect when notes is already empty', () => {
      useNoteStore.setState({ notes: [], selectedNote: null });

      useNoteStore.getState().clearNotes();

      expect(useNoteStore.getState().notes).toEqual([]);
      expect(useNoteStore.getState().selectedNote).toBeNull();
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('should handle empty notes list gracefully', async () => {
      vi.mocked(noteService.getByPatientId).mockResolvedValue([]);

      await act(async () => {
        await useNoteStore.getState().fetchNotesByPatient('patient-1');
      });

      expect(useNoteStore.getState().notes).toEqual([]);
    });

    it('should handle concurrent fetch requests', async () => {
      vi.mocked(noteService.getByPatientId)
        .mockResolvedValueOnce(mockNotes.slice(0, 2))
        .mockResolvedValueOnce([mockNotes[0]]);

      await act(async () => {
        await Promise.all([
          useNoteStore.getState().fetchNotesByPatient('patient-1'),
          useNoteStore.getState().fetchNotesByPatient('patient-1'),
        ]);
      });

      // Both requests should complete
      expect(noteService.getByPatientId).toHaveBeenCalledTimes(2);
    });

    it('should handle update of non-existent note in list', async () => {
      useNoteStore.setState({ notes: mockNotes });

      const nonExistentNote: Note = {
        id: 'note-999',
        patientId: 'patient-1',
        text: 'Non-existent note',
        noteDate: '2024-01-01',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      };

      vi.mocked(noteService.update).mockResolvedValue(nonExistentNote);

      await act(async () => {
        await useNoteStore.getState().updateNote('note-999', { text: 'Updated' });
      });

      // Should not add new note, list remains unchanged
      expect(useNoteStore.getState().notes).toHaveLength(3);
    });

    it('should handle delete of non-existent note gracefully', async () => {
      useNoteStore.setState({ notes: mockNotes });
      vi.mocked(noteService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useNoteStore.getState().deleteNote('note-999');
      });

      // Notes list should remain unchanged
      expect(useNoteStore.getState().notes).toHaveLength(3);
    });

    it('should handle notes with patient object attached', async () => {
      const notesWithPatient: Note[] = [
        {
          ...mockNotes[0],
          patient: {
            id: 'patient-1',
            firstName: 'Juan',
            lastName: 'Pérez',
            active: true,
          },
        },
      ];

      vi.mocked(noteService.getByPatientId).mockResolvedValue(notesWithPatient);

      await act(async () => {
        await useNoteStore.getState().fetchNotesByPatient('patient-1');
      });

      const { notes } = useNoteStore.getState();
      expect(notes[0].patient?.firstName).toBe('Juan');
    });

    it('should preserve note order when creating new note', async () => {
      const existingNotes = mockNotes.slice(0, 2);
      useNoteStore.setState({ notes: existingNotes });

      const newNote: Note = {
        id: 'note-new',
        patientId: 'patient-1',
        text: 'Newest note',
        noteDate: '2024-02-01',
        createdAt: '2024-02-01T10:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z',
      };

      vi.mocked(noteService.create).mockResolvedValue(newNote);

      await act(async () => {
        await useNoteStore.getState().createNote({
          patientId: 'patient-1',
          text: 'Newest note',
          noteDate: '2024-02-01',
        });
      });

      const { notes } = useNoteStore.getState();
      expect(notes[0].id).toBe('note-new'); // New note should be first
      expect(notes[1].id).toBe('note-1');
      expect(notes[2].id).toBe('note-2');
    });
  });

  // ==================== Integration-like Tests ====================
  describe('State Transitions', () => {
    it('should transition through loading states correctly on fetch', async () => {
      const states: boolean[] = [];

      vi.mocked(noteService.getByPatientId).mockImplementation(async () => {
        states.push(useNoteStore.getState().isLoading);
        return mockNotes;
      });

      states.push(useNoteStore.getState().isLoading); // Before

      await act(async () => {
        await useNoteStore.getState().fetchNotesByPatient('patient-1');
      });

      states.push(useNoteStore.getState().isLoading); // After

      expect(states).toEqual([false, true, false]); // Before, During, After
    });

    it('should handle create-then-fetch workflow', async () => {
      const newNote: Note = {
        id: 'note-new',
        patientId: 'patient-1',
        text: 'New note',
        noteDate: '2024-02-01',
        createdAt: '2024-02-01T10:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z',
      };

      vi.mocked(noteService.create).mockResolvedValue(newNote);
      vi.mocked(noteService.getByPatientId).mockResolvedValue([newNote]);

      // Create note
      await act(async () => {
        await useNoteStore.getState().createNote({
          patientId: 'patient-1',
          text: 'New note',
          noteDate: '2024-02-01',
        });
      });

      expect(useNoteStore.getState().notes).toHaveLength(1);

      // Fetch notes (simulating refresh)
      await act(async () => {
        await useNoteStore.getState().fetchNotesByPatient('patient-1');
      });

      expect(useNoteStore.getState().notes).toHaveLength(1);
      expect(useNoteStore.getState().notes[0]).toEqual(newNote);
    });

    it('should handle update-then-select workflow', async () => {
      useNoteStore.setState({ notes: mockNotes, selectedNote: mockNotes[0] });

      const updatedNote: Note = {
        ...mockNotes[0],
        text: 'Updated text',
        updatedAt: '2024-02-01T10:00:00Z',
      };

      vi.mocked(noteService.update).mockResolvedValue(updatedNote);

      // Update note
      await act(async () => {
        await useNoteStore.getState().updateNote('note-1', { text: 'Updated text' });
      });

      // Select the updated note
      const noteInState = useNoteStore.getState().notes.find((n) => n.id === 'note-1');
      useNoteStore.getState().setSelectedNote(noteInState ?? null);

      expect(useNoteStore.getState().selectedNote?.text).toBe('Updated text');
    });
  });
});
