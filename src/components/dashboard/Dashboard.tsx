import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClerk } from '@clerk/clerk-react';
import { LogOut } from 'lucide-react';
import { AppLayout, Sidebar } from '../layout';
import { OnboardingModal } from '../onboarding';
import { ConfirmDialog, CalendarRequiredDialog } from '../shared';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useCalendarStore } from '@/lib/stores/calendarStore';

export function Dashboard() {
  const { t } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { signOut } = useClerk();
  const { shouldShowOnboarding } = useOnboarding();
  const { connectCalendar } = useCalendarStore();
  const showCalendarModal = useCalendarStore(state => state.showCalendarModal);
  const dismissCalendarModal = useCalendarStore(state => state.dismissCalendarModal);
  const checkConnection = useCalendarStore(state => state.checkConnection);
  const navigate = useNavigate();
  const location = useLocation();

  // Check calendar connection once on Dashboard mount (reactive approach)
  useEffect(() => {
    checkConnection().catch(() => {});
  }, [checkConnection]);

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

  const handleLogoutRequest = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    signOut({ redirectUrl: '/' });
  };

  return (
    <>
      <AppLayout
        appName="TerappIA"
        sidebar={(onNavigate?: () => void, collapsed?: boolean, showHeader?: boolean) => (
          <Sidebar
            currentPath={location.pathname}
            onLogout={handleLogoutRequest}
            onNavigate={onNavigate}
            collapsed={collapsed}
            showHeader={showHeader}
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

      {/* Logout Confirmation — rendered at root level, outside sidebar/drawer */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title={t('logout.confirmTitle')}
        description={t('logout.confirmDescription')}
        confirmLabel={t('navigation.logout')}
        cancelLabel={t('common.cancel')}
        variant="warning"
        icon={LogOut}
        onConfirm={handleLogoutConfirm}
      />

      {/* Global Calendar Required Dialog — shows reactively when /calendars fails */}
      <CalendarRequiredDialog
        open={showCalendarModal}
        onOpenChange={(open) => { if (!open) dismissCalendarModal(); }}
        onLater={dismissCalendarModal}
        onConnect={() => {
          dismissCalendarModal();
          connectCalendar();
        }}
      />
    </>
  );
}
