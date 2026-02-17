import { useState } from 'react';
import { Calendar, Users, DollarSign, LogOut, Settings, ChevronRight, HelpCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ConfirmDialog } from '@/components/shared';

type View = 'agenda' | 'pacientes' | 'cobros' | 'configuracion' | 'perfil' | 'ayuda';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout?: () => void;
  showHeader?: boolean;
  onNavigate?: () => void; // Callback para cerrar drawer en mobile
}

export function Sidebar({ currentView, onViewChange, onLogout, showHeader = true, onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleNavClick = (view: View) => {
    onViewChange(view);
    onNavigate?.(); // Cerrar drawer en mobile
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    onLogout?.();
    setShowLogoutConfirm(false);
  };

  const menuItems = [
    { id: 'agenda' as View, label: 'Agenda', icon: Calendar },
    { id: 'pacientes' as View, label: 'Pacientes', icon: Users },
    { id: 'cobros' as View, label: 'Cobros', icon: DollarSign },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header - Only show on desktop */}
      {showHeader && (
        <div className="p-6 border-b border-indigo-800">
          <h1 className="text-white text-2xl font-bold">Lavenius</h1>
          <p className="text-indigo-300 text-sm mt-1">Gestión de Pacientes</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === item.id
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
        
        {/* Configuración */}
        <button
          onClick={() => handleNavClick('configuracion')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === 'configuracion'
              ? 'bg-indigo-700 text-white'
              : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Configuración</span>
        </button>

        {/* Ayuda */}
        <button
          onClick={() => handleNavClick('ayuda')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === 'ayuda'
              ? 'bg-indigo-700 text-white'
              : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
          }`}
        >
          <HelpCircle className="w-5 h-5" />
          <span>Ayuda</span>
        </button>
      </nav>
      
      {/* User Profile & Logout */}
      <div className="p-6 border-t border-indigo-800">
        {user && (
          <button
            onClick={() => handleNavClick('perfil')}
            className={`w-full flex items-center gap-3 mb-4 p-2 -m-2 rounded-lg transition-colors group ${
              currentView === 'perfil'
                ? 'bg-indigo-700'
                : 'hover:bg-indigo-800'
            }`}
          >
            <div className="w-10 h-10 bg-indigo-600 ring-2 ring-indigo-400 rounded-full flex items-center justify-center flex-shrink-0 group-hover:ring-indigo-300 transition-colors">
              <span className="text-white text-sm font-semibold">
                {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-white text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-indigo-300 text-xs truncate">{user.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors flex-shrink-0" />
          </button>
        )}
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-indigo-200 hover:bg-indigo-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="¿Cerrar sesión?"
        description="Estás a punto de cerrar tu sesión. Tendrás que volver a iniciar sesión para acceder a tu cuenta."
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        variant="warning"
        icon={LogOut}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}
