# 📱 YaVoy Mobile - CHANGELOG

## [1.0.0] - 2024-12-12

### ✨ Features Implementadas

#### 🔐 Autenticación
- [x] Login con email/contraseña
- [x] Registro de usuarios (WORKER / PARTICULAR)
- [x] Persistencia de sesión con AsyncStorage
- [x] Auto-refresh de tokens de Supabase
- [x] Logout con confirmación

#### 🏠 Pantalla Home (Trabajos)
- [x] Lista de trabajos disponibles con FlatList
- [x] Pull-to-refresh para actualizar
- [x] Búsqueda por texto (título, descripción)
- [x] Filtros por categoría (20 categorías total)
  - 5 principales: Mayores, Hogar, Mascotas, Recados, Digital
  - 15 secundarias: Hostelería, Transporte, Educación, etc.
- [x] Scroll horizontal de categorías
- [x] Badge de notificaciones (hardcoded "3")
- [x] Cards con:
  - Urgencia (Sin prisa / Hoy / ¡Urgente!)
  - Precio (€/mes para contratos)
  - Título y descripción (truncados)
  - Ubicación (barrio, distrito)
  - Distancia en km (si geolocalización activa)
  - Badge de "CONTRATO" si aplica
  - Icono de categoría

#### 📋 Pantalla Detalle de Trabajo
- [x] Información completa del trabajo
  - Título, descripción, categoría
  - Precio, urgencia, ubicación
  - Distancia desde ubicación del usuario
- [x] Horarios (si RECURRING o CONTRACT)
  - Días de la semana
  - Horas inicio/fin
  - Fechas de inicio/fin
- [x] Detalles de contrato (si CONTRACT)
  - Tipo de contrato (completa/media/temporal)
  - Salario mensual
  - Horas semanales
  - Beneficios
- [x] Botón de llamar (si tiene teléfono)
- [x] Modal "Aplicar a este trabajo"
  - Proponer precio personalizado
  - Mensaje de presentación
  - Validación de campos
  - Envío de candidatura

#### 📝 Mis Candidaturas
- [x] Lista de trabajos a los que aplicaste
- [x] Filtros por estado:
  - Todas
  - Pendientes (🟠 naranja)
  - Aceptadas (🟢 verde)
  - Rechazadas (🔴 rojo)
- [x] Muestra precio propuesto vs precio original
- [x] Mensaje de candidatura
- [x] Fecha de aplicación
- [x] Empty state con CTA

#### 👤 Perfil
- [x] Avatar circular con inicial
- [x] Nombre, email, rol
- [x] Rating de estrellas (5.0)
- [x] Número de opiniones (0)
- [x] Ubicación actual
- [x] Opciones de configuración:
  - Editar perfil
  - Notificaciones
  - Ubicación
  - Ayuda
  - Privacidad
- [x] Botón logout con confirmación
- [x] Versión de la app

#### 🗺️ Geolocalización
- [x] Solicitud de permisos al iniciar
- [x] Obtención de coordenadas GPS
- [x] Cálculo de distancia (fórmula Haversine)
- [x] Ordenamiento de trabajos por proximidad
- [x] Fallback a Madrid Centro si se deniega

#### 🎨 UI/UX
- [x] Navegación con React Navigation 7
  - Stack Navigator (Auth)
  - Bottom Tabs (Home, MyJobs, Profile)
  - Nested Stack (Home + JobDetail)
- [x] SafeAreaView para notch/status bar
- [x] Colores consistentes (COLORS constants)
- [x] Iconos Ionicons
- [x] Loading states
- [x] Empty states
- [x] Pull-to-refresh
- [x] KeyboardAvoidingView
- [x] Toasts/Alerts nativos

### 🛠️ Arquitectura Técnica

#### Stack
- **React Native**: 0.76.5
- **Expo**: ~52.0.0 (managed workflow)
- **TypeScript**: ^5.3.0 (strict mode)
- **React Navigation**: 7.x
- **Supabase JS**: ^2.39.0
- **Expo Location**: ~18.0.0
- **Expo Notifications**: ~0.29.0 (configurado)
- **React Native Maps**: 1.18.0 (instalado)
- **AsyncStorage**: 2.0.0

