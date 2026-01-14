import { apiClient } from './client';
import type { CreateSessionDto, SessionResponse, UpdateSessionDto } from '../types/session';

/**
 * Session Service
 * Servicio para gestionar sesiones de terapia
 * Integrado con el backend BFF /sessions
 */
export const sessionService = {
  /**
   * Crear nueva sesión
   * @param data - Datos de la sesión a crear
   * @returns Sesión creada con eventId de Google Calendar si aplica
   */
  async create(data: CreateSessionDto): Promise<SessionResponse> {
    const response = await apiClient.post<SessionResponse>('/sessions', data);
    return response as unknown as SessionResponse;
  },

  /**
   * Obtener próximas sesiones
   * @returns Lista de las próximas 10 sesiones
   */
  async getUpcoming(): Promise<SessionResponse[]> {
    const response = await apiClient.get<SessionResponse[]>('/sessions/upcoming');
    // Asegurar que siempre devolvemos un array
    return Array.isArray(response) ? response : [];
  },

  /**
   * Obtener sesiones de un mes específico
   * @param year - Año (ej: 2026)
   * @param month - Mes (1-12)
   * @returns Lista de sesiones del mes
   */
  async getMonthly(year: number, month: number): Promise<SessionResponse[]> {
    const response = await apiClient.get<SessionResponse[]>(`/sessions/monthly/${year}/${month}`);
    // Asegurar que siempre devolvemos un array
    return Array.isArray(response) ? response : [];
  },

  /**
   * Obtener una sesión por ID
   * @param id - ID de la sesión
   * @returns Detalles completos de la sesión
   */
  async getById(id: string): Promise<SessionResponse> {
    const response = await apiClient.get<SessionResponse>(`/sessions/${id}`);
    return response as unknown as SessionResponse;
  },

  /**
   * Actualizar sesión
   * @param id - ID de la sesión
   * @param data - Datos a actualizar
   * @returns Sesión actualizada
   */
  async update(id: string, data: UpdateSessionDto): Promise<SessionResponse> {
    const response = await apiClient.patch<SessionResponse>(`/sessions/${id}`, data);
    return response as unknown as SessionResponse;
  },

  /**
   * Marcar sesión como completada
   * @param id - ID de la sesión
   * @returns Sesión con status COMPLETED
   */
  async markAsCompleted(id: string): Promise<SessionResponse> {
    const response = await apiClient.patch<SessionResponse>(`/sessions/${id}/complete`);
    return response as unknown as SessionResponse;
  },

  /**
   * Eliminar sesión
   * También elimina el evento de Google Calendar si existe
   * @param id - ID de la sesión
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/sessions/${id}`);
  }
};
