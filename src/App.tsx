import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { NotFound, LoadingOverlay } from './components/shared';
import { E2EUnlockGate } from './components/auth/E2EUnlockGate';
import { AccountTypeSelection } from './components/auth/AccountTypeSelection';
import { AccountType, getUserAccountType } from './lib/auth/accountType';

const Landing = lazy(() => import('./components/landing/Landing').then(m => ({ default: m.Landing })));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Onboarding = lazy(() => import('./components/onboarding/Onboarding').then(m => ({ default: m.Onboarding })));
const PrivacyPolicy = lazy(() => import('./components/public/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./components/public/TermsOfService').then(m => ({ default: m.TermsOfService })));

// Lazy load dashboard views.
const Agenda = lazy(() => import('./components/agenda/Agenda').then(m => ({ default: m.Agenda })));
const Pacientes = lazy(() => import('./components/pacientes/Pacientes').then(m => ({ default: m.Pacientes })));
const Cobros = lazy(() => import('./components/cobros/Cobros').then(m => ({ default: m.Cobros })));
const Analitica = lazy(() => import('./components/analitica/Analitica').then(m => ({ default: m.Analitica })));
const Configuracion = lazy(() => import('./components/config/Configuracion').then(m => ({ default: m.Configuracion })));
const HelpCenter = lazy(() => import('./components/help/HelpCenter').then(m => ({ default: m.HelpCenter })));
const PublicProfile = lazy(() => import('./components/public/PublicProfile').then(m => ({ default: m.PublicProfile })));
const TherapistBooking = lazy(() => import('./components/public/TherapistBooking').then(m => ({ default: m.TherapistBooking })));

/**
 * Landing page wrapper.
 * Note: during Google OAuth verification we keep "/" always public.
 */
function LandingRoute() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user } = useUser();

  // Public route should not block on Clerk load:
  // if Clerk is slow/unavailable, still render landing.
  if (!isLoaded) {
    return (
      <Suspense fallback={<LoadingOverlay message="Cargando..." />}>
        <Landing />
      </Suspense>
    );
  }

  if (isSignedIn) {
    const accountType = getUserAccountType(user);
    if (!accountType) {
      return <Navigate to="/select-account-type" replace />;
    }

    if (accountType === AccountType.Patient) {
      return (
        <Suspense fallback={<LoadingOverlay message="Cargando..." />}>
          <Landing />
        </Suspense>
      );
    }

    const hasCompletedOnboarding = user?.unsafeMetadata?.onboardingComplete === true;
    return <Navigate to={hasCompletedOnboarding ? '/dashboard' : '/onboarding'} replace />;
  }

  return (
    <Suspense fallback={<LoadingOverlay message="Cargando..." />}>
      <Landing />
    </Suspense>
  );
}

