import type { LucideIcon } from 'lucide-react';

/**
 * Estado persistido del onboarding del usuario
 */
export interface OnboardingState {
  /** Si el usuario completó el onboarding inicial */
  hasCompletedOnboarding: boolean;
  /** Fecha en que completó el onboarding */
  onboardingCompletedAt?: string;
  /** IDs de tips que el usuario ha descartado */
  dismissedTips: string[];
  /** Versión de la app cuando vio el onboarding (para "what's new") */
  lastSeenVersion?: string;
}

/**
 * Un paso individual del onboarding
 */
export interface OnboardingStepData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Imagen o ilustración opcional */
  image?: string;
  /** Acción principal del paso */
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Acción secundaria (ej: "Omitir") */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Contextos donde pueden aparecer tips
 */
export type TipContext = 
  | 'agenda' 
  | 'agenda-empty'
  | 'agenda-no-calendar'
  | 'pacientes' 
  | 'pacientes-empty'
  | 'cobros' 
  | 'cobros-empty'
  | 'config'
  | 'ficha-clinica'
  | 'ficha-no-notes'
  | 'global';

/**
 * Un tip contextual que aparece en la UI
 */
export interface HelpTip {
  id: string;
  context: TipContext;
  title: string;
  description: string;
  /** Texto del botón de acción */
  actionLabel?: string;
  /** Callback cuando se hace click en la acción */
  onAction?: () => void;
  /** Si el tip puede ser descartado permanentemente */
  dismissible?: boolean;
  /** Icono del tip */
  icon?: LucideIcon;
  /** Variante visual */
  variant?: 'info' | 'warning' | 'success';
}

/**
 * Sección del centro de ayuda
 */
export interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Items dentro de la sección */
  items: HelpItem[];
}

/**
 * Item individual de ayuda
 */
export interface HelpItem {
  id: string;
  title: string;
  content: string;
  /** Tags para búsqueda */
  tags?: string[];
}

/**
 * Constantes para localStorage keys
 */
export const ONBOARDING_STORAGE_KEY = 'lavenius_onboarding';
export const ONBOARDING_VERSION = '1.0.0';
