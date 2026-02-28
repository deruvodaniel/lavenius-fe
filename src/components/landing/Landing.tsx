import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import type { LucideIcon } from 'lucide-react';
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
  Sparkles,
  Check,
  X,
  Zap,
  Crown,
  Star,
  Lock,
  CreditCard,
  Infinity as InfinityIcon,
  Menu,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SwipeableCards } from '@/components/analitica/DashboardComponents';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimatedSection, LanguageSwitcher, BetaBadge } from '@/components/shared';

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
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };
  
  const navLinks = [
    { key: 'features', sectionId: 'features' },
    { key: 'pricing', sectionId: 'pricing' },
    { key: 'faq', sectionId: 'faq' },
    { key: 'contact', sectionId: 'contact' },
  ];
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('landing.brand')}
            </span>
            <BetaBadge />
          </div>
          
          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.key}
                onClick={() => scrollToSection(link.sectionId)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                {t(`landing.nav.${link.key}`)}
              </button>
            ))}
          </div>
          
          {/* Right side: Language + Auth + Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher variant="buttons" />
            </div>
            
            {/* Signed Out: Show Sign In + Sign Up buttons with Clerk */}
            <SignedOut>
              <SignInButton mode="modal">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="hidden sm:inline-flex text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {t('landing.cta.login')}
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all"
                >
                  {t('landing.hero.cta')}
                </Button>
              </SignUpButton>
            </SignedOut>
            
            {/* Signed In: Show Dashboard link + User avatar */}
            <SignedIn>
              <Button
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all"
              >
                {t('landing.nav.dashboard', 'Dashboard')}
              </Button>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9 ring-2 ring-transparent hover:ring-indigo-500/50 transition-all',
                    userButtonTrigger: 'focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none rounded-full',
                  }
                }}
              />
            </SignedIn>
            
            {/* Mobile menu button - Always at the end */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.key}
                  onClick={() => scrollToSection(link.sectionId)}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  {t(`landing.nav.${link.key}`)}
                </button>
              ))}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                <div className="px-4 py-2">
                  <LanguageSwitcher variant="buttons" />
                </div>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      {t('landing.cta.login')}
                    </button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function HeroSection() {
  const { t } = useTranslation();
  
  return (
    <section className="pt-28 pb-16 lg:pt-32 lg:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left">
            <AnimatedSection animation="fade" duration={400}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6 shadow-sm">
                <Shield className="w-4 h-4" />
                {t('landing.hero.badge')}
              </div>
            </AnimatedSection>
            
            <AnimatedSection animation="slide-up" delay={100} duration={500}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                {t('landing.hero.title')}
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  {t('landing.hero.titleHighlight')}
                </span>
              </h1>
            </AnimatedSection>
            
            <AnimatedSection animation="slide-up" delay={200} duration={500}>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('landing.hero.description')}
              </p>
            </AnimatedSection>
            
            <AnimatedSection animation="slide-up" delay={300} duration={500}>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <SignUpButton mode="modal">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                  >
                    {t('landing.hero.cta')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-6 text-lg border-2 hover:bg-gray-50"
                  >
                    {t('landing.hero.hasAccount')}
                  </Button>
                </SignInButton>
              </div>
            </AnimatedSection>
            
            <AnimatedSection animation="fade" delay={500} duration={600}>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-10 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{t('landing.hero.noCreditCard')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{t('landing.hero.dataEncrypted')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{t('landing.hero.supportIncluded')}</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
          
          {/* Right: Dashboard Preview */}
          <AnimatedSection animation="scale" delay={200} duration={700}>
            <div className="relative">
              {/* Glow effect behind */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl blur-2xl opacity-20 scale-105" />
              
              {/* Dashboard mockup */}
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Browser-like header */}
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white rounded-md px-4 py-1 text-xs text-gray-500 border border-gray-200">
                      app.lavenius.com
                    </div>
                  </div>
                </div>
                
                {/* Dashboard content */}
                <div className="p-4 bg-gray-50">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{t('landing.hero.preview.income', 'Ingresos')}</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">$485.000</div>
                      <div className="text-xs text-emerald-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +12%
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>{t('landing.hero.preview.sessions', 'Sesiones')}</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">42</div>
                      <div className="text-xs text-gray-400">{t('landing.hero.preview.thisMonth', 'este mes')}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Users className="w-3 h-3" />
                        <span>{t('landing.hero.preview.patients', 'Pacientes')}</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">18</div>
                      <div className="text-xs text-gray-400">{t('landing.hero.preview.active', 'activos')}</div>
                    </div>
                  </div>
                  
                  {/* Mini calendar preview */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">{t('landing.hero.preview.todayAgenda', 'Agenda de hoy')}</span>
                      <span className="text-xs text-indigo-600 font-medium">5 {t('landing.hero.preview.appointments', 'turnos')}</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { time: '09:00', name: 'María García', color: 'indigo' },
                        { time: '10:30', name: 'Carlos López', color: 'purple' },
                        { time: '14:00', name: 'Ana Martínez', color: 'emerald' },
                      ].map((apt, i) => (
                        <div key={i} className="flex items-center gap-3 py-1.5">
                          <span className="text-xs text-gray-500 w-10">{apt.time}</span>
                          <div className={`w-1 h-6 rounded-full bg-${apt.color}-500`} />
                          <span className="text-sm text-gray-700">{apt.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Payment reminder */}
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-600" />
                      <span className="text-xs text-amber-800">
                        {t('landing.hero.preview.pendingPayment', '2 cobros pendientes por $24.000')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: Calendar,
      titleKey: 'landing.features.scheduler.title',
      descriptionKey: 'landing.features.scheduler.description',
      color: 'indigo',
    },
    {
      icon: DollarSign,
      titleKey: 'landing.features.payments.title',
      descriptionKey: 'landing.features.payments.description',
      color: 'emerald',
    },
    {
      icon: FileText,
      titleKey: 'landing.features.records.title',
      descriptionKey: 'landing.features.records.description',
      color: 'purple',
    },
    {
      icon: RefreshCw,
      titleKey: 'landing.features.calendar.title',
      descriptionKey: 'landing.features.calendar.description',
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
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection animation="slide-up" duration={500}>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <AnimatedSection 
              key={feature.titleKey} 
              animation="slide-up" 
              delay={index * 100} 
              duration={500}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white h-full">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-gray-600 text-sm">{t(feature.descriptionKey)}</p>
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
  const { t } = useTranslation();
  
  const analyticsFeatures = [
    t('landing.analytics.features.income'),
    t('landing.analytics.features.sessions'),
    t('landing.analytics.features.patients'),
    t('landing.analytics.features.attendance'),
  ];
  
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <AnimatedSection animation="slide-up" duration={500}>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-medium mb-6">
                <BarChart3 className="w-4 h-4" />
                {t('landing.analytics.badge')}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                {t('landing.analytics.title')}
              </h2>
              <p className="text-lg text-indigo-200 mb-8">
                {t('landing.analytics.description')}
              </p>
              
              <div className="space-y-4">
                {analyticsFeatures.map((item, index) => (
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
                    {t('landing.analytics.stats.monthlyIncome')}
                  </div>
                  <div className="text-2xl font-bold text-white">{mockStats.ingresosMes}</div>
                  <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    {t('landing.analytics.stats.vsLastMonth')}
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-indigo-300 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    {t('landing.analytics.stats.sessions')}
                  </div>
                  <div className="text-2xl font-bold text-white">{mockStats.sesionesRealizadas}</div>
                  <div className="text-xs text-indigo-300 mt-1">{t('landing.analytics.stats.thisMonth')}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-indigo-300 text-sm mb-1">
                    <Users className="w-4 h-4" />
                    {t('landing.analytics.stats.activePatients')}
                  </div>
                  <div className="text-2xl font-bold text-white">{mockStats.pacientesActivos}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-indigo-300 text-sm mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('landing.analytics.stats.collectionRate')}
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">{mockStats.tasaCobro}</div>
                </div>
              </div>
              
              {/* Mini Chart */}
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-sm text-indigo-300 mb-3">{t('landing.analytics.stats.lastSixMonths')}</div>
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
  const { t } = useTranslation();
  
  const reminders = [
    {
      type: t('landing.reminders.types.whatsapp'),
      icon: MessageCircle,
      message: t('landing.reminders.messages.sessionReminder'),
      time: t('landing.reminders.timestamps.sentAutomatically'),
      color: 'green',
    },
    {
      type: t('landing.reminders.types.pendingPayment'),
      icon: DollarSign,
      message: t('landing.reminders.messages.paymentReminder'),
      time: t('landing.reminders.timestamps.reminderSent'),
      color: 'amber',
    },
    {
      type: t('landing.reminders.types.confirmation'),
      icon: CheckCircle2,
      message: t('landing.reminders.messages.appointmentConfirmed'),
      time: t('landing.reminders.timestamps.fiveMinutesAgo'),
      color: 'emerald',
    },
  ];
  
  const reminderFeatures = [
    { icon: MessageCircle, text: t('landing.reminders.features.whatsapp') },
    { icon: DollarSign, text: t('landing.reminders.features.payments') },
    { icon: CheckCircle2, text: t('landing.reminders.features.confirmations') },
    { icon: Clock, text: t('landing.reminders.features.scheduling') },
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
                <span className="font-semibold text-gray-900">{t('landing.reminders.notifications')}</span>
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
                {t('landing.reminders.badge')}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                {t('landing.reminders.title')}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {t('landing.reminders.description')}
              </p>
              
              <div className="space-y-4">
                {reminderFeatures.map((item, index) => (
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
  const { t } = useTranslation();
  
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
                  {t('landing.security.title')}
                </h3>
                <p className="text-gray-600">
                  {t('landing.security.description')}
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">256-bit</div>
                  <div className="text-gray-500">{t('landing.security.encryption')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">E2E</div>
                  <div className="text-gray-500">{t('landing.security.e2e')}</div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// Hook for animated counter
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnView); // Initialize based on prop
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted, startOnView]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

// Animated stat card component
function AnimatedStatCard({ 
  numericValue, 
  prefix = '', 
  suffix = '', 
  label, 
  icon: Icon,
  delay = 0 
}: { 
  numericValue: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon: LucideIcon;
  delay?: number;
}) {
  const { count, ref } = useCountUp(numericValue, 2000);
  
  return (
    <AnimatedSection animation="scale" delay={delay} duration={500}>
      <div ref={ref} className="bg-white rounded-2xl p-8 shadow-lg text-center border border-gray-100">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {prefix}{count.toLocaleString()}{suffix}
        </div>
        <div className="text-gray-500 font-medium">{label}</div>
      </div>
    </AnimatedSection>
  );
}

function SocialProofSection() {
  const { t } = useTranslation();
  
  const stats = [
    {
      numericValue: 500,
      prefix: '+',
      suffix: '',
      label: t('landing.socialProof.stats.professionalsLabel'),
      icon: Users,
    },
    {
      numericValue: 10000,
      prefix: '+',
      suffix: '',
      label: t('landing.socialProof.stats.sessionsLabel'),
      icon: Calendar,
    },
    {
      numericValue: 5,
      prefix: '+$',
      suffix: 'M',
      label: t('landing.socialProof.stats.collectedLabel'),
      icon: DollarSign,
    },
  ];
  
  const testimonials = [
    {
      quote: t('landing.socialProof.testimonials.1.quote'),
      name: t('landing.socialProof.testimonials.1.name'),
      role: t('landing.socialProof.testimonials.1.role'),
    },
    {
      quote: t('landing.socialProof.testimonials.2.quote'),
      name: t('landing.socialProof.testimonials.2.name'),
      role: t('landing.socialProof.testimonials.2.role'),
    },
    {
      quote: t('landing.socialProof.testimonials.3.quote'),
      name: t('landing.socialProof.testimonials.3.name'),
      role: t('landing.socialProof.testimonials.3.role'),
    },
  ];
  
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection animation="slide-up" duration={500}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              {t('landing.socialProof.badge')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('landing.socialProof.title')}
            </h2>
          </div>
        </AnimatedSection>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <AnimatedStatCard
              key={stat.label}
              numericValue={stat.numericValue}
              prefix={stat.prefix}
              suffix={stat.suffix}
              label={stat.label}
              icon={stat.icon}
              delay={index * 100}
            />
          ))}
        </div>
        
        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <AnimatedSection key={index} animation="slide-up" delay={200 + index * 100} duration={500}>
              <Card className="border-0 shadow-lg bg-white h-full">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-gray-600 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {testimonial.name.split(' ').slice(1, 3).map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                      <div className="text-xs text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyLaveniusSection() {
  const { t } = useTranslation();
  
  const features = [
    {
      key: 'unlimited',
      icon: InfinityIcon,
      color: 'indigo',
    },
    {
      key: 'encryption',
      icon: Lock,
      color: 'emerald',
    },
    {
      key: 'localPricing',
      icon: CreditCard,
      color: 'purple',
    },
    {
      key: 'noContracts',
      icon: CheckCircle2,
      color: 'amber',
    },
  ];
  
  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
      highlight: 'bg-indigo-500',
    },
    emerald: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
      highlight: 'bg-emerald-500',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      highlight: 'bg-purple-500',
    },
    amber: {
      bg: 'bg-amber-100',
      text: 'text-amber-600',
      highlight: 'bg-amber-500',
    },
  };
  
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection animation="slide-up" duration={500}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t('landing.whyLavenius.badge')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('landing.whyLavenius.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('landing.whyLavenius.subtitle')}
            </p>
          </div>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color as keyof typeof colorClasses];
            return (
              <AnimatedSection key={feature.key} animation="slide-up" delay={index * 100} duration={500}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all h-full group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${colors.highlight} mb-3`}>
                      {t(`landing.whyLavenius.features.${feature.key}.highlight`)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t(`landing.whyLavenius.features.${feature.key}.title`)}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {t(`landing.whyLavenius.features.${feature.key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const { t } = useTranslation();
  
  const questions = [
    'security',
    'cancel',
    'modality',
    'patientLimit',
    'trial',
    'support',
  ];
  
  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection animation="slide-up" duration={500}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <MessageCircle className="w-4 h-4" />
              {t('landing.faq.badge')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('landing.faq.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('landing.faq.subtitle')}
            </p>
          </div>
        </AnimatedSection>
        
        <AnimatedSection animation="fade" delay={200} duration={600}>
          <Accordion type="single" collapsible className="space-y-4">
            {questions.map((questionKey) => (
              <AccordionItem
                key={questionKey}
                value={questionKey}
                className="bg-white rounded-xl border-0 shadow-md overflow-hidden px-6"
              >
                <AccordionTrigger className="text-left font-medium text-gray-900 hover:no-underline py-5">
                  {t(`landing.faq.questions.${questionKey}.question`)}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-5 leading-relaxed">
                  {t(`landing.faq.questions.${questionKey}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimatedSection>
      </div>
    </section>
  );
}

interface PricingPlan {
  id: string;
  nameKey: string;
  priceKey: string;
  periodKey: string;
  descriptionKey: string;
  featuresKeys: string[];
  notIncludedKeys: string[];
  popular: boolean;
  icon: LucideIcon;
  color: string;
}

function PricingCard({ 
  plan, 
  t, 
  compactMobile = false 
}: { 
  plan: PricingPlan; 
  t: (key: string) => string;
  compactMobile?: boolean;
}) {
  const visibleFeatures = compactMobile ? plan.featuresKeys.slice(0, 5) : plan.featuresKeys;

  return (
    <Card className={`relative border-0 shadow-lg hover:shadow-xl transition-all h-full flex flex-col ${
      plan.popular
        ? 'ring-2 ring-purple-500 bg-white scale-[1.01]'
        : 'bg-white'
    } ${
      compactMobile ? 'min-h-[520px]' : ''
    }`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium px-4 py-1 rounded-full shadow-lg">
            {t('landing.pricing.popular')}
          </span>
        </div>
      )}
      <CardContent className={`flex flex-col h-full ${compactMobile ? 'p-5' : 'p-6'}`}>
        <div className={`text-center ${compactMobile ? 'mb-4' : 'mb-6'}`}>
          <div className={`mx-auto rounded-xl flex items-center justify-center ${compactMobile ? 'w-10 h-10 mb-3' : 'w-12 h-12 mb-4'} ${
            plan.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
            plan.color === 'purple' ? 'bg-purple-100 text-purple-600' :
            'bg-amber-100 text-amber-600'
          }`}>
            <plan.icon className={compactMobile ? 'w-5 h-5' : 'w-6 h-6'} />
          </div>
          <h3 className={`font-bold text-gray-900 mb-2 ${compactMobile ? 'text-lg' : 'text-xl'}`}>{t(plan.nameKey)}</h3>
          <p className="text-gray-500 text-sm mb-3">{t(plan.descriptionKey)}</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className={`${compactMobile ? 'text-3xl' : 'text-4xl'} font-bold text-gray-900`}>{t(plan.priceKey)}</span>
            <span className="text-gray-500 text-sm">{t(plan.periodKey)}</span>
          </div>
        </div>
        <div className="flex-1">
          <ul className={`${compactMobile ? 'space-y-2.5 mb-4' : 'space-y-3 mb-6'}`}>
            {visibleFeatures.map((featureKey, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-600 text-sm">{t(featureKey)}</span>
              </li>
            ))}
            {!compactMobile && plan.notIncludedKeys.map((featureKey, i) => (
              <li key={`not-${i}`} className="flex items-start gap-3 opacity-50">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X className="w-3 h-3 text-gray-400" />
                </div>
                <span className="text-gray-400 text-sm">{t(featureKey)}</span>
              </li>
            ))}
          </ul>
        </div>
        <SignUpButton mode="modal">
          <Button
            className={`w-full py-6 ${
              plan.popular
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            {t('landing.pricing.cta')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </SignUpButton>
      </CardContent>
    </Card>
  );
}

function PricingSection() {
  const { t } = useTranslation();
  
  const plans = [
    {
      id: 'basic',
      nameKey: 'landing.pricing.plans.basic.name',
      priceKey: 'landing.pricing.plans.basic.price',
      periodKey: 'landing.pricing.period',
      descriptionKey: 'landing.pricing.plans.basic.description',
      featuresKeys: [
        'landing.pricing.plans.basic.features.patients',
        'landing.pricing.plans.basic.features.agenda',
        'landing.pricing.plans.basic.features.clinicalFiles',
        'landing.pricing.plans.basic.features.payments',
        'landing.pricing.plans.basic.features.googleCalendar',
        'landing.pricing.plans.basic.features.encryption',
      ],
      notIncludedKeys: [
        'landing.pricing.plans.basic.notIncluded.whatsapp',
        'landing.pricing.plans.basic.notIncluded.analytics',
        'landing.pricing.plans.basic.notIncluded.ai',
      ],
      popular: false,
      icon: Users,
      color: 'indigo',
    },
    {
      id: 'professional',
      nameKey: 'landing.pricing.plans.professional.name',
      priceKey: 'landing.pricing.plans.professional.price',
      periodKey: 'landing.pricing.period',
      descriptionKey: 'landing.pricing.plans.professional.description',
      featuresKeys: [
        'landing.pricing.plans.professional.features.allBasic',
        'landing.pricing.plans.professional.features.whatsapp',
        'landing.pricing.plans.professional.features.analytics',
        'landing.pricing.plans.professional.features.paymentTracking',
        'landing.pricing.plans.professional.features.reports',
        'landing.pricing.plans.professional.features.prioritySupport',
      ],
      notIncludedKeys: [
        'landing.pricing.plans.professional.notIncluded.ai',
      ],
      popular: true,
      icon: Zap,
      color: 'purple',
    },
    {
      id: 'premium',
      nameKey: 'landing.pricing.plans.premium.name',
      priceKey: 'landing.pricing.plans.premium.price',
      periodKey: 'landing.pricing.period',
      descriptionKey: 'landing.pricing.plans.premium.description',
      featuresKeys: [
        'landing.pricing.plans.premium.features.allProfessional',
        'landing.pricing.plans.premium.features.aiNotes',
        'landing.pricing.plans.premium.features.aiSummaries',
        'landing.pricing.plans.premium.features.customBranding',
        'landing.pricing.plans.premium.features.apiAccess',
        'landing.pricing.plans.premium.features.dedicatedSupport',
      ],
      notIncludedKeys: [],
      popular: false,
      icon: Crown,
      color: 'amber',
    },
  ];
  
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection animation="slide-up" duration={500}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
              <DollarSign className="w-4 h-4" />
              {t('landing.pricing.badge')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>
        </AnimatedSection>
        
        {/* Mobile: swipeable cards with arrows and indicators */}
        <div className="md:hidden">
          <SwipeableCards peek>
            {plans.map((plan) => (
              <div key={plan.id} className="w-full">
                <PricingCard plan={plan} t={t} compactMobile />
              </div>
            ))}
          </SwipeableCards>
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:grid grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <AnimatedSection
              key={plan.id}
              animation="slide-up"
              delay={index * 150}
              duration={500}
            >
              <PricingCard plan={plan} t={t} />
            </AnimatedSection>
          ))}
        </div>
        
        {/* Trust badges */}
        <AnimatedSection animation="fade" delay={500} duration={600}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              {t('landing.pricing.trustBadges.encryption')}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {t('landing.pricing.trustBadges.cancelAnytime')}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              {t('landing.pricing.trustBadges.freeTrial')}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function CTASection() {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-purple-700">
      <div className="max-w-4xl mx-auto text-center">
        <AnimatedSection animation="slide-up" duration={500}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            {t('landing.cta.title')}
          </h2>
        </AnimatedSection>
        <AnimatedSection animation="fade" delay={200} duration={500}>
          <p className="text-lg text-indigo-100 mb-8">
            {t('landing.cta.subtitle')}
          </p>
        </AnimatedSection>
        <AnimatedSection animation="slide-up" delay={300} duration={500}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignUpButton mode="modal">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto !bg-white !text-indigo-600 hover:!bg-indigo-50 px-8 py-6 text-lg shadow-lg"
              >
                {t('landing.cta.createAccount')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 py-6 text-lg !border-white/30 !text-white hover:!bg-white/10 !bg-transparent"
              >
                {t('landing.cta.login')}
              </Button>
            </SignInButton>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com/lavenius', label: t('landing.footer.social.instagram') },
    { icon: Twitter, href: 'https://twitter.com/lavenius', label: t('landing.footer.social.twitter') },
    { icon: Linkedin, href: 'https://linkedin.com/company/lavenius', label: t('landing.footer.social.linkedin') },
  ];
  
  return (
    <footer id="contact" className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-gray-800">
          {/* Brand section */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">{t('landing.brand')}</span>
            </div>
            <p className="text-sm text-gray-500 text-center md:text-left max-w-xs">
              {t('landing.footer.tagline')}
            </p>
          </div>

          {/* Contact section */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t('landing.footer.contact.title')}
            </h3>
            <div className="flex flex-col gap-3">
              <a 
                href="tel:+5411123456789" 
                className="flex items-center gap-2 text-sm transition-colors hover:text-indigo-400"
              >
                <Phone className="w-4 h-4" />
                <span>+54 11 1234-5678</span>
              </a>
              <a 
                href="mailto:contacto@lavenius.com" 
                className="flex items-center gap-2 text-sm transition-colors hover:text-indigo-400"
              >
                <Mail className="w-4 h-4" />
                <span>contacto@lavenius.com</span>
              </a>
            </div>
          </div>

          {/* Social section */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t('landing.footer.social.title')}
            </h3>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center transition-all hover:bg-gradient-to-br hover:from-indigo-600 hover:to-purple-600 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                >
                  <social.icon className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 text-center text-sm">
          © {currentYear} {t('landing.brand')}. {t('landing.footer.rights')}
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// STICKY MOBILE CTA
// ============================================================================

function StickyMobileCTA() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (roughly 500px)
      const scrollY = window.scrollY;
      const heroHeight = 500;
      
      // Hide when near pricing section or footer
      const pricingSection = document.getElementById('pricing');
      const pricingTop = pricingSection?.getBoundingClientRect().top || Infinity;
      
      // Show CTA only when: past hero AND not near pricing section
      const shouldShow = scrollY > heroHeight && pricingTop > 200;
      
      setIsVisible(shouldShow);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-lg">
        <SignedOut>
          <SignUpButton mode="modal">
            <Button 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-base font-semibold shadow-md"
            >
              {t('landing.hero.cta')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-base font-semibold shadow-md"
          >
            {t('landing.nav.dashboard')}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </SignedIn>
      </div>
    </div>
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
      <SocialProofSection />
      <WhyLaveniusSection />
      <FAQSection />
      <PricingSection />
      <CTASection />
      <Footer />
      <StickyMobileCTA />
    </div>
  );
}
