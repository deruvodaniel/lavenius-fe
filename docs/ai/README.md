# AI Documentation

> LLM-optimized guidelines for TerappIA frontend development.  
> **Actualizado**: Enero 14, 2026

## 📍 Ubicación

Esta documentación ahora vive en `docs/ai/` junto con Guidelines.md y A11Y.md para mantener toda la documentación centralizada.

## Quick Start
1. Read `CONTEXT.md` for system overview
2. Check `tasks/` for specific feature implementation  
3. Follow `workflows/` for step-by-step processes
4. Review `/docs/Guidelines.md` and `/docs/A11Y.md` for design principles

## Structure
```
docs/
├── ai/                           # LLM-optimized docs (esta carpeta)
│   ├── CONTEXT.md               # System context and constraints
│   ├── STATUS.md                # Migration and implementation status
│   ├── tasks/                   # Feature-specific guidelines
│   │   ├── AUTH.md             # Authentication
│   │   ├── PATIENTS.md         # Patient management
│   │   ├── APPOINTMENTS.md     # Appointments/Sessions
│   │   ├── ERROR_HANDLING.md   # Error handling
│   │   └── UI_COMPONENTS.md    # UI/UX guidelines
│   └── workflows/               # Step-by-step processes
│       ├── COMPONENT_MIGRATION.md
│       └── NEW_FEATURE.md
├── Guidelines.md                 # Code style and architecture
├── A11Y.md                       # Accessibility checklist
├── API_INTEGRATION.md            # Backend integration docs
└── GOOGLE_CALENDAR_SYNC.md       # Google Calendar integration
```

## Core Principles
1. **Atomic tasks**: Each file = one focused responsibility
2. **LLM-friendly**: Code examples > prose
3. **Actionable**: Clear steps, no ambiguity
4. **DRY/KISS**: Reuse utilities, keep it simple
5. **Type-safe**: TypeScript strict mode, no `any`

## When to Use
- **Before coding**: Check relevant task file
- **New feature**: Follow `workflows/NEW_FEATURE.md`
- **Migration**: Follow `workflows/COMPONENT_MIGRATION.md`
- **Stuck**: Read `CONTEXT.md` for architecture overview
- **Accessibility**: Check `/docs/A11Y.md`
- **Style guide**: Check `/docs/Guidelines.md`
