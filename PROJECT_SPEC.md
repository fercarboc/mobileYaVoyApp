# YaVoy - Especificaciones del Proyecto

## 📋 Descripción General
YaVoy es una plataforma de microtrabos y servicios que conecta particulares, empresas y trabajadores. Permite publicar ofertas de trabajo, candidaturas, gestión de bonos, y administración completa.

---

## 👥 Roles de Usuario

### 1. **WORKER (Trabajador/Helper)**
- Busca y aplica a ofertas de trabajo
- Ve trabajos disponibles filtrados por categoría
- Envía candidaturas con mensaje y precio propuesto
- Consulta sus candidaturas (pendientes, aceptadas, rechazadas)
- Ve estadísticas económicas (ingresos, contrataciones, oportunidades)

### 2. **COMPANY (Empresa)**
- Publica ofertas de trabajo
- Gestiona candidatos (aceptar/rechazar)
- Sistema de bonos (5, 10, 20 anuncios)
- Tiene sector principal asignado
- Panel financiero con comisiones y bonos activos

### 3. **PARTICULAR (Particular)**
- Publica ofertas de trabajo puntuales
- Paga por publicación (sin bonos, pago individual)
- Gestiona candidatos
- Panel financiero con historial de pagos

### 4. **ADMIN (Administrador)**
- Panel completo de estadísticas
- Configuración de la plataforma
- Gestión de períodos gratuitos
- Configuración de precios de bonos
- Estadísticas por sectores, usuarios, ingresos

---

## 🗄️ Base de Datos (Supabase)

### Tablas Principales

#### **VoyUsers**
```sql
- id: UUID (PK)
- auth_user_id: UUID (FK a Supabase Auth)
- email: TEXT
- full_name: TEXT
- role: TEXT (WORKER, COMPANY, PARTICULAR, ADMIN)
- city: TEXT
- company_sector: TEXT (solo para COMPANY)
- created_at: TIMESTAMP
```

#### **VoyJobs**
```sql
- id: UUID (PK)
- creator_id: UUID (FK a VoyUsers)
- title: TEXT
- description: TEXT
- category: TEXT (MAYORES, HOGAR, MASCOTAS, RECADOS, DIGITAL, etc.)
- job_type: TEXT (ONE_OFF, HOURLY, RECURRING, CONTRACT)
- price_fixed: NUMERIC
- price_hourly: NUMERIC
- city: TEXT
- status: TEXT (OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED)
- created_at: TIMESTAMP
```

#### **VoyJobApplications**
```sql
- id: UUID (PK)
- job_id: UUID (FK a VoyJobs)
- helper_user_id: UUID (FK a VoyUsers)
- status: TEXT (PENDING, ACCEPTED, REJECTED)
- message: TEXT
- proposed_price: NUMERIC
- proposed_hourly_rate: NUMERIC
- created_at: TIMESTAMP
```

#### **VoyWorkSchedules**
```sql
- id: UUID (PK)
- job_id: UUID (FK a VoyJobs)
- day_of_week: INTEGER[] (0=Lunes, 6=Domingo)
- start_time: TIME
- end_time: TIME
```

#### **VoyWorkContracts**
```sql
- id: UUID (PK)
- job_id: UUID (FK a VoyJobs)
- contract_type: TEXT (FULL_TIME, PART_TIME, TEMPORARY, INTERMITTENT)
- monthly_salary: NUMERIC
- social_security: BOOLEAN
- hours_per_week: INTEGER
```

#### **VoySectors**
```sql
- id: TEXT (PK) (ej: "tecnologia-digital")
- name: TEXT
- emoji: TEXT
- description: TEXT
- is_primary: BOOLEAN
```
**20 sectores**: 10 principales + 10 secundarios

#### **VoyMicroTasks**
```sql
- id: UUID (PK)
- sector_id: TEXT (FK a VoySectors)
- name: TEXT
- description: TEXT
```

#### **VoyNotifications**
```sql
- id: UUID (PK)
- user_id: UUID (FK a VoyUsers)
- title: TEXT
- message: TEXT
- is_read: BOOLEAN
- created_at: TIMESTAMP
```

#### **VoyPayments**
```sql
- id: UUID (PK)
- job_id: UUID (FK a VoyJobs)
- payer_id: UUID (FK a VoyUsers)
- amount: NUMERIC
- commission: NUMERIC
- status: TEXT (pending, completed, failed)
- stripe_payment_id: TEXT
- created_at: TIMESTAMP
```

