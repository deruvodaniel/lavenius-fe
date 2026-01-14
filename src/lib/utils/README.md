# Utilidades (Utils)

Esta carpeta contiene funciones de utilidad reutilizables en toda la aplicación.

## Principios

- **DRY (Don't Repeat Yourself)**: Las funciones aquí evitan duplicación de código
- **Single Responsibility**: Cada función tiene una única responsabilidad clara
- **Pure Functions**: Las funciones son puras cuando es posible (sin efectos secundarios)

## Archivos

### dateFormatters.ts
Funciones centralizadas para formateo de fechas y horas.

**Funciones disponibles:**
- `formatDateTime()` - Fecha completa con hora
- `formatTime()` - Solo hora (HH:mm)
- `formatDate()` - Fecha legible sin hora
- `formatShortDate()` - Fecha corta (DD/MM/YYYY)
- `formatDuration()` - Duración entre dos fechas
- `formatISODate()` - Formato ISO para inputs de fecha

**Uso:**
```tsx
import { formatTime, formatDate } from '@/lib/utils/dateFormatters';

// En un componente
<p>{formatDate(session.scheduledFrom)}</p>
<p>{formatTime(session.scheduledFrom)}</p>
```

## Buenas Prácticas

1. **Documentar funciones**: Usar JSDoc con ejemplos
2. **Tipado estricto**: Siempre tipar parámetros y retorno
3. **Nombrado claro**: Nombres descriptivos que indiquen qué hace la función
4. **Testear**: Agregar tests unitarios para funciones críticas
