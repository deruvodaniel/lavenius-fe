import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Bell, Copy, MessageCircle, X, Plus, Video, MapPin, DollarSign, Calendar, History, CheckCircle2, Search, ChevronLeft, ChevronRight, Filter, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { useSessions } from '@/lib/stores/sessionStore';
import { usePayments } from '@/lib/hooks/usePayments';
import { useResponsive } from '@/lib/hooks';
import { PaymentStats } from './PaymentStats';
import { PaymentDrawer } from './PaymentDrawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkeletonList } from '@/components/shared/Skeleton';
import { Input } from '@/components/ui/input';
import type { CreatePaymentDto, Payment } from '@/lib/types/api.types';
import type { SessionUI } from '@/lib/types/session';
import { SessionStatus } from '@/lib/types/session';

// ============================================================================
// CONSTANTS
// ============================================================================

const ITEMS_PER_PAGE = 10;
const INFINITE_SCROLL_BATCH = 10;

// ============================================================================
// UTILITIES
// ============================================================================

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('es-AR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

const getInitials = (name: string) => 
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

type PaymentStatusType = 'overdue' | 'today' | 'upcoming';

const StatusBadge = ({ status }: { status: PaymentStatusType }) => {
  const config = {
    overdue: { label: 'Vencido', className: 'bg-red-100 text-red-800' },
    today: { label: 'Hoy', className: 'bg-orange-100 text-orange-800' },
    upcoming: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  };
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};

const EmptyState = ({ icon: Icon, title, subtitle, variant = 'default' }: { 
  icon: React.ElementType; 
  title: string; 
  subtitle: string;
  variant?: 'default' | 'success';
}) => (
  <Card className="p-6 sm:p-8 text-center bg-white">
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
        variant === 'success' ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${
          variant === 'success' ? 'text-green-600' : 'text-gray-400'
        }`} />
      </div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  </Card>
);

// ============================================================================
// FILTERS COMPONENT
// ============================================================================

type SortOption = 'date-desc' | 'date-asc' | 'price-desc' | 'price-asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Más reciente' },
  { value: 'date-asc', label: 'Más antiguo' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'price-asc', label: 'Menor precio' },
];

interface FiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const Filters = ({ 
  searchTerm, 
  onSearchChange, 
  dateFrom, 
  dateTo, 
  onDateFromChange, 
  onDateToChange,
  onClearFilters,
  hasActiveFilters,
  sortBy,
  onSortChange,
}: FiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Search bar - always visible */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por paciente..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="h-10 pl-8 pr-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className={hasActiveFilters ? 'border-indigo-500 text-indigo-600' : ''}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <Card className="p-3 space-y-3 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Desde</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-gray-500">
              Limpiar filtros
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// PAGINATION COMPONENT
// ============================================================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, totalItems, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        {startItem}-{endItem} de {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-3 text-sm text-gray-600">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// INFINITE SCROLL LOADER COMPONENT
// ============================================================================

interface InfiniteScrollLoaderProps {
  isLoading: boolean;
  hasMore: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
}

const InfiniteScrollLoader = ({ isLoading, hasMore, loadMoreRef }: InfiniteScrollLoaderProps) => {
  if (!hasMore) return null;

  return (
    <div ref={loadMoreRef} className="py-6 text-center">
      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-sm text-gray-500">Cargando más...</p>
        </div>
      ) : (
        <div className="h-4"></div>
      )}
    </div>
  );
};

// ============================================================================
// SESSION CARD (Pendientes Tab)
// ============================================================================

interface SessionCardProps {
  session: SessionUI;
  status: PaymentStatusType;
  onReminder: () => void;
  onCollect: () => void;
}

const SessionCard = ({ session, status, onReminder, onCollect }: SessionCardProps) => {
  const patientName = session.patientName || session.patient?.firstName || 'Sin paciente';
  const initials = getInitials(patientName);
  const borderColor = {
    overdue: 'border-l-red-500',
    today: 'border-l-orange-500',
    upcoming: 'border-l-yellow-500',
  }[status];

  return (
    <Card className={`p-3 sm:p-4 transition-all hover:shadow-md border-l-4 bg-white ${borderColor}`}>
      {/* Mobile Layout */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-600 text-xs font-semibold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{patientName}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="capitalize">{formatDate(session.scheduledFrom)}</span>
                <span>{formatTime(session.scheduledFrom)}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-500">
            {session.sessionType === 'remote' ? (
              <><Video className="w-3 h-3" /><span>Remoto</span></>
            ) : (
              <><MapPin className="w-3 h-3" /><span>Presencial</span></>
            )}
          </span>
          <p className="font-semibold text-gray-900">{formatCurrency(session.cost || 0)}</p>
        </div>
        
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <Button size="sm" variant="outline" className="flex-1" onClick={onReminder}>
            <Bell className="h-4 w-4 mr-1.5" />
            Recordatorio
          </Button>
          <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={onCollect}>
            <DollarSign className="h-4 w-4 mr-1.5" />
            Cobrar
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-600 text-sm font-semibold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{patientName}</p>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="capitalize">{formatDate(session.scheduledFrom)}</span>
              <span>{formatTime(session.scheduledFrom)}</span>
              <span className="flex items-center gap-1">
                {session.sessionType === 'remote' ? (
                  <><Video className="w-3 h-3" /><span>Remoto</span></>
                ) : (
                  <><MapPin className="w-3 h-3" /><span>Presencial</span></>
                )}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={status} />
        <div className="flex items-center gap-4">
          <p className="font-semibold text-gray-900 min-w-[100px] text-right">
            {formatCurrency(session.cost || 0)}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onReminder} title="Enviar recordatorio">
              <Bell className="h-4 w-4" />
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={onCollect}>
              <DollarSign className="h-4 w-4 mr-1" />
              Cobrar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// PAYMENT CARD (Historial Tab)
// ============================================================================

interface PaymentCardProps {
  payment: Payment;
}

const PaymentCard = ({ payment }: PaymentCardProps) => {
  const patientName = payment.patient 
    ? `${payment.patient.firstName} ${payment.patient.lastName || ''}`.trim()
    : 'Sin paciente';

  return (
    <Card className="p-3 sm:p-4 border-l-4 border-l-green-500 bg-white">
      {/* Mobile Layout */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{patientName}</p>
              <p className="text-xs text-gray-500">{formatDate(payment.paymentDate)}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Pagado
          </span>
        </div>
        <div className="flex items-center justify-between">
          {payment.description && (
            <p className="text-xs text-gray-500 truncate flex-1">{payment.description}</p>
          )}
          <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{patientName}</p>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{formatDate(payment.paymentDate)}</span>
              {payment.description && (
                <span className="truncate max-w-[200px]">{payment.description}</span>
              )}
            </div>
          </div>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Pagado
        </span>
        <p className="font-semibold text-gray-900 min-w-[100px] text-right">
          {formatCurrency(payment.amount)}
        </p>
      </div>
    </Card>
  );
};

// ============================================================================
// REMINDER MODAL
// ============================================================================

interface ReminderModalProps {
  session: SessionUI;
  onClose: () => void;
}

const ReminderModal = ({ session, onClose }: ReminderModalProps) => {
  const patientName = session.patientName || session.patient?.firstName || 'Paciente';
  const defaultMessage = `Hola ${patientName}! Te escribo para recordarte que tenés pendiente el pago de la sesión del ${formatDate(session.scheduledFrom)} a las ${formatTime(session.scheduledFrom)}. El monto es de ${formatCurrency(session.cost || 0)}. ¡Gracias!`;
  
  const [message, setMessage] = useState(defaultMessage);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success('Mensaje copiado al portapapeles');
  };

  const handleWhatsApp = () => {
    const phone = session.patient?.phone;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      toast.info('El paciente no tiene número de teléfono registrado');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-lg shadow-2xl p-4 sm:p-6 w-full sm:max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recordatorio de Pago</h3>
          <button className="text-gray-500 hover:text-gray-700 p-1" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4">
          <label className="text-gray-700 text-sm block mb-2">Mensaje</label>
          <textarea
            className="w-full h-28 sm:h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleWhatsApp}>
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Cobros() {
  const { sessionsUI, fetchUpcoming } = useSessions();
  const { 
    paidPayments,
    totals,
    isLoading: isLoadingPayments, 
    fetchPayments, 
    createPayment,
    isSessionPaid,
  } = usePayments();
  const { isMobile } = useResponsive();
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [preselectedSession, setPreselectedSession] = useState<SessionUI | null>(null);
  const [reminderSession, setReminderSession] = useState<SessionUI | null>(null);

  // Filter state
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingDateFrom, setPendingDateFrom] = useState('');
  const [pendingDateTo, setPendingDateTo] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingSortBy, setPendingSortBy] = useState<SortOption>('date-desc');

  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historySortBy, setHistorySortBy] = useState<SortOption>('date-desc');

  // Infinite scroll state (for mobile)
  const [pendingVisibleCount, setPendingVisibleCount] = useState(INFINITE_SCROLL_BATCH);
  const [historyVisibleCount, setHistoryVisibleCount] = useState(INFINITE_SCROLL_BATCH);
  const [isLoadingMorePending, setIsLoadingMorePending] = useState(false);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const pendingLoadMoreRef = useRef<HTMLDivElement>(null);
  const historyLoadMoreRef = useRef<HTMLDivElement>(null);

  // Reset page/visible count when filters change
  useEffect(() => { 
    setPendingPage(1); 
    setPendingVisibleCount(INFINITE_SCROLL_BATCH);
  }, [pendingSearch, pendingDateFrom, pendingDateTo, pendingSortBy]);
  
  useEffect(() => { 
    setHistoryPage(1); 
    setHistoryVisibleCount(INFINITE_SCROLL_BATCH);
  }, [historySearch, historyDateFrom, historyDateTo, historySortBy]);

  // Infinite scroll effect for pending sessions (mobile only)
  useEffect(() => {
    if (!isMobile) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMorePending) {
          setIsLoadingMorePending(true);
          setTimeout(() => {
            setPendingVisibleCount((prev) => prev + INFINITE_SCROLL_BATCH);
            setIsLoadingMorePending(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = pendingLoadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isMobile, isLoadingMorePending]);

  // Infinite scroll effect for history (mobile only)
  useEffect(() => {
    if (!isMobile) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMoreHistory) {
          setIsLoadingMoreHistory(true);
          setTimeout(() => {
            setHistoryVisibleCount((prev) => prev + INFINITE_SCROLL_BATCH);
            setIsLoadingMoreHistory(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = historyLoadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isMobile, isLoadingMoreHistory]);

  // Single fetch on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchUpcoming(),
          fetchPayments(),
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Today for status calculation
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Sessions pending payment: not cancelled, not paid
  const sessionsPendingPayment = useMemo(() => {
    return sessionsUI.filter((session) => {
      const isNotCancelled = session.status !== SessionStatus.CANCELLED;
      const notPaid = !isSessionPaid(session.id);
      return isNotCancelled && notPaid;
    });
  }, [sessionsUI, isSessionPaid]);

  // Filtered and sorted pending sessions
  const filteredPendingSessions = useMemo(() => {
    let filtered = [...sessionsPendingPayment];

    // Filter by patient name
    if (pendingSearch.trim()) {
      const search = pendingSearch.toLowerCase();
      filtered = filtered.filter(session => {
        const name = (session.patientName || session.patient?.firstName || '').toLowerCase();
        return name.includes(search);
      });
    }

    // Filter by date range
    if (pendingDateFrom) {
      const from = new Date(pendingDateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter(session => new Date(session.scheduledFrom) >= from);
    }
    if (pendingDateTo) {
      const to = new Date(pendingDateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(session => new Date(session.scheduledFrom) <= to);
    }

    // Sort by selected option
    filtered.sort((a, b) => {
      switch (pendingSortBy) {
        case 'date-desc':
          return new Date(b.scheduledFrom).getTime() - new Date(a.scheduledFrom).getTime();
        case 'date-asc':
          return new Date(a.scheduledFrom).getTime() - new Date(b.scheduledFrom).getTime();
        case 'price-desc':
          return (b.cost || 0) - (a.cost || 0);
        case 'price-asc':
          return (a.cost || 0) - (b.cost || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [sessionsPendingPayment, pendingSearch, pendingDateFrom, pendingDateTo, pendingSortBy]);

  // Pagination for desktop, infinite scroll for mobile
  const pendingTotalPages = Math.ceil(filteredPendingSessions.length / ITEMS_PER_PAGE);
  const hasMorePending = pendingVisibleCount < filteredPendingSessions.length;
  
  const displayedPendingSessions = useMemo(() => {
    if (isMobile) {
      // Infinite scroll: show items up to visibleCount
      return filteredPendingSessions.slice(0, pendingVisibleCount);
    } else {
      // Pagination: show items for current page
      const start = (pendingPage - 1) * ITEMS_PER_PAGE;
      return filteredPendingSessions.slice(start, start + ITEMS_PER_PAGE);
    }
  }, [filteredPendingSessions, pendingPage, pendingVisibleCount, isMobile]);

  // Filtered and sorted history
  const filteredPaidPayments = useMemo(() => {
    let filtered = [...paidPayments];

    // Filter by patient name
    if (historySearch.trim()) {
      const search = historySearch.toLowerCase();
      filtered = filtered.filter(payment => {
        const name = payment.patient 
          ? `${payment.patient.firstName} ${payment.patient.lastName || ''}`.toLowerCase()
          : '';
        return name.includes(search);
      });
    }

    // Filter by date range
    if (historyDateFrom) {
      const from = new Date(historyDateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter(payment => new Date(payment.paymentDate) >= from);
    }
    if (historyDateTo) {
      const to = new Date(historyDateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(payment => new Date(payment.paymentDate) <= to);
    }

    // Sort by selected option
    filtered.sort((a, b) => {
      switch (historySortBy) {
        case 'date-desc':
          return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
        case 'date-asc':
          return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
        case 'price-desc':
          return (b.amount || 0) - (a.amount || 0);
        case 'price-asc':
          return (a.amount || 0) - (b.amount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [paidPayments, historySearch, historyDateFrom, historyDateTo, historySortBy]);

  // Pagination for desktop, infinite scroll for mobile
  const historyTotalPages = Math.ceil(filteredPaidPayments.length / ITEMS_PER_PAGE);
  const hasMoreHistory = historyVisibleCount < filteredPaidPayments.length;
  
  const displayedPaidPayments = useMemo(() => {
    if (isMobile) {
      // Infinite scroll: show items up to visibleCount
      return filteredPaidPayments.slice(0, historyVisibleCount);
    } else {
      // Pagination: show items for current page
      const start = (historyPage - 1) * ITEMS_PER_PAGE;
      return filteredPaidPayments.slice(start, start + ITEMS_PER_PAGE);
    }
  }, [filteredPaidPayments, historyPage, historyVisibleCount, isMobile]);

  // Get session payment status for display
  const getSessionStatus = useCallback((session: SessionUI): PaymentStatusType => {
    const sessionDate = new Date(session.scheduledFrom);
    sessionDate.setHours(0, 0, 0, 0);
    if (sessionDate < today) return 'overdue';
    if (sessionDate.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  }, [today]);

  // Handlers
  const handleCreatePayment = useCallback(() => {
    setPreselectedSession(null);
    setIsPaymentDrawerOpen(true);
  }, []);

  const handleCollectPayment = useCallback((session: SessionUI) => {
    setPreselectedSession(session);
    setIsPaymentDrawerOpen(true);
  }, []);

  const handleSavePayment = useCallback(async (data: CreatePaymentDto) => {
    try {
      setIsRefreshing(true);
      await createPayment(data);
      toast.success('Pago registrado correctamente');
      setIsPaymentDrawerOpen(false);
      setPreselectedSession(null);
      // Refresh all data to update lists and stats
      await Promise.all([
        fetchUpcoming(),
        fetchPayments(true),
      ]);
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('No se pudo guardar el pago. Por favor intenta nuevamente.');
    } finally {
      setIsRefreshing(false);
    }
  }, [createPayment, fetchUpcoming, fetchPayments]);

  const handleCloseDrawer = useCallback(() => {
    setIsPaymentDrawerOpen(false);
    setPreselectedSession(null);
  }, []);

  const clearPendingFilters = useCallback(() => {
    setPendingSearch('');
    setPendingDateFrom('');
    setPendingDateTo('');
  }, []);

  const clearHistoryFilters = useCallback(() => {
    setHistorySearch('');
    setHistoryDateFrom('');
    setHistoryDateTo('');
  }, []);

  const hasPendingFilters = pendingSearch || pendingDateFrom || pendingDateTo;
  const hasHistoryFilters = historySearch || historyDateFrom || historyDateTo;

  const isLoading = isInitialLoading || isRefreshing;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Cobros</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Gestiona los pagos de tus sesiones
          </p>
        </div>
        <Button onClick={handleCreatePayment} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Pago
        </Button>
      </div>

      {/* Stats Cards */}
      <PaymentStats totals={totals} isLoading={isLoading} />

      {/* Tabs */}
      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pendientes" className="flex-1 sm:flex-none gap-2">
            <Calendar className="h-4 w-4" />
            Pendientes
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
              {sessionsPendingPayment.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex-1 sm:flex-none gap-2">
            <History className="h-4 w-4" />
            Historial
            <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
              {paidPayments.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Pendientes Tab */}
        <TabsContent value="pendientes" className="mt-4 space-y-4">
          <Filters
            searchTerm={pendingSearch}
            onSearchChange={setPendingSearch}
            dateFrom={pendingDateFrom}
            dateTo={pendingDateTo}
            onDateFromChange={setPendingDateFrom}
            onDateToChange={setPendingDateTo}
            onClearFilters={clearPendingFilters}
            hasActiveFilters={!!hasPendingFilters}
            sortBy={pendingSortBy}
            onSortChange={setPendingSortBy}
          />

          {isLoading ? (
            <SkeletonList items={3} />
          ) : filteredPendingSessions.length === 0 ? (
            <EmptyState 
              icon={DollarSign} 
              title={hasPendingFilters ? "Sin resultados" : "¡Todo al día!"}
              subtitle={hasPendingFilters ? "No hay sesiones que coincidan con los filtros" : "No hay sesiones pendientes de cobro"}
              variant={hasPendingFilters ? 'default' : 'success'}
            />
          ) : (
            <>
              <div className="space-y-3">
                {displayedPendingSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    status={getSessionStatus(session)}
                    onReminder={() => setReminderSession(session)}
                    onCollect={() => handleCollectPayment(session)}
                  />
                ))}
              </div>
              
              {/* Desktop: Pagination | Mobile: Infinite Scroll */}
              {isMobile ? (
                <InfiniteScrollLoader
                  isLoading={isLoadingMorePending}
                  hasMore={hasMorePending}
                  loadMoreRef={pendingLoadMoreRef}
                />
              ) : (
                <Pagination
                  currentPage={pendingPage}
                  totalPages={pendingTotalPages}
                  totalItems={filteredPendingSessions.length}
                  onPageChange={setPendingPage}
                />
              )}
            </>
          )}
        </TabsContent>

        {/* Historial Tab */}
        <TabsContent value="historial" className="mt-4 space-y-4">
          <Filters
            searchTerm={historySearch}
            onSearchChange={setHistorySearch}
            dateFrom={historyDateFrom}
            dateTo={historyDateTo}
            onDateFromChange={setHistoryDateFrom}
            onDateToChange={setHistoryDateTo}
            onClearFilters={clearHistoryFilters}
            hasActiveFilters={!!hasHistoryFilters}
            sortBy={historySortBy}
            onSortChange={setHistorySortBy}
          />

          {isLoading ? (
            <SkeletonList items={3} />
          ) : filteredPaidPayments.length === 0 ? (
            <EmptyState 
              icon={History} 
              title={hasHistoryFilters ? "Sin resultados" : "Sin historial"}
              subtitle={hasHistoryFilters ? "No hay pagos que coincidan con los filtros" : "Aún no hay pagos registrados"}
            />
          ) : (
            <>
              <div className="space-y-3">
                {displayedPaidPayments.map((payment) => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))}
              </div>
              
              {/* Desktop: Pagination | Mobile: Infinite Scroll */}
              {isMobile ? (
                <InfiniteScrollLoader
                  isLoading={isLoadingMoreHistory}
                  hasMore={hasMoreHistory}
                  loadMoreRef={historyLoadMoreRef}
                />
              ) : (
                <Pagination
                  currentPage={historyPage}
                  totalPages={historyTotalPages}
                  totalItems={filteredPaidPayments.length}
                  onPageChange={setHistoryPage}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Drawer */}
      <PaymentDrawer
        isOpen={isPaymentDrawerOpen}
        onClose={handleCloseDrawer}
        onSave={handleSavePayment}
        sessions={sessionsUI}
        preselectedSessionId={preselectedSession?.id}
        isLoading={isLoadingPayments}
      />

      {/* Reminder Modal */}
      {reminderSession && (
        <ReminderModal 
          session={reminderSession} 
          onClose={() => setReminderSession(null)} 
        />
      )}
    </div>
  );
}
