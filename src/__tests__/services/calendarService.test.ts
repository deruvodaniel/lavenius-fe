import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calendarService,
  CalendarAuthResponse,
  SyncCalendarResponse,
  GoogleCalendar,
} from '../../lib/services/calendarService';
import { apiClient } from '../../lib/api/client';

vi.mock('../../lib/api/client');

describe('CalendarService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    const mockAuthResponse: CalendarAuthResponse = {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=...',
      state: 'random-state-token-123',
    };

    it('should fetch the Google Calendar OAuth URL', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockAuthResponse);

      const result = await calendarService.getAuthUrl();

      expect(apiClient.get).toHaveBeenCalledWith('/calendar/auth/url');
      expect(result).toEqual(mockAuthResponse);
    });

    it('should return authUrl and state properties', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockAuthResponse);

      const result = await calendarService.getAuthUrl();

      expect(result.authUrl).toBe(mockAuthResponse.authUrl);
      expect(result.state).toBe(mockAuthResponse.state);
    });

    it('should propagate API errors', async () => {
      const apiError = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(apiError);

      await expect(calendarService.getAuthUrl()).rejects.toThrow('Network error');
      expect(apiClient.get).toHaveBeenCalledWith('/calendar/auth/url');
    });
  });

  describe('syncCalendar', () => {
    const mockSyncResponse: SyncCalendarResponse = {
      message: 'Calendar synced successfully',
      sessionsSynced: 5,
    };

    it('should sync sessions with Google Calendar', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockSyncResponse);

      const result = await calendarService.syncCalendar();

      expect(apiClient.post).toHaveBeenCalledWith('/calendar/sync');
      expect(result).toEqual(mockSyncResponse);
    });

    it('should return message and sessionsSynced count', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockSyncResponse);

      const result = await calendarService.syncCalendar();

      expect(result.message).toBe('Calendar synced successfully');
      expect(result.sessionsSynced).toBe(5);
    });

    it('should handle zero sessions synced', async () => {
      const emptySync: SyncCalendarResponse = {
        message: 'No sessions to sync',
        sessionsSynced: 0,
      };
      vi.mocked(apiClient.post).mockResolvedValue(emptySync);

      const result = await calendarService.syncCalendar();

      expect(result.sessionsSynced).toBe(0);
    });

    it('should propagate API errors', async () => {
      const apiError = new Error('Failed to sync calendar');
      vi.mocked(apiClient.post).mockRejectedValue(apiError);

      await expect(calendarService.syncCalendar()).rejects.toThrow('Failed to sync calendar');
      expect(apiClient.post).toHaveBeenCalledWith('/calendar/sync');
    });
  });

  describe('getCalendars', () => {
    const mockCalendars: GoogleCalendar[] = [
      {
        id: 'primary',
        summary: 'Primary Calendar',
        description: 'Main calendar',
        primary: true,
      },
      {
        id: 'work-calendar-id',
        summary: 'Work',
        description: 'Work related events',
        primary: false,
      },
      {
        id: 'personal-calendar-id',
        summary: 'Personal',
      },
    ];

    it('should fetch list of Google Calendars', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCalendars);

      const result = await calendarService.getCalendars();

      expect(apiClient.get).toHaveBeenCalledWith('/internal/calendar/calendars');
      expect(result).toEqual(mockCalendars);
    });

    it('should return array of GoogleCalendar objects', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCalendars);

      const result = await calendarService.getCalendars();

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('primary');
      expect(result[0].summary).toBe('Primary Calendar');
      expect(result[0].primary).toBe(true);
    });

    it('should handle calendars with optional fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCalendars);

      const result = await calendarService.getCalendars();

      // Calendar with all fields
      expect(result[0].description).toBe('Main calendar');
      // Calendar without description
      expect(result[2].description).toBeUndefined();
      expect(result[2].primary).toBeUndefined();
    });

    it('should handle empty calendar list', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      const result = await calendarService.getCalendars();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should propagate API errors', async () => {
      const apiError = new Error('Calendar not connected');
      vi.mocked(apiClient.get).mockRejectedValue(apiError);

      await expect(calendarService.getCalendars()).rejects.toThrow('Calendar not connected');
      expect(apiClient.get).toHaveBeenCalledWith('/internal/calendar/calendars');
    });
  });

  describe('disconnectCalendar', () => {
    it('should disconnect Google Calendar', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      await calendarService.disconnectCalendar();

      expect(apiClient.post).toHaveBeenCalledWith('/calendar/disconnect');
    });

    it('should return void on success', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      const result = await calendarService.disconnectCalendar();

      expect(result).toBeUndefined();
    });

    it('should propagate API errors', async () => {
      const apiError = new Error('Unauthorized');
      vi.mocked(apiClient.post).mockRejectedValue(apiError);

      await expect(calendarService.disconnectCalendar()).rejects.toThrow('Unauthorized');
      expect(apiClient.post).toHaveBeenCalledWith('/calendar/disconnect');
    });
  });
});
