import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText } from 'lucide-react';
import { formatISODate } from '@/lib/utils/dateFormatters';
import type { CreatePaymentDto } from '@/lib/types/api.types';
import type { SessionUI } from '@/lib/types/session';

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePaymentDto) => Promise<void>;
  sessions?: SessionUI[];
  preselectedSessionId?: string;
  isLoading?: boolean;
}

export const PaymentDrawer = ({
  isOpen,
  onClose,
  onSave,
  sessions = [],
  preselectedSessionId,
  isLoading = false,
}: PaymentDrawerProps) => {
  const [formData, setFormData] = useState<CreatePaymentDto>({
    sessionId: '',
    amount: 0,
    paymentDate: formatISODate(new Date()),
    description: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when drawer opens, apply preselected session if provided
  useEffect(() => {
    if (isOpen) {
      const sessionId = preselectedSessionId || '';
      const preselectedSession = sessionId ? sessions.find((s) => s.id === sessionId) : null;
      
      setFormData({
        sessionId,
        amount: preselectedSession?.cost ? Number(preselectedSession.cost) : 0,
        paymentDate: formatISODate(new Date()),
        description: '',
      });
    }
  }, [isOpen, preselectedSessionId, sessions]);

  // Auto-fill amount when session is selected (for manual selection changes)
  useEffect(() => {
    if (formData.sessionId && !preselectedSessionId) {
      const selectedSession = sessions.find((s) => s.id === formData.sessionId);
      if (selectedSession?.cost) {
        setFormData((prev) => ({
          ...prev,
          amount: Number(selectedSession.cost),
        }));
      }
    }
  }, [formData.sessionId, sessions, preselectedSessionId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sessionId) {
      alert('Debe seleccionar una sesión');
      return;
    }

    if (formData.amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    try {
      setIsSaving(true);
      
      // Ensure amount is a valid number (not NaN)
      const paymentData: CreatePaymentDto = {
        sessionId: formData.sessionId,
        amount: Math.round(formData.amount * 100) / 100, // Round to 2 decimals
        paymentDate: formData.paymentDate,
        description: formData.description?.trim() || undefined,
      };
      
      await onSave(paymentData);
      onClose();
    } catch (error: any) {
      console.error('Error al guardar pago:', error);
      // Show error to user
      const errorMessage = error?.message || 'Error al guardar el pago';
      alert(`Error: ${errorMessage}`);
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
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-white text-xl">Registrar Pago</h2>
            </div>
            <button
              onClick={onClose}
              className="text-indigo-200 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {preselectedSessionId && selectedSession && (
            <p className="text-indigo-200 text-sm mt-2">
              Pago para sesión de {selectedSession.patientName || selectedSession.patient?.firstName}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
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
            <button
              type="submit"
              disabled={!isFormValid || isLoading || isSaving}
              className={`flex-1 py-3 rounded-lg transition-colors ${
                isFormValid && !isLoading && !isSaving
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Guardando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
