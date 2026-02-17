import { useState } from 'react';
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
            title="¡Bienvenido a Lavenius!"
            description="Tu nueva herramienta para gestionar pacientes, agendar sesiones y llevar el control de tu práctica terapéutica de forma simple y organizada."
          />
        );

      case 1:
        return (
          <OnboardingStep
            icon={Calendar}
            title="Conecta tu calendario"
            description="Sincroniza con Google Calendar para agendar turnos automáticamente y recibir recordatorios. Tus pacientes también recibirán invitaciones."
          >
            <div className="space-y-3">
              <Button
                onClick={handleConnectCalendar}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Conectar Google Calendar
              </Button>
              <button
                onClick={handleNext}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                Lo haré más tarde
              </button>
            </div>
          </OnboardingStep>
        );

      case 2:
        return (
          <OnboardingStep
            icon={UserPlus}
            title="Registra tu primer paciente"
            description="Comienza agregando a tus pacientes para poder agendar sesiones, llevar notas clínicas y gestionar sus pagos."
          >
            <div className="space-y-3">
              <Button
                onClick={handleCreatePatient}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Crear paciente
              </Button>
              <button
                onClick={handleNext}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                Lo haré después
              </button>
            </div>
          </OnboardingStep>
        );

      case 3:
        return (
          <OnboardingStep
            icon={PartyPopper}
            title="¡Todo listo!"
            description="Ya puedes comenzar a usar Lavenius. Recuerda que siempre puedes acceder a la ayuda desde el menú lateral si tienes dudas."
          >
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Tip:</span> Usa la sección{' '}
                <span className="text-indigo-600 font-medium">Ayuda</span> para ver tutoriales
                y resolver dudas frecuentes.
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
      <DialogContent className="sm:max-w-md !bg-white p-0 gap-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Content */}
        <div className="pt-8 pb-4">
          {renderStep()}
        </div>

        {/* Progress & Navigation */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <div className="w-24">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Atrás
                </button>
              )}
            </div>

            {/* Progress dots */}
            <OnboardingProgress 
              currentStep={currentStep} 
              totalSteps={totalSteps} 
            />

            {/* Next/Finish button */}
            <div className="w-24 flex justify-end">
              {currentStep < totalSteps - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <Button
                  onClick={handleComplete}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Comenzar
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
