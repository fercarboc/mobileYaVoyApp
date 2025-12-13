// ========================================
// USER ROLES & TYPES
// ========================================
export type UserRole = 'PARTICULAR' | 'COMPANY' | 'HELPER' | 'ADMIN';

export type JobUrgency = 'LOW' | 'MEDIUM' | 'HIGH';

export type JobType = 'ONE_TIME' | 'RECURRING' | 'CONTRACT';

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
  role: UserRole;
  rating_avg: number;
  rating_count: number;
  avatar_url?: string;
  company_sector?: CompanySector | null;
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

export type TaskStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';
// JobType already defined above
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
  day_of_week: number[];
  days_of_week: number[]; // Alias
  start_time: string;
  end_time: string;
  start_date?: string;
  end_date?: string;
}

export interface VoyWorkContract {
  id?: string;
  job_id?: string;
  contract_type: ContractType;
  monthly_salary: number;
  weekly_hours?: number;
  benefits?: string;
  social_security: boolean;
  union_required?: boolean;
  contract_document_url?: string;
}

export interface Job {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar?: string;
  creator_phone?: string;
  title: string;
  description?: string;
  category: string;
  district: string;
  neighborhood: string;
  city: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // Distance from worker in km
  price: number;
  urgency: UrgencyLevel;
  status: TaskStatus;
  created_at: string;
  image_url?: string;
  
  job_type?: JobType; 
  is_contract?: boolean;
  schedule?: VoyWorkSchedule;
  contract?: VoyWorkContract;
  sector?: CompanySector | null;
}

export interface JobApplication {
  id: string;
  job_id: string;
  worker_id: string;
  worker_name: string;
  worker_avatar?: string;
  worker_rating: number;
  message: string;
  proposed_price?: number;
  proposed_hourly_rate?: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  job?: Job; // Populated for "My Applications" screen
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
// AUTH STATE
// ========================================
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

// ========================================
// DATABASE TYPES
// ========================================
export type DBVoyUserRole = 'PARTICULAR' | 'COMPANY' | 'HELPER' | 'ADMIN';
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
  company_sector?: CompanySector | null;
  created_at: string;
}

export interface DBVoyJob {
  id: string;
  creator_user_id: string;
  title: string;
  description?: string;
  category: string;
  job_type?: JobType;
  price_fixed?: number;
  price_hourly?: number;
  price_negotiable?: boolean;
  status: DBVoyJobStatus;
  city: string;
  district: string;
  neighborhood: string;
  sector?: CompanySector | null;
  created_at: string;
}
