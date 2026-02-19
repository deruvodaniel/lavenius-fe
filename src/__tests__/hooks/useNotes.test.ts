import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNotes } from '../../lib/hooks/useNotes';
import { useNoteStore } from '../../lib/stores/note.store';
import type { Note, CreateNoteDto, UpdateNoteDto } from '../../lib/types/api.types';

// Mock the note store
vi.mock('../../lib/stores/note.store', () => ({
  useNoteStore: vi.fn(),
}));

describe('useNotes', () => {
  // Mock note data
  const mockNotes: Note[] = [
    {
      id: '1',
      text: 'First session note - patient showed improvement',
      noteDate: '2024-01-15',
      patientId: 'patient-1',
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z',
    },
    {
      id: '2',
      text: 'Second session note - discussed anxiety management',
      noteDate: '2024-01-22',
      patientId: 'patient-1',
      createdAt: '2024-01-22T10:00:00.000Z',
      updatedAt: '2024-01-22T10:00:00.000Z',
    },
    {
      id: '3',
      text: 'Initial assessment note',
      noteDate: '2024-01-10',
      patientId: 'patient-2',
      createdAt: '2024-01-10T09:00:00.000Z',
      updatedAt: '2024-01-10T09:00:00.000Z',
    },
  ];

  const mockSelectedNote: Note = mockNotes[0];

  // Mock store functions
  const mockFetchNotesByPatient = vi.fn();
  const mockFetchNotesBySession = vi.fn();
  const mockCreateNote = vi.fn();
  const mockUpdateNote = vi.fn();
  const mockDeleteNote = vi.fn();
  const mockSetSelectedNote = vi.fn();
  const mockClearError = vi.fn();
  const mockClearNotes = vi.fn();

  // Default mock store state
  const defaultMockState = {
    notes: mockNotes,
    selectedNote: null as Note | null,
    isLoading: false,
    error: null as string | null,
    fetchNotesByPatient: mockFetchNotesByPatient,
    fetchNotesBySession: mockFetchNotesBySession,
    createNote: mockCreateNote,
    updateNote: mockUpdateNote,
    deleteNote: mockDeleteNote,
    setSelectedNote: mockSetSelectedNote,
    clearError: mockClearError,
    clearNotes: mockClearNotes,
  };

  // Helper to setup store mock with selector support
  const setupStoreMock = (overrides: Partial<typeof defaultMockState> = {}) => {
    const state = { ...defaultMockState, ...overrides };

    vi.mocked(useNoteStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof state) => unknown)(state);
      }
      return state;
    });

    return state;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupStoreMock();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Hook Return Values Tests ====================
  describe('Hook Return Values', () => {
    it('returns notes array from store', () => {
      const { result } = renderHook(() => useNotes());

      expect(result.current.notes).toEqual(mockNotes);
      expect(result.current.notes).toHaveLength(3);
    });

    it('returns selectedNote null from store', () => {
      setupStoreMock({ selectedNote: null });

      const { result } = renderHook(() => useNotes());

      expect(result.current.selectedNote).toBeNull();
    });

    it('returns selectedNote from store when set', () => {
      setupStoreMock({ selectedNote: mockSelectedNote });

      const { result } = renderHook(() => useNotes());

      expect(result.current.selectedNote).toEqual(mockSelectedNote);
    });

    it('returns isLoading false from store', () => {
      setupStoreMock({ isLoading: false });

      const { result } = renderHook(() => useNotes());

      expect(result.current.isLoading).toBe(false);
    });

    it('returns isLoading true from store', () => {
      setupStoreMock({ isLoading: true });

      const { result } = renderHook(() => useNotes());

      expect(result.current.isLoading).toBe(true);
    });

    it('returns error null from store', () => {
      setupStoreMock({ error: null });

      const { result } = renderHook(() => useNotes());

      expect(result.current.error).toBeNull();
    });

    it('returns error message from store', () => {
      setupStoreMock({ error: 'Error al cargar notas' });

      const { result } = renderHook(() => useNotes());

      expect(result.current.error).toBe('Error al cargar notas');
    });

    it('returns empty notes array when store is empty', () => {
      setupStoreMock({ notes: [] });

      const { result } = renderHook(() => useNotes());

      expect(result.current.notes).toEqual([]);
      expect(result.current.notes).toHaveLength(0);
    });
  });

  // ==================== Fetch Functions Tests ====================
  describe('Fetch Functions', () => {
    describe('fetchNotesByPatient', () => {
      it('fetchNotesByPatient calls store action with patientId', async () => {
        mockFetchNotesByPatient.mockResolvedValue(undefined);
        const { result } = renderHook(() => useNotes());

        await act(async () => {
          await result.current.fetchNotesByPatient('patient-1');
        });

        expect(mockFetchNotesByPatient).toHaveBeenCalledWith('patient-1');
        expect(mockFetchNotesByPatient).toHaveBeenCalledTimes(1);
      });

      it('fetchNotesByPatient with different patientId', async () => {
        mockFetchNotesByPatient.mockResolvedValue(undefined);
        const { result } = renderHook(() => useNotes());

        await act(async () => {
          await result.current.fetchNotesByPatient('uuid-patient-123');
        });

        expect(mockFetchNotesByPatient).toHaveBeenCalledWith('uuid-patient-123');
      });
    });

    describe('fetchNotesBySession', () => {
      it('fetchNotesBySession calls store action with sessionId', async () => {
        mockFetchNotesBySession.mockResolvedValue(undefined);
        const { result } = renderHook(() => useNotes());

        await act(async () => {
          await result.current.fetchNotesBySession('session-1');
        });

        expect(mockFetchNotesBySession).toHaveBeenCalledWith('session-1');
        expect(mockFetchNotesBySession).toHaveBeenCalledTimes(1);
      });

      it('fetchNotesBySession with different sessionId', async () => {
        mockFetchNotesBySession.mockResolvedValue(undefined);
        const { result } = renderHook(() => useNotes());

        await act(async () => {
          await result.current.fetchNotesBySession('uuid-session-456');
        });

        expect(mockFetchNotesBySession).toHaveBeenCalledWith('uuid-session-456');
      });
    });
  });

  // ==================== CRUD Functions Tests ====================
  describe('CRUD Functions', () => {
    describe('createNote', () => {
      const newNoteData: CreateNoteDto = {
        text: 'New therapy session note',
        noteDate: '2024-01-29',
        patientId: 'patient-1',
      };

      const createdNote: Note = {
        id: '4',
        ...newNoteData,
        createdAt: '2024-01-29T10:00:00.000Z',
        updatedAt: '2024-01-29T10:00:00.000Z',
      };

      it('createNote calls store action with data', async () => {
        mockCreateNote.mockResolvedValue(createdNote);
        const { result } = renderHook(() => useNotes());

        await act(async () => {
          await result.current.createNote(newNoteData);
        });

        expect(mockCreateNote).toHaveBeenCalledWith(newNoteData);
        expect(mockCreateNote).toHaveBeenCalledTimes(1);
      });

      it('createNote returns created note from store', async () => {
        mockCreateNote.mockResolvedValue(createdNote);
        const { result } = renderHook(() => useNotes());

        let returnedNote: Note | undefined;
        await act(async () => {
          returnedNote = await result.current.createNote(newNoteData);
        });

        expect(returnedNote).toEqual(createdNote);
      });

      it('createNote propagates error from store', async () => {
        const error = new Error('Error al crear nota');
        mockCreateNote.mockRejectedValue(error);
        const { result } = renderHook(() => useNotes());

        await expect(
          act(async () => {
            await result.current.createNote(newNoteData);
          })
        ).rejects.toThrow('Error al crear nota');
      });
    });

    describe('updateNote', () => {
      const updateData: UpdateNoteDto = {
        text: 'Updated note content',
        noteDate: '2024-01-30',
      };

      const updatedNote: Note = {
        ...mockNotes[0],
        ...updateData,
        updatedAt: '2024-01-30T10:00:00.000Z',
      };

      it('updateNote calls store action with id and data', async () => {
        mockUpdateNote.mockResolvedValue(updatedNote);
        const { result } = renderHook(() => useNotes());

        await act(async () => {
          await result.current.updateNote('1', updateData);
        });

        expect(mockUpdateNote).toHaveBeenCalledWith('1', updateData);
        expect(mockUpdateNote).toHaveBeenCalledTimes(1);
      });

      it('updateNote returns updated note from store', async () => {
        mockUpdateNote.mockResolvedValue(updatedNote);
        const { result } = renderHook(() => useNotes());

        let returnedNote: Note | undefined;
        await act(async () => {
          returnedNote = await result.current.updateNote('1', updateData);
        });

        expect(returnedNote).toEqual(updatedNote);
      });

      it('updateNote propagates error from store', async () => {
        const error = new Error('Nota no encontrada');
        mockUpdateNote.mockRejectedValue(error);
        const { result } = renderHook(() => useNotes());

        await expect(
          act(async () => {
            await result.current.updateNote('999', updateData);
          })
        ).rejects.toThrow('Nota no encontrada');
      });

      it('updateNote with partial data (text only)', async () => {
        const partialUpdate: UpdateNoteDto = { text: 'Only text updated' };
        mockUpdateNote.mockResolvedValue({ ...mockNotes[0], ...partialUpdate });
        const { result } = renderHook(() => useNotes());

        await act(async () => {
          await result.current.updateNote('1', partialUpdate);
        });

        expect(mockUpdateNote).toHaveBeenCalledWith('1', partialUpdate);
      });
    });

    describe('deleteNote', () => {
      it('deleteNote calls store action with id', async () => {
        mockDeleteNote.mockResolvedValue(undefined);
        const { result } = renderHook(() => useNotes());

        await act(async () => {
          await result.current.deleteNote('1');
        });

        expect(mockDeleteNote).toHaveBeenCalledWith('1');
        expect(mockDeleteNote).toHaveBeenCalledTimes(1);
      });

      it('deleteNote propagates error from store', async () => {
        const error = new Error('Error al eliminar nota');
        mockDeleteNote.mockRejectedValue(error);
        const { result } = renderHook(() => useNotes());

        await expect(
          act(async () => {
            await result.current.deleteNote('999');
          })
        ).rejects.toThrow('Error al eliminar nota');
      });
    });
  });

  // ==================== Selection Functions Tests ====================
  describe('Selection Functions', () => {
    it('setSelectedNote sets selected note', () => {
      const { result } = renderHook(() => useNotes());

      act(() => {
        result.current.setSelectedNote(mockNotes[0]);
      });

      expect(mockSetSelectedNote).toHaveBeenCalledWith(mockNotes[0]);
      expect(mockSetSelectedNote).toHaveBeenCalledTimes(1);
    });

    it('setSelectedNote clears selected note with null', () => {
      const { result } = renderHook(() => useNotes());

      act(() => {
        result.current.setSelectedNote(null);
      });

      expect(mockSetSelectedNote).toHaveBeenCalledWith(null);
    });

    it('setSelectedNote can change selection', () => {
      setupStoreMock({ selectedNote: mockNotes[0] });
      const { result } = renderHook(() => useNotes());

      act(() => {
        result.current.setSelectedNote(mockNotes[1]);
      });

      expect(mockSetSelectedNote).toHaveBeenCalledWith(mockNotes[1]);
    });
  });

  // ==================== Clear Functions Tests ====================
  describe('Clear Functions', () => {
    it('clearError calls store action', () => {
      setupStoreMock({ error: 'Some error' });
      const { result } = renderHook(() => useNotes());

      act(() => {
        result.current.clearError();
      });

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });

    it('clearError can be called when error is null', () => {
      setupStoreMock({ error: null });
      const { result } = renderHook(() => useNotes());

      act(() => {
        result.current.clearError();
      });

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });

    it('clearNotes calls store action', () => {
      const { result } = renderHook(() => useNotes());

      act(() => {
        result.current.clearNotes();
      });

      expect(mockClearNotes).toHaveBeenCalledTimes(1);
    });

    it('clearNotes can be called when notes is empty', () => {
      setupStoreMock({ notes: [] });
      const { result } = renderHook(() => useNotes());

      act(() => {
        result.current.clearNotes();
      });

      expect(mockClearNotes).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Hook Interface Tests ====================
  describe('Hook Interface', () => {
    it('returns all expected properties', () => {
      const { result } = renderHook(() => useNotes());

      // State values
      expect(result.current).toHaveProperty('notes');
      expect(result.current).toHaveProperty('selectedNote');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');

      // Functions
      expect(result.current).toHaveProperty('fetchNotesByPatient');
      expect(result.current).toHaveProperty('fetchNotesBySession');
      expect(result.current).toHaveProperty('createNote');
      expect(result.current).toHaveProperty('updateNote');
      expect(result.current).toHaveProperty('deleteNote');
      expect(result.current).toHaveProperty('setSelectedNote');
      expect(result.current).toHaveProperty('clearError');
      expect(result.current).toHaveProperty('clearNotes');
    });

    it('functions are callable', () => {
      const { result } = renderHook(() => useNotes());

      expect(typeof result.current.fetchNotesByPatient).toBe('function');
      expect(typeof result.current.fetchNotesBySession).toBe('function');
      expect(typeof result.current.createNote).toBe('function');
      expect(typeof result.current.updateNote).toBe('function');
      expect(typeof result.current.deleteNote).toBe('function');
      expect(typeof result.current.setSelectedNote).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.clearNotes).toBe('function');
    });
  });

  // ==================== Multiple Calls Tests ====================
  describe('Multiple Calls', () => {
    it('can call fetchNotesByPatient multiple times', async () => {
      mockFetchNotesByPatient.mockResolvedValue(undefined);
      const { result } = renderHook(() => useNotes());

      await act(async () => {
        await result.current.fetchNotesByPatient('patient-1');
        await result.current.fetchNotesByPatient('patient-2');
        await result.current.fetchNotesByPatient('patient-3');
      });

      expect(mockFetchNotesByPatient).toHaveBeenCalledTimes(3);
    });

    it('can perform sequential CRUD operations', async () => {
      const newNote: Note = {
        id: '4',
        text: 'New note',
        noteDate: '2024-01-29',
        patientId: 'patient-1',
        createdAt: '2024-01-29T10:00:00.000Z',
        updatedAt: '2024-01-29T10:00:00.000Z',
      };

      mockCreateNote.mockResolvedValue(newNote);
      mockUpdateNote.mockResolvedValue({ ...newNote, text: 'Updated note' });
      mockDeleteNote.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotes());

      await act(async () => {
        await result.current.createNote({
          text: 'New note',
          noteDate: '2024-01-29',
          patientId: 'patient-1',
        });
        await result.current.updateNote('4', { text: 'Updated note' });
        await result.current.deleteNote('4');
      });

      expect(mockCreateNote).toHaveBeenCalledTimes(1);
      expect(mockUpdateNote).toHaveBeenCalledTimes(1);
      expect(mockDeleteNote).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('handles notes with patient object', () => {
      const noteWithPatient: Note = {
        ...mockNotes[0],
        patient: {
          id: 'patient-1',
          firstName: 'Juan',
          lastName: 'Pérez',
          active: true,
        },
      };

      setupStoreMock({ notes: [noteWithPatient] });
      const { result } = renderHook(() => useNotes());

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].patient?.firstName).toBe('Juan');
    });

    it('handles notes with minimal patient object', () => {
      const noteWithMinimalPatient: Note = {
        ...mockNotes[0],
        patient: {
          id: 'patient-1',
        },
      };

      setupStoreMock({ notes: [noteWithMinimalPatient] });
      const { result } = renderHook(() => useNotes());

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].patient?.firstName).toBeUndefined();
    });

    it('handles long note text', () => {
      const longText = 'A'.repeat(10000);
      const noteWithLongText: Note = {
        ...mockNotes[0],
        text: longText,
      };

      setupStoreMock({ notes: [noteWithLongText] });
      const { result } = renderHook(() => useNotes());

      expect(result.current.notes[0].text).toHaveLength(10000);
    });

    it('handles notes with special characters in text', () => {
      const specialNote: Note = {
        ...mockNotes[0],
        text: 'Nota con caracteres especiales: áéíóú ñ ¿? ¡! @#$%',
      };

      setupStoreMock({ notes: [specialNote] });
      const { result } = renderHook(() => useNotes());

      expect(result.current.notes[0].text).toContain('áéíóú');
    });
  });
});
