import { useState } from 'react';
import { formatDate, formatCurrency } from '@/lib/utils/dateFormatters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared';
import { Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import type { Payment } from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';

interface PaymentCardProps {
  payment: Payment;
  onMarkAsPaid: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PaymentCard = ({ payment, onMarkAsPaid, onDelete }: PaymentCardProps) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    onDelete(payment.id);
    setDeleteConfirmOpen(false);
  };

  const handleMarkAsPaid = () => {
    onMarkAsPaid(payment.id);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const config = {
      [PaymentStatus.PAID]: {
        variant: 'default' as const,
        label: 'Pagado',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 hover:bg-green-100',
      },
      [PaymentStatus.PENDING]: {
        variant: 'secondary' as const,
        label: 'Pendiente',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
      },
      [PaymentStatus.OVERDUE]: {
        variant: 'destructive' as const,
        label: 'Vencido',
        icon: AlertTriangle,
        className: '',
      },
    };

    const { variant, label, icon: Icon, className } = config[status];

    return (
      <Badge variant={variant} className={`gap-1 ${className}`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Get patient name from the payment response
  const patientName = payment.patient
    ? `${payment.patient.firstName}${payment.patient.lastName ? ` ${payment.patient.lastName}` : ''}`
    : 'Paciente desconocido';

  const isPaid = payment.status === PaymentStatus.PAID;

  return (
    <>
      <Card className={`p-4 ${isPaid ? 'bg-green-50/50' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 text-xs font-semibold">
                    {patientName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <span className="text-sm font-medium">{patientName}</span>
              </div>
              {getStatusBadge(payment.status)}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Fecha de pago: {formatDate(payment.paymentDate)}
                </p>
                {payment.paidDate && (
                  <p className="text-xs text-green-600">
                    Cobrado: {formatDate(payment.paidDate)}
                  </p>
                )}
              </div>
            </div>

            {payment.description && (
              <p className="text-sm text-muted-foreground border-l-2 pl-2">
                {payment.description}
              </p>
            )}
          </div>

          <div className="flex gap-2 ml-4">
            {!isPaid && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsPaid}
                title="Marcar como pagado"
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Cobrar
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              title="Eliminar pago"
              aria-label="Eliminar pago"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar pago"
        description={`¿Estás seguro de que deseas eliminar este pago de ${formatCurrency(payment.amount)}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
};
