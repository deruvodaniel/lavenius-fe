import { useState } from 'react';
import { Agenda } from '../agenda';
import { Pacientes } from '../pacientes';
import { Cobros } from '../cobros';
import { Configuracion } from '../config';
import { AppLayout, Sidebar } from '../layout';
import { useAuth } from '@/lib/hooks/useAuth';

type View = 'agenda' | 'pacientes' | 'cobros' | 'configuracion';

export function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('agenda');
  const { logout } = useAuth();

  const handleViewChange = (view: View) => {
    setCurrentView(view);
  };

  return (
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
    </AppLayout>
  );
}