import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Landing } from './components/landing';
import { Login, Register } from './components/auth';
import { Dashboard } from './components/dashboard';
import { NotFound, LoadingOverlay } from './components/shared';
import { useAuth } from './lib/hooks';
import { useAuthStore } from './lib/stores';

// Lazy load dashboard views
const Agenda = lazy(() => import('./components/agenda/Agenda').then(m => ({ default: m.Agenda })));
const Pacientes = lazy(() => import('./components/pacientes/Pacientes').then(m => ({ default: m.Pacientes })));
const Cobros = lazy(() => import('./components/cobros/Cobros').then(m => ({ default: m.Cobros })));
const Analitica = lazy(() => import('./components/analitica/Analitica').then(m => ({ default: m.Analitica })));
const Configuracion = lazy(() => import('./components/config/Configuracion').then(m => ({ default: m.Configuracion })));
const Perfil = lazy(() => import('./components/perfil/Perfil').then(m => ({ default: m.Perfil })));
const HelpCenter = lazy(() => import('./components/help/HelpCenter').then(m => ({ default: m.HelpCenter })));

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);

  // Verify auth state on mount (check if userKey exists)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
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
