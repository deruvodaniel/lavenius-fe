# Estructura Modular de Componentes

Esta aplicación utiliza una arquitectura modular organizada por funcionalidades.

## Estructura de Carpetas

```
src/components/
├── agenda/           # Módulo de gestión de agenda
│   ├── Agenda.tsx
│   ├── TurnoDrawer.tsx
│   └── index.ts
├── pacientes/        # Módulo de gestión de pacientes
│   ├── Pacientes.tsx
│   ├── PatientDrawer.tsx
│   ├── PacienteDrawer.tsx
│   └── index.ts
├── cobros/           # Módulo de gestión de cobros
│   ├── Cobros.tsx
│   └── index.ts
├── config/           # Módulo de configuración
│   ├── Configuracion.tsx
│   └── index.ts
├── profile/          # Módulo de perfil de usuario (futuro)
│   └── index.ts
├── dashboard/        # Componentes del dashboard
│   ├── Dashboard.tsx
│   ├── FichaClinica.tsx
│   └── index.ts
├── shared/           # Componentes compartidos/reutilizables
│   ├── CalendarView.tsx
│   └── index.ts
├── layout/           # Componentes de layout
│   ├── AppLayout.tsx
│   ├── Sidebar.tsx
│   └── index.ts
├── auth/             # Componentes de autenticación
│   ├── Login.tsx
│   └── index.ts
├── ui/               # Componentes UI de Radix/shadcn
└── figma/            # Componentes de Figma
```

## Principios de Organización

### 1. Modularización por Funcionalidad
Cada módulo contiene los componentes relacionados con una funcionalidad específica:
- **agenda**: Todo lo relacionado con turnos y citas
- **pacientes**: Gestión de pacientes y fichas clínicas
- **cobros**: Sistema de cobros y pagos
- **config**: Configuración de la aplicación

### 2. Componentes Compartidos
Los componentes reutilizables se encuentran en `shared/`:
- `CalendarView`: Calendario usado en múltiples módulos
- Futuros componentes compartidos como badges, cards, etc.

### 3. Separación de Responsabilidades
- **layout/**: Componentes estructurales (AppLayout, Sidebar)
- **auth/**: Componentes de autenticación
- **dashboard/**: Componentes del dashboard principal
- **ui/**: Componentes de interfaz base (Radix UI)

## Uso de Componentes

### Importación desde módulos
Gracias a los archivos `index.ts`, las importaciones son limpias:

```typescript
// Antes
import { Agenda } from '../components/agenda/Agenda';
import { Pacientes } from '../components/pacientes/Pacientes';

// Ahora
import { Agenda } from '../components/agenda';
import { Pacientes } from '../components/pacientes';
```

### Importación de componentes compartidos
```typescript
import { CalendarView } from '../components/shared';
import { AppLayout, Sidebar } from '../components/layout';
```

## Componentes Reutilizables

### Actuales
- **CalendarView**: Calendario con navegación mensual
- **PatientDrawer**: Drawer de información del paciente
- **TurnoDrawer**: Drawer de creación/edición de turnos
- **PacienteDrawer**: Drawer de creación/edición de pacientes

### Futuros (recomendados)
- **StatusBadge**: Badges de estado reutilizables
- **TurnoCard**: Card de turno para vistas móviles
- **PatientCard**: Card de paciente
- **LoadingSpinner**: Indicador de carga
- **EmptyState**: Estado vacío genérico

## Ventajas de esta Estructura

1. **Escalabilidad**: Fácil agregar nuevos módulos
2. **Mantenibilidad**: Componentes organizados por funcionalidad
3. **Reutilización**: Componentes compartidos evitan duplicación
4. **Claridad**: Estructura clara y predecible
5. **Testing**: Más fácil testear módulos independientes

## Próximos Pasos

1. Crear componentes compartidos adicionales
2. Implementar módulo de perfil de usuario
3. Extraer lógica común a hooks personalizados
4. Agregar tests unitarios por módulo
