import { useState, useCallback, useMemo } from 'react';
import { User, Phone, Mail, Heart, Video, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { BaseDrawer, DrawerBody, DrawerFooter } from '../shared/BaseDrawer';
import { Button } from '../ui/button';
import type { CreatePatientDto, Patient, SessionType } from '../../lib/types/api.types';

type PatientSessionType = 'remote' | 'presential';
type Frecuencia = 'semanal' | 'quincenal' | 'mensual' | 'otra';

interface ValidationErrors {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  edad?: string;
  frecuenciaOtra?: string;
}

interface PacienteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: CreatePatientDto) => void;
  patient?: Patient | null;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const validateEmail = (email: string): boolean => {
  if (!email) return true; // Optional field
  const emailRegex = /^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[\d\s+\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
};

const validateAge = (age: string): boolean => {
  if (!age) return true; // Optional field
  const ageNum = parseInt(age, 10);
  return !isNaN(ageNum) && ageNum >= 0 && ageNum <= 120;
};

const validateName = (name: string): boolean => {
  if (!name) return false; // Required field
  return name.trim().length >= 2;
};

// ============================================================================
// INPUT ERROR COMPONENT (defined outside main component)
// ============================================================================

interface InputErrorProps {
  error?: string;
}

function InputError({ error }: InputErrorProps) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-red-600">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-xs">{error}</span>
    </div>
  );
}

// ============================================================================
// INITIAL FORM STATE
// ============================================================================

