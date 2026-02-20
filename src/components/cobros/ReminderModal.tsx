import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, MessageCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePatientStore } from '@/lib/stores/patient.store';
import { Button } from '@/components/ui/button';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { formatPaymentReminderMessage, openWhatsApp } from '@/lib/utils/whatsappTemplates';
import { formatCurrency } from '@/lib/utils/dateFormatters';
import type { Payment } from '@/lib/types/api.types';

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

// ============================================================================
// COMPONENT
// ============================================================================

interface ReminderModalProps {
  payment: Payment;
  onClose: () => void;
}

/**
 * ReminderModal - Modal for sending payment reminders via WhatsApp
 * 
 * Features:
 * - Focus trap for keyboard navigation
 * - ESC key to close
 * - Customizable message that can be copied or sent via WhatsApp
 * - Automatically loads patient phone number if available
 */
export function ReminderModal({ payment, onClose }: ReminderModalProps) {
  const { t } = useTranslation();
  const fetchPatientById = usePatientStore(state => state.fetchPatientById);
  const selectedPatient = usePatientStore(state => state.selectedPatient);
  
  // Focus trap
  const containerRef = useFocusTrap<HTMLDivElement>({
    isActive: true,
    onEscape: onClose,
    restoreFocus: true,
    initialFocus: '#reminder-message',
  });
  
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [patientPhone, setPatientPhone] = useState<string | undefined>(undefined);
  
  const patientName = payment.patient 
    ? `${payment.patient.firstName} ${payment.patient.lastName || ''}`.trim()
    : t('payments.fields.patient');
  
  const defaultMessage = formatPaymentReminderMessage(
    patientName,
    formatDateShort(payment.paymentDate),
    formatCurrency(payment.amount)
  );
  
  const [message, setMessage] = useState(defaultMessage);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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
    toast.success(t('payments.messages.messageCopied'));
  };

  const handleWhatsApp = () => {
    if (patientPhone) {
      openWhatsApp(patientPhone, message);
    } else {
      toast.info(t('payments.messages.noPhoneRegistered'));
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        ref={containerRef}
        className="relative bg-white rounded-t-xl sm:rounded-lg shadow-2xl p-4 sm:p-6 w-full sm:max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="reminder-modal-title" className="text-base sm:text-lg font-semibold text-gray-900">
            {t('payments.reminderModal.title')}
          </h3>
          <button 
            className="text-gray-500 hover:text-gray-700 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" 
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4">
          <label htmlFor="reminder-message" className="text-gray-700 text-sm block mb-2">
            {t('payments.reminderModal.message')}
          </label>
          <textarea
            id="reminder-message"
            className="w-full h-28 sm:h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        {/* Phone status indicator */}
        {isLoadingPatient ? (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('payments.reminderModal.loadingPatient')}</span>
          </div>
        ) : patientPhone ? (
          <div className="mb-4 text-sm text-green-600">
            {t('payments.reminderModal.phone')}: {patientPhone}
          </div>
        ) : (
          <div className="mb-4 text-sm text-yellow-600">
            {t('payments.reminderModal.noPhone')}
          </div>
        )}
        
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            {t('payments.reminderModal.copy')}
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700" 
            onClick={handleWhatsApp}
            disabled={isLoadingPatient}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {t('payments.reminderModal.whatsapp')}
          </Button>
        </div>
      </div>
    </div>
  );
}
