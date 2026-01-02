# Guía de Integración API - Frontend Lavenius

## 🎯 Objetivo

Integrar el frontend React con el backend NestJS utilizando el patrón BFF (Backend for Frontend) con encriptación E2E.

## 🔧 Configuración Inicial

### 1. Variables de Entorno

Crear archivo `.env` en la raíz del proyecto frontend:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_API_TIMEOUT=30000
```

### 2. Estructura de Archivos Sugerida

```
src/
├── api/
│   ├── client.ts              # Cliente Axios configurado
│   ├── interceptors.ts        # Interceptores de request/response
│   └── services/
│       ├── auth.service.ts    # Servicio de autenticación
│       ├── patient.service.ts # Servicio de pacientes
│       ├── appointment.service.ts
│       ├── note.service.ts
│       └── payment.service.ts
├── context/
│   ├── AuthContext.tsx        # Context de autenticación
│   └── EncryptionContext.tsx  # Manejo del userKey
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
└── types/
    ├── api.types.ts           # Tipos de respuestas API
    └── auth.types.ts          # Tipos de autenticación
```

## 📦 Implementación

### 1. Cliente API Base (`src/api/client.ts`)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Agregar token JWT
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Agregar userKey para encriptación
        const userKey = this.getUserKey();
        if (userKey) {
          config.headers['x-user-key'] = userKey;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }
  
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }
  
  private getUserKey(): string | null {
    // IMPORTANTE: Almacenar userKey solo en memoria
    // Usar un context o state manager
    return sessionStorage.getItem('userKey');
  }
  
  private handleUnauthorized() {
    // Limpiar datos y redirigir a login
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('userKey');
    window.location.href = '/login';
  }
  
  public setToken(token: string) {
    localStorage.setItem('access_token', token);
  }
  
  public setUserKey(userKey: string) {
    // IMPORTANTE: Solo en sessionStorage (se borra al cerrar navegador)
    sessionStorage.setItem('userKey', userKey);
  }
  
  public clearAuth() {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('userKey');
  }
  
  public getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient.getInstance();
```

### 2. Servicio de Autenticación (`src/api/services/auth.service.ts`)

```typescript
import apiClient from '../client';

export interface RegisterDto {
  email: string;
  password: string;
  passphrase: string;
  firstName: string;
  lastName: string;
  phone?: string;
  licenseNumber?: string;
}

export interface LoginDto {
  email: string;
  password: string;
  passphrase: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  userKey: string;
}

export interface ChangePassphraseDto {
  currentPassphrase: string;
  newPassphrase: string;
}

class AuthService {
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.getInstance().post('/auth/register', data);
    
    // Guardar token y userKey
    apiClient.setToken(response.data.access_token);
    apiClient.setUserKey(response.data.userKey);
    
    return response.data;
  }
  
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.getInstance().post('/auth/login', data);
    
    // Guardar token y userKey
    apiClient.setToken(response.data.access_token);
    apiClient.setUserKey(response.data.userKey);
    
    return response.data;
  }
  
  async changePassphrase(data: ChangePassphraseDto): Promise<void> {
    await apiClient.getInstance().post('/auth/change-passphrase', data);
  }
  
  logout() {
    apiClient.clearAuth();
  }
}

export const authService = new AuthService();
```

### 3. Servicio de Pacientes (`src/api/services/patient.service.ts`)

