import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, DollarSign, LogOut, Settings, ChevronUp, HelpCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { BetaBadge } from '@/components/shared';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/components/ui/utils';
import { getNameInitials } from '@/lib/utils/nameInitials';

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleNavClick = () => {
    setIsUserMenuOpen(false); // Close popover if open
    onNavigate?.(); // Close mobile drawer
  };

  const handleLogoutClick = () => {
    // Close popover + drawer, then notify parent to show confirm dialog
    setIsUserMenuOpen(false);
    onNavigate?.();
    onLogout?.();
  };

  const menuItems = [
    { path: '/dashboard', labelKey: 'navigation.dashboard', icon: LayoutDashboard, end: true },
    { path: '/dashboard/agenda', labelKey: 'navigation.agenda', icon: Calendar },
    { path: '/dashboard/pacientes', labelKey: 'navigation.patients', icon: Users },
    { path: '/dashboard/cobros', labelKey: 'navigation.payments', icon: DollarSign },
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
    onClick,
    end 
  }: { 
    to: string; 
    icon: typeof Calendar; 
    labelKey: string; 
    onClick?: () => void;
    end?: boolean;
  }) => {
    const content = (
      <NavLink
        to={to}
        end={end}
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
                <h1 className="text-white text-2xl font-bold flex items-center gap-2">{t('landing.brand')} <BetaBadge className="border-amber-500/60 bg-amber-500/20 text-amber-300" /></h1>
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
              end={item.end}
            />
          ))}
        </nav>

        {/* User Menu Popover */}
        <div className="border-t border-indigo-800 transition-all duration-200 p-4">
          {user && (
            <Popover open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-800 transition-colors group',
                    collapsed && 'justify-center'
                  )}
                  aria-label={t('navigation.userMenu')}
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
                        {getNameInitials(`${user.firstName} ${user.lastName || ''}`, 'U')}
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
                  <ChevronUp className={cn(
                    'w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors flex-shrink-0',
                    collapsed && 'hidden'
                  )} />
                </button>
              </PopoverTrigger>

              <PopoverContent
                side={collapsed ? 'right' : 'top'}
                align={collapsed ? 'end' : 'start'}
                sideOffset={8}
                className="w-56 p-1 bg-card border border-border shadow-lg rounded-lg"
              >
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>

                <NavLink
                  to="/dashboard/configuracion"
                  onClick={handleNavClick}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {t('navigation.settings')}
                </NavLink>

                <NavLink
                  to="/dashboard/ayuda"
                  onClick={handleNavClick}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  {t('navigation.help')}
                </NavLink>

                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('navigation.logout')}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

      </div>
    </TooltipProvider>
  );
}
