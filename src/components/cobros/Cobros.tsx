import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Bell, Copy, MessageCircle, X, Plus, DollarSign, Calendar, CheckCircle2, Clock, AlertCircle, Search, ChevronLeft, ChevronRight, ArrowUpDown, Loader2, Filter, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useSessions } from '@/lib/stores/sessionStore';
import { usePayments } from '@/lib/hooks/usePayments';
import { usePaymentStore } from '@/lib/stores/payment.store';
import { usePatientStore } from '@/lib/stores/patient.store';
import { useResponsive, usePatients } from '@/lib/hooks';
import { PaymentStats } from './PaymentStats';
import { PaymentDrawer } from './PaymentDrawer';
import { PaymentDetailModal } from './PaymentDetailModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonList } from '@/components/shared/Skeleton';
import { Input } from '@/components/ui/input';
import { formatPaymentReminderMessage, openWhatsApp } from '@/lib/utils/whatsappTemplates';
import type { CreatePaymentDto, Payment, UpdatePaymentDto } from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';
import type { SessionUI } from '@/lib/types/session';
import type { PaymentFilters } from '@/lib/services/payment.service';

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

const getInitials = (name: string) => 
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

type StatusFilterOption = 'all' | PaymentStatus;

const STATUS_CONFIG = {
  [PaymentStatus.PAID]: { 
    label: 'Pagado', 
    className: 'bg-green-100 text-green-800',
    borderColor: 'border-l-green-500',
    iconBgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    Icon: CheckCircle2,
  },
  [PaymentStatus.PENDING]: { 
    label: 'Pendiente', 
    className: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-l-yellow-500',
    iconBgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    Icon: Clock,
  },
  [PaymentStatus.OVERDUE]: { 
    label: 'Vencido', 
    className: 'bg-red-100 text-red-800',
    borderColor: 'border-l-red-500',
    iconBgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    Icon: AlertCircle,
  },
};

const STATUS_FILTER_OPTIONS: { value: StatusFilterOption; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: PaymentStatus.PENDING, label: 'Pendiente' },
  { value: PaymentStatus.OVERDUE, label: 'Vencido' },
  { value: PaymentStatus.PAID, label: 'Pagado' },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
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
type QuickFilter = 'all' | 'week' | 'month' | 'custom';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Más reciente' },
  { value: 'date-asc', label: 'Más antiguo' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'price-asc', label: 'Menor precio' },
];

// Helper functions to get date ranges
const getWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    from: monday.toISOString().split('T')[0],
    to: sunday.toISOString().split('T')[0],
  };
};

const getMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    from: firstDay.toISOString().split('T')[0],
    to: lastDay.toISOString().split('T')[0],
  };
};

interface FiltersProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
}