```typescript
import apiClient from '../client';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
  address?: string;
  healthInsurance?: string;
  sessionType?: 'INDIVIDUAL' | 'COUPLE' | 'FAMILY' | 'GROUP';
  frequency?: string;
  diagnosis?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
  address?: string;
  healthInsurance?: string;
  sessionType?: 'INDIVIDUAL' | 'COUPLE' | 'FAMILY' | 'GROUP';
  frequency?: string;
  diagnosis?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {}

export interface PatientDetails {
  patient: Patient;
  nextSession?: any; // Tipo Appointment
}

class PatientService {
  private basePath = '/patients';
  
  async getAll(): Promise<Patient[]> {
    const response = await apiClient.getInstance().get(this.basePath);
    return response.data;
  }
  
  async getById(id: string): Promise<Patient> {
    const response = await apiClient.getInstance().get(`${this.basePath}/${id}`);
    return response.data;
  }
  
  async getDetails(id: string): Promise<PatientDetails> {
    const response = await apiClient.getInstance().get(`${this.basePath}/${id}/details`);
    return response.data;
  }
  
  async create(data: CreatePatientDto): Promise<Patient> {
    const response = await apiClient.getInstance().post(this.basePath, data);
    return response.data;
  }
  
  async update(id: string, data: UpdatePatientDto): Promise<Patient> {
    const response = await apiClient.getInstance().patch(`${this.basePath}/${id}`, data);
    return response.data;
  }
  
  async delete(id: string): Promise<void> {
    await apiClient.getInstance().delete(`${this.basePath}/${id}`);
  }
}

export const patientService = new PatientService();
```

### 4. Context de Autenticación (`src/context/AuthContext.tsx`)

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type AuthResponse } from '../api/services/auth.service';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, passphrase: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Verificar si hay token al cargar
    const token = localStorage.getItem('access_token');
    const userKey = sessionStorage.getItem('userKey');
    
    if (token && userKey) {
      // TODO: Validar token con el backend
      // Por ahora asumimos que es válido
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const login = async (email: string, password: string, passphrase: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password, passphrase });
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      setUser(response.user);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    authService.logout();
    setUser(null);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 5. Hook Personalizado para API (`src/hooks/useApi.ts`)

```typescript
import { useState, useCallback } from 'react';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useApi<T = any, P = any>(
  apiFunction: (params: P) => Promise<T>,
  options?: UseApiOptions<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  
  const execute = useCallback(
    async (params: P) => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await apiFunction(params);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, options]
  );
  
  return { data, error, loading, execute };
}
```

## 🔐 Consideraciones de Seguridad

### 1. Almacenamiento del UserKey

⚠️ **CRÍTICO**: El `userKey` **NUNCA** debe almacenarse en `localStorage`.

```typescript
// ❌ NUNCA hacer esto
localStorage.setItem('userKey', userKey);

// ✅ Usar sessionStorage (se borra al cerrar navegador)
sessionStorage.setItem('userKey', userKey);

// ✅ Mejor: Almacenar solo en memoria (React Context/State)
const [userKey, setUserKey] = useState<string | null>(null);
```

### 2. Manejo de Tokens JWT

```typescript
// Token en localStorage (persiste entre sesiones)
localStorage.setItem('access_token', token);

// Limpiar al logout
localStorage.removeItem('access_token');
sessionStorage.removeItem('userKey');
```

### 3. HTTPS en Producción

```typescript
// En producción, asegurar HTTPS
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://api.lavenius.com'
  : 'http://localhost:3001';
```

## 📝 Ejemplo de Uso en Componente

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientService, type Patient } from '../api/services/patient.service';
import { useApi } from '../hooks/useApi';

export function PatientsList() {
  const { isAuthenticated } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  
  const { loading, error, execute } = useApi(
    patientService.getAll,
    {
      onSuccess: (data) => setPatients(data),
      onError: (err) => console.error('Error loading patients:', err),
    }
  );
  
  useEffect(() => {
    if (isAuthenticated) {
      execute({} as any);
    }
  }, [isAuthenticated]);
  
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {patients.map(patient => (
        <div key={patient.id}>
          {patient.firstName} {patient.lastName}
        </div>
      ))}
    </div>
  );
}
```

## 🚀 Checklist de Implementación

- [ ] Instalar axios: `pnpm add axios`
- [ ] Crear archivo `.env` con URL del backend
- [ ] Implementar cliente API base
- [ ] Implementar servicios (auth, patients, etc.)
- [ ] Crear AuthContext
- [ ] Actualizar componente de Login para usar AuthContext
- [ ] Probar flujo completo de autenticación
- [ ] Implementar manejo de errores global
- [ ] Agregar loading states en componentes
- [ ] Probar encriptación E2E

