import { X, Mail, Phone, Heart, Calendar, FileText, Video, MapPin, Sparkles } from 'lucide-react';
import { pacientes, sesiones } from '../data/mockData';

interface PatientDrawerProps {
  pacienteId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PatientDrawer({ pacienteId, isOpen, onClose }: PatientDrawerProps) {
  if (!isOpen || !pacienteId) return null;

  const paciente = pacientes.find((p) => p.id === pacienteId);

  if (!paciente) return null;

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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

  // Get last 2 sessions
  const sesionesPaciente = sesiones
    .filter((s) => s.pacienteId === pacienteId)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 2);

  // Generate AI summary based on last 2 sessions
  const generarResumenIA = () => {
    if (sesionesPaciente.length === 0) {
      return 'No hay sesiones registradas para generar un resumen.';
    }

    // This is a mock summary - in a real app, this would come from an AI service
    const resumenPorPaciente: { [key: number]: string } = {
      1: 'El paciente muestra avances significativos en el manejo de la ansiedad mediante técnicas de reestructuración cognitiva y respiración. Se observa mayor consciencia de patrones de pensamiento y mejora en la aplicación de estrategias de afrontamiento. Se recomienda continuar con el registro de situaciones ansiógenas y reforzar las técnicas de relajación progresiva.',
      2: 'Se evidencia progreso notable en el manejo del burnout laboral. El paciente ha implementado exitosamente pausas durante la jornada y muestra mejoría en delegación de tareas. El trabajo en creencias de perfeccionismo está dando resultados positivos. Es importante continuar reforzando límites profesionales y prácticas de mindfulness.',
      3: 'La paciente presenta mejoría significativa en su estado de ánimo y nivel de activación. Ha retomado actividades placenteras y mantiene rutina estructurada con mejor higiene del sueño. El trabajo en activación conductual está siendo efectivo. Se sugiere continuar incrementando gradualmente actividades sociales.',
      4: 'El paciente avanza en el proceso de elaboración del duelo, mostrando mayor facilidad para expresar emociones y recordar momentos positivos sin evitación. Se observa mejor manejo de rutinas diarias. Es fundamental mantener el trabajo en aceptación del proceso y fortalecer conexiones sociales.',
      5: 'Excelente evolución en el control de ataques de pánico. La paciente ha logrado completar exitosamente varios niveles de exposición gradual sin episodios completos en semanas recientes. Aumenta confianza en capacidad de autogestión. Se recomienda continuar con la jerarquía de exposición y reforzar técnicas de grounding.',
      6: 'El paciente demuestra mayor consciencia sobre sus patrones de pensamiento rígido. El trabajo en flexibilidad cognitiva y exploración de esquemas tempranos está mostrando resultados, aunque persiste resistencia esperada al cambio. Se sugiere mantener el ritmo gradual y consistente en el abordaje terapéutico.',
    };

    return resumenPorPaciente[pacienteId] || 'Paciente en proceso terapéutico con seguimiento regular.';
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop - more subtle */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-600/50 rounded-full flex items-center justify-center backdrop-blur">
                <span className="text-white text-xl">
                  {paciente.nombre.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <div>
                <h2 className="text-white text-2xl mb-1">{paciente.nombre}</h2>
                <p className="text-indigo-200">{paciente.edad} años</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-indigo-200 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Información del Paciente
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{paciente.telefono}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{paciente.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Heart className="w-4 h-4" />
                <span>Obra Social: {paciente.obraSocial}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                {paciente.modalidad === 'remoto' ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                <span>Modalidad: {getModalidadLabel(paciente.modalidad)}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Frecuencia: {getFrecuenciaLabel(paciente.frecuencia)}</span>
              </div>
            </div>
          </div>

          {/* Clinical History */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Historia Clínica
            </h3>

            <div className="space-y-4">
              {/* Diagnosis */}
              <div>
                <h4 className="text-gray-700 mb-2">Diagnóstico</h4>
                <p className="text-gray-600 bg-white p-3 rounded border border-indigo-100">
                  {paciente.historiaClinica.diagnostico}
                </p>
              </div>

              {/* Current Treatment */}
              <div>
                <h4 className="text-gray-700 mb-2">Tratamiento Actual</h4>
                <p className="text-gray-600 bg-white p-3 rounded border border-indigo-100">
                  {paciente.historiaClinica.tratamientoActual}
                </p>
              </div>

              {/* Observations */}
              <div>
                <h4 className="text-gray-700 mb-2">Observaciones</h4>
                <p className="text-gray-600 bg-white p-3 rounded border border-indigo-100">
                  {paciente.historiaClinica.observaciones}
                </p>
              </div>

              {/* Last Consultation */}
              <div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Última consulta: {formatFecha(paciente.historiaClinica.ultimaConsulta)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary of Last Sessions */}
          <div className="relative bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-lg p-6 overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/30 to-indigo-200/30 rounded-full blur-2xl" />
            
            <div className="relative">
              {/* Header with AI badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-full">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">Resumen generado con Lavenius IA</span>
                </div>
              </div>

              {/* Summary content */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100">
                <p className="text-gray-700 leading-relaxed">
                  {generarResumenIA()}
                </p>
              </div>

              {/* Session dates reference */}
              {sesionesPaciente.length > 0 && (
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <p className="text-xs text-gray-500">
                    Basado en las sesiones del{' '}
                    {sesionesPaciente.map((s) => formatFecha(s.fecha)).join(' y ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors">
              Editar Ficha
            </button>
            <button className="flex-1 bg-white text-indigo-600 border-2 border-indigo-600 py-3 rounded-lg hover:bg-indigo-50 transition-colors">
              Ver Todas las Sesiones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}