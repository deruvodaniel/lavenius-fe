import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, MessageCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useResponsive } from '@/lib/hooks';
import { usePatientStore } from '@/lib/stores/patient.store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
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

export function ReminderModal({ payment, onClose }: ReminderModalProps) {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const fetchPatientById = usePatientStore(state => state.fetchPatientById);
  const selectedPatient = usePatientStore(state => state.selectedPatient);

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

  const phoneStatus = isLoadingPatient ? (
    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
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
  );

  const messageField = (
    <div className="mb-4">
      <label htmlFor="reminder-message" className="text-foreground text-sm block mb-2">
        {t('payments.reminderModal.message')}
      </label>
      <textarea
        id="reminder-message"
        className="w-full h-28 sm:h-32 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
        autoFocus
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
    </div>
  );

  const actionButtons = (
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
  );

  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh] bg-background">
          <DrawerHeader className="text-left border-b border-border">
            <DrawerTitle className="text-foreground">
              {t('payments.reminderModal.title')}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pt-4 overflow-y-auto">
            {messageField}
            {phoneStatus}
          </div>
          <DrawerFooter className="gap-2">
            {actionButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-labelledby="reminder-modal-title"
        className="w-full sm:max-w-md !bg-background p-4 sm:p-6 gap-4 rounded-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="reminder-modal-title" className="text-base sm:text-lg font-semibold text-foreground">
            {t('payments.reminderModal.title')}
          </h3>
          <button
            className="text-muted-foreground hover:text-foreground p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {messageField}
        {phoneStatus}
        {actionButtons}
      </DialogContent>
    </Dialog>
  );
}
