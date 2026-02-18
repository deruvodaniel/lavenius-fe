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
   * NOTE: Currently disabled due to backend ParseIntPipe bug
   * The backend expects patientId as number but IDs are UUIDs
   */
  async getAll(): Promise<Note[]> {
    try {
      return await apiClient.get<Note[]>(this.basePath);
    } catch (error) {
      // Backend has a bug with ParseIntPipe - return empty array
      console.warn('GET /notes failed (known backend issue), returning empty array');
      return [];
    }
  }

  /**
   * Get notes by patient ID
   * NOTE: Backend has ParseIntPipe bug that prevents filtering by UUID
   * For now, we return empty array until backend is fixed
   */
  async getByPatientId(patientId: string): Promise<Note[]> {
    try {
      // Try to get all notes and filter client-side
      const allNotes = await apiClient.get<Note[]>(this.basePath);
      return allNotes.filter(note => note.patient?.id === patientId);
    } catch (error) {
      // Backend ParseIntPipe bug - return empty array gracefully
      console.warn('Failed to fetch notes (known backend issue):', patientId);
      return [];
    }
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
