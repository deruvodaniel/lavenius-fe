import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  Plus,
  UserPlus,
  Receipt,
  Gift,
  UserX,
  Clock,
  Settings2,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { EmptyState, SwipeableCards, DashboardSkeleton, AnimatedSection } from './DashboardComponents';
import { 
  useScrollPosition, 
  CompactHeader, 
  QuickActionsBar, 
  TodaySummaryWidget,
  MiniStatCard,
  RadialProgress,
} from './ModernDashboardComponents';
import { usePayments } from '@/lib/hooks/usePayments';
import { usePatients, useResponsive } from '@/lib/hooks';
import { useAuth } from '@/lib/hooks/useAuth';
import { SessionStatus } from '@/lib/types/session';
import { PaymentStatus } from '@/lib/types/api.types';
import { sessionService } from '@/lib/api/sessions';
import { apiClient } from '@/lib/api/client';
import type { SessionResponse } from '@/lib/types/session';
import { 
  useDashboardSettingsStore, 
  useIsSectionVisible,
  type DashboardSectionId 
} from '@/lib/stores';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

const TIME_RANGE_KEYS: { value: TimeRange; key: string }[] = [
  { value: 'week', key: 'analytics.timeRange.week' },
  { value: 'month', key: 'analytics.timeRange.month' },
  { value: 'quarter', key: 'analytics.timeRange.quarter' },
  { value: 'year', key: 'analytics.timeRange.year' },
];

const COLORS = {
  primary: '#4f46e5', // indigo-600
  success: '#22c55e', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  muted: '#9ca3af', // gray-400
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
};

const PIE_COLORS = [COLORS.success, COLORS.primary, COLORS.warning, COLORS.danger];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDateYmdLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateRange = (range: TimeRange): { start: Date; end: Date } => {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  
  switch (range) {
    case 'week':
      // Last 7 days including today
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      // Current calendar month (1st to end of month)
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'quarter':
      // Last 3 calendar months
      start.setMonth(now.getMonth() - 2);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      // Current calendar year (Jan 1st to Dec 31st)
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }
  
  return { start, end };
};

const getWeekdayName = (day: number, t: (key: string) => string): string => {
  const keys = ['analytics.weekdays.sun', 'analytics.weekdays.mon', 'analytics.weekdays.tue', 'analytics.weekdays.wed', 'analytics.weekdays.thu', 'analytics.weekdays.fri', 'analytics.weekdays.sat'];
  return t(keys[day]);
};

const getMonthName = (month: number, t: (key: string) => string): string => {
  const keys = ['analytics.months.jan', 'analytics.months.feb', 'analytics.months.mar', 'analytics.months.apr', 'analytics.months.may', 'analytics.months.jun', 'analytics.months.jul', 'analytics.months.aug', 'analytics.months.sep', 'analytics.months.oct', 'analytics.months.nov', 'analytics.months.dec'];
  return t(keys[month]);
};

// ============================================================================
// CHART CARD WRAPPER
// ============================================================================

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const ChartCard = ({ title, subtitle, children, className = '', onClick }: ChartCardProps) => (
  <Card
    className={`p-3 sm:p-4 lg:p-6 bg-card ${className} ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all' : ''}`}
    onClick={onClick}
  >
    <div className="mb-3 sm:mb-4">
      <h3 className="text-sm sm:text-base font-semibold text-foreground">{title}</h3>
      {subtitle && <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {children}
  </Card>
);

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number) => string;
}

