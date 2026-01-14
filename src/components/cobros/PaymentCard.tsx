import { formatDate, formatCurrency } from '@/lib/utils/dateFormatters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, CreditCard, Banknote, Building2, Smartphone } from 'lucide-react';
import type { Payment } from '@/lib/types/api.types';
import { PaymentMethod, PaymentStatus } from '@/lib/types/api.types';

interface PaymentCardProps {
  payment: Payment;
  patientName?: string;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
}

export const PaymentCard = ({ payment, patientName, onEdit, onDelete }: PaymentCardProps) => {
  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este pago?')) {
      onDelete(payment.id);
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const variants = {
      [PaymentStatus.COMPLETED]: 'default',
      [PaymentStatus.PENDING]: 'secondary',
      [PaymentStatus.CANCELLED]: 'destructive',
      [PaymentStatus.REFUNDED]: 'outline',
    } as const;

    const labels = {
      [PaymentStatus.COMPLETED]: 'Completado',
      [PaymentStatus.PENDING]: 'Pendiente',
      [PaymentStatus.CANCELLED]: 'Cancelado',
      [PaymentStatus.REFUNDED]: 'Reembolsado',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    const icons = {
      [PaymentMethod.CASH]: Banknote,
      [PaymentMethod.CREDIT_CARD]: CreditCard,
      [PaymentMethod.DEBIT_CARD]: CreditCard,
      [PaymentMethod.TRANSFER]: Building2,
      [PaymentMethod.OTHER]: Smartphone,
    };

    const Icon = icons[method];
    return <Icon className="h-4 w-4" />;
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels = {
      [PaymentMethod.CASH]: 'Efectivo',
      [PaymentMethod.CREDIT_CARD]: 'Tarjeta de Crédito',
      [PaymentMethod.DEBIT_CARD]: 'Tarjeta de Débito',
      [PaymentMethod.TRANSFER]: 'Transferencia',
      [PaymentMethod.OTHER]: 'Otro',
    };

    return labels[method];
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              {getPaymentMethodIcon(payment.paymentMethod)}
              <span>{getPaymentMethodLabel(payment.paymentMethod)}</span>
            </div>
            {getStatusBadge(payment.status)}
          </div>

          {patientName && (
            <p className="text-sm text-muted-foreground">
              Paciente: {patientName}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(payment.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(payment.paymentDate)}
              </p>
            </div>
          </div>

          {payment.notes && (
            <p className="text-sm text-muted-foreground border-l-2 pl-2">
              {payment.notes}
            </p>
          )}

          {payment.updatedAt !== payment.createdAt && (
            <p className="text-xs text-muted-foreground">
              Editado: {formatDate(payment.updatedAt)}
            </p>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(payment)}
            title="Editar pago"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            title="Eliminar pago"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
