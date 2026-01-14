/**
 * Note Types
 * Types for patient notes system
 */

/**
 * Note entity from API response
 */
export interface Note {
  id: string;
  text: string; // Decrypted text from backend
  noteDate: string; // ISO date string
  patientId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new note
 */
export interface CreateNoteDto {
  text: string;
  noteDate: string; // ISO date string (YYYY-MM-DD)
  patientId: string;
}

/**
 * DTO for updating an existing note
 */
export interface UpdateNoteDto {
  text?: string;
  noteDate?: string;
}

/**
 * Note with patient information for display
 */
export interface NoteWithPatient extends Note {
  patientName: string;
}
