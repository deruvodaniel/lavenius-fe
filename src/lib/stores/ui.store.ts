import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// DRAWER TYPES
// ============================================================================

export type DrawerType = 
  | 'paciente'
  | 'turno'
  | 'payment'
  | 'note'
  | 'sessionDetails';

interface DrawerState {
  isOpen: boolean;
  data?: Record<string, unknown>;
}

// ============================================================================
// VIEW MODE TYPES
// ============================================================================

export type AgendaViewMode = 'list' | 'calendar' | 'both';
export type PacientesViewMode = 'cards' | 'table';
export type CalendarViewMode = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

interface ViewPreferences {
  agenda: AgendaViewMode;
  pacientes: PacientesViewMode;
  calendar: CalendarViewMode;
}

// ============================================================================
// SIDEBAR/NAVIGATION TYPES
// ============================================================================

interface SidebarState {
  isOpen: boolean;
  isMobileOpen: boolean;
  isCollapsed: boolean;
}

// ============================================================================
// GLOBAL LOADING STATE
// ============================================================================

interface LoadingState {
  isGlobalLoading: boolean;
  loadingMessage?: string;
  /** Track individual loading operations by key */
  operations: Record<string, boolean>;
}

// ============================================================================
// UI STORE STATE
// ============================================================================

interface UIState {
  // Drawer states
  drawers: Record<DrawerType, DrawerState>;
  
  // View preferences (persisted)
  viewPreferences: ViewPreferences;
  
  // Sidebar state
  sidebar: SidebarState;
  
  // Loading states
  loading: LoadingState;
}

// ============================================================================
// UI STORE ACTIONS
// ============================================================================

interface UIActions {
  // Drawer actions
  openDrawer: (type: DrawerType, data?: Record<string, unknown>) => void;
  closeDrawer: (type: DrawerType) => void;
  toggleDrawer: (type: DrawerType) => void;
  getDrawerData: <T = Record<string, unknown>>(type: DrawerType) => T | undefined;
  
  // View preferences actions
  setAgendaView: (view: AgendaViewMode) => void;
  setPacientesView: (view: PacientesViewMode) => void;
  setCalendarView: (view: CalendarViewMode) => void;
  
  // Sidebar actions
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  
  // Loading actions
  setGlobalLoading: (isLoading: boolean, message?: string) => void;
  startOperation: (key: string) => void;
  endOperation: (key: string) => void;
  isOperationLoading: (key: string) => boolean;
  
  // Utility
  closeAll: () => void;
  resetUI: () => void;
}

type UIStore = UIState & UIActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialDrawerState: DrawerState = {
  isOpen: false,
  data: undefined,
};

const initialViewPreferences: ViewPreferences = {
  agenda: 'both',
  pacientes: 'cards',
  calendar: 'timeGridWeek',
};

const initialSidebarState: SidebarState = {
  isOpen: true,
  isMobileOpen: false,
  isCollapsed: false,
};

const initialLoadingState: LoadingState = {
  isGlobalLoading: false,
  loadingMessage: undefined,
  operations: {},
};

const initialState: UIState = {
  drawers: {
    paciente: { ...initialDrawerState },
    turno: { ...initialDrawerState },
    payment: { ...initialDrawerState },
    note: { ...initialDrawerState },
    sessionDetails: { ...initialDrawerState },
  },
  viewPreferences: { ...initialViewPreferences },
  sidebar: { ...initialSidebarState },
  loading: { ...initialLoadingState },
};

