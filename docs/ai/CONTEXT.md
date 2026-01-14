# System Context

> **Actualizado**: Enero 14, 2026

## Tech Stack
- React 18.3.1 + TypeScript 5.9.3
- Vite 6.3.5 (dev server: 5173)
- Zustand 5.0 (state management)
- Axios 1.13 (HTTP client)
- shadcn/ui + Tailwind CSS (design system)
- Vitest 3.2 (testing)
- react-hook-form + zod (form validation)

## Backend
- NestJS 10.0.0 + PostgreSQL 17-alpine
- BFF pattern with E2E encryption (AES-256-GCM)
- Port: 3001
- Database: PostgreSQL:5433
- ngrok URL: https://3fb8d8db4949.ngrok-free.app

## Deployment
- Frontend: Vercel (lavenius-fe.vercel.app)
- Backend: ngrok (local dev)
- Git: github.com/deruvodaniel/lavenius-fe

## Architecture Patterns

### Layered Architecture
```
Component → Hook → Store → Service → API
```

1. **Service Layer**: API communication isolated in lib/api/
2. **Store Layer**: Zustand for global state management
3. **Custom Hooks**: Simplified component interface
4. **Error Boundary**: Global error handling
5. **Type Safety**: TypeScript strict mode, centralized types

### State Management Pattern
```typescript
// Store (single source of truth)
lib/stores/note.store.ts

// Hook (component interface)
lib/hooks/useNotes.ts

// Component (UI only)
components/notes/NoteList.tsx
```

## File Structure
```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts              # Axios singleton with interceptors
│   │   └── [feature].api.ts       # API endpoints
│   ├── services/                   # DEPRECATED (usar lib/api/)
│   ├── stores/
│   │   ├── auth.store.ts
│   │   ├── patient.store.ts
│   │   ├── appointment.store.ts
│   │   └── note.store.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePatients.ts
│   │   ├── useAppointments.ts
│   │   └── useNotes.ts
│   └── types/
│       └── api.types.ts           # Central type definitions
├── components/
│   ├── ui/                        # shadcn components (DO NOT EDIT)
│   ├── shared/                    # Reusable components
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── auth/                      # Login/Register
│   ├── pacientes/                 # Pacientes, PacienteDrawer
│   ├── agenda/                    # Calendar, appointments
│   ├── dashboard/                 # FichaClinica, Dashboard
│   └── notes/                     # NoteCard, NoteList, NoteDrawer
├── utils/                         # Helpers
│   ├── dateFormatters.ts
│   └── validators.ts
└── __tests__/                     # Unit tests
```

## Key Constraints

### 1. UI/UX
- ✅ ALWAYS use shadcn/ui components (never custom UI)
- ✅ NEVER edit files in components/ui/
- ✅ Components must be theme-agnostic (scalable for future redesigns)
- ✅ Follow DRY/KISS principles
- ✅ Accessibility: ARIA labels, keyboard navigation, screen readers

### 2. State Management
- ✅ All state management via Zustand stores
- ✅ Store pattern: `create<T>((set) => ({ ... }))`
- ✅ Hook pattern: `export const useX = () => useXStore()`
- ✅ Component pattern: Fetch in useEffect, clear on unmount

### 3. API Communication
- ✅ All API calls via lib/api/ (never direct axios in components)
- ✅ Authentication: JWT (localStorage) + userKey (sessionStorage)
- ✅ Error handling: Try-catch in stores, display in components
- ✅ Loading states: isLoading flag in stores

### 4. TypeScript
- ✅ Strict mode enabled (no `any`, no implicit any)
- ✅ Centralized types in lib/types/api.types.ts
- ✅ Use `import type` for type-only imports
- ✅ Enums for constants (e.g., NoteType)

### 5. Code Organization
- ✅ Files < 200 lines (split if larger)
- ✅ One component per file
- ✅ Atomic commits with descriptive messages
- ✅ Follow established patterns (see STATUS.md)

## Environment Variables
```bash
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your-client-id
```