#### **VoyCompanySubscriptions**
```sql
- id: UUID (PK)
- company_id: UUID (FK a VoyUsers)
- subscription_type: TEXT (BONO_5, BONO_10, BONO_20)
- total_ads: INTEGER
- used_ads: INTEGER
- amount: NUMERIC
- status: TEXT (active, expired, cancelled)
- start_date: TIMESTAMP
- end_date: TIMESTAMP
- stripe_subscription_id: TEXT
```

#### **VoyPlatformSettings** (Configuración Admin)
```sql
- id: UUID (PK)
- free_period_enabled: BOOLEAN
- free_period_start: DATE
- free_period_end: DATE
- bono_5_price: NUMERIC (default: 20€)
- bono_10_price: NUMERIC (default: 35€)
- bono_20_price: NUMERIC (default: 60€)
```

---

## 🎨 Arquitectura de la Web

### **Modal Dashboard System**
- La web pública es accesible para todos
- Al autenticarse, se abre `DashboardModal` (modal flotante)
- No hay rutas protegidas `/client` o `/worker`
- Todo el contenido autenticado está en el modal

### **Componentes Principales**

#### `Layout.tsx`
- Navegación pública
- Logo YaVoy (yavoy.png)
- Menú: Cómo funciona, Sectores, Opiniones, Contacto
- Fondo azul (bg-blue-600)
- Botón verde "Registrarse" (bg-green-500)
- Sistema de notificaciones (badge rojo)

#### `DashboardModal.tsx`
- Modal full-screen para usuarios autenticados
- Header con gradiente brand
- Notificaciones dropdown (se marcan como leídas al abrir)
- Menú de perfil
- Contenedor para dashboards específicos por rol

#### `WorkerDashboard` (para WORKER)
**3 pestañas:**
1. **Trabajos Disponibles**: Grid 3 columnas, filtros por categoría + desplegable
2. **Mis Candidaturas**: Grid 3 columnas, cabecera con color (verde=aceptada, naranja=pendiente, gris=rechazada)
3. **Datos Económicos**: 4 cards de estadísticas + análisis + consejos

#### `ClientDashboard` (para COMPANY/PARTICULAR)
**3 pestañas:**
1. **Mi Perfil**: Información personal, sector (si es empresa)
2. **Mis Anuncios**: Lista de ofertas con candidatos expandibles
3. **Economía**: FinancialPanel con pagos, comisiones, bonos

#### `AdminDashboard` (para ADMIN)
**5 pestañas:**
1. **Resumen**: Cards con stats generales
2. **Sectores**: Tabla con estadísticas por sector
3. **Usuarios**: Desglose de trabajadores, empresas, particulares
4. **Ingresos**: Comisiones + bonos + total
5. **Configuración**: Período gratuito, precios de bonos

---

## 💳 Sistema de Bonos (Solo COMPANY)

### Planes Disponibles
- **Bono 5 anuncios**: 20€ (4€/anuncio)
- **Bono 10 anuncios**: 35€ (3.5€/anuncio) - Ahorro 12.5%
- **Bono 20 anuncios**: 60€ (3€/anuncio) - Ahorro 25% ⭐ Recomendado

### Funcionamiento
1. Empresa compra bono con Stripe
2. Se crea registro en `VoyCompanySubscriptions`
3. `total_ads` = número de anuncios comprados
4. `used_ads` incrementa con cada publicación
5. Cuando `used_ads >= total_ads`, el bono expira
6. Se muestran "X anuncios restantes" en el panel

---

## 📂 Categorías de Trabajos

### Principales (5)
- MAYORES 👴 - Mayores y Dependencia
- HOGAR 🏠 - Hogar y Mantenimiento
- MASCOTAS 🐾 - Mascotas
- RECADOS 🛒 - Compras y Recados
- DIGITAL 💻 - Tecnología Digital

### Secundarias (15)
- HOSTELERIA 🍽️ - Hostelería y Eventos
- TRANSPORTE 🚗 - Transporte y Reparto
- EDUCACION 📚 - Educación y Formación
- COMERCIO 🏪 - Comercio y Negocios
- SALUD 💊 - Salud y Bienestar
- CREATIVIDAD 🎨 - Creatividad y Arte
- ADMINISTRACION 📋 - Administración y Oficina
- CONSTRUCCION 🔨 - Construcción y Oficios
- AGRICULTURA 🌾 - Agricultura y Campo
- TURISMO ✈️ - Turismo y Alojamiento
- SEGURIDAD 🛡️ - Seguridad y Control
- MARKETING 📢 - Marketing de Calle
- TECNODOMESTICA 🔌 - Tecnología Doméstica
- MODA 👗 - Moda y Textil
- OTROS 📦 - Otros Servicios

