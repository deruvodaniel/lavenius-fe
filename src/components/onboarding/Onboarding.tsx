import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { 
  Award, 
  Stethoscope, 
  Phone,
  Loader2,
  CheckCircle2,
  MapPin,
  Globe,
  Instagram,
  Linkedin,
  FileText,
  ArrowLeft,
  ArrowRight,
  PartyPopper,
  Copy,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/components/ui/utils';
import { onboardingService } from '@/lib/services';
import { BetaBadge } from '@/components/shared';
import { useE2EKey } from '@/lib/e2e';
import {
  generateRecoverySecret,
  generateUserKey,
  wrapUserKey,
  wrapUserKeyForRecovery,
} from '@/lib/e2e/crypto';
import type { ClerkUserSyncDto, OnboardingExtraData } from '@/lib/types/api.types';

/**
 * List of common therapy specialties
 */
const SPECIALTIES = [
  'clinical_psychology',
  'cognitive_behavioral',
  'psychoanalysis',
  'family_therapy',
  'child_psychology',
  'neuropsychology',
  'sports_psychology',
  'organizational_psychology',
  'forensic_psychology',
  'health_psychology',
  'educational_psychology',
  'other',
] as const;

type Specialty = typeof SPECIALTIES[number];

/**
 * Onboarding form data with all profile fields
 */
interface OnboardingFormData {
  // Step 1: Professional Info
  licenseNumber: string;
  specialty: Specialty | '';
  // Step 2: Contact Info
  phone: string;
  alternativePhone: string;
  officeAddress: string;
  // Step 3: Online Presence
  website: string;
  instagram: string;
  linkedin: string;
  bio: string;
  // Step 4: E2E setup
  passphrase: string;
  confirmPassphrase: string;
  recoveryAcknowledged: boolean;
}

type StepKey = 'professional' | 'contact' | 'online' | 'complete';

interface StepConfig {
  key: StepKey;
  icon: React.ElementType;
  titleKey: string;
  descriptionKey: string;
  canSkip: boolean;
}

const STEPS: StepConfig[] = [
  {
    key: 'professional',
    icon: Award,
    titleKey: 'onboarding.stepper.professional.title',
    descriptionKey: 'onboarding.stepper.professional.description',
    canSkip: false, // Required step
  },
  {
    key: 'contact',
    icon: Phone,
    titleKey: 'onboarding.stepper.contact.title',
    descriptionKey: 'onboarding.stepper.contact.description',
    canSkip: true,
  },
  {
    key: 'online',
    icon: Globe,
    titleKey: 'onboarding.stepper.online.title',
    descriptionKey: 'onboarding.stepper.online.description',
    canSkip: true,
  },
  {
    key: 'complete',
    icon: PartyPopper,
    titleKey: 'onboarding.stepper.complete.title',
    descriptionKey: 'onboarding.stepper.complete.description',
    canSkip: false,
  },
];

const TOTAL_STEPS = STEPS.length;

/**
 * Multi-step onboarding page component for new Clerk users
 * Collects professional information after sign-up
 */
export function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { setKeyFromOnboarding } = useE2EKey();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>({
    licenseNumber: '',
    specialty: '',
    phone: '',
    alternativePhone: '',
    officeAddress: '',
    website: '',
    instagram: '',
    linkedin: '',
    bio: '',
    passphrase: '',
    confirmPassphrase: '',
    recoveryAcknowledged: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData, string>>>({});
  const [recoverySecret, setRecoverySecret] = useState('');
  const [copiedRecoveryCode, setCopiedRecoveryCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passphraseTouched, setPassphraseTouched] = useState(false);
  const [confirmPassphraseTouched, setConfirmPassphraseTouched] = useState(false);
  const [isPassphraseFocused, setIsPassphraseFocused] = useState(false);
  const [isConfirmPassphraseFocused, setIsConfirmPassphraseFocused] = useState(false);

  // Progress percentage
  const progressPercentage = useMemo(() => {
    return ((currentStep + 1) / TOTAL_STEPS) * 100;
  }, [currentStep]);

  // Current step config
  const stepConfig = STEPS[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFirstStep = currentStep === 0;
  const hasPassphraseInput = formData.passphrase.length > 0;
  const hasConfirmPassphraseInput = formData.confirmPassphrase.length > 0;
  const isPassphraseTooShort = hasPassphraseInput && formData.passphrase.length < 8;
  const isPassphraseMismatch =
    hasConfirmPassphraseInput && formData.confirmPassphrase !== formData.passphrase;
  const isPassphraseReady =
    formData.passphrase.length >= 8 &&
    formData.confirmPassphrase === formData.passphrase;

  // Show loading while Clerk loads user data
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Redirect if no user (shouldn't happen, but safety check)
  if (!user) {
    navigate('/');
    return null;
  }

  // Check if onboarding is already complete
  const isOnboardingComplete = user.unsafeMetadata?.onboardingComplete === true;
  if (isOnboardingComplete) {
    navigate('/dashboard');
    return null;
  }

  const validateCurrentStep = (): boolean => {
    const newErrors: Partial<Record<keyof OnboardingFormData, string>> = {};

    if (currentStep === 0) {
      // Step 1: Professional Info - License number required
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = t('onboarding.stepper.validation.licenseRequired');
      } else if (formData.licenseNumber.trim().length < 3) {
        newErrors.licenseNumber = t('onboarding.stepper.validation.licenseMinLength');
      }
    }

    if (currentStep === 1) {
      // Step 2: Contact Info - Phone validation (optional but must be valid if provided)
      if (formData.phone && formData.phone.trim().length > 0) {
        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (phoneDigits.length < 8) {
          newErrors.phone = t('onboarding.stepper.validation.phoneInvalid');
        }
      }
      if (formData.alternativePhone && formData.alternativePhone.trim().length > 0) {
        const phoneDigits = formData.alternativePhone.replace(/\D/g, '');
        if (phoneDigits.length < 8) {
          newErrors.alternativePhone = t('onboarding.stepper.validation.phoneInvalid');
        }
      }
    }

    if (currentStep === 2) {
      // Step 3: Online Presence - Website validation (optional but must be valid if provided)
      if (formData.website && formData.website.trim().length > 0) {
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        if (!urlPattern.test(formData.website.trim())) {
          newErrors.website = t('onboarding.stepper.validation.websiteInvalid');
        }
      }
      // Bio max length
      if (formData.bio && formData.bio.length > 500) {
        newErrors.bio = t('onboarding.stepper.validation.bioTooLong');
      }
    }

    if (currentStep === 3) {
      if (formData.passphrase.length < 8) {
        newErrors.passphrase = t('onboarding.stepper.validation.passphraseMinLength', { count: 8 });
      }

      if (formData.confirmPassphrase !== formData.passphrase) {
        newErrors.confirmPassphrase = t('onboarding.stepper.validation.passphraseMismatch');
      }

      if (!formData.recoveryAcknowledged) {
        newErrors.recoveryAcknowledged = t('onboarding.stepper.validation.recoveryAcknowledged');
      }

      if (!recoverySecret) {
        newErrors.recoveryAcknowledged = t('onboarding.stepper.validation.recoveryCodeUnavailable');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Validate required data from Clerk
      const email = user.primaryEmailAddress?.emailAddress;
      if (!email) {
        console.warn('Cannot sync with backend: missing email from Clerk');
        toast.error(t('onboarding.stepper.error'));
        setIsSubmitting(false);
        return;
      }

      const userKey = generateUserKey();
      const passphraseBundle = await wrapUserKey(userKey, formData.passphrase);
      const recoveryBundle = await wrapUserKeyForRecovery(userKey, recoverySecret);

      // 2. Prepare data for backend (only fields it accepts)
      const backendData: ClerkUserSyncDto = {
        clerkUserId: user.id,
        externalId: user.id,
        email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: formData.phone.trim() || undefined,
        licenseNumber: formData.licenseNumber.trim() || undefined,
        encryptedUserKey: passphraseBundle.encryptedUserKey,
        salt: passphraseBundle.salt,
        iv: passphraseBundle.iv,
        recoveryEncryptedUserKey: recoveryBundle.recoveryEncryptedUserKey,
        recoverySalt: recoveryBundle.recoverySalt,
        recoveryIv: recoveryBundle.recoveryIv,
        recoveryEnabled: true,
        userKeyBundleVersion: 1,
      };

      // 3. Prepare extra data for localStorage (fields backend doesn't accept)
      const extraData: OnboardingExtraData = {
        specialty: formData.specialty || undefined,
        alternativePhone: formData.alternativePhone.trim() || undefined,
        officeAddress: formData.officeAddress.trim() || undefined,
        website: formData.website.trim() || undefined,
        socialMedia: {
          instagram: formData.instagram.trim() || undefined,
          linkedin: formData.linkedin.trim() || undefined,
        },
        bio: formData.bio.trim() || undefined,
      };

      // 4. Sync with backend using the service layer
      const syncResult = await onboardingService.syncUserWithBackend(backendData);
      if (syncResult.success) {
        if (import.meta.env.DEV) {
          console.log(syncResult.alreadyExists 
            ? 'User already registered in backend' 
            : 'User registered with backend successfully'
          );
        }
      } else {
        console.warn('Backend registration failed during onboarding:', syncResult.error);
        toast.error(t('onboarding.stepper.registerError'));
        setIsSubmitting(false);
        return;
      }

      // 5. Save extra data to localStorage (user-scoped)
      onboardingService.saveExtraData(user.id, extraData);

      // 6. Keep E2E key in memory for current session (no local persistence).
      setKeyFromOnboarding(userKey, 1);

      // 7. Update Clerk user metadata with all profile data
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          licenseNumber: formData.licenseNumber.trim(),
          specialty: formData.specialty || undefined,
          phone: formData.phone.trim() || undefined,
          alternativePhone: formData.alternativePhone.trim() || undefined,
          officeAddress: formData.officeAddress.trim() || undefined,
          website: formData.website.trim() || undefined,
          socialMedia: {
            instagram: formData.instagram.trim() || undefined,
            linkedin: formData.linkedin.trim() || undefined,
          },
          bio: formData.bio.trim() || undefined,
          onboardingComplete: true,
          onboardingCompletedAt: new Date().toISOString(),
        },
      });

      toast.success(t('onboarding.stepper.success'));
      
      // Small delay for user to see success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast.error(t('onboarding.stepper.error'));
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => {
      const nextState = { ...prev, [field]: value };
      if (field === 'passphrase' || field === 'confirmPassphrase') {
        nextState.recoveryAcknowledged = false;
      }
      return nextState;
    });

    if (field === 'passphrase' || field === 'confirmPassphrase') {
      setRecoverySecret('');
      setCopiedRecoveryCode(false);
    }

    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleGenerateRecoveryCode = () => {
    if (!isPassphraseReady) return;
    setRecoverySecret(generateRecoverySecret());
    setCopiedRecoveryCode(false);
    setFormData((prev) => ({ ...prev, recoveryAcknowledged: false }));
    if (errors.recoveryAcknowledged) {
      setErrors((prev) => ({ ...prev, recoveryAcknowledged: undefined }));
    }
  };

  const handleCopyRecoveryCode = async () => {
    if (!recoverySecret) return;

    try {
      await navigator.clipboard.writeText(recoverySecret);
      setCopiedRecoveryCode(true);
      setTimeout(() => setCopiedRecoveryCode(false), 2000);
    } catch {
      toast.error(t('onboarding.stepper.recovery.copyError'));
    }
  };

  const handleDownloadRecoveryCode = () => {
    if (!recoverySecret) return;

    const content = [
      t('onboarding.stepper.recovery.fileTitle'),
      '',
      recoverySecret,
      '',
      t('onboarding.stepper.recovery.fileWarning'),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'lavenius-recovery-phrase.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderProfessionalStep();
      case 1:
        return renderContactStep();
      case 2:
        return renderOnlineStep();
      case 3:
        return renderCompleteStep();
      default:
        return null;
    }
  };

  const renderProfessionalStep = () => (
    <div className="space-y-5">
      {/* License Number - Required */}
      <div className="space-y-2">
        <Label htmlFor="licenseNumber" className="flex items-center gap-2 text-foreground">
          <Award className="w-4 h-4 text-indigo-600" />
          {t('onboarding.stepper.fields.licenseNumber')}
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="licenseNumber"
          type="text"
          inputMode="numeric"
          value={formData.licenseNumber}
          onChange={(e) => handleInputChange('licenseNumber', e.target.value.replace(/\D/g, ''))}
          placeholder={t('onboarding.stepper.placeholders.licenseNumber')}
          aria-invalid={!!errors.licenseNumber}
          aria-describedby={errors.licenseNumber ? 'license-error' : undefined}
          disabled={isSubmitting}
          className={cn(
            "transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20",
            errors.licenseNumber && "border-red-500 focus:ring-red-500/20"
          )}
        />
        {errors.licenseNumber && (
          <p id="license-error" className="text-sm text-red-600 animate-stepper-error">
            {errors.licenseNumber}
          </p>
        )}
      </div>

      {/* Specialty - Optional */}
      <div className="space-y-2">
        <Label htmlFor="specialty" className="flex items-center gap-2 text-foreground">
          <Stethoscope className="w-4 h-4 text-indigo-600" />
          {t('onboarding.stepper.fields.specialty')}
          <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
        </Label>
        <Select
          value={formData.specialty}
          onValueChange={(value) => handleInputChange('specialty', value as Specialty)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="specialty" className="transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20">
            <SelectValue placeholder={t('onboarding.stepper.placeholders.specialty')} />
          </SelectTrigger>
          <SelectContent>
            {SPECIALTIES.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {t(`onboarding.profile.specialties.${specialty}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderContactStep = () => (
    <div className="space-y-5">
      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2 text-foreground">
          <Phone className="w-4 h-4 text-indigo-600" />
          {t('onboarding.stepper.fields.phone')}
          <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          inputMode="numeric"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
          placeholder={t('onboarding.stepper.placeholders.phone')}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
          disabled={isSubmitting}
          className={cn(
            "transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20",
            errors.phone && "border-red-500 focus:ring-red-500/20"
          )}
        />
        {errors.phone && (
          <p id="phone-error" className="text-sm text-red-600 animate-stepper-error">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Alternative Phone */}
      <div className="space-y-2">
        <Label htmlFor="alternativePhone" className="flex items-center gap-2 text-foreground">
          <Phone className="w-4 h-4 text-emerald-600" />
          {t('onboarding.stepper.fields.alternativePhone')}
          <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
        </Label>
        <Input
          id="alternativePhone"
          type="tel"
          inputMode="numeric"
          value={formData.alternativePhone}
          onChange={(e) => handleInputChange('alternativePhone', e.target.value.replace(/\D/g, ''))}
          placeholder={t('onboarding.stepper.placeholders.alternativePhone')}
          aria-invalid={!!errors.alternativePhone}
          aria-describedby={errors.alternativePhone ? 'alt-phone-error' : undefined}
          disabled={isSubmitting}
          className={cn(
            "transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20",
            errors.alternativePhone && "border-red-500 focus:ring-red-500/20"
          )}
        />
        {errors.alternativePhone && (
          <p id="alt-phone-error" className="text-sm text-red-600 animate-stepper-error">
            {errors.alternativePhone}
          </p>
        )}
      </div>

      {/* Office Address */}
      <div className="space-y-2">
        <Label htmlFor="officeAddress" className="flex items-center gap-2 text-foreground">
          <MapPin className="w-4 h-4 text-amber-600" />
          {t('onboarding.stepper.fields.officeAddress')}
          <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
        </Label>
        <Input
          id="officeAddress"
          type="text"
          value={formData.officeAddress}
          onChange={(e) => handleInputChange('officeAddress', e.target.value)}
          placeholder={t('onboarding.stepper.placeholders.officeAddress')}
          disabled={isSubmitting}
          className="transition-all duration-200 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
    </div>
  );

  const renderOnlineStep = () => (
    <div className="space-y-5">
      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="website" className="flex items-center gap-2 text-foreground">
          <Globe className="w-4 h-4 text-indigo-600" />
          {t('onboarding.stepper.fields.website')}
          <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
        </Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          placeholder={t('onboarding.stepper.placeholders.website')}
          aria-invalid={!!errors.website}
          aria-describedby={errors.website ? 'website-error' : undefined}
          disabled={isSubmitting}
          className={cn(
            "transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20",
            errors.website && "border-red-500 focus:ring-red-500/20"
          )}
        />
        {errors.website && (
          <p id="website-error" className="text-sm text-red-600 animate-stepper-error">
            {errors.website}
          </p>
        )}
      </div>

      {/* Social Media Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Instagram */}
        <div className="space-y-2">
          <Label htmlFor="instagram" className="flex items-center gap-2 text-foreground">
            <Instagram className="w-4 h-4 text-pink-600" />
            {t('onboarding.stepper.fields.instagram')}
            <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
          </Label>
          <Input
            id="instagram"
            type="text"
            value={formData.instagram}
            onChange={(e) => handleInputChange('instagram', e.target.value)}
            placeholder={t('onboarding.stepper.placeholders.instagram')}
            disabled={isSubmitting}
            className="transition-all duration-200 focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        {/* LinkedIn */}
        <div className="space-y-2">
          <Label htmlFor="linkedin" className="flex items-center gap-2 text-foreground">
            <Linkedin className="w-4 h-4 text-blue-600" />
            {t('onboarding.stepper.fields.linkedin')}
            <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
          </Label>
          <Input
            id="linkedin"
            type="text"
            value={formData.linkedin}
            onChange={(e) => handleInputChange('linkedin', e.target.value)}
            placeholder={t('onboarding.stepper.placeholders.linkedin')}
            disabled={isSubmitting}
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio" className="flex items-center gap-2 text-foreground">
          <FileText className="w-4 h-4 text-muted-foreground" />
          {t('onboarding.stepper.fields.bio')}
          <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
        </Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder={t('onboarding.stepper.placeholders.bio')}
          rows={3}
          maxLength={500}
          aria-invalid={!!errors.bio}
          aria-describedby={errors.bio ? 'bio-error' : undefined}
          disabled={isSubmitting}
          className={cn(
            "transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20 resize-none",
            errors.bio && "border-red-500 focus:ring-red-500/20"
          )}
        />
        <div className="flex justify-between items-center">
          {errors.bio ? (
            <p id="bio-error" className="text-sm text-red-600 animate-stepper-error">
              {errors.bio}
            </p>
          ) : (
            <span className={cn(
              "text-xs transition-colors duration-200",
              formData.bio.length > 450 ? "text-amber-500" : "text-muted-foreground"
            )}>
              {formData.bio.length}/500 {t('profile.professional.characters')}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => {
    // Collect filled data for summary
    const filledData = [
      { label: t('onboarding.stepper.fields.licenseNumber'), value: formData.licenseNumber },
      formData.specialty && { label: t('onboarding.stepper.fields.specialty'), value: t(`onboarding.profile.specialties.${formData.specialty}`) },
      formData.phone && { label: t('onboarding.stepper.fields.phone'), value: formData.phone },
      formData.alternativePhone && { label: t('onboarding.stepper.fields.alternativePhone'), value: formData.alternativePhone },
      formData.officeAddress && { label: t('onboarding.stepper.fields.officeAddress'), value: formData.officeAddress },
      formData.website && { label: t('onboarding.stepper.fields.website'), value: formData.website },
      formData.instagram && { label: 'Instagram', value: formData.instagram },
      formData.linkedin && { label: 'LinkedIn', value: formData.linkedin },
      formData.bio && { label: t('onboarding.stepper.fields.bio'), value: formData.bio.substring(0, 50) + (formData.bio.length > 50 ? '...' : '') },
    ].filter(Boolean) as { label: string; value: string }[];

    return (
      <div className="space-y-5">
        {/* Welcome message */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-stepper-check">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-muted-foreground mb-4">
            {t('onboarding.stepper.complete.ready')}
          </p>
        </div>

        {/* Summary */}
        {filledData.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-medium text-foreground mb-3">
              {t('onboarding.stepper.complete.summary')}
            </h4>
            {filledData.map((item, index) => (
              <div
                key={index}
                className="flex justify-between text-sm py-1 border-b border-indigo-100 dark:border-indigo-800 last:border-0"
              >
                <span className="text-muted-foreground">{item.label}:</span>
                <span className="text-foreground font-medium truncate ml-2 max-w-[60%]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            <span className="font-medium">{t('onboarding.complete.tip')}</span>{' '}
            {t('onboarding.stepper.complete.tipText')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="passphrase" className="text-foreground">
            {t('onboarding.stepper.fields.passphrase')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="passphrase"
            type="password"
            autoComplete="new-password"
            value={formData.passphrase}
            onChange={(event) => handleInputChange('passphrase', event.target.value)}
            onFocus={() => setIsPassphraseFocused(true)}
            onBlur={() => {
              setIsPassphraseFocused(false);
              setPassphraseTouched(true);
            }}
            disabled={isSubmitting}
            className={cn(
              "transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20",
              errors.passphrase && "border-red-500 focus:ring-red-500/20"
            )}
          />
          {errors.passphrase && (
            <p className="text-sm text-red-600 animate-stepper-error">{errors.passphrase}</p>
          )}
          {!errors.passphrase && passphraseTouched && !isPassphraseFocused && isPassphraseTooShort && (
            <p className="text-sm text-red-600 animate-stepper-error">
              {t('onboarding.stepper.validation.passphraseMinLength', { count: 8 })}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('onboarding.stepper.passphraseInfo')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassphrase" className="text-foreground">
            {t('onboarding.stepper.fields.confirmPassphrase')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="confirmPassphrase"
            type="password"
            autoComplete="new-password"
            value={formData.confirmPassphrase}
            onChange={(event) => handleInputChange('confirmPassphrase', event.target.value)}
            onFocus={() => setIsConfirmPassphraseFocused(true)}
            onBlur={() => {
              setIsConfirmPassphraseFocused(false);
              setConfirmPassphraseTouched(true);
            }}
            disabled={isSubmitting}
            className={cn(
              "transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20",
              errors.confirmPassphrase && "border-red-500 focus:ring-red-500/20"
            )}
          />
          {errors.confirmPassphrase && (
            <p className="text-sm text-red-600 animate-stepper-error">{errors.confirmPassphrase}</p>
          )}
          {!errors.confirmPassphrase &&
            confirmPassphraseTouched &&
            !isConfirmPassphraseFocused &&
            isPassphraseMismatch && (
            <p className="text-sm text-red-600 animate-stepper-error">
              {t('onboarding.stepper.validation.passphraseMismatch')}
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('onboarding.stepper.recovery.title')}</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t('onboarding.stepper.recovery.description')}
            </p>
          </div>

          {!recoverySecret ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateRecoveryCode}
                disabled={isSubmitting || !isPassphraseReady}
              >
                {t('onboarding.stepper.recovery.generate')}
              </Button>
              {!isPassphraseReady && (
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {t('onboarding.stepper.recovery.generateHint')}
                </p>
              )}
            </>
          ) : (
            <Input
              readOnly
              value={recoverySecret}
              className="font-mono text-xs bg-white dark:bg-slate-900"
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={handleCopyRecoveryCode} disabled={!recoverySecret || isSubmitting}>
              <Copy className="w-4 h-4 mr-2" />
              {copiedRecoveryCode ? t('onboarding.stepper.recovery.copied') : t('onboarding.stepper.recovery.copy')}
            </Button>
            <Button type="button" variant="outline" onClick={handleDownloadRecoveryCode} disabled={!recoverySecret || isSubmitting}>
              <Download className="w-4 h-4 mr-2" />
              {t('onboarding.stepper.recovery.download')}
            </Button>
          </div>

          <label className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
            <input
              type="checkbox"
              checked={formData.recoveryAcknowledged}
              onChange={(event) => {
                setFormData((prev) => ({ ...prev, recoveryAcknowledged: event.target.checked }));
                if (errors.recoveryAcknowledged) {
                  setErrors((prev) => ({ ...prev, recoveryAcknowledged: undefined }));
                }
              }}
              disabled={isSubmitting}
              className="mt-0.5"
            />
            {t('onboarding.stepper.recovery.acknowledgement')}
          </label>

          {errors.recoveryAcknowledged && (
            <p className="text-sm text-red-600 animate-stepper-error">{errors.recoveryAcknowledged}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950">
      <div className="w-full max-w-md">
        {/* Beta badge */}
        <div className="flex justify-center mb-4">
          <BetaBadge />
        </div>

        {/* Step indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t('onboarding.stepper.stepOf', { current: currentStep + 1, total: TOTAL_STEPS })}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="flex justify-between mt-3">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div 
                  key={step.key}
                  className="flex flex-col items-center"
                >
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      isCompleted && "bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50",
                      isCurrent && "bg-gradient-to-br from-indigo-600 to-purple-600 ring-4 ring-indigo-100 dark:ring-indigo-900 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50",
                      !isCompleted && !isCurrent && "bg-muted border-2 border-border"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white animate-stepper-check" />
                    ) : (
                      <StepIcon className={cn(
                        "w-5 h-5 transition-colors duration-300",
                        isCurrent ? "text-white" : "text-muted-foreground"
                      )} />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs mt-1 hidden sm:block transition-colors duration-300",
                    isCompleted ? "text-indigo-600 font-medium" : isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {t(`onboarding.stepper.stepNames.${step.key}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="bg-card shadow-xl border-0 overflow-hidden">
          {/* Animated content container */}
          <div 
            key={currentStep}
            className="animate-stepper-slide-in"
          >
            <CardHeader className="text-center pb-2">
              <div className={cn(
                "w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/60 dark:to-purple-900/60 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300",
                isLastStep && "animate-stepper-celebration"
              )}>
                {(() => {
                  const Icon = stepConfig.icon;
                  return <Icon className="w-8 h-8 text-indigo-600" />;
                })()}
              </div>
              <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground">
                {t(stepConfig.titleKey)}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {t(stepConfig.descriptionKey)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4">
              {renderStepContent()}
            </CardContent>
          </div>

          {/* Navigation buttons */}
          <div className="flex flex-col gap-2 px-6 py-4 border-t border-border bg-muted/50">
            {/* Primary action — full width */}
            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300 dark:hover:shadow-indigo-800/60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  t('onboarding.stepper.completeSetup')
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300 dark:hover:shadow-indigo-800/60"
              >
                {t('common.next')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            {/* Secondary actions row */}
            {(!isFirstStep || (stepConfig.canSkip && !isLastStep)) && (
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={isSubmitting}
                    className="flex-1 border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t('common.back')}
                  </Button>
                )}
                {stepConfig.canSkip && !isLastStep && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="flex-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {t('onboarding.stepper.skip')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Brand footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Lavenius © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default Onboarding;
