import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { AppLayout, Sidebar } from '../layout';
import { OnboardingModal } from '../onboarding';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useCalendarStore } from '@/lib/stores/calendarStore';

export function Dashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { signOut } = useClerk();
  const { shouldShowOnboarding } = useOnboarding();
  const { connectCalendar } = useCalendarStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Show onboarding modal for first-time users
  useEffect(() => {
    if (shouldShowOnboarding()) {
      // Small delay to let the dashboard render first
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding]);

  const handleConnectCalendar = () => {
    connectCalendar();
  };

  const handleCreatePatient = () => {
    setShowOnboarding(false);
    navigate('/dashboard/pacientes');
    // The patient creation will be triggered by opening the drawer
    // We dispatch a custom event that Pacientes component can listen to
    window.dispatchEvent(new CustomEvent('openPatientDrawer'));
  };

  return (
    <>
      <AppLayout
        appName="Lavenius"
        sidebar={(onNavigate?: () => void, collapsed?: boolean) => (
          <Sidebar
            currentPath={location.pathname}
            onLogout={() => signOut({ redirectUrl: '/' })}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        )}
      >
        {/* Outlet renders the matched child route */}
        <Outlet />
      </AppLayout>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onConnectCalendar={handleConnectCalendar}
        onCreatePatient={handleCreatePatient}
      />
    </>
  );
}
