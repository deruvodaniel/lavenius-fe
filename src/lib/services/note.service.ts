import { apiClient } from '../api/client';
import { decryptField, encryptField } from '../e2e/crypto';
import { getE2EKeyState } from '../e2e/keyManager';
import type {
  Note,
  CreateNoteDto,
  UpdateNoteDto,
  NoteType,
} from '../types/api.types';

type NoteApiResponse = Omit<Note, 'text'> & {
  text?: string;
  encryptedText?: string;
  textIv?: string;
};

function requireE2EUserKey(): Uint8Array {
  const userKey = getE2EKeyState().userKey;
  if (!userKey) {
    throw new Error('E2E key is locked');
  }
  return userKey;
}

/**
 * Note Service
 * Maneja todas las operaciones CRUD de notas
 */
export class NoteService {
  private readonly basePath = '/notes';

  private async mapNote(note: NoteApiResponse): Promise<Note> {
    let text = note.text || '';

    if (note.encryptedText && note.textIv) {
      try {
        text = await decryptField(note.encryptedText, note.textIv, requireE2EUserKey());
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to decrypt note text', error);
        }
      }
    }

    return {
      ...note,
      text,
    };
  }

  private async encryptText(text: string): Promise<{ encryptedText: string; textIv: string }> {
    const encrypted = await encryptField(text, requireE2EUserKey());
    return {
      encryptedText: encrypted.ciphertext,
      textIv: encrypted.iv,
    };
  }

  /**
   * Get notes by patient ID
   * Backend endpoint: GET /notes?patientId=uuid
   */
  async getByPatientId(patientId: string): Promise<Note[]> {
    const response = await apiClient.get<NoteApiResponse[]>(`${this.basePath}?patientId=${patientId}`);
    if (!Array.isArray(response)) return [];
    return Promise.all(response.map((note) => this.mapNote(note)));
  }

  /**
   * Get notes by session ID
   */
  async getBySessionId(sessionId: string): Promise<Note[]> {
    const response = await apiClient.get<NoteApiResponse[]>(`${this.basePath}/session/${sessionId}`);
    if (!Array.isArray(response)) return [];
    return Promise.all(response.map((note) => this.mapNote(note)));
  }

  /**
   * Get notes by type for a patient
   */
  async getByType(patientId: string, noteType: NoteType): Promise<Note[]> {
    const response = await apiClient.get<NoteApiResponse[]>(`${this.basePath}?patientId=${patientId}&noteType=${noteType}`);
    if (!Array.isArray(response)) return [];
    return Promise.all(response.map((note) => this.mapNote(note)));
  }

  /**
   * Get a single note by ID
   */
  async getById(id: string): Promise<Note> {
    const response = await apiClient.get<NoteApiResponse>(`${this.basePath}/${id}`);
    return this.mapNote(response);
  }

  /**
   * Create a new note
   */
  async create(data: CreateNoteDto): Promise<Note> {
    const encryptedText = await this.encryptText(data.text);
    const response = await apiClient.post<NoteApiResponse, Omit<CreateNoteDto, 'text'> & { encryptedText: string; textIv: string }>(
      this.basePath,
      {
        patientId: data.patientId,
        noteDate: data.noteDate,
        ...encryptedText,
      }
    );
    return this.mapNote(response);
  }

  /**
   * Update an existing note
   */
  async update(id: string, data: UpdateNoteDto): Promise<Note> {
    const payload: Record<string, unknown> = {};
    if (data.noteDate) payload.noteDate = data.noteDate;
    if (typeof data.text === 'string') {
      const encryptedText = await this.encryptText(data.text);
      payload.encryptedText = encryptedText.encryptedText;
      payload.textIv = encryptedText.textIv;
    }

    const response = await apiClient.patch<NoteApiResponse, Record<string, unknown>>(
      `${this.basePath}/${id}`,
      payload
    );
    return this.mapNote(response);
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
