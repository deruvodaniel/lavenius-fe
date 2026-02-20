import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calendar, FileText, Sparkles, CalendarRange, Pencil, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BaseDrawer, DrawerBody, DrawerFooter } from '@/components/shared/BaseDrawer';
import { Button } from '@/components/ui/button';
import { formatISODate } from '@/lib/utils/dateFormatters';
import type { CreatePaymentDto, Payment, UpdatePaymentDto } from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';
import type { SessionUI } from '@/lib/types/session';

// ============================================================================
// PAYMENT TYPE SELECTOR
// ============================================================================

type PaymentType = 'single' | 'monthly';

interface PaymentTypeSelectorProps {
  selected: PaymentType;
  onChange: (type: PaymentType) => void;
  disabled?: boolean;
}

const PaymentTypeSelector = ({ selected, onChange, disabled }: PaymentTypeSelectorProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('single')}
        disabled={disabled}
        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
          selected === 'single'
            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
            : 'border-gray-200 hover:border-gray-300 text-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <DollarSign className="w-5 h-5 mx-auto mb-1" />
        <span className="text-sm font-medium block">{t('payments.drawer.singlePayment')}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        disabled={disabled}
        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
          selected === 'monthly'
            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
            : 'border-gray-200 hover:border-gray-300 text-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <CalendarRange className="w-5 h-5 mx-auto mb-1" />
        <span className="text-sm font-medium block">{t('payments.drawer.monthlyPlan')}</span>
      </button>
    </div>
  );
};

// ============================================================================
// PAYMENT STATUS SELECTOR
// ============================================================================

const STATUS_OPTIONS = [
  { 
    value: PaymentStatus.PENDING, 
    labelKey: 'payments.pending', 
    icon: Clock, 
    className: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    iconColor: 'text-yellow-600'
  },
  { 
    value: PaymentStatus.PAID, 
    labelKey: 'payments.paid', 
    icon: CheckCircle2, 
    className: 'border-green-500 bg-green-50 text-green-700',
    iconColor: 'text-green-600'
  },
  { 
    value: PaymentStatus.OVERDUE, 
    labelKey: 'payments.overdue', 
    icon: AlertCircle, 
    className: 'border-red-500 bg-red-50 text-red-700',
    iconColor: 'text-red-600'
  },
];

interface PaymentStatusSelectorProps {
  selected: PaymentStatus;
  onChange: (status: PaymentStatus) => void;
  disabled?: boolean;
}

