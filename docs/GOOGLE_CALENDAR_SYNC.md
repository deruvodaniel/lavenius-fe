# Integración de Google Calendar

## Funcionalidad Implementada

### Backend (ya existente según Postman)

Los siguientes endpoints ya están disponibles en el backend:

1. **GET /calendar/auth/url** - Obtener URL de autorización de Google
2. **GET /calendar/auth/callback** - Callback de OAuth de Google
3. **POST /calendar/sync** - Sincronizar sesiones con Google Calendar
4. **GET /internal/calendar/calendars** - Obtener lista de calendarios de Google
5. **POST /calendar/disconnect** - Desconectar Google Calendar

### Frontend (nuevos archivos creados)

#### 1. Servicio de Calendar (`src/lib/services/calendarService.ts`)

Métodos disponibles:
- `getAuthUrl()` - Obtiene la URL de autorización de Google OAuth
- `syncCalendar()` - Sincroniza todas las sesiones con Google Calendar
- `getCalendars()` - Obtiene la lista de calendarios disponibles
- `disconnectCalendar()` - Desconecta la integración con Google Calendar

#### 2. Store de Calendar (`src/lib/stores/calendarStore.ts`)

Estado:
- `isConnected` - Indica si Google Calendar está conectado
- `isSyncing` - Indica si se está sincronizando
- `isCheckingConnection` - Indica si se está verificando la conexión
- `calendars` - Lista de calendarios de Google

Acciones:
- `checkConnection()` - Verifica si Google Calendar está conectado
- `connectCalendar()` - Abre ventana de OAuth para conectar Google Calendar
- `syncCalendar()` - Sincroniza sesiones con Google Calendar
- `disconnectCalendar()` - Desconecta Google Calendar

#### 3. Componentes UI

##### CalendarSync (`src/components/config/CalendarSync.tsx`)
- Card completo con información de estado de conexión
- Botones para conectar/sincronizar/desconectar
- Información sobre qué se sincroniza
- Ubicación: Página de Configuración

##### CalendarSyncButton (`src/components/config/CalendarSyncButton.tsx`)
- Botón simple y reutilizable
- Detecta automáticamente si está conectado o no
- Ubicación: Empty state de Agenda

### Cambios en Componentes Existentes

#### 1. Configuracion.tsx
- Agregado componente `CalendarSync` en la parte superior
- Los usuarios pueden ver el estado de conexión y sincronizar desde configuración

#### 2. Agenda.tsx
- Agregado `CalendarSyncButton` en el empty state
- Los usuarios pueden conectar/sincronizar cuando no tienen turnos

## Flujo de Uso

### Primera Vez - Conectar Google Calendar

1. Usuario va a **Configuración** o ve el empty state en **Agenda**
2. Hace clic en "Conectar Google Calendar"
3. Se abre una ventana popup con Google OAuth
4. Usuario autoriza la aplicación
5. El callback redirige y guarda el token en el backend
6. Frontend detecta la conexión automáticamente

### Sincronización Regular

1. Usuario ve el badge "Conectado" en Configuración
2. Hace clic en "Sincronizar Ahora"
3. El backend sincroniza todas las sesiones pendientes
4. Toast muestra "X sesiones sincronizadas"

### Desconectar

1. Usuario hace clic en "Desconectar" en Configuración
2. Se elimina el token del backend
3. El estado cambia a "Desconectado"

## Comportamiento

### Sincronización Automática
- Cuando se crea una nueva sesión, el backend intenta crear el evento en Google Calendar
- Si falla (no conectado), continúa sin bloquear la operación
- Se muestra un warning en los logs: "Failed to create calendar event - continuing without calendar integration"

### Sincronización Manual
- El usuario puede sincronizar manualmente todas las sesiones
- Útil cuando:
  - Acaba de conectar Google Calendar
  - Hubo cambios en sesiones mientras estaba desconectado
  - Quiere asegurarse de que todo esté sincronizado

## Estados de UI

### Badge de Estado
- 🟢 **Conectado** (verde) - Google Calendar está conectado y funcionando
- ⚪ **Desconectado** (gris) - No hay conexión con Google Calendar

### Botones
- **Conectar Google Calendar** - Abre OAuth
- **Sincronizar Ahora** - Sincroniza todas las sesiones
- **Desconectar** - Elimina la integración

### Toasts
- ℹ️ "Conectando con Google Calendar..." - Al iniciar OAuth
- ✅ "Calendario sincronizado - X sesiones sincronizadas" - Después de sync exitoso
- ❌ "Error al conectar/sincronizar" - Si algo falla

## Configuración del Backend

El backend debe tener configuradas las siguientes variables de entorno para Google Calendar:

```env
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/calendar/auth/callback
```

## Testing

### Pre-requisitos

1. **Backend corriendo** en http://localhost:3001
   ```bash
   cd lavenius-be
   npx nest start --watch
   ```

