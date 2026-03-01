import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Plus, DollarSign, CheckCircle2, Clock, AlertCircle, Loader2, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useSessions } from '@/lib/stores/sessionStore';
import { usePayments } from '@/lib/hooks/usePayments';
import { useCalendarStore } from '@/lib/stores/calendarStore';
import { useResponsive, usePatients } from '@/lib/hooks';
import { PaymentStats } from './PaymentStats';
import { PaymentDrawer } from './PaymentDrawer';
import { PaymentDetailModal } from './PaymentDetailModal';
import { ReminderModal } from './ReminderModal';
import { DateFilters, SearchAndFilters, type SortOption, type QuickFilter, type StatusFilterOption } from './PaymentFilters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonList, SimplePagination, InfiniteScrollLoader, ConfirmDialog, EmptyState, CalendarRequiredDialog } from '@/components/shared';
import { formatCurrency } from '@/lib/utils/dateFormatters';
import { getNameInitials } from '@/lib/utils/nameInitials';
import type { CreatePaymentDto, Payment, UpdatePaymentDto } from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';
import type { SessionUI } from '@/lib/types/session';
import type { PaymentFilters as PaymentFiltersType } from '@/lib/services/payment.service';

// ============================================================================
// CONSTANTS
// ============================================================================

const ITEMS_PER_PAGE = 10;
const INFINITE_SCROLL_BATCH = 10;

// ============================================================================
// UTILITIES
// ============================================================================

const formatDateShort = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const getInitials = (name: string) => getNameInitials(name, 'SP');

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

const STATUS_CONFIG = {
  [PaymentStatus.PAID]: { 
    labelKey: 'payments.paid', 
    className: 'bg-green-100 text-green-800',
    borderColor: 'border-l-green-500',
    iconBgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    Icon: CheckCircle2,
  },
  [PaymentStatus.PENDING]: { 
    labelKey: 'payments.pending', 
    className: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-l-yellow-500',
    iconBgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    Icon: Clock,
  },
  [PaymentStatus.OVERDUE]: { 
    labelKey: 'payments.overdue', 
    className: 'bg-red-100 text-red-800',
    borderColor: 'border-l-red-500',
    iconBgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    Icon: AlertCircle,
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {t(config.labelKey)}
    </span>
  );
};

// ============================================================================
// UNIFIED COBRO ITEM TYPE
// ============================================================================

/**
 * Unified item that can represent either:
 * - A Payment from the database (isVirtual = false)
 * - A Session without payment shown as pending (isVirtual = true)
 */
interface CobroItem {
  id: string;
  isVirtual: boolean; // true = session without payment, false = real payment
  status: PaymentStatus;
  amount: number;
  date: string;
  patientName: string;
  patientId?: string;
  sessionId?: string;
  description?: string;
  // Original payment data (only for real payments)
  payment?: Payment;
}

// ============================================================================
// UNIFIED COBRO CARD
// ============================================================================

interface CobroCardProps {
  item: CobroItem;
  onMarkAsPaid?: () => void;
  onReminder?: () => void;
  onDelete?: () => void;
  onViewDetail?: () => void;
  onRegisterPayment?: () => void;
  isMarkingAsPaid?: boolean;
}