---

## 🔔 Sistema de Notificaciones

### Eventos que Crean Notificaciones
1. **Candidatura aceptada**: "Tu candidatura para '[título]' ha sido aceptada. ¡Felicidades!"
2. **Nueva candidatura recibida** (empleador): "Nuevo candidato para '[título]'"
3. **Trabajo completado**: "El trabajo '[título]' ha sido marcado como completado"
4. **Bono próximo a agotarse**: "Te quedan 2 anuncios en tu bono"

### Comportamiento
- Badge rojo con contador en campana de notificaciones
- Al abrir dropdown, todas se marcan como leídas (`is_read = true`)
- Badge desaparece automáticamente

---

## 🎯 Flujos Principales

### Flujo: Publicar Oferta (COMPANY)
1. Clic "Publicar Oferta"
2. Formulario con:
   - Título
   - Descripción (con IA - Gemini)
   - Categoría (desplegable con 20 opciones)
   - Tipo de trabajo (Puntual, Recurrente, Por Horas, Con Contrato)
   - Precio/Tarifa
   - Ubicación
   - Horarios (si aplica)
   - Detalles de contrato (si aplica)
3. Verificar bonos disponibles
4. Si no tiene bonos: mostrar SubscriptionPanel
5. Publicar y decrementar `used_ads`

### Flujo: Candidatura (WORKER)
1. Ver trabajos disponibles (excluye asignados)
2. Filtrar por categoría
3. Clic "Ver Detalles y Candidar"
4. Modal con:
   - Mensaje de presentación (opcional)
   - Precio propuesto (opcional)
   - Tarifa horaria propuesta (opcional)
5. Enviar candidatura → status: PENDING
6. Notificación al empleador

### Flujo: Aceptar Candidato (COMPANY/PARTICULAR)
1. Ver anuncio en "Mis Anuncios"
2. Expandir lista de candidatos
3. Ver detalles del candidato
4. Clic "Aceptar"
5. Application status → ACCEPTED
6. Notificación al trabajador
7. Trabajo desaparece de "Trabajos Disponibles" para otros

---

## 🔐 Seguridad (RLS - Row Level Security)

### Políticas Aplicadas
- **VoyJobs**: 
  - SELECT: público
  - INSERT/UPDATE/DELETE: solo creator
- **VoyJobApplications**:
  - SELECT: helper o job creator
  - INSERT: authenticated
  - UPDATE: job creator (cambiar status)
- **VoySectors/VoyMicroTasks**: 
  - SELECT: público
- **VoyNotifications**:
  - SELECT/UPDATE: solo user_id = auth.uid()
- **VoyCompanySubscriptions**:
  - SELECT/UPDATE: solo company_id = user_id

---

## 🎨 Diseño Visual

### Colores Principales
```css
brand-500: #6366f1 (Indigo)
brand-600: #4f46e5 (Indigo oscuro)
bg-blue-600: #2563eb (Azul navegación)
bg-green-500: #22c55e (Botón registrarse)
bg-emerald-500: #10b981 (Éxito)
bg-orange-500: #f97316 (Pendiente)
bg-gray-400: #9ca3af (Rechazado)
```

### Tipografía
- Font: Default (system)
- Tamaños: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl

### Componentes Reutilizables
- Icons (Lucide React)
- Modales con backdrop blur
- Cards con hover shadow
- Badges de estado
- Gradientes en headers

---

## 🚀 Integraciones

### Stripe (Pagos)
- Modo TEST: `pk_test_51Rb0JHGp2GdMxVpi...`
- Bonos de empresa (compra única)
- Webhook para confirmación de pago

### Gemini AI (Google)
- Optimización de descripciones de trabajos
- Sugerencia de precios

### Supabase
- Auth (correo/contraseña)
- Database (PostgreSQL)
- RLS activado
- Storage (futuro: para fotos de perfil)

---

## 📱 Próximos Pasos para App Móvil

### Prioridades
1. Sistema de Auth (misma base de datos Supabase)
2. Navegación por tabs/drawer según rol
3. Pantallas principales:
   - Login/Register
   - Dashboard (según rol)
   - Lista de trabajos
   - Detalle de trabajo
   - Formulario de candidatura
   - Mis candidaturas
   - Notificaciones push
