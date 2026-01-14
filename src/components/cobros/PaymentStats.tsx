import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/dateFormatters';
import { TrendingUp, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import type { Payment } from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';

interface PaymentStatsProps {
  payments: Payment[];
}

export const PaymentStats = ({ payments }: PaymentStatsProps) => {
  const calculateStats = () => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    
    const completed = payments
      .filter((p) => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pending = payments
      .filter((p) => p.status === PaymentStatus.PENDING)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const cancelled = payments
      .filter((p) => p.status === PaymentStatus.CANCELLED)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const refunded = payments
      .filter((p) => p.status === PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      total,
      completed,
      pending,
      cancelled,
      refunded,
      count: payments.length,
    };
  };

  const stats = calculateStats();

  const statCards = [
    {
      label: 'Total Ingresos',
      value: stats.completed,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Pendientes',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Completados',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      count: payments.filter((p) => p.status === PaymentStatus.COMPLETED).length,
    },
    {
      label: 'Reembolsados',
      value: stats.refunded,
      icon: RotateCcw,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(stat.value)}
                </p>
                {stat.count !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.count} {stat.count === 1 ? 'pago' : 'pagos'}
                  </p>
                )}
              </div>
              <div className={`${stat.bgColor} p-3 rounded-full`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
