import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Login, Register } from './components/auth';
import { Dashboard } from './components/dashboard';
import { useAuth } from './lib/hooks';
import { useAuthStore } from './lib/stores';

export default function App() {
  const { isAuthenticated } = useAuth();
  const checkAuth = useAuthStore(state => state.checkAuth);

  // Verify auth state on mount (check if userKey exists)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/dashboard" 
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