4. Sistema de pagos móvil (Stripe SDK)

### Consideraciones
- Usar misma estructura de datos (types.ts)
- Reutilizar lógica de negocio
- Adaptación de UI a móvil (React Native o Flutter)
- Notificaciones push (Firebase)
- Geolocalización para trabajos cercanos

---

## 📝 Notas Importantes

### Cambios Recientes
- ✅ Sistema de sectores basado en DB (no hardcoded)
- ✅ Candidaturas en grid 3 columnas con colores
- ✅ Datos económicos en dashboard de trabajador
- ✅ Panel de admin completo con configuración
- ✅ Notificaciones se marcan como leídas automáticamente
- ✅ Trabajos asignados no aparecen en disponibles
- ✅ Filtros mejorados con dropdown de categorías

### Pendientes
- [ ] Crear tabla VoyPlatformSettings en Supabase
- [ ] Sistema de valoraciones/reseñas
- [ ] Chat entre empleador y trabajador
- [ ] **Geolocalización con mapas de trabajadores disponibles**
- [ ] Upload de fotos de perfil
- [ ] **Verificación de identidad (DNI/NIE)**
- [ ] Sistema de denuncias/reportes
- [ ] Analytics avanzado

---

## 🗺️ Funcionalidad Futura: Mapa de Trabajadores

### Objetivo
Mostrar en un mapa interactivo los trabajadores disponibles por zona/barrio, permitiendo a los clientes ver cobertura en tiempo real y contactar con trabajadores cercanos.

### Datos a Recopilar (Registro Worker)
```sql
VoyWorkerLocation
- worker_id: UUID (FK a VoyUsers)
- latitude: DECIMAL(10, 8)
- longitude: DECIMAL(11, 8)
- address_street: TEXT (ej: "Calle de Embajadores")
- neighborhood: TEXT (ej: "Lavapiés")
- city: TEXT (ej: "Madrid")
- postal_code: TEXT (ej: "28012")
- is_available: BOOLEAN (Online/Offline)
- availability_radius_km: INTEGER (default: 5)
- last_location_update: TIMESTAMP
```

### Verificación de Identidad
```sql
VoyIdentityVerification
- user_id: UUID (FK a VoyUsers)
- document_type: TEXT (DNI, NIE, Pasaporte)
- document_number: TEXT (cifrado)
- document_front_url: TEXT (Storage URL)
- document_back_url: TEXT (Storage URL)
- verification_status: TEXT (PENDING, VERIFIED, REJECTED)
- verified_at: TIMESTAMP
- verified_by_admin_id: UUID
```

### Características del Mapa

#### Versión Cliente (Pública)
- **Iconos de trabajadores** disponibles en zona
- **Colores por estado**:
  - 🟢 Verde: Disponible ahora
  - 🟠 Naranja: Disponible en 1-2h
  - ⚫ Gris: No disponible
- **Filtros**:
  - Por sector (Mayores, Hogar, Mascotas, etc.)
  - Por valoración mínima
  - Radio de búsqueda (500m, 1km, 2km, 5km)
  - Disponibilidad (ahora, hoy, esta semana)
- **Click en trabajador**:
  - Mini-perfil con nombre, valoración, especialidades
  - Botón "Contactar" o "Enviar oferta"
  - Distancia aproximada

#### Versión Admin (Dashboard)
- **Heatmap de cobertura** por barrios
- **Densidad de trabajadores** por zona
- **Zonas frías** (sin cobertura) para marketing
- **Trabajadores activos vs inactivos**
- **Filtros avanzados**:
  - Por antigüedad
  - Por número de trabajos completados
  - Por tasa de aceptación

### Privacidad y Seguridad

#### Protección de Datos
1. **Ubicación aproximada**: Radio de ocultación de 200-300m
   - El punto en el mapa NO es la dirección exacta
   - Algoritmo añade desplazamiento aleatorio
2. **Nunca mostrar**:
   - Número de portal
   - Piso/puerta
   - Coordenadas exactas
3. **Control del trabajador**:
   - Puede desactivar visibilidad en mapa
   - Puede cambiar radio de disponibilidad
   - Puede aparecer como "offline"