const getInitialFormData = () => ({
  nombre: '',
  apellido: '',
  edad: '',
  telefono: '',
  email: '',
  coberturaMedica: '',
  tipoSesion: 'presential' as PatientSessionType,
  frecuencia: 'semanal' as Frecuencia,
  frecuenciaOtra: '',
  diagnostico: '',
  tratamientoActual: '',
  observaciones: '',
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * PacienteDrawer Component
 * Modal drawer for creating/editing patients
 * 
 * Features:
 * - Focus trap for keyboard navigation
 * - ESC key to close
 * - Form validation with error messages
 * - Accessible with proper ARIA attributes
 */
export function PacienteDrawer({ isOpen, onClose, onSave, patient }: PacienteDrawerProps) {
  // Use a key to reset the form when the drawer opens with different patient
  // This is the React-recommended pattern for resetting state on prop change
  const formKey = isOpen ? `open-${patient?.id ?? 'new'}` : 'closed';
  
  return (
    <PacienteDrawerForm
      key={formKey}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      patient={patient}
    />
  );
}

/**
 * Inner form component - gets remounted when key changes, naturally resetting state
 */
function PacienteDrawerForm({ isOpen, onClose, onSave, patient }: PacienteDrawerProps) {
  const { t } = useTranslation();
  
  // Compute initial form data from patient prop
  const initialFormData = useMemo(() => {
    if (!patient) return getInitialFormData();
    
    // Map frequency to our radio options
    let frecuencia: Frecuencia = 'semanal';
    let frecuenciaOtra = '';
    
    if (patient.frequency) {
      const freq = patient.frequency.toLowerCase();
      if (freq === 'semanal' || freq === 'quincenal' || freq === 'mensual') {
        frecuencia = freq;
      } else {
        frecuencia = 'otra';
        frecuenciaOtra = patient.frequency;
      }
    }
    
    return {
      nombre: patient.firstName || '',
      apellido: patient.lastName || '',
      edad: patient.age?.toString() || '',
      telefono: patient.phone || '',
      email: patient.email || '',
      coberturaMedica: patient.healthInsurance || '',
      tipoSesion: (patient.sessionType as PatientSessionType) || 'presential',
      frecuencia,
      frecuenciaOtra,
      diagnostico: patient.diagnosis || '',
      tratamientoActual: patient.currentTreatment || '',
      observaciones: patient.observations || '',
    };
  }, [patient]);
  
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate field function - memoized to be used in effects
  const validateField = useCallback((field: string, value: string, currentFormData: typeof formData): string | undefined => {
    switch (field) {
      case 'nombre':
        return !validateName(value) ? t('patients.drawer.validation.firstNameRequired') : undefined;
      case 'apellido':
        return !value.trim() ? t('patients.drawer.validation.lastNameRequired') : undefined;
      case 'email':
        return !validateEmail(value) ? t('patients.drawer.validation.invalidEmail') : undefined;
      case 'telefono':
        return !validatePhone(value) ? t('patients.drawer.validation.invalidPhone') : undefined;
      case 'edad':
        return !validateAge(value) ? t('patients.drawer.validation.invalidAge') : undefined;
      case 'frecuenciaOtra':
        return currentFormData.frecuencia === 'otra' && !value.trim() ? t('patients.drawer.validation.specifyFrequency') : undefined;
      default:
        return undefined;
    }
  }, [t]);

  const handleFieldChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Validate on change if field was touched
    if (touched[field]) {
      const error = validateField(field, value, newFormData);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData] as string, formData);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      nombre: validateField('nombre', formData.nombre, formData),
      apellido: validateField('apellido', formData.apellido, formData),
      email: validateField('email', formData.email, formData),
      telefono: validateField('telefono', formData.telefono, formData),
      edad: validateField('edad', formData.edad, formData),
      frecuenciaOtra: validateField('frecuenciaOtra', formData.frecuenciaOtra, formData),
    };

    setErrors(newErrors);
    setTouched({
      nombre: true,
      apellido: true,
      email: true,
      telefono: true,
      edad: true,
      frecuenciaOtra: true,
    });

    return !Object.values(newErrors).some(error => error);
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    // Determine final frequency value
    const frequency = formData.frecuencia === 'otra' 
      ? formData.frecuenciaOtra 
      : formData.frecuencia;

    const patientDto: CreatePatientDto = {
      firstName: formData.nombre.trim(),
      lastName: formData.apellido.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.telefono.trim() || undefined,
      age: formData.edad ? Number(formData.edad) : undefined,
      healthInsurance: formData.coberturaMedica.trim() || undefined,
      sessionType: formData.tipoSesion as SessionType,
      frequency: frequency || undefined,
      diagnosis: formData.diagnostico.trim() || undefined,
      currentTreatment: formData.tratamientoActual.trim() || undefined,
      observations: formData.observaciones.trim() || undefined,
    };

    onSave(patientDto);
  };

  const handleClose = () => {
    setErrors({});
    setTouched({});
    onClose();
  };

  const isFormValid = formData.nombre.trim() && formData.apellido.trim() && 
    !errors.nombre && !errors.apellido && !errors.email && !errors.telefono && !errors.edad &&
    (formData.frecuencia !== 'otra' || formData.frecuenciaOtra.trim());

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title={patient ? t('patients.editPatient') : t('patients.newPatient')}
      icon={User}
      maxWidth="md:max-w-2xl"
      closeLabel={t('patients.drawer.closePanel')}
      titleId="paciente-drawer-title"
      initialFocus="#paciente-nombre"
    >
      <DrawerBody>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-indigo-800 text-sm">
            <Trans i18nKey="patients.drawer.requiredFieldsNote">
              Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
            </Trans>
          </p>
        </div>

        {/* Personal Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            {t('patients.drawer.sections.personalInfo')}
          </h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="paciente-nombre" className="block text-gray-700 mb-2">
                {t('patients.fields.firstName')} <span className="text-red-500">*</span>
              </label>
              <input
                id="paciente-nombre"
                type="text"
                value={formData.nombre}
                onChange={(e) => handleFieldChange('nombre', e.target.value)}
                onBlur={() => handleFieldBlur('nombre')}
                placeholder={t('patients.drawer.placeholders.firstName')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.nombre && touched.nombre ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <InputError error={touched.nombre ? errors.nombre : undefined} />
            </div>

            <div>
              <label htmlFor="paciente-apellido" className="block text-gray-700 mb-2">
                {t('patients.fields.lastName')} <span className="text-red-500">*</span>
              </label>
              <input
                id="paciente-apellido"
                type="text"
                value={formData.apellido}
                onChange={(e) => handleFieldChange('apellido', e.target.value)}
                onBlur={() => handleFieldBlur('apellido')}
                placeholder={t('patients.drawer.placeholders.lastName')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.apellido && touched.apellido ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <InputError error={touched.apellido ? errors.apellido : undefined} />
            </div>

            <div>
              <label htmlFor="paciente-edad" className="block text-gray-700 mb-2">{t('patients.fields.age')}</label>
              <input
                id="paciente-edad"
                type="number"
                min="0"
                max="120"
                value={formData.edad}
                onChange={(e) => handleFieldChange('edad', e.target.value)}
                onBlur={() => handleFieldBlur('edad')}
                placeholder={t('patients.drawer.placeholders.age')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.edad && touched.edad ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <InputError error={touched.edad ? errors.edad : undefined} />
            </div>

            <div>
              <label htmlFor="paciente-telefono" className="flex items-center gap-2 text-gray-700 mb-2">
                <Phone className="w-4 h-4" />
                {t('patients.fields.phone')}
              </label>
              <input
                id="paciente-telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleFieldChange('telefono', e.target.value)}
                onBlur={() => handleFieldBlur('telefono')}
                placeholder={t('patients.drawer.placeholders.phone')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.telefono && touched.telefono ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <InputError error={touched.telefono ? errors.telefono : undefined} />
            </div>

            <div>
              <label htmlFor="paciente-email" className="flex items-center gap-2 text-gray-700 mb-2">
                <Mail className="w-4 h-4" />
                {t('patients.fields.email')}
              </label>
              <input
                id="paciente-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                placeholder={t('patients.drawer.placeholders.email')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.email && touched.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <InputError error={touched.email ? errors.email : undefined} />
            </div>

            <div>
              <label htmlFor="paciente-cobertura" className="flex items-center gap-2 text-gray-700 mb-2">
                <Heart className="w-4 h-4" />
                {t('patients.fields.healthInsurance')}
              </label>
              <input
                id="paciente-cobertura"
                type="text"
                value={formData.coberturaMedica}
                onChange={(e) => setFormData({ ...formData, coberturaMedica: e.target.value })}
                placeholder={t('patients.drawer.placeholders.healthInsurance')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Treatment Modality */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            {t('patients.drawer.sections.treatmentModality')}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">{t('patients.fields.sessionType')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipoSesion: 'presential' })}
                  className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    formData.tipoSesion === 'presential'
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-300 text-gray-700 hover:border-purple-300'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">{t('patients.modality.presential')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipoSesion: 'remote' })}
                  className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    formData.tipoSesion === 'remote'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <Video className="w-5 h-5" />
                  <span className="text-sm">{t('patients.modality.remote')}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-3">{t('patients.fields.frequency')}</label>
              <div className="space-y-2">
                {(['semanal', 'quincenal', 'mensual', 'otra'] as const).map((freq) => (
                  <label
                    key={freq}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.frecuencia === freq
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="frecuencia"
                      value={freq}
                      checked={formData.frecuencia === freq}
                      onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value as Frecuencia })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className={`text-sm font-medium ${formData.frecuencia === freq ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {freq === 'semanal' && t('patients.frequency.weekly')}
                      {freq === 'quincenal' && t('patients.frequency.biweekly')}
                      {freq === 'mensual' && t('patients.frequency.monthly')}
                      {freq === 'otra' && t('patients.frequency.other')}
                    </span>
                  </label>
                ))}
                
                {/* Custom frequency input */}
                {formData.frecuencia === 'otra' && (
                  <div className="ml-7 mt-2">
                    <label htmlFor="paciente-frecuencia-otra" className="sr-only">
                      {t('patients.drawer.validation.specifyFrequency')}
                    </label>
                    <input
                      id="paciente-frecuencia-otra"
                      type="text"
                      value={formData.frecuenciaOtra}
                      onChange={(e) => handleFieldChange('frecuenciaOtra', e.target.value)}
                      onBlur={() => handleFieldBlur('frecuenciaOtra')}
                      placeholder={t('patients.drawer.placeholders.customFrequency')}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                        errors.frecuenciaOtra && touched.frecuenciaOtra ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <InputError error={touched.frecuenciaOtra ? errors.frecuenciaOtra : undefined} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical History */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-gray-900 mb-4">{t('patients.drawer.sections.clinicalHistory')}</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="paciente-diagnostico" className="block text-gray-700 mb-2">{t('patients.fields.diagnosis')}</label>
              <textarea
                id="paciente-diagnostico"
                value={formData.diagnostico}
                onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                placeholder={t('patients.drawer.placeholders.diagnosis')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div>
              <label htmlFor="paciente-tratamiento" className="block text-gray-700 mb-2">{t('patients.fields.currentTreatment')}</label>
              <textarea
                id="paciente-tratamiento"
                value={formData.tratamientoActual}
                onChange={(e) => setFormData({ ...formData, tratamientoActual: e.target.value })}
                placeholder={t('patients.drawer.placeholders.currentTreatment')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div>
              <label htmlFor="paciente-observaciones" className="block text-gray-700 mb-2">{t('patients.fields.observations')}</label>
              <textarea
                id="paciente-observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder={t('patients.drawer.placeholders.observations')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
        </div>
      </DrawerBody>

      <DrawerFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          className="flex-1"
        >
          {t('patients.drawer.buttons.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          className={`flex-1 ${
            isFormValid
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!isFormValid}
        >
          {patient ? t('patients.drawer.buttons.update') : t('patients.drawer.buttons.create')}
        </Button>
      </DrawerFooter>
    </BaseDrawer>
  );
}
