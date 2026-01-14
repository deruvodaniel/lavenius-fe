import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { formatISODate } from '@/lib/utils/dateFormatters';
import type { Payment, CreatePaymentDto, UpdatePaymentDto } from '@/lib/types/api.types';
import { PaymentMethod, PaymentStatus } from '@/lib/types/api.types';

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePaymentDto | UpdatePaymentDto) => Promise<void>;
  payment?: Payment | null;
  patientId?: string;
  sessionId?: string;
  isLoading?: boolean;
}

export const PaymentDrawer = ({
  isOpen,
  onClose,
  onSave,
  payment,
  patientId,
  sessionId,
  isLoading = false,
}: PaymentDrawerProps) => {
  const [formData, setFormData] = useState<CreatePaymentDto>({
    patientId: patientId || '',
    sessionId: sessionId || undefined,
    amount: 0,
    paymentDate: formatISODate(new Date()),
    paymentMethod: PaymentMethod.CASH,
    status: PaymentStatus.COMPLETED,
    notes: '',
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        patientId: payment.patientId,
        sessionId: payment.sessionId,
        amount: payment.amount,
        paymentDate: formatISODate(payment.paymentDate),
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        notes: payment.notes || '',
      });
    } else {
      setFormData({
        patientId: patientId || '',
        sessionId: sessionId || undefined,
        amount: 0,
        paymentDate: formatISODate(new Date()),
        paymentMethod: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        notes: '',
      });
    }
  }, [payment, patientId, sessionId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId) {
      alert('Debe seleccionar un paciente');
      return;
    }

    if (formData.amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    try {
      if (payment) {
        const { patientId: _, ...updateData } = formData;
        await onSave(updateData);
      } else {
        await onSave(formData);
      }

      handleClose();
    } catch (error) {
      console.error('Error al guardar pago:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      patientId: '',
      sessionId: undefined,
      amount: 0,
      paymentDate: formatISODate(new Date()),
      paymentMethod: PaymentMethod.CASH,
      status: PaymentStatus.COMPLETED,
      notes: '',
    });
    onClose();
  };

  const paymentMethodOptions = [
    { value: PaymentMethod.CASH, label: 'Efectivo' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Tarjeta de Crédito' },
    { value: PaymentMethod.DEBIT_CARD, label: 'Tarjeta de Débito' },
    { value: PaymentMethod.TRANSFER, label: 'Transferencia' },
    { value: PaymentMethod.OTHER, label: 'Otro' },
  ];

  const paymentStatusOptions = [
    { value: PaymentStatus.COMPLETED, label: 'Completado' },
    { value: PaymentStatus.PENDING, label: 'Pendiente' },
    { value: PaymentStatus.CANCELLED, label: 'Cancelado' },
    { value: PaymentStatus.REFUNDED, label: 'Reembolsado' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{payment ? 'Editar Pago' : 'Registrar Nuevo Pago'}</SheetTitle>
          <SheetDescription>
            {payment
              ? 'Modifica los datos del pago existente.'
              : 'Completa los datos para registrar un nuevo pago.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
              }
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Fecha de Pago *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) =>
                setFormData({ ...formData, paymentDate: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pago *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value: PaymentMethod) =>
                setFormData({ ...formData, paymentMethod: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: PaymentStatus) =>
                setFormData({ ...formData, status: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {paymentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales sobre el pago..."
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Guardando...
                </>
              ) : payment ? (
                'Guardar Cambios'
              ) : (
                'Registrar Pago'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
