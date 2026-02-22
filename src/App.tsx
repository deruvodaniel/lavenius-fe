import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { Landing } from './components/landing';
import { Dashboard } from './components/dashboard';
import { NotFound, LoadingOverlay } from './components/shared';

// Lazy load dashboard views
const Agenda = lazy(() => import('./components/agenda/Agenda').then(m => ({ default: m.Agenda })));
const Pacientes = lazy(() => import('./components/pacientes/Pacientes').then(m => ({ default: m.Pacientes })));
const Cobros = lazy(() => import('./components/cobros/Cobros').then(m => ({ default: m.Cobros })));
const Analitica = lazy(() => import('./components/analitica/Analitica').then(m => ({ default: m.Analitica })));
const Configuracion = lazy(() => import('./components/config/Configuracion').then(m => ({ default: m.Configuracion })));
const Perfil = lazy(() => import('./components/perfil/Perfil').then(m => ({ default: m.Perfil })));
const HelpCenter = lazy(() => import('./components/help/HelpCenter').then(m => ({ default: m.HelpCenter })));

// Protected route wrapper using Clerk
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return <LoadingOverlay message="Cargando..." />;
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
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
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      
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
              afterSignInUrl="/dashboard"
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
              afterSignUpUrl="/dashboard"
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
        {/* Default redirect to agenda */}
        <Route index element={<Navigate to="agenda" replace />} />
        
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
        <Route path="analitica" element={
          <Suspense fallback={<LoadingOverlay message="Cargando analítica..." />}>
            <Analitica />
          </Suspense>
        } />
        <Route path="configuracion" element={
          <Suspense fallback={<LoadingOverlay message="Cargando configuración..." />}>
            <Configuracion />
          </Suspense>
        } />
        <Route path="perfil" element={
          <Suspense fallback={<LoadingOverlay message="Cargando perfil..." />}>
            <Perfil />
          </Suspense>
        } />
        <Route path="ayuda" element={
          <Suspense fallback={<LoadingOverlay message="Cargando ayuda..." />}>
            <HelpCenter />
          </Suspense>
        } />
      </Route>
      
      {/* 404 - Catch all unmatched routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