2. **Frontend corriendo** en http://localhost:5173
   ```bash
   cd fe-lavenius
   pnpm run dev
   ```

3. **Usuario autenticado** - Debes tener una sesión activa con:
   - Token JWT válido
   - User key para encriptación

### Verificar Endpoints del Backend

Verifica que los endpoints de Google Calendar estén disponibles:

```bash
# Health check del backend
curl http://localhost:3001/health

# Verificar que los endpoints de calendar estén mapeados
# (revisar en los logs del backend al iniciar)
# Deberías ver:
# Mapped {/calendar/auth/url, GET} route
# Mapped {/calendar/sync, POST} route
# Mapped {/calendar/disconnect, POST} route
```

### Flujo de Testing Completo

#### 1. **Verificar Estado Inicial** (Sin Conexión)

1. Ir a **Configuración** (`/configuracion`)
2. Buscar el card de "Google Calendar"
3. Verificar que muestre:
   - Badge "Desconectado" (gris)
   - Botón "Conectar Google Calendar"
   - Descripción sobre qué se sincroniza

#### 2. **Conectar Google Calendar**

1. Hacer clic en **"Conectar Google Calendar"**
2. Verificar que:
   - Aparece un toast: "Conectando con Google Calendar..."
   - Se abre una ventana popup con la URL de autorización de Google
3. En el popup:
   - Seleccionar cuenta de Google
   - Autorizar permisos de calendario
   - El popup se cierra automáticamente
4. De vuelta en la aplicación:
   - El badge cambia a "Conectado" (verde)
   - Aparecen botones: "Sincronizar Ahora" y "Desconectar"

#### 3. **Verificar Sincronización Automática**

1. Ir a **Agenda** (`/agenda`)
2. Crear una nueva sesión:
   - Clic en "Nuevo Turno"
   - Seleccionar paciente
   - Elegir fecha y hora
   - Guardar
3. Verificar en los logs del backend:
   ```
   Creating event for therapist...
   Session created successfully
   ```
4. Si Google Calendar está conectado, el evento se crea automáticamente
5. Si no está conectado, verás un warning pero la sesión se crea igual

#### 4. **Sincronización Manual**

1. Volver a **Configuración**
2. Hacer clic en **"Sincronizar Ahora"**
3. Verificar que:
   - El botón muestra "Sincronizando..." con spinner
   - Aparece toast de éxito: "X sesiones sincronizadas con Google Calendar"
4. Abrir Google Calendar en otra pestaña
5. Verificar que los eventos aparecen con:
   - Título: Nombre del paciente
   - Fecha y hora correctas
   - Duración correcta

#### 5. **Desconectar**

1. En **Configuración**, hacer clic en **"Desconectar"**
2. Verificar que:
   - Aparece toast: "Google Calendar desconectado"
   - Badge cambia a "Desconectado"
   - Solo aparece botón "Conectar Google Calendar"

### Testing con Empty State en Agenda

1. Ir a **Agenda** cuando no hay turnos
2. Verificar que aparece:
   - Mensaje: "No hay turnos programados"
   - Botón "Crear primer turno"
   - Botón "Conectar Google Calendar" (si no está conectado)
   - O "Sincronizar Google Calendar" (si ya está conectado)
3. Hacer clic en el botón de calendar
4. Verificar el flujo de conexión/sincronización

### Verificar Manejo de Errores

#### Error: Calendar no conectado al crear sesión

1. Asegurarse de que Google Calendar NO esté conectado
2. Crear una sesión
3. Verificar que:
   - La sesión se crea exitosamente
   - En logs del backend: "Failed to create calendar event - continuing without calendar integration"
   - No se muestra error al usuario

#### Error: Token expirado

1. Si el token de Google expira
2. Intentar sincronizar
3. El backend debería:
   - Intentar refresh automático
   - Si falla, marcar como desconectado
   - Mostrar mensaje: "Google Calendar no conectado. Por favor sincroniza tu calendario primero."

### Verificar en Google Calendar

1. Abrir https://calendar.google.com
2. Buscar eventos con el nombre de tus pacientes
3. Verificar que tienen:
   - Fecha y hora correctas
   - Duración correcta
   - Descripción (si aplica)
4. Editar un evento en Google Calendar
5. **Nota**: Por ahora la sincronización es unidireccional (de Lavenius a Google)
   - Los cambios en Google Calendar NO se reflejan en Lavenius

## Próximos Pasos (Opcional)

1. **Auto-refresh después de OAuth**: Detectar cuando el usuario vuelve de la ventana de OAuth
2. **Webhook de sincronización**: Sincronizar automáticamente cada X horas
3. **Selector de calendario**: Permitir elegir a qué calendario de Google sincronizar
4. **Sincronización bidireccional**: Importar eventos de Google Calendar a la app
