
import { Search, ShoppingCart, Hammer, FileText, Smartphone, Truck, Heart, Home as HomeIcon, Dog } from 'lucide-react';
import { CompanySector } from './types';

export const DISTRICTS = {
  'Arganzuela': ['Delicias', 'Legazpi', 'Chopera', 'Imperial', 'Acacias', 'Palos de la Frontera', 'Atocha'],
  'Usera': ['Almendrales', 'Orcasitas', 'Moscardó', 'Zofío', 'Pradolongo', 'San Fermín']
};

// ========================================
// 20 CATEGORÍAS COMPLETAS (según PROJECT_SPEC.md)
// ========================================
export const CATEGORIES = [
  // PRINCIPALES (5)
  { id: 'MAYORES', label: 'Mayores y Dependencia', icon: '👴', emoji: '👴', isPrimary: true },
  { id: 'HOGAR', label: 'Hogar y Mantenimiento', icon: '🏠', emoji: '🏠', isPrimary: true },
  { id: 'MASCOTAS', label: 'Mascotas', icon: '🐾', emoji: '🐾', isPrimary: true },
  { id: 'RECADOS', label: 'Compras y Recados', icon: '🛒', emoji: '🛒', isPrimary: true },
  { id: 'DIGITAL', label: 'Tecnología Digital', icon: '💻', emoji: '💻', isPrimary: true },
  
  // SECUNDARIAS (15)
  { id: 'HOSTELERIA', label: 'Hostelería y Eventos', icon: '🍽️', emoji: '🍽️', isPrimary: false },
  { id: 'TRANSPORTE', label: 'Transporte y Reparto', icon: '🚗', emoji: '🚗', isPrimary: false },
  { id: 'EDUCACION', label: 'Educación y Formación', icon: '📚', emoji: '📚', isPrimary: false },
  { id: 'COMERCIO', label: 'Comercio y Negocios', icon: '🏪', emoji: '🏪', isPrimary: false },
  { id: 'SALUD', label: 'Salud y Bienestar', icon: '💊', emoji: '💊', isPrimary: false },
  { id: 'CREATIVIDAD', label: 'Creatividad y Arte', icon: '🎨', emoji: '🎨', isPrimary: false },
  { id: 'ADMINISTRACION', label: 'Administración y Oficina', icon: '📋', emoji: '📋', isPrimary: false },
  { id: 'CONSTRUCCION', label: 'Construcción y Oficios', icon: '🔨', emoji: '🔨', isPrimary: false },
  { id: 'AGRICULTURA', label: 'Agricultura y Campo', icon: '🌾', emoji: '🌾', isPrimary: false },
  { id: 'TURISMO', label: 'Turismo y Alojamiento', icon: '✈️', emoji: '✈️', isPrimary: false },
  { id: 'SEGURIDAD', label: 'Seguridad y Control', icon: '🛡️', emoji: '🛡️', isPrimary: false },
  { id: 'MARKETING', label: 'Marketing de Calle', icon: '📢', emoji: '📢', isPrimary: false },
  { id: 'TECNODOMESTICA', label: 'Tecnología Doméstica', icon: '🔌', emoji: '🔌', isPrimary: false },
  { id: 'MODA', label: 'Moda y Textil', icon: '👗', emoji: '👗', isPrimary: false },
  { id: 'OTROS', label: 'Otros Servicios', icon: '📦', emoji: '📦', isPrimary: false },
];

export const URGENCY_COLORS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

export const URGENCY_LABELS = {
  low: 'Sin prisa',
  medium: 'Hoy',
  high: '¡Urgente!',
};

export const DAYS_OF_WEEK = [
  { val: 1, label: 'L' },
  { val: 2, label: 'M' },
  { val: 3, label: 'X' },
  { val: 4, label: 'J' },
  { val: 5, label: 'V' },
  { val: 6, label: 'S' },
  { val: 0, label: 'D' },
];

export const CONTRACT_TYPES = [
  { val: 'FULL_TIME', label: 'Jornada Completa' },
  { val: 'PART_TIME', label: 'Media Jornada' },
  { val: 'TEMPORARY', label: 'Temporal' },
  { val: 'INTERMITTENT', label: 'Fijo Discontinuo' },
];

// ========================================
// SECTORES DE EMPRESA (15 sectores)
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
// PLANES DE BONOS (Para empresas)
// ========================================
export const SUBSCRIPTION_PLANS = [
  { 
    id: 'BONO_5', 
    name: 'Bono 5 Anuncios', 
    total_ads: 5, 
    price: 20, 
    pricePerAd: 4.0,
    savings: 0,
    recommended: false 
  },
  { 
    id: 'BONO_10', 
    name: 'Bono 10 Anuncios', 
    total_ads: 10, 
    price: 35, 
    pricePerAd: 3.5,
    savings: 12.5,
    recommended: false 
  },
  { 
    id: 'BONO_20', 
    name: 'Bono 20 Anuncios', 
    total_ads: 20, 
    price: 60, 
    pricePerAd: 3.0,
    savings: 25,
    recommended: true 
  },
];
