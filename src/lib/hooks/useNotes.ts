import { useNoteStore } from '../stores/note.store';

/**
 * Custom hook for notes
 * Provides simplified interface to note store for components
 * 
 * @example
 * ```tsx
 * const { notes, isLoading, createNote, fetchNotesByPatient } = useNotes();
 * 
 * useEffect(() => {
 *   if (patientId) {
 *     fetchNotesByPatient(patientId);
 *   }
 * }, [patientId]);
 * ```
 */
export const useNotes = () => {
  const notes = useNoteStore(state => state.notes);
  const selectedNote = useNoteStore(state => state.selectedNote);
  const isLoading = useNoteStore(state => state.isLoading);
  const error = useNoteStore(state => state.error);
  
  const fetchNotesByPatient = useNoteStore(state => state.fetchNotesByPatient);
  const fetchNotesBySession = useNoteStore(state => state.fetchNotesBySession);
  const createNote = useNoteStore(state => state.createNote);
  const updateNote = useNoteStore(state => state.updateNote);
  const deleteNote = useNoteStore(state => state.deleteNote);
  const setSelectedNote = useNoteStore(state => state.setSelectedNote);
  const clearError = useNoteStore(state => state.clearError);
  const clearNotes = useNoteStore(state => state.clearNotes);

  return {
    notes,
    selectedNote,
    isLoading,
    error,
    fetchNotesByPatient,
    fetchNotesBySession,
    createNote,
    updateNote,
    deleteNote,
    setSelectedNote,
    clearError,
    clearNotes,
  };
};
