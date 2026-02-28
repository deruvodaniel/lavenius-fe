import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  Calendar, 
  UserPlus, 
  PartyPopper,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { OnboardingStep } from './OnboardingStep';
import { OnboardingProgress } from './OnboardingProgress';
import { useOnboarding } from '@/lib/hooks/useOnboarding';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectCalendar?: () => void;
  onCreatePatient?: () => void;
}

/**
 * Modal de onboarding que guía al usuario en sus primeros pasos
 */
export function OnboardingModal({ 
  isOpen, 
  onClose,
  onConnectCalendar,
  onCreatePatient
}: OnboardingModalProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const { completeOnboarding } = useOnboarding();

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    completeOnboarding();
    onClose();
  };

  const handleSkip = () => {
    completeOnboarding();
    onClose();
  };

  const handleConnectCalendar = () => {
    onConnectCalendar?.();
    handleNext();
  };

  const handleCreatePatient = () => {
    onCreatePatient?.();
    handleNext();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <OnboardingStep
            icon={Sparkles}
            title={t('onboarding.welcome')}
            description={t('onboarding.welcomeDescription')}
          />
        );

      case 1:
        return (
          <OnboardingStep
            icon={Calendar}
            title={t('onboarding.calendar.title')}
            description={t('onboarding.calendar.description')}
          >
            <div className="space-y-3">
              <Button
                onClick={handleConnectCalendar}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {t('onboarding.calendar.connect')}
              </Button>
              <button
                onClick={handleNext}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                {t('onboarding.calendar.later')}
              </button>
            </div>
          </OnboardingStep>
        );

      case 2:
        return (
          <OnboardingStep
            icon={UserPlus}
            title={t('onboarding.patient.title')}
            description={t('onboarding.patient.description')}
          >
            <div className="space-y-3">
              <Button
                onClick={handleCreatePatient}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {t('onboarding.patient.create')}
              </Button>
              <button
                onClick={handleNext}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                {t('onboarding.patient.later')}
              </button>
            </div>
          </OnboardingStep>
        );

      case 3:
        return (
          <OnboardingStep
            icon={PartyPopper}
            title={t('onboarding.complete.title')}
            description={t('onboarding.complete.description')}
          >
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{t('onboarding.complete.tip')}</span> {t('onboarding.complete.tipText')}{' '}
                <span className="text-indigo-600 font-medium">{t('onboarding.complete.helpSection')}</span> {t('onboarding.complete.tipSuffix')}
              </p>
            </div>
          </OnboardingStep>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-1rem)] sm:max-w-md !bg-white p-0 gap-0 overflow-hidden flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[90vh]"
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label={t('onboarding.navigation.close')}
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Content */}
        <div className="pt-7 sm:pt-8 pb-3 sm:pb-4 overflow-y-auto min-h-0">
          {renderStep()}
        </div>

        {/* Progress & Navigation */}
        <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <div className="w-20 sm:w-24">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('onboarding.navigation.back')}
                </button>
              )}
            </div>

            {/* Progress dots */}
            <OnboardingProgress 
              currentStep={currentStep} 
              totalSteps={totalSteps} 
            />

            {/* Next/Finish button */}
            <div className="w-20 sm:w-24 flex justify-end">
              {currentStep < totalSteps - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  {t('onboarding.navigation.next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <Button
                  onClick={handleComplete}
                  size="sm"
                >
                  {t('onboarding.navigation.start')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
