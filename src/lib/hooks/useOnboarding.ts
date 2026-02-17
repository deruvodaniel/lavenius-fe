import { useOnboardingStore } from '../stores/onboarding.store';
import type { TipContext } from '../types/onboarding.types';

/**
 * Hook para acceder al estado y acciones del onboarding
 * 
 * @example
 * ```tsx
 * const { 
 *   hasCompletedOnboarding, 
 *   completeOnboarding,
 *   shouldShowTip 
 * } = useOnboarding();
 * ```
 */
export const useOnboarding = () => {
  const store = useOnboardingStore();

  /**
   * Verifica si se debe mostrar un tip específico
   * Retorna false si el tip fue descartado
   */
  const shouldShowTip = (tipId: string): boolean => {
    return !store.isTipDismissed(tipId);
  };

  /**
   * Genera un ID único para un tip basado en contexto
   */
  const getTipId = (context: TipContext, suffix?: string): string => {
    return suffix ? `${context}-${suffix}` : context;
  };

  /**
   * Verifica si el usuario debería ver el onboarding
   * (no lo ha completado o hay nueva versión)
   */
  const shouldShowOnboarding = (): boolean => {
    return !store.hasCompletedOnboarding;
  };

  return {
    // Estado
    hasCompletedOnboarding: store.hasCompletedOnboarding,
    onboardingCompletedAt: store.onboardingCompletedAt,
    dismissedTips: store.dismissedTips,
    lastSeenVersion: store.lastSeenVersion,

    // Acciones
    completeOnboarding: store.completeOnboarding,
    resetOnboarding: store.resetOnboarding,
    dismissTip: store.dismissTip,
    restoreTip: store.restoreTip,
    restoreAllTips: store.restoreAllTips,
    updateSeenVersion: store.updateSeenVersion,

    // Helpers
    shouldShowTip,
    shouldShowOnboarding,
    getTipId,
    isTipDismissed: store.isTipDismissed,
  };
};

export default useOnboarding;