#### Cumplimiento Legal
- ✅ **Consentimiento explícito** para geolocalización (checkbox en registro)
- ✅ **GDPR compliant**: Derecho a eliminar ubicación en cualquier momento
- ✅ **LOPDGDD** (Ley Orgánica Protección Datos España)
- ✅ **Cifrado** de datos sensibles (DNI en reposo)
- ✅ **Verificación DNI**: Solo admin puede acceder a documentos

### Tecnologías a Usar

#### APIs de Mapas
- **Google Maps JavaScript API** (Opción 1)
  - Pros: Muy completo, familiar para usuarios
  - Contras: Caro (tras límite gratuito)
- **Mapbox** (Opción 2) ⭐ Recomendado
  - Pros: Más barato, personalizable, mejor rendimiento
  - Contras: Menos conocido
- **Leaflet + OpenStreetMap** (Opción 3)
  - Pros: Gratis, open-source
  - Contras: Menos features

#### Geocodificación
```javascript
// Convertir dirección → coordenadas
const geocodeAddress = async (street, city, postalCode) => {
  const address = `${street}, ${city}, ${postalCode}, España`;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
  );
  const data = await response.json();
  return {
    lat: data.results[0].geometry.location.lat,
    lng: data.results[0].geometry.location.lng
  };
};
```

#### Búsqueda por Proximidad
```sql
-- Encontrar trabajadores en radio de 5km
SELECT w.*, u.full_name, u.avatar_url,
  (6371 * acos(cos(radians(@user_lat)) * cos(radians(latitude)) 
  * cos(radians(longitude) - radians(@user_lng)) 
  + sin(radians(@user_lat)) * sin(radians(latitude)))) AS distance_km
FROM VoyWorkerLocation w
JOIN VoyUsers u ON w.worker_id = u.id
WHERE w.is_available = true
  AND (6371 * acos(cos(radians(@user_lat)) * cos(radians(latitude)) 
       * cos(radians(longitude) - radians(@user_lng)) 
       + sin(radians(@user_lat)) * sin(radians(latitude)))) <= 5
ORDER BY distance_km ASC
LIMIT 20;
```

### Flujo de Usuario

#### Trabajador (Registro)
1. Completa registro básico
2. **Paso adicional**: "Verificación y Ubicación"
   - Upload DNI (frente y dorso)
   - Introduce dirección (calle + barrio, sin número)
   - Acepta términos de geolocalización
3. Sistema geocodifica automáticamente
4. Admin verifica DNI (24-48h)
5. Trabajador aparece en mapa como "verificado"

#### Cliente (Búsqueda)
1. Entra en "Buscar Trabajadores"
2. Ve mapa con su ubicación
3. Iconos de trabajadores disponibles cerca
4. Aplica filtros (sector, valoración)
5. Click en trabajador → Ver perfil
6. "Enviar mensaje" o "Crear oferta para este trabajador"

### Roadmap de Implementación

**Q1 2026** (Fase 1 - Backend)
- Crear tablas VoyWorkerLocation y VoyIdentityVerification
- API geocodificación en registro
- Búsqueda por proximidad (sin UI)
- Sistema de verificación admin

**Q2 2026** (Fase 2 - Admin Dashboard)
- Mapa admin con todos los trabajadores
- Heatmap de cobertura
- Analytics de zonas

**Q3 2026** (Fase 3 - Mapa Público)
- Interfaz mapa para clientes
- Filtros y búsqueda
- Perfil trabajador desde mapa

**Q4 2026** (Fase 4 - Optimizaciones)
- Geolocalización en tiempo real (GPS móvil)
- Notificaciones push "Hay ofertas cerca de ti"
- Algoritmo de matching por proximidad

### KPIs de Éxito
- 📍 **80%+ trabajadores** con ubicación verificada
- 👁️ **40%+ clientes** usan mapa para buscar
- ⚡ **50% reducción** tiempo de matching
- 📈 **30% aumento** conversión (búsqueda → contratación)

### Costes Estimados
- Google Maps API: ~200€/mes (10K requests)
- Mapbox: ~50€/mes (10K requests) ⭐
- Storage para DNIs (Supabase): ~20€/mes (1000 documentos)
- **Total**: ~70-220€/mes según volumen

---

## 🔗 URLs Importantes

- **Web**: http://localhost:3000
- **Supabase Project**: [configurar URL]
- **Stripe Dashboard**: https://dashboard.stripe.com/test
- **Repo (si aplica)**: [configurar]

---

**Última actualización**: 12 de diciembre de 2025
**Versión**: 1.0
