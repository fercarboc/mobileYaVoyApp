import { CompanySector } from '@/types';

// ========================================
// MADRID DISTRICTS & NEIGHBORHOODS
// ========================================
export const DISTRICTS: Record<string, string[]> = {
  'Arganzuela': ['Delicias', 'Legazpi', 'Chopera', 'Imperial', 'Acacias', 'Palos de la Frontera', 'Atocha'],
  'Carabanchel': ['Abrantes', 'Opañel', 'San Isidro', 'Vista Alegre', 'Puerta Bonita', 'Buenavista', 'Aluche'],
  'Centro': ['Palacio', 'Embajadores', 'Cortes', 'Justicia', 'Universidad', 'Sol'],
  'Chamartín': ['El Viso', 'Prosperidad', 'Ciudad Jardín', 'Hispanoamérica', 'Nueva España', 'Pinar del Rey'],
  'Chamberí': ['Gaztambide', 'Arapiles', 'Trafalgar', 'Almagro', 'Ríos Rosas', 'Vallehermoso'],
  'Retiro': ['Pacífico', 'Adelfas', 'Estrella', 'Ibiza', 'Jerónimos', 'Niño Jesús'],
  'Salamanca': ['Recoletos', 'Goya', 'Fuente del Berro', 'Guindalera', 'Lista', 'Castellana'],
  'Usera': ['Almendrales', 'Orcasitas', 'Moscardó', 'Zofío', 'Pradolongo', 'San Fermín'],
  'Villaverde': ['San Andrés', 'San Cristóbal', 'Butarque', 'Los Rosales', 'Los Ángeles']
};

// ========================================
// 20 JOB CATEGORIES (según PROJECT_SPEC.md)
// ========================================
export const CATEGORIES = [
  // PRINCIPALES (5)
  { id: 'MAYORES', label: 'Mayores', fullLabel: 'Mayores y Dependencia', icon: '👴', isPrimary: true },
  { id: 'HOGAR', label: 'Hogar', fullLabel: 'Hogar y Mantenimiento', icon: '🏠', isPrimary: true },
  { id: 'MASCOTAS', label: 'Mascotas', fullLabel: 'Mascotas', icon: '🐾', isPrimary: true },
  { id: 'RECADOS', label: 'Recados', fullLabel: 'Compras y Recados', icon: '🛒', isPrimary: true },
  { id: 'DIGITAL', label: 'Tecnología', fullLabel: 'Tecnología Digital', icon: '💻', isPrimary: true },
  
  // SECUNDARIAS (15)
  { id: 'HOSTELERIA', label: 'Hostelería', fullLabel: 'Hostelería y Eventos', icon: '🍽️', isPrimary: false },
  { id: 'TRANSPORTE', label: 'Transporte', fullLabel: 'Transporte y Reparto', icon: '🚗', isPrimary: false },
  { id: 'EDUCACION', label: 'Educación', fullLabel: 'Educación y Formación', icon: '📚', isPrimary: false },
  { id: 'COMERCIO', label: 'Comercio', fullLabel: 'Comercio y Negocios', icon: '🏪', isPrimary: false },
  { id: 'SALUD', label: 'Salud', fullLabel: 'Salud y Bienestar', icon: '💊', isPrimary: false },
  { id: 'CREATIVIDAD', label: 'Arte', fullLabel: 'Creatividad y Arte', icon: '🎨', isPrimary: false },
  { id: 'ADMINISTRACION', label: 'Oficina', fullLabel: 'Administración y Oficina', icon: '📋', isPrimary: false },
  { id: 'CONSTRUCCION', label: 'Construcción', fullLabel: 'Construcción y Oficios', icon: '🔨', isPrimary: false },
  { id: 'AGRICULTURA', label: 'Campo', fullLabel: 'Agricultura y Campo', icon: '🌾', isPrimary: false },
  { id: 'TURISMO', label: 'Turismo', fullLabel: 'Turismo y Alojamiento', icon: '✈️', isPrimary: false },
  { id: 'SEGURIDAD', label: 'Seguridad', fullLabel: 'Seguridad y Control', icon: '🛡️', isPrimary: false },
  { id: 'MARKETING', label: 'Marketing', fullLabel: 'Marketing de Calle', icon: '📢', isPrimary: false },
  { id: 'TECNODOMESTICA', label: 'Tec. Hogar', fullLabel: 'Tecnología Doméstica', icon: '🔌', isPrimary: false },
  { id: 'MODA', label: 'Moda', fullLabel: 'Moda y Textil', icon: '👗', isPrimary: false },
  { id: 'OTROS', label: 'Otros', fullLabel: 'Otros Servicios', icon: '📦', isPrimary: false },
];

