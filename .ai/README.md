# AI Documentation

LLM-optimized guidelines for Lavenius frontend development.

## Quick Start
1. Read `CONTEXT.md` for system overview
2. Check `tasks/` for specific feature implementation
3. Follow `workflows/` for step-by-step processes

## Structure
```
.ai/
├── CONTEXT.md                    # System context and constraints
├── tasks/                        # Feature-specific guidelines
│   ├── AUTH.md                  # Authentication
│   ├── PATIENTS.md              # Patient management
│   ├── APPOINTMENTS.md          # Appointments
│   ├── ERROR_HANDLING.md        # Error handling
│   └── UI_COMPONENTS.md         # UI/UX guidelines
└── workflows/                    # Step-by-step processes
    ├── COMPONENT_MIGRATION.md   # Migrate existing component
    └── NEW_FEATURE.md           # Build new feature from scratch
```

## Core Principles
1. **Atomic tasks**: Each file = one focused responsibility
2. **LLM-friendly**: Code examples > prose
3. **Actionable**: Clear steps, no ambiguity
4. **Scalable**: Design system agnostic
5. **Tested**: Every feature has tests

## When to Use
- **Before coding**: Check relevant task file
- **New feature**: Follow NEW_FEATURE.md workflow
- **Migration**: Follow COMPONENT_MIGRATION.md workflow
- **Stuck**: Read CONTEXT.md for architecture overview
