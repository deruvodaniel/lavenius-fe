import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Heart, Video, MapPin, Calendar, AlertCircle } from 'lucide-react';
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

// Validation helpers
const validateEmail = (email: string): boolean => {
  if (!email) return true; // Optional field
  // More strict email validation:
  // - At least 2 chars before @
  // - Valid domain with at least 2 chars
  // - TLD with 2-10 chars (covers .com, .ar, .info, etc.)
  const emailRegex = /^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // Optional field
  // Allow digits, spaces, +, -, (, )
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

export function PacienteDrawer({ isOpen, onClose, onSave, patient }: PacienteDrawerProps) {
  const [formData, setFormData] = useState({
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

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Load patient data when editing
  useEffect(() => {
    if (patient) {
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

      setFormData({
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
      });
      setErrors({});
      setTouched({});
    } else {
      // Reset form for new patient
      setFormData({
        nombre: '',
        apellido: '',
        edad: '',
        telefono: '',
        email: '',
        coberturaMedica: '',
        tipoSesion: 'presential',
        frecuencia: 'semanal',
        frecuenciaOtra: '',
        diagnostico: '',
        tratamientoActual: '',
        observaciones: '',
      });
      setErrors({});
      setTouched({});
    }
  }, [patient, isOpen]);

  // Validate field on change
  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'nombre':
        return !validateName(value) ? 'El nombre es requerido (mínimo 2 caracteres)' : undefined;
      case 'apellido':
        return !value.trim() ? 'El apellido es requerido' : undefined;
      case 'email':
        return !validateEmail(value) ? 'Email inválido' : undefined;
      case 'telefono':
        return !validatePhone(value) ? 'Teléfono inválido (mínimo 8 dígitos)' : undefined;
      case 'edad':
        return !validateAge(value) ? 'Edad inválida (0-120)' : undefined;
      case 'frecuenciaOtra':
        return formData.frecuencia === 'otra' && !value.trim() ? 'Especifica la frecuencia' : undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Validate on change if field was touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field as keyof typeof formData] as string);
    setErrors({ ...errors, [field]: error });
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      nombre: validateField('nombre', formData.nombre),
      apellido: validateField('apellido', formData.apellido),
      email: validateField('email', formData.email),
      telefono: validateField('telefono', formData.telefono),
      edad: validateField('edad', formData.edad),
      frecuenciaOtra: validateField('frecuenciaOtra', formData.frecuenciaOtra),
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

  if (!isOpen) return null;

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

  const InputError = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-1.5 mt-1.5 text-red-600">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-xs">{error}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex !top-0 !mt-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-full md:max-w-2xl bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl">{patient ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
            <button
              onClick={handleClose}
              className="text-indigo-200 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-indigo-800 text-sm">
              Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
            </p>
          </div>

          {/* Información Personal */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Información Personal
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleFieldChange('nombre', e.target.value)}
                  onBlur={() => handleFieldBlur('nombre')}
                  placeholder="Ej: Juan"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.nombre && touched.nombre ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <InputError error={touched.nombre ? errors.nombre : undefined} />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => handleFieldChange('apellido', e.target.value)}
                  onBlur={() => handleFieldBlur('apellido')}
                  placeholder="Ej: Pérez"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.apellido && touched.apellido ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <InputError error={touched.apellido ? errors.apellido : undefined} />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Edad</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.edad}
                  onChange={(e) => handleFieldChange('edad', e.target.value)}
                  onBlur={() => handleFieldBlur('edad')}
                  placeholder="Ej: 30"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.edad && touched.edad ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <InputError error={touched.edad ? errors.edad : undefined} />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleFieldChange('telefono', e.target.value)}
                  onBlur={() => handleFieldBlur('telefono')}
                  placeholder="+54 11 1234-5678"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.telefono && touched.telefono ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <InputError error={touched.telefono ? errors.telefono : undefined} />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  placeholder="ejemplo@email.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.email && touched.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <InputError error={touched.email ? errors.email : undefined} />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <Heart className="w-4 h-4" />
                  Cobertura Médica
                </label>
                <input
                  type="text"
                  value={formData.coberturaMedica}
                  onChange={(e) => setFormData({ ...formData, coberturaMedica: e.target.value })}
                  placeholder="Ej: OSDE, Swiss Medical, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Modalidad y Frecuencia */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Modalidad de Tratamiento
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Tipo de Sesión</label>
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
                    <span className="text-sm">Presencial</span>
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
                    <span className="text-sm">Remoto</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-3">Frecuencia</label>
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
                        {freq === 'semanal' && 'Semanal'}
                        {freq === 'quincenal' && 'Quincenal'}
                        {freq === 'mensual' && 'Mensual'}
                        {freq === 'otra' && 'Otra'}
                      </span>
                    </label>
                  ))}
                  
                  {/* Custom frequency input */}
                  {formData.frecuencia === 'otra' && (
                    <div className="ml-7 mt-2">
                      <input
                        type="text"
                        value={formData.frecuenciaOtra}
                        onChange={(e) => handleFieldChange('frecuenciaOtra', e.target.value)}
                        onBlur={() => handleFieldBlur('frecuenciaOtra')}
                        placeholder="Especificar frecuencia (ej: cada 3 semanas)"
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

          {/* Historia Clínica */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">Historia Clínica</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Diagnóstico</label>
                <textarea
                  value={formData.diagnostico}
                  onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                  placeholder="Diagnóstico principal..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Tratamiento Actual</label>
                <textarea
                  value={formData.tratamientoActual}
                  onChange={(e) => setFormData({ ...formData, tratamientoActual: e.target.value })}
                  placeholder="Plan de tratamiento..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Observaciones clínicas adicionales..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className={`flex-1 py-3 rounded-lg transition-colors ${
                isFormValid
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!isFormValid}
            >
              {patient ? 'Actualizar' : 'Crear Paciente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
