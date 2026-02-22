import { useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import type { LucideIcon } from 'lucide-react';
import { 
  Award, 
  Stethoscope, 
  Phone,
  MapPin,
  Globe,
  Loader2,
  PartyPopper,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Linkedin,
  FileText
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
import { StepperHeader, type StepConfig } from './StepperHeader';

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
 * Complete onboarding form data
 */
interface OnboardingFormData {
  // Step 1: Professional Info
  licenseNumber: string;
  specialty: Specialty | '';
  
  // Step 2: Contact Info
  phone: string;
  altPhone: string;
  officeAddress: string;
  
  // Step 3: Online Presence
  website: string;
  instagram: string;
  linkedin: string;
  bio: string;
}

type FormField = keyof OnboardingFormData;

/**
 * Step configuration
 */
const STEPS: StepConfig[] = [
  { id: 'professional', title: 'Información Profesional', shortTitle: 'Profesional', icon: Award },
  { id: 'contact', title: 'Información de Contacto', shortTitle: 'Contacto', icon: Phone },
  { id: 'online', title: 'Presencia Online', shortTitle: 'Online', icon: Globe },
  { id: 'complete', title: '¡Completado!', shortTitle: 'Listo', icon: PartyPopper },
];

/**
 * Multi-step onboarding stepper component
 * Guides new users through profile setup with animated transitions
 */
export function OnboardingStepper() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [formData, setFormData] = useState<OnboardingFormData>({
    licenseNumber: '',
    specialty: '',
    phone: '',
    altPhone: '',
    officeAddress: '',
    website: '',
    instagram: '',
    linkedin: '',
    bio: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All hooks must be called before any conditional returns
  const handleInputChange = useCallback((field: FormField, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // Show loading while Clerk loads user data
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Redirect if no user
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

  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Partial<Record<FormField, string>> = {};

    switch (currentStep) {
      case 0: // Professional Info
        if (!formData.licenseNumber.trim()) {
          newErrors.licenseNumber = t('onboarding.profile.validation.licenseRequired');
        } else if (formData.licenseNumber.trim().length < 3) {
          newErrors.licenseNumber = t('onboarding.profile.validation.licenseMinLength');
        }
        break;
        
      case 1: // Contact Info
        if (formData.phone && formData.phone.trim().length > 0) {
          const phoneDigits = formData.phone.replace(/\D/g, '');
          if (phoneDigits.length < 8) {
            newErrors.phone = t('onboarding.profile.validation.phoneInvalid');
          }
        }
        if (formData.altPhone && formData.altPhone.trim().length > 0) {
          const altPhoneDigits = formData.altPhone.replace(/\D/g, '');
          if (altPhoneDigits.length < 8) {
            newErrors.altPhone = t('onboarding.profile.validation.phoneInvalid');
          }
        }
        break;
        
      case 2: // Online Presence
        if (formData.website && !isValidUrl(formData.website)) {
          newErrors.website = t('onboarding.profile.validation.invalidUrl');
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setDirection('forward');
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setDirection('backward');
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    setDirection('forward');
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      // Update Clerk user metadata with all collected info
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          licenseNumber: formData.licenseNumber.trim(),
          specialty: formData.specialty || undefined,
          phone: formData.phone.trim() || undefined,
          altPhone: formData.altPhone.trim() || undefined,
          officeAddress: formData.officeAddress.trim() || undefined,
          website: formData.website.trim() || undefined,
          instagram: formData.instagram.trim() || undefined,
          linkedin: formData.linkedin.trim() || undefined,
          bio: formData.bio.trim() || undefined,
          onboardingComplete: true,
          onboardingCompletedAt: new Date().toISOString(),
        },
      });

      toast.success(t('onboarding.profile.success'));
      
      // Small delay for user to see success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast.error(t('onboarding.profile.error'));
      setIsSubmitting(false);
    }
  };

  const isLastContentStep = currentStep === STEPS.length - 2;
  const isCompletionStep = currentStep === STEPS.length - 1;

  // Determine if current step can be skipped (optional fields)
  const canSkip = currentStep === 1 || currentStep === 2;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-xl">
        {/* Stepper Header */}
        <StepperHeader 
          steps={STEPS} 
          currentStep={currentStep}
          className="mb-8"
        />

        {/* Step Content Card */}
        <Card className="bg-white shadow-xl border-0 overflow-hidden">
          {/* Animated content container */}
          <div 
            key={currentStep}
            className={`
              animate-stepper-slide-${direction === 'forward' ? 'in' : 'in-reverse'}
            `}
          >
            {currentStep === 0 && (
              <StepContent
                icon={Award}
                title={t('onboarding.profile.steps.professional')}
                description={t('onboarding.profile.professionalDescription')}
              >
                <div className="space-y-5">
                  {/* License Number - Required */}
                  <FormField
                    id="licenseNumber"
                    label={t('onboarding.profile.fields.licenseNumber')}
                    icon={Award}
                    required
                    error={errors.licenseNumber}
                  >
                    <Input
                      id="licenseNumber"
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      placeholder={t('onboarding.profile.placeholders.licenseNumber')}
                      aria-invalid={!!errors.licenseNumber}
                      disabled={isSubmitting}
                      className="transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </FormField>

                  {/* Specialty - Optional */}
                  <FormField
                    id="specialty"
                    label={t('onboarding.profile.fields.specialty')}
                    icon={Stethoscope}
                  >
                    <Select
                      value={formData.specialty}
                      onValueChange={(value) => handleInputChange('specialty', value as Specialty)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="specialty">
                        <SelectValue placeholder={t('onboarding.profile.placeholders.specialty')} />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALTIES.map((specialty) => (
                          <SelectItem key={specialty} value={specialty}>
                            {t(`onboarding.profile.specialties.${specialty}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </StepContent>
            )}

            {currentStep === 1 && (
              <StepContent
                icon={Phone}
                title={t('onboarding.profile.steps.contact')}
                description={t('onboarding.profile.contactDescription')}
              >
                <div className="space-y-5">
                  {/* Phone */}
                  <FormField
                    id="phone"
                    label={t('onboarding.profile.fields.phone')}
                    icon={Phone}
                    error={errors.phone}
                  >
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder={t('onboarding.profile.placeholders.phone')}
                      aria-invalid={!!errors.phone}
                      disabled={isSubmitting}
                    />
                  </FormField>

                  {/* Alt Phone */}
                  <FormField
                    id="altPhone"
                    label={t('onboarding.profile.fields.altPhone')}
                    icon={Phone}
                    error={errors.altPhone}
                  >
                    <Input
                      id="altPhone"
                      type="tel"
                      value={formData.altPhone}
                      onChange={(e) => handleInputChange('altPhone', e.target.value)}
                      placeholder={t('onboarding.profile.placeholders.altPhone')}
                      aria-invalid={!!errors.altPhone}
                      disabled={isSubmitting}
                    />
                  </FormField>

                  {/* Office Address */}
                  <FormField
                    id="officeAddress"
                    label={t('onboarding.profile.fields.officeAddress')}
                    icon={MapPin}
                  >
                    <Input
                      id="officeAddress"
                      type="text"
                      value={formData.officeAddress}
                      onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                      placeholder={t('onboarding.profile.placeholders.officeAddress')}
                      disabled={isSubmitting}
                    />
                  </FormField>
                </div>
              </StepContent>
            )}

            {currentStep === 2 && (
              <StepContent
                icon={Globe}
                title={t('onboarding.profile.steps.online')}
                description={t('onboarding.profile.onlineDescription')}
              >
                <div className="space-y-5">
                  {/* Website */}
                  <FormField
                    id="website"
                    label={t('onboarding.profile.fields.website')}
                    icon={Globe}
                    error={errors.website}
                  >
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.ejemplo.com"
                      aria-invalid={!!errors.website}
                      disabled={isSubmitting}
                    />
                  </FormField>

                  {/* Instagram */}
                  <FormField
                    id="instagram"
                    label="Instagram"
                    icon={Instagram}
                  >
                    <Input
                      id="instagram"
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      placeholder="@usuario"
                      disabled={isSubmitting}
                    />
                  </FormField>

                  {/* LinkedIn */}
                  <FormField
                    id="linkedin"
                    label="LinkedIn"
                    icon={Linkedin}
                  >
                    <Input
                      id="linkedin"
                      type="text"
                      value={formData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/usuario"
                      disabled={isSubmitting}
                    />
                  </FormField>

                  {/* Bio */}
                  <FormField
                    id="bio"
                    label={t('onboarding.profile.fields.bio')}
                    icon={FileText}
                  >
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder={t('onboarding.profile.placeholders.bio')}
                      disabled={isSubmitting}
                      rows={3}
                      className="resize-none"
                    />
                  </FormField>
                </div>
              </StepContent>
            )}

            {currentStep === 3 && (
              <StepContent
                icon={PartyPopper}
                title={t('onboarding.complete.title')}
                description={t('onboarding.complete.description')}
                iconClassName="animate-stepper-celebration"
              >
                {/* Summary of entered info */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      {t('onboarding.complete.summary')}
                    </h4>
                    
                    {formData.licenseNumber && (
                      <SummaryItem 
                        icon={Award} 
                        label={t('onboarding.profile.fields.licenseNumber')} 
                        value={formData.licenseNumber} 
                      />
                    )}
                    
                    {formData.specialty && (
                      <SummaryItem 
                        icon={Stethoscope} 
                        label={t('onboarding.profile.fields.specialty')} 
                        value={t(`onboarding.profile.specialties.${formData.specialty}`)} 
                      />
                    )}
                    
                    {formData.phone && (
                      <SummaryItem 
                        icon={Phone} 
                        label={t('onboarding.profile.fields.phone')} 
                        value={formData.phone} 
                      />
                    )}
                    
                    {formData.officeAddress && (
                      <SummaryItem 
                        icon={MapPin} 
                        label={t('onboarding.profile.fields.officeAddress')} 
                        value={formData.officeAddress} 
                      />
                    )}
                    
                    {formData.website && (
                      <SummaryItem 
                        icon={Globe} 
                        label={t('onboarding.profile.fields.website')} 
                        value={formData.website} 
                      />
                    )}
                  </div>

                  {/* Tip */}
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{t('onboarding.complete.tip')}</span>{' '}
                      {t('onboarding.complete.tipText')}{' '}
                      <span className="text-indigo-600 font-medium">{t('onboarding.complete.helpSection')}</span>{' '}
                      {t('onboarding.complete.tipSuffix')}
                    </p>
                  </div>
                </div>
              </StepContent>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
            <div className="flex items-center justify-between gap-4">
              {/* Back button */}
              <div className="w-24">
                {currentStep > 0 && !isCompletionStep && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {t('onboarding.navigation.back')}
                  </Button>
                )}
              </div>

              {/* Skip button (center) */}
              <div className="flex-1 flex justify-center">
                {canSkip && !isCompletionStep && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {t('onboarding.navigation.skip')}
                  </Button>
                )}
              </div>

              {/* Next / Complete button */}
              <div className="w-auto">
                {isCompletionStep ? (
                  <Button
                    type="button"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('common.saving')}
                      </>
                    ) : (
                      t('onboarding.navigation.start')
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300"
                  >
                    {isLastContentStep ? t('onboarding.navigation.review') : t('onboarding.navigation.next')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
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

/**
 * Step content wrapper with icon header
 */
interface StepContentProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
  children: ReactNode;
}

function StepContent({ icon: Icon, title, description, iconClassName = '', children }: StepContentProps) {
  return (
    <>
      <CardHeader className="text-center pb-2">
        <div className={`w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 ${iconClassName}`}>
          <Icon className="w-8 h-8 text-indigo-600" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600 mt-2">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        {children}
      </CardContent>
    </>
  );
}

/**
 * Form field wrapper with label and icon
 */
interface FormFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

function FormField({ id, label, icon: Icon, required, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-indigo-600" />
        {label}
        {required && <span className="text-red-500">*</span>}
        {!required && <span className="text-gray-400 text-xs">(opcional)</span>}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600 animate-stepper-error">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Summary item for completion step
 */
interface SummaryItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

function SummaryItem({ icon: Icon, label, value }: SummaryItemProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
      <span className="text-gray-500">{label}:</span>
      <span className="text-gray-900 font-medium truncate">{value}</span>
    </div>
  );
}

export default OnboardingStepper;
