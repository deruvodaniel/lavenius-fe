import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { Landing } from './components/landing';
import { Dashboard } from './components/dashboard';
import { Onboarding } from './components/onboarding';
import { NotFound, LoadingOverlay } from './components/shared';

// Lazy load dashboard views
const Agenda = lazy(() => import('./components/agenda/Agenda').then(m => ({ default: m.Agenda })));
const Pacientes = lazy(() => import('./components/pacientes/Pacientes').then(m => ({ default: m.Pacientes })));
const Cobros = lazy(() => import('./components/cobros/Cobros').then(m => ({ default: m.Cobros })));
const Analitica = lazy(() => import('./components/analitica/Analitica').then(m => ({ default: m.Analitica })));
const Configuracion = lazy(() => import('./components/config/Configuracion').then(m => ({ default: m.Configuracion })));
const HelpCenter = lazy(() => import('./components/help/HelpCenter').then(m => ({ default: m.HelpCenter })));
const PublicProfile = lazy(() => import('./components/public/PublicProfile').then(m => ({ default: m.PublicProfile })));

/**
 * Landing page wrapper that redirects authenticated users to dashboard
 * Only redirects ONCE after login - subsequent visits to landing are allowed
 * This improves UX by not requiring users to click "Dashboard" after login
 */
function LandingRoute() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user } = useUser();

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return <LoadingOverlay message="Cargando..." />;
  }

  // If user is signed in, check if we should redirect
  if (isSignedIn) {
    const hasCompletedOnboarding = user?.unsafeMetadata?.onboardingComplete === true;
    const redirectKey = `lavenius_redirected_${user?.id}`;
    const hasRedirected = sessionStorage.getItem(redirectKey);

    // Only redirect once per session (after login)
    // If user manually navigates to landing later, they can see it
    if (!hasRedirected) {
      sessionStorage.setItem(redirectKey, 'true');
      
      if (!hasCompletedOnboarding) {
        return <Navigate to="/onboarding" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Show landing page for non-authenticated users OR logged-in users who already redirected
  return <Landing />;
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

  // Check onboarding status for signed-in users
  const hasCompletedOnboarding = user?.unsafeMetadata?.onboardingComplete === true;

  return (
    <>
      <SignedIn>
        {hasCompletedOnboarding ? (
          children
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

  // If already completed onboarding, redirect to dashboard
  const hasCompletedOnboarding = user?.unsafeMetadata?.onboardingComplete === true;

  return (
    <>
      <SignedIn>
        {hasCompletedOnboarding ? (
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
      
      {/* Onboarding route - for new users to complete professional info */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />
      
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
