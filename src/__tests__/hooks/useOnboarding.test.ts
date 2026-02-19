import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOnboarding } from '../../lib/hooks/useOnboarding';
import { useOnboardingStore } from '../../lib/stores/onboarding.store';
import type { TipContext } from '../../lib/types/onboarding.types';

// Mock the onboarding store
vi.mock('../../lib/stores/onboarding.store', () => ({
  useOnboardingStore: vi.fn(),
}));

describe('useOnboarding', () => {
  // Mock store functions
  const mockCompleteOnboarding = vi.fn();
  const mockResetOnboarding = vi.fn();
  const mockDismissTip = vi.fn();
  const mockIsTipDismissed = vi.fn();
  const mockRestoreTip = vi.fn();
  const mockRestoreAllTips = vi.fn();
  const mockUpdateSeenVersion = vi.fn();

  // Default mock store state
  const defaultMockState = {
    hasCompletedOnboarding: false,
    onboardingCompletedAt: undefined as string | undefined,
    dismissedTips: [] as string[],
    lastSeenVersion: undefined as string | undefined,
    completeOnboarding: mockCompleteOnboarding,
    resetOnboarding: mockResetOnboarding,
    dismissTip: mockDismissTip,
    isTipDismissed: mockIsTipDismissed,
    restoreTip: mockRestoreTip,
    restoreAllTips: mockRestoreAllTips,
    updateSeenVersion: mockUpdateSeenVersion,
  };

  // Helper to setup store mock
  const setupStoreMock = (overrides: Partial<typeof defaultMockState> = {}) => {
    const state = { ...defaultMockState, ...overrides };
    vi.mocked(useOnboardingStore).mockReturnValue(state);
    return state;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTipDismissed.mockReturnValue(false);
    setupStoreMock();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== State Return Values Tests ====================
  describe('State Return Values', () => {
    it('returns hasCompletedOnboarding false from store', () => {
      setupStoreMock({ hasCompletedOnboarding: false });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.hasCompletedOnboarding).toBe(false);
    });

    it('returns hasCompletedOnboarding true from store', () => {
      setupStoreMock({ hasCompletedOnboarding: true });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.hasCompletedOnboarding).toBe(true);
    });

    it('returns onboardingCompletedAt undefined when not completed', () => {
      setupStoreMock({ onboardingCompletedAt: undefined });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.onboardingCompletedAt).toBeUndefined();
    });

    it('returns onboardingCompletedAt when completed', () => {
      const completedAt = '2024-01-15T10:00:00.000Z';
      setupStoreMock({ onboardingCompletedAt: completedAt });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.onboardingCompletedAt).toBe(completedAt);
    });

    it('returns empty dismissedTips array', () => {
      setupStoreMock({ dismissedTips: [] });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.dismissedTips).toEqual([]);
    });

    it('returns dismissedTips array with values', () => {
      const dismissedTips = ['tip-1', 'tip-2', 'agenda-empty'];
      setupStoreMock({ dismissedTips });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.dismissedTips).toEqual(dismissedTips);
      expect(result.current.dismissedTips).toHaveLength(3);
    });

    it('returns lastSeenVersion undefined', () => {
      setupStoreMock({ lastSeenVersion: undefined });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.lastSeenVersion).toBeUndefined();
    });

    it('returns lastSeenVersion when set', () => {
      setupStoreMock({ lastSeenVersion: '1.0.0' });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.lastSeenVersion).toBe('1.0.0');
    });
  });

  // ==================== shouldShowTip Helper Tests ====================
  describe('shouldShowTip', () => {
    it('returns true when tip is not dismissed', () => {
      mockIsTipDismissed.mockReturnValue(false);
      setupStoreMock({ isTipDismissed: mockIsTipDismissed });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.shouldShowTip('agenda-empty')).toBe(true);
    });

    it('returns false when tip is dismissed', () => {
      mockIsTipDismissed.mockReturnValue(true);
      setupStoreMock({ isTipDismissed: mockIsTipDismissed });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.shouldShowTip('agenda-empty')).toBe(false);
    });

    it('checks correct tipId with store', () => {
      mockIsTipDismissed.mockReturnValue(false);
      setupStoreMock({ isTipDismissed: mockIsTipDismissed });

      const { result } = renderHook(() => useOnboarding());

      result.current.shouldShowTip('pacientes-empty');

      expect(mockIsTipDismissed).toHaveBeenCalledWith('pacientes-empty');
    });
  });

  // ==================== shouldShowOnboarding Helper Tests ====================
  describe('shouldShowOnboarding', () => {
    it('returns true when onboarding not completed', () => {
      setupStoreMock({ hasCompletedOnboarding: false });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.shouldShowOnboarding()).toBe(true);
    });

    it('returns false when onboarding completed', () => {
      setupStoreMock({ hasCompletedOnboarding: true });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.shouldShowOnboarding()).toBe(false);
    });
  });

  // ==================== getTipId Helper Tests ====================
  describe('getTipId', () => {
    it('returns context only when no suffix', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.getTipId('agenda')).toBe('agenda');
    });

    it('returns context with suffix when provided', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.getTipId('agenda', 'first-visit')).toBe(
        'agenda-first-visit'
      );
    });

    it('handles various tip contexts', () => {
      const { result } = renderHook(() => useOnboarding());

      const contexts: TipContext[] = [
        'agenda',
        'agenda-empty',
        'agenda-no-calendar',
        'pacientes',
        'pacientes-empty',
        'cobros',
        'cobros-empty',
        'config',
        'ficha-clinica',
        'ficha-no-notes',
        'global',
      ];

      contexts.forEach((context) => {
        expect(result.current.getTipId(context)).toBe(context);
      });
    });

    it('generates unique tip ids with different suffixes', () => {
      const { result } = renderHook(() => useOnboarding());

      const id1 = result.current.getTipId('agenda', 'suffix1');
      const id2 = result.current.getTipId('agenda', 'suffix2');

      expect(id1).not.toBe(id2);
      expect(id1).toBe('agenda-suffix1');
      expect(id2).toBe('agenda-suffix2');
    });
  });

  // ==================== isTipDismissed Tests ====================
  describe('isTipDismissed', () => {
    it('calls store isTipDismissed with correct tipId', () => {
      mockIsTipDismissed.mockReturnValue(true);
      setupStoreMock({ isTipDismissed: mockIsTipDismissed });

      const { result } = renderHook(() => useOnboarding());

      const isDismissed = result.current.isTipDismissed('test-tip');

      expect(mockIsTipDismissed).toHaveBeenCalledWith('test-tip');
      expect(isDismissed).toBe(true);
    });

    it('returns false when tip not dismissed', () => {
      mockIsTipDismissed.mockReturnValue(false);
      setupStoreMock({ isTipDismissed: mockIsTipDismissed });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.isTipDismissed('new-tip')).toBe(false);
    });
  });

  // ==================== Action Functions Tests ====================
  describe('Action Functions', () => {
    describe('completeOnboarding', () => {
      it('calls store completeOnboarding action', () => {
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.completeOnboarding();
        });

        expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
      });
    });

    describe('resetOnboarding', () => {
      it('calls store resetOnboarding action', () => {
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.resetOnboarding();
        });

        expect(mockResetOnboarding).toHaveBeenCalledTimes(1);
      });
    });

    describe('dismissTip', () => {
      it('calls store dismissTip action with tipId', () => {
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.dismissTip('agenda-empty');
        });

        expect(mockDismissTip).toHaveBeenCalledWith('agenda-empty');
        expect(mockDismissTip).toHaveBeenCalledTimes(1);
      });

      it('can dismiss multiple tips', () => {
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.dismissTip('tip-1');
          result.current.dismissTip('tip-2');
          result.current.dismissTip('tip-3');
        });

        expect(mockDismissTip).toHaveBeenCalledTimes(3);
        expect(mockDismissTip).toHaveBeenCalledWith('tip-1');
        expect(mockDismissTip).toHaveBeenCalledWith('tip-2');
        expect(mockDismissTip).toHaveBeenCalledWith('tip-3');
      });
    });

    describe('restoreTip', () => {
      it('calls store restoreTip action with tipId', () => {
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.restoreTip('agenda-empty');
        });

        expect(mockRestoreTip).toHaveBeenCalledWith('agenda-empty');
        expect(mockRestoreTip).toHaveBeenCalledTimes(1);
      });
    });

    describe('restoreAllTips', () => {
      it('calls store restoreAllTips action', () => {
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.restoreAllTips();
        });

        expect(mockRestoreAllTips).toHaveBeenCalledTimes(1);
      });
    });

    describe('updateSeenVersion', () => {
      it('calls store updateSeenVersion action', () => {
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.updateSeenVersion();
        });

        expect(mockUpdateSeenVersion).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ==================== Hook Interface Tests ====================
  describe('Hook Interface', () => {
    it('returns all expected properties', () => {
      const { result } = renderHook(() => useOnboarding());

      // State values
      expect(result.current).toHaveProperty('hasCompletedOnboarding');
      expect(result.current).toHaveProperty('onboardingCompletedAt');
      expect(result.current).toHaveProperty('dismissedTips');
      expect(result.current).toHaveProperty('lastSeenVersion');

      // Actions
      expect(result.current).toHaveProperty('completeOnboarding');
      expect(result.current).toHaveProperty('resetOnboarding');
      expect(result.current).toHaveProperty('dismissTip');
      expect(result.current).toHaveProperty('restoreTip');
      expect(result.current).toHaveProperty('restoreAllTips');
      expect(result.current).toHaveProperty('updateSeenVersion');

      // Helpers
      expect(result.current).toHaveProperty('shouldShowTip');
      expect(result.current).toHaveProperty('shouldShowOnboarding');
      expect(result.current).toHaveProperty('getTipId');
      expect(result.current).toHaveProperty('isTipDismissed');
    });

    it('functions are callable', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(typeof result.current.completeOnboarding).toBe('function');
      expect(typeof result.current.resetOnboarding).toBe('function');
      expect(typeof result.current.dismissTip).toBe('function');
      expect(typeof result.current.restoreTip).toBe('function');
      expect(typeof result.current.restoreAllTips).toBe('function');
      expect(typeof result.current.updateSeenVersion).toBe('function');
      expect(typeof result.current.shouldShowTip).toBe('function');
      expect(typeof result.current.shouldShowOnboarding).toBe('function');
      expect(typeof result.current.getTipId).toBe('function');
      expect(typeof result.current.isTipDismissed).toBe('function');
    });
  });

  // ==================== Workflow Tests ====================
  describe('Workflow Tests', () => {
    it('complete onboarding workflow', () => {
      // Start with incomplete onboarding
      setupStoreMock({
        hasCompletedOnboarding: false,
        dismissedTips: [],
      });

      const { result } = renderHook(() => useOnboarding());

      // User should see onboarding
      expect(result.current.shouldShowOnboarding()).toBe(true);

      // User completes onboarding
      act(() => {
        result.current.completeOnboarding();
      });

      expect(mockCompleteOnboarding).toHaveBeenCalled();
    });

    it('tip dismissal workflow', () => {
      mockIsTipDismissed
        .mockReturnValueOnce(false) // First call - not dismissed
        .mockReturnValueOnce(true); // After dismiss - dismissed

      setupStoreMock({ isTipDismissed: mockIsTipDismissed });

      const { result } = renderHook(() => useOnboarding());

      // Tip should be shown initially
      expect(result.current.shouldShowTip('agenda-empty')).toBe(true);

      // User dismisses tip
      act(() => {
        result.current.dismissTip('agenda-empty');
      });

      expect(mockDismissTip).toHaveBeenCalledWith('agenda-empty');
    });

    it('restore tips workflow', () => {
      setupStoreMock({
        dismissedTips: ['tip-1', 'tip-2', 'tip-3'],
      });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.dismissedTips).toHaveLength(3);

      // Restore a single tip
      act(() => {
        result.current.restoreTip('tip-1');
      });

      expect(mockRestoreTip).toHaveBeenCalledWith('tip-1');

      // Restore all tips
      act(() => {
        result.current.restoreAllTips();
      });

      expect(mockRestoreAllTips).toHaveBeenCalled();
    });

    it('reset onboarding workflow', () => {
      setupStoreMock({
        hasCompletedOnboarding: true,
        onboardingCompletedAt: '2024-01-15T10:00:00.000Z',
        lastSeenVersion: '1.0.0',
      });

      const { result } = renderHook(() => useOnboarding());

      // User resets onboarding (e.g., "Ver tutorial de nuevo")
      act(() => {
        result.current.resetOnboarding();
      });

      expect(mockResetOnboarding).toHaveBeenCalled();
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('handles empty string tipId', () => {
      mockIsTipDismissed.mockReturnValue(false);
      setupStoreMock({ isTipDismissed: mockIsTipDismissed });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.shouldShowTip('')).toBe(true);
      expect(mockIsTipDismissed).toHaveBeenCalledWith('');
    });

    it('handles special characters in tipId', () => {
      mockIsTipDismissed.mockReturnValue(false);
      setupStoreMock({ isTipDismissed: mockIsTipDismissed });

      const { result } = renderHook(() => useOnboarding());

      const specialTipId = 'tip-with-special-chars-123_áéí';
      result.current.shouldShowTip(specialTipId);

      expect(mockIsTipDismissed).toHaveBeenCalledWith(specialTipId);
    });

    it('getTipId with empty suffix', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.getTipId('agenda', '')).toBe('agenda');
    });

    it('handles large dismissedTips array', () => {
      const manyTips = Array.from({ length: 100 }, (_, i) => `tip-${i}`);
      setupStoreMock({ dismissedTips: manyTips });

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.dismissedTips).toHaveLength(100);
    });
  });
});