const CobroCard = ({ item, onMarkAsPaid, onReminder, onDelete, onViewDetail, onRegisterPayment, isMarkingAsPaid }: CobroCardProps) => {
  const { t } = useTranslation();
  const initials = getInitials(item.patientName || 'SP');
  const config = STATUS_CONFIG[item.status];
  const Icon = config.Icon;
  const isPaid = item.status === PaymentStatus.PAID;
  const isPending = item.status === PaymentStatus.PENDING;

  return (
    <Card className={`p-3 transition-all hover:shadow-md border-l-4 bg-card ${config.borderColor}`}>
      {/* Clickeable area for detail */}
      <div
        className={!item.isVirtual ? 'cursor-pointer' : ''}
        onClick={!item.isVirtual ? onViewDetail : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.iconBgColor}`}>
              {isPaid ? (
                <Icon className={`h-4 w-4 ${config.iconColor}`} />
              ) : (
                <span className={`text-xs font-semibold ${config.iconColor}`}>{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{item.patientName || t('payments.noPatient')}</p>
              <p className="text-xs text-muted-foreground">{formatDateShort(item.date)}</p>
            </div>
          </div>
          <PaymentStatusBadge status={item.status} />
        </div>
        
        <div className="flex items-center justify-between mt-3">
          {item.description && (
            <p className="text-xs text-muted-foreground truncate flex-1 mr-2">{item.description}</p>
          )}
          <p className="font-semibold text-foreground">{formatCurrency(item.amount)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 mt-3 border-t border-border">
        {/* Virtual items (sessions without payment) - show Register Payment button */}
        {item.isVirtual && isPending && onRegisterPayment && (
          <Button 
            size="sm" 
            className="flex-1" 
            onClick={onRegisterPayment}
          >
            <DollarSign className="h-4 w-4 mr-1.5" />
            {t('payments.registerPayment')}
          </Button>
        )}
        {/* Real payments - show Reminder and Mark as Paid buttons */}
        {!item.isVirtual && !isPaid && onReminder && (
          <Button size="sm" variant="outline" className="flex-1" onClick={onReminder}>
            <Bell className="h-4 w-4 mr-1.5" />
            {t('payments.messages.reminder')}
          </Button>
        )}
        {!item.isVirtual && !isPaid && onMarkAsPaid && (
          <Button 
            size="sm" 
            className="flex-1" 
            onClick={onMarkAsPaid}
            disabled={isMarkingAsPaid}
          >
            {isMarkingAsPaid ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4 mr-1.5" />
            )}
            {t('payments.messages.markAsPaidShort')}
          </Button>
        )}
        {!item.isVirtual && onDelete && (
          <Button 
            size="sm" 
            variant="outline" 
            className={`text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ${isPaid ? 'flex-1' : ''}`}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            {isPaid && <span className="ml-1.5">{t('common.delete')}</span>}
          </Button>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// LEGACY PAYMENT CARD (kept for table view compatibility)
// ============================================================================

interface PaymentCardProps {
  payment: Payment;
  onMarkAsPaid?: () => void;
  onReminder?: () => void;
  onDelete?: () => void;
  onViewDetail?: () => void;
  isMarkingAsPaid?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PaymentCard = ({ payment, onMarkAsPaid, onReminder, onDelete, onViewDetail, isMarkingAsPaid }: PaymentCardProps) => {
  const { t } = useTranslation();
  const patientName = payment.patient 
    ? `${payment.patient.firstName} ${payment.patient.lastName || ''}`.trim()
    : t('payments.noPatient');
  
  const initials = getInitials(patientName);
  const config = STATUS_CONFIG[payment.status];
  const Icon = config.Icon;
  const isPaid = payment.status === PaymentStatus.PAID;

  return (
    <Card className={`p-3 transition-all hover:shadow-md border-l-4 bg-card ${config.borderColor}`}>
      {/* Clickeable area for detail */}
      <div
        className="cursor-pointer"
        onClick={onViewDetail}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.iconBgColor}`}>
              {isPaid ? (
                <Icon className={`h-4 w-4 ${config.iconColor}`} />
              ) : (
                <span className={`text-xs font-semibold ${config.iconColor}`}>{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{patientName}</p>
              <p className="text-xs text-muted-foreground">{formatDateShort(payment.paymentDate)}</p>
            </div>
          </div>
          <PaymentStatusBadge status={payment.status} />
        </div>
        
        <div className="flex items-center justify-between mt-3">
          {payment.description && (
            <p className="text-xs text-muted-foreground truncate flex-1 mr-2">{payment.description}</p>
          )}
          <p className="font-semibold text-foreground">{formatCurrency(payment.amount)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 mt-3 border-t border-border">
        {!isPaid && onReminder && (
          <Button size="sm" variant="outline" className="flex-1" onClick={onReminder}>
            <Bell className="h-4 w-4 mr-1.5" />
            {t('payments.messages.reminder')}
          </Button>
        )}
        {!isPaid && onMarkAsPaid && (
          <Button 
            size="sm" 
            className="flex-1" 
            onClick={onMarkAsPaid}
            disabled={isMarkingAsPaid}
          >
            {isMarkingAsPaid ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4 mr-1.5" />
            )}
            {t('payments.messages.markAsPaidShort')}
          </Button>
        )}
        {onDelete && (
          <Button 
            size="sm" 
            variant="outline" 
            className={`text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ${isPaid ? 'flex-1' : ''}`}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            {isPaid && <span className="ml-1.5">{t('common.delete')}</span>}
          </Button>
        )}
      </div>
    </Card>
  );
};

// ConfirmDialog is now imported from @/components/shared

// Helper to get patient name from payment (used with t() in component)
const getPaymentPatientName = (payment: Payment, fallback: string): string => {
  return payment.patient 
    ? `${payment.patient.firstName} ${payment.patient.lastName || ''}`.trim()
    : fallback;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Cobros() {
  const { t } = useTranslation();
  const { sessionsUI, fetchUpcoming } = useSessions();
  const { fetchPatients } = usePatients();
  const isCalendarConnected = useCalendarStore(state => state.isConnected);
  const connectCalendar = useCalendarStore(state => state.connectCalendar);
  const checkCalendarConnection = useCalendarStore(state => state.checkConnection);
  const { 
    payments,
    totals,
    isLoading: isLoadingPayments, 
    fetchPayments, 
    createPayment,
    updatePayment,
    markAsPaid,
    deletePayment,
  } = usePayments();
  const { isMobile } = useResponsive();
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [preselectedSession, setPreselectedSession] = useState<SessionUI | null>(null);
  const [reminderPayment, setReminderPayment] = useState<Payment | null>(null);
  const [markingAsPaidId, setMarkingAsPaidId] = useState<string | null>(null);
  const [deletePaymentData, setDeletePaymentData] = useState<Payment | null>(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Infinite scroll state (for mobile)
  const [visibleCount, setVisibleCount] = useState(INFINITE_SCROLL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset page when filters change
  useEffect(() => { 
    setCurrentPage(1); 
    setVisibleCount(INFINITE_SCROLL_BATCH);
  }, [searchTerm, dateFrom, dateTo, statusFilter, sortBy]);

  // Infinite scroll effect (mobile only)
  useEffect(() => {
    if (!isMobile) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + INFINITE_SCROLL_BATCH);
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isMobile, isLoadingMore]);

  // Debounced search - not used for server since patient data is encrypted
  // We filter client-side after receiving the payments
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build server-side filters for payments (date range and pagination only)
  // Patient search is done client-side since data is encrypted
  const serverFilters = useMemo((): PaymentFiltersType => {
    const filters: PaymentFiltersType = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    };
    
    if (dateFrom) {
      filters.from = dateFrom;
    }
    if (dateTo) {
      filters.to = dateTo;
    }
    // Status filter could be server-side if backend supports it
    // For now we do it client-side
    
    return filters;
  }, [dateFrom, dateTo, currentPage]);

  // Fetch payments when server filters change
  useEffect(() => {
    fetchPayments(true, serverFilters).catch(() => {});
  }, [serverFilters, fetchPayments]);

  // Single fetch on mount for sessions and patients
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchUpcoming(), fetchPatients(), checkCalendarConnection()]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get session IDs that already have a payment
  const sessionIdsWithPayment = useMemo(() => {
    return new Set(payments.map(p => p.sessionId).filter(Boolean));
  }, [payments]);

  // Create virtual pending items from sessions without payment (only past/completed sessions)
  const virtualPendingItems = useMemo((): CobroItem[] => {
    const now = new Date();
    
    return sessionsUI
      .filter(session => {
        // Only include past sessions (completed or past date)
        const sessionDate = new Date(session.scheduledFrom);
        const isPast = sessionDate < now || session.status === 'completed';
        // Exclude sessions that already have a payment
        const hasPayment = sessionIdsWithPayment.has(session.id);
        // Only include if session has a cost
        const hasCost = session.cost && session.cost > 0;
        
        return isPast && !hasPayment && hasCost;
      })
      .map(session => ({
        id: `virtual-${session.id}`,
        isVirtual: true,
        status: PaymentStatus.PENDING,
        amount: session.cost || 0,
        date: session.scheduledFrom,
        patientName: session.patientName || t('payments.noPatient'),
        patientId: session.patient?.id,
        sessionId: session.id,
        description: session.sessionSummary || t('payments.virtual.sessionUnpaid'),
      }));
  }, [sessionsUI, sessionIdsWithPayment, t]);

  // Convert real payments to CobroItems
  const realPaymentItems = useMemo((): CobroItem[] => {
    return payments.map(payment => ({
      id: payment.id,
      isVirtual: false,
      status: payment.status,
      amount: payment.amount,
      date: payment.paymentDate,
      patientName: payment.patient 
        ? `${payment.patient.firstName} ${payment.patient.lastName || ''}`.trim()
        : 'Sin paciente',
      patientId: payment.patient?.id,
      sessionId: payment.sessionId,
      description: payment.description,
      payment,
    }));
  }, [payments]);

  // Unified list of all cobro items (real payments + virtual pending)
  const allCobroItems = useMemo((): CobroItem[] => {
    return [...realPaymentItems, ...virtualPendingItems];
  }, [realPaymentItems, virtualPendingItems]);

  // Client-side filtering (status and patient search)
  const filteredCobroItems = useMemo(() => {
    let filtered = [...allCobroItems];

    // Filter by date range (for virtual items - real payments are already filtered by server)
    if (dateFrom || dateTo) {
      filtered = filtered.filter(item => {
        // Real payments are already filtered by server, only filter virtual items
        if (!item.isVirtual) return true;
        
        const itemDate = new Date(item.date);
        if (dateFrom && itemDate < new Date(dateFrom)) return false;
        if (dateTo && itemDate > new Date(dateTo + 'T23:59:59')) return false;
        return true;
      });
    }

    // Filter by status (client-side)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filter by patient name (client-side - data is encrypted on server)
    if (debouncedSearch.trim()) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(item => {
        return item.patientName.toLowerCase().includes(search);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'price-desc':
          return (b.amount || 0) - (a.amount || 0);
        case 'price-asc':
          return (a.amount || 0) - (b.amount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allCobroItems, statusFilter, debouncedSearch, sortBy, dateFrom, dateTo]);

  // Pagination/infinite scroll
  const totalPages = Math.ceil(filteredCobroItems.length / ITEMS_PER_PAGE);
  const hasMore = visibleCount < filteredCobroItems.length;
  
  const displayedCobroItems = useMemo(() => {
    if (isMobile) {
      return filteredCobroItems.slice(0, visibleCount);
    } else {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredCobroItems.slice(start, start + ITEMS_PER_PAGE);
    }
  }, [filteredCobroItems, currentPage, visibleCount, isMobile]);

  // Handlers
  const handleCreatePayment = useCallback(() => {
    if (!isCalendarConnected) {
      setShowCalendarModal(true);
      return;
    }
    setPreselectedSession(null);
    setIsPaymentDrawerOpen(true);
  }, [isCalendarConnected]);

  const handleMarkAsPaid = useCallback(async (paymentId: string) => {
    try {
      setMarkingAsPaidId(paymentId);
      await markAsPaid(paymentId);
      toast.success(t('payments.messages.markedAsPaid'));
      // Refresh data
      await fetchPayments(true, serverFilters);
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error(t('payments.messages.errorMarkAsPaid'));
    } finally {
      setMarkingAsPaidId(null);
    }
  }, [markAsPaid, fetchPayments, serverFilters, t]);

  const handleDeletePayment = useCallback(async () => {
    if (!deletePaymentData) return;
    
    try {
      setIsDeletingPayment(true);
      await deletePayment(deletePaymentData.id);
      toast.success(t('payments.messages.deleted'));
      setDeletePaymentData(null);
      // Refresh data
      await fetchPayments(true, serverFilters);
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error(t('payments.messages.errorDelete'));
    } finally {
      setIsDeletingPayment(false);
    }
  }, [deletePaymentData, deletePayment, fetchPayments, serverFilters, t]);

  const handleSavePayment = useCallback(async (data: CreatePaymentDto) => {
    try {
      setIsRefreshing(true);
      await createPayment(data);
      toast.success(t('payments.messages.created'));
      setIsPaymentDrawerOpen(false);
      setPreselectedSession(null);
      // Refresh data
      await Promise.all([
        fetchUpcoming(),
        fetchPayments(true, serverFilters),
      ]);
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error(t('payments.messages.errorSave'));
    } finally {
      setIsRefreshing(false);
    }
  }, [createPayment, fetchUpcoming, fetchPayments, serverFilters, t]);

  const handleUpdatePayment = useCallback(async (id: string, data: UpdatePaymentDto) => {
    try {
      setIsRefreshing(true);
      await updatePayment(id, data);
      toast.success(t('payments.messages.updated'));
      setIsPaymentDrawerOpen(false);
      setEditPayment(null);
      // Refresh data
      await Promise.all([
        fetchUpcoming(),
        fetchPayments(true, serverFilters),
      ]);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error(t('payments.messages.errorUpdate'));
    } finally {
      setIsRefreshing(false);
    }
  }, [updatePayment, fetchUpcoming, fetchPayments, serverFilters, t]);

  const handleCloseDrawer = useCallback(() => {
    setIsPaymentDrawerOpen(false);
    setPreselectedSession(null);
    setEditPayment(null);
  }, []);

  const handleViewDetail = useCallback((payment: Payment) => {
    setDetailPayment(payment);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailPayment(null);
  }, []);

  const handleEditFromDetail = useCallback(() => {
    if (detailPayment) {
      setEditPayment(detailPayment);
      setDetailPayment(null);
      setIsPaymentDrawerOpen(true);
    }
  }, [detailPayment]);

  const handleDeleteFromDetail = useCallback(() => {
    if (detailPayment) {
      setDeletePaymentData(detailPayment);
      setDetailPayment(null);
    }
  }, [detailPayment]);

  const handleMarkAsPaidFromDetail = useCallback(async () => {
    if (!detailPayment) return;
    await handleMarkAsPaid(detailPayment.id);
    setDetailPayment(null);
  }, [detailPayment, handleMarkAsPaid]);

  const clearDateFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setQuickFilter('all');
  }, []);

  // Handler to register payment for a specific session (from virtual pending item)
  const handleRegisterPaymentForSession = useCallback((sessionId: string) => {
    if (!isCalendarConnected) {
      setShowCalendarModal(true);
      return;
    }

    const session = sessionsUI.find(s => s.id === sessionId);
    if (session) {
      setPreselectedSession(session);
      setIsPaymentDrawerOpen(true);
    }
  }, [isCalendarConnected, sessionsUI]);

  const hasDateFilters = dateFrom || dateTo;
  const hasAnyFilters = hasDateFilters || statusFilter !== 'all' || searchTerm;

  const isLoading = isInitialLoading || isRefreshing;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('payments.title')}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            {t('payments.managePayments')}
          </p>
        </div>
        <button
          onClick={handleCreatePayment}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {t('payments.registerPayment')}
        </button>
      </div>

      {/* Date Filters */}
      <DateFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClearFilters={clearDateFilters}
        hasActiveFilters={!!hasDateFilters}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
      />

      {/* Stats Cards */}
      <PaymentStats totals={totals} isLoading={isLoading} isMobile={isMobile} />

      {/* Search, Status Filter and Sort */}
      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Payments List */}
      {isLoading ? (
        <SkeletonList items={3} />
      ) : filteredCobroItems.length === 0 ? (
        <EmptyState 
          icon={DollarSign} 
          title={hasAnyFilters ? t('payments.noResults') : t('payments.noPayments')}
          description={hasAnyFilters ? t('payments.noResultsDescription') : t('payments.noPendingPayments')}
          variant="subtle"
        />
      ) : isMobile ? (
        /* Mobile: Cards with infinite scroll */
        <>
          <div className="space-y-3">
            {displayedCobroItems.map((item) => (
              <CobroCard
                key={item.id}
                item={item}
                onMarkAsPaid={!item.isVirtual && item.status !== PaymentStatus.PAID && item.payment
                  ? () => handleMarkAsPaid(item.payment!.id) 
                  : undefined
                }
                onReminder={!item.isVirtual && item.status !== PaymentStatus.PAID && item.payment
                  ? () => setReminderPayment(item.payment!) 
                  : undefined
                }
                onDelete={!item.isVirtual && item.payment
                  ? () => setDeletePaymentData(item.payment!)
                  : undefined
                }
                onViewDetail={!item.isVirtual && item.payment
                  ? () => handleViewDetail(item.payment!)
                  : undefined
                }
                onRegisterPayment={item.isVirtual && item.sessionId
                  ? () => handleRegisterPaymentForSession(item.sessionId!)
                  : undefined
                }
                isMarkingAsPaid={!item.isVirtual && markingAsPaidId === item.id}
              />
            ))}
          </div>
          <InfiniteScrollLoader
            isLoading={isLoadingMore}
            hasMore={hasMore}
            loadMoreRef={loadMoreRef}
          />
        </>
      ) : (
        /* Desktop: Table with pagination */
        <>
          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('payments.table.patient')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('payments.table.date')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('payments.table.status')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('payments.table.amount')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('payments.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedCobroItems.map((item) => {
                    const initials = getInitials(item.patientName || 'SP');
                    const config = STATUS_CONFIG[item.status];
                    const isPaid = item.status === PaymentStatus.PAID;
                    const isPending = item.status === PaymentStatus.PENDING;

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-muted transition-colors ${!item.isVirtual ? 'cursor-pointer' : ''}`}
                        onClick={!item.isVirtual && item.payment ? () => handleViewDetail(item.payment!) : undefined}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.iconBgColor}`}>
                              <span className={`text-xs font-semibold ${config.iconColor}`}>{initials}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{item.patientName}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description}</p>
                              )}
                              {item.isVirtual && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground mt-0.5">
                                  {t('payments.virtual.sessionUnpaid')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDateShort(item.date)}
                        </td>
                        <td className="px-4 py-3">
                          <PaymentStatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-foreground">{formatCurrency(item.amount)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Virtual items: Register Payment button */}
                            {item.isVirtual && isPending && item.sessionId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRegisterPaymentForSession(item.sessionId!);
                                }}
                                className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                title={t('payments.actions.registerPayment')}
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                            )}
                            {/* Real payments: View detail button */}
                            {!item.isVirtual && item.payment && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetail(item.payment!);
                                }}
                                className="p-2 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title={t('payments.actions.viewDetail')}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {/* Real payments not paid: Reminder and Mark as paid */}
                            {!item.isVirtual && !isPaid && item.payment && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReminderPayment(item.payment!);
                                  }}
                                  className="p-2 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title={t('payments.actions.sendReminder')}
                                >
                                  <Bell className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsPaid(item.payment!.id);
                                  }}
                                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                  title={t('payments.actions.markAsCollected')}
                                  disabled={markingAsPaidId === item.payment!.id}
                                >
                                  {markingAsPaidId === item.payment!.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            )}
                            {/* Real payments: Delete button */}
                            {!item.isVirtual && item.payment && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletePaymentData(item.payment!);
                                }}
                                className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title={t('payments.actions.deletePayment')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCobroItems.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Payment Drawer */}
      <PaymentDrawer
        isOpen={isPaymentDrawerOpen}
        onClose={handleCloseDrawer}
        onSave={handleSavePayment}
        onUpdate={handleUpdatePayment}
        sessions={sessionsUI}
        preselectedSessionId={preselectedSession?.id}
        isLoading={isLoadingPayments}
        editPayment={editPayment}
      />

      {/* Reminder Modal */}
      {reminderPayment && (
        <ReminderModal 
          payment={reminderPayment}
          onClose={() => setReminderPayment(null)} 
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!deletePaymentData}
        onOpenChange={(open) => !open && setDeletePaymentData(null)}
        title={t('payments.messages.deleteConfirmTitle')}
        description={deletePaymentData 
          ? t('payments.messages.deleteConfirmDescription', {
              name: getPaymentPatientName(deletePaymentData, t('payments.noPatient')),
              amount: formatCurrency(deletePaymentData.amount)
            })
          : ''
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={handleDeletePayment}
        isLoading={isDeletingPayment}
      />

      {/* Payment Detail Modal */}
      {detailPayment && (
        <PaymentDetailModal
          payment={detailPayment}
          onClose={handleCloseDetail}
          onEdit={handleEditFromDetail}
          onDelete={handleDeleteFromDetail}
          onMarkAsPaid={detailPayment.status !== PaymentStatus.PAID 
            ? handleMarkAsPaidFromDetail 
            : undefined
          }
          isMarkingAsPaid={markingAsPaidId === detailPayment.id}
        />
      )}

      <CalendarRequiredDialog
        open={showCalendarModal}
        onOpenChange={setShowCalendarModal}
        onConnect={connectCalendar}
      />
    </div>
  );
}
