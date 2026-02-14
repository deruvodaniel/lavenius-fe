import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/dateFormatters';
import { SkeletonStats } from '@/components/shared/Skeleton';
import { TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * PaymentStats Component
 * 
 * Displays payment statistics cards.
 * Uses pre-calculated totals from the hook for accuracy.
 */

interface PaymentTotals {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

interface PaymentStatsProps {
  totals: PaymentTotals | null;
  isLoading?: boolean;
}

export const PaymentStats = ({ totals, isLoading }: PaymentStatsProps) => {
  if (isLoading || !totals) {
    return <SkeletonStats cards={4} />;
  }

  const statCards = [
    {
      label: 'Total Sesiones',
      value: totals.totalAmount,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      count: totals.totalCount,
    },
    {
      label: 'Cobrado',
      value: totals.paidAmount,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      count: totals.paidCount,
    },
    {
      label: 'Pendiente',
      value: totals.pendingAmount,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      count: totals.pendingCount,
    },
    {
      label: 'Vencido',
      value: totals.overdueAmount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      count: totals.overdueCount,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-3 sm:p-4 lg:p-6 bg-white">
            <div className="flex items-start sm:items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  {stat.label}
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 sm:mt-2 truncate">
                  {formatCurrency(stat.value)}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  {stat.count} {stat.count === 1 ? 'pago' : 'pagos'}
                </p>
              </div>
              <div className={`${stat.bgColor} p-2 sm:p-3 rounded-full flex-shrink-0`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
