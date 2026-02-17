import { apiClient } from '../api/client';
import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from '../types/api.types';

/**
 * Appointment Service
 * Maneja todas las operaciones CRUD de citas
 */
export class AppointmentService {
  private readonly basePath = '/appointments';

  /**
   * Get all appointments for the authenticated therapist
   */
  async getAll(): Promise<Appointment[]> {
    return apiClient.get<Appointment[]>(this.basePath);
  }

  /**
   * Get appointments by patient ID
   */
  async getByPatientId(patientId: string): Promise<Appointment[]> {
    const appointments = await this.getAll();
    return appointments.filter((apt) => apt.patientId === patientId);
  }

  /**
   * Get appointments by date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    const appointments = await this.getAll();
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.dateTime);
      return aptDate >= startDate && aptDate <= endDate;
    });
  }

  /**
   * Get a single appointment by ID
   */
  async getById(id: string): Promise<Appointment> {
    return apiClient.get<Appointment>(`${this.basePath}/${id}`);
  }

  /**
   * Create a new appointment
   */
  async create(data: CreateAppointmentDto): Promise<Appointment> {
    return apiClient.post<Appointment, CreateAppointmentDto>(this.basePath, data);
  }

  /**
   * Update an existing appointment
   */
  async update(id: string, data: UpdateAppointmentDto): Promise<Appointment> {
    return apiClient.patch<Appointment, UpdateAppointmentDto>(
      `${this.basePath}/${id}`,
      data
    );
  }

  /**
   * Delete an appointment
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Get upcoming appointments
   */
  async getUpcoming(limit?: number): Promise<Appointment[]> {
    const appointments = await this.getAll();
    const now = new Date();
    
    const upcoming = appointments
      .filter((apt) => {
        const aptDate = new Date(apt.dateTime);
        return aptDate > now;
      })
      .sort((a, b) => 
        new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      );

    return limit ? upcoming.slice(0, limit) : upcoming;
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();

// Export default
export default appointmentService;
