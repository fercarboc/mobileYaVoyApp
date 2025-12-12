// ========================================
// USER ROLES & TYPES
// ========================================
export enum UserRole {
  PARTICULAR = 'PARTICULAR',
  COMPANY = 'COMPANY',
  WORKER = 'WORKER',
  ADMIN = 'ADMIN'
}

export type CompanySector = 
  | 'HOSTELERIA_RESTAURACION'
  | 'COMERCIO_RETAIL'
  | 'LOGISTICA_ALMACEN'
  | 'MENSAJERIA_REPARTO'
  | 'EVENTOS_PROMOCION'
  | 'CONSTRUCCION_OBRA'
  | 'LIMPIEZA_MANTENIMIENTO'
  | 'ATENCION_PERSONAS'
  | 'SERVICIOS_TECNOLOGICOS'
  | 'SEGURIDAD_VIGILANCIA'
  | 'HOTELES_TURISMO'
  | 'AGRICULTURA_TEMPORAL'
  | 'INDUSTRIA_FABRICAS'
  | 'MARKETING_PUBLICIDAD'
  | 'TRANSPORTE_MOVILIDAD';

export type UserType = 'particular' | 'company';

// --- UI Types (Used in React Components) ---
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  district: string;
  neighborhood: string;
  bio?: string;
  skills: string[];
  is_pro: boolean;
  user_type: UserType;
  role: UserRole; // NEW: Match DB structure
  rating_avg: number;
  rating_count: number;
  avatar_url?: string;
  company_sector?: CompanySector | null; // NEW: For COMPANY role
}

// ========================================
// JOB/TASK TYPES
// ========================================
export enum JobStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type TaskStatus = 'open' | 'in_progress' | 'done';
export type UrgencyLevel = 'low' | 'medium' | 'high';

// Updated to match PROJECT_SPEC.md
export type JobType = 'ONE_OFF' | 'HOURLY' | 'RECURRING' | 'CONTRACT';
export type ContractType = 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'INTERMITTENT';

export enum PeriodType {
  ONE_TIME = 'ONE_TIME',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface VoyWorkSchedule {
  id?: string;
  job_id?: string;
  period_type: PeriodType;
  day_of_week: number[]; // 0=Sunday, 6=Saturday
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  start_date?: string;
  end_date?: string;
}

export interface VoyWorkContract {
  id?: string;
  job_id?: string;
  contract_type: ContractType;
  monthly_salary: number;
  social_security: boolean;
  union_required?: boolean;
  contract_document_url?: string;
}

export interface Task {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar?: string;
  title: string;
  description?: string;
  category: string;
  district: string;
  neighborhood: string;
  price: number; // For One-off it's price, for Contract it's Monthly Salary display
  urgency: UrgencyLevel;
  status: TaskStatus;
  created_at: string;
  image_url?: string;
  selected_helper_id?: string;
  
  // Complex Fields
  job_type?: JobType; 
  is_contract?: boolean;
  schedule?: VoyWorkSchedule;
  contract?: VoyWorkContract;
  sector?: CompanySector | null; // NEW: Match PROJECT_SPEC
}

export interface TaskApplication {
  id: string;
  task_id: string;
  helper_id: string; // WORKER_ID in DB
  helper_name: string;
  helper_avatar: string;
  helper_rating: number;
  message: string;
  proposed_price?: number; // NEW
  proposed_hourly_rate?: number; // NEW
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: string; // NEW
}

// ========================================
// NOTIFICATION TYPES
// ========================================
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'APPLICATION_ACCEPTED' | 'APPLICATION_REJECTED' | 'NEW_APPLICATION' | 'JOB_STATUS_CHANGED' | 'CHAT_MESSAGE' | 'REVIEW_RECEIVED' | 'SYSTEM';
  related_job_id?: string;
  related_application_id?: string;
  is_read: boolean;
  created_at: string;
}

// ========================================
// SUBSCRIPTION & PAYMENTS TYPES (BONOS)
// ========================================
export type SubscriptionType = 'BONO_5' | 'BONO_10' | 'BONO_20';

export interface CompanySubscription {
  id: string;
  company_id: string;
  subscription_type: SubscriptionType;
  total_ads: number;
  used_ads: number;
  amount: number;
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date?: string;
  stripe_subscription_id?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  job_id: string;
  payer_id: string;
  amount: number;
  commission: number;
  status: 'pending' | 'completed' | 'failed';
  stripe_payment_id?: string;
  created_at: string;
}

// ========================================
// PLATFORM SETTINGS (ADMIN)
// ========================================
export interface PlatformSettings {
  id: string;
  free_period_enabled: boolean;
  free_period_start?: string;
  free_period_end?: string;
  bono_5_price: number;
  bono_10_price: number;
  bono_20_price: number;
}

export interface Review {
  id: string;
  task_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string;
}

// ========================================
// UI VIEW STATES
// ========================================
export type ViewState = 'HOME' | 'POST_TASK' | 'PROFILE' | 'LOGIN' | 'TASK_DETAIL' | 'CHAT';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface CreateTaskPayload {
    creator_id: string;
    title: string;
    description: string;
    category: string;
    district: string;
    neighborhood: string;
    price: number;
    urgency: UrgencyLevel;
    job_type: JobType;
    is_contract: boolean;
    schedule?: {
        days: number[];
        startTime: string;
        endTime: string;
    };
    contract?: {
        salary: number;
        type: string;
        socialSecurity: boolean;
    };
}

// ========================================
// DATABASE TYPES (Matching Supabase SQL)
// ========================================
export type DBVoyUserRole = 'PARTICULAR' | 'COMPANY' | 'WORKER' | 'ADMIN'; // Changed HELPER → WORKER
export type DBVoyJobStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type DBVoyApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface DBVoyUser {
  id: string;
  auth_user_id: string;
  role: DBVoyUserRole;
  full_name: string;
  email: string;
  phone?: string;
  city: string;
  district: string;
  neighborhood: string;
  company_sector?: CompanySector | null; // NEW
  created_at: string;
}

export interface DBVoyJob {
  id: string;
  creator_user_id: string;
  title: string;
  description?: string;
  category: string;
  job_type?: JobType; // NEW
  price_fixed?: number; // Changed from price_fixed: number
  price_hourly?: number; // NEW
  price_negotiable?: boolean; // NEW
  status: DBVoyJobStatus;
  city: string;
  district: string;
  neighborhood: string;
  sector?: CompanySector | null; // NEW
  created_at: string;
}

export interface DBVoyJobApplication {
  id: string;
  job_id: string;
  helper_user_id: string; // Worker ID
  status: DBVoyApplicationStatus;
  message?: string;
  proposed_price?: number;
  proposed_hourly_rate?: number;
  created_at: string;
  updated_at?: string;
}

// ========================================
// CONSTANTS HELPERS
// ========================================
export const DAYS_OF_WEEK = [
  { id: 1, label: 'L', name: 'Lunes', val: 1 },
  { id: 2, label: 'M', name: 'Martes', val: 2 },
  { id: 3, label: 'X', name: 'Miércoles', val: 3 },
  { id: 4, label: 'J', name: 'Jueves', val: 4 },
  { id: 5, label: 'V', name: 'Viernes', val: 5 },
  { id: 6, label: 'S', name: 'Sábado', val: 6 },
  { id: 0, label: 'D', name: 'Domingo', val: 0 },
];

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
