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
   * Get all notes with optional filters
   */
  async getAll(params?: {
    patientId?: string;
    sessionId?: string;
    noteType?: NoteType;
  }): Promise<Note[]> {
    return apiClient.get<Note[]>(this.basePath, { params });
  }

  /**
   * Get notes by patient ID
   */
  async getByPatientId(patientId: string): Promise<Note[]> {
    return this.getAll({ patientId });
  }

  /**
   * Get notes by session ID
   */
  async getBySessionId(sessionId: string): Promise<Note[]> {
    return this.getAll({ sessionId });
  }

  /**
   * Get notes by type
   */
  async getByType(noteType: NoteType): Promise<Note[]> {
    return this.getAll({ noteType });
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
    console.log('🔵 noteService.create - Sending data:', JSON.stringify(data, null, 2));
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
