import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useSettingStore, settingSelectors } from '../../lib/stores/setting.store';
import { settingService } from '../../lib/services/setting.service';
import type {
  Setting,
  DayOffSetting,
  DuePaymentReminderSetting,
  NextSessionReminderSetting,
  CreateSettingDto,
  UpdateSettingDto,
  DayOffConfig,
} from '../../lib/types/setting.types';
import { SettingType, PaymentReminderFrequency } from '../../lib/types/setting.types';

// Mock the setting service
vi.mock('../../lib/services/setting.service', () => ({
  settingService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useSettingStore', () => {
  // ==================== Mock Data ====================
  const mockDayOffSetting: DayOffSetting = {
    id: '1',
    type: SettingType.DAY_OFF,
    active: true,
    config: { fromDate: '2026-03-01', toDate: '2026-03-01' },
  };

  const mockDayOffSetting2: DayOffSetting = {
    id: '2',
    type: SettingType.DAY_OFF,
    active: true,
    config: { fromDate: '2026-03-15', toDate: '2026-03-20' },
  };

  const mockInactiveDayOffSetting: DayOffSetting = {
    id: '3',
    type: SettingType.DAY_OFF,
    active: false,
    config: { fromDate: '2026-04-01', toDate: '2026-04-05' },
  };

  const mockPaymentReminderSetting: DuePaymentReminderSetting = {
    id: '4',
    type: SettingType.DUE_PAYMENT_REMINDER,
    active: true,
    config: {
      frequency: PaymentReminderFrequency.WEEKLY,
      remindDuePaymentLimit: 3,
      message: 'Payment reminder',
    },
  };

  const mockNextSessionReminderSetting: NextSessionReminderSetting = {
    id: '5',
    type: SettingType.NEXT_SESSION_REMINDER,
    active: true,
    config: {
      hoursBeforeSession: 24,
      message: 'Your session is tomorrow',
    },
  };

  const mockSettings: Setting[] = [
    mockDayOffSetting,
    mockDayOffSetting2,
    mockInactiveDayOffSetting,
    mockPaymentReminderSetting,
    mockNextSessionReminderSetting,
  ];

  const initialState = {
    settings: [],
    fetchStatus: 'idle' as const,
    error: null,
    lastFetchTime: null,
  };

  beforeEach(() => {
    // Reset store to initial state before each test
    useSettingStore.setState(initialState);
    vi.clearAllMocks();
    // Reset timers if needed
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Initial State Tests ====================
  describe('Initial State', () => {
    it('should have empty settings array by default', () => {
      const { settings } = useSettingStore.getState();
      expect(settings).toEqual([]);
    });

    it('should have idle fetch status by default', () => {
      const { fetchStatus } = useSettingStore.getState();
      expect(fetchStatus).toBe('idle');
    });

    it('should have null error by default', () => {
      const { error } = useSettingStore.getState();
      expect(error).toBeNull();
    });

    it('should have null lastFetchTime by default', () => {
      const { lastFetchTime } = useSettingStore.getState();
      expect(lastFetchTime).toBeNull();
    });
  });

  // ==================== fetchSettings Tests ====================
  describe('fetchSettings', () => {
    it('should fetch settings and update state', async () => {
      vi.mocked(settingService.getAll).mockResolvedValue(mockSettings);

      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      expect(settingService.getAll).toHaveBeenCalledTimes(1);
      expect(useSettingStore.getState().settings).toEqual(mockSettings);
      expect(useSettingStore.getState().settings).toHaveLength(5);
    });

    it('should set loading status while fetching', async () => {
      let statusDuringRequest = '';

      vi.mocked(settingService.getAll).mockImplementation(async () => {
        statusDuringRequest = useSettingStore.getState().fetchStatus;
        return mockSettings;
      });

      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      expect(statusDuringRequest).toBe('loading');
    });

    it('should set success status after successful fetch', async () => {
      vi.mocked(settingService.getAll).mockResolvedValue(mockSettings);

      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      expect(useSettingStore.getState().fetchStatus).toBe('success');
    });

    it('should set lastFetchTime after successful fetch', async () => {
      vi.mocked(settingService.getAll).mockResolvedValue(mockSettings);
      const beforeFetch = Date.now();

      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      const { lastFetchTime } = useSettingStore.getState();
      expect(lastFetchTime).not.toBeNull();
      expect(lastFetchTime).toBeGreaterThanOrEqual(beforeFetch);
    });

    it('should use cache when not forced and within cache duration', async () => {
      vi.mocked(settingService.getAll).mockResolvedValue(mockSettings);

      // First fetch
      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      expect(settingService.getAll).toHaveBeenCalledTimes(1);

      // Second fetch (should use cache)
      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      // Service should NOT have been called again
      expect(settingService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should force refresh when force=true', async () => {
      vi.mocked(settingService.getAll).mockResolvedValue(mockSettings);

      // First fetch
      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      expect(settingService.getAll).toHaveBeenCalledTimes(1);

      // Second fetch with force=true
      await act(async () => {
        await useSettingStore.getState().fetchSettings(true);
      });

      // Service should have been called again
      expect(settingService.getAll).toHaveBeenCalledTimes(2);
    });

    it('should fetch again after cache expires', async () => {
      vi.useFakeTimers();
      vi.mocked(settingService.getAll).mockResolvedValue(mockSettings);

      // First fetch
      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      expect(settingService.getAll).toHaveBeenCalledTimes(1);

      // Advance time past cache duration (30 seconds)
      vi.advanceTimersByTime(31 * 1000);

      // Second fetch (should fetch again)
      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      expect(settingService.getAll).toHaveBeenCalledTimes(2);
    });

    it('should prevent concurrent duplicate requests', async () => {
      let resolvePromise: (value: Setting[]) => void;
      const delayedPromise = new Promise<Setting[]>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(settingService.getAll).mockReturnValue(delayedPromise);

      // Start first fetch (won't resolve immediately)
      const fetch1 = useSettingStore.getState().fetchSettings();

      // Try to start second fetch while first is loading
      const fetch2 = useSettingStore.getState().fetchSettings();

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockSettings);
        await fetch1;
        await fetch2;
      });

      // Service should only have been called once
      expect(settingService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Network error';
      vi.mocked(settingService.getAll).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await useSettingStore.getState().fetchSettings();
        } catch {
          // Expected to throw
        }
      });

      expect(useSettingStore.getState().error).not.toBeNull();
      expect(useSettingStore.getState().error?.message).toBe(errorMessage);
      expect(useSettingStore.getState().fetchStatus).toBe('error');
    });

    it('should set generic error when error is not an Error instance', async () => {
      vi.mocked(settingService.getAll).mockRejectedValue('String error');

      await act(async () => {
        try {
          await useSettingStore.getState().fetchSettings();
        } catch {
          // Expected to throw
        }
      });

      expect(useSettingStore.getState().error?.message).toBe('Failed to fetch settings');
    });

    it('should throw error on failure', async () => {
      vi.mocked(settingService.getAll).mockRejectedValue(new Error('Fetch failed'));

      await expect(useSettingStore.getState().fetchSettings()).rejects.toThrow('Fetch failed');
    });

    it('should clear error before fetching', async () => {
      // First set an error
      useSettingStore.setState({ error: new Error('Previous error') });
      vi.mocked(settingService.getAll).mockResolvedValue(mockSettings);

      await act(async () => {
        await useSettingStore.getState().fetchSettings(true);
      });

      expect(useSettingStore.getState().error).toBeNull();
    });

    it('should handle empty settings array', async () => {
      vi.mocked(settingService.getAll).mockResolvedValue([]);

      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      expect(useSettingStore.getState().settings).toEqual([]);
      expect(useSettingStore.getState().fetchStatus).toBe('success');
    });
  });

  // ==================== createSetting Tests ====================
  describe('createSetting', () => {
    const newDayOffData: CreateSettingDto = {
      type: SettingType.DAY_OFF,
      active: true,
      config: { fromDate: '2026-05-01', toDate: '2026-05-03' },
    };

    const createdDayOffSetting: DayOffSetting = {
      id: '6',
      type: SettingType.DAY_OFF,
      active: true,
      config: { fromDate: '2026-05-01', toDate: '2026-05-03' },
    };

    it('should create day off setting and add to state', async () => {
      useSettingStore.setState({ settings: mockSettings });
      vi.mocked(settingService.create).mockResolvedValue(createdDayOffSetting);

      await act(async () => {
        await useSettingStore.getState().createSetting(newDayOffData);
      });

      expect(settingService.create).toHaveBeenCalledWith(newDayOffData);

      const { settings } = useSettingStore.getState();
      expect(settings).toHaveLength(6);
      expect(settings[settings.length - 1]).toEqual(createdDayOffSetting);
    });

    it('should create reminder setting and add to state', async () => {
      const newReminderData: CreateSettingDto = {
        type: SettingType.DUE_PAYMENT_REMINDER,
        active: true,
        config: {
          frequency: PaymentReminderFrequency.BIWEEKLY,
          remindDuePaymentLimit: 5,
          message: 'New payment reminder',
        },
      };

      const createdReminderSetting: DuePaymentReminderSetting = {
        id: '7',
        type: SettingType.DUE_PAYMENT_REMINDER,
        active: true,
        config: {
          frequency: PaymentReminderFrequency.BIWEEKLY,
          remindDuePaymentLimit: 5,
          message: 'New payment reminder',
        },
      };

      vi.mocked(settingService.create).mockResolvedValue(createdReminderSetting);

      await act(async () => {
        await useSettingStore.getState().createSetting(newReminderData);
      });

      expect(settingService.create).toHaveBeenCalledWith(newReminderData);

      const { settings } = useSettingStore.getState();
      expect(settings).toContainEqual(createdReminderSetting);
    });

    it('should return created setting', async () => {
      vi.mocked(settingService.create).mockResolvedValue(createdDayOffSetting);

      let result: Setting | undefined;
      await act(async () => {
        result = await useSettingStore.getState().createSetting(newDayOffData);
      });

      expect(result).toEqual(createdDayOffSetting);
    });

    it('should set loading status during creation', async () => {
      let statusDuringRequest = '';

      vi.mocked(settingService.create).mockImplementation(async () => {
        statusDuringRequest = useSettingStore.getState().fetchStatus;
        return createdDayOffSetting;
      });

      await act(async () => {
        await useSettingStore.getState().createSetting(newDayOffData);
      });

      expect(statusDuringRequest).toBe('loading');
      expect(useSettingStore.getState().fetchStatus).toBe('success');
    });

    it('should handle creation errors', async () => {
      const errorMessage = 'Failed to create';
      vi.mocked(settingService.create).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await useSettingStore.getState().createSetting(newDayOffData);
        } catch {
          // Expected
        }
      });

      expect(useSettingStore.getState().error?.message).toBe(errorMessage);
      expect(useSettingStore.getState().fetchStatus).toBe('error');
    });

    it('should throw error on creation failure', async () => {
      vi.mocked(settingService.create).mockRejectedValue(new Error('Create failed'));

      await expect(useSettingStore.getState().createSetting(newDayOffData)).rejects.toThrow(
        'Create failed'
      );
    });

    it('should set generic error when error is not an Error instance', async () => {
      vi.mocked(settingService.create).mockRejectedValue('String error');

      await act(async () => {
        try {
          await useSettingStore.getState().createSetting(newDayOffData);
        } catch {
          // Expected
        }
      });

      expect(useSettingStore.getState().error?.message).toBe('Failed to create setting');
    });
  });

  // ==================== createDayOff Tests ====================
  describe('createDayOff', () => {
    const dayOffConfig: DayOffConfig = {
      fromDate: '2026-06-01',
      toDate: '2026-06-05',
    };

    const createdDayOff: DayOffSetting = {
      id: '8',
      type: SettingType.DAY_OFF,
      active: true,
      config: dayOffConfig,
      description: 'Summer vacation',
    };

    it('should create day off with correct data structure', async () => {
      vi.mocked(settingService.create).mockResolvedValue(createdDayOff);

      await act(async () => {
        await useSettingStore.getState().createDayOff(dayOffConfig, 'Summer vacation');
      });

      expect(settingService.create).toHaveBeenCalledWith({
        type: SettingType.DAY_OFF,
        config: dayOffConfig,
        active: true,
        description: 'Summer vacation',
      });
    });

    it('should create day off without description', async () => {
      vi.mocked(settingService.create).mockResolvedValue({
        ...createdDayOff,
        description: undefined,
      });

      await act(async () => {
        await useSettingStore.getState().createDayOff(dayOffConfig);
      });

      expect(settingService.create).toHaveBeenCalledWith({
        type: SettingType.DAY_OFF,
        config: dayOffConfig,
        active: true,
        description: undefined,
      });
    });

    it('should return created day off setting', async () => {
      vi.mocked(settingService.create).mockResolvedValue(createdDayOff);

      let result: Setting | undefined;
      await act(async () => {
        result = await useSettingStore.getState().createDayOff(dayOffConfig, 'Summer vacation');
      });

      expect(result).toEqual(createdDayOff);
    });
  });

  // ==================== updateSetting Tests ====================
  describe('updateSetting', () => {
    const updateData: UpdateSettingDto = {
      active: false,
    };

    const updatedSetting: DayOffSetting = {
      ...mockDayOffSetting,
      active: false,
    };

    it('should update setting in state', async () => {
      useSettingStore.setState({ settings: mockSettings });
      vi.mocked(settingService.update).mockResolvedValue(updatedSetting);

      await act(async () => {
        await useSettingStore.getState().updateSetting('1', updateData);
      });

      expect(settingService.update).toHaveBeenCalledWith('1', updateData);

      const { settings } = useSettingStore.getState();
      const setting = settings.find((s) => s.id === '1');
      expect(setting?.active).toBe(false);
    });

    it('should return updated setting', async () => {
      useSettingStore.setState({ settings: mockSettings });
      vi.mocked(settingService.update).mockResolvedValue(updatedSetting);

      let result: Setting | undefined;
      await act(async () => {
        result = await useSettingStore.getState().updateSetting('1', updateData);
      });

      expect(result).toEqual(updatedSetting);
    });

    it('should set loading status during update', async () => {
      useSettingStore.setState({ settings: mockSettings });
      let statusDuringRequest = '';

      vi.mocked(settingService.update).mockImplementation(async () => {
        statusDuringRequest = useSettingStore.getState().fetchStatus;
        return updatedSetting;
      });

      await act(async () => {
        await useSettingStore.getState().updateSetting('1', updateData);
      });

      expect(statusDuringRequest).toBe('loading');
      expect(useSettingStore.getState().fetchStatus).toBe('success');
    });

    it('should preserve other settings when updating one', async () => {
      useSettingStore.setState({ settings: mockSettings });
      vi.mocked(settingService.update).mockResolvedValue(updatedSetting);

      await act(async () => {
        await useSettingStore.getState().updateSetting('1', updateData);
      });

      const { settings } = useSettingStore.getState();
      expect(settings).toHaveLength(5);
      expect(settings.find((s) => s.id === '4')).toEqual(mockPaymentReminderSetting);
    });

    it('should handle update errors', async () => {
      useSettingStore.setState({ settings: mockSettings });
      const errorMessage = 'Update failed';
      vi.mocked(settingService.update).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await useSettingStore.getState().updateSetting('1', updateData);
        } catch {
          // Expected
        }
      });

      expect(useSettingStore.getState().error?.message).toBe(errorMessage);
      expect(useSettingStore.getState().fetchStatus).toBe('error');
    });

    it('should throw error on update failure', async () => {
      vi.mocked(settingService.update).mockRejectedValue(new Error('Update failed'));

      await expect(useSettingStore.getState().updateSetting('1', updateData)).rejects.toThrow(
        'Update failed'
      );
    });

    it('should set generic error when error is not an Error instance', async () => {
      vi.mocked(settingService.update).mockRejectedValue('String error');

      await act(async () => {
        try {
          await useSettingStore.getState().updateSetting('1', updateData);
        } catch {
          // Expected
        }
      });

      expect(useSettingStore.getState().error?.message).toBe('Failed to update setting');
    });

    it('should update payment reminder config', async () => {
      useSettingStore.setState({ settings: mockSettings });

      const updatedPaymentReminder: DuePaymentReminderSetting = {
        ...mockPaymentReminderSetting,
        config: {
          ...mockPaymentReminderSetting.config,
          frequency: PaymentReminderFrequency.DAILY,
        },
      };

      vi.mocked(settingService.update).mockResolvedValue(updatedPaymentReminder);

      await act(async () => {
        // Note: BE requires full config object when updating, not partial
        await useSettingStore.getState().updateSetting('4', {
          config: {
            frequency: PaymentReminderFrequency.DAILY,
            remindDuePaymentLimit: mockPaymentReminderSetting.config.remindDuePaymentLimit,
            message: mockPaymentReminderSetting.config.message,
          },
        });
      });

      const { settings } = useSettingStore.getState();
      const setting = settings.find((s) => s.id === '4') as DuePaymentReminderSetting;
      expect(setting.config.frequency).toBe(PaymentReminderFrequency.DAILY);
    });
  });

  // ==================== deleteSetting Tests ====================
  describe('deleteSetting', () => {
    it('should remove setting from state', async () => {
      useSettingStore.setState({ settings: mockSettings });
      vi.mocked(settingService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useSettingStore.getState().deleteSetting('1');
      });

      expect(settingService.delete).toHaveBeenCalledWith('1');

      const { settings } = useSettingStore.getState();
      expect(settings.find((s) => s.id === '1')).toBeUndefined();
      expect(settings).toHaveLength(4);
    });

    it('should set loading status during deletion', async () => {
      useSettingStore.setState({ settings: mockSettings });
      let statusDuringRequest = '';

      vi.mocked(settingService.delete).mockImplementation(async () => {
        statusDuringRequest = useSettingStore.getState().fetchStatus;
        return undefined;
      });

      await act(async () => {
        await useSettingStore.getState().deleteSetting('1');
      });

      expect(statusDuringRequest).toBe('loading');
      expect(useSettingStore.getState().fetchStatus).toBe('success');
    });

    it('should preserve other settings when deleting one', async () => {
      useSettingStore.setState({ settings: mockSettings });
      vi.mocked(settingService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useSettingStore.getState().deleteSetting('1');
      });

      const { settings } = useSettingStore.getState();
      expect(settings.find((s) => s.id === '4')).toEqual(mockPaymentReminderSetting);
      expect(settings.find((s) => s.id === '5')).toEqual(mockNextSessionReminderSetting);
    });

    it('should handle deletion errors', async () => {
      useSettingStore.setState({ settings: mockSettings });
      const errorMessage = 'Delete failed';
      vi.mocked(settingService.delete).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await useSettingStore.getState().deleteSetting('1');
        } catch {
          // Expected
        }
      });

      expect(useSettingStore.getState().error?.message).toBe(errorMessage);
      expect(useSettingStore.getState().fetchStatus).toBe('error');
    });

    it('should throw error on deletion failure', async () => {
      vi.mocked(settingService.delete).mockRejectedValue(new Error('Delete failed'));

      await expect(useSettingStore.getState().deleteSetting('1')).rejects.toThrow('Delete failed');
    });

    it('should set generic error when error is not an Error instance', async () => {
      vi.mocked(settingService.delete).mockRejectedValue('String error');

      await act(async () => {
        try {
          await useSettingStore.getState().deleteSetting('1');
        } catch {
          // Expected
        }
      });

      expect(useSettingStore.getState().error?.message).toBe('Failed to delete setting');
    });

    it('should handle deleting non-existent setting gracefully', async () => {
      useSettingStore.setState({ settings: mockSettings });
      vi.mocked(settingService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useSettingStore.getState().deleteSetting('999');
      });

      // Settings should remain unchanged (filter doesn't find id '999')
      expect(useSettingStore.getState().settings).toHaveLength(5);
    });
  });

  // ==================== reset Tests ====================
  describe('reset', () => {
    it('should reset store to initial state', () => {
      useSettingStore.setState({
        settings: mockSettings,
        fetchStatus: 'success',
        error: new Error('Some error'),
        lastFetchTime: Date.now(),
      });

      useSettingStore.getState().reset();

      const state = useSettingStore.getState();
      expect(state.settings).toEqual([]);
      expect(state.fetchStatus).toBe('idle');
      expect(state.error).toBeNull();
      expect(state.lastFetchTime).toBeNull();
    });
  });

  // ==================== Selectors Tests ====================
  describe('Selectors', () => {
    beforeEach(() => {
      useSettingStore.setState({ settings: mockSettings });
    });

    describe('getDayOffSettings', () => {
      it('should filter only day off settings', () => {
        const state = useSettingStore.getState();
        const dayOffSettings = settingSelectors.getDayOffSettings(state);

        expect(dayOffSettings).toHaveLength(3);
        expect(dayOffSettings.every((s) => s.type === SettingType.DAY_OFF)).toBe(true);
      });

      it('should return empty array when no day off settings exist', () => {
        useSettingStore.setState({
          settings: [mockPaymentReminderSetting, mockNextSessionReminderSetting],
        });

        const state = useSettingStore.getState();
        const dayOffSettings = settingSelectors.getDayOffSettings(state);

        expect(dayOffSettings).toEqual([]);
      });

      it('should include both active and inactive day off settings', () => {
        const state = useSettingStore.getState();
        const dayOffSettings = settingSelectors.getDayOffSettings(state);

        const activeCount = dayOffSettings.filter((s) => s.active).length;
        const inactiveCount = dayOffSettings.filter((s) => !s.active).length;

        expect(activeCount).toBe(2);
        expect(inactiveCount).toBe(1);
      });
    });

    describe('getDuePaymentReminderSetting', () => {
      it('should return the due payment reminder setting', () => {
        const state = useSettingStore.getState();
        const reminder = settingSelectors.getDuePaymentReminderSetting(state);

        expect(reminder).toEqual(mockPaymentReminderSetting);
      });

      it('should return undefined when no payment reminder exists', () => {
        useSettingStore.setState({
          settings: [mockDayOffSetting, mockNextSessionReminderSetting],
        });

        const state = useSettingStore.getState();
        const reminder = settingSelectors.getDuePaymentReminderSetting(state);

        expect(reminder).toBeUndefined();
      });
    });

    describe('getNextSessionReminderSetting', () => {
      it('should return the next session reminder setting', () => {
        const state = useSettingStore.getState();
        const reminder = settingSelectors.getNextSessionReminderSetting(state);

        expect(reminder).toEqual(mockNextSessionReminderSetting);
      });

      it('should return undefined when no session reminder exists', () => {
        useSettingStore.setState({
          settings: [mockDayOffSetting, mockPaymentReminderSetting],
        });

        const state = useSettingStore.getState();
        const reminder = settingSelectors.getNextSessionReminderSetting(state);

        expect(reminder).toBeUndefined();
      });
    });

    describe('isDateBlocked', () => {
      it('should return true for date within day off range', () => {
        const state = useSettingStore.getState();
        // mockDayOffSetting: 2026-03-01 to 2026-03-01 (single day)
        const blockedDate = new Date('2026-03-01');

        const isBlocked = settingSelectors.isDateBlocked(state, blockedDate);

        expect(isBlocked).toBe(true);
      });

      it('should return true for date within multi-day range', () => {
        const state = useSettingStore.getState();
        // mockDayOffSetting2: 2026-03-15 to 2026-03-20
        const blockedDate = new Date('2026-03-17');

        const isBlocked = settingSelectors.isDateBlocked(state, blockedDate);

        expect(isBlocked).toBe(true);
      });

      it('should return true for start date of range', () => {
        const state = useSettingStore.getState();
        const startDate = new Date('2026-03-15');

        const isBlocked = settingSelectors.isDateBlocked(state, startDate);

        expect(isBlocked).toBe(true);
      });

      it('should return true for end date of range', () => {
        const state = useSettingStore.getState();
        const endDate = new Date('2026-03-20');

        const isBlocked = settingSelectors.isDateBlocked(state, endDate);

        expect(isBlocked).toBe(true);
      });

      it('should return false for date outside any day off range', () => {
        const state = useSettingStore.getState();
        const unblocked = new Date('2026-03-10');

        const isBlocked = settingSelectors.isDateBlocked(state, unblocked);

        expect(isBlocked).toBe(false);
      });

      it('should return false for date in inactive day off range', () => {
        const state = useSettingStore.getState();
        // mockInactiveDayOffSetting: 2026-04-01 to 2026-04-05 (inactive)
        const dateInInactiveRange = new Date('2026-04-03');

        const isBlocked = settingSelectors.isDateBlocked(state, dateInInactiveRange);

        expect(isBlocked).toBe(false);
      });

      it('should return false when no day off settings exist', () => {
        useSettingStore.setState({
          settings: [mockPaymentReminderSetting],
        });

        const state = useSettingStore.getState();
        const anyDate = new Date('2026-03-01');

        const isBlocked = settingSelectors.isDateBlocked(state, anyDate);

        expect(isBlocked).toBe(false);
      });

      it('should return false when settings array is empty', () => {
        useSettingStore.setState({ settings: [] });

        const state = useSettingStore.getState();
        const anyDate = new Date('2026-03-01');

        const isBlocked = settingSelectors.isDateBlocked(state, anyDate);

        expect(isBlocked).toBe(false);
      });

      it('should correctly handle date with time component', () => {
        const state = useSettingStore.getState();
        // Date with time component should still match the day
        // Using a date within mockDayOffSetting2 range (2026-03-15 to 2026-03-20)
        // to avoid timezone edge cases with single-day ranges
        const dateWithTime = new Date('2026-03-17T14:30:00');

        const isBlocked = settingSelectors.isDateBlocked(state, dateWithTime);

        expect(isBlocked).toBe(true);
      });

      it('should check against multiple day off settings', () => {
        const state = useSettingStore.getState();

        // Date in first range
        expect(settingSelectors.isDateBlocked(state, new Date('2026-03-01'))).toBe(true);

        // Date in second range
        expect(settingSelectors.isDateBlocked(state, new Date('2026-03-18'))).toBe(true);

        // Date between ranges (not blocked)
        expect(settingSelectors.isDateBlocked(state, new Date('2026-03-10'))).toBe(false);
      });
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('should handle empty settings list gracefully', async () => {
      vi.mocked(settingService.getAll).mockResolvedValue([]);

      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      expect(useSettingStore.getState().settings).toEqual([]);
    });

    it('should handle concurrent operations correctly', async () => {
      useSettingStore.setState({ settings: mockSettings });

      const newSetting: DayOffSetting = {
        id: '10',
        type: SettingType.DAY_OFF,
        active: true,
        config: { fromDate: '2026-07-01', toDate: '2026-07-01' },
      };

      vi.mocked(settingService.create).mockResolvedValue(newSetting);
      vi.mocked(settingService.delete).mockResolvedValue(undefined);

      // Run create and delete concurrently
      await act(async () => {
        await Promise.all([
          useSettingStore.getState().createSetting({
            type: SettingType.DAY_OFF,
            active: true,
            config: { fromDate: '2026-07-01', toDate: '2026-07-01' },
          }),
          useSettingStore.getState().deleteSetting('1'),
        ]);
      });

      // Both operations should have been called
      expect(settingService.create).toHaveBeenCalledTimes(1);
      expect(settingService.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle settings with special characters in description', async () => {
      const settingWithSpecialChars: DayOffSetting = {
        id: '11',
        type: SettingType.DAY_OFF,
        active: true,
        config: { fromDate: '2026-08-01', toDate: '2026-08-01' },
        description: 'Test with "quotes" & <special> chars',
      };

      vi.mocked(settingService.create).mockResolvedValue(settingWithSpecialChars);

      await act(async () => {
        await useSettingStore.getState().createSetting({
          type: SettingType.DAY_OFF,
          active: true,
          config: { fromDate: '2026-08-01', toDate: '2026-08-01' },
          description: 'Test with "quotes" & <special> chars',
        });
      });

      const { settings } = useSettingStore.getState();
      expect(settings[0].description).toBe('Test with "quotes" & <special> chars');
    });

    it('should preserve fetchStatus on successful operations', async () => {
      vi.mocked(settingService.getAll).mockResolvedValue(mockSettings);

      await act(async () => {
        await useSettingStore.getState().fetchSettings();
      });

      expect(useSettingStore.getState().fetchStatus).toBe('success');

      // Create should also end in success
      const newSetting: DayOffSetting = {
        id: '12',
        type: SettingType.DAY_OFF,
        active: true,
        config: { fromDate: '2026-09-01', toDate: '2026-09-01' },
      };

      vi.mocked(settingService.create).mockResolvedValue(newSetting);

      await act(async () => {
        await useSettingStore.getState().createSetting({
          type: SettingType.DAY_OFF,
          active: true,
          config: { fromDate: '2026-09-01', toDate: '2026-09-01' },
        });
      });

      expect(useSettingStore.getState().fetchStatus).toBe('success');
    });
  });
});
