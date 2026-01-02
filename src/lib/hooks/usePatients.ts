import { usePatientStore, selectPatients, selectActivePatients, selectInactivePatients } from '@/lib/stores';

/**
 * Custom hook for patient management
 * Provides simplified interface to patient store for components
 * 
 * @example
 * ```tsx
 * const { patients, loading, fetchPatients, createPatient } = usePatients();
 * 
 * useEffect(() => {
 *   fetchPatients();
 * }, []);
 * 
 * const handleCreate = async (data) => {
 *   await createPatient(data);
 * };
 * ```
 */
export const usePatients = () => {
  const patients = usePatientStore(selectPatients);
  const activePatients = usePatientStore(selectActivePatients);
  const inactivePatients = usePatientStore(selectInactivePatients);
  const selectedPatient = usePatientStore(state => state.selectedPatient);
  const isLoading = usePatientStore(state => state.isLoading);
  const error = usePatientStore(state => state.error);
  
  const fetchPatients = usePatientStore(state => state.fetchPatients);
  const setSelectedPatient = usePatientStore(state => state.setSelectedPatient);
  const createPatient = usePatientStore(state => state.createPatient);
  const updatePatient = usePatientStore(state => state.updatePatient);
  const deletePatient = usePatientStore(state => state.deletePatient);
  const searchPatients = usePatientStore(state => state.searchPatients);
  const clearError = usePatientStore(state => state.clearError);

  return {
    patients,
    activePatients,
    inactivePatients,
    selectedPatient,
    isLoading,
    error,
    fetchPatients,
    setSelectedPatient,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    clearError,
  };
};
