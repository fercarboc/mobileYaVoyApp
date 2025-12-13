# WORKER ROLE - IMPLEMENTACIÓN COMPLETADA ✅

## Resumen de Implementación

Se ha completado toda la funcionalidad para el rol WORKER (trabajador/helper) en la app móvil YaVoy.

## Pantallas Implementadas

### 1. HomeScreen ✅
**Ubicación:** `mobile-app/src/screens/Worker/HomeScreen.tsx`

**Funcionalidades:**
- Carga trabajos disponibles desde `VoyJobs` WHERE `status='OPEN'`
- Obtiene el perfil del usuario desde `VoyUsers`
- Carga trabajos ya aplicados desde `VoyJobApplications`
- Filtra automáticamente trabajos ya aplicados
- Muestra estadísticas en tarjeta superior:
  * Trabajos aceptados (ACCEPTED)
  * Candidaturas pendientes (PENDING)
  * Candidaturas rechazadas (REJECTED)
  * Trabajos disponibles (count después de filtrar)
- Filtros por categoría (Limpieza, Cuidado, etc.)
- Búsqueda por texto
- Pull-to-refresh

**Consultas SQL:**
```typescript
// Cargar perfil
SELECT id FROM VoyUsers WHERE auth_user_id = {user.id}

// Cargar trabajos
SELECT * FROM VoyJobs WHERE status = 'OPEN' ORDER BY created_at DESC

// Trabajos aplicados
SELECT job_id FROM VoyJobApplications WHERE helper_user_id = {profile.id}

// Estadísticas
SELECT status, COUNT(*) FROM VoyJobApplications 
WHERE helper_user_id = {profile.id} 
GROUP BY status
```

### 2. JobDetailScreen ✅
**Ubicación:** `mobile-app/src/screens/Worker/JobDetailScreen.tsx`

**Funcionalidades:**
- Muestra detalles completos del trabajo:
  * Título, descripción
  * Categoría e icono
  * Ubicación (barrio, distrito, ciudad)
  * Precio fijo o por hora
  * Tipo de trabajo (puntual/por horas)
  * Fecha de publicación
- Modal de aplicación con:
  * Campo de mensaje de presentación (obligatorio)
  * Campo de precio propuesto (ONE_OFF jobs)
  * Campo de tarifa por hora propuesta (HOURLY jobs)
  * Validación de datos
  * Pre-relleno de precio sugerido
  * Consejos de buenas prácticas
- Inserta candidatura en `VoyJobApplications` con status='PENDING'
- Navegación a MyJobs después de aplicar

**Campos de la aplicación:**
```typescript
{
  job_id: string,
  helper_user_id: string,  // ID del perfil del trabajador
  message: string,         // Mensaje de presentación
  proposed_price?: number, // Para ONE_OFF jobs
  proposed_hourly_rate?: number, // Para HOURLY jobs
  status: 'PENDING'
}
```

### 3. MyJobsScreen ✅
**Ubicación:** `mobile-app/src/screens/Worker/MyJobsScreen.tsx`

**Funcionalidades:**
- Lista todas las candidaturas del usuario
- JOIN con `VoyJobs` para mostrar datos del trabajo
- Filtros por estado:
  * Todas
  * Pendientes (PENDING)
  * Aceptadas (ACCEPTED)
  * Rechazadas (REJECTED)
- Muestra contadores en cada filtro
- Tarjetas de candidatura con:
  * Badge de estado con icono y color
  * Título del trabajo
  * Categoría y ubicación
  * Precio propuesto
  * Fecha de aplicación
  * Mensaje enviado
  * Aviso si el trabajo está cerrado
- Pull-to-refresh
- Estado vacío informativo

**Consulta SQL:**
```typescript
SELECT 
  id, job_id, message, proposed_price, proposed_hourly_rate, status, created_at,
  job:VoyJobs!job_id (
    title, category, job_type, city, district, status
  )
FROM VoyJobApplications 
WHERE helper_user_id = {profile.id}
ORDER BY created_at DESC
```

### 4. ProfileScreen ✅
**Ubicación:** `mobile-app/src/screens/Worker/ProfileScreen.tsx`

**Funcionalidades:**
- Muestra información del perfil:
  * Avatar con inicial del nombre
  * Nombre completo
  * Email
  * Ciudad
  * Badge de "Trabajador"
- Modal de edición de perfil:
  * Editar nombre completo
  * Editar ciudad
  * Guardar cambios en `VoyUsers`
- Modal de cambio de contraseña:
  * Nueva contraseña (mínimo 6 caracteres)
  * Confirmación de contraseña
  * Actualización vía Supabase Auth
- Opción de cerrar sesión
- Información de la app y versión

**Actualización de perfil:**
```typescript
UPDATE VoyUsers 
SET full_name = ?, city = ?
WHERE auth_user_id = {user.id}
```

## Esquema de Base de Datos Utilizado

### VoyUsers
```sql
- id (uuid)
- auth_user_id (uuid) -- FK a auth.users
- full_name (text)
- email (text)
- role (text) -- 'WORKER', 'COMPANY', 'PARTICULAR'
- city (text)
- company_sector (text nullable)
- created_at (timestamp)
```

### VoyJobs
```sql
- id (uuid)
- creator_user_id (uuid) -- FK a VoyUsers.id
- title (text)
- description (text)
- category (text) -- limpieza, cuidado, etc
- job_type (text) -- 'ONE_OFF', 'HOURLY'
- price_fixed (numeric nullable)
- price_hourly (numeric nullable)
- price_negotiable (boolean)
- city (text)
- district (text) -- Arganzuela, Usera, etc
- neighborhood (text nullable)
- status (VoyJobStatus) -- 'OPEN', 'CLOSED', 'COMPLETED', 'CANCELLED', 'ASSIGNED', 'IN_PROGRESS'
- created_at (timestamp)
```

