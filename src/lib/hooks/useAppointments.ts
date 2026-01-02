import { useAppointmentStore, selectTodayAppointments } from '@/lib/stores';

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
  const todayAppointments = useAppointmentStore(selectTodayAppointments);
  const isLoading = useAppointmentStore(state => state.isLoading);
  const error = useAppointmentStore(state => state.error);
  
  const fetchAppointments = useAppointmentStore(state => state.fetchAppointments);
  const fetchUpcoming = useAppointmentStore(state => state.fetchUpcoming);
  const createAppointment = useAppointmentStore(state => state.createAppointment);
  const updateAppointment = useAppointmentStore(state => state.updateAppointment);
  const deleteAppointment = useAppointmentStore(state => state.deleteAppointment);
  const clearError = useAppointmentStore(state => state.clearError);

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
