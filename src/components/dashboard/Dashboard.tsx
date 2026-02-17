import { useState, useEffect } from 'react';
import { Agenda } from '../agenda';
import { Pacientes } from '../pacientes';
import { Cobros } from '../cobros';
import { Configuracion } from '../config';
import { Perfil } from '../perfil';
import { HelpCenter } from '../help';
import { AppLayout, Sidebar } from '../layout';
import { OnboardingModal } from '../onboarding';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useCalendarStore } from '@/lib/stores/calendarStore';

type View = 'agenda' | 'pacientes' | 'cobros' | 'configuracion' | 'perfil' | 'ayuda';

export function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('agenda');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { logout } = useAuth();
  const { shouldShowOnboarding } = useOnboarding();
  const { connectCalendar } = useCalendarStore();

  // Show onboarding modal for first-time users
  useEffect(() => {
    if (shouldShowOnboarding()) {
      // Small delay to let the dashboard render first
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding]);

  const handleViewChange = (view: View) => {
    setCurrentView(view);
  };

  const handleConnectCalendar = () => {
    connectCalendar();
  };

  const handleCreatePatient = () => {
    setShowOnboarding(false);
    setCurrentView('pacientes');
    // The patient creation will be triggered by opening the drawer
    // We dispatch a custom event that Pacientes component can listen to
    window.dispatchEvent(new CustomEvent('openPatientDrawer'));
  };

  return (
    <>
      <AppLayout
        appName="Lavenius"
        sidebar={(onNavigate) => (
          <Sidebar
            currentView={currentView}
            onViewChange={handleViewChange}
            onLogout={logout}
            onNavigate={onNavigate}
          />
        )}
      >
        {currentView === 'agenda' && <Agenda />}
        {currentView === 'pacientes' && <Pacientes />}
        {currentView === 'cobros' && <Cobros />}
        {currentView === 'configuracion' && <Configuracion />}
        {currentView === 'perfil' && <Perfil />}
        {currentView === 'ayuda' && <HelpCenter />}
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