import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Video, MapPin, Calendar, Plus, Edit2, Trash2, Users, Search, X, ArrowUpDown, LayoutGrid, List, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { FichaClinica } from '../dashboard';
import { PacienteDrawer } from './PacienteDrawer';
import { usePatients, useErrorToast, useResponsive } from '@/lib/hooks';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { SessionStatus } from '@/lib/types/session';
import { AnimatedList, SkeletonCard, EmptyState, ConfirmDialog, SimplePagination, InfiniteScrollLoader } from '../shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { CreatePatientDto } from '@/lib/types/api.types';
import type { PatientFilters } from '@/lib/services/patient.service';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const ITEMS_PER_PAGE = 12; // 4 rows of 3 on desktop
const INFINITE_SCROLL_BATCH = 9; // 3 rows of 3

type SortOption = 'name-asc' | 'name-desc' | 'age-asc' | 'age-desc' | 'recent';
type ViewMode = 'cards' | 'table';

export function Pacientes() {
  const { t } = useTranslation();
  const { patients, selectedPatient, isLoading, error, fetchPatients, fetchPatientById, createPatient, updatePatient, deletePatient, clearError, setSelectedPatient } = usePatients();
  const { sessions, fetchUpcoming } = useSessionStore();
  const { isMobile } = useResponsive();
  
  // Auto-display error toasts
  useErrorToast(error, clearError);
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isLoadingPatientDetails, setIsLoadingPatientDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [modalidadFilter, setModalidadFilter] = useState<'todas' | 'presencial' | 'remoto' | 'mixto'>('todas');
  const [frecuenciaFilter, setFrecuenciaFilter] = useState<'todas' | 'semanal' | 'quincenal' | 'mensual'>('todas');
  const [soloTurnosEstaSemana, setSoloTurnosEstaSemana] = useState(false);
  const [pacienteDrawerOpen, setPacienteDrawerOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<typeof patients[0] | null>(null);
  const hasFetchedRef = React.useRef(false);

  // Sort and view mode state
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state (desktop)
  const [currentPage, setCurrentPage] = useState(1);
  
  // Infinite scroll state (mobile)
  const [visibleCount, setVisibleCount] = useState(INFINITE_SCROLL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Sort options with translations
  const sortOptions: { value: SortOption; label: string }[] = useMemo(() => [
    { value: 'name-asc', label: t('patients.sort.nameAsc') },
    { value: 'name-desc', label: t('patients.sort.nameDesc') },
    { value: 'age-asc', label: t('patients.sort.ageAsc') },
    { value: 'age-desc', label: t('patients.sort.ageDesc') },
    { value: 'recent', label: t('patients.sort.recent') },
  ], [t]);

  // Debounce search term for server-side filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build server-side filters
  const serverFilters = useMemo((): PatientFilters | undefined => {
    const filters: PatientFilters = {};
    
    if (debouncedSearchTerm.trim()) {
      filters.name = debouncedSearchTerm.trim();
    }
    
    if (modalidadFilter !== 'todas') {
      // Map frontend values to backend values
      filters.sessionType = modalidadFilter === 'remoto' ? 'remote' : 'presential';
    }
    
    if (frecuenciaFilter !== 'todas') {
      filters.frequency = frecuenciaFilter;
    }
    
    if (soloTurnosEstaSemana) {
      filters.hasSessionThisWeek = true;
    }
    
    // Return undefined if no filters to avoid unnecessary query params
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [debouncedSearchTerm, modalidadFilter, frecuenciaFilter, soloTurnosEstaSemana]);

  // Fetch patients when filters change (server-side filtering)
  useEffect(() => {
    fetchPatients(serverFilters).catch(() => {});
  }, [serverFilters, fetchPatients]);

  // Reset pagination/scroll when filters change
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(INFINITE_SCROLL_BATCH);
  }, [debouncedSearchTerm, modalidadFilter, frecuenciaFilter, soloTurnosEstaSemana, sortBy]);

  // Infinite scroll effect (mobile only)
  useEffect(() => {
    if (!isMobile) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + INFINITE_SCROLL_BATCH);
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isMobile, isLoadingMore]);

  // Fetch sessions on mount (patients are fetched via filter effect)
  React.useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUpcoming().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for openPatientDrawer event from onboarding
  React.useEffect(() => {
    const handleOpenDrawer = () => {
      setPacienteDrawerOpen(true);
    };
    
    window.addEventListener('openPatientDrawer', handleOpenDrawer);
    return () => window.removeEventListener('openPatientDrawer', handleOpenDrawer);
  }, []);

  // Build a map of patient ID -> next session date for quick lookup
  const nextSessionByPatient = useMemo(() => {
    const map = new Map<string, Date>();
    const now = new Date();
    
    // Sessions should already be sorted by date, but filter for future ones
    const upcomingSessions = sessions
      .filter(s => new Date(s.scheduledFrom) >= now && s.status !== SessionStatus.CANCELLED)
      .sort((a, b) => new Date(a.scheduledFrom).getTime() - new Date(b.scheduledFrom).getTime());
    
    // For each session, only keep the first (earliest) one per patient
    for (const session of upcomingSessions) {
      const patientId = session.patient?.id;
      if (patientId && !map.has(patientId)) {
        map.set(patientId, new Date(session.scheduledFrom));
      }
    }
    
    return map;
  }, [sessions]);

  // Get next appointment for a patient
  const getProximoTurno = useCallback((pacienteId: string): { dias: number } | null => {
    const nextDate = nextSessionByPatient.get(pacienteId);
    if (!nextDate) return null;
    
    const now = new Date();
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return { dias: Math.max(0, diffDays) };
  }, [nextSessionByPatient]);

  // Function to select a patient and fetch full details
  const handleSelectPatient = useCallback(async (patientId: string) => {
    setSelectedPatientId(patientId);
    setIsLoadingPatientDetails(true);
    try {
      await fetchPatientById(patientId);
    } catch (err) {
      console.error('Error fetching patient details:', err);
      toast.error(t('patients.messages.loadError'));
    } finally {
      setIsLoadingPatientDetails(false);
    }
  }, [fetchPatientById, t]);

  // Function to go back from FichaClinica
  const handleBackFromFicha = useCallback(() => {
    setSelectedPatientId(null);
    setSelectedPatient(null);
  }, [setSelectedPatient]);

  const handleNuevoPaciente = () => {
    setPacienteDrawerOpen(true);
  };

  const handleSavePaciente = async (patientData: CreatePatientDto) => {
    try {
      if (editingPatient) {
        // Update existing patient
        await updatePatient(editingPatient.id, patientData);
        toast.success(t('patients.messages.updateSuccess'));
      } else {
        // Create new patient
        await createPatient(patientData);
        toast.success(t('patients.messages.createSuccess'));
      }
      setPacienteDrawerOpen(false);
      setEditingPatient(null);
      // Refresh list
      await fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error(t('patients.messages.saveError'));
    }
  };

  const handleDeletePaciente = (patientId: string, patientName: string) => {
    setPatientToDelete({ id: patientId, name: patientName });
    setDeleteConfirmOpen(true);
  };

  const confirmDeletePaciente = async () => {
    if (!patientToDelete) return;

    setIsDeleting(true);
    try {
      await deletePatient(patientToDelete.id);
      toast.success(t('patients.messages.deleteSuccess'));
      setDeleteConfirmOpen(false);
      setPatientToDelete(null);
      // Refresh list
      await fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error(t('patients.messages.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Map API data to component format
  const pacientes = patients.map((p) => {
    // Calculate age from birthDate if available
    let edad = p.age || 0;
    if (p.birthDate && !p.age) {
      const birthDate = new Date(p.birthDate);
      const today = new Date();
      edad = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        edad--;
      }
    }

    // Map sessionType from API to display values
    const mapSessionType = (sessionType?: string): 'presencial' | 'remoto' | 'mixto' => {
      switch (sessionType) {
        case 'remote':
          return 'remoto';
        case 'presential':
          return 'presencial';
        default:
          return 'presencial';
      }
    };

    return {
      id: p.id,
      nombre: `${p.firstName} ${p.lastName}`,
      telefono: p.phone || '',
      email: p.email || '',
      edad,
      coberturaMedica: p.healthInsurance || '',
      modalidad: mapSessionType(p.sessionType),
      frecuencia: (p.frequency as 'semanal' | 'quincenal' | 'mensual') || 'semanal',
      historiaClinica: p.notes || '',
      createdAt: p.createdAt,
    };
  });

  // Filter and sort patients (filtering is now server-side, only sorting is client-side)
  const filteredPacientes = useMemo(() => {
    // Create a copy for sorting (patients are already filtered by server)
    let filtered = [...pacientes];

    // Sort (client-side)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.nombre.localeCompare(b.nombre);
        case 'name-desc':
          return b.nombre.localeCompare(a.nombre);
        case 'age-asc':
          return a.edad - b.edad;
        case 'age-desc':
          return b.edad - a.edad;
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [pacientes, sortBy]);

  // Pagination for desktop, infinite scroll for mobile
  const totalPages = Math.ceil(filteredPacientes.length / ITEMS_PER_PAGE);
  const hasMore = visibleCount < filteredPacientes.length;

  const displayedPacientes = useMemo(() => {
    if (isMobile) {
      return filteredPacientes.slice(0, visibleCount);
    } else {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredPacientes.slice(start, start + ITEMS_PER_PAGE);
    }
  }, [filteredPacientes, currentPage, visibleCount, isMobile]);

  const hasActiveFilters = searchTerm || modalidadFilter !== 'todas' || frecuenciaFilter !== 'todas' || soloTurnosEstaSemana;
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const activeFilterCount = [
    modalidadFilter !== 'todas',
    frecuenciaFilter !== 'todas',
    soloTurnosEstaSemana,
  ].filter(Boolean).length;

  const getModalidadLabel = (modalidad: string) => {
    switch (modalidad) {
      case 'presencial':
        return t('patients.modality.presential');
      case 'remoto':
        return t('patients.modality.remote');
      case 'mixto':
        return t('patients.modality.mixed');
      default:
        return modalidad;
    }
  };

  const getFrecuenciaLabel = (frecuencia: string) => {
    switch (frecuencia) {
      case 'semanal':
        return t('patients.frequency.weekly');
      case 'quincenal':
        return t('patients.frequency.biweekly');
      case 'mensual':
        return t('patients.frequency.monthly');
      default:
        return frecuencia;
    }
  };

  // If a patient is selected, show their clinical record
  if (selectedPatientId) {
    // Show loading state while fetching patient details
    if (isLoadingPatientDetails || !selectedPatient) {
      return (
        <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-gray-500">{t('patients.loadingPatientFile')}</p>
          </div>
        </div>
      );
    }
    
    return (
      <FichaClinica
        patient={selectedPatient}
        onBack={handleBackFromFicha}
      />
    );
  }

  // Otherwise, show the list of patients
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('patients.title')}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            {filteredPacientes.length} {t('patients.patientCount', { count: filteredPacientes.length }).split(' ').slice(1).join(' ')} 
            {hasActiveFilters 
              ? ` ${t(filteredPacientes.length !== 1 ? 'patients.found_plural' : 'patients.found')}` 
              : ` ${t(filteredPacientes.length !== 1 ? 'patients.registered_plural' : 'patients.registered')}`}
          </p>
        </div>
        <button
          onClick={handleNuevoPaciente}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {t('patients.newPatient')}
        </button>
      </div>

      {/* Search + Filters */}
      {isMobile ? (
        <>
          {/* Mobile: Search bar + Filters button */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('patients.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterDrawerOpen(true)}
              className="relative flex-shrink-0 flex items-center gap-1.5 h-10"
            >
              <Filter className="w-4 h-4" />
              {t('patients.filters.label')}
              {activeFilterCount > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 text-[10px] bg-indigo-600 text-white border-0 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Mobile Filters Drawer */}
          <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
            <DrawerContent className="max-h-[75vh]">
              <DrawerHeader className="text-left border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <DrawerTitle>{t('patients.filters.title')}</DrawerTitle>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setModalidadFilter('todas');
                        setFrecuenciaFilter('todas');
                        setSoloTurnosEstaSemana(false);
                      }}
                      className="text-gray-500"
                    >
                      {t('patients.filters.clearFilters')}
                    </Button>
                  )}
                </div>
              </DrawerHeader>
              <div className="px-4 py-4 pb-8 overflow-y-auto space-y-5">
                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('patients.filters.sortBy')}</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Modalidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('patients.modality.label')}</label>
                  <select
                    value={modalidadFilter}
                    onChange={(e) => setModalidadFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="todas">{t('patients.modality.all')}</option>
                    <option value="presencial">{t('patients.modality.presential')}</option>
                    <option value="remoto">{t('patients.modality.remote')}</option>
                    <option value="mixto">{t('patients.modality.mixed')}</option>
                  </select>
                </div>

                {/* Frecuencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('patients.frequency.label')}</label>
                  <select
                    value={frecuenciaFilter}
                    onChange={(e) => setFrecuenciaFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="todas">{t('patients.frequency.all')}</option>
                    <option value="semanal">{t('patients.frequency.weekly')}</option>
                    <option value="quincenal">{t('patients.frequency.biweekly')}</option>
                    <option value="mensual">{t('patients.frequency.monthly')}</option>
                  </select>
                </div>

                {/* Sessions this week */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soloTurnosEstaSemana}
                    onChange={(e) => setSoloTurnosEstaSemana(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{t('patients.filters.onlyWithSessionsThisWeek')}</span>
                </label>
              </div>
              <div className="h-[env(safe-area-inset-bottom,0px)]" />
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 space-y-4">
          {/* Desktop: Full filter block */}
          <div className="flex flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('patients.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 pl-8 pr-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer min-w-[140px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>{t('patients.view.cards')}</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span>{t('patients.view.table')}</span>
              </button>
            </div>
          </div>

          {/* Other filters */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="filter-modalidad" className="block text-gray-700 mb-2 text-sm">{t('patients.modality.label')}</label>
              <select
                id="filter-modalidad"
                value={modalidadFilter}
                onChange={(e) => setModalidadFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
              >
                <option value="todas">{t('patients.modality.all')}</option>
                <option value="presencial">{t('patients.modality.presential')}</option>
                <option value="remoto">{t('patients.modality.remote')}</option>
                <option value="mixto">{t('patients.modality.mixed')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-frecuencia" className="block text-gray-700 mb-2 text-sm">{t('patients.frequency.label')}</label>
              <select
                id="filter-frecuencia"
                value={frecuenciaFilter}
                onChange={(e) => setFrecuenciaFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
              >
                <option value="todas">{t('patients.frequency.all')}</option>
                <option value="semanal">{t('patients.frequency.weekly')}</option>
                <option value="quincenal">{t('patients.frequency.biweekly')}</option>
                <option value="mensual">{t('patients.frequency.monthly')}</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloTurnosEstaSemana}
                  onChange={(e) => setSoloTurnosEstaSemana(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700 text-sm">{t('patients.filters.onlyWithSessionsThisWeek')}</span>
              </label>
            </div>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setModalidadFilter('todas');
                  setFrecuenciaFilter('todas');
                  setSoloTurnosEstaSemana(false);
                }}
                className="text-gray-500"
              >
                {t('patients.filters.clearFilters')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Patient Cards / Table */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPacientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('patients.noPatients')}
          description={
            pacientes.length === 0
              ? t('patients.noPatientsDescription')
              : t('patients.noPatientsFilterDescription')
          }
          action={
            pacientes.length === 0
              ? {
                  label: t('patients.addFirstPatient'),
                  onClick: handleNuevoPaciente
                }
              : undefined
          }
        />
      ) : viewMode === 'table' && !isMobile ? (
        // Table View (Desktop only)
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patients.table.patient')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patients.table.age')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patients.table.healthInsurance')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patients.table.modality')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patients.table.nextAppointment')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patients.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedPacientes.map((paciente) => {
                  const proximoTurno = getProximoTurno(paciente.id);
                  const patient = patients.find(p => p.id === paciente.id);
                  
                  return (
                    <tr 
                      key={paciente.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleSelectPatient(paciente.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 text-xs font-semibold">
                              {paciente.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{paciente.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t('patients.fields.ageYears', { age: paciente.edad })}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                          {paciente.coberturaMedica || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${
                          paciente.modalidad === 'remoto'
                            ? 'bg-blue-100 text-blue-700'
                            : paciente.modalidad === 'presencial'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-teal-100 text-teal-700'
                        }`}>
                          {paciente.modalidad === 'remoto' ? (
                            <Video className="w-3 h-3" />
                          ) : (
                            <MapPin className="w-3 h-3" />
                          )}
                          <span>{getModalidadLabel(paciente.modalidad)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {proximoTurno ? (
                          <span className="text-indigo-600 font-medium">
                            {proximoTurno.dias === 0
                              ? t('patients.nextAppointment.today')
                              : proximoTurno.dias === 1
                              ? t('patients.nextAppointment.inOneDay')
                              : t('patients.nextAppointment.inDays', { days: proximoTurno.dias })}
                          </span>
                        ) : (
                          <span className="text-gray-400">{t('patients.nextAppointment.noAppointments')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPatient(patient || null);
                              setPacienteDrawerOpen(true);
                            }}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title={t('patients.actions.editPatient')}
                            aria-label={t('patients.actions.editPatient')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (patient) {
                                handleDeletePaciente(patient.id, paciente.nombre);
                              }
                            }}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('patients.actions.deletePatient')}
                            aria-label={t('patients.actions.deletePatient')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Cards View
        <AnimatedList animation="slide-up" stagger={100} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPacientes.map((paciente) => {
          const proximoTurno = getProximoTurno(paciente.id);
          const patient = patients.find(p => p.id === paciente.id);

          return (
            <div
              key={paciente.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-lg transition-all border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => handleSelectPatient(paciente.id)}
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600">
                      {paciente.nombre.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-gray-900">{paciente.nombre}</h3>
                    <p className="text-gray-500 text-sm">{t('patients.fields.ageYears', { age: paciente.edad })}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPatient(patient || null);
                      setPacienteDrawerOpen(true);
                    }}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title={t('patients.actions.editPatient')}
                    aria-label={t('patients.actions.editPatient')}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (patient) {
                        handleDeletePaciente(patient.id, paciente.nombre);
                      }
                    }}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t('patients.actions.deletePatient')}
                    aria-label={t('patients.actions.deletePatient')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                    paciente.modalidad === 'remoto'
                      ? 'bg-blue-100 text-blue-700'
                      : paciente.modalidad === 'presencial'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-teal-100 text-teal-700'
                  }`}
                >
                  {paciente.modalidad === 'remoto' ? (
                    <Video className="w-3 h-3" />
                  ) : (
                    <MapPin className="w-3 h-3" />
                  )}
                  <span>{getModalidadLabel(paciente.modalidad)}</span>
                </span>

                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                  {getFrecuenciaLabel(paciente.frecuencia)}
                </span>

                {paciente.coberturaMedica && (
                  <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                    {paciente.coberturaMedica}
                  </span>
                )}
              </div>

              {/* Next Appointment */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {proximoTurno ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-gray-600">
                      {t('patients.nextAppointment.nextIn')}{' '}
                      <span className="text-indigo-600">
                        {proximoTurno.dias === 0
                          ? t('patients.nextAppointment.todayLower')
                          : proximoTurno.dias === 1
                          ? t('patients.nextAppointment.oneDayLower')
                          : t('patients.nextAppointment.daysLower', { days: proximoTurno.dias })}
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{t('patients.nextAppointment.noUpcomingAppointments')}</span>
                  </div>
                )}
              </div>
            </div>
          );
          })}
        </AnimatedList>
      )}

      {/* Desktop: Pagination | Mobile: Infinite Scroll */}
      {filteredPacientes.length > 0 && (
        isMobile ? (
          <InfiniteScrollLoader
            isLoading={isLoadingMore}
            hasMore={hasMore}
            loadMoreRef={loadMoreRef}
          />
        ) : (
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPacientes.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )
      )}

      {/* Paciente Drawer */}
      <PacienteDrawer
        isOpen={pacienteDrawerOpen}
        onClose={() => {
          setPacienteDrawerOpen(false);
          setEditingPatient(null);
        }}
        onSave={handleSavePaciente}
        patient={editingPatient}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('patients.messages.deleteConfirmTitle')}
        description={t('patients.messages.deleteConfirmDescription', { name: patientToDelete?.name })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={confirmDeletePaciente}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setPatientToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
}