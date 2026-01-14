import { apiClient } from '../api/client';

export interface CalendarAuthResponse {
  authUrl: string;
  state: string;
}

export interface SyncCalendarResponse {
  message: string;
  sessionsSynced: number;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
}

export const calendarService = {
  /**
   * Get the Google Calendar OAuth URL
   */
  async getAuthUrl(): Promise<CalendarAuthResponse> {
    const response = await apiClient.get<CalendarAuthResponse>('/calendar/auth/url');
    // apiClient already returns the data directly, not response.data
    return response as unknown as CalendarAuthResponse;
  },

  /**
   * Sync sessions with Google Calendar
   */
  async syncCalendar(): Promise<SyncCalendarResponse> {
    const response = await apiClient.post<SyncCalendarResponse>('/calendar/sync');
    return response as unknown as SyncCalendarResponse;
  },

  /**
   * Get list of Google Calendars
   */
  async getCalendars(): Promise<GoogleCalendar[]> {
    const response = await apiClient.get<GoogleCalendar[]>('/internal/calendar/calendars');
    return response as unknown as GoogleCalendar[];
  },

  /**
   * Disconnect Google Calendar
   */
  async disconnectCalendar(): Promise<void> {
    await apiClient.post('/calendar/disconnect');
  },
};
