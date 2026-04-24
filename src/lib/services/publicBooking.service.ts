import { apiClient } from '@/lib/api/client';
import { SessionType } from '@/lib/types/session';

export interface AvailabilitySlot {
  from: string;
  to: string;
}

export interface TherapistAvailabilityResponse {
  therapistId: string;
  from: string;
  to: string;
  timezone: string;
  slots: AvailabilitySlot[];
}

export interface AvailabilityQuery {
  from?: string;
  to?: string;
}

export interface CreatePublicBookingRequest {
  scheduledFrom: string;
  scheduledTo: string;
  sessionType: SessionType;
  patientEmail: string;
  patientFirstName: string;
  patientPhone: string;
  bookingMessage?: string;
}

export interface CreatePublicBookingResponse {
  id: string;
  status: 'pending_approval';
  createdBy: 'patient';
}

class PublicBookingService {
  async getAvailability(
    therapistId: string,
    query: AvailabilityQuery = {},
  ): Promise<TherapistAvailabilityResponse> {
    const params = new URLSearchParams();
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);

    const suffix = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<TherapistAvailabilityResponse>(
      `/public/therapists/${therapistId}/availability${suffix}`,
    );
  }

  async createBooking(
    therapistId: string,
    data: CreatePublicBookingRequest,
  ): Promise<CreatePublicBookingResponse> {
    return apiClient.post<CreatePublicBookingResponse, CreatePublicBookingRequest>(
      `/public/therapists/${therapistId}/bookings`,
      data,
    );
  }
}

export const publicBookingService = new PublicBookingService();

