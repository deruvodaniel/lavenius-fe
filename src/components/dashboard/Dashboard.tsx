import { useState } from 'react';
import { Agenda } from '../agenda';
import { Pacientes } from '../pacientes';
import { Cobros } from '../cobros';
import { Configuracion } from '../config';
import { AppLayout, Sidebar } from '../layout';

type View = 'agenda' | 'pacientes' | 'cobros' | 'configuracion';

interface DashboardProps {
  onLogout?: () => void;
}

export function Dashboard({ onLogout }: DashboardProps = {}) {
  const [currentView, setCurrentView] = useState<View>('agenda');

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
          onLogout={onLogout}
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