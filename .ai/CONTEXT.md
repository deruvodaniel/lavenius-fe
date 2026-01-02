# System Context

## Tech Stack
- React 18 + TypeScript 5.9
- Vite 6.3 (dev server: 3000)
- Zustand 5.0 (state management)
- Axios 1.13 (HTTP client)
- shadcn/ui (design system)
- Vitest 3.2 (testing)

## Backend
- NestJS + PostgreSQL
- BFF pattern with E2E encryption (AES-256-GCM)
- Port: 3001
- Database: PostgreSQL:5433

## Architecture Patterns
- Service Layer: API communication isolated
- Store Layer: Zustand for global state
- Custom Hooks: Simplified component interface
- Error Boundary: Global error handling

## File Structure
```
src/
├── lib/
│   ├── api/client.ts          # Axios singleton with interceptors
│   ├── services/*.service.ts  # API communication
│   ├── stores/*.store.ts      # Zustand state management
│   ├── types/api.types.ts     # TypeScript definitions
│   └── hooks/*.hook.ts        # Custom hooks
├── components/
│   ├── ui/                    # shadcn components (DO NOT EDIT)
│   ├── shared/                # Reusable components
│   └── [feature]/             # Feature-specific components
└── __tests__/                 # Unit tests
```

## Key Constraints
1. ALWAYS use shadcn/ui components (never custom UI)
2. NEVER edit files in components/ui/
3. Components must be theme-agnostic (scalable for future redesigns)
4. All state management via Zustand stores
5. All API calls via services (never direct axios in components)
6. Authentication: JWT (localStorage) + userKey (sessionStorage)
