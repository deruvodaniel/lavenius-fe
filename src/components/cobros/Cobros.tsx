import { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, Copy, MessageCircle, X, Plus, Video, MapPin, DollarSign, Calendar, History, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSessions } from '@/lib/stores/sessionStore';
import { usePayments } from '@/lib/hooks/usePayments';
import { PaymentStats } from './PaymentStats';
import { PaymentDrawer } from './PaymentDrawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CreatePaymentDto, Payment } from '@/lib/types/api.types';
import type { SessionUI } from '@/lib/types/session';
import { SessionStatus } from '@/lib/types/session';

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

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-24 sm:h-20 bg-gray-100 animate-pulse rounded-lg" />
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, title, subtitle, variant = 'default' }: { 
  icon: React.ElementType; 
  title: string; 
  subtitle: string;
  variant?: 'default' | 'success';
}) => (
  <Card className="p-6 sm:p-8 text-center">
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
    <Card className={`p-3 sm:p-4 transition-all hover:shadow-md border-l-4 ${borderColor}`}>
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
  const initials = getInitials(patientName);

  return (
    <Card className="p-3 sm:p-4 border-l-4 border-l-green-500">
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
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [preselectedSession, setPreselectedSession] = useState<SessionUI | null>(null);
  const [reminderSession, setReminderSession] = useState<SessionUI | null>(null);

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
  }, []);

  // Today for status calculation
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Sessions pending payment: not cancelled, not paid
  // No week filter - show all upcoming sessions that need payment
  const sessionsPendingPayment = useMemo(() => {
    return sessionsUI
      .filter((session) => {
        const isNotCancelled = session.status !== SessionStatus.CANCELLED;
        const notPaid = !isSessionPaid(session.id);
        return isNotCancelled && notPaid;
      })
      .sort((a, b) => new Date(a.scheduledFrom).getTime() - new Date(b.scheduledFrom).getTime());
  }, [sessionsUI, isSessionPaid]);

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
      await createPayment(data);
      toast.success('Pago registrado correctamente');
      setIsPaymentDrawerOpen(false);
      setPreselectedSession(null);
      // Refresh sessions to update the pending list
      await fetchUpcoming();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('No se pudo guardar el pago. Por favor intenta nuevamente.');
    }
  }, [createPayment, fetchUpcoming]);

  const handleCloseDrawer = useCallback(() => {
    setIsPaymentDrawerOpen(false);
    setPreselectedSession(null);
  }, []);

  const isLoading = isInitialLoading;

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
        <TabsContent value="pendientes" className="mt-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : sessionsPendingPayment.length === 0 ? (
            <EmptyState 
              icon={DollarSign} 
              title="¡Todo al día!" 
              subtitle="No hay sesiones pendientes de cobro"
              variant="success"
            />
          ) : (
            <div className="space-y-3">
              {sessionsPendingPayment.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  status={getSessionStatus(session)}
                  onReminder={() => setReminderSession(session)}
                  onCollect={() => handleCollectPayment(session)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Historial Tab */}
        <TabsContent value="historial" className="mt-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : paidPayments.length === 0 ? (
            <EmptyState 
              icon={History} 
              title="Sin historial" 
              subtitle="Aún no hay pagos registrados" 
            />
          ) : (
            <div className="space-y-3">
              {paidPayments.map((payment) => (
                <PaymentCard key={payment.id} payment={payment} />
              ))}
            </div>
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
