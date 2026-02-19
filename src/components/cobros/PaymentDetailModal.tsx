import { useTranslation } from 'react-i18next';
import { X, DollarSign, Calendar, FileText, User, Clock, CheckCircle2, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Payment } from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentDetailModalProps {
  payment: Payment;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkAsPaid?: () => void;
  isMarkingAsPaid?: boolean;
}

// ============================================================================
// UTILITIES
// ============================================================================

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatShortDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

const STATUS_CONFIG = {
  [PaymentStatus.PAID]: { 
    labelKey: 'payments.paid', 
    className: 'bg-green-100 text-green-800',
    iconBgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    Icon: CheckCircle2,
  },
  [PaymentStatus.PENDING]: { 
    labelKey: 'payments.pending', 
    className: 'bg-yellow-100 text-yellow-800',
    iconBgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    Icon: Clock,
  },
  [PaymentStatus.OVERDUE]: { 
    labelKey: 'payments.overdue', 
    className: 'bg-red-100 text-red-800',
    iconBgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    Icon: AlertCircle,
  },
};

// ============================================================================
// DETAIL ROW COMPONENT
// ============================================================================

interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}

const DetailRow = ({ icon: Icon, label, value, className = '' }: DetailRowProps) => (
  <div className={`flex items-start gap-3 py-3 ${className}`}>
    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-gray-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="text-sm text-gray-900 font-medium">{value}</div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PaymentDetailModal = ({ 
  payment, 
  onClose, 
  onEdit, 
  onDelete,
  onMarkAsPaid,
  isMarkingAsPaid,
}: PaymentDetailModalProps) => {
  const { t } = useTranslation();
  
  const patientName = payment.patient 
    ? `${payment.patient.firstName} ${payment.patient.lastName || ''}`.trim()
    : t('payments.noPatient');
  
  const config = STATUS_CONFIG[payment.status];
  const StatusIcon = config.Icon;
  const isPaid = payment.status === PaymentStatus.PAID;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      
      {/* Modal/Bottom Sheet */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t('payments.paymentDetail')}</h2>
                <p className="text-indigo-200 text-sm">{formatShortDate(payment.paymentDate)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-indigo-200 hover:text-white transition-colors p-1"
              aria-label={t('common.close')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* Amount Card */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
            <p className="text-sm text-gray-500 mb-1">{t('payments.fields.amount')}</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
            <div className="mt-3 flex justify-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
                <StatusIcon className="w-4 h-4" />
                {t(config.labelKey)}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="divide-y divide-gray-100">
            <DetailRow 
              icon={User}
              label={t('payments.fields.patient')}
              value={patientName}
            />
            
            <DetailRow 
              icon={Calendar}
              label={t('payments.fields.paymentDate')}
              value={formatDate(payment.paymentDate)}
            />

            {payment.paidDate && (
              <DetailRow 
                icon={CheckCircle2}
                label={t('payments.fields.paidDate')}
                value={formatDate(payment.paidDate)}
              />
            )}

            {payment.description && (
              <DetailRow 
                icon={FileText}
                label={t('payments.fields.description')}
                value={payment.description}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50">
          {/* Mark as paid button for pending payments */}
          {!isPaid && onMarkAsPaid && (
            <Button 
              className="w-full mb-3 bg-green-600 hover:bg-green-700 text-white"
              onClick={onMarkAsPaid}
              disabled={isMarkingAsPaid}
            >
              {isMarkingAsPaid ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  {t('payments.messages.processing')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t('payments.actions.markAsCollected')}
                </>
              )}
            </Button>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onEdit}
            >
              <Pencil className="w-4 h-4 mr-2" />
              {t('payments.actions.edit')}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('payments.actions.delete')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