// ============================================================================
// UI STORE
// ============================================================================

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ─────────────────────────────────────────────────────────────────────
      // DRAWER ACTIONS
      // ─────────────────────────────────────────────────────────────────────

      openDrawer: (type, data) => {
        set((state) => ({
          drawers: {
            ...state.drawers,
            [type]: { isOpen: true, data },
          },
        }));
      },

      closeDrawer: (type) => {
        set((state) => ({
          drawers: {
            ...state.drawers,
            [type]: { isOpen: false, data: undefined },
          },
        }));
      },

      toggleDrawer: (type) => {
        const current = get().drawers[type];
        set((state) => ({
          drawers: {
            ...state.drawers,
            [type]: { ...current, isOpen: !current.isOpen },
          },
        }));
      },

      getDrawerData: <T = Record<string, unknown>>(type: DrawerType) => {
        return get().drawers[type].data as T | undefined;
      },

      // ─────────────────────────────────────────────────────────────────────
      // VIEW PREFERENCES ACTIONS
      // ─────────────────────────────────────────────────────────────────────

      setAgendaView: (view) => {
        set((state) => ({
          viewPreferences: {
            ...state.viewPreferences,
            agenda: view,
          },
        }));
      },

      setPacientesView: (view) => {
        set((state) => ({
          viewPreferences: {
            ...state.viewPreferences,
            pacientes: view,
          },
        }));
      },

      setCalendarView: (view) => {
        set((state) => ({
          viewPreferences: {
            ...state.viewPreferences,
            calendar: view,
          },
        }));
      },

      // ─────────────────────────────────────────────────────────────────────
      // SIDEBAR ACTIONS
      // ─────────────────────────────────────────────────────────────────────

      openSidebar: () => {
        set((state) => ({
          sidebar: { ...state.sidebar, isOpen: true },
        }));
      },

      closeSidebar: () => {
        set((state) => ({
          sidebar: { ...state.sidebar, isOpen: false },
        }));
      },

      toggleSidebar: () => {
        set((state) => ({
          sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen },
        }));
      },

      openMobileSidebar: () => {
        set((state) => ({
          sidebar: { ...state.sidebar, isMobileOpen: true },
        }));
      },

      closeMobileSidebar: () => {
        set((state) => ({
          sidebar: { ...state.sidebar, isMobileOpen: false },
        }));
      },

      toggleMobileSidebar: () => {
        set((state) => ({
          sidebar: { ...state.sidebar, isMobileOpen: !state.sidebar.isMobileOpen },
        }));
      },

      collapseSidebar: () => {
        set((state) => ({
          sidebar: { ...state.sidebar, isCollapsed: true },
        }));
      },

      expandSidebar: () => {
        set((state) => ({
          sidebar: { ...state.sidebar, isCollapsed: false },
        }));
      },

      // ─────────────────────────────────────────────────────────────────────
      // LOADING ACTIONS
      // ─────────────────────────────────────────────────────────────────────

      setGlobalLoading: (isLoading, message) => {
        set((state) => ({
          loading: {
            ...state.loading,
            isGlobalLoading: isLoading,
            loadingMessage: message,
          },
        }));
      },

      startOperation: (key) => {
        set((state) => ({
          loading: {
            ...state.loading,
            operations: {
              ...state.loading.operations,
              [key]: true,
            },
          },
        }));
      },

      endOperation: (key) => {
        set((state) => {
          const { [key]: _, ...rest } = state.loading.operations;
          return {
            loading: {
              ...state.loading,
              operations: rest,
            },
          };
        });
      },

      isOperationLoading: (key) => {
        return get().loading.operations[key] ?? false;
      },

      // ─────────────────────────────────────────────────────────────────────
      // UTILITY ACTIONS
      // ─────────────────────────────────────────────────────────────────────

      closeAll: () => {
        set((state) => ({
          ...state,
          drawers: {
            paciente: { ...initialDrawerState },
            turno: { ...initialDrawerState },
            payment: { ...initialDrawerState },
            note: { ...initialDrawerState },
            sessionDetails: { ...initialDrawerState },
          },
          sidebar: { ...state.sidebar, isMobileOpen: false },
        }));
      },

      resetUI: () => {
        set({ ...initialState });
      },
    }),
    {
      name: 'lavenius-ui',
      storage: createJSONStorage(() => localStorage),
      // Only persist view preferences and sidebar collapsed state
      partialize: (state) => ({
        viewPreferences: state.viewPreferences,
        sidebar: {
          isCollapsed: state.sidebar.isCollapsed,
        },
      }),
    }
  )
);

// ============================================================================
// SELECTOR HOOKS (for performance optimization)
// ============================================================================

/**
 * Hook for managing a specific drawer
 */
export const useDrawer = (type: DrawerType) => {
  const isOpen = useUIStore((state) => state.drawers[type].isOpen);
  const data = useUIStore((state) => state.drawers[type].data);
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    data,
    open: (data?: Record<string, unknown>) => openDrawer(type, data),
    close: () => closeDrawer(type),
  };
};

/**
 * Hook for view preferences
 */
export const useViewPreferences = () => {
  const viewPreferences = useUIStore((state) => state.viewPreferences);
  const setAgendaView = useUIStore((state) => state.setAgendaView);
  const setPacientesView = useUIStore((state) => state.setPacientesView);
  const setCalendarView = useUIStore((state) => state.setCalendarView);

  return {
    ...viewPreferences,
    setAgendaView,
    setPacientesView,
    setCalendarView,
  };
};

/**
 * Hook for sidebar state
 */
export const useSidebar = () => {
  const sidebar = useUIStore((state) => state.sidebar);
  const openSidebar = useUIStore((state) => state.openSidebar);
  const closeSidebar = useUIStore((state) => state.closeSidebar);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const openMobileSidebar = useUIStore((state) => state.openMobileSidebar);
  const closeMobileSidebar = useUIStore((state) => state.closeMobileSidebar);
  const toggleMobileSidebar = useUIStore((state) => state.toggleMobileSidebar);
  const collapseSidebar = useUIStore((state) => state.collapseSidebar);
  const expandSidebar = useUIStore((state) => state.expandSidebar);

  return {
    ...sidebar,
    open: openSidebar,
    close: closeSidebar,
    toggle: toggleSidebar,
    openMobile: openMobileSidebar,
    closeMobile: closeMobileSidebar,
    toggleMobile: toggleMobileSidebar,
    collapse: collapseSidebar,
    expand: expandSidebar,
  };
};

/**
 * Hook for loading states
 */
export const useLoading = () => {
  const loading = useUIStore((state) => state.loading);
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading);
  const startOperation = useUIStore((state) => state.startOperation);
  const endOperation = useUIStore((state) => state.endOperation);
  const isOperationLoading = useUIStore((state) => state.isOperationLoading);

  return {
    isGlobalLoading: loading.isGlobalLoading,
    loadingMessage: loading.loadingMessage,
    operations: loading.operations,
    setGlobalLoading,
    startOperation,
    endOperation,
    isOperationLoading,
  };
};

/**
 * Utility hook to check if any operation is loading
 */
export const useIsAnyLoading = () => {
  const loading = useUIStore((state) => state.loading);
  return loading.isGlobalLoading || Object.keys(loading.operations).length > 0;
};
