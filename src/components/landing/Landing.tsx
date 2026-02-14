import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  RefreshCw, 
  Clock, 
  TrendingUp,
  Bell,
  MessageCircle,
  Shield,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedSection } from '@/components/shared/AnimatedSection';

// ============================================================================
// MOCK DATA FOR DASHBOARD PREVIEW
// ============================================================================

const mockChartData = [
  { month: 'Ene', value: 65 },
  { month: 'Feb', value: 78 },
  { month: 'Mar', value: 82 },
  { month: 'Abr', value: 95 },
  { month: 'May', value: 88 },
  { month: 'Jun', value: 110 },
];

const mockStats = {
  ingresosMes: '$485.000',
  sesionesRealizadas: 42,
  pacientesActivos: 18,
  tasaCobro: '94%',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function NavBar() {
  const navigate = useNavigate();
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Lavenius
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/login')}
              className="text-gray-600 hover:text-gray-900"
            >
              Iniciar sesion
            </Button>
            <Button 
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              Comenzar gratis
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <AnimatedSection animation="fade" duration={400}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Gestion inteligente para profesionales de salud mental
            </div>
          </AnimatedSection>
          
          <AnimatedSection animation="slide-up" delay={100} duration={500}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Control total de tu consultorio{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                y tus finanzas
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection animation="slide-up" delay={200} duration={500}>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Elimina el Excel y el papel. Ahorra tiempo con turnos inteligentes, 
              seguimiento de cobros automatizado y toda la informacion de tus pacientes en un solo lugar.
            </p>
          </AnimatedSection>
          
          <AnimatedSection animation="slide-up" delay={300} duration={500}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Comenzar gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-6 text-lg"
              >
                Ya tengo cuenta
              </Button>
            </div>
          </AnimatedSection>
          
          <AnimatedSection animation="fade" delay={500} duration={600}>
            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Sin tarjeta de credito
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Datos encriptados
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Soporte incluido
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Calendar,
      title: 'Turnero Inteligente',
      description: 'Gestiona disponibilidad y reglas de recurrencia (quincenales, mensuales). Sincroniza con Google Calendar.',
      color: 'indigo',
    },
    {
      icon: DollarSign,
      title: 'Gestion de Cobros',
      description: 'Seguimiento riguroso de pagos con recordatorios automaticos via WhatsApp y Email.',
      color: 'emerald',
    },
    {
      icon: FileText,
      title: 'Fichero Digital',
      description: 'Historias clinicas seguras, consentimientos informados y cuestionarios de filtro inicial.',
      color: 'purple',
    },
    {
      icon: RefreshCw,
      title: 'Calendario Sync',
      description: 'Sincronizacion total con tu calendario para evitar solapamientos y olvidos.',
      color: 'blue',
    },
  ];
  
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
  };
  
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection animation="slide-up" duration={500}>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Modulos disenados especificamente para profesionales de la salud mental
            </p>
          </div>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <AnimatedSection 
              key={feature.title} 
              animation="slide-up" 
              delay={index * 100} 
              duration={500}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white h-full">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnalyticsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <AnimatedSection animation="slide-up" duration={500}>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-medium mb-6">
                <BarChart3 className="w-4 h-4" />
                Panel de Analytics
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Visibilidad total de tu practica profesional
              </h2>
              <p className="text-lg text-indigo-200 mb-8">
                Toma decisiones informadas con datos claros sobre tus ingresos, 
                sesiones realizadas y metricas de crecimiento mensual.
              </p>
              
              <div className="space-y-4">
                {[
                  'Ingresos mensuales y proyecciones',
                  'Sesiones por cobrar y cobradas',
                  'Pacientes activos vs nuevos',
                  'Tasa de asistencia y cancelacion',
                ].map((item, index) => (
                  <AnimatedSection key={item} animation="slide-left" delay={200 + index * 100} duration={400}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-indigo-500/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-indigo-300" />
                      </div>
                      <span className="text-indigo-100">{item}</span>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </AnimatedSection>
          
          {/* Dashboard Preview */}
          <AnimatedSection animation="scale" delay={200} duration={600}>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-indigo-300 text-sm mb-1">
                    <DollarSign className="w-4 h-4" />
                    Ingresos del mes
                  </div>
                  <div className="text-2xl font-bold text-white">{mockStats.ingresosMes}</div>
                  <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +12% vs mes anterior
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-indigo-300 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    Sesiones
                  </div>
                  <div className="text-2xl font-bold text-white">{mockStats.sesionesRealizadas}</div>
                  <div className="text-xs text-indigo-300 mt-1">este mes</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-indigo-300 text-sm mb-1">
                    <Users className="w-4 h-4" />
                    Pacientes activos
                  </div>
                  <div className="text-2xl font-bold text-white">{mockStats.pacientesActivos}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-indigo-300 text-sm mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Tasa de cobro
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">{mockStats.tasaCobro}</div>
                </div>
              </div>
              
              {/* Mini Chart */}
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-sm text-indigo-300 mb-3">Ingresos ultimos 6 meses</div>
                <div className="flex items-end gap-2 h-24">
                  {mockChartData.map((data) => (
                    <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t"
                        style={{ height: `${data.value}%` }}
                      />
                      <span className="text-xs text-indigo-300">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function RemindersSection() {
  const reminders = [
    {
      type: 'WhatsApp',
      icon: MessageCircle,
      message: 'Hola Maria! Te recordamos tu sesion manana a las 15:00hs. Confirma tu asistencia.',
      time: 'Enviado automaticamente',
      color: 'green',
    },
    {
      type: 'Cobro pendiente',
      icon: DollarSign,
      message: 'Juan Garcia tiene 2 sesiones pendientes de pago ($12.000)',
      time: 'Recordatorio enviado',
      color: 'amber',
    },
    {
      type: 'Confirmacion',
      icon: CheckCircle2,
      message: 'Pedro Lopez confirmo su turno del Viernes 14:00hs',
      time: 'Hace 5 minutos',
      color: 'emerald',
    },
  ];
  
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };
  
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Preview */}
          <AnimatedSection animation="scale" delay={100} duration={600} className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-gray-900">Notificaciones automaticas</span>
              </div>
              
              <div className="space-y-4">
                {reminders.map((reminder, index) => (
                  <AnimatedSection key={index} animation="slide-left" delay={300 + index * 150} duration={400}>
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-full ${colorClasses[reminder.color as keyof typeof colorClasses]} flex items-center justify-center flex-shrink-0`}>
                        <reminder.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{reminder.type}</span>
                          <span className="text-xs text-gray-400">{reminder.time}</span>
                        </div>
                        <p className="text-sm text-gray-600">{reminder.message}</p>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </AnimatedSection>
          
          {/* Text Content */}
          <AnimatedSection animation="slide-up" duration={500} className="order-1 lg:order-2">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-6">
                <Bell className="w-4 h-4" />
                Recordatorios Automaticos
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Reduce la morosidad sin esfuerzo manual
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                El sistema envia recordatorios automaticos a tus pacientes via WhatsApp o Email, 
                tanto para confirmar turnos como para gestionar pagos pendientes.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: MessageCircle, text: 'Recordatorios de turno por WhatsApp' },
                  { icon: DollarSign, text: 'Avisos de cobro automaticos' },
                  { icon: CheckCircle2, text: 'Confirmaciones de asistencia' },
                  { icon: Clock, text: 'Programacion flexible de envios' },
                ].map((item, index) => (
                  <AnimatedSection key={index} animation="slide-left" delay={100 + index * 100} duration={400}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="text-gray-700">{item.text}</span>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection animation="scale" duration={600}>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Seguridad de nivel clinico
                </h3>
                <p className="text-gray-600">
                  Todos los datos de tus pacientes estan encriptados de extremo a extremo. 
                  Cumplimos con los mas altos estandares de seguridad para proteger la informacion sensible.
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">256-bit</div>
                  <div className="text-gray-500">Encriptacion</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">E2E</div>
                  <div className="text-gray-500">Extremo a extremo</div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function CTASection() {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-purple-700">
      <div className="max-w-4xl mx-auto text-center">
        <AnimatedSection animation="slide-up" duration={500}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Comienza a gestionar tu consultorio de forma inteligente
          </h2>
        </AnimatedSection>
        <AnimatedSection animation="fade" delay={200} duration={500}>
          <p className="text-lg text-indigo-100 mb-8">
            Unete a profesionales que ya ahorraron horas de trabajo administrativo
          </p>
        </AnimatedSection>
        <AnimatedSection animation="slide-up" delay={300} duration={500}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-6 text-lg shadow-lg"
            >
              Crear cuenta gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-6 text-lg border-white/30 text-white hover:bg-white/10"
            >
              Iniciar sesion
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Lavenius</span>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} Lavenius. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <AnalyticsSection />
      <RemindersSection />
      <SecuritySection />
      <CTASection />
      <Footer />
    </div>
  );
}