#### Estructura de Carpetas
```
mobile-app/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── JobCard.tsx
│   │   └── LocationServices.tsx
│   ├── constants/        # Constantes (colores, categorías)
│   ├── navigation/       # Configuración navegación
│   ├── screens/
│   │   ├── Auth/         # Login, Register
│   │   └── Worker/       # Home, MyJobs, Profile, JobDetail
│   ├── services/         # API y Supabase
│   └── types/            # TypeScript types
├── assets/               # Imágenes (placeholder)
├── App.tsx               # Entry point
├── app.json              # Expo config
├── package.json
├── tsconfig.json
├── babel.config.js       # Module resolver
├── README.md
├── GETTING_STARTED.md
└── start.ps1 / start.sh
```

#### Servicios
- **AuthService**:
  - `signIn(email, password)`
  - `signUp(email, password, fullName, role, district, neighborhood)`
  - `signOut()`
  - `getCurrentUser()`
- **JobService**:
  - `getJobs(latitude?, longitude?)` → ordena por distancia
  - `getJobById(id)`
  - `applyToJob(jobId, message, proposedPrice)`
  - `getMyApplications()`

### 📊 Base de Datos (Supabase)

#### Tablas usadas:
- `VoyUsers` - Perfiles de usuarios
- `VoyJobs` - Trabajos publicados
- `VoyJobApplications` - Candidaturas
- `VoyWorkSchedules` - Horarios (trabajos recurrentes)
- `VoyWorkContracts` - Contratos formales

#### Configuración:
- URL: `https://ewqnrcnsqtzkfavojeon.supabase.co`
- Anon Key: Incluida en código
- RLS: Habilitado
- Auth: Email/Password

### 🚀 Scripts Disponibles

```bash
npm start          # Expo DevTools
npm run android    # Android emulator/device
npm run ios        # iOS simulator
npm run web        # Web browser (experimental)
npm run tsc        # TypeScript check
```

```powershell
.\start.ps1        # Script interactivo Windows
```

```bash
./start.sh         # Script interactivo Mac/Linux
```

### 📝 Notas Técnicas

#### Tipos unificados:
- `UserRole`: 'PARTICULAR' | 'COMPANY' | 'WORKER' | 'ADMIN'
- `JobUrgency`: 'LOW' | 'MEDIUM' | 'HIGH' (SCREAMING_SNAKE_CASE)
- `JobType`: 'ONE_TIME' | 'RECURRING' | 'CONTRACT'
- `TaskStatus`: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

#### Colores de urgencia:
```typescript
URGENCY_COLORS = {
  LOW: { r: 34, g: 197, b: 94 },      // Verde
  MEDIUM: { r: 245, g: 158, b: 11 },  // Naranja
  HIGH: { r: 239, g: 68, b: 68 },     // Rojo
}
```

#### Permisos (app.json):
- **iOS**: `NSLocationWhenInUseUsageDescription`
- **Android**: `ACCESS_FINE_LOCATION`, `NOTIFICATIONS`

### ⚠️ Limitaciones Conocidas

- [ ] Assets son placeholders (icon.png, splash.png faltantes)
- [ ] Notificaciones push: configuradas pero no implementadas
- [ ] Mapa de trabajos: dependencia instalada, UI pendiente
- [ ] Chat en tiempo real: no implementado
- [ ] Sistema de valoraciones: solo mocks
- [ ] Modo oscuro: no disponible
- [ ] Onboarding: no implementado
- [ ] Analytics: no implementado

### 🐛 Bugs Conocidos

- TypeScript puede reportar errores de módulos en primera ejecución (reinicia VS Code)
- Expo puede requerir `npx expo start -c` tras npm install
- Geolocalización puede fallar en emuladores (usa coordenadas manuales)

### 📚 Documentación

- [README.md](README.md) - Overview del proyecto
- [GETTING_STARTED.md](GETTING_STARTED.md) - Guía de instalación completa
- [PROJECT_SPEC.md](../PROJECT_SPEC.md) - Especificación del negocio
- [INVESTOR_PITCH.md](../INVESTOR_PITCH.md) - Pitch a inversores

### 🎯 Próximos Pasos

#### Alta Prioridad
- [ ] Crear assets reales (logo, splash)
- [ ] Implementar notificaciones push
- [ ] Pantalla de editar perfil
- [ ] Historial de trabajos completados
- [ ] Añadir tests unitarios

#### Media Prioridad
- [ ] Vista de mapa con pins
- [ ] Chat con empleador
- [ ] Sistema de valoraciones funcional
- [ ] Onboarding para nuevos usuarios
- [ ] Modo oscuro

#### Baja Prioridad
- [ ] Compartir trabajos
- [ ] Favoritos/Guardados
- [ ] Analytics y tracking
- [ ] Soporte multi-idioma
- [ ] Accesibilidad (screen readers)

---

**Desarrollado con ❤️ para YaVoy**
