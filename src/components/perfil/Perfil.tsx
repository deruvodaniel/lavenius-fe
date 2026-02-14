import { useState, useEffect } from 'react';
import { User, Camera, Mail, Phone, FileText, Award, Save, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

// ============================================================================
// PROFILE STORAGE
// ============================================================================

const PROFILE_KEY = 'lavenius_profile';

interface ProfileData {
  avatarUrl?: string;
  specialty?: string;
  bio?: string;
  phone?: string;
  alternativePhone?: string;
  officeAddress?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    linkedin?: string;
  };
}

const defaultProfile: ProfileData = {
  avatarUrl: '',
  specialty: '',
  bio: '',
  phone: '',
  alternativePhone: '',
  officeAddress: '',
  website: '',
  socialMedia: {
    instagram: '',
    linkedin: '',
  },
};

const loadProfile = (): ProfileData => {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      return { ...defaultProfile, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
  return defaultProfile;
};

const saveProfile = (profile: ProfileData): void => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

// ============================================================================
// SECTION COMPONENT
// ============================================================================

interface ProfileSectionProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

const ProfileSection = ({ icon: Icon, iconColor, iconBg, title, description, children }: ProfileSectionProps) => (
  <Card className="overflow-hidden bg-white">
    <div className="p-4 sm:p-6 border-b border-gray-100">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-4 sm:p-6">
      {children}
    </div>
  </Card>
);

// ============================================================================
// INPUT COMPONENT
// ============================================================================

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ElementType;
  disabled?: boolean;
}

const InputField = ({ label, value, onChange, placeholder, type = 'text', icon: Icon, disabled }: InputFieldProps) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${Icon ? 'pl-10' : ''}`}
      />
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Perfil() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(loadProfile);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update a profile field and mark as changed
  const updateProfile = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const handleSave = () => {
    setIsSaving(true);
    try {
      saveProfile(profile);
      setHasChanges(false);
      toast.success('Perfil guardado correctamente');
    } catch {
      toast.error('Error al guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to base64 for localStorage storage (in production, use a proper file upload)
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile('avatarUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    updateProfile('avatarUrl', '');
  };

  const initials = user 
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : 'U';

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Mi Perfil</h1>
        <p className="text-sm text-gray-500">Administra tu informacion profesional</p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Avatar & Basic Info */}
        <Card className="overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-700">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                  {profile.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-bold text-white">
                      {initials}
                    </span>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                {profile.avatarUrl && (
                  <button
                    onClick={removeAvatar}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Name & Email */}
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
                </h2>
                <p className="text-indigo-200 text-sm mt-1">{user?.email}</p>
                {profile.specialty && (
                  <p className="text-white/80 text-sm mt-2 flex items-center justify-center sm:justify-start gap-1.5">
                    <Award className="w-4 h-4" />
                    {profile.specialty}
                  </p>
                )}
                {user?.licenseNumber && (
                  <p className="text-indigo-200 text-xs mt-1">
                    Matricula: {user.licenseNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Professional Info */}
        <ProfileSection
          icon={Award}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-100"
          title="Informacion Profesional"
          description="Datos de tu practica profesional"
        >
          <div className="space-y-4">
            <InputField
              label="Especialidad"
              value={profile.specialty || ''}
              onChange={(v) => updateProfile('specialty', v)}
              placeholder="Ej: Psicologo Clinico, Terapeuta Cognitivo-Conductual..."
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Descripcion / Bio</label>
              <textarea
                value={profile.bio || ''}
                onChange={(e) => updateProfile('bio', e.target.value)}
                placeholder="Cuentale a tus pacientes sobre ti, tu enfoque terapeutico y experiencia..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400">{(profile.bio || '').length}/500 caracteres</p>
            </div>
          </div>
        </ProfileSection>

        {/* Contact Info */}
        <ProfileSection
          icon={Phone}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
          title="Informacion de Contacto"
          description="Como pueden contactarte tus pacientes"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Telefono Principal"
              value={profile.phone || ''}
              onChange={(v) => updateProfile('phone', v)}
              placeholder="+54 11 1234-5678"
              type="tel"
              icon={Phone}
            />
            <InputField
              label="Telefono Alternativo"
              value={profile.alternativePhone || ''}
              onChange={(v) => updateProfile('alternativePhone', v)}
              placeholder="+54 11 8765-4321"
              type="tel"
              icon={Phone}
            />
            <InputField
              label="Email"
              value={user?.email || ''}
              onChange={() => {}}
              disabled
              icon={Mail}
            />
            <InputField
              label="Sitio Web"
              value={profile.website || ''}
              onChange={(v) => updateProfile('website', v)}
              placeholder="https://miweb.com"
              type="url"
            />
          </div>
        </ProfileSection>

        {/* Location */}
        <ProfileSection
          icon={FileText}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
          title="Direccion del Consultorio"
          description="Ubicacion donde atiendes a tus pacientes"
        >
          <div className="space-y-4">
            <InputField
              label="Direccion"
              value={profile.officeAddress || ''}
              onChange={(v) => updateProfile('officeAddress', v)}
              placeholder="Av. Corrientes 1234, Piso 5, CABA"
            />
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                <span className="font-medium">Tip:</span> Esta direccion puede compartirse con pacientes para sesiones presenciales.
              </p>
            </div>
          </div>
        </ProfileSection>

        {/* Social Media */}
        <ProfileSection
          icon={User}
          iconColor="text-pink-600"
          iconBg="bg-pink-100"
          title="Redes Sociales"
          description="Tus perfiles profesionales en redes"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Instagram"
              value={profile.socialMedia?.instagram || ''}
              onChange={(v) => updateProfile('socialMedia', { ...profile.socialMedia, instagram: v })}
              placeholder="@mi_consultorio"
            />
            <InputField
              label="LinkedIn"
              value={profile.socialMedia?.linkedin || ''}
              onChange={(v) => updateProfile('socialMedia', { ...profile.socialMedia, linkedin: v })}
              placeholder="linkedin.com/in/mi-perfil"
            />
          </div>
        </ProfileSection>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {hasChanges && (
            <span className="text-sm text-amber-600">Hay cambios sin guardar</span>
          )}
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}
