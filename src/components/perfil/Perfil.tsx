import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Mail, Phone, FileText, Award, X, Copy, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/hooks/useAuth';
import { getNameInitials } from '@/lib/utils/nameInitials';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';

export interface PerfilHandle {
  save: () => Promise<void>;
}

interface PerfilProps {
  onStateChange?: (state: { hasChanges: boolean; isSaving: boolean }) => void;
}

// ============================================================================
// PROFILE STORAGE
// ============================================================================

const PROFILE_KEY = 'lavenius_profile';

interface ProfileData {
  avatarUrl?: string;
  licenseNumber?: string;
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
  licenseNumber: '',
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
  <Card className="overflow-hidden bg-card">
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
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
  id?: string;
}

const InputField = ({ label, value, onChange, placeholder, type = 'text', icon: Icon, disabled, id }: InputFieldProps) => {
  // Generate a stable id from label if not provided
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <Input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-10' : ''}`}
        />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Perfil = forwardRef<PerfilHandle, PerfilProps>(function Perfil({ onStateChange }, ref) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<ProfileData>(() => {
    const stored = loadProfile();
    return {
      ...stored,
      licenseNumber: stored.licenseNumber || user?.licenseNumber || '',
    };
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.({ hasChanges, isSaving });
  }, [hasChanges, isSaving, onStateChange]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveProfile(profile);

      if (clerkUser && profile.licenseNumber !== user?.licenseNumber) {
        await clerkUser.update({
          unsafeMetadata: {
            ...clerkUser.unsafeMetadata,
            licenseNumber: profile.licenseNumber?.trim(),
          },
        });
      }

      setHasChanges(false);
      toast.success(t('profile.messages.saveSuccess'));
    } catch {
      toast.error(t('profile.messages.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await clerkUser?.delete();
      navigate('/login');
    } catch {
      toast.error(t('profile.dangerZone.deleteError'));
      setIsDeleting(false);
    }
  };

  // Expose save to parent (Configuracion) via ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
  }));

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
    ? getNameInitials(`${user.firstName} ${user.lastName || ''}`, 'U')
    : 'U';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Avatar, Basic Info & Share Actions */}
      <Card className="overflow-hidden">
          <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {initials}
                    </span>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
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
                    title={t('profile.avatar.removePhoto')}
                    aria-label={t('profile.avatar.removePhoto')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Name & Email */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
                </h2>
                <p className="text-indigo-200 text-sm mt-0.5">{user?.email}</p>
                {profile.specialty && (
                  <p className="text-white/80 text-sm mt-1.5 flex items-center justify-center sm:justify-start gap-1.5">
                    <Award className="w-4 h-4" />
                    {profile.specialty}
                  </p>
                )}
                {(profile.licenseNumber || user?.licenseNumber) && (
                  <p className="text-indigo-200 text-xs mt-0.5">
                    {t('profile.professional.licenseNumber')}: {profile.licenseNumber || user?.licenseNumber}
                  </p>
                )}
              </div>

              {/* Share Actions (right side) */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/perfil-publico')}
                  className="bg-white/15 hover:bg-white/25 text-white border-0"
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  {t('profile.share.previewTitle')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const url = `https://lavenius.app/p/${user?.firstName?.toLowerCase() || 'tu-nombre'}`;
                    navigator.clipboard.writeText(url);
                    toast.success(t('profile.share.copied'));
                  }}
                  className="bg-white/10 hover:bg-white/20 text-indigo-200 border-0"
                >
                  <Copy className="w-4 h-4 mr-1.5" />
                  {t('profile.share.copyLink')}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Professional Info */}
        <ProfileSection
          icon={Award}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-100"
          title={t('profile.professional.title')}
          description={t('profile.professional.description')}
        >
          <div className="space-y-4">
            <InputField
              label={t('profile.professional.licenseNumber')}
              value={profile.licenseNumber || ''}
              onChange={(v) => updateProfile('licenseNumber', v)}
              placeholder={t('profile.professional.licenseNumberPlaceholder')}
              icon={Award}
              id="profile-license"
            />
            <InputField
              label={t('profile.professional.specialty')}
              value={profile.specialty || ''}
              onChange={(v) => updateProfile('specialty', v)}
              placeholder={t('profile.professional.specialtyPlaceholder')}
            />
            <div className="space-y-1.5">
              <label htmlFor="profile-bio" className="block text-sm font-medium text-foreground">{t('profile.professional.bio')}</label>
              <Textarea
                id="profile-bio"
                value={profile.bio || ''}
                onChange={(e) => updateProfile('bio', e.target.value)}
                placeholder={t('profile.professional.bioPlaceholder')}
                rows={4}
                className="w-full resize-none"
              />
              <p className="text-xs text-muted-foreground">{(profile.bio || '').length}/500 {t('profile.professional.characters')}</p>
            </div>
          </div>
        </ProfileSection>

        {/* Contact, Location & Social Media */}
        <ProfileSection
          icon={Phone}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
          title={t('profile.contact.title')}
          description={t('profile.contact.description')}
        >
          <div className="space-y-6">
            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label={t('profile.contact.primaryPhone')}
                value={profile.phone || ''}
                onChange={(v) => updateProfile('phone', v)}
                placeholder="+54 11 1234-5678"
                type="tel"
                icon={Phone}
              />
              <InputField
                label={t('profile.contact.alternativePhone')}
                value={profile.alternativePhone || ''}
                onChange={(v) => updateProfile('alternativePhone', v)}
                placeholder="+54 11 8765-4321"
                type="tel"
                icon={Phone}
              />
              <InputField
                label={t('profile.contact.email')}
                value={user?.email || ''}
                onChange={() => {}}
                disabled
                icon={Mail}
              />
              <InputField
                label={t('profile.contact.website')}
                value={profile.website || ''}
                onChange={(v) => updateProfile('website', v)}
                placeholder="https://miweb.com"
                type="url"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Location */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                {t('profile.location.title')}
              </h3>
              <InputField
                label={t('profile.location.address')}
                value={profile.officeAddress || ''}
                onChange={(v) => updateProfile('officeAddress', v)}
                placeholder="Av. Corrientes 1234, Piso 5, CABA"
              />
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  {t('profile.location.tip')}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Social Media */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-pink-500" />
                {t('profile.social.title')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label={t('profile.social.instagram')}
                  value={profile.socialMedia?.instagram || ''}
                  onChange={(v) => updateProfile('socialMedia', { ...profile.socialMedia, instagram: v })}
                  placeholder="@mi_consultorio"
                />
                <InputField
                  label={t('profile.social.linkedin')}
                  value={profile.socialMedia?.linkedin || ''}
                  onChange={(v) => updateProfile('socialMedia', { ...profile.socialMedia, linkedin: v })}
                  placeholder="linkedin.com/in/mi-perfil"
                />
              </div>
            </div>
          </div>
        </ProfileSection>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-200 dark:border-red-900/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/50">
          <div className="w-9 h-9 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-700 dark:text-red-400">
              {t('profile.dangerZone.title')}
            </h2>
            <p className="text-xs text-red-600/80 dark:text-red-500 mt-0.5">
              {t('profile.dangerZone.description')}
            </p>
          </div>
        </div>

        {/* Delete Account Row */}
        <div className="px-4 sm:px-6 py-4 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">{t('profile.dangerZone.deleteAccount')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('profile.dangerZone.deleteAccountDescription')}</p>
          </div>
          <button
            onClick={() => {
              setDeleteConfirmInput('');
              setShowDeleteDialog(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            {t('profile.dangerZone.deleteAccount')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-red-700 dark:text-red-400">
                {t('profile.dangerZone.confirmTitle')}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {t('profile.dangerZone.confirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Type-to-confirm */}
          <div className="space-y-2 py-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t('profile.dangerZone.typeToConfirm')}
            </label>
            <Input
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder={t('profile.dangerZone.confirmWord')}
              className="font-mono border-red-200 dark:border-red-900 focus-visible:ring-red-500/30"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setShowDeleteDialog(false)}
            >
              {t('profile.dangerZone.cancelButton')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteConfirmInput !== t('profile.dangerZone.confirmWord') || isDeleting}
              onClick={handleDeleteAccount}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('profile.dangerZone.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t('profile.dangerZone.confirmButton')}
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
