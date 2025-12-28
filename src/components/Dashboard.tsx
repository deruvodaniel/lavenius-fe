import { useState } from 'react';
import { Calendar, Users, DollarSign, LogOut, Settings } from 'lucide-react';
import { Agenda } from './Agenda';
import { Pacientes } from './Pacientes';
import { Cobros } from './Cobros';
import { Configuracion } from './Configuracion';

type View = 'agenda' | 'pacientes' | 'cobros' | 'configuracion';

interface DashboardProps {
  onLogout?: () => void;
}

export function Dashboard({ onLogout }: DashboardProps = {}) {
  const [currentView, setCurrentView] = useState<View>('agenda');

  const menuItems = [
    { id: 'agenda' as View, label: 'Agenda', icon: Calendar },
    { id: 'pacientes' as View, label: 'Pacientes', icon: Users },
    { id: 'cobros' as View, label: 'Cobros', icon: DollarSign },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-white">Lavenius</h2>
        </div>
        
        <nav className="flex-1 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  currentView === item.id
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-200 hover:bg-indigo-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="px-4 mb-4">
          <button
            onClick={() => setCurrentView('configuracion')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'configuracion'
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-200 hover:bg-indigo-800'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </button>
        </div>
        
        <div className="p-6 border-t border-indigo-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">LP</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm">Dra. Laura Pereyra</p>
              <p className="text-indigo-300 text-xs">Psicóloga</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-indigo-200 hover:bg-indigo-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {currentView === 'agenda' && <Agenda />}
        {currentView === 'pacientes' && <Pacientes />}
        {currentView === 'cobros' && <Cobros />}
        {currentView === 'configuracion' && <Configuracion />}
      </main>
    </div>
  );
}