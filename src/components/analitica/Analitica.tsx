import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  TrendingUp, 
  CheckCircle2,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/shared/Skeleton';
import { usePayments } from '@/lib/hooks/usePayments';
import { usePatients, useResponsive } from '@/lib/hooks';
import { SessionStatus } from '@/lib/types/session';
import { PaymentStatus } from '@/lib/types/api.types';
import { sessionService } from '@/lib/api/sessions';
import type { SessionResponse } from '@/lib/types/session';

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

const getDateRange = (range: TimeRange): { start: Date; end: Date } => {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  
  switch (range) {
    case 'week':
      // Last 7 days
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      // Current calendar month (1st to today)
      start.setDate(1);
      break;
    case 'quarter':
      // Last 3 calendar months
      start.setMonth(now.getMonth() - 2);
      start.setDate(1);
      break;
    case 'year':
      // Current calendar year (Jan 1st to today)
      start.setMonth(0);
      start.setDate(1);
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
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: { value: number; isPositive: boolean };
}

const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, trendLabel }: StatCardProps & { trendLabel?: string }) => (
  <Card className="p-3 sm:p-4 lg:p-6 bg-white">
    <div className="flex items-start justify-between gap-2">
      <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
        <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{value}</p>
        {subtitle && <p className="text-[10px] sm:text-xs text-gray-400 truncate">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] sm:text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 ${!trend.isPositive ? 'rotate-180' : ''}`} />
            <span className="truncate">{trend.value}% {trendLabel}</span>
          </div>
        )}
      </div>
      <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${iconColor}`} />
      </div>
    </div>
  </Card>
);

// ============================================================================
// CHART CARD WRAPPER
// ============================================================================

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const ChartCard = ({ title, subtitle, children, className = '' }: ChartCardProps) => (
  <Card className={`p-3 sm:p-4 lg:p-6 bg-white ${className}`}>
    <div className="mb-3 sm:mb-4">
      <h3 className="text-sm sm:text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>}
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
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Analitica() {
  const { t } = useTranslation();
  const { payments, fetchPayments } = usePayments();
  const { patients, fetchPatients } = usePatients();
  const { isMobile } = useResponsive();
  
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [allSessions, setAllSessions] = useState<SessionResponse[]>([]);

  // Track component mount to force refresh on initial load
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch all data on mount and when time range changes
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { start, end } = getDateRange(timeRange);
        
        // Format dates for API (YYYY-MM-DD)
        const fromDate = start.toISOString().split('T')[0];
        const toDate = end.toISOString().split('T')[0];
        
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
        
        // Fetch all data in parallel
        const [sessionsResults] = await Promise.all([
          Promise.all(sessionPromises),
          fetchPayments(true, { from: fromDate, to: toDate, limit: 1000 }),
          fetchPatients(),
        ]);
        
        if (!isMounted) return;
        
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

  const filteredSessions = useMemo(() => {
    return sessionsUI.filter(session => {
      const sessionDate = new Date(session.scheduledFrom);
      return sessionDate >= start && sessionDate <= end;
    });
  }, [sessionsUI, start, end]);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate >= start && paymentDate <= end;
    });
  }, [payments, start, end]);

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

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('analytics.title')}</h1>
          <p className="text-sm text-gray-500">{t('analytics.loading')}</p>
        </div>
        <SkeletonList items={4} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('analytics.title')}</h1>
          <p className="text-sm text-gray-500">{t('analytics.subtitle')}</p>
        </div>
        
        {/* Time Range Selector and Refresh */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={isLoading}
            title={t('analytics.refresh')}
            aria-label={t('analytics.refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className="w-full sm:w-auto justify-between"
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
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {TIME_RANGE_KEYS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTimeRange(option.value);
                        setShowRangeDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        timeRange === option.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('analytics.stats.sessions')}
          value={stats.totalSessions}
          subtitle={`${stats.completedSessions} ${t('analytics.stats.completed')}`}
          icon={Calendar}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          trendLabel={t('analytics.stats.vsPrevious')}
        />
        <StatCard
          title={t('analytics.stats.income')}
          value={formatCurrency(stats.totalIncome)}
          subtitle={`${formatCurrency(stats.pendingIncome)} ${t('analytics.stats.pending')}`}
          icon={DollarSign}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          trendLabel={t('analytics.stats.vsPrevious')}
        />
        <StatCard
          title={t('analytics.stats.patientsAttended')}
          value={stats.activePatients}
          subtitle={`${stats.newPatients} ${t('analytics.stats.newInPeriod')}`}
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          trendLabel={t('analytics.stats.vsPrevious')}
        />
        <StatCard
          title={t('analytics.stats.attendanceRate')}
          value={`${stats.completionRate}%`}
          subtitle={`${stats.cancelledSessions} ${t('analytics.stats.cancellations')}`}
          icon={CheckCircle2}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          trendLabel={t('analytics.stats.vsPrevious')}
        />
      </div>

      {/* Charts Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions Over Time */}
        <ChartCard title={t('analytics.charts.sessionsOverTime.title')} subtitle={t('analytics.charts.sessionsOverTime.subtitle')}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sessionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
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
        <ChartCard title={t('analytics.charts.sessionStatus.title')} subtitle={t('analytics.charts.sessionStatus.subtitle')}>
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
              <p className="text-gray-500 text-sm">{t('analytics.noData')}</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Charts Grid - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Over Time */}
        <ChartCard title={t('analytics.charts.incomeOverTime.title')} subtitle={t('analytics.charts.incomeOverTime.subtitle')}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                <Legend />
                <Bar dataKey="cobrado" name={t('analytics.labels.collected')} fill={COLORS.success} radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendiente" name={t('analytics.labels.pendingAmount')} fill={COLORS.warning} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Payments by Status */}
        <ChartCard title={t('analytics.charts.paymentStatus.title')} subtitle={t('analytics.charts.paymentStatus.subtitle')}>
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
              <p className="text-gray-500 text-sm">{t('analytics.noData')}</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Charts Grid - Row 3: Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions by Hour */}
        <ChartCard title={t('analytics.charts.hourlyOccupancy.title')} subtitle={t('analytics.charts.hourlyOccupancy.subtitle')}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionsByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" interval={0} angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sesiones" name={t('analytics.labels.sessions')} fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Sessions by Weekday */}
        <ChartCard title={t('analytics.charts.dailyOccupancy.title')} subtitle={t('analytics.charts.dailyOccupancy.subtitle')}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionsByWeekday}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sesiones" name={t('analytics.labels.sessions')} fill={COLORS.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Top Patients */}
      <ChartCard title={t('analytics.charts.topPatients.title')} subtitle={t('analytics.charts.topPatients.subtitle')}>
        <div className="h-64">
          {topPatientsBySessions.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPatientsBySessions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  stroke="#9ca3af" 
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sesiones" name={t('analytics.labels.sessions')} fill={COLORS.purple} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 text-sm">{t('analytics.noData')}</p>
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  );
}
