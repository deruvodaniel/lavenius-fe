import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, DollarSign, LogOut, Settings, ChevronRight, HelpCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ConfirmDialog } from '@/components/shared';

interface SidebarProps {
  currentPath: string;
  onLogout?: () => void;
  showHeader?: boolean;
  onNavigate?: () => void; // Callback para cerrar drawer en mobile
}

export function Sidebar({ currentPath, onLogout, showHeader = true, onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleNavClick = () => {
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
    { path: '/dashboard/agenda', labelKey: 'navigation.agenda', icon: Calendar },
    { path: '/dashboard/pacientes', labelKey: 'navigation.patients', icon: Users },
    { path: '/dashboard/cobros', labelKey: 'navigation.payments', icon: DollarSign },
    { path: '/dashboard/analitica', labelKey: 'navigation.analytics', icon: BarChart3 },
  ];

  const getLinkClassName = ({ isActive }: { isActive: boolean }) => 
    `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-700 text-white'
        : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
    }`;

  return (
    <div className="h-full flex flex-col">
      {/* Header - Only show on desktop */}
      {showHeader && (
        <div className="p-6 border-b border-indigo-800">
          <h1 className="text-white text-2xl font-bold">{t('landing.brand')}</h1>
          <p className="text-indigo-300 text-sm mt-1">{t('landing.tagline')}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={getLinkClassName}
            >
              <Icon className="w-5 h-5" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
        
        {/* Configuración */}
        <NavLink
          to="/dashboard/configuracion"
          onClick={handleNavClick}
          className={getLinkClassName}
        >
          <Settings className="w-5 h-5" />
          <span>{t('navigation.settings')}</span>
        </NavLink>

        {/* Ayuda */}
        <NavLink
          to="/dashboard/ayuda"
          onClick={handleNavClick}
          className={getLinkClassName}
        >
          <HelpCircle className="w-5 h-5" />
          <span>{t('navigation.help')}</span>
        </NavLink>
      </nav>
      
      {/* User Profile & Logout */}
      <div className="p-6 border-t border-indigo-800">
        {user && (
          <NavLink
            to="/dashboard/perfil"
            onClick={handleNavClick}
            className={({ isActive }) => 
              `w-full flex items-center gap-3 mb-4 p-2 -m-2 rounded-lg transition-colors group ${
                isActive ? 'bg-indigo-700' : 'hover:bg-indigo-800'
              }`
            }
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
          </NavLink>
        )}
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-indigo-200 hover:bg-indigo-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">{t('navigation.logout')}</span>
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
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
    </div>
  );
}
