# TODO - Frontend Lavenius

> **Última actualización**: Febrero 19, 2026  
> Plan de mejoras y tareas pendientes.

---

## Próximos Pasos (Prioridad Alta)

### 1. Focus Trap y Keyboard Dismiss
- **Archivos**: Todos los Drawers y Modals
- **Problema**: Falta focus trap para accesibilidad y ESC para cerrar
- **Fix**: Implementar focus-trap-react o radix primitives

### 2. Google Calendar OAuth
- Agregar test users en Google Cloud Console
- Configurar redirect URIs para producción
- Testing de sincronización completa

### 3. Backend - Session update 500 error
- **Archivo**: `lavenius-be/src/sessions/session.service.ts:199-213`
- **Problema**: Al actualizar status sin cambiar fechas, falla si no hay externalEventId
- **Fix**: Solo actualizar Google Calendar si externalEventId existe

---

## Refactoring Pendiente

### 4. Componentes monolíticos - Dividir
| Archivo | Líneas | Sugerencia |
|---------|--------|------------|
| `Agenda.tsx` | ~720 | Extraer: `AgendaHeader`, `AgendaList`, `AgendaCalendarPanel` |
| `FichaClinica.tsx` | ~458 | Extraer tabs a componentes separados |
| `TurnoDrawer.tsx` | ~448 | Extraer secciones del form |

> **Nota**: Cobros.tsx ya fue refactorizado (de 1,364 a 988 líneas)

### 5. Drawers - Crear BaseDrawer reutilizable
- **Archivos**: `TurnoDrawer`, `PaymentDrawer`, `NoteDrawer`, `PacienteDrawer`
- **Problema**: Todos comparten estructura idéntica (backdrop, header, form)
- **Fix**: Crear `BaseDrawer` component con slots para header/content

### 6. TypeScript - Eliminar `any`
- ~20 instancias de `catch (error: any)`
- **Fix**: Crear tipo `ApiError` y type guard `isApiError()`

---

## Performance & UX

### 7. FichaClinica - isFlagged no persiste
- **Archivo**: `src/components/dashboard/FichaClinica.tsx`
- **Problema**: Flag es estado local, se pierde al recargar
- **Fix**: Persistir en backend (agregar campo a Patient)

### 8. Error boundaries
- **Problema**: No hay error boundaries para capturar errores de render
- **Fix**: Agregar `ErrorBoundary` component en rutas principales

---

## Ideas Futuras (Baja Prioridad)

- [ ] Notificaciones push para recordatorios de citas
- [ ] Portal del paciente (acceso limitado a su info)
- [ ] Videollamadas integradas para sesiones remotas
- [ ] Tests E2E con Playwright

---

## Completado Recientemente

### Febrero 2026 - Auditoría y A11y

- [x] **Refactoring Cobros.tsx** - Reducido de 1,364 a 988 líneas
  - Extraído `ReminderModal.tsx` (161 líneas)
  - Extraído `PaymentFilters.tsx` (278 líneas)
  
- [x] **Componentes compartidos creados**
  - `SimplePagination.tsx`
  - `InfiniteScrollLoader.tsx`
  
- [x] **Refactoring Pacientes.tsx** - Usa componentes compartidos

- [x] **Accesibilidad - Form labels** (~38 issues corregidos)
  - NoteDrawer.tsx ✅
  - TurnoDrawer.tsx ✅
  - PacienteDrawer.tsx ✅
  - PaymentDrawer.tsx ✅
  - Configuracion.tsx ✅
  - Perfil.tsx ✅
  - Pacientes.tsx ✅

- [x] **Configuracion.tsx - Settings persisten** (localStorage)
- [x] **Pacientes.tsx - getProximoTurno funciona** (usa session store)
- [x] **CSS duplicado eliminado**
- [x] **Code splitting implementado**
- [x] **Lazy loading para Agenda, Cobros, HelpCenter**