/**
 * Protected route wrapper that also checks for onboarding completion
 * Redirects to /onboarding if user hasn't completed professional info setup
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useClerkAuth();
  const { user } = useUser();

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return <LoadingOverlay message="Cargando..." />;
  }

  const accountType = getUserAccountType(user);
  // Check onboarding status for therapist users
  const hasCompletedOnboarding = user?.unsafeMetadata?.onboardingComplete === true;

  return (
    <>
      <SignedIn>
        {!accountType ? (
          <Navigate to="/select-account-type" replace />
        ) : accountType === AccountType.Patient ? (
          <Navigate to="/" replace />
        ) : hasCompletedOnboarding ? (
          <E2EUnlockGate>
            <Suspense fallback={<LoadingOverlay message="Cargando..." />}>
              {children}
            </Suspense>
          </E2EUnlockGate>
        ) : (
          <Navigate to="/onboarding" replace />
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

/**
 * Onboarding route wrapper - only accessible to signed-in users who haven't completed onboarding
 */
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useClerkAuth();
  const { user } = useUser();

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return <LoadingOverlay message="Cargando..." />;
  }

  const accountType = getUserAccountType(user);
  // If already completed onboarding, redirect to dashboard
  const hasCompletedOnboarding = user?.unsafeMetadata?.onboardingComplete === true;

  return (
    <>
      <SignedIn>
        {!accountType ? (
          <Navigate to="/select-account-type" replace />
        ) : accountType === AccountType.Patient ? (
          <Navigate to="/" replace />
        ) : hasCompletedOnboarding ? (
          <Navigate to="/dashboard" replace />
        ) : (
          children
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function AccountTypeSelectionRoute() {
  const { isLoaded } = useClerkAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return <LoadingOverlay message="Cargando..." />;
  }

  const accountType = getUserAccountType(user);
  if (accountType === AccountType.Patient) {
    return <Navigate to="/" replace />;
  }
  if (accountType === AccountType.Therapist) {
    const hasCompletedOnboarding = user?.unsafeMetadata?.onboardingComplete === true;
    return <Navigate to={hasCompletedOnboarding ? '/dashboard' : '/onboarding'} replace />;
  }

  return (
    <>
      <SignedIn>
        <AccountTypeSelection />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function PublicBookingRoute() {
  const { isLoaded } = useClerkAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return <LoadingOverlay message="Cargando..." />;
  }

  const accountType = getUserAccountType(user);

  return (
    <>
      <SignedIn>
        {!accountType ? (
          <Navigate to="/select-account-type" replace />
        ) : accountType !== AccountType.Patient ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <Suspense fallback={<LoadingOverlay message="Cargando reservas..." />}>
            <TherapistBooking />
          </Suspense>
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

// TODO: Custom auth pages for future implementation
// Uncomment these routes and imports when switching from Clerk Account Portal to custom pages
// import { SignIn, SignUp } from '@clerk/clerk-react';
// 
// function AuthPageWrapper({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//       {children}
//     </div>
//   );
// }

export default function App() {
  return (
    <Routes>
      {/* Landing page - redirects to dashboard if already logged in */}
      <Route path="/" element={<LandingRoute />} />
      <Route path="/select-account-type" element={<AccountTypeSelectionRoute />} />
      
      {/* Onboarding route - for new users to complete professional info */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />

      {/* Public legal route */}
      <Route
        path="/privacy-policy"
        element={(
          <Suspense fallback={<LoadingOverlay message="Cargando..." />}>
            <PrivacyPolicy />
          </Suspense>
        )}
      />
      <Route
        path="/terms-of-service"
        element={(
          <Suspense fallback={<LoadingOverlay message="Cargando..." />}>
            <TermsOfService />
          </Suspense>
        )}
      />
      <Route path="/book/:therapistId" element={<PublicBookingRoute />} />
      
      {/* TODO: Custom Clerk Auth routes for future implementation
       * Uncomment when switching from Clerk Account Portal to custom pages
       * Also uncomment the AuthPageWrapper and imports above
       */}
      {/* <Route 
        path="/login/*" 
        element={
          <AuthPageWrapper>
            <SignIn 
              routing="path" 
              path="/login" 
              signUpUrl="/register"
              afterSignInUrl="/onboarding"
            />
          </AuthPageWrapper>
        } 
      />
      <Route 
        path="/register/*" 
        element={
          <AuthPageWrapper>
            <SignUp 
              routing="path" 
              path="/register" 
              signInUrl="/login"
              afterSignUpUrl="/onboarding"
            />
          </AuthPageWrapper>
        } 
      /> */}
      
      {/* Protected dashboard routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        {/* Default: Dashboard (Analitica) */}
        <Route index element={
          <Suspense fallback={<LoadingOverlay message="Cargando dashboard..." />}>
            <Analitica />
          </Suspense>
        } />
        
        {/* Dashboard child routes */}
        <Route path="agenda" element={
          <Suspense fallback={<LoadingOverlay message="Cargando agenda..." />}>
            <Agenda />
          </Suspense>
        } />
        <Route path="pacientes" element={
          <Suspense fallback={<LoadingOverlay message="Cargando pacientes..." />}>
            <Pacientes />
          </Suspense>
        } />
        <Route path="cobros" element={
          <Suspense fallback={<LoadingOverlay message="Cargando cobros..." />}>
            <Cobros />
          </Suspense>
        } />
        {/* Legacy route for backwards compatibility */}
        <Route path="analitica" element={<Navigate to="/dashboard" replace />} />
        <Route path="configuracion" element={
          <Suspense fallback={<LoadingOverlay message="Cargando configuración..." />}>
            <Configuracion />
          </Suspense>
        } />
        <Route path="perfil" element={<Navigate to="/dashboard/configuracion?tab=profile" replace />} />
        <Route path="ayuda" element={
          <Suspense fallback={<LoadingOverlay message="Cargando ayuda..." />}>
            <HelpCenter />
          </Suspense>
        } />
      </Route>
      
      {/* Public profile preview (authenticated — therapist previews their own profile) */}
      <Route
        path="/perfil-publico"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingOverlay message="Cargando..." />}>
              <PublicProfile />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* 404 - Catch all unmatched routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
