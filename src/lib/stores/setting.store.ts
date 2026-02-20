import { create } from 'zustand';
import { settingService } from '../services/setting.service';
import type {
  Setting,
  CreateSettingDto,
  DayOffConfig,
  DayOffSetting,
  DuePaymentReminderSetting,
  NextSessionReminderSetting,
  UpdateSettingDto,
} from '../types/setting.types';
import {
  SettingType,
  isDayOffSetting,
  isDuePaymentReminderSetting,
  isNextSessionReminderSetting,
} from '../types/setting.types';

/**
 * Setting Store - Manages therapist settings
 * 
 * Data flow:
 * 1. fetchSettings() loads settings from /settings endpoint
 * 2. Settings are cached for 30 seconds
 * 3. Selectors filter settings by type
 * 
 * Request deduplication:
 * - Uses fetchStatus to prevent concurrent duplicate requests
 * - lastFetchTime enables smart refresh decisions
 */

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

// Cache duration: 30 seconds
const CACHE_DURATION = 30 * 1000;

interface SettingState {
  settings: Setting[];
  fetchStatus: FetchStatus;
  error: Error | null;
  lastFetchTime: number | null;
}

interface SettingActions {
  fetchSettings: (force?: boolean) => Promise<void>;
  createSetting: (data: CreateSettingDto) => Promise<Setting>;
  createDayOff: (config: DayOffConfig, description?: string) => Promise<Setting>;
  updateSetting: (id: string, data: UpdateSettingDto) => Promise<Setting>;
  deleteSetting: (id: string) => Promise<void>;
  reset: () => void;
}

const initialState: SettingState = {
  settings: [],
  fetchStatus: 'idle',
  error: null,
  lastFetchTime: null,
};

export const useSettingStore = create<SettingState & SettingActions>((set, get) => ({
  ...initialState,

  fetchSettings: async (force = false) => {
    const { fetchStatus, lastFetchTime } = get();

    // Prevent duplicate concurrent requests
    if (fetchStatus === 'loading') {
      return;
    }

    // Use cache if valid and not forced
    if (!force && lastFetchTime && Date.now() - lastFetchTime < CACHE_DURATION) {
      return;
    }

    set({ fetchStatus: 'loading', error: null });

    try {
      const settings = await settingService.getAll();

      set({
        settings,
        fetchStatus: 'success',
        lastFetchTime: Date.now(),
      });
    } catch (error) {
      console.error('[SettingStore] Fetch error:', error);
      set({
        error: error instanceof Error ? error : new Error('Failed to fetch settings'),
        fetchStatus: 'error',
      });
      throw error;
    }
  },

  createSetting: async (data: CreateSettingDto) => {
    set({ fetchStatus: 'loading', error: null });
    try {
      const newSetting = await settingService.create(data);

      set((state) => ({
        settings: [...state.settings, newSetting],
        fetchStatus: 'success',
      }));

      return newSetting;
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to create setting'),
        fetchStatus: 'error',
      });
      throw error;
    }
  },

  createDayOff: async (config: DayOffConfig, description?: string) => {
    const data: CreateSettingDto = {
      type: SettingType.DAY_OFF,
      config,
      active: true,
      description,
    };

    return get().createSetting(data);
  },

  updateSetting: async (id: string, data: UpdateSettingDto) => {
    set({ fetchStatus: 'loading', error: null });
    try {
      const updatedSetting = await settingService.update(id, data);

      set((state) => ({
        settings: state.settings.map((s) => (s.id === id ? updatedSetting : s)),
        fetchStatus: 'success',
      }));

      return updatedSetting;
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to update setting'),
        fetchStatus: 'error',
      });
      throw error;
    }
  },

  deleteSetting: async (id: string) => {
    set({ fetchStatus: 'loading', error: null });
    try {
      await settingService.delete(id);

      set((state) => ({
        settings: state.settings.filter((s) => s.id !== id),
        fetchStatus: 'success',
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to delete setting'),
        fetchStatus: 'error',
      });
      throw error;
    }
  },

  reset: () => set(initialState),
}));

// ============================================================================
// SELECTORS - Pure functions for derived data
// ============================================================================

export const settingSelectors = {
  /**
   * Get all day off settings
   */
  getDayOffSettings: (state: SettingState): DayOffSetting[] => {
    return state.settings.filter(isDayOffSetting);
  },

  /**
   * Get due payment reminder setting (there should be only one)
   */
  getDuePaymentReminderSetting: (state: SettingState): DuePaymentReminderSetting | undefined => {
    return state.settings.find(isDuePaymentReminderSetting);
  },

  /**
   * Get next session reminder setting (there should be only one)
   */
  getNextSessionReminderSetting: (state: SettingState): NextSessionReminderSetting | undefined => {
    return state.settings.find(isNextSessionReminderSetting);
  },

  /**
   * Check if a given date falls within any active day off period
   * @param state - The setting state
   * @param date - The date to check
   * @returns true if the date is blocked by a day off setting
   */
  isDateBlocked: (state: SettingState, date: Date): boolean => {
    const dayOffSettings = state.settings.filter(isDayOffSetting);

    // Normalize the input date to start of day for comparison
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const checkTime = checkDate.getTime();

    return dayOffSettings.some((setting) => {
      if (!setting.active) {
        return false;
      }

      const fromDate = new Date(setting.config.fromDate);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(setting.config.toDate);
      toDate.setHours(23, 59, 59, 999);

      return checkTime >= fromDate.getTime() && checkTime <= toDate.getTime();
    });
  },
};
