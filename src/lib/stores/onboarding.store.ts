import { create } from 'zustand';
import { 
  ONBOARDING_STORAGE_KEY, 
  ONBOARDING_VERSION,
  type OnboardingState 
} from '../types/onboarding.types';

/**
 * Estado por defecto del onboarding
 */
const defaultState: OnboardingState = {
  hasCompletedOnboarding: false,
  dismissedTips: [],
  lastSeenVersion: undefined,
  onboardingCompletedAt: undefined,
};

/**
 * Cargar estado desde localStorage
 */
const loadFromStorage = (): OnboardingState => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as OnboardingState;
      return { ...defaultState, ...parsed };
    }
  } catch (error) {
    console.warn('Error loading onboarding state from localStorage:', error);
  }
  return defaultState;
};

/**
 * Guardar estado en localStorage
 */
const saveToStorage = (state: OnboardingState): void => {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Error saving onboarding state to localStorage:', error);
  }
};

/**
 * Acciones del store de onboarding
 */
interface OnboardingActions {
  /** Completar el onboarding */
  completeOnboarding: () => void;
  /** Resetear el onboarding (para testing o "ver tutorial de nuevo") */
  resetOnboarding: () => void;
  /** Descartar un tip específico */
  dismissTip: (tipId: string) => void;
  /** Verificar si un tip fue descartado */
  isTipDismissed: (tipId: string) => boolean;
  /** Restaurar un tip descartado */
  restoreTip: (tipId: string) => void;
  /** Restaurar todos los tips */
  restoreAllTips: () => void;
  /** Actualizar la versión vista */
  updateSeenVersion: () => void;
}

/**
 * Store completo
 */
type OnboardingStore = OnboardingState & OnboardingActions;

/**
 * Store de Onboarding
 * 
 * Maneja el estado del tutorial inicial y los tips contextuales.
 * Persiste en localStorage y está preparado para migrar a backend.
 */
export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // Estado inicial desde localStorage
  ...loadFromStorage(),

  completeOnboarding: () => {
    const newState: OnboardingState = {
      ...get(),
      hasCompletedOnboarding: true,
      onboardingCompletedAt: new Date().toISOString(),
      lastSeenVersion: ONBOARDING_VERSION,
    };
    saveToStorage(newState);
    set(newState);
  },

  resetOnboarding: () => {
    const newState: OnboardingState = {
      ...defaultState,
      dismissedTips: get().dismissedTips, // Mantener tips descartados
    };
    saveToStorage(newState);
    set(newState);
  },

  dismissTip: (tipId: string) => {
    const currentDismissed = get().dismissedTips;
    if (currentDismissed.includes(tipId)) return;
    
    const newState: OnboardingState = {
      ...get(),
      dismissedTips: [...currentDismissed, tipId],
    };
    saveToStorage(newState);
    set(newState);
  },

  isTipDismissed: (tipId: string) => {
    return get().dismissedTips.includes(tipId);
  },

  restoreTip: (tipId: string) => {
    const newState: OnboardingState = {
      ...get(),
      dismissedTips: get().dismissedTips.filter(id => id !== tipId),
    };
    saveToStorage(newState);
    set(newState);
  },

  restoreAllTips: () => {
    const newState: OnboardingState = {
      ...get(),
      dismissedTips: [],
    };
    saveToStorage(newState);
    set(newState);
  },

  updateSeenVersion: () => {
    const newState: OnboardingState = {
      ...get(),
      lastSeenVersion: ONBOARDING_VERSION,
    };
    saveToStorage(newState);
    set(newState);
  },
}));
