import { apiClient } from '../api/client';
import type {
  Note,
  CreateNoteDto,
  UpdateNoteDto,
  NoteType,
} from '../types/api.types';

/**
 * Note Service
 * Maneja todas las operaciones CRUD de notas
 */
export class NoteService {
  private readonly basePath = '/notes';

  /**
   * Get all notes (without filters)
   */
  async getAll(): Promise<Note[]> {
    return apiClient.get<Note[]>(this.basePath);
  }

  /**
   * Get notes by patient ID
   * Fetches all notes and filters client-side by patient.id
   * (Backend ParseIntPipe bug prevents using query param with UUID)
   */
  async getByPatientId(patientId: string): Promise<Note[]> {
    const allNotes = await apiClient.get<Note[]>(this.basePath);
    return allNotes.filter(note => note.patient?.id === patientId);
  }

  /**
   * Get notes by session ID
   */
  async getBySessionId(sessionId: string): Promise<Note[]> {
    return apiClient.get<Note[]>(`${this.basePath}/session/${sessionId}`);
  }

  /**
   * Get notes by type
   */
  async getByType(noteType: NoteType): Promise<Note[]> {
    return apiClient.get<Note[]>(`${this.basePath}?noteType=${noteType}`);
  }

  /**
   * Get a single note by ID
   */
  async getById(id: string): Promise<Note> {
    return apiClient.get<Note>(`${this.basePath}/${id}`);
  }

  /**
   * Create a new note
   */
  async create(data: CreateNoteDto): Promise<Note> {
    return apiClient.post<Note, CreateNoteDto>(this.basePath, data);
  }

  /**
   * Update an existing note
   */
  async update(id: string, data: UpdateNoteDto): Promise<Note> {
    return apiClient.patch<Note, UpdateNoteDto>(
      `${this.basePath}/${id}`,
      data
    );
  }

  /**
   * Delete a note
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

// Export singleton instance
export const noteService = new NoteService();

// Export default
export default noteService;
