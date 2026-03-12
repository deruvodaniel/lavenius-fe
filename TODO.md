# TODO - Frontend Lavenius

> **Última actualización**: Marzo 11, 2026  
> Plan de mejoras y tareas pendientes.

---

## Próximos Pasos (Prioridad Alta)

### 1. Focus Trap y Keyboard Dismiss
- **Archivos**: Todos los Drawers y Modals
- **Problema**: Falta focus trap para accesibilidad y ESC para cerrar
- **Fix**: Implementar focus-trap-react o radix primitives



- **Fix**: Solo actualizar Google Calendar si externalEventId existe

### 4. Onboarding Progress Card — Google Calendar status incorrecto
- **Archivo**: Dashboard progress card de onboarding
- **Problema**: El step de "Conectar Google Calendar" aparece como pendiente aunque ya está conectado
- **Investigar**: Cómo se obtiene el estado de progreso de cada step del onboarding en el dashboard

### 5. Onboarding Step 3 — Error en mobile
- **Problema**: Error inesperado ("Algo salió mal") al llegar al step 3 del onboarding en mobile
- **Investigar**: Puede ser un issue de rendering responsive o de un componente que no maneja mobile

### 6. PaymentDrawer (Edit) — Quitar selector de sesión
- **Archivo**: PaymentDrawer en modo edición
- **Problema**: Al editar un pago (seleccionado desde la tabla), el drawer muestra un select de sesión innecesario — la sesión ya debería estar preseleccionada
- **Fix**: En modo edit, mostrar la sesión como read-only o eliminar el select

### 7. Phone Input — Componente moderno con selector de país
- **Archivos**: Onboarding (phone, alternativePhone), PacienteDrawer (phone), Perfil (phone)
- **Problema**: Los inputs de teléfono son inputs de texto planos sin validación, formato ni prefijo de país
- **Fix**: Implementar un componente `PhoneInput` con selector de país (banderitas), validación por país, y formateo automático
- **Opciones**: `react-phone-number-input` o `react-international-phone` (ambos incluyen validación + formateo)
- **Scope**: Reemplazar todos los inputs de teléfono del proyecto con el nuevo componente

---

## Refactoring Pendiente

### 8. Componentes monolíticos — Dividir
| Archivo | Líneas | Sugerencia |
|---------|--------|------------|
| `Agenda.tsx` | ~720 | Extraer: `AgendaHeader`, `AgendaList`, `AgendaCalendarPanel` |
| `FichaClinica.tsx` | ~458 | Extraer tabs a componentes separados |
| `TurnoDrawer.tsx` | ~448 | Extraer secciones del form |

> **Nota**: Cobros.tsx ya fue refactorizado (de 1,364 a 988 líneas)

### 9. Drawers — Crear BaseDrawer reutilizable
- **Archivos**: `TurnoDrawer`, `PaymentDrawer`, `NoteDrawer`, `PacienteDrawer`
- **Problema**: Todos comparten estructura idéntica (backdrop, header, form)
- **Fix**: Crear `BaseDrawer` component con slots para header/content

### 10. TypeScript — Eliminar `any`
- ~20 instancias de `catch (error: any)`
- **Fix**: Crear tipo `ApiError` y type guard `isApiError()`

---

## Performance & UX

### 11. FichaClinica — isFlagged no persiste
- **Archivo**: `src/components/dashboard/FichaClinica.tsx`
- **Problema**: Flag es estado local, se pierde al recargar
- **Fix**: Persistir en backend (agregar campo a Patient)

### 12. Error boundaries
- **Problema**: No hay error boundaries para capturar errores de render
- **Fix**: Agregar `ErrorBoundary` component en rutas principales

---

## Ideas Futuras (Baja Prioridad)


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