const PaymentStatusSelector = ({ selected, onChange, disabled }: PaymentStatusSelectorProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex gap-2">
      {STATUS_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = selected === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
              isActive
                ? option.className
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? option.iconColor : 'text-gray-400'}`} />
            <span className="text-sm font-medium block">{t(option.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// COMING SOON OVERLAY
// ============================================================================

const ComingSoonOverlay = () => {
  const { t } = useTranslation();
  
  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center z-10">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-indigo-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('payments.comingSoon.title')}</h3>
      <p className="text-sm text-gray-500 text-center max-w-xs px-4">
        {t('payments.comingSoon.description')}
      </p>
    </div>
  );
};

// ============================================================================
// MONTHLY PAYMENT FORM (placeholder)
// ============================================================================

const MonthlyPaymentForm = () => {
  const { t } = useTranslation();
  
  return (
    <div className="relative">
      <ComingSoonOverlay />
      <div className="space-y-4 opacity-50 pointer-events-none select-none p-4 border border-gray-200 rounded-lg">
        <div>
          <label className="text-gray-700 text-sm mb-2 block">{t('payments.fields.patient')}</label>
          <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
            {t('payments.drawer.selectPatient')}
          </div>
        </div>
        <div>
          <label className="text-gray-700 text-sm mb-2 block">{t('payments.drawer.sessionCount')}</label>
          <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
            {t('payments.drawer.sessionsPerMonth')}
          </div>
        </div>
        <div>
          <label className="text-gray-700 text-sm mb-2 block">{t('payments.drawer.pricePerSession')}</label>
          <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
            $15,000
          </div>
        </div>
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-green-700 text-sm">{t('payments.drawer.monthlyDiscount')}</span>
            <span className="text-green-700 font-medium">-$6,000</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-200">
            <span className="text-green-800 font-medium">{t('payments.drawer.totalMonthlyPlan')}</span>
            <span className="text-green-800 font-bold text-lg">$54,000</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePaymentDto) => Promise<void>;
  onUpdate?: (id: string, data: UpdatePaymentDto) => Promise<void>;
  sessions?: SessionUI[];
  preselectedSessionId?: string;
  isLoading?: boolean;
  // Edit mode props
  editPayment?: Payment | null;
}

/**
 * PaymentDrawer Component
 * Modal drawer for creating/editing payments
 * 
 * Features:
 * - Focus trap for keyboard navigation
 * - ESC key to close
 * - Payment type selector (single/monthly)
 * - Payment status selector
 * - Accessible with proper ARIA attributes
 */
export const PaymentDrawer = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  sessions = [],
  preselectedSessionId,
  isLoading = false,
  editPayment = null,
}: PaymentDrawerProps) => {
  const { t } = useTranslation();
  const isEditMode = !!editPayment;
  const [paymentType, setPaymentType] = useState<PaymentType>('single');
  const [formData, setFormData] = useState<CreatePaymentDto>({
    sessionId: '',
    amount: 0,
    paymentDate: formatISODate(new Date()),
    description: '',
    status: PaymentStatus.PENDING,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when drawer opens, apply preselected session or edit data
  useEffect(() => {
    if (isOpen) {
      if (editPayment) {
        // Edit mode - populate with existing payment data
        setPaymentType('single');
        setFormData({
          sessionId: editPayment.sessionId,
          amount: editPayment.amount,
          paymentDate: editPayment.paymentDate.split('T')[0], // Extract date part
          description: editPayment.description || '',
          status: editPayment.status || PaymentStatus.PENDING,
        });
      } else {
        // Create mode
        const sessionId = preselectedSessionId || '';
        const preselectedSession = sessionId ? sessions.find((s) => s.id === sessionId) : null;
        
        setPaymentType('single');
        setFormData({
          sessionId,
          amount: preselectedSession?.cost ? Number(preselectedSession.cost) : 0,
          paymentDate: formatISODate(new Date()),
          description: '',
          status: PaymentStatus.PENDING,
        });
      }
    }
  }, [isOpen, preselectedSessionId, sessions, editPayment]);

  // Auto-fill amount when session is selected (for manual selection changes, only in create mode)
  useEffect(() => {
    if (!isEditMode && formData.sessionId && !preselectedSessionId) {
      const selectedSession = sessions.find((s) => s.id === formData.sessionId);
      if (selectedSession?.cost) {
        setFormData((prev) => ({
          ...prev,
          amount: Number(selectedSession.cost),
        }));
      }
    }
  }, [formData.sessionId, sessions, preselectedSessionId, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sessionId) {
      toast.error(t('payments.messages.selectSession'));
      return;
    }

    if (formData.amount <= 0) {
      toast.error(t('payments.messages.amountGreaterThanZero'));
      return;
    }

    try {
      setIsSaving(true);
      
      if (isEditMode && editPayment && onUpdate) {
        // Edit mode - update existing payment with all editable fields
        const updateData: UpdatePaymentDto = {
          sessionId: formData.sessionId,
          amount: Math.round(formData.amount * 100) / 100,
          paymentDate: formData.paymentDate,
          description: formData.description?.trim() || undefined,
          status: formData.status,
        };
        
        await onUpdate(editPayment.id, updateData);
      } else {
        // Create mode - create new payment
        const paymentData: CreatePaymentDto = {
          sessionId: formData.sessionId,
          amount: Math.round(formData.amount * 100) / 100,
          paymentDate: formData.paymentDate,
          description: formData.description?.trim() || undefined,
          status: formData.status,
        };
        
        await onSave(paymentData);
      }
      onClose();
    } catch (error: unknown) {
      console.error('Error al guardar pago:', error);
      const errorMessage = error instanceof Error ? error.message : t('payments.messages.errorSave');
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Format session for display in selector
  const formatSessionOption = (session: SessionUI): string => {
    const date = new Date(session.scheduledFrom);
    const formattedDate = date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    });
    const formattedTime = session.formattedTime || date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const patientName = session.patientName || session.patient?.firstName || t('payments.noPatient');
    return `${formattedDate} ${formattedTime} - ${patientName}`;
  };

  // Get selected session info for display
  const selectedSession = formData.sessionId 
    ? sessions.find((s) => s.id === formData.sessionId) 
    : null;

  // Get patient name for edit mode header
  const editPatientName = editPayment?.patient 
    ? `${editPayment.patient.firstName} ${editPayment.patient.lastName || ''}`.trim()
    : null;

  const isFormValid = formData.sessionId && formData.amount > 0;

  // Determine subtitle for header
  const subtitle = isEditMode && editPatientName 
    ? t('payments.paymentOf', { name: editPatientName })
    : (!isEditMode && preselectedSessionId && selectedSession)
      ? t('payments.paymentForSession', { name: selectedSession.patientName || selectedSession.patient?.firstName })
      : undefined;

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('payments.editPayment') : t('payments.registerPayment')}
      subtitle={subtitle}
      icon={isEditMode ? Pencil : DollarSign}
      maxWidth="md:max-w-lg"
      closeLabel={t('payments.drawer.closePanel')}
      disableClose={isLoading || isSaving}
      titleId="payment-drawer-title"
      initialFocus="#payment-session"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <DrawerBody>
          {/* Payment Type Selector - only show in create mode */}
          {!isEditMode && (
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">{t('payments.drawer.paymentType')}</label>
              <PaymentTypeSelector
                selected={paymentType}
                onChange={setPaymentType}
                disabled={isLoading || isSaving || !!preselectedSessionId}
              />
            </div>
          )}

          {/* Monthly Payment Form (with Coming Soon overlay) */}
          {!isEditMode && paymentType === 'monthly' && (
            <MonthlyPaymentForm />
          )}

          {/* Single Payment Form */}
          {(isEditMode || paymentType === 'single') && (
            <>
              {/* Session Selector */}
              <div>
                <label htmlFor="payment-session" className="flex items-center gap-2 text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  {t('payments.fields.session')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="payment-session"
                  value={formData.sessionId}
                  onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    !formData.sessionId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isLoading || isSaving || !!preselectedSessionId}
                  required
                >
                  <option value="">{t('payments.drawer.selectSession')}</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {formatSessionOption(session)}
                    </option>
                  ))}
                </select>

                {/* Selected session preview */}
                {selectedSession && (
                  <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="font-medium text-indigo-900">
                      {selectedSession.patientName || selectedSession.patient?.firstName}
                    </p>
                    <p className="text-indigo-700 text-sm mt-0.5">
                      {new Date(selectedSession.scheduledFrom).toLocaleDateString('es-AR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })} - {selectedSession.formattedTime || new Date(selectedSession.scheduledFrom).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="payment-amount" className="flex items-center gap-2 text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4" />
                  {t('payments.fields.amountARS')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formData.amount <= 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* Payment Date */}
              <div>
                <label htmlFor="payment-date" className="flex items-center gap-2 text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  {t('payments.fields.paymentDate')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="payment-date"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* Payment Status */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('payments.fields.paymentStatus')}
                </label>
                <PaymentStatusSelector
                  selected={formData.status || PaymentStatus.PENDING}
                  onChange={(status) => setFormData({ ...formData, status })}
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="payment-description" className="flex items-center gap-2 text-gray-700 mb-2">
                  <FileText className="w-4 h-4" />
                  {t('payments.fields.descriptionOptional')}
                </label>
                <textarea
                  id="payment-description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('payments.fields.descriptionPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  disabled={isLoading || isSaving}
                />
              </div>
            </>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isSaving}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          {(isEditMode || paymentType === 'single') && (
            <Button
              type="submit"
              disabled={!isFormValid || isLoading || isSaving}
              className={`flex-1 ${
                isFormValid && !isLoading && !isSaving
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving 
                ? t('payments.drawer.saving')
                : isEditMode 
                  ? t('payments.drawer.saveChanges') 
                  : t('payments.registerPayment')
              }
            </Button>
          )}
        </DrawerFooter>
      </form>
    </BaseDrawer>
  );
};