### VoyJobApplications
```sql
- id (uuid)
- job_id (uuid) -- FK a VoyJobs.id
- helper_user_id (uuid) -- FK a VoyUsers.id
- message (text)
- proposed_price (numeric nullable)
- proposed_hourly_rate (numeric nullable)
- status (text) -- 'PENDING', 'ACCEPTED', 'REJECTED'
- created_at (timestamp)
```

## Constantes y Categorías

Ubicación: `mobile-app/src/constants/index.ts`

```typescript
export const JOB_CATEGORIES = [
  { id: 'limpieza', label: 'Limpieza', icon: 'sparkles' },
  { id: 'cuidado', label: 'Cuidado de Personas', icon: 'heart' },
  { id: 'reparaciones', label: 'Reparaciones', icon: 'hammer' },
  { id: 'transporte', label: 'Transporte', icon: 'car' },
  // ... más categorías
];
```

## Navegación

```typescript
// Worker Tab Navigator
- Home (HomeScreen)
- MyJobs (MyJobsScreen) 
- Profile (ProfileScreen)

// Home Stack
- JobDetail (JobDetailScreen) -- navegación desde Home al hacer click en tarjeta
```

## Estados de Candidaturas

| Estado | Color | Icono | Descripción |
|--------|-------|-------|-------------|
| PENDING | Amarillo | time | Esperando respuesta del empleador |
| ACCEPTED | Verde | checkmark-circle | Candidatura aceptada |
| REJECTED | Rojo | close-circle | Candidatura rechazada |

## Estados de Trabajos

| Estado | Descripción |
|--------|-------------|
| OPEN | Trabajo disponible para aplicar |
| CLOSED | Trabajo cerrado (no se puede aplicar) |
| COMPLETED | Trabajo completado |
| CANCELLED | Trabajo cancelado |
| ASSIGNED | Trabajo asignado a un trabajador |
| IN_PROGRESS | Trabajo en progreso |

## Flujo Completo del Usuario Worker

1. **Login** → Rol detectado como 'WORKER' → Navegación a Worker tabs
2. **HomeScreen**:
   - Ve trabajos disponibles (status='OPEN')
   - Filtra por categoría
   - Busca por texto
   - Ve estadísticas de sus candidaturas
   - Click en trabajo → JobDetailScreen

3. **JobDetailScreen**:
   - Lee descripción completa
   - Click "Presentar candidatura" → Modal
   - Escribe mensaje
   - Propone precio/tarifa (opcional según tipo)
   - Envía → Inserta en VoyJobApplications
   - Confirmación → Navega a MyJobs

4. **MyJobsScreen**:
   - Ve todas sus candidaturas
   - Filtra por estado (PENDING/ACCEPTED/REJECTED)
   - Ve detalles de cada aplicación
   - Pull-to-refresh para actualizar

5. **ProfileScreen**:
   - Ve su información
   - Edita nombre y ciudad
   - Cambia contraseña
   - Cierra sesión

## Testing Checklist

- [x] Worker puede ver lista de trabajos OPEN
- [x] Filtros de categoría funcionan
- [x] Búsqueda de texto funciona
- [x] Estadísticas se calculan correctamente
- [x] Trabajos ya aplicados NO aparecen en lista
- [x] Modal de aplicación se abre correctamente
- [x] Validación de mensaje funciona
- [x] Inserción en VoyJobApplications exitosa
- [x] Navegación a MyJobs después de aplicar
- [x] Lista de candidaturas se carga con JOIN correcto
- [x] Filtros de estado funcionan
- [x] Edición de perfil funciona
- [x] Cambio de contraseña funciona
- [x] Cerrar sesión funciona

## Próximos Pasos (Opcionales)

### Chat System
Crear un sistema de mensajería entre empleador y trabajador:
- Tabla `VoyMessages` (sender_user_id, receiver_user_id, message, read)
- ChatScreen con lista de conversaciones
- Notificaciones push (opcional)

### Economics/Statistics Screen
Pantalla adicional para mostrar:
- Total de candidaturas enviadas
- Tasa de aceptación
- Trabajos completados
- Ingresos totales (cuando se implemente pagos)
- Gráficas de actividad

### Notificaciones
- Push notifications cuando candidatura es aceptada/rechazada
- Notificaciones locales para recordatorios

### Ratings System
- Sistema de valoraciones de trabajadores
- Estrellas y comentarios de empleadores
- Mostrar rating promedio en perfil

## Archivos Modificados

```
mobile-app/src/screens/Worker/
├── HomeScreen.tsx          ✅ Actualizado
├── JobDetailScreen.tsx     ✅ Reescrito completamente
├── MyJobsScreen.tsx        ✅ Reescrito completamente
└── ProfileScreen.tsx       ✅ Reescrito completamente
```

## Comandos de Desarrollo

```powershell
# Iniciar servidor
cd c:\YaVoy\App\mobile-app
npx expo start

# Limpiar caché y reiniciar
npx expo start -c

# Build Android
npx expo build:android

# Ver logs
npx react-native log-android
```

---

**Implementación completada el:** [Fecha actual]
**Desarrollado con:** React Native + Expo 54.0.0 + Supabase PostgreSQL
