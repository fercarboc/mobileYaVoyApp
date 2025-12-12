import { supabase } from './supabase';
import { User, Job, JobApplication, UserRole, DBVoyUserRole, TaskStatus, UrgencyLevel } from '@/types';

// Helper to generate avatar URL
const getAvatarUrl = (name: string) => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=128`;

// Helper to map DB Status to UI Status
const mapDbStatusToUi = (status: string): TaskStatus => {
  const statusMap: Record<string, TaskStatus> = {
    'OPEN': 'OPEN',
    'ASSIGNED': 'ASSIGNED',
    'IN_PROGRESS': 'IN_PROGRESS',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
  };
  return statusMap[status] || 'OPEN';
};

// Helper to map DB Role to UI Role
const mapDbRoleToUserRole = (dbRole: DBVoyUserRole): UserRole => {
  return dbRole as UserRole;
};

export const AuthService = {
  // Sign In
  signIn: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No user found');

    const { data: userProfile, error: profileError } = await supabase
      .from('VoyUsers')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();

    if (!userProfile) {
      // Self-healing: create profile if missing
      const { data: newProfile, error: createError } = await supabase
        .from('VoyUsers')
        .insert({
          auth_user_id: data.user.id,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
          email: email,
          role: 'WORKER',
          city: 'Madrid',
          district: 'Centro',
          neighborhood: 'Sol'
        })
        .select()
        .single();
        
      if (createError) throw new Error('Error creando perfil');
      return mapUserProfile(newProfile);
    }

    if (profileError) throw new Error('Error cargando perfil');
    return mapUserProfile(userProfile);
  },

  // Sign Up
  signUp: async (
    email: string, 
    password: string, 
    fullName: string, 
    role: UserRole,
    district: string,
    neighborhood: string
  ): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) throw error;
    if (!data.user) throw new Error('No se pudo crear el usuario');
    
    if (data.user && !data.session) {
      throw new Error('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
    }

    const { data: newProfile, error: dbError } = await supabase
      .from('VoyUsers')
      .insert({
        auth_user_id: data.user.id,
        full_name: fullName,
        email: email,
        role: role,
        district: district,
        neighborhood: neighborhood,
        city: 'Madrid'
      })
      .select()
      .single();

    if (dbError) {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('VoyUsers')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();
      
      if (existingProfile) return mapUserProfile(existingProfile);
      throw new Error('Error creando perfil de usuario');
    }

    return mapUserProfile(newProfile);
  },

  // Sign Out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get Current User
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userProfile } = await supabase
      .from('VoyUsers')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!userProfile) return null;
    return mapUserProfile(userProfile);
  },
};

export const JobService = {
  // Get Jobs Near Worker (with optional location filtering)
  getJobs: async (
    latitude?: number,
    longitude?: number,
    category?: string,
    maxDistance: number = 10 // km
  ): Promise<Job[]> => {
    let query = supabase
      .from('VoyJobs')
      .select(`
        *,
        creator:VoyUsers!creator_user_id ( full_name, email, phone ),
        schedule:VoyWorkSchedules (*),
        contract:VoyWorkContracts (*)
      `)
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }

    return data.map((job: any) => {
      const contract = job.contract?.[0];
      const schedule = job.schedule?.[0];
      const displayPrice = contract ? Number(contract.monthly_salary) : (job.price_fixed || 0);

      // Calculate distance if location provided
      let distance: number | undefined;
      if (latitude && longitude && job.latitude && job.longitude) {
        distance = calculateDistance(latitude, longitude, job.latitude, job.longitude);
      }

      return {
        id: job.id,
        creator_id: job.creator_user_id,
        creator_name: job.creator?.full_name || 'Usuario',
        creator_avatar: getAvatarUrl(job.creator?.full_name || 'U'),
        creator_phone: job.creator?.phone,
        title: job.title,
        description: job.description,
        category: job.category,
        district: job.district,
        neighborhood: job.neighborhood,
        city: job.city || 'Madrid',
        latitude: job.latitude,
        longitude: job.longitude,
        distance,
        price: displayPrice,
        urgency: (job.description?.includes('URGENTE') ? 'HIGH' : 'MEDIUM') as UrgencyLevel,
        status: mapDbStatusToUi(job.status),
        created_at: job.created_at,
        job_type: job.job_type,
        is_contract: !!contract,
        schedule: schedule ? {
          period_type: schedule.period_type,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time
        } : undefined,
        contract: contract ? {
          contract_type: contract.contract_type,
          monthly_salary: contract.monthly_salary,
          social_security: contract.social_security
        } : undefined,
        sector: job.sector
      };
    });
  },

  // Get Job by ID
  getJobById: async (jobId: string): Promise<Job | null> => {
    const { data, error } = await supabase
      .from('VoyJobs')
      .select(`
        *,
        creator:VoyUsers!creator_user_id ( full_name, email, phone ),
        schedule:VoyWorkSchedules (*),
        contract:VoyWorkContracts (*)
      `)
      .eq('id', jobId)
      .single();

    if (error || !data) return null;

    const contract = data.contract?.[0];
    const schedule = data.schedule?.[0];
    const displayPrice = contract ? Number(contract.monthly_salary) : (data.price_fixed || 0);

    return {
      id: data.id,
      creator_id: data.creator_user_id,
      creator_name: data.creator?.full_name || 'Usuario',
      creator_avatar: getAvatarUrl(data.creator?.full_name || 'U'),
      creator_phone: data.creator?.phone,
      title: data.title,
      description: data.description,
      category: data.category,
      district: data.district,
      neighborhood: data.neighborhood,
      city: data.city || 'Madrid',
      price: displayPrice,
      urgency: (data.description?.includes('URGENTE') ? 'HIGH' : 'MEDIUM') as UrgencyLevel,
      status: mapDbStatusToUi(data.status),
      created_at: data.created_at,
      job_type: data.job_type,
      is_contract: !!contract,
      schedule,
      contract,
      sector: data.sector
    };
  },

  // Apply to Job
  applyToJob: async (jobId: string, message: string, proposedPrice?: number): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');
    
    const { data: profile } = await supabase
      .from('VoyUsers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    
    if (!profile) throw new Error('Perfil no encontrado');

    const { error } = await supabase
      .from('VoyJobApplications')
      .insert({
        job_id: jobId,
        helper_user_id: profile.id,
        message: message,
        proposed_price: proposedPrice,
        status: 'PENDING'
      });

    if (error) throw error;
  },

  // Get My Applications
  getMyApplications: async (): Promise<JobApplication[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from('VoyUsers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) return [];

    const { data, error } = await supabase
      .from('VoyJobApplications')
      .select(`
        *,
        job:VoyJobs (
          id, title, category, district, neighborhood, price_fixed, status, created_at,
          creator:VoyUsers!creator_user_id ( full_name )
        )
      `)
      .eq('helper_user_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return [];
    }

    return data.map((app: any) => ({
      id: app.id,
      job_id: app.job_id,
      worker_id: app.helper_user_id,
      worker_name: profile.id, // Self
      worker_rating: 5.0,
      message: app.message || '',
      proposed_price: app.proposed_price,
      status: app.status === 'PENDING' ? 'pending' : app.status === 'ACCEPTED' ? 'accepted' : 'rejected',
      created_at: app.created_at,
      job: app.job ? {
        id: app.job.id,
        title: app.job.title,
        category: app.job.category,
        district: app.job.district,
        neighborhood: app.job.neighborhood,
        city: 'Madrid',
        price: app.job.price_fixed || 0,
        status: mapDbStatusToUi(app.job.status),
        created_at: app.job.created_at,
        creator_id: '',
        creator_name: app.job.creator?.full_name || 'Cliente',
        creator_avatar: getAvatarUrl(app.job.creator?.full_name || 'C'),
        urgency: 'MEDIUM' as UrgencyLevel,
      } : undefined
    }));
  },
};

// Helper function: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper to map user profile from DB
function mapUserProfile(profile: any): User {
  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    district: profile.district || 'Madrid',
    neighborhood: profile.neighborhood || 'Centro',
    skills: [],
    is_pro: false,
    user_type: profile.role === 'COMPANY' ? 'company' : 'particular',
    role: mapDbRoleToUserRole(profile.role),
    rating_avg: 5.0,
    rating_count: 0,
    avatar_url: getAvatarUrl(profile.full_name),
    company_sector: profile.company_sector || null
  };
}
