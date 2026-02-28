import { useState, useEffect, ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BetaBadge } from '@/components/shared';

const SIDEBAR_COLLAPSED_KEY = 'lavenius_sidebar_collapsed';

interface AppLayoutProps {
  children: ReactNode;
  sidebar: (onNavigate?: () => void, collapsed?: boolean, showHeader?: boolean) => ReactNode;
  appName?: string;
}

/**
 * AppLayout - Main application layout with responsive behavior
 *
 * Desktop (>=1024px): Fixed sidebar on the left (collapsible)
 * Mobile/Tablet (<1024px): Top header with hamburger menu and drawer navigation
 * 
 * Note: Both layouts are always rendered to maintain consistent React component tree
 * and avoid hooks count issues during resize. CSS controls visibility.
 */
export function AppLayout({ children, sidebar, appName = 'Lavenius' }: AppLayoutProps) {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize from localStorage, default to expanded (false)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return stored === 'true';
    }
    return false;
  });
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize with actual value if window exists
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  // Detect mobile viewport
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      const mobile = width < 1024; // lg breakpoint
      setIsMobile(mobile);
      // Close drawer when switching to desktop
      if (!mobile) {
        setDrawerOpen(false);
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Single consistent structure - CSS handles responsive visibility
  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-gray-50">
      {/* Mobile Header - hidden on desktop */}
      <header className="bg-indigo-900 text-white p-4 flex items-center justify-between shadow-lg z-40 lg:hidden">
        <h1 className="text-xl font-bold flex items-center gap-2">{appName} <BetaBadge /></h1>
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="p-2 hover:bg-indigo-800 rounded-lg transition-colors"
          aria-label={t('common.toggleMenu', 'Toggle menu')}
        >
          {drawerOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer - only visible on mobile when open */}
      {isMobile && drawerOpen && (
        <div className="fixed inset-0 z-[80] flex top-[72px] lg:hidden">
          {/* Backdrop/Overlay */}
          <div
            className="absolute inset-0 z-[80] bg-black/30 backdrop-blur-[2px]"
            onClick={handleDrawerClose}
          />

          {/* Drawer Content - never collapsed on mobile, no header (AppLayout already shows one) */}
          <aside className="relative z-[81] ml-auto h-full w-64 bg-indigo-900 text-white shadow-2xl overflow-y-auto">
            {sidebar(handleDrawerClose, false, false)}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block relative flex-shrink-0">
        <aside 
          className={cn(
            'h-full bg-indigo-900 text-white transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'w-20' : 'w-64'
          )}
        >
          {sidebar(undefined, sidebarCollapsed, true)}
        </aside>
        
        {/* Floating Toggle Button - positioned on sidebar edge */}
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleToggleCollapse}
                className="absolute top-1/2 -translate-y-1/2 -right-3 z-30 w-6 h-6 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-lg transition-all duration-200"
                aria-label={sidebarCollapsed ? t('navigation.expandSidebar') : t('navigation.collapseSidebar')}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white border-0 shadow-lg rounded-md text-sm font-medium">
              {sidebarCollapsed ? t('navigation.expandSidebar') : t('navigation.collapseSidebar')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Main Content - always rendered */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
