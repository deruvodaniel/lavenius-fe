import { useState, useEffect, lazy, Suspense } from 'react';
import { Pacientes } from '../pacientes';
import { Configuracion } from '../config';
import { Perfil } from '../perfil';
import { AppLayout, Sidebar } from '../layout';
import { OnboardingModal } from '../onboarding';
import { LoadingOverlay } from '../shared';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useCalendarStore } from '@/lib/stores/calendarStore';

// Lazy load heavy components
const Agenda = lazy(() => import('../agenda/Agenda').then(m => ({ default: m.Agenda })));
const Cobros = lazy(() => import('../cobros/Cobros').then(m => ({ default: m.Cobros })));
const HelpCenter = lazy(() => import('../help/HelpCenter').then(m => ({ default: m.HelpCenter })));

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
        <Suspense fallback={<LoadingOverlay message="Cargando vista..." />}>
          {currentView === 'agenda' && <Agenda />}
          {currentView === 'pacientes' && <Pacientes />}
          {currentView === 'cobros' && <Cobros />}
          {currentView === 'configuracion' && <Configuracion />}
          {currentView === 'perfil' && <Perfil />}
          {currentView === 'ayuda' && <HelpCenter />}
        </Suspense>
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