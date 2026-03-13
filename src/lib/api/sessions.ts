import { decryptField } from "../e2e/crypto";
import { getE2EKeyState } from "../e2e/keyManager";
import type {
  CreateSessionDto,
  SessionDeleteScope,
  SessionResponse,
  UpdateSessionDto,
} from "../types/session";
import { apiClient } from "./client";

type SessionPatientApi = NonNullable<SessionResponse["patient"]> & {
  encryptedLastName?: string;
  lastNameIv?: string;
};

type SessionApiResponse = Omit<SessionResponse, "patient"> & {
  patient?: SessionPatientApi;
};

async function decryptSessionPatient(
  patient?: SessionPatientApi,
): Promise<SessionResponse["patient"]> {
  if (!patient) {
    return patient;
  }

  if (!patient.encryptedLastName || !patient.lastNameIv) {
    return patient;
  }

  const userKey = getE2EKeyState().userKey;
  if (!userKey) {
    return patient;
  }

  try {
    const lastName = await decryptField(
      patient.encryptedLastName,
      patient.lastNameIv,
      userKey,
    );
    return {
      ...patient,
      lastName,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to decrypt session patient lastName", error);
    }
    return patient;
  }
}

async function mapSession(
  response: SessionApiResponse,
): Promise<SessionResponse> {
  return {
    ...response,
    patient: await decryptSessionPatient(response.patient),
  };
}

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
    const response = await apiClient.post<SessionApiResponse>(
      "/sessions",
      data,
    );
    return mapSession(response);
  },

  /**
   * Obtener próximas sesiones
   * @returns Lista de las próximas 10 sesiones
   */
  async getUpcoming(): Promise<SessionResponse[]> {
    const response =
      await apiClient.get<SessionApiResponse[]>("/sessions/upcoming");
    // Asegurar que siempre devolvemos un array
    if (!Array.isArray(response)) return [];
    return Promise.all(response.map((session) => mapSession(session)));
  },

  /**
   * Obtener sesiones de un mes específico
   * @param year - Año (ej: 2026)
   * @param month - Mes (1-12)
   * @returns Lista de sesiones del mes
   */
  async getMonthly(year: number, month: number): Promise<SessionResponse[]> {
    const response = await apiClient.get<SessionApiResponse[]>(
      `/sessions/monthly/${year}/${month}`,
    );
    // Asegurar que siempre devolvemos un array
    if (!Array.isArray(response)) return [];
    return Promise.all(response.map((session) => mapSession(session)));
  },

  /**
   * Obtener una sesión por ID
   * @param id - ID de la sesión
   * @returns Detalles completos de la sesión
   */
  async getById(id: string): Promise<SessionResponse> {
    const response = await apiClient.get<SessionApiResponse>(`/sessions/${id}`);
    return mapSession(response);
  },

  /**
   * Actualizar sesión
   * @param id - ID de la sesión
   * @param data - Datos a actualizar
   * @returns Sesión actualizada
   */
  async update(id: string, data: UpdateSessionDto): Promise<SessionResponse> {
    const response = await apiClient.patch<SessionApiResponse>(
      `/sessions/${id}`,
      data,
    );
    return mapSession(response);
  },

  /**
   * Marcar sesión como completada
   * @param id - ID de la sesión
   * @returns Sesión con status COMPLETED
   */
  async markAsCompleted(id: string): Promise<SessionResponse> {
    const response = await apiClient.patch<SessionApiResponse>(
      `/sessions/${id}/complete`,
    );
    return mapSession(response);
  },

  /**
   * Eliminar sesión
   * También elimina el evento de Google Calendar si existe
   * @param id - ID de la sesión
   * @param scope - Alcance de eliminación para sesiones recurrentes (opcional)
   */
  async delete(id: string, scope?: SessionDeleteScope): Promise<void> {
    const url = scope ? `/sessions/${id}?scope=${scope}` : `/sessions/${id}`;
    await apiClient.delete(url);
  },
};
