# 🚀 GUÍA DE INSTALACIÓN Y USO

## 📋 Requisitos previos

- **Node.js**: 18.x o superior
- **npm** o **yarn**
- **Expo CLI**: Se instala automáticamente
- **Expo Go app** en tu móvil:
  - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [iOS](https://apps.apple.com/app/expo-go/id982107779)

## ⚙️ Instalación

### 1. Instalar dependencias

```bash
cd mobile-app
npm install
```

### 2. Configurar variables de entorno (opcional)

Las credenciales de Supabase ya están configuradas en `src/services/supabase.ts`. Si necesitas cambiarlas, edita ese archivo.

## 🏃‍♂️ Ejecutar la app

### Modo desarrollo (recomendado para testing)

```bash
npm start
```

Esto abrirá **Expo DevTools** en tu navegador. Desde ahí:

1. **Escanea el código QR** con:
   - **Android**: Expo Go app
   - **iOS**: Cámara del iPhone → Abre en Expo Go

2. La app se cargará en tu móvil en ~10 segundos

### Ejecutar en emulador Android

```bash
npm run android
```

Requisitos:
- Android Studio instalado
- Android SDK configurado
- Emulador Android ejecutándose

### Ejecutar en simulador iOS (solo macOS)

```bash
npm run ios
```

Requisitos:
- Xcode instalado
- iOS Simulator

## 📱 Probar funcionalidades

### 1. Registro de usuario
- Abre la app
- Toca "Crear cuenta"
- Rellena los datos:
  - Nombre completo
  - Email
  - Contraseña (min 6 caracteres)
  - Selecciona rol: **WORKER** (recomendado para testing)
  - Ubicación por defecto: Centro, Sol
- Toca "Registrarse"

### 2. Inicio de sesión
Si ya tienes cuenta:
- Email: tu@email.com
- Contraseña: tucontraseña

### 3. Navegar por trabajos
- **Home**: Lista de trabajos disponibles
  - Buscar por texto
  - Filtrar por categoría (20 categorías)
  - Pull-to-refresh para actualizar
  - Toca un trabajo para ver detalles

### 4. Ver detalle de trabajo
- Título, descripción completa
- Precio, urgencia, ubicación
- Horarios (si es contrato/recurrente)
- Botón "Aplicar" → abre modal

### 5. Aplicar a un trabajo
- Propón tu precio
- Escribe mensaje de presentación
- Envía candidatura
- Ve a "Mis Ofertas" para ver el estado

### 6. Mis candidaturas
- **Todas**: Lista completa
- **Pendientes**: En revisión
- **Aceptadas**: Confirmadas
- **Rechazadas**: No seleccionadas

### 7. Perfil
- Ver datos del usuario
- Rating y opiniones
- Ubicación actual
- Cerrar sesión

## 🗺️ Geolocalización

La app **solicita permisos de ubicación** al iniciar:

### Android
- Permiso `ACCESS_FINE_LOCATION` solicitado automáticamente
- Acepta el permiso para ver distancia a trabajos

### iOS
- Mensaje personalizado: "YaVoy necesita tu ubicación para mostrarte trabajos cercanos"
- Acepta "Permitir mientras se usa la app"

### Sin permisos
- La app usa ubicación por defecto: **Madrid Centro (40.4168, -3.7038)**
- Los trabajos se ordenan por fecha, no por distancia

## 🐛 Solución de problemas

### Error: "Metro bundler not running"
```bash
npx expo start -c
```
(Esto limpia la caché)

### Error: "Unable to resolve module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error de TypeScript
```bash
npm run tsc
```
Revisa los errores y corrígelos en los archivos indicados.

### App no se conecta a Supabase
1. Verifica conexión a internet
2. Comprueba credenciales en `src/services/supabase.ts`
3. Revisa logs en terminal de Expo

### Permisos de ubicación no funcionan
**Android**:
```bash
# Si usas emulador, envía coordenadas manualmente
adb emu geo fix -3.7038 40.4168
```

**iOS**:
- Simulator → Features → Location → Custom Location
- Lat: 40.4168, Lon: -3.7038

## 📦 Build para producción

### Crear APK Android (Preview)

```bash
# 1. Instala EAS CLI
npm install -g eas-cli

# 2. Login en Expo
eas login

# 3. Configura proyecto
eas build:configure

# 4. Build APK
eas build --platform android --profile preview
```

El APK estará disponible en Expo Dashboard tras ~15min.

### Crear IPA iOS (Preview)

```bash
eas build --platform ios --profile preview
```

**Nota**: Necesitas cuenta de **Apple Developer** ($99/año).

## 🔧 Scripts disponibles

```bash
npm start          # Inicia Expo DevTools
npm run android    # Ejecuta en Android
npm run ios        # Ejecuta en iOS
npm run web        # Ejecuta en navegador (experimental)
npm run tsc        # Verifica tipos TypeScript
```

## 📊 Estructura de navegación

```
App.tsx (Root Navigator)
└── Auth Flow (si no autenticado)
    ├── LoginScreen
    └── RegisterScreen

└── Main Navigator (si autenticado)
    ├── Home Tab (Stack Navigator)
    │   ├── HomeList (lista trabajos)
    │   └── JobDetail (detalle + aplicar)
    ├── MyJobs Tab (candidaturas)
    └── Profile Tab (perfil)
```

## 🎨 Personalización

### Cambiar colores

Edita `src/constants/index.ts`:

```typescript
export const COLORS = {
  primary: '#6366f1',    // Color principal
  secondary: '#22c55e',  // Verde
  danger: '#ef4444',     // Rojo
  // ...
};
```

### Añadir nueva categoría

En `src/constants/index.ts`:

```typescript
export const JOB_CATEGORIES = [
  // ...
  {
    id: 'NUEVA_CATEGORIA',
    name: 'Nueva Categoría',
    icon: 'star-outline',
    isPrimary: false,
  },
];
```

### Cambiar texto de la app

Todos los textos están hardcoded en los componentes. Para i18n (internacionalización), considera usar `react-i18next`.

## 📞 Soporte

Si encuentras problemas:

1. **Revisa logs**:
   ```bash
   npx expo start
   # Toca 'j' para abrir debugger
   ```

2. **Limpia caché**:
   ```bash
   npx expo start -c
   ```

3. **Reinstala dependencias**:
   ```bash
   rm -rf node_modules
   npm install
   ```

4. **Consulta documentación**:
   - [Expo Docs](https://docs.expo.dev/)
   - [React Navigation](https://reactnavigation.org/)
   - [Supabase JS](https://supabase.com/docs/reference/javascript/introduction)

---

**¡Buena suerte desarrollando con YaVoy Mobile! 🎉**
