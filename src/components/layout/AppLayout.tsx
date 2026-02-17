import { useState, useEffect, ReactNode } from 'react';
import { Menu, X } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  sidebar: (onNavigate?: () => void) => ReactNode;
  appName?: string;
}

/**
 * AppLayout - Main application layout with responsive behavior
 *
 * Desktop (>=1024px): Fixed sidebar on the left
 * Mobile/Tablet (<1024px): Top header with hamburger menu and drawer navigation
 * 
 * Note: Both layouts are always rendered to maintain consistent React component tree
 * and avoid hooks count issues during resize. CSS controls visibility.
 */
export function AppLayout({ children, sidebar, appName = 'Lavenius' }: AppLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // Single consistent structure - CSS handles responsive visibility
  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-gray-50">
      {/* Mobile Header - hidden on desktop */}
      <header className="bg-indigo-900 text-white p-4 flex items-center justify-between shadow-lg z-20 lg:hidden">
        <h1 className="text-xl font-bold">{appName}</h1>
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="p-2 hover:bg-indigo-800 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {drawerOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer - only visible on mobile when open */}
      {isMobile && drawerOpen && (
        <div className="fixed inset-0 z-50 flex top-[56px] lg:hidden">
          {/* Backdrop/Overlay */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={handleDrawerClose}
          />

          {/* Drawer Content */}
          <aside className="relative ml-auto h-full w-64 bg-indigo-900 text-white shadow-2xl overflow-y-auto">
            {sidebar(handleDrawerClose)}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden lg:block w-64 bg-indigo-900 text-white flex-shrink-0">
        {sidebar()}
      </aside>

      {/* Main Content - always rendered */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
