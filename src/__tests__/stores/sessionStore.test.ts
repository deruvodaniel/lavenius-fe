import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSessionStore, useSessions } from '../../lib/stores/sessionStore';
import { sessionService } from '../../lib/api/sessions';
import type { CreateSessionDto, SessionResponse, UpdateSessionDto } from '../../lib/types/session';

// Mock the session service
vi.mock('../../lib/api/sessions', () => ({
  sessionService: {
    getUpcoming: vi.fn(),
    getMonthly: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    markAsCompleted: vi.fn(),
  },
}));

describe('useSessionStore', () => {
  // Mock session data
  const mockPatient = {
    id: 'patient-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@test.com',
  };

  const mockSessions: SessionResponse[] = [
    {
      id: 'session-1',
      patientId: 'patient-1',
      patient: mockPatient,
      therapistId: 'therapist-1',
      scheduledFrom: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      scheduledTo: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      status: 'SCHEDULED',
      sessionType: 'INDIVIDUAL',
      modality: 'IN_PERSON',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 'session-2',
      patientId: 'patient-1',
      patient: mockPatient,
      therapistId: 'therapist-1',
      scheduledFrom: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      scheduledTo: new Date(Date.now() + 172800000 + 3600000).toISOString(),
      status: 'SCHEDULED',
      sessionType: 'INDIVIDUAL',
      modality: 'REMOTE',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  const initialState = {
    sessions: [],
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    // Reset store to initial state
    useSessionStore.setState(initialState);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Initial State Tests ====================
  describe('Initial State', () => {
    it('should have empty sessions array by default', () => {
      expect(useSessionStore.getState().sessions).toEqual([]);
    });

    it('should have isLoading false by default', () => {
      expect(useSessionStore.getState().isLoading).toBe(false);
    });

    it('should have null error by default', () => {
      expect(useSessionStore.getState().error).toBeNull();
    });
  });

  // ==================== fetchUpcoming Tests ====================
  describe('fetchUpcoming', () => {
    it('should call sessionService.getUpcoming', async () => {
      vi.mocked(sessionService.getUpcoming).mockResolvedValue(mockSessions);

      await act(async () => {
        await useSessionStore.getState().fetchUpcoming();
      });

      expect(sessionService.getUpcoming).toHaveBeenCalledTimes(1);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(sessionService.getUpcoming).mockImplementation(async () => {
        loadingDuringRequest = useSessionStore.getState().isLoading;
        return mockSessions;
      });

      await act(async () => {
        await useSessionStore.getState().fetchUpcoming();
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useSessionStore.getState().isLoading).toBe(false);
    });

    it('should populate sessions array on success', async () => {
      vi.mocked(sessionService.getUpcoming).mockResolvedValue(mockSessions);

      await act(async () => {
        await useSessionStore.getState().fetchUpcoming();
      });

      expect(useSessionStore.getState().sessions).toEqual(mockSessions);
    });

    it('should clear error on successful request', async () => {
      useSessionStore.setState({ error: 'Previous error' });
      vi.mocked(sessionService.getUpcoming).mockResolvedValue(mockSessions);

      await act(async () => {
        await useSessionStore.getState().fetchUpcoming();
      });

      expect(useSessionStore.getState().error).toBeNull();
    });

    it('should set error on failure', async () => {
      const error = {
        response: { data: { message: 'Error al cargar sesiones' } },
      };
      vi.mocked(sessionService.getUpcoming).mockRejectedValue(error);

      await act(async () => {
        await useSessionStore.getState().fetchUpcoming();
      });

      expect(useSessionStore.getState().error).toBe('Error al cargar sesiones');
      expect(useSessionStore.getState().sessions).toEqual([]);
    });

    it('should use default error message when no response message', async () => {
      vi.mocked(sessionService.getUpcoming).mockRejectedValue(new Error());

      await act(async () => {
        await useSessionStore.getState().fetchUpcoming();
      });

      expect(useSessionStore.getState().error).toBe('Error al cargar sesiones');
    });

    it('should handle non-array response', async () => {
      vi.mocked(sessionService.getUpcoming).mockResolvedValue(
        null as unknown as SessionResponse[]
      );

      await act(async () => {
        await useSessionStore.getState().fetchUpcoming();
      });

      expect(useSessionStore.getState().sessions).toEqual([]);
    });
  });

  // ==================== fetchMonthly Tests ====================
  describe('fetchMonthly', () => {
    it('should call sessionService.getMonthly with year and month', async () => {
      vi.mocked(sessionService.getMonthly).mockResolvedValue(mockSessions);

      await act(async () => {
        await useSessionStore.getState().fetchMonthly(2026, 2);
      });

      expect(sessionService.getMonthly).toHaveBeenCalledWith(2026, 2);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(sessionService.getMonthly).mockImplementation(async () => {
        loadingDuringRequest = useSessionStore.getState().isLoading;
        return mockSessions;
      });

      await act(async () => {
        await useSessionStore.getState().fetchMonthly(2026, 2);
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useSessionStore.getState().isLoading).toBe(false);
    });

    it('should populate sessions array on success', async () => {
      vi.mocked(sessionService.getMonthly).mockResolvedValue(mockSessions);

      await act(async () => {
        await useSessionStore.getState().fetchMonthly(2026, 2);
      });

      expect(useSessionStore.getState().sessions).toEqual(mockSessions);
    });

    it('should set error on failure', async () => {
      const error = {
        response: { data: { message: 'Error al cargar sesiones del mes' } },
      };
      vi.mocked(sessionService.getMonthly).mockRejectedValue(error);

      await act(async () => {
        await useSessionStore.getState().fetchMonthly(2026, 2);
      });

      expect(useSessionStore.getState().error).toBe('Error al cargar sesiones del mes');
    });

    it('should handle non-array response', async () => {
      vi.mocked(sessionService.getMonthly).mockResolvedValue(
        undefined as unknown as SessionResponse[]
      );

      await act(async () => {
        await useSessionStore.getState().fetchMonthly(2026, 2);
      });

      expect(useSessionStore.getState().sessions).toEqual([]);
    });
  });

  // ==================== createSession Tests ====================
  describe('createSession', () => {
    const newSessionData: CreateSessionDto = {
      patientId: 'patient-1',
      scheduledFrom: new Date(Date.now() + 86400000).toISOString(),
      scheduledTo: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      sessionType: 'INDIVIDUAL',
      modality: 'IN_PERSON',
    };

    const createdSession: SessionResponse = {
      id: 'session-3',
      patientId: 'patient-1',
      patient: mockPatient,
      therapistId: 'therapist-1',
      scheduledFrom: newSessionData.scheduledFrom,
      scheduledTo: newSessionData.scheduledTo,
      status: 'SCHEDULED',
      sessionType: 'INDIVIDUAL',
      modality: 'IN_PERSON',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should call sessionService.create with correct data', async () => {
      vi.mocked(sessionService.create).mockResolvedValue(createdSession);

      await act(async () => {
        await useSessionStore.getState().createSession(newSessionData);
      });

      expect(sessionService.create).toHaveBeenCalledWith(newSessionData);
    });

    it('should add new session to sessions list', async () => {
      useSessionStore.setState({ sessions: mockSessions });
      vi.mocked(sessionService.create).mockResolvedValue(createdSession);

      await act(async () => {
        await useSessionStore.getState().createSession(newSessionData);
      });

      const { sessions } = useSessionStore.getState();
      expect(sessions).toContainEqual(createdSession);
    });

    it('should sort sessions chronologically after adding', async () => {
      const earlierSession: SessionResponse = {
        ...createdSession,
        id: 'session-earlier',
        scheduledFrom: new Date(Date.now() + 1000).toISOString(), // Very soon
        scheduledTo: new Date(Date.now() + 1000 + 3600000).toISOString(),
      };

      useSessionStore.setState({ sessions: mockSessions });
      vi.mocked(sessionService.create).mockResolvedValue(earlierSession);

      await act(async () => {
        await useSessionStore.getState().createSession(newSessionData);
      });

      const { sessions } = useSessionStore.getState();
      // First session should be the earliest
      expect(sessions[0].id).toBe('session-earlier');
    });

    it('should return created session', async () => {
      vi.mocked(sessionService.create).mockResolvedValue(createdSession);

      let result: SessionResponse | undefined;
      await act(async () => {
        result = await useSessionStore.getState().createSession(newSessionData);
      });

      expect(result).toEqual(createdSession);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(sessionService.create).mockImplementation(async () => {
        loadingDuringRequest = useSessionStore.getState().isLoading;
        return createdSession;
      });

      await act(async () => {
        await useSessionStore.getState().createSession(newSessionData);
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useSessionStore.getState().isLoading).toBe(false);
    });

    it('should set calendar-specific error message', async () => {
      const error = {
        response: { data: { message: 'Failed to create calendar event' } },
      };
      vi.mocked(sessionService.create).mockRejectedValue(error);

      await expect(
        useSessionStore.getState().createSession(newSessionData)
      ).rejects.toEqual(error);

      expect(useSessionStore.getState().error).toContain('Google Calendar');
    });

    it('should set error for 500 status code', async () => {
      const error = {
        statusCode: 500,
        response: { status: 500 },
      };
      vi.mocked(sessionService.create).mockRejectedValue(error);

      await expect(
        useSessionStore.getState().createSession(newSessionData)
      ).rejects.toEqual(error);

      expect(useSessionStore.getState().error).toContain('Error al crear el turno');
    });

    it('should throw error on failure', async () => {
      const error = new Error('Create failed');
      vi.mocked(sessionService.create).mockRejectedValue(error);

      await expect(
        useSessionStore.getState().createSession(newSessionData)
      ).rejects.toThrow('Create failed');
    });
  });

  // ==================== updateSession Tests ====================
  describe('updateSession', () => {
    const updateData: UpdateSessionDto = {
      notes: 'Updated notes',
    };

    const updatedSession: SessionResponse = {
      ...mockSessions[0],
      notes: 'Updated notes',
      updatedAt: new Date().toISOString(),
    };

    it('should call sessionService.update with correct id and data', async () => {
      vi.mocked(sessionService.update).mockResolvedValue(updatedSession);

      await act(async () => {
        await useSessionStore.getState().updateSession('session-1', updateData);
      });

      expect(sessionService.update).toHaveBeenCalledWith('session-1', updateData);
    });

    it('should update session in sessions list', async () => {
      useSessionStore.setState({ sessions: mockSessions });
      vi.mocked(sessionService.update).mockResolvedValue(updatedSession);

      await act(async () => {
        await useSessionStore.getState().updateSession('session-1', updateData);
      });

      const { sessions } = useSessionStore.getState();
      const session = sessions.find((s) => s.id === 'session-1');
      expect(session?.notes).toBe('Updated notes');
    });

    it('should return updated session', async () => {
      vi.mocked(sessionService.update).mockResolvedValue(updatedSession);

      let result: SessionResponse | undefined;
      await act(async () => {
        result = await useSessionStore.getState().updateSession('session-1', updateData);
      });

      expect(result).toEqual(updatedSession);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(sessionService.update).mockImplementation(async () => {
        loadingDuringRequest = useSessionStore.getState().isLoading;
        return updatedSession;
      });

      await act(async () => {
        await useSessionStore.getState().updateSession('session-1', updateData);
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useSessionStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const error = {
        response: { data: { message: 'Update failed' } },
      };
      vi.mocked(sessionService.update).mockRejectedValue(error);

      await expect(
        useSessionStore.getState().updateSession('session-1', updateData)
      ).rejects.toEqual(error);

      expect(useSessionStore.getState().error).toBe('Update failed');
    });
  });

  // ==================== deleteSession Tests ====================
  describe('deleteSession', () => {
    it('should call sessionService.delete with correct id', async () => {
      useSessionStore.setState({ sessions: mockSessions });
      vi.mocked(sessionService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useSessionStore.getState().deleteSession('session-1');
      });

      expect(sessionService.delete).toHaveBeenCalledWith('session-1');
    });

    it('should remove session from sessions list', async () => {
      useSessionStore.setState({ sessions: mockSessions });
      vi.mocked(sessionService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useSessionStore.getState().deleteSession('session-1');
      });

      const { sessions } = useSessionStore.getState();
      expect(sessions.find((s) => s.id === 'session-1')).toBeUndefined();
      expect(sessions).toHaveLength(1);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(sessionService.delete).mockImplementation(async () => {
        loadingDuringRequest = useSessionStore.getState().isLoading;
      });

      await act(async () => {
        await useSessionStore.getState().deleteSession('session-1');
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useSessionStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const error = {
        response: { data: { message: 'Delete failed' } },
      };
      vi.mocked(sessionService.delete).mockRejectedValue(error);

      await expect(
        useSessionStore.getState().deleteSession('session-1')
      ).rejects.toEqual(error);

      expect(useSessionStore.getState().error).toBe('Delete failed');
    });

    it('should not modify sessions on failure', async () => {
      useSessionStore.setState({ sessions: mockSessions });
      vi.mocked(sessionService.delete).mockRejectedValue(new Error('Failed'));

      try {
        await useSessionStore.getState().deleteSession('session-1');
      } catch {
        // Expected
      }

      // Sessions should still contain the session (optimistic update not applied)
      expect(useSessionStore.getState().sessions).toHaveLength(2);
    });
  });

  // ==================== markAsCompleted Tests ====================
  describe('markAsCompleted', () => {
    const completedSession: SessionResponse = {
      ...mockSessions[0],
      status: 'COMPLETED',
      updatedAt: new Date().toISOString(),
    };

    it('should call sessionService.markAsCompleted with correct id', async () => {
      vi.mocked(sessionService.markAsCompleted).mockResolvedValue(completedSession);

      await act(async () => {
        await useSessionStore.getState().markAsCompleted('session-1');
      });

      expect(sessionService.markAsCompleted).toHaveBeenCalledWith('session-1');
    });

    it('should update session status in list', async () => {
      useSessionStore.setState({ sessions: mockSessions });
      vi.mocked(sessionService.markAsCompleted).mockResolvedValue(completedSession);

      await act(async () => {
        await useSessionStore.getState().markAsCompleted('session-1');
      });

      const { sessions } = useSessionStore.getState();
      const session = sessions.find((s) => s.id === 'session-1');
      expect(session?.status).toBe('COMPLETED');
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(sessionService.markAsCompleted).mockImplementation(async () => {
        loadingDuringRequest = useSessionStore.getState().isLoading;
        return completedSession;
      });

      await act(async () => {
        await useSessionStore.getState().markAsCompleted('session-1');
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useSessionStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const error = {
        response: { data: { message: 'Mark complete failed' } },
      };
      vi.mocked(sessionService.markAsCompleted).mockRejectedValue(error);

      await expect(
        useSessionStore.getState().markAsCompleted('session-1')
      ).rejects.toEqual(error);

      expect(useSessionStore.getState().error).toBe('Mark complete failed');
    });
  });

  // ==================== clearError Tests ====================
  describe('clearError', () => {
    it('should clear error when set', () => {
      useSessionStore.setState({ error: 'Some error' });

      useSessionStore.getState().clearError();

      expect(useSessionStore.getState().error).toBeNull();
    });

    it('should have no effect when error is already null', () => {
      useSessionStore.setState({ error: null });

      useSessionStore.getState().clearError();

      expect(useSessionStore.getState().error).toBeNull();
    });
  });

  // ==================== useSessions Hook Tests ====================
  describe('useSessions hook', () => {
    const sessionsWithValidDates: SessionResponse[] = [
      {
        id: 'session-today',
        patientId: 'patient-1',
        patient: mockPatient,
        therapistId: 'therapist-1',
        scheduledFrom: new Date().toISOString(), // Today
        scheduledTo: new Date(Date.now() + 3600000).toISOString(),
        status: 'SCHEDULED',
        sessionType: 'INDIVIDUAL',
        modality: 'IN_PERSON',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'session-past',
        patientId: 'patient-1',
        patient: mockPatient,
        therapistId: 'therapist-1',
        scheduledFrom: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        scheduledTo: new Date(Date.now() - 86400000 + 3600000).toISOString(),
        status: 'COMPLETED',
        sessionType: 'INDIVIDUAL',
        modality: 'REMOTE',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    it('should return sessionsUI with transformed data', () => {
      useSessionStore.setState({ sessions: sessionsWithValidDates });

      const { result } = renderHook(() => useSessions());

      expect(result.current.sessionsUI).toHaveLength(2);
    });

    it('should include patientName in sessionsUI', () => {
      useSessionStore.setState({ sessions: sessionsWithValidDates });

      const { result } = renderHook(() => useSessions());

      expect(result.current.sessionsUI[0].patientName).toBe('Juan Pérez');
    });

    it('should calculate duration correctly', () => {
      useSessionStore.setState({ sessions: sessionsWithValidDates });

      const { result } = renderHook(() => useSessions());

      // Duration should be 60 minutes (3600000ms / 60000)
      expect(result.current.sessionsUI[0].duration).toBe(60);
    });

    it('should mark past sessions as isPast', () => {
      useSessionStore.setState({ sessions: sessionsWithValidDates });

      const { result } = renderHook(() => useSessions());

      const pastSession = result.current.sessionsUI.find(
        (s) => s.id === 'session-past'
      );
      expect(pastSession?.isPast).toBe(true);
    });

    it('should mark today sessions as isToday', () => {
      useSessionStore.setState({ sessions: sessionsWithValidDates });

      const { result } = renderHook(() => useSessions());

      const todaySession = result.current.sessionsUI.find(
        (s) => s.id === 'session-today'
      );
      expect(todaySession?.isToday).toBe(true);
    });

    it('should include formattedDate and formattedTime', () => {
      useSessionStore.setState({ sessions: sessionsWithValidDates });

      const { result } = renderHook(() => useSessions());

      expect(result.current.sessionsUI[0].formattedDate).toBeDefined();
      expect(result.current.sessionsUI[0].formattedTime).toBeDefined();
    });

    it('should filter out sessions with invalid dates', () => {
      const sessionsWithInvalid = [
        ...sessionsWithValidDates,
        {
          id: 'session-invalid',
          patientId: 'patient-1',
          therapistId: 'therapist-1',
          scheduledFrom: null,
          scheduledTo: null,
          status: 'SCHEDULED',
          sessionType: 'INDIVIDUAL',
          modality: 'IN_PERSON',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as unknown as SessionResponse,
      ];
      useSessionStore.setState({ sessions: sessionsWithInvalid });

      const { result } = renderHook(() => useSessions());

      // Invalid session should be filtered out
      expect(result.current.sessionsUI).toHaveLength(2);
    });

    it('should handle empty patient data', () => {
      const sessionWithoutPatient: SessionResponse = {
        ...sessionsWithValidDates[0],
        id: 'session-no-patient',
        patient: undefined,
      };
      useSessionStore.setState({ sessions: [sessionWithoutPatient] });

      const { result } = renderHook(() => useSessions());

      expect(result.current.sessionsUI[0].patientName).toBeUndefined();
    });

    it('should use actualDuration if available', () => {
      const sessionWithActualDuration: SessionResponse = {
        ...sessionsWithValidDates[0],
        actualDuration: 45,
      };
      useSessionStore.setState({ sessions: [sessionWithActualDuration] });

      const { result } = renderHook(() => useSessions());

      expect(result.current.sessionsUI[0].duration).toBe(45);
    });

    it('should return store methods', () => {
      const { result } = renderHook(() => useSessions());

      expect(typeof result.current.fetchUpcoming).toBe('function');
      expect(typeof result.current.fetchMonthly).toBe('function');
      expect(typeof result.current.createSession).toBe('function');
      expect(typeof result.current.updateSession).toBe('function');
      expect(typeof result.current.deleteSession).toBe('function');
      expect(typeof result.current.markAsCompleted).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('should handle empty sessions array gracefully', async () => {
      vi.mocked(sessionService.getUpcoming).mockResolvedValue([]);

      await act(async () => {
        await useSessionStore.getState().fetchUpcoming();
      });

      expect(useSessionStore.getState().sessions).toEqual([]);
    });

    it('should handle concurrent fetch requests', async () => {
      vi.mocked(sessionService.getUpcoming)
        .mockResolvedValueOnce(mockSessions)
        .mockResolvedValueOnce([mockSessions[0]]);

      await act(async () => {
        await Promise.all([
          useSessionStore.getState().fetchUpcoming(),
          useSessionStore.getState().fetchUpcoming(),
        ]);
      });

      expect(sessionService.getUpcoming).toHaveBeenCalledTimes(2);
    });

    it('should handle update of non-existent session in list', async () => {
      useSessionStore.setState({ sessions: mockSessions });

      const nonExistentSession: SessionResponse = {
        ...mockSessions[0],
        id: 'non-existent',
      };

      vi.mocked(sessionService.update).mockResolvedValue(nonExistentSession);

      await act(async () => {
        await useSessionStore.getState().updateSession('non-existent', { notes: 'test' });
      });

      // Should not add new session, list should remain unchanged
      expect(useSessionStore.getState().sessions).toHaveLength(2);
    });

    it('should handle null/undefined sessions array', () => {
      useSessionStore.setState({ sessions: null as unknown as SessionResponse[] });

      const { result } = renderHook(() => useSessions());

      // Should handle gracefully
      expect(result.current.sessionsUI).toEqual([]);
    });
  });
});
