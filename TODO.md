# TODO - Frontend TerappIA

> **Última actualización**: Marzo 11, 2026
> Plan de mejoras y tareas pendientes.

---

## Refactoring Pendiente

### 1. Componentes monolíticos — Dividir
| Archivo | Líneas | Sugerencia |
|---------|--------|------------|
| `Agenda.tsx` | ~720 | Extraer: `AgendaHeader`, `AgendaList`, `AgendaCalendarPanel` |
| `FichaClinica.tsx` | ~458 | Extraer tabs a componentes separados |
| `TurnoDrawer.tsx` | ~448 | Extraer secciones del form |

> **Nota**: Cobros.tsx ya fue refactorizado (de 1,364 a 988 líneas)

### 2. TypeScript — Eliminar `any`
- ~20 instancias de `catch (error: any)`
- **Fix**: Crear tipo `ApiError` y type guard `isApiError()`

---

## Performance & UX

### 3. FichaClinica — isFlagged no persiste
- **Archivo**: `src/components/dashboard/FichaClinica.tsx`
- **Problema**: Flag es estado local, se pierde al recargar
- **Fix**: Persistir en backend (agregar campo a Patient)

### 4. Error boundaries
- **Problema**: No hay error boundaries para capturar errores de render
- **Fix**: Agregar `ErrorBoundary` component en rutas principales

---

## Ideas Futuras (Baja Prioridad)

- [ ] Portal del paciente (acceso limitado a su info)
- [ ] Videollamadas integradas para sesiones remotas
- [ ] Tests E2E con Playwright

---

## Completado Recientemente

### Marzo 2026 - Fixes y mejoras

- [x] **OnboardingProgressCard — Celebration state**
  - Card ya no desaparece al completar todos los pasos
  - Muestra estado de celebración con progreso al 100%
  - Se puede ocultar con el botón X o desde configuración del dashboard

- [x] **PhoneInput — Componente internacional con selector de país**
  - Creado `PhoneInput.tsx` con `react-international-phone` (headless hook)
  - Flags, E.164 output, países LATAM preferidos
  - Reemplazado en: Onboarding, PacienteDrawer, Perfil, OnboardingStepper

- [x] **OnboardingProgressCard — Google Calendar status**
  - Corregido: leía `false` hardcodeado en vez de consultar `calendarStore.isConnected`

- [x] **Onboarding Step 3 — Error en mobile**
  - Agregado try-catch para localStorage quota en mobile
  - Retry logic para `user.update()` de Clerk con payload reducido

- [x] **PaymentDrawer (Edit) — Selector de sesión read-only**
  - En modo edición muestra sesión como preview read-only
  - En modo creación mantiene el selector editable

- [x] **Focus Trap y Keyboard Dismiss** — Ya resuelto
  - Drawers: Todos usan `BaseDrawer` con `useFocusTrap` (ESC, Tab trap, focus restore)
  - Modals: Todos usan Radix `Dialog`/`AlertDialog` con focus trap nativo

- [x] **BaseDrawer reutilizable** — Ya existe
  - `src/components/shared/BaseDrawer.tsx` con slots header/body/footer
  - Usado por: TurnoDrawer, PaymentDrawer, NoteDrawer, PacienteDrawer

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
