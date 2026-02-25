import { useState, useMemo } from 'react';
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
  PartyPopper
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
import { apiClient } from '@/lib/api/client';
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
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Progress percentage
  const progressPercentage = useMemo(() => {
    return ((currentStep + 1) / TOTAL_STEPS) * 100;
  }, [currentStep]);

  // Current step config
  const stepConfig = STEPS[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFirstStep = currentStep === 0;

  // Show loading while Clerk loads user data
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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

      // 2. Prepare data for backend (only fields it accepts)
      const backendData: ClerkUserSyncDto = {
        clerkUserId: user.id,
        externalId: user.id,
        email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: formData.phone.trim() || undefined,
        licenseNumber: formData.licenseNumber.trim() || undefined,
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
        toast.error('No pudimos registrar tu usuario en el backend. Intenta nuevamente.');
        setIsSubmitting(false);
        return;
      }

      // 4.1 Bootstrap encryption key immediately after register.
      // Backend currently expects passphrase = therapist.id (stored after register response),
      // with fallback to Clerk user ID for compatibility.
      const backendPassphrase = syncResult.therapistId || onboardingService.getBackendPassphrase(user.id);

      if (!backendPassphrase) {
        toast.error('No pudimos obtener tu therapistId para inicializar cifrado.');
        setIsSubmitting(false);
        return;
      }

      try {
        const authResponse = await apiClient.post<{ userKey?: string }>('/auth', {
          passphrase: backendPassphrase,
        });

        if (authResponse?.userKey) {
          apiClient.setUserKey(authResponse.userKey);
          onboardingService.saveBackendPassphrase(user.id, backendPassphrase);
        } else {
          toast.error('No pudimos inicializar tu clave de cifrado. Intenta nuevamente.');
          setIsSubmitting(false);
          return;
        }
      } catch {
        toast.error('No pudimos inicializar tu clave de cifrado. Intenta nuevamente.');
        setIsSubmitting(false);
        return;
      }

      // 5. Save extra data to localStorage (user-scoped)
      onboardingService.saveExtraData(user.id, extraData);

      // 6. Update Clerk user metadata with all profile data
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
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
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
        <Label htmlFor="licenseNumber" className="flex items-center gap-2 text-gray-700">
          <Award className="w-4 h-4 text-indigo-600" />
          {t('onboarding.stepper.fields.licenseNumber')}
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="licenseNumber"
          type="text"
          value={formData.licenseNumber}
          onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
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
        <Label htmlFor="specialty" className="flex items-center gap-2 text-gray-700">
          <Stethoscope className="w-4 h-4 text-indigo-600" />
          {t('onboarding.stepper.fields.specialty')}
          <span className="text-gray-400 text-xs">({t('common.optional')})</span>
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
        <Label htmlFor="phone" className="flex items-center gap-2 text-gray-700">
          <Phone className="w-4 h-4 text-indigo-600" />
          {t('onboarding.stepper.fields.phone')}
          <span className="text-gray-400 text-xs">({t('common.optional')})</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
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
        <Label htmlFor="alternativePhone" className="flex items-center gap-2 text-gray-700">
          <Phone className="w-4 h-4 text-emerald-600" />
          {t('onboarding.stepper.fields.alternativePhone')}
          <span className="text-gray-400 text-xs">({t('common.optional')})</span>
        </Label>
        <Input
          id="alternativePhone"
          type="tel"
          value={formData.alternativePhone}
          onChange={(e) => handleInputChange('alternativePhone', e.target.value)}
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
        <Label htmlFor="officeAddress" className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4 text-amber-600" />
          {t('onboarding.stepper.fields.officeAddress')}
          <span className="text-gray-400 text-xs">({t('common.optional')})</span>
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
        <Label htmlFor="website" className="flex items-center gap-2 text-gray-700">
          <Globe className="w-4 h-4 text-indigo-600" />
          {t('onboarding.stepper.fields.website')}
          <span className="text-gray-400 text-xs">({t('common.optional')})</span>
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
          <Label htmlFor="instagram" className="flex items-center gap-2 text-gray-700">
            <Instagram className="w-4 h-4 text-pink-600" />
            {t('onboarding.stepper.fields.instagram')}
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
          <Label htmlFor="linkedin" className="flex items-center gap-2 text-gray-700">
            <Linkedin className="w-4 h-4 text-blue-600" />
            {t('onboarding.stepper.fields.linkedin')}
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
        <Label htmlFor="bio" className="flex items-center gap-2 text-gray-700">
          <FileText className="w-4 h-4 text-gray-500" />
          {t('onboarding.stepper.fields.bio')}
          <span className="text-gray-400 text-xs">({t('common.optional')})</span>
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
              formData.bio.length > 450 ? "text-amber-500" : "text-gray-400"
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
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-stepper-check">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600 mb-4">
            {t('onboarding.stepper.complete.ready')}
          </p>
        </div>

        {/* Summary */}
        {filledData.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {t('onboarding.stepper.complete.summary')}
            </h4>
            {filledData.map((item, index) => (
              <div 
                key={index} 
                className="flex justify-between text-sm py-1 border-b border-indigo-100 last:border-0"
              >
                <span className="text-gray-500">{item.label}:</span>
                <span className="text-gray-900 font-medium truncate ml-2 max-w-[60%]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
          <p className="text-sm text-indigo-700">
            <span className="font-medium">{t('onboarding.complete.tip')}</span>{' '}
            {t('onboarding.stepper.complete.tipText')}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t('onboarding.stepper.stepOf', { current: currentStep + 1, total: TOTAL_STEPS })}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
                      isCompleted && "bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200",
                      isCurrent && "bg-gradient-to-br from-indigo-600 to-purple-600 ring-4 ring-indigo-100 shadow-lg shadow-indigo-200",
                      !isCompleted && !isCurrent && "bg-gray-100 border-2 border-gray-200"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white animate-stepper-check" />
                    ) : (
                      <StepIcon className={cn(
                        "w-5 h-5 transition-colors duration-300",
                        isCurrent ? "text-white" : "text-gray-400"
                      )} />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs mt-1 hidden sm:block transition-colors duration-300",
                    isCompleted ? "text-indigo-600 font-medium" : isCurrent ? "text-gray-900 font-medium" : "text-gray-400"
                  )}>
                    {t(`onboarding.stepper.stepNames.${step.key}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="bg-white shadow-xl border-0 overflow-hidden">
          {/* Animated content container */}
          <div 
            key={currentStep}
            className="animate-stepper-slide-in"
          >
            <CardHeader className="text-center pb-2">
              <div className={cn(
                "w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300",
                isLastStep && "animate-stepper-celebration"
              )}>
                {(() => {
                  const Icon = stepConfig.icon;
                  return <Icon className="w-8 h-8 text-indigo-600" />;
                })()}
              </div>
              <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">
                {t(stepConfig.titleKey)}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                {t(stepConfig.descriptionKey)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4">
              {renderStepContent()}
            </CardContent>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            {/* Back button */}
            <div className="w-24">
              {!isFirstStep && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={isSubmitting}
                  className="border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  {t('common.back')}
                </Button>
              )}
            </div>

            {/* Skip button (center) */}
            <div className="flex-1 flex justify-center">
              {stepConfig.canSkip && !isLastStep && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {t('onboarding.stepper.skip')}
                </Button>
              )}
            </div>

            {/* Next/Complete button */}
            <div className="w-auto">
              {isLastStep ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300"
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
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300"
                >
                  {t('common.next')}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Brand footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Lavenius © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default Onboarding;
