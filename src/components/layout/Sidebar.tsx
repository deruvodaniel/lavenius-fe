import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, DollarSign, LogOut, Settings, ChevronRight, HelpCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ConfirmDialog } from '@/components/shared';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/components/ui/utils';

interface SidebarProps {
  currentPath: string;
  onLogout?: () => void;
  showHeader?: boolean;
  onNavigate?: () => void; // Callback para cerrar drawer en mobile
  collapsed?: boolean;
}

export function Sidebar({ currentPath: _currentPath, onLogout, showHeader = true, onNavigate, collapsed = false }: SidebarProps) {
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

  const settingsItems = [
    { path: '/dashboard/configuracion', labelKey: 'navigation.settings', icon: Settings },
    { path: '/dashboard/ayuda', labelKey: 'navigation.help', icon: HelpCircle },
  ];

  const getLinkClassName = ({ isActive }: { isActive: boolean }) => 
    cn(
      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
      collapsed && 'justify-center',
      isActive
        ? 'bg-indigo-700 text-white'
        : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
    );

  // Wrapper component for nav items with tooltip when collapsed
  const NavItemWithTooltip = ({ 
    to, 
    icon: Icon, 
    labelKey, 
    onClick 
  }: { 
    to: string; 
    icon: typeof Calendar; 
    labelKey: string; 
    onClick?: () => void;
  }) => {
    const content = (
      <NavLink
        to={to}
        onClick={onClick}
        className={getLinkClassName}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className={cn(
          'transition-opacity duration-200',
          collapsed ? 'sr-only' : 'opacity-100'
        )}>
          {t(labelKey)}
        </span>
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white border-0 shadow-lg rounded-md text-sm font-medium">
            {t(labelKey)}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Header - Only show on desktop */}
        {showHeader && (
          <div className={cn(
            'border-b border-indigo-800 transition-all duration-200 min-h-[80px] flex items-center px-4',
            collapsed && 'justify-center'
          )}>
            {collapsed ? (
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">L</span>
              </div>
            ) : (
              <div>
                <h1 className="text-white text-2xl font-bold">{t('landing.brand')}</h1>
                <p className="text-indigo-300 text-sm mt-1">{t('landing.tagline')}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-4 transition-all duration-200">
          {menuItems.map((item) => (
            <NavItemWithTooltip
              key={item.path}
              to={item.path}
              icon={item.icon}
              labelKey={item.labelKey}
              onClick={handleNavClick}
            />
          ))}
          
          {/* Settings & Help */}
          {settingsItems.map((item) => (
            <NavItemWithTooltip
              key={item.path}
              to={item.path}
              icon={item.icon}
              labelKey={item.labelKey}
              onClick={handleNavClick}
            />
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-indigo-800 transition-all duration-200 p-4 space-y-2">
          {user && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to="/dashboard/perfil"
                  onClick={handleNavClick}
                  className={({ isActive }) => 
                    cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group',
                      collapsed && 'justify-center',
                      isActive ? 'bg-indigo-700' : 'hover:bg-indigo-800'
                    )
                  }
                >
                  <div className={cn(
                    'bg-indigo-600 ring-2 ring-indigo-400 rounded-full flex items-center justify-center flex-shrink-0 group-hover:ring-indigo-300 transition-all duration-200 overflow-hidden',
                    collapsed ? 'w-5 h-5 ring-1' : 'w-10 h-10'
                  )}>
                    {user.imageUrl ? (
                      <img 
                        src={user.imageUrl} 
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={cn(
                        'text-white font-semibold',
                        collapsed ? 'text-[10px]' : 'text-sm'
                      )}>
                        {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className={cn(
                    'flex-1 min-w-0 text-left transition-opacity duration-200',
                    collapsed ? 'sr-only' : 'opacity-100'
                  )}>
                    <p className="text-white text-sm font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-indigo-300 text-xs truncate">{user.email}</p>
                  </div>
                  <ChevronRight className={cn(
                    'w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors flex-shrink-0',
                    collapsed && 'hidden'
                  )} />
                </NavLink>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="bg-gray-900 text-white border-0 shadow-lg rounded-md">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-gray-400 text-xs">{user.email}</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}
          
          {/* Logout Button */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogoutClick}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-200 hover:bg-indigo-800 hover:text-white transition-colors',
                  collapsed && 'justify-center'
                )}
                aria-label={t('navigation.logout')}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className={cn(
                  'text-sm transition-opacity duration-200',
                  collapsed ? 'sr-only' : 'opacity-100'
                )}>
                  {t('navigation.logout')}
                </span>
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-gray-900 text-white border-0 shadow-lg rounded-md text-sm font-medium">
                {t('navigation.logout')}
              </TooltipContent>
            )}
          </Tooltip>
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
    </TooltipProvider>
  );
}
