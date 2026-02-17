# System Context

> **Actualizado**: Febrero 16, 2026

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
- Production API URL (configured via VITE_API_URL)

## Deployment
- Frontend: Vercel (lavenius-fe.vercel.app)
- Backend: Production infrastructure (no longer using ngrok)
- Git repos:
  - github.com/deruvodaniel/lavenius-fe (Vercel deploy)
  - github.com/laveniusnet/lavenius-fe (main repo)

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
│   │   ├── sessionStore.ts
│   │   ├── note.store.ts
│   │   ├── payment.store.ts
│   │   ├── onboarding.store.ts      # Onboarding state (localStorage)
│   │   ├── calendar.store.ts
│   │   └── ui.store.ts              # UI state (drawers, views, sidebar, loading)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePatients.ts
│   │   ├── useSessions.ts
│   │   ├── useNotes.ts
│   │   ├── usePayments.ts
│   │   ├── useOnboarding.ts         # Onboarding hook
│   │   ├── useAppointments.ts
│   │   └── useMediaQuery.ts
│   └── types/
│       ├── api.types.ts             # Central type definitions
│       └── onboarding.types.ts      # Onboarding types
├── components/
│   ├── ui/                        # shadcn components (DO NOT EDIT)
│   ├── shared/                    # Reusable components
│   │   ├── EmptyState.tsx
│   │   ├── Skeleton.tsx
│   │   ├── NotFound.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ConfirmDialog.tsx        # Responsive confirmation dialog
│   ├── auth/                      # Login/Register
│   ├── pacientes/                 # Pacientes, PacienteDrawer
│   ├── agenda/                    # Agenda, FullCalendarView, TurnoDrawer
│   ├── cobros/                    # Cobros, PaymentStats, PaymentDrawer
│   ├── config/                    # Configuracion, CalendarSync
│   ├── perfil/                    # Perfil (user profile editing)
│   ├── dashboard/                 # FichaClinica, Dashboard
│   ├── onboarding/                # OnboardingModal, TipBanner, Progress
│   ├── help/                      # HelpCenter
│   └── layout/                    # Sidebar, Header
├── utils/                         # Helpers
│   ├── dateFormatters.ts
│   └── validators.ts
└── __tests__/                     # Unit tests
```

## UI Store (ui.store.ts)

Store centralizado para gestionar estado de UI. Persiste preferencias de vista en localStorage.

### Hooks disponibles

```typescript
import { 
  useDrawer,           // Drawer state management
  useViewPreferences,  // View mode preferences (persisted)
  useSidebar,          // Sidebar state
  useLoading,          // Loading states
  useIsAnyLoading      // Check if any operation is loading
} from '@/lib/stores';
```

### useDrawer

Gestiona el estado de drawers (paciente, turno, payment, note, sessionDetails).

```typescript
const { isOpen, data, open, close } = useDrawer('paciente');

// Abrir con datos
open({ patientId: '123', mode: 'edit' });

// Cerrar
close();
```

### useViewPreferences

Preferencias de vista persistidas en localStorage.

```typescript
const { 
  agenda,           // 'list' | 'calendar' | 'both'
  pacientes,        // 'cards' | 'table'
  calendar,         // 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  setAgendaView,
  setPacientesView,
  setCalendarView
} = useViewPreferences();
```

### useSidebar

Estado del sidebar para desktop y mobile.

```typescript
const {
  isOpen,
  isMobileOpen,
  isCollapsed,
  open,
  close,
  toggle,
  openMobile,
  closeMobile,
  toggleMobile,
  collapse,
  expand
} = useSidebar();
```

### useLoading

Estados de carga globales y por operación.

```typescript
const {
  isGlobalLoading,
  loadingMessage,
  setGlobalLoading,
  startOperation,
  endOperation,
  isOperationLoading
} = useLoading();

// Mostrar loading global
setGlobalLoading(true, 'Guardando...');

// Loading por operación específica
startOperation('save-patient');
// ... async work
endOperation('save-patient');

// Verificar
if (isOperationLoading('save-patient')) { ... }
```

## ConfirmDialog Component

Diálogo de confirmación responsivo. Usa AlertDialog en desktop y Drawer en mobile.

### Uso básico

```tsx
import { ConfirmDialog } from '@/components/shared';

function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteItem(id);
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setShowConfirm(true)}>Eliminar</Button>
      
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="¿Eliminar elemento?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
```

### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `open` | `boolean` | - | Controla visibilidad |
| `onOpenChange` | `(open: boolean) => void` | - | Callback al cambiar estado |
| `title` | `string` | - | Título del diálogo |
| `description` | `string` | - | Descripción/mensaje |
| `confirmLabel` | `string` | `'Confirmar'` | Texto del botón confirmar |
| `cancelLabel` | `string` | `'Cancelar'` | Texto del botón cancelar |
| `variant` | `'danger' \| 'warning' \| 'info' \| 'default'` | `'default'` | Estilo visual |
| `icon` | `LucideIcon` | (según variant) | Icono personalizado |
| `onConfirm` | `() => void \| Promise<void>` | - | Acción al confirmar |
| `onCancel` | `() => void` | - | Acción al cancelar |
| `isLoading` | `boolean` | `false` | Deshabilita botones durante carga |

### Variantes

- **danger**: Rojo, icono Trash2. Para eliminar/destruir.
- **warning**: Ámbar, icono AlertTriangle. Para acciones importantes (ej: logout).
- **info**: Azul, icono Info. Para información.
- **default**: Indigo, icono HelpCircle. Para confirmaciones generales.

### Ejemplo con icono personalizado

```tsx
import { Calendar } from 'lucide-react';

<ConfirmDialog
  // ...
  variant="default"
  icon={Calendar}  // Sobreescribe el icono del variant
  title="¿Guardar turno?"
/>
```

## Key Constraints

### 1. UI/UX
- ✅ ALWAYS use shadcn/ui components (never custom UI)
- ✅ NEVER edit files in components/ui/
- ✅ Components must be theme-agnostic (scalable for future redesigns)
- ✅ Follow DRY/KISS principles
- ✅ Accessibility: ARIA labels, keyboard navigation, screen readers
- ✅ Use ConfirmDialog for destructive/important actions (never native confirm/alert)
- ✅ Use toast (sonner) for validation errors and success messages

### 2. State Management
- ✅ All state management via Zustand stores
- ✅ Store pattern: `create<T>((set) => ({ ... }))`
- ✅ Hook pattern: `export const useX = () => useXStore()`
- ✅ Component pattern: Fetch in useEffect, clear on unmount
- ✅ UI state (drawers, views, loading) via ui.store.ts

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
