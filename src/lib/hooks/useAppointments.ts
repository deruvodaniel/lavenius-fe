import { useMemo } from 'react';
import { useAppointmentStore } from '@/lib/stores';

/**
 * Custom hook for appointment management
 * Provides simplified interface to appointment store for components
 * 
 * @example
 * ```tsx
 * const { appointments, todayAppointments, loading, fetchUpcoming } = useAppointments();
 * 
 * useEffect(() => {
 *   fetchUpcoming(30); // Next 30 appointments
 * }, []);
 * ```
 */
export const useAppointments = () => {
  const appointments = useAppointmentStore(state => state.appointments);
  const isLoading = useAppointmentStore(state => state.isLoading);
  const error = useAppointmentStore(state => state.error);
  
  const fetchAppointments = useAppointmentStore(state => state.fetchAppointments);
  const fetchUpcoming = useAppointmentStore(state => state.fetchUpcoming);
  const createAppointment = useAppointmentStore(state => state.createAppointment);
  const updateAppointment = useAppointmentStore(state => state.updateAppointment);
  const deleteAppointment = useAppointmentStore(state => state.deleteAppointment);
  const clearError = useAppointmentStore(state => state.clearError);

  // Memoize todayAppointments to avoid recreating on every render
  const todayAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.dateTime);
      return aptDate >= today && aptDate < tomorrow;
    });
  }, [appointments]);

  return {
    appointments,
    todayAppointments,
    isLoading,
    error,
    fetchAppointments,
    fetchUpcoming,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    clearError,
  };
};