const CustomTooltip = ({ active, payload, label, formatter }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-card border shadow-lg rounded-lg p-3">
      <p className="text-sm font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

// ============================================================================
// DASHBOARD SETTINGS POPOVER / DRAWER
// ============================================================================

interface DashboardSettingsPopoverProps {
  t: (key: string) => string;
  isMobile: boolean;
}

const SECTION_LABELS: Record<DashboardSectionId, string> = {
  todaySummary: 'dashboard.settings.sections.todaySummary',
  quickActions: 'dashboard.settings.sections.quickActions',
  statCards: 'dashboard.settings.sections.statCards',
  pendingPayments: 'dashboard.settings.sections.pendingPayments',
  birthdays: 'dashboard.settings.sections.birthdays',
  patientsWithoutSession: 'dashboard.settings.sections.patientsWithoutSession',
  charts: 'dashboard.settings.sections.charts',
};

/**
 * Settings content component - shared between Popover (desktop) and Drawer (mobile)
 */
const SettingsContent = ({ 
  t, 
  sections, 
  toggleSectionVisibility, 
  resetToDefaults,
  showHeader = true,
}: { 
  t: (key: string) => string;
  sections: { id: DashboardSectionId; visible: boolean }[];
  toggleSectionVisibility: (id: DashboardSectionId) => void;
  resetToDefaults: () => void;
  showHeader?: boolean;
}) => (
  <div className="space-y-4">
    {showHeader && (
      <>
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">{t('dashboard.settings.title')}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t('dashboard.settings.reset')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t('dashboard.settings.description')}</p>
      </>
    )}
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.id} className="flex items-center justify-between py-1">
          <Label
            htmlFor={`section-${section.id}`}
            className="text-sm font-normal cursor-pointer text-foreground"
          >
            {t(SECTION_LABELS[section.id])}
          </Label>
          <button
            id={`section-${section.id}`}
            role="switch"
            aria-checked={section.visible}
            onClick={() => toggleSectionVisibility(section.id)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
              section.visible
                ? 'bg-indigo-600 dark:bg-indigo-500'
                : 'bg-muted'
            }`}
          >
            <span
              className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                section.visible ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const DashboardSettingsPopover = ({ t, isMobile }: DashboardSettingsPopoverProps) => {
  const { sections, toggleSectionVisibility, resetToDefaults } = 
    useDashboardSettingsStore();
  const [isOpen, setIsOpen] = useState(false);

  // Mobile: Bottom sheet drawer
  if (isMobile) {
    return (
      <>
        <Button
          variant="secondary"
          size="icon"
          title={t('dashboard.settings.title')}
          aria-label={t('dashboard.settings.title')}
          className="bg-white/20 hover:bg-white/30 border-0 text-white"
          onClick={() => setIsOpen(true)}
        >
          <Settings2 className="w-4 h-4" />
        </Button>

        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="text-left border-b">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-lg">{t('dashboard.settings.title')}</DrawerTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToDefaults}
                  className="text-xs text-muted-foreground hover:text-foreground -mr-2"
                >
                  {t('dashboard.settings.reset')}
                </Button>
              </div>
              <DrawerDescription className="text-sm">
                {t('dashboard.settings.description')}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 py-4 pb-8 overflow-y-auto">
              <SettingsContent
                t={t}
                sections={sections}
                toggleSectionVisibility={toggleSectionVisibility}
                resetToDefaults={resetToDefaults}
                showHeader={false}
              />
            </div>
            {/* Safe area padding for devices with home indicator */}
            <div className="h-[env(safe-area-inset-bottom,0px)]" />
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: Popover dropdown
  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="icon"
        title={t('dashboard.settings.title')}
        aria-label={t('dashboard.settings.title')}
        className="bg-white/20 hover:bg-white/30 border-0 text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings2 className="w-4 h-4" />
      </Button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-card border rounded-lg shadow-lg p-4 z-50">
            <SettingsContent
              t={t}
              sections={sections}
              toggleSectionVisibility={toggleSectionVisibility}
              resetToDefaults={resetToDefaults}
            />
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Analitica() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { payments, fetchPayments } = usePayments();
  const { patients, fetchPatients } = usePatients();
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  
  // Dashboard section visibility
  const isSectionVisible = useIsSectionVisible();
  
  // Scroll detection for sticky header
  const isScrolled = useScrollPosition(80);
  
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [allSessions, setAllSessions] = useState<SessionResponse[]>([]);

  // Track component mount to force refresh on initial load
  const [refreshKey, setRefreshKey] = useState(0);

  // Get time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return t('dashboard.greeting.morning');
    } else if (hour >= 12 && hour < 19) {
      return t('dashboard.greeting.afternoon');
    } else {
      return t('dashboard.greeting.evening');
    }
  }, [t]);

  // Fetch all data on mount and when time range changes
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Ensure encryption key is initialized before protected endpoints.
        // Without userKey, backend guards can return 401 and the dashboard stays in zero state.
        const maxAttempts = 30; // ~9 seconds
        let attempts = 0;
        while (isMounted && !apiClient.hasUserKey() && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300));
          attempts += 1;
        }

        const { start, end } = getDateRange(timeRange);
        
        // Format dates for API (YYYY-MM-DD) in local time to avoid timezone day shifts
        const fromDate = formatDateYmdLocal(start);
        const toDate = formatDateYmdLocal(end);
        
        // Get unique months needed for the date range
        const monthsToFetch = new Set<string>();
        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        
        while (current <= endMonth) {
          monthsToFetch.add(`${current.getFullYear()}-${current.getMonth() + 1}`);
          current.setMonth(current.getMonth() + 1);
        }
        
        // Fetch sessions for unique months in parallel
        const sessionPromises = Array.from(monthsToFetch).map(key => {
          const [year, month] = key.split('-').map(Number);
          return sessionService.getMonthly(year, month);
        });
        
        // Fetch all data in parallel, but don't fail the whole dashboard if one endpoint errors
        const [sessionsResult, paymentsResult, patientsResult] = await Promise.allSettled([
          Promise.all(sessionPromises),
          fetchPayments(true, { from: fromDate, to: toDate, limit: 99 }),
          fetchPatients(),
        ]);
        
        if (!isMounted) return;

        if (paymentsResult.status === 'rejected') {
          console.warn('[Analitica] Payments fetch failed:', paymentsResult.reason);
        }

        if (patientsResult.status === 'rejected') {
          console.warn('[Analitica] Patients fetch failed:', patientsResult.reason);
        }

        const sessionsResults = sessionsResult.status === 'fulfilled' ? sessionsResult.value : [];
        if (sessionsResult.status === 'rejected') {
          console.warn('[Analitica] Sessions fetch failed:', sessionsResult.reason);
        }
        
        // Flatten and deduplicate sessions by id, then filter by date range
        const sessionsMap = new Map<string, SessionResponse>();
        const startTime = start.getTime();
        const endTime = end.getTime();
        
        sessionsResults.flat().forEach(session => {
          if (session?.id && session.scheduledFrom) {
            const sessionTime = new Date(session.scheduledFrom).getTime();
            // Only include sessions within the actual date range
            if (sessionTime >= startTime && sessionTime <= endTime) {
              sessionsMap.set(session.id, session);
            }
          }
        });
        
        setAllSessions(Array.from(sessionsMap.values()));
      } catch (error) {
        console.error('[Analitica] Error loading data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, refreshKey]);

  // Transform sessions to UI-friendly format
  const sessionsUI = useMemo(() => {
    return allSessions
      .filter(session => session && session.scheduledFrom && session.scheduledTo)
      .map((session) => {
        const scheduledFrom = new Date(session.scheduledFrom);
        const scheduledTo = new Date(session.scheduledTo);
        const now = new Date();
        
        return {
          ...session,
          patientName: session.patient 
            ? `${session.patient.firstName} ${session.patient.lastName || ''}`.trim()
            : undefined,
          duration: session.actualDuration || 
            Math.round((scheduledTo.getTime() - scheduledFrom.getTime()) / (1000 * 60)),
          isPast: scheduledTo < now,
          isToday: scheduledFrom.toDateString() === now.toDateString(),
          formattedDate: scheduledFrom.toLocaleDateString('es-AR'),
          formattedTime: `${scheduledFrom.toLocaleTimeString('es-AR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })} - ${scheduledTo.toLocaleTimeString('es-AR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}`
        };
      });
  }, [allSessions]);

  // Filter data by time range
  const { start, end } = useMemo(() => getDateRange(timeRange), [timeRange]);

  // Data is already requested from backend using current date range.
  // Avoid client-side re-filtering to prevent timezone/parsing mismatches that can show false zeroes.
  const filteredSessions = useMemo(() => sessionsUI, [sessionsUI]);
  const filteredPayments = useMemo(() => payments, [payments]);

  // ==================== STATS CALCULATIONS ====================

  const stats = useMemo(() => {
    // Sessions stats
    const totalSessions = filteredSessions.length;
    const completedSessions = filteredSessions.filter(s => s.status === SessionStatus.COMPLETED).length;
    const cancelledSessions = filteredSessions.filter(s => s.status === SessionStatus.CANCELLED).length;
    const pendingSessions = filteredSessions.filter(s => 
      s.status === SessionStatus.PENDING || s.status === SessionStatus.CONFIRMED
    ).length;

    // Payment stats - ensure amount is a valid number
    const totalIncome = filteredPayments
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pendingIncome = filteredPayments
      .filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Patient stats - "active" means patients with sessions in the selected range
    // Get unique patient IDs from sessions in the time range
    const uniquePatientIds = new Set<string>();
    filteredSessions.forEach(session => {
      if (session.patient?.id) {
        uniquePatientIds.add(session.patient.id);
      }
    });
    const activePatients = uniquePatientIds.size;
    
    // New patients created in the time range
    const newPatients = patients.filter(p => {
      const createdDate = new Date(p.createdAt);
      return createdDate >= start && createdDate <= end;
    }).length;

    // Completion rate
    const completionRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100) 
      : 0;

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      pendingSessions,
      totalIncome,
      pendingIncome,
      activePatients,
      newPatients,
      completionRate,
    };
  }, [filteredSessions, filteredPayments, patients, start, end]);

  // ==================== CHART DATA ====================

  // Sessions by status (Pie Chart)
  const sessionsByStatus = useMemo(() => {
    return [
      { name: t('analytics.labels.completed'), value: stats.completedSessions, color: COLORS.success },
      { name: t('analytics.labels.confirmed'), value: filteredSessions.filter(s => s.status === SessionStatus.CONFIRMED).length, color: COLORS.primary },
      { name: t('analytics.labels.pendingStatus'), value: filteredSessions.filter(s => s.status === SessionStatus.PENDING).length, color: COLORS.warning },
      { name: t('analytics.labels.cancelled'), value: stats.cancelledSessions, color: COLORS.danger },
    ].filter(item => item.value > 0);
  }, [stats, filteredSessions, t]);

  // Sessions over time (Line Chart)
  const sessionsOverTime = useMemo(() => {
    const grouped: Record<string, { total: number; completed: number; cancelled: number }> = {};
    
    filteredSessions.forEach(session => {
      const date = new Date(session.scheduledFrom);
      let key: string;
      
      if (timeRange === 'week') {
        key = `${date.getDate()}/${date.getMonth() + 1}`;
      } else if (timeRange === 'month') {
        // Group by week
        const weekNum = Math.ceil(date.getDate() / 7);
        key = t('analytics.labels.weekNumber', { number: weekNum });
      } else {
        key = getMonthName(date.getMonth(), t);
      }
      
      if (!grouped[key]) {
        grouped[key] = { total: 0, completed: 0, cancelled: 0 };
      }
      grouped[key].total++;
      if (session.status === SessionStatus.COMPLETED) grouped[key].completed++;
      if (session.status === SessionStatus.CANCELLED) grouped[key].cancelled++;
    });

    return Object.entries(grouped).map(([name, data]) => ({
      name,
      total: data.total,
      completadas: data.completed,
      canceladas: data.cancelled,
    }));
  }, [filteredSessions, timeRange, t]);

  // Income over time (Bar Chart)
  const incomeOverTime = useMemo(() => {
    const grouped: Record<string, { paid: number; pending: number }> = {};
    
    filteredPayments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      let key: string;
      
      if (timeRange === 'week') {
        key = `${date.getDate()}/${date.getMonth() + 1}`;
      } else if (timeRange === 'month') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = t('analytics.labels.weekNumber', { number: weekNum });
      } else {
        key = getMonthName(date.getMonth(), t);
      }
      
      if (!grouped[key]) {
        grouped[key] = { paid: 0, pending: 0 };
      }
      
      const amount = Number(payment.amount) || 0;
      if (payment.status === PaymentStatus.PAID) {
        grouped[key].paid += amount;
      } else {
        grouped[key].pending += amount;
      }
    });

    return Object.entries(grouped).map(([name, data]) => ({
      name,
      cobrado: data.paid,
      pendiente: data.pending,
    }));
  }, [filteredPayments, timeRange, t]);

  // Sessions by hour (Bar Chart)
  const sessionsByHour = useMemo(() => {
    const hourCounts: Record<number, number> = {};
    
    filteredSessions.forEach(session => {
      const hour = new Date(session.scheduledFrom).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Generate data for working hours (8-20)
    const data = [];
    for (let hour = 8; hour <= 20; hour++) {
      data.push({
        name: `${hour}:00`,
        sesiones: hourCounts[hour] || 0,
      });
    }
    return data;
  }, [filteredSessions]);

  // Sessions by weekday (Bar Chart)
  const sessionsByWeekday = useMemo(() => {
    const dayCounts: Record<number, number> = {};
    
    filteredSessions.forEach(session => {
      const day = new Date(session.scheduledFrom).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    // Monday to Sunday (1-0 reordered)
    const days = [1, 2, 3, 4, 5, 6, 0];
    return days.map(day => ({
      name: getWeekdayName(day, t),
      sesiones: dayCounts[day] || 0,
    }));
  }, [filteredSessions, t]);

  // Payments by status (Pie Chart)
  const paymentsByStatus = useMemo(() => {
    const paid = filteredPayments.filter(p => p.status === PaymentStatus.PAID).length;
    const pending = filteredPayments.filter(p => p.status === PaymentStatus.PENDING).length;
    const overdue = filteredPayments.filter(p => p.status === PaymentStatus.OVERDUE).length;

    return [
      { name: t('analytics.labels.paid'), value: paid, color: COLORS.success },
      { name: t('analytics.labels.pendingStatus'), value: pending, color: COLORS.warning },
      { name: t('analytics.labels.overdue'), value: overdue, color: COLORS.danger },
    ].filter(item => item.value > 0);
  }, [filteredPayments, t]);

  // Top patients by sessions
  const topPatientsBySessions = useMemo(() => {
    const patientCounts: Record<string, { name: string; count: number }> = {};
    
    filteredSessions.forEach(session => {
      if (session.patient?.id) {
        const patientId = session.patient.id;
        const patientName = session.patientName || 'Sin nombre';
        
        if (!patientCounts[patientId]) {
          patientCounts[patientId] = { name: patientName, count: 0 };
        }
        patientCounts[patientId].count++;
      }
    });

    return Object.values(patientCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(p => ({ name: p.name, sesiones: p.count }));
  }, [filteredSessions]);

  // ==================== NEW DASHBOARD SECTIONS DATA ====================

  // Pending/overdue payments
  const pendingPayments = useMemo(() => {
    return payments
      .filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE)
      .sort((a, b) => {
        // Overdue first, then by date
        if (a.status === PaymentStatus.OVERDUE && b.status !== PaymentStatus.OVERDUE) return -1;
        if (b.status === PaymentStatus.OVERDUE && a.status !== PaymentStatus.OVERDUE) return 1;
        return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
      })
      .slice(0, 5);
  }, [payments]);

  // Upcoming birthdays (next 7 days)
  const upcomingBirthdays = useMemo(() => {
    const now = new Date();
    // Reset time to start of day for accurate comparison
    now.setHours(0, 0, 0, 0);
    const in7Days = new Date(now);
    in7Days.setDate(now.getDate() + 7);
    
    return patients
      .filter(p => {
        if (!p.birthDate) return false;
        const birth = new Date(p.birthDate);
        const thisYearBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
        // If birthday already passed this year, check next year
        if (thisYearBday < now) {
          thisYearBday.setFullYear(now.getFullYear() + 1);
        }
        // Check if birthday is between now and 7 days from now
        return thisYearBday >= now && thisYearBday <= in7Days;
      })
      .map(p => {
        const birth = new Date(p.birthDate!);
        const thisYearBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
        if (thisYearBday < now) {
          thisYearBday.setFullYear(now.getFullYear() + 1);
        }
        return { ...p, nextBirthday: thisYearBday };
      })
      .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime())
      .slice(0, 5);
  }, [patients]);

  // Patients without upcoming sessions
  const patientsWithoutNextSession = useMemo(() => {
    const now = new Date();
    const patientsWithFutureSessions = new Set(
      sessionsUI
        .filter(s => {
          const sessionDate = new Date(s.scheduledFrom);
          return sessionDate > now && 
            (s.status === SessionStatus.PENDING || s.status === SessionStatus.CONFIRMED);
        })
        .map(s => s.patient?.id)
        .filter(Boolean)
    );
    
    // Find the last known session for each patient
    const patientLastSession: Record<string, Date> = {};
    sessionsUI.forEach(s => {
      if (s.patient?.id) {
        const sessionDate = new Date(s.scheduledFrom);
        if (!patientLastSession[s.patient.id] || sessionDate > patientLastSession[s.patient.id]) {
          patientLastSession[s.patient.id] = sessionDate;
        }
      }
    });
    
    return patients
      // Include both:
      // - patients with past sessions but no upcoming
      // - patients who never had sessions
      .filter(p => !patientsWithFutureSessions.has(p.id))
      .map(p => ({ ...p, lastSessionDate: patientLastSession[p.id] }))
      .sort((a, b) => {
        const aTime = a.lastSessionDate?.getTime();
        const bTime = b.lastSessionDate?.getTime();

        // Patients with no session history first
        if (!aTime && !bTime) return 0;
        if (!aTime) return -1;
        if (!bTime) return 1;

        // Then by latest known session (most recent first)
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [patients, sessionsUI]);

  // Today's stats
  const todayStats = useMemo(() => {
    const today = new Date().toDateString();
    const now = new Date();
    const todaySessions = sessionsUI.filter(s => 
      new Date(s.scheduledFrom).toDateString() === today
    );
    const completedToday = todaySessions.filter(s => s.status === SessionStatus.COMPLETED).length;
    
    // Patients seen today (unique patients with completed sessions)
    const patientsSeenToday = new Set(
      todaySessions
        .filter(s => s.status === SessionStatus.COMPLETED && s.patient?.id)
        .map(s => s.patient!.id)
    ).size;
    
    // Next upcoming session
    const upcomingSessions = todaySessions
      .filter(s => new Date(s.scheduledFrom) > now && 
        (s.status === SessionStatus.PENDING || s.status === SessionStatus.CONFIRMED))
      .sort((a, b) => new Date(a.scheduledFrom).getTime() - new Date(b.scheduledFrom).getTime());
    
    const nextSession = upcomingSessions[0];
    const nextSessionData = nextSession ? {
      time: new Date(nextSession.scheduledFrom).toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      patientName: nextSession.patientName || t('common.unknown'),
      minutesUntil: Math.round((new Date(nextSession.scheduledFrom).getTime() - now.getTime()) / (1000 * 60)),
    } : undefined;
    
    const todayPayments = payments.filter(p => 
      new Date(p.paymentDate).toDateString() === today && p.status === PaymentStatus.PAID
    );
    const incomeToday = todayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    return {
      sessionsTotal: todaySessions.length,
      sessionsCompleted: completedToday,
      patientsSeenToday,
      nextSession: nextSessionData,
      incomeToday
    };
  }, [sessionsUI, payments, t]);

  // Helper function to format birthday relative day
  const formatBirthdayDay = (date: Date): string => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return t('dashboard.birthdays.today');
    if (diff === 1) return t('dashboard.birthdays.tomorrow');
    
    // Return day name
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dayNames[date.getDay()];
  };

  // Quick actions data for the modern bar
  const quickActions = useMemo(() => [
    {
      id: 'new-session',
      label: t('dashboard.quickActions.newSession'),
      shortLabel: t('dashboard.quickActions.session'),
      icon: Plus,
      onClick: () => navigate('/dashboard/agenda?action=new'),
      color: 'text-indigo-600',
      hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
      hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    },
    {
      id: 'new-patient',
      label: t('dashboard.quickActions.newPatient'),
      shortLabel: t('dashboard.quickActions.patient'),
      icon: UserPlus,
      onClick: () => navigate('/dashboard/pacientes?action=new'),
      color: 'text-blue-600',
      hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    },
    {
      id: 'new-payment',
      label: t('dashboard.quickActions.newPayment'),
      shortLabel: t('dashboard.quickActions.payment'),
      icon: Receipt,
      onClick: () => navigate('/dashboard/cobros?action=new'),
      color: 'text-green-600',
      hoverBg: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      hoverBorder: 'hover:border-green-300 dark:hover:border-green-700',
    },
    {
      id: 'view-agenda',
      label: t('dashboard.quickActions.viewAgenda'),
      shortLabel: t('dashboard.quickActions.agenda'),
      icon: Calendar,
      onClick: () => navigate('/dashboard/agenda'),
      color: 'text-purple-600',
      hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
      hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
    },
  ], [t, navigate]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Welcome Header - Sticky when scrolled (no AnimatedSection to preserve sticky behavior) */}
      <CompactHeader
        greeting={greeting}
        userName={user?.firstName || t('auth.welcome')}
        subtitle={t('dashboard.welcomeSubtitle')}
        isScrolled={isScrolled}
        actions={<DashboardSettingsPopover t={t} isMobile={isMobile} />}
      />

      {/* Quick Actions - Sticky when scrolled (no AnimatedSection to preserve sticky behavior) */}
      {isSectionVisible('quickActions') && (
        <QuickActionsBar
          actions={quickActions}
          isScrolled={isScrolled}
          isMobile={isMobile}
        />
      )}

      {/* Today's Summary Card - Enhanced */}
      {isSectionVisible('todaySummary') && (
        <AnimatedSection delay={0.15}>
          <TodaySummaryWidget
            data={todayStats}
            formatCurrency={formatCurrency}
            t={t}
            onViewAgenda={() => navigate('/dashboard/agenda')}
          />
        </AnimatedSection>
      )}

      {/* Stats Grid */}
      {isSectionVisible('statCards') && (
        <AnimatedSection delay={0.2}>
          <>
            {/* Time Range Filter - applies to stats and charts */}
            <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t('analytics.title')}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRefreshKey(k => k + 1)}
                disabled={isLoading}
                title={t('analytics.refresh')}
                aria-label={t('analytics.refresh')}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                  className="justify-between"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t(TIME_RANGE_KEYS.find(o => o.value === timeRange)?.key || '')}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
                
                {showRangeDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowRangeDropdown(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg z-20">
                      {TIME_RANGE_KEYS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTimeRange(option.value);
                            setShowRangeDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-muted first:rounded-t-lg last:rounded-b-lg ${
                            timeRange === option.value
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                              : 'text-foreground'
                          }`}
                        >
                          {t(option.key)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Compact Stats Grid with Mini Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MiniStatCard
              title={t('analytics.stats.sessions')}
              value={stats.totalSessions}
              subtitle={`${stats.completedSessions} ${t('analytics.stats.completed')}`}
              icon={Calendar}
              iconBg="bg-indigo-100 dark:bg-indigo-900/30"
              iconColor="text-indigo-600 dark:text-indigo-400"
              onClick={() => navigate('/dashboard/agenda')}
              compact={isMobile}
            />
            <MiniStatCard
              title={t('analytics.stats.income')}
              value={formatCurrency(stats.totalIncome)}
              subtitle={`${formatCurrency(stats.pendingIncome)} ${t('analytics.stats.pending')}`}
              icon={DollarSign}
              iconBg="bg-green-100 dark:bg-green-900/30"
              iconColor="text-green-600 dark:text-green-400"
              onClick={() => navigate('/dashboard/cobros')}
              compact={isMobile}
            />
            <MiniStatCard
              title={t('analytics.stats.patientsAttended')}
              value={stats.activePatients}
              subtitle={`${stats.newPatients} ${t('analytics.stats.newInPeriod')}`}
              icon={Users}
              iconBg="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
              onClick={() => navigate('/dashboard/pacientes')}
              compact={isMobile}
            />
            {/* Completion Rate with Radial Progress */}
            <Card
              className="p-3 sm:p-4 bg-card cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
              onClick={() => navigate('/dashboard/agenda')}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {t('analytics.stats.attendanceRate')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.cancelledSessions} {t('analytics.stats.cancellations')}
                  </p>
                </div>
                <RadialProgress
                  value={stats.completionRate}
                  size={isMobile ? 48 : 56}
                  strokeWidth={isMobile ? 5 : 6}
                  color={stats.completionRate >= 80 ? '#22c55e' : stats.completionRate >= 60 ? '#f59e0b' : '#ef4444'}
                />
              </div>
            </Card>
          </div>
          </>
        </AnimatedSection>
      )}

      {/* Pending Payments */}
      {isSectionVisible('pendingPayments') && (
        <AnimatedSection delay={0.25}>
          <Card className="p-4 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-foreground">{t('dashboard.pendingPayments.title')}</h3>
            </div>
            {pendingPayments.length > 0 && (
              <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                {pendingPayments.length}
              </Badge>
            )}
          </div>
          {pendingPayments.length > 0 ? (
            <div className="space-y-2">
              {pendingPayments.map(payment => (
                <button
                  key={payment.id}
                  onClick={() => navigate('/dashboard/cobros')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {payment.patient ? `${payment.patient.firstName} ${payment.patient.lastName || ''}`.trim() : 'Sin paciente'}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(Number(payment.amount) || 0)}</p>
                  </div>
                  <Badge 
                    variant={payment.status === PaymentStatus.OVERDUE ? 'destructive' : 'secondary'}
                    className={payment.status === PaymentStatus.OVERDUE 
                      ? '' 
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'}
                  >
                    {payment.status === PaymentStatus.OVERDUE ? t('analytics.labels.overdue') : t('analytics.labels.pendingStatus')}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title={t('dashboard.pendingPayments.empty')}
              variant="success"
            />
          )}
          </Card>
        </AnimatedSection>
      )}

      {/* Insights Row: Birthdays and Patients without session */}
      {(isSectionVisible('birthdays') || isSectionVisible('patientsWithoutSession')) && (
        <AnimatedSection delay={0.3}>
          <>
            {/* Mobile: Swipeable Cards */}
            <div className="lg:hidden">
              <SwipeableCards>
                {/* Cumpleaños próximos - Mobile */}
                {isSectionVisible('birthdays') && (
                  <Card className="p-4 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      <h3 className="font-semibold text-foreground">{t('dashboard.birthdays.title')}</h3>
                    </div>
                    {upcomingBirthdays.length > 0 && (
                      <Badge className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800">
                        {upcomingBirthdays.length}
                      </Badge>
                    )}
                  </div>
                  {upcomingBirthdays.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingBirthdays.slice(0, 4).map(patient => (
                        <button
                          key={patient.id}
                          onClick={() => navigate(`/dashboard/pacientes/${patient.id}`)}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                              <Gift className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{patient.firstName} {patient.lastName}</p>
                              <p className="text-xs text-muted-foreground">
                                {patient.nextBirthday.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant="secondary"
                            className={
                              formatBirthdayDay(patient.nextBirthday) === t('dashboard.birthdays.today') 
                                ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800' 
                                : 'bg-muted text-foreground'
                            }
                          >
                            {formatBirthdayDay(patient.nextBirthday)}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Gift}
                      title={t('dashboard.birthdays.empty')}
                      variant="neutral"
                    />
                  )}
                </Card>
              )}

              {/* Pacientes sin próxima cita - Mobile */}
              {isSectionVisible('patientsWithoutSession') && (
                <Card className="p-4 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <UserX className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <h3 className="font-semibold text-foreground">{t('dashboard.noUpcomingSession.title')}</h3>
                    </div>
                    {patientsWithoutNextSession.length > 0 && (
                      <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                        {patientsWithoutNextSession.length}
                      </Badge>
                    )}
                  </div>
                  {patientsWithoutNextSession.length > 0 ? (
                    <div className="space-y-2">
                      {patientsWithoutNextSession.slice(0, 4).map(patient => (
                        <button
                          key={patient.id}
                          onClick={() => navigate(`/dashboard/pacientes/${patient.id}`)}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{patient.firstName} {patient.lastName}</p>
                            {patient.lastSessionDate && (
                              <p className="text-xs text-muted-foreground">
                                {t('dashboard.noUpcomingSession.lastSession')}: {patient.lastSessionDate.toLocaleDateString('es-AR')}
                              </p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/agenda?action=new&patientId=${patient.id}`);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={CheckCircle2}
                      title={t('dashboard.noUpcomingSession.empty')}
                      variant="success"
                    />
                  )}
                </Card>
              )}
            </SwipeableCards>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-6">
          {/* Cumpleaños próximos */}
          {isSectionVisible('birthdays') && (
            <Card className="p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  <h3 className="font-semibold text-foreground">{t('dashboard.birthdays.title')}</h3>
                </div>
                {upcomingBirthdays.length > 0 && (
                  <Badge className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800">
                    {upcomingBirthdays.length}
                  </Badge>
                )}
              </div>
              {upcomingBirthdays.length > 0 ? (
                <div className="space-y-2">
                  {upcomingBirthdays.map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => navigate(`/dashboard/pacientes/${patient.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                          <Gift className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{patient.firstName} {patient.lastName}</p>
                          <p className="text-xs text-muted-foreground">
                            {patient.nextBirthday.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={
                          formatBirthdayDay(patient.nextBirthday) === t('dashboard.birthdays.today') 
                            ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800' 
                            : 'bg-muted text-foreground'
                        }
                      >
                        {formatBirthdayDay(patient.nextBirthday)}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Gift}
                  title={t('dashboard.birthdays.empty')}
                  variant="neutral"
                />
              )}
            </Card>
          )}

          {/* Pacientes sin próxima cita */}
          {isSectionVisible('patientsWithoutSession') && (
            <Card className="p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <h3 className="font-semibold text-foreground">{t('dashboard.noUpcomingSession.title')}</h3>
                </div>
                {patientsWithoutNextSession.length > 0 && (
                  <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                    {patientsWithoutNextSession.length}
                  </Badge>
                )}
              </div>
              {patientsWithoutNextSession.length > 0 ? (
                <div className="space-y-2">
                  {patientsWithoutNextSession.map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => navigate(`/dashboard/pacientes/${patient.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{patient.firstName} {patient.lastName}</p>
                        {patient.lastSessionDate && (
                          <p className="text-xs text-muted-foreground">
                            {t('dashboard.noUpcomingSession.lastSession')}: {patient.lastSessionDate.toLocaleDateString('es-AR')}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/agenda?action=new&patientId=${patient.id}`);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t('dashboard.quickActions.newSession')}
                      </Button>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title={t('dashboard.noUpcomingSession.empty')}
                  variant="success"
                />
              )}
            </Card>
          )}
          </div>
          </>
        </AnimatedSection>
      )}

      {/* Charts Section */}
      {isSectionVisible('charts') && (
        <AnimatedSection delay={0.35}>
          <div className="space-y-4 sm:space-y-6">
            {/* Charts Grid - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Sessions Over Time */}
            <ChartCard 
              title={t('analytics.charts.sessionsOverTime.title')} 
              subtitle={t('analytics.charts.sessionsOverTime.subtitle')}
              onClick={() => navigate('/dashboard/agenda')}
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sessionsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" className="dark:stroke-gray-500" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" className="dark:stroke-gray-500" allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      name={t('analytics.labels.total')}
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      dot={{ fill: COLORS.primary }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completadas" 
                      name={t('analytics.labels.completed')}
                      stroke={COLORS.success} 
                      strokeWidth={2}
                      dot={{ fill: COLORS.success }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Sessions by Status */}
            <ChartCard 
              title={t('analytics.charts.sessionStatus.title')} 
              subtitle={t('analytics.charts.sessionStatus.subtitle')}
              onClick={() => navigate('/dashboard/agenda')}
            >
              <div className="h-64 flex items-center justify-center">
                {sessionsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sessionsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {sessionsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title={t('analytics.noData')}
                    variant="neutral"
                  />
                )}
              </div>
            </ChartCard>
          </div>

          {/* Charts Grid - Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Income Over Time */}
            <ChartCard 
              title={t('analytics.charts.incomeOverTime.title')} 
              subtitle={t('analytics.charts.incomeOverTime.subtitle')}
              onClick={() => navigate('/dashboard/cobros')}
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" className="dark:stroke-gray-500" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" className="dark:stroke-gray-500" tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                    <Legend />
                    <Bar dataKey="cobrado" name={t('analytics.labels.collected')} fill={COLORS.success} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pendiente" name={t('analytics.labels.pendingAmount')} fill={COLORS.warning} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Payments by Status */}
            <ChartCard 
              title={t('analytics.charts.paymentStatus.title')} 
              subtitle={t('analytics.charts.paymentStatus.subtitle')}
              onClick={() => navigate('/dashboard/cobros')}
            >
              <div className="h-64 flex items-center justify-center">
                {paymentsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {paymentsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title={t('analytics.noData')}
                    variant="neutral"
                  />
                )}
              </div>
            </ChartCard>
          </div>

          {/* Charts Grid - Row 3: Occupancy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Sessions by Hour */}
            <ChartCard 
              title={t('analytics.charts.hourlyOccupancy.title')} 
              subtitle={t('analytics.charts.hourlyOccupancy.subtitle')}
              onClick={() => navigate('/dashboard/agenda')}
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionsByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" className="dark:stroke-gray-500" interval={0} angle={-45} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" className="dark:stroke-gray-500" allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sesiones" name={t('analytics.labels.sessions')} fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Sessions by Weekday */}
            <ChartCard 
              title={t('analytics.charts.dailyOccupancy.title')} 
              subtitle={t('analytics.charts.dailyOccupancy.subtitle')}
              onClick={() => navigate('/dashboard/agenda')}
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionsByWeekday}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" className="dark:stroke-gray-500" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" className="dark:stroke-gray-500" allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sesiones" name={t('analytics.labels.sessions')} fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Top Patients */}
          <ChartCard 
            title={t('analytics.charts.topPatients.title')} 
            subtitle={t('analytics.charts.topPatients.subtitle')}
            onClick={() => navigate('/dashboard/pacientes')}
          >
            <div className="h-64">
              {topPatientsBySessions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPatientsBySessions} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" className="dark:stroke-gray-500" allowDecimals={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }} 
                      stroke="#9ca3af"
                      className="dark:stroke-gray-500"
                      width={120}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sesiones" name={t('analytics.labels.sessions')} fill={COLORS.purple} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon={Users}
                  title={t('analytics.noData')}
                  variant="neutral"
                  className="h-full"
                />
              )}
            </div>
          </ChartCard>
          </div>
        </AnimatedSection>
      )}
    </div>
  );
}
