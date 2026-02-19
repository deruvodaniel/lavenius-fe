import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Video, MapPin, Calendar, Plus, Edit2, Trash2, Users, Search, X, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { FichaClinica } from '../dashboard';
import { PacienteDrawer } from './PacienteDrawer';
import { usePatients, useErrorToast, useResponsive } from '@/lib/hooks';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { SessionStatus } from '@/lib/types/session';
import { AnimatedList, SkeletonCard, EmptyState, ConfirmDialog, SimplePagination, InfiniteScrollLoader } from '../shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CreatePatientDto } from '@/lib/types/api.types';
import type { PatientFilters } from '@/lib/services/patient.service';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const ITEMS_PER_PAGE = 12; // 4 rows of 3 on desktop
const INFINITE_SCROLL_BATCH = 9; // 3 rows of 3

type SortOption = 'name-asc' | 'name-desc' | 'age-asc' | 'age-desc' | 'recent';
type ViewMode = 'cards' | 'table';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
  { value: 'age-asc', label: 'Menor edad' },
  { value: 'age-desc', label: 'Mayor edad' },
  { value: 'recent', label: 'Más reciente' },
];

export function Pacientes() {
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
      toast.error('Error al cargar los detalles del paciente');
    } finally {
      setIsLoadingPatientDetails(false);
    }
  }, [fetchPatientById]);

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
        toast.success('Paciente actualizado exitosamente');
      } else {
        // Create new patient
        await createPatient(patientData);
        toast.success('Paciente creado exitosamente');
      }
      setPacienteDrawerOpen(false);
      setEditingPatient(null);
      // Refresh list
      await fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Error al guardar el paciente');
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
      toast.success('Paciente eliminado exitosamente');
      setDeleteConfirmOpen(false);
      setPatientToDelete(null);
      // Refresh list
      await fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Error al eliminar el paciente');
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

  const getModalidadLabel = (modalidad: string) => {
    switch (modalidad) {
      case 'presencial':
        return 'Presencial';
      case 'remoto':
        return 'Remoto';
      case 'mixto':
        return 'Mixto';
      default:
        return modalidad;
    }
  };

  const getFrecuenciaLabel = (frecuencia: string) => {
    switch (frecuencia) {
      case 'semanal':
        return 'Semanal';
      case 'quincenal':
        return 'Quincenal';
      case 'mensual':
        return 'Mensual';
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
            <p className="text-gray-500">Cargando ficha del paciente...</p>
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            {filteredPacientes.length} paciente{filteredPacientes.length !== 1 ? 's' : ''} 
            {hasActiveFilters ? ' encontrado' + (filteredPacientes.length !== 1 ? 's' : '') : ' registrado' + (filteredPacientes.length !== 1 ? 's' : '')}
          </p>
        </div>
        <button
          onClick={handleNuevoPaciente}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Paciente
        </button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 space-y-4">
        {/* Search bar + Sort + View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre..."
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
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* View toggle - only on desktop */}
          {!isMobile && (
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
                <span>Cards</span>
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
                <span>Tabla</span>
              </button>
            </div>
          )}
        </div>

        {/* Other filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Modalidad Filter */}
          <div>
            <label htmlFor="filter-modalidad" className="block text-gray-700 mb-2 text-sm">Modalidad</label>
            <select
              id="filter-modalidad"
              value={modalidadFilter}
              onChange={(e) => setModalidadFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
            >
              <option value="todas">Todas</option>
              <option value="presencial">Presencial</option>
              <option value="remoto">Remoto</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>

          {/* Frecuencia Filter */}
          <div>
            <label htmlFor="filter-frecuencia" className="block text-gray-700 mb-2 text-sm">Frecuencia</label>
            <select
              id="filter-frecuencia"
              value={frecuenciaFilter}
              onChange={(e) => setFrecuenciaFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
            >
              <option value="todas">Todas</option>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

          {/* This Week Checkbox */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soloTurnosEstaSemana}
                onChange={(e) => setSoloTurnosEstaSemana(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700 text-sm">Solo con turnos esta semana</span>
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
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

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
          title="No hay pacientes"
          description={
            pacientes.length === 0
              ? "Aún no has creado ningún paciente. Comienza agregando tu primer paciente."
              : "No se encontraron pacientes con los filtros aplicados. Intenta ajustar los criterios de búsqueda."
          }
          action={
            pacientes.length === 0
              ? {
                  label: "Crear primer paciente",
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cobertura Médica</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próximo Turno</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
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
                      <td className="px-4 py-3 text-sm text-gray-600">{paciente.edad} años</td>
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
                              ? 'Hoy'
                              : proximoTurno.dias === 1
                              ? 'En 1 día'
                              : `En ${proximoTurno.dias} días`}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin turnos</span>
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
                            title="Editar paciente"
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
                            title="Eliminar paciente"
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
                    <p className="text-gray-500 text-sm">{paciente.edad} años</p>
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
                    title="Editar paciente"
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
                    title="Eliminar paciente"
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
                      Próximo turno en{' '}
                      <span className="text-indigo-600">
                        {proximoTurno.dias === 0
                          ? 'hoy'
                          : proximoTurno.dias === 1
                          ? '1 día'
                          : `${proximoTurno.dias} días`}
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Sin turnos próximos</span>
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
        title="Eliminar paciente"
        description={`¿Estás seguro de que deseas eliminar al paciente ${patientToDelete?.name}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
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