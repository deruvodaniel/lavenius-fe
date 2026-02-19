import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Sparkles, CalendarRange, Pencil, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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

const PaymentTypeSelector = ({ selected, onChange, disabled }: PaymentTypeSelectorProps) => (
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
      <span className="text-sm font-medium block">Pago único</span>
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
      <span className="text-sm font-medium block">Plan mensual</span>
    </button>
  </div>
);

// ============================================================================
// PAYMENT STATUS SELECTOR
// ============================================================================

const STATUS_OPTIONS = [
  { 
    value: PaymentStatus.PENDING, 
    label: 'Pendiente', 
    icon: Clock, 
    className: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    iconColor: 'text-yellow-600'
  },
  { 
    value: PaymentStatus.PAID, 
    label: 'Pagado', 
    icon: CheckCircle2, 
    className: 'border-green-500 bg-green-50 text-green-700',
    iconColor: 'text-green-600'
  },
  { 
    value: PaymentStatus.OVERDUE, 
    label: 'Vencido', 
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

const PaymentStatusSelector = ({ selected, onChange, disabled }: PaymentStatusSelectorProps) => (
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
          <span className="text-sm font-medium block">{option.label}</span>
        </button>
      );
    })}
  </div>
);

// ============================================================================
// COMING SOON OVERLAY
// ============================================================================

const ComingSoonOverlay = () => (
  <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center z-10">
    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
      <Sparkles className="w-8 h-8 text-indigo-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Próximamente</h3>
    <p className="text-sm text-gray-500 text-center max-w-xs px-4">
      Los planes mensuales y pagos adelantados estarán disponibles pronto
    </p>
  </div>
);

// ============================================================================
// MONTHLY PAYMENT FORM (placeholder)
// ============================================================================

const MonthlyPaymentForm = () => (
  <div className="relative">
    <ComingSoonOverlay />
    <div className="space-y-4 opacity-50 pointer-events-none select-none p-4 border border-gray-200 rounded-lg">
      <div>
        <label className="text-gray-700 text-sm mb-2 block">Paciente</label>
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
          Seleccionar paciente...
        </div>
      </div>
      <div>
        <label className="text-gray-700 text-sm mb-2 block">Cantidad de sesiones</label>
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
          4 sesiones / mes
        </div>
      </div>
      <div>
        <label className="text-gray-700 text-sm mb-2 block">Precio por sesión</label>
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
          $15,000
        </div>
      </div>
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-green-700 text-sm">Descuento plan mensual (10%)</span>
          <span className="text-green-700 font-medium">-$6,000</span>
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-200">
          <span className="text-green-800 font-medium">Total plan mensual</span>
          <span className="text-green-800 font-bold text-lg">$54,000</span>
        </div>
      </div>
    </div>
  </div>
);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sessionId) {
      toast.error('Debe seleccionar una sesión');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
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
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el pago';
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
    const patientName = session.patientName || session.patient?.firstName || 'Sin paciente';
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

  return (
    <div className="fixed inset-0 z-50 flex !top-0 !mt-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-full md:max-w-lg bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                {isEditMode ? <Pencil className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
              </div>
              <h2 className="text-white text-xl">
                {isEditMode ? 'Editar Pago' : 'Registrar Pago'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-indigo-200 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {isEditMode && editPatientName && (
            <p className="text-indigo-200 text-sm mt-2">
              Pago de {editPatientName}
            </p>
          )}
          {!isEditMode && preselectedSessionId && selectedSession && (
            <p className="text-indigo-200 text-sm mt-2">
              Pago para sesión de {selectedSession.patientName || selectedSession.patient?.firstName}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Payment Type Selector - only show in create mode */}
          {!isEditMode && (
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">Tipo de pago</label>
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
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Sesión <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sessionId}
                  onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    !formData.sessionId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isLoading || isSaving || !!preselectedSessionId}
                  required
                >
                  <option value="">Seleccionar sesión...</option>
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
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Monto (ARS) <span className="text-red-500">*</span>
                </label>
                <input
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
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Fecha de Pago <span className="text-red-500">*</span>
                </label>
                <input
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
                  Estado del Pago
                </label>
                <PaymentStatusSelector
                  selected={formData.status || PaymentStatus.PENDING}
                  onChange={(status) => setFormData({ ...formData, status })}
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <FileText className="w-4 h-4" />
                  Descripción <span className="text-gray-400 text-sm">(opcional)</span>
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notas adicionales sobre el pago..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  disabled={isLoading || isSaving}
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading || isSaving}
            >
              Cancelar
            </button>
            {(isEditMode || paymentType === 'single') && (
              <button
                type="submit"
                disabled={!isFormValid || isLoading || isSaving}
                className={`flex-1 py-3 rounded-lg transition-colors ${
                  isFormValid && !isLoading && !isSaving
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSaving 
                  ? 'Guardando...' 
                  : isEditMode 
                    ? 'Guardar Cambios' 
                    : 'Registrar Pago'
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