const DateFilters = ({ 
  dateFrom, 
  dateTo, 
  onDateFromChange, 
  onDateToChange,
  onClearFilters,
  hasActiveFilters,
  quickFilter,
  onQuickFilterChange,
}: FiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQuickFilter = (filter: QuickFilter) => {
    onQuickFilterChange(filter);
    
    if (filter === 'week') {
      const { from, to } = getWeekRange();
      onDateFromChange(from);
      onDateToChange(to);
      setIsExpanded(false);
    } else if (filter === 'month') {
      const { from, to } = getMonthRange();
      onDateFromChange(from);
      onDateToChange(to);
      setIsExpanded(false);
    } else if (filter === 'all') {
      onDateFromChange('');
      onDateToChange('');
      setIsExpanded(false);
    } else if (filter === 'custom') {
      setIsExpanded(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick filter buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={quickFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('all')}
          className={quickFilter === 'all' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
        >
          Todos
        </Button>
        <Button
          variant={quickFilter === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('week')}
          className={quickFilter === 'week' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
        >
          Semana actual
        </Button>
        <Button
          variant={quickFilter === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('month')}
          className={quickFilter === 'month' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
        >
          Mes actual
        </Button>
        <Button
          variant={quickFilter === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('custom')}
          className={quickFilter === 'custom' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
        >
          <Calendar className="h-4 w-4 mr-1.5" />
          Rango
        </Button>
      </div>

      {/* Custom date range (expanded when "Rango" is selected) */}
      {(isExpanded || quickFilter === 'custom') && (
        <Card className="p-3 space-y-3 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Desde</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  onDateFromChange(e.target.value);
                  onQuickFilterChange('custom');
                }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  onDateToChange(e.target.value);
                  onQuickFilterChange('custom');
                }}
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
// SEARCH, STATUS FILTER AND SORT COMPONENT
// ============================================================================

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilterOption;
  onStatusFilterChange: (status: StatusFilterOption) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SearchAndFilters = ({ 
  searchTerm, 
  onSearchChange, 
  statusFilter,
  onStatusFilterChange,
  sortBy, 
  onSortChange 
}: SearchAndFiltersProps) => (
  <div className="flex flex-col sm:flex-row gap-2">
    {/* Search */}
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
    
    <div className="flex gap-2">
      {/* Status filter dropdown */}
      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as StatusFilterOption)}
          className="h-10 pl-8 pr-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
        >
          {STATUS_FILTER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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
    </div>
  </div>
);

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
  const initials = getInitials(item.patientName || 'SP');
  const config = STATUS_CONFIG[item.status];
  const Icon = config.Icon;
  const isPaid = item.status === PaymentStatus.PAID;
  const isPending = item.status === PaymentStatus.PENDING;

  return (
    <Card className={`p-3 transition-all hover:shadow-md border-l-4 bg-white ${config.borderColor}`}>
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
              <p className="font-medium text-gray-900 text-sm truncate">{item.patientName || 'Sin paciente'}</p>
              <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
            </div>
          </div>
          <PaymentStatusBadge status={item.status} />
        </div>
        
        <div className="flex items-center justify-between mt-3">
          {item.description && (
            <p className="text-xs text-gray-500 truncate flex-1 mr-2">{item.description}</p>
          )}
          <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 mt-3 border-t border-gray-100">
        {/* Virtual items (sessions without payment) - show Register Payment button */}
        {item.isVirtual && isPending && onRegisterPayment && (
          <Button 
            size="sm" 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" 
            onClick={onRegisterPayment}
          >
            <DollarSign className="h-4 w-4 mr-1.5" />
            Registrar Pago
          </Button>
        )}
        {/* Real payments - show Reminder and Mark as Paid buttons */}
        {!item.isVirtual && !isPaid && onReminder && (
          <Button size="sm" variant="outline" className="flex-1" onClick={onReminder}>
            <Bell className="h-4 w-4 mr-1.5" />
            Recordatorio
          </Button>
        )}
        {!item.isVirtual && !isPaid && onMarkAsPaid && (
          <Button 
            size="sm" 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" 
            onClick={onMarkAsPaid}
            disabled={isMarkingAsPaid}
          >
            {isMarkingAsPaid ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4 mr-1.5" />
            )}
            Cobrar
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
            {isPaid && <span className="ml-1.5">Eliminar</span>}
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

const PaymentCard = ({ payment, onMarkAsPaid, onReminder, onDelete, onViewDetail, isMarkingAsPaid }: PaymentCardProps) => {
  const patientName = payment.patient 
    ? `${payment.patient.firstName} ${payment.patient.lastName || ''}`.trim()
    : 'Sin paciente';
  
  const initials = getInitials(patientName);
  const config = STATUS_CONFIG[payment.status];
  const Icon = config.Icon;
  const isPaid = payment.status === PaymentStatus.PAID;

  return (
    <Card className={`p-3 transition-all hover:shadow-md border-l-4 bg-white ${config.borderColor}`}>
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
              <p className="font-medium text-gray-900 text-sm truncate">{patientName}</p>
              <p className="text-xs text-gray-500">{formatDate(payment.paymentDate)}</p>
            </div>
          </div>
          <PaymentStatusBadge status={payment.status} />
        </div>
        
        <div className="flex items-center justify-between mt-3">
          {payment.description && (
            <p className="text-xs text-gray-500 truncate flex-1 mr-2">{payment.description}</p>
          )}
          <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 mt-3 border-t border-gray-100">
        {!isPaid && onReminder && (
          <Button size="sm" variant="outline" className="flex-1" onClick={onReminder}>
            <Bell className="h-4 w-4 mr-1.5" />
            Recordatorio
          </Button>
        )}
        {!isPaid && onMarkAsPaid && (
          <Button 
            size="sm" 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" 
            onClick={onMarkAsPaid}
            disabled={isMarkingAsPaid}
          >
            {isMarkingAsPaid ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4 mr-1.5" />
            )}
            Cobrar
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
            {isPaid && <span className="ml-1.5">Eliminar</span>}
          </Button>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================

interface DeleteConfirmModalProps {
  payment: Payment;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteConfirmModal = ({ payment, onClose, onConfirm, isDeleting }: DeleteConfirmModalProps) => {
  const patientName = payment.patient 
    ? `${payment.patient.firstName} ${payment.patient.lastName || ''}`.trim()
    : 'Sin paciente';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-t-xl sm:rounded-lg shadow-2xl p-4 sm:p-6 w-full sm:max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Eliminar Pago</h3>
          <button className="text-gray-500 hover:text-gray-700 p-1" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-center text-gray-600">
            ¿Estás seguro que deseas eliminar el pago de <span className="font-medium text-gray-900">{patientName}</span> por <span className="font-medium text-gray-900">{formatCurrency(payment.amount)}</span>?
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            Esta acción no se puede deshacer.
          </p>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// REMINDER MODAL
// ============================================================================

interface ReminderModalProps {
  payment: Payment;
  onClose: () => void;
}

const ReminderModal = ({ payment, onClose }: ReminderModalProps) => {
  const fetchPatientById = usePatientStore(state => state.fetchPatientById);
  const selectedPatient = usePatientStore(state => state.selectedPatient);
  
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [patientPhone, setPatientPhone] = useState<string | undefined>(undefined);
  
  const patientName = payment.patient 
    ? `${payment.patient.firstName} ${payment.patient.lastName || ''}`.trim()
    : 'Paciente';
  
  const defaultMessage = formatPaymentReminderMessage(
    patientName,
    formatDate(payment.paymentDate),
    formatCurrency(payment.amount)
  );
  
  const [message, setMessage] = useState(defaultMessage);

  // Load full patient data to get phone
  useEffect(() => {
    const loadPatientData = async () => {
      const patientId = payment.patient?.id;
      if (!patientId) return;
      
      setIsLoadingPatient(true);
      try {
        await fetchPatientById(patientId);
      } catch (error) {
        console.error('Error loading patient data:', error);
      } finally {
        setIsLoadingPatient(false);
      }
    };
    
    loadPatientData();
  }, [payment.patient?.id, fetchPatientById]);

  // Update phone when selectedPatient changes
  useEffect(() => {
    if (selectedPatient && selectedPatient.id === payment.patient?.id) {
      setPatientPhone(selectedPatient.phone);
    }
  }, [selectedPatient, payment.patient?.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success('Mensaje copiado al portapapeles');
  };

  const handleWhatsApp = () => {
    if (patientPhone) {
      openWhatsApp(patientPhone, message);
    } else {
      toast.info('El paciente no tiene número de teléfono registrado');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-t-xl sm:rounded-lg shadow-2xl p-4 sm:p-6 w-full sm:max-w-md">
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
        
        {/* Phone status indicator */}
        {isLoadingPatient ? (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cargando datos del paciente...</span>
          </div>
        ) : patientPhone ? (
          <div className="mb-4 text-sm text-green-600">
            Teléfono: {patientPhone}
          </div>
        ) : (
          <div className="mb-4 text-sm text-yellow-600">
            El paciente no tiene teléfono registrado
          </div>
        )}
        
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700" 
            onClick={handleWhatsApp}
            disabled={isLoadingPatient}
          >
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
  const { fetchPatients } = usePatients();
  const { 
    payments,
    totals,
    pagination,
    isLoading: isLoadingPayments, 
    fetchPayments, 
    createPayment,
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
  const serverFilters = useMemo((): PaymentFilters => {
    const filters: PaymentFilters = {
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
        await Promise.all([fetchUpcoming(), fetchPatients()]);
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
        patientName: session.patientName || 'Sin paciente',
        patientId: session.patient?.id,
        sessionId: session.id,
        description: session.sessionSummary || 'Sesión sin cobrar',
      }));
  }, [sessionsUI, sessionIdsWithPayment]);

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
    setPreselectedSession(null);
    setIsPaymentDrawerOpen(true);
  }, []);

  const handleMarkAsPaid = useCallback(async (paymentId: string) => {
    try {
      setMarkingAsPaidId(paymentId);
      await markAsPaid(paymentId);
      toast.success('Pago marcado como cobrado');
      // Refresh data
      await fetchPayments(true, serverFilters);
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error('No se pudo marcar el pago como cobrado');
    } finally {
      setMarkingAsPaidId(null);
    }
  }, [markAsPaid, fetchPayments, serverFilters]);

  const handleDeletePayment = useCallback(async () => {
    if (!deletePaymentData) return;
    
    try {
      setIsDeletingPayment(true);
      await deletePayment(deletePaymentData.id);
      toast.success('Pago eliminado correctamente');
      setDeletePaymentData(null);
      // Refresh data
      await fetchPayments(true, serverFilters);
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('No se pudo eliminar el pago');
    } finally {
      setIsDeletingPayment(false);
    }
  }, [deletePaymentData, deletePayment, fetchPayments, serverFilters]);

  const handleSavePayment = useCallback(async (data: CreatePaymentDto) => {
    try {
      setIsRefreshing(true);
      await createPayment(data);
      toast.success('Pago registrado correctamente');
      setIsPaymentDrawerOpen(false);
      setPreselectedSession(null);
      // Refresh data
      await Promise.all([
        fetchUpcoming(),
        fetchPayments(true, serverFilters),
      ]);
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error('No se pudo guardar el pago. Por favor intenta nuevamente.');
    } finally {
      setIsRefreshing(false);
    }
  }, [createPayment, fetchUpcoming, fetchPayments, serverFilters]);

  const handleCloseDrawer = useCallback(() => {
    setIsPaymentDrawerOpen(false);
    setPreselectedSession(null);
  }, []);

  const handleViewDetail = useCallback((payment: Payment) => {
    setDetailPayment(payment);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailPayment(null);
  }, []);

  const handleEditFromDetail = useCallback(() => {
    // Close detail modal - edit functionality coming soon
    // When backend supports PATCH /payments/:id, we can enable edit mode
    setDetailPayment(null);
    toast.info('La edición de pagos estará disponible próximamente');
  }, []);

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
    const session = sessionsUI.find(s => s.id === sessionId);
    if (session) {
      setPreselectedSession(session);
      setIsPaymentDrawerOpen(true);
    }
  }, [sessionsUI]);

  const hasDateFilters = dateFrom || dateTo;
  const hasAnyFilters = hasDateFilters || statusFilter !== 'all' || searchTerm;

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
      <PaymentStats totals={totals} isLoading={isLoading} />

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
          title={hasAnyFilters ? "Sin resultados" : "Sin cobros"}
          subtitle={hasAnyFilters ? "No hay cobros que coincidan con los filtros" : "Aún no hay cobros pendientes ni pagos registrados"}
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedCobroItems.map((item) => {
                    const initials = getInitials(item.patientName || 'SP');
                    const config = STATUS_CONFIG[item.status];
                    const isPaid = item.status === PaymentStatus.PAID;
                    const isPending = item.status === PaymentStatus.PENDING;

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-gray-50 transition-colors ${!item.isVirtual ? 'cursor-pointer' : ''}`}
                        onClick={!item.isVirtual && item.payment ? () => handleViewDetail(item.payment!) : undefined}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.iconBgColor}`}>
                              <span className={`text-xs font-semibold ${config.iconColor}`}>{initials}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{item.patientName}</p>
                              {item.description && (
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>
                              )}
                              {item.isVirtual && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 mt-0.5">
                                  Sesión sin cobrar
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3">
                          <PaymentStatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
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
                                title="Registrar pago"
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
                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Ver detalle"
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
                                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Enviar recordatorio"
                                >
                                  <Bell className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsPaid(item.payment!.id);
                                  }}
                                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Marcar como cobrado"
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
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar pago"
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCobroItems.length}
            onPageChange={setCurrentPage}
          />
        </>
      )}

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
      {reminderPayment && (
        <ReminderModal 
          payment={reminderPayment}
          onClose={() => setReminderPayment(null)} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletePaymentData && (
        <DeleteConfirmModal
          payment={deletePaymentData}
          onClose={() => setDeletePaymentData(null)}
          onConfirm={handleDeletePayment}
          isDeleting={isDeletingPayment}
        />
      )}

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
    </div>
  );
}
