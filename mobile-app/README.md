# 📱 YaVoy - Mobile App (React Native + Expo)

> App móvil para trabajadores que buscan empleos de proximidad en Madrid

---

## 🚀 Inicio Rápido

### Pre-requisitos

- Node.js 18+ instalado
- npm o yarn
- Expo CLI (se instala automáticamente)
- Expo Go app en tu móvil ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Instalación

```bash
cd mobile-app
npm install
```

### Ejecutar en desarrollo

```bash
# Inicia el servidor de desarrollo
npm start

# O directamente en Android/iOS
npm run android
npm run ios
```

Escanea el código QR con **Expo Go** para ver la app en tu móvil.

---

## 📂 Estructura del Proyecto

```
mobile-app/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   └── JobCard.tsx      # Card de trabajo
│   ├── constants/
│   │   └── index.ts         # Constantes (categorías, colores, distritos)
│   ├── navigation/
│   │   └── MainNavigator.tsx  # Bottom tabs navigator
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx      # Pantalla login
│   │   │   └── RegisterScreen.tsx   # Pantalla registro
│   │   └── Worker/
│   │       ├── HomeScreen.tsx       # Lista trabajos disponibles
│   │       ├── MyJobsScreen.tsx     # Mis candidaturas
│   │       └── ProfileScreen.tsx    # Perfil usuario
│   ├── services/
│   │   ├── api.ts          # Servicios API (Auth, Jobs)
│   │   └── supabase.ts     # Cliente Supabase
│   └── types/
│       └── index.ts        # Tipos TypeScript
├── App.tsx                 # Entry point
├── app.json                # Configuración Expo
├── package.json
├── tsconfig.json
└── babel.config.js
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación
- [x] Login con email/contraseña
- [x] Registro de usuario (WORKER / PARTICULAR)
- [x] Persistencia de sesión (AsyncStorage)
- [x] Logout

### ✅ Pantalla Principal (HomeScreen)
- [x] **Lista de trabajos disponibles**
- [x] **Búsqueda por texto**
- [x] **Filtros por categoría** (20 categorías)
- [x] **Pull-to-refresh**
- [x] Cards con:
  - Urgencia (Sin prisa / Hoy / ¡Urgente!)
  - Precio
  - Badge de CONTRATO (si aplica)
  - Ubicación (barrio + distrito)
  - Distancia (si geolocalización activa)

### ✅ Mis Candidaturas (MyJobsScreen)
- [x] **Lista de candidaturas enviadas**
- [x] **Filtros**: Todas / Pendientes / Aceptadas / Rechazadas
- [x] Estados con colores:
  - 🟢 Verde: Aceptada
  - 🟠 Naranja: Pendiente
  - 🔴 Rojo: Rechazada
- [x] Muestra precio propuesto vs precio original

### ✅ Perfil (ProfileScreen)
- [x] **Datos del usuario**
- [x] **Rating y opiniones**
- [x] **Ubicación actual**
- [x] **Botón cerrar sesión**

---

## 🗄️ Conexión con Supabase

La app se conecta a la misma base de datos que la web:

**Credenciales** (ya configuradas en `src/services/supabase.ts`):
- URL: `https://ewqnrcnsqtzkfavojeon.supabase.co`
- Anon Key: `eyJhbGc...` (incluida en el código)

### Tablas usadas:
- `VoyUsers` - Usuarios
- `VoyJobs` - Trabajos/Ofertas
- `VoyJobApplications` - Candidaturas
- `VoyWorkSchedules` - Horarios (trabajos recurrentes)
- `VoyWorkContracts` - Contratos (trabajos formales)

---

## 🎨 Diseño

### Colores principales
```typescript
primary: '#6366f1'      // Indigo (botones, badges)
secondary: '#22c55e'    // Verde (éxito)
danger: '#ef4444'       // Rojo (rechazo, logout)
dark: '#1e293b'         // Texto principal
gray: '#64748b'         // Texto secundario
lightGray: '#f1f5f9'    // Fondos
```

