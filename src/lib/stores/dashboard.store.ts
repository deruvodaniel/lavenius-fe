import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Dashboard Settings Store
 * Manages user preferences for dashboard section visibility and order
 * Persists to localStorage for user convenience
 */

// Dashboard section identifiers
export type DashboardSectionId =
  | 'todaySummary'
  | 'quickActions'
  | 'statCards'
  | 'pendingPayments'
  | 'birthdays'
  | 'patientsWithoutSession'
  | 'charts';

// Default section order and visibility
const DEFAULT_SECTIONS: DashboardSectionId[] = [
  'todaySummary',
  'quickActions',
  'statCards',
  'pendingPayments',
  'birthdays',
  'patientsWithoutSession',
  'charts',
];

interface DashboardSection {
  id: DashboardSectionId;
  visible: boolean;
}

interface DashboardSettingsState {
  sections: DashboardSection[];
  isSettingsOpen: boolean;
}

interface DashboardSettingsActions {
  toggleSectionVisibility: (id: DashboardSectionId) => void;
  setSectionVisibility: (id: DashboardSectionId, visible: boolean) => void;
  reorderSections: (sections: DashboardSectionId[]) => void;
  resetToDefaults: () => void;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;
}

const getDefaultSections = (): DashboardSection[] =>
  DEFAULT_SECTIONS.map((id) => ({ id, visible: true }));

const initialState: DashboardSettingsState = {
  sections: getDefaultSections(),
  isSettingsOpen: false,
};

export const useDashboardSettingsStore = create<
  DashboardSettingsState & DashboardSettingsActions
>()(
  persist(
    (set, get) => ({
      ...initialState,

      toggleSectionVisibility: (id: DashboardSectionId) => {
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === id
              ? { ...section, visible: !section.visible }
              : section
          ),
        }));
      },

      setSectionVisibility: (id: DashboardSectionId, visible: boolean) => {
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === id ? { ...section, visible } : section
          ),
        }));
      },

      reorderSections: (orderedIds: DashboardSectionId[]) => {
        const { sections } = get();
        // Create a map for quick lookup
        const sectionMap = new Map(sections.map((s) => [s.id, s]));
        
        // Reorder based on provided order, keeping visibility settings
        const reordered = orderedIds
          .map((id) => sectionMap.get(id))
          .filter((s): s is DashboardSection => s !== undefined);
        
        // Add any missing sections at the end (safety measure)
        sections.forEach((section) => {
          if (!orderedIds.includes(section.id)) {
            reordered.push(section);
          }
        });

        set({ sections: reordered });
      },

      resetToDefaults: () => {
        set({ sections: getDefaultSections() });
      },

      setSettingsOpen: (open: boolean) => {
        set({ isSettingsOpen: open });
      },

      toggleSettings: () => {
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen }));
      },
    }),
    {
      name: 'lavenius-dashboard-settings',
      version: 1,
      // Only persist sections, not UI state
      partialize: (state) => ({ sections: state.sections }),
    }
  )
);

// ============================================================================
// SELECTORS - Pure functions for derived data
// ============================================================================

export const dashboardSelectors = {
  /**
   * Get visible sections in order
   */
  getVisibleSections: (state: DashboardSettingsState): DashboardSectionId[] => {
    return state.sections.filter((s) => s.visible).map((s) => s.id);
  },

  /**
   * Check if a section is visible
   */
  isSectionVisible: (
    state: DashboardSettingsState,
    id: DashboardSectionId
  ): boolean => {
    const section = state.sections.find((s) => s.id === id);
    return section?.visible ?? true;
  },

  /**
   * Get all sections with visibility status
   */
  getAllSections: (state: DashboardSettingsState): DashboardSection[] => {
    return state.sections;
  },
};

// ============================================================================
// HOOKS - Convenient hooks for common use cases
// ============================================================================

/**
 * Hook to check if a specific section is visible
 * @param id - The section ID to check
 * @returns boolean indicating if the section is visible
 */
export const useSectionVisibility = (id: DashboardSectionId): boolean => {
  return useDashboardSettingsStore((state) =>
    dashboardSelectors.isSectionVisible(state, id)
  );
};

/**
 * Hook that returns a function to check section visibility
 * Use this when you need to check multiple sections in the same component
 * @returns A function that takes a section ID and returns visibility status
 */
export const useIsSectionVisible = (): ((id: DashboardSectionId) => boolean) => {
  const sections = useDashboardSettingsStore((state) => state.sections);
  return (id: DashboardSectionId): boolean => {
    const section = sections.find((s) => s.id === id);
    return section?.visible ?? true;
  };
};

/**
 * Hook to get visible sections in order
 */
export const useVisibleSections = (): DashboardSectionId[] => {
  return useDashboardSettingsStore((state) =>
    dashboardSelectors.getVisibleSections(state)
  );
};
