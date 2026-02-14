import { PaymentCard } from './PaymentCard';
import { EmptyState } from '../shared/EmptyState';
import { Receipt } from 'lucide-react';
import type { Payment } from '@/lib/types/api.types';

interface PaymentListProps {
  payments: Payment[];
  onMarkAsPaid: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew?: () => void;
}

export const PaymentList = ({
  payments,
  onMarkAsPaid,
  onDelete,
  onCreateNew,
}: PaymentListProps) => {
  if (payments.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No hay pagos registrados"
        description="Comienza registrando el primer pago para este paciente o sesión."
        action={onCreateNew ? { label: "Registrar Pago", onClick: onCreateNew } : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <PaymentCard
          key={payment.id}
          payment={payment}
          onMarkAsPaid={onMarkAsPaid}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