### Componentes UI
- **React Navigation** (Stack + Bottom Tabs)
- **Ionicons** (iconos)
- **SafeAreaView** (compatibilidad notch/status bar)

---

## 📋 Próximas Funcionalidades (TODO)

### 🔴 Prioridad Alta
- [ ] **Pantalla Detalle de Trabajo** (JobDetailScreen)
  - Ver toda la info del trabajo
  - Botón "Aplicar" con modal
  - Mensaje personalizado
  - Proponer precio
- [ ] **Geolocalización**
  - Pedir permisos de ubicación
  - Mostrar trabajos más cercanos
  - Calcular distancia en tiempo real
- [ ] **Notificaciones Push**
  - Configurar Expo Notifications
  - Recibir cuando te aceptan
  - Badge en tab de notificaciones

### 🟠 Prioridad Media
- [ ] **Mapa de Trabajos**
  - Vista de mapa con pins
  - Filtro por radio (500m, 1km, 2km, 5km)
  - Toggle entre lista/mapa
- [ ] **Chat en tiempo real**
  - Mensajes con empleador
  - Supabase Realtime
- [ ] **Sistema de Valoraciones**
  - Dejar reseña tras completar trabajo
  - Ver reseñas de empleadores

### 🟢 Prioridad Baja
- [ ] Onboarding (primera vez)
- [ ] Modo oscuro
- [ ] Compartir trabajos
- [ ] Favoritos/Guardados
- [ ] Historial de trabajos completados
- [ ] Analytics (tracking eventos)

---

## 🔧 Configuración Avanzada

### Cambiar Backend de Supabase

Edita `src/services/supabase.ts`:

```typescript
const supabaseUrl = 'TU_URL_AQUI';
const supabaseAnonKey = 'TU_ANON_KEY_AQUI';
```

### Añadir Geolocalización

```bash
# Ya está instalado en package.json
npx expo install expo-location
```

En `app.json`, los permisos ya están configurados:
```json
"ios": {
  "infoPlist": {
    "NSLocationWhenInUseUsageDescription": "YaVoy necesita tu ubicación..."
  }
}
```

Ejemplo de uso:
```typescript
import * as Location from 'expo-location';

const getLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;
  
  let location = await Location.getCurrentPositionAsync({});
  console.log(location.coords.latitude, location.coords.longitude);
};
```

### Añadir Notificaciones Push

```typescript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Registrar token para push
const token = (await Notifications.getExpoPushTokenAsync()).data;
// Guardar token en Supabase para enviar notificaciones
```

---

## 🐛 Troubleshooting

### Error: "Couldn't start project"
```bash
# Limpia cache de Expo
npx expo start -c
```

### Error de TypeScript
```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

### App no se conecta a Supabase
- Verifica que las credenciales en `supabase.ts` sean correctas
- Comprueba que tienes conexión a internet
- Revisa logs en la terminal de Expo

### Bottom tabs no funcionan
```bash
# Reinstala dependencias de navegación
npm install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
```

---

## 📱 Build para Producción

### Android APK

```bash
# Configura tu cuenta de Expo
npx expo login

# Build APK
eas build --platform android --profile preview
```

### iOS IPA

```bash
# Necesitas cuenta de Apple Developer
eas build --platform ios --profile preview
```

### Publicar en Stores

Consulta la [documentación oficial de Expo](https://docs.expo.dev/distribution/introduction/).

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en la terminal de Expo
2. Consulta [Expo Documentation](https://docs.expo.dev/)
3. Revisa [Supabase Docs](https://supabase.com/docs)

---

## 📄 Licencia

Proyecto privado - YaVoy 2025

---

## 🙌 Contribuciones

Para contribuir:
1. Crea un branch `feature/nombre-feature`
2. Haz commit de tus cambios
3. Push al branch
4. Crea un Pull Request

---

**¡Disfruta desarrollando con YaVoy Mobile! 🚀**
