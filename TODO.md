# TODO - Frontend Lavenius

Plan de mejoras basado en auditoría de código.

---

## CRÍTICO

### 1. Configuracion.tsx - Settings no persisten
- **Archivo**: `src/components/config/Configuracion.tsx`
- **Problema**: Los settings solo muestran toast pero no guardan nada
- **Fix**: Implementar persistencia con backend o localStorage

### 2. Pacientes.tsx - getProximoTurno siempre null
- **Archivo**: `src/components/pacientes/Pacientes.tsx:135`
- **Problema**: TODO en código - función siempre retorna null
- **Fix**: Implementar lógica consultando sesiones del paciente

### 3. Backend - Session update 500 error
- **Archivo**: `lavenius-be/src/sessions/session.service.ts:199-213`
- **Problema**: Al actualizar status sin cambiar fechas, falla si no hay externalEventId
- **Fix**: Solo actualizar Google Calendar si externalEventId existe (ver resumen enviado)

---

## ALTO - Refactoring

### 4. Componentes monolíticos - Dividir
| Archivo | Líneas | Sugerencia |
|---------|--------|------------|
| `Agenda.tsx` | 720 | Extraer: `AgendaHeader`, `AgendaList`, `AgendaCalendarPanel` |
| `Cobros.tsx` | 530 | Extraer: `CobrosHeader`, `CobrosList`, `DeletePaymentModal` |
| `FichaClinica.tsx` | 458 | Extraer tabs a componentes separados |
| `TurnoDrawer.tsx` | 448 | Extraer secciones del form |

### 5. Drawers - Crear BaseDrawer reutilizable
- **Archivos**: `TurnoDrawer`, `PaymentDrawer`, `NoteDrawer`, `PacienteDrawer`
- **Problema**: Todos comparten estructura idéntica (backdrop, header, form)
- **Fix**: Crear `BaseDrawer` component con slots para header/content

### 6. Código duplicado - Centralizar utils
| Función | Ubicaciones | Mover a |
|---------|-------------|---------|
| `formatCurrency` | Cobros.tsx, PaymentCard.tsx, otros | `utils/formatters.ts` |
| `calcularEdad` | FichaClinica.tsx, Pacientes.tsx | `utils/formatters.ts` |
| `formatDate/formatTime` | Múltiples archivos | `utils/dateFormatters.ts` |

### 7. TypeScript - Eliminar `any`
- **20 instancias** de `catch (error: any)`
- **Fix**: Crear tipo `ApiError` y type guard `isApiError()`
```typescript
interface ApiError {
  message: string;
  statusCode?: number;
  response?: { data?: { message?: string } };
}
```

### 8. Reemplazar alert/confirm nativos
- **Archivos**: `Agenda.tsx`, `TurnoDrawer.tsx`, otros
- **Fix**: Usar modales estilizados consistentes (ya existe patrón en DeletePaymentModal)

---

## MEDIO - Performance & UX

### 9. Memoización faltante
- **Archivos**: `Agenda.tsx`, `Cobros.tsx`, `Pacientes.tsx`
- **Problema**: Computed values (`turnos`, `filteredPacientes`) recalculados cada render
- **Fix**: Agregar `useMemo` para filtros y cálculos

### 10. FichaClinica - isFlagged no persiste
- **Archivo**: `src/components/dashboard/FichaClinica.tsx`
- **Problema**: Flag es estado local, se pierde al recargar
- **Fix**: Persistir en backend (agregar campo a Patient)

### 11. Request deduplication
- **Archivos**: Todos los stores excepto `payment.store.ts`
- **Problema**: No hay protección contra requests duplicados
- **Fix**: Agregar flags `isFetching` como en payment.store

### 12. Empty states inconsistentes
- **Problema**: Algunos componentes no manejan estado vacío elegantemente
- **Fix**: Usar `EmptyState` component consistente en toda la app

### 13. Error boundaries
- **Problema**: No hay error boundaries para capturar errores de render
- **Fix**: Agregar `ErrorBoundary` component en rutas principales

### 14. FullCalendar lazy loading
- **Archivo**: `src/components/agenda/FullCalendarView.tsx`
- **Problema**: Import pesado de FullCalendar
- **Fix**: Lazy load con `React.lazy()` y Suspense

---

## BAJO - Cleanup

### 15. Eliminar console.logs
- **44 instancias** en producción
- **Fix**: Remover o usar logger condicional (`if (import.meta.env.DEV)`)

### 16. CSS duplicado
- **Archivo**: `src/index.css`
- **Problema**: Regla `body` duplicada (líneas 56-72)
- **Fix**: Eliminar duplicado

### 17. Naming inconsistente en stores
- `sessionStore.ts` vs `appointment.store.ts` vs `payment.store.ts`
- **Fix**: Unificar a `{domain}.store.ts`

### 18. Accesibilidad (a11y)
- **Problema**: Faltan `aria-label`, `role` en elementos interactivos
- **Fix**: Agregar atributos en drawers, modales, botones de acción

### 19. Tests
- **Problema**: No hay tests unitarios
- **Fix**: Agregar tests para utils y hooks críticos

---

## Orden de prioridad sugerido

1. **Inmediato**: Críticos #1, #2, #3
2. **Corto plazo**: #7 (TypeScript), #8 (alerts), #15 (console.logs)
3. **Medio plazo**: #4, #5, #6 (refactoring componentes)
4. **Largo plazo**: #9-14 (performance/UX), #16-19 (cleanup)

---

## Bugs conocidos pendientes

- [ ] Backend: Session update falla si no hay externalEventId (requiere fix en backend)
- [x] ~~Drawer overlay gap at top~~ (fixed con !top-0 !mt-0)
- [x] ~~Cobros cards showing 0~~ (fixed: Number(amount))
- [x] ~~FullCalendar no refresh~~ (fixed: key prop)
- [x] ~~Configuracion layout~~ (fixed: removed max-w-4xl)
