import { create } from 'zustand';
import { noteService } from '../services/note.service';
import type { Note, CreateNoteDto, UpdateNoteDto } from '../types/api.types';
import { ApiClientError } from '../api/client';

/**
 * Note Store State
 */
interface NoteState {
  notes: Note[];
  selectedNote: Note | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Note Store Actions
 */
interface NoteActions {
  fetchNotesByPatient: (patientId: string) => Promise<void>;
  fetchNotesBySession: (sessionId: string) => Promise<void>;
  createNote: (data: CreateNoteDto) => Promise<Note>;
  updateNote: (id: string, data: UpdateNoteDto) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  setSelectedNote: (note: Note | null) => void;
  clearError: () => void;
  clearNotes: () => void;
}

/**
 * Note Store Type
 */
type NoteStore = NoteState & NoteActions;

/**
 * Initial State
 */
const initialState: NoteState = {
  notes: [],
  selectedNote: null,
  isLoading: false,
  error: null,
};

/**
 * Note Store
 * Manages patient notes state
 */
export const useNoteStore = create<NoteStore>((set) => ({
  ...initialState,

  /**
   * Fetch notes for a specific patient
   * 
   * Note: Uses GET /notes and filters client-side due to backend ParseIntPipe issue
   * Silently handles errors to prevent UI breakage
   */
  fetchNotesByPatient: async (patientId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const notes = await noteService.getByPatientId(patientId);
      set({ notes, isLoading: false });
    } catch (error) {
      // Log error but don't throw - gracefully degrade to empty notes list
      console.warn('Failed to fetch notes for patient:', patientId, error);
      
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al cargar notas';
      
      set({ notes: [], isLoading: false, error: errorMessage });
      // Don't throw - allow UI to continue functioning
    }
  },

  /**
   * Fetch notes for a specific session
   */
  fetchNotesBySession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const notes = await noteService.getBySessionId(sessionId);
      set({ notes, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al cargar notas de sesión';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Create a new note
   */
  createNote: async (data: CreateNoteDto) => {
    set({ isLoading: true, error: null });
    
    try {
      const newNote = await noteService.create(data);
      set((state) => ({
        notes: [newNote, ...state.notes],
        isLoading: false,
      }));
      return newNote;
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al crear nota';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Update an existing note
   */
  updateNote: async (id: string, data: UpdateNoteDto) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedNote = await noteService.update(id, data);
      set((state) => ({
        notes: state.notes.map(note => 
          note.id === id ? updatedNote : note
        ),
        isLoading: false,
      }));
      return updatedNote;
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al actualizar nota';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Delete a note
   */
  deleteNote: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await noteService.delete(id);
      set((state) => ({
        notes: state.notes.filter(note => note.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al eliminar nota';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Set selected note for editing
   */
  setSelectedNote: (note: Note | null) => {
    set({ selectedNote: note });
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Clear notes (e.g., when changing patient)
   */
  clearNotes: () => {
    set({ notes: [], selectedNote: null });
  },
}));