export const JOB_CATEGORIES = CATEGORIES;

// ========================================
// URGENCY LEVELS
// ========================================
export const URGENCY_COLORS = {
  LOW: { r: 34, g: 197, b: 94 },      // Verde
  MEDIUM: { r: 245, g: 158, b: 11 },  // Naranja
  HIGH: { r: 239, g: 68, b: 68 },     // Rojo
};

export const URGENCY_LABELS = {
  LOW: 'Sin prisa',
  MEDIUM: 'Hoy',
  HIGH: '¡Urgente!',
};

// ========================================
// DAYS OF WEEK
// ========================================
export const DAYS_OF_WEEK = [
  { val: 1, label: 'L', full: 'Lunes' },
  { val: 2, label: 'M', full: 'Martes' },
  { val: 3, label: 'X', full: 'Miércoles' },
  { val: 4, label: 'J', full: 'Jueves' },
  { val: 5, label: 'V', full: 'Viernes' },
  { val: 6, label: 'S', full: 'Sábado' },
  { val: 0, label: 'D', full: 'Domingo' },
];

// ========================================
// CONTRACT TYPES
// ========================================
export const CONTRACT_TYPES = [
  { val: 'FULL_TIME', label: 'Jornada Completa', short: 'Completa' },
  { val: 'PART_TIME', label: 'Media Jornada', short: 'Media' },
  { val: 'TEMPORARY', label: 'Temporal', short: 'Temporal' },
  { val: 'INTERMITTENT', label: 'Fijo Discontinuo', short: 'Discontinuo' },
];

// ========================================
// COMPANY SECTORS (15 sectores)
// ========================================
export const COMPANY_SECTORS: {
  id: CompanySector;
  label: string;
  short: string;
}[] = [
  { id: 'HOSTELERIA_RESTAURACION', label: 'Hostelería y Restauración', short: 'Hostelería' },
  { id: 'COMERCIO_RETAIL', label: 'Comercio y Retail', short: 'Comercio' },
  { id: 'LOGISTICA_ALMACEN', label: 'Logística y Almacén', short: 'Logística' },
  { id: 'MENSAJERIA_REPARTO', label: 'Mensajería y Reparto', short: 'Reparto' },
  { id: 'EVENTOS_PROMOCION', label: 'Eventos y Promoción', short: 'Eventos' },
  { id: 'CONSTRUCCION_OBRA', label: 'Construcción y Obra', short: 'Construcción' },
  { id: 'LIMPIEZA_MANTENIMIENTO', label: 'Limpieza y Mantenimiento', short: 'Limpieza' },
  { id: 'ATENCION_PERSONAS', label: 'Atención a Personas', short: 'Personas' },
  { id: 'SERVICIOS_TECNOLOGICOS', label: 'Servicios Tecnológicos', short: 'Tecnología' },
  { id: 'SEGURIDAD_VIGILANCIA', label: 'Seguridad y Vigilancia', short: 'Seguridad' },
  { id: 'HOTELES_TURISMO', label: 'Hoteles y Turismo', short: 'Turismo' },
  { id: 'AGRICULTURA_TEMPORAL', label: 'Agricultura y Temporales', short: 'Agricultura' },
  { id: 'INDUSTRIA_FABRICAS', label: 'Industria y Fábricas', short: 'Industria' },
  { id: 'MARKETING_PUBLICIDAD', label: 'Marketing y Publicidad', short: 'Marketing' },
  { id: 'TRANSPORTE_MOVILIDAD', label: 'Transporte y Movilidad', short: 'Transporte' },
];

// ========================================
// COLORS (THEME)
// ========================================
export const COLORS = {
  primary: '#6366f1', // Indigo
  primaryDark: '#4f46e5',
  secondary: '#22c55e', // Green
  danger: '#ef4444',
  warning: '#f59e0b',
  dark: '#1e293b',
  gray: '#64748b',
  lightGray: '#f1f5f9',
  white: '#ffffff',
  black: '#000000',
};
