import { useMemo } from 'react';
import { usePatientStore } from '@/lib/stores';

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
  const patients = usePatientStore(state => state.patients);
  const selectedPatient = usePatientStore(state => state.selectedPatient);
  const isLoading = usePatientStore(state => state.isLoading);
  const error = usePatientStore(state => state.error);
  
  const fetchPatients = usePatientStore(state => state.fetchPatients);
  const fetchPatientById = usePatientStore(state => state.fetchPatientById);
  const setSelectedPatient = usePatientStore(state => state.setSelectedPatient);
  const createPatient = usePatientStore(state => state.createPatient);
  const updatePatient = usePatientStore(state => state.updatePatient);
  const deletePatient = usePatientStore(state => state.deletePatient);
  const searchPatients = usePatientStore(state => state.searchPatients);
  const clearError = usePatientStore(state => state.clearError);

  // Memoize filtered lists to avoid recreating on every render
  const activePatients = useMemo(() => 
    patients.filter(p => p.status === 'ACTIVE'),
    [patients]
  );

  const inactivePatients = useMemo(() => 
    patients.filter(p => p.status === 'INACTIVE'),
    [patients]
  );

  return {
    patients,
    activePatients,
    inactivePatients,
    selectedPatient,
    isLoading,
    error,
    fetchPatients,
    fetchPatientById,
    setSelectedPatient,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    clearError,
  };
};
