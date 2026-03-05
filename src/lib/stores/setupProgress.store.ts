import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Setup Progress Store
 * Tracks user's onboarding setup completion status
 * Persists to localStorage for user convenience
 */

// Setup step identifiers
export type SetupStepId =
  | 'configureProfile'
  | 'connectCalendar'
  | 'addFirstPatient'
  | 'scheduleFirstSession'
  | 'registerFirstPayment';

export interface SetupStep {
  id: SetupStepId;
  completed: boolean;
  completedAt?: string;
}

interface SetupProgressState {
  steps: SetupStep[];
  isDismissed: boolean;
  dismissedAt?: string;
}

interface SetupProgressActions {
  markStepComplete: (id: SetupStepId) => void;
  markStepIncomplete: (id: SetupStepId) => void;
  dismissCard: () => void;
  showCard: () => void;
  resetProgress: () => void;
  getProgress: () => { completed: number; total: number; percentage: number };
  isStepComplete: (id: SetupStepId) => boolean;
  isAllComplete: () => boolean;
  /** Sync progress based on existing data counts */
  syncFromData: (data: {
    hasPatients: boolean;
    hasSessions: boolean;
    hasPayments: boolean;
    hasProfile: boolean;
    hasCalendar: boolean;
  }) => void;
}

const DEFAULT_STEPS: SetupStep[] = [
  { id: 'configureProfile', completed: false },
  { id: 'connectCalendar', completed: false },
  { id: 'addFirstPatient', completed: false },
  { id: 'scheduleFirstSession', completed: false },
  { id: 'registerFirstPayment', completed: false },
];

const initialState: SetupProgressState = {
  steps: DEFAULT_STEPS,
  isDismissed: false,
};

export const useSetupProgressStore = create<
  SetupProgressState & SetupProgressActions
>()(
  persist(
    (set, get) => ({
      ...initialState,

      markStepComplete: (id: SetupStepId) => {
        set((state) => ({
          steps: state.steps.map((step) =>
            step.id === id
              ? { ...step, completed: true, completedAt: new Date().toISOString() }
              : step
          ),
        }));
      },

      markStepIncomplete: (id: SetupStepId) => {
        set((state) => ({
          steps: state.steps.map((step) =>
            step.id === id
              ? { ...step, completed: false, completedAt: undefined }
              : step
          ),
        }));
      },

      dismissCard: () => {
        set({
          isDismissed: true,
          dismissedAt: new Date().toISOString(),
        });
      },

      showCard: () => {
        set({
          isDismissed: false,
          dismissedAt: undefined,
        });
      },

      resetProgress: () => {
        set({
          steps: DEFAULT_STEPS,
          isDismissed: false,
          dismissedAt: undefined,
        });
      },

      getProgress: () => {
        const { steps } = get();
        const completed = steps.filter((s) => s.completed).length;
        const total = steps.length;
        const percentage = Math.round((completed / total) * 100);
        return { completed, total, percentage };
      },

      isStepComplete: (id: SetupStepId) => {
        const { steps } = get();
        return steps.find((s) => s.id === id)?.completed ?? false;
      },

      isAllComplete: () => {
        const { steps } = get();
        return steps.every((s) => s.completed);
      },

      syncFromData: ({ hasPatients, hasSessions, hasPayments, hasProfile, hasCalendar }) => {
        set((state) => ({
          steps: state.steps.map((step) => {
            // Only mark as complete if not already complete
            if (step.completed) return step;
            
            let shouldComplete = false;
            switch (step.id) {
              case 'configureProfile':
                shouldComplete = hasProfile;
                break;
              case 'connectCalendar':
                shouldComplete = hasCalendar;
                break;
              case 'addFirstPatient':
                shouldComplete = hasPatients;
                break;
              case 'scheduleFirstSession':
                shouldComplete = hasSessions;
                break;
              case 'registerFirstPayment':
                shouldComplete = hasPayments;
                break;
            }
            
            return shouldComplete
              ? { ...step, completed: true, completedAt: new Date().toISOString() }
              : step;
          }),
        }));
      },
    }),
    {
      name: 'lavenius-setup-progress',
      version: 1,
    }
  )
);

// ============================================================================
// HOOKS - Convenient hooks for common use cases
// ============================================================================

/**
 * Hook to get setup progress percentage
 */
export const useSetupProgress = () => {
  return useSetupProgressStore((state) => {
    const completed = state.steps.filter((s) => s.completed).length;
    const total = state.steps.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  });
};

/**
 * Hook to check if setup card should be visible
 * Shows if not dismissed AND not 100% complete
 */
export const useShowSetupCard = () => {
  return useSetupProgressStore((state) => {
    const allComplete = state.steps.every((s) => s.completed);
    return !state.isDismissed && !allComplete;
  });
};
