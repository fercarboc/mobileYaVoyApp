
import { supabase } from './supabaseClient';
import { Task, User, TaskApplication, UrgencyLevel, DBVoyJobStatus, DBVoyUserRole, CreateTaskPayload, UserRole } from '../types';

// Helper to generate avatar URL since it's not in DB
const getAvatarUrl = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0072F5&color=fff`;

// Helper to map DB Status to UI Status
const mapDbStatusToUi = (status: DBVoyJobStatus): 'open' | 'in_progress' | 'done' => {
  if (status === 'OPEN') return 'open';
  if (status === 'COMPLETED') return 'done';
  // ASSIGNED, IN_PROGRESS, etc.
  return 'in_progress';
};

// Helper to map DB Role to UI Role
const mapDbRoleToUserRole = (dbRole: DBVoyUserRole): UserRole => {
  return dbRole as UserRole; // They match now: PARTICULAR, COMPANY, WORKER, ADMIN
};

export const ApiService = {
  // 1. Sign In (Existing User)
  signIn: async (email: string, password: string): Promise<User> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error("No user found");

      // Fetch Profile
      let { data: userProfile, error: profileError } = await supabase
        .from('VoyUsers')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .maybeSingle();

      // SELF-HEALING
      if (!userProfile) {
          console.warn("User authenticated but profile missing. Creating fallback profile...");
          const { data: newProfile, error: createError } = await supabase
            .from('VoyUsers')
            .insert({
                auth_user_id: data.user.id,
                full_name: data.user.user_metadata?.full_name || email.split('@')[0],
                email: email,
                role: 'PARTICULAR',
                city: 'Madrid'
            })
            .select()
            .single();
            
          if (createError) {
             console.error("Failed to create fallback profile:", createError);
             throw new Error("Error recuperando perfil. Contacte soporte.");
          }
          userProfile = newProfile;
      }

      if (profileError) {
        console.error("Profile Fetch Error:", profileError);
        throw new Error("Error cargando perfil.");
      }

      return {
        id: userProfile.id,
        full_name: userProfile.full_name,
        email: userProfile.email,
        district: userProfile.district || 'Madrid',
        neighborhood: userProfile.neighborhood || 'Centro',
        skills: [], 
        is_pro: false,
        user_type: userProfile.role === 'COMPANY' ? 'company' : 'particular',
        role: mapDbRoleToUserRole(userProfile.role),
        rating_avg: 5.0,
        rating_count: 0,
        avatar_url: getAvatarUrl(userProfile.full_name),
        company_sector: userProfile.company_sector || null
      };
    } catch (err: any) {
      console.error("Login Error:", JSON.stringify(err));
      if (err.message?.includes('Invalid login credentials')) {
          throw new Error("Email o contraseña incorrectos.");
      }
      if (err.message?.includes('Email not confirmed')) {
          throw new Error("Por favor confirma tu email antes de entrar.");
      }
      throw new Error(err.message || "Error al iniciar sesión");
    }
  },

  // 2. Sign Up
  signUp: async (email: string, password: string, fullName: string, role: DBVoyUserRole, district: string, neighborhood: string): Promise<User> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });

      if (error) throw error;
      if (!data.user) throw new Error("No se pudo crear el usuario");

      if (data.user && !data.session) {
           throw new Error("Registro exitoso. ¡Por favor revisa tu email para confirmar tu cuenta!");
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
        if (dbError.code === '23505') { 
             const { data: existingProfile } = await supabase
                .from('VoyUsers')
                .select('*')
                .eq('auth_user_id', data.user.id)
                .single();
             if (existingProfile) {
                 return {
                    id: existingProfile.id,
                    full_name: existingProfile.full_name,
                    email: existingProfile.email,
                    district: existingProfile.district,
                    neighborhood: existingProfile.neighborhood,
                    skills: [], 
                    is_pro: false,
                    user_type: existingProfile.role === 'COMPANY' ? 'company' : 'particular',
                    role: mapDbRoleToUserRole(existingProfile.role),
                    rating_avg: 0,
                    rating_count: 0,
                    avatar_url: getAvatarUrl(existingProfile.full_name),
                    company_sector: existingProfile.company_sector || null
                 };
             }
        }
        console.error("Database Error:", JSON.stringify(dbError));
        throw new Error("Error creando el perfil de usuario");
      }

      return {
        id: newProfile.id,
        full_name: newProfile.full_name,
        email: newProfile.email,
        district: newProfile.district,
        neighborhood: newProfile.neighborhood,
        skills: [], 
        is_pro: false,
        user_type: newProfile.role === 'COMPANY' ? 'company' : 'particular',
        role: mapDbRoleToUserRole(newProfile.role),
        rating_avg: 0,
        rating_count: 0,
        avatar_url: getAvatarUrl(newProfile.full_name),
        company_sector: newProfile.company_sector || null
      };

    } catch (err: any) {
      console.error("Registration Error:", JSON.stringify(err));
      throw new Error(err.message || "Error al registrarse");
    }
  },

  getTasks: async (): Promise<Task[]> => {
    // Join Schedules and Contracts
    const { data, error } = await supabase
      .from('VoyJobs')
      .select(`
        *,
        creator:VoyUsers!creator_user_id ( full_name, email ),
        schedule:VoyWorkSchedules (*),
        contract:VoyWorkContracts (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }

    return data.map((job: any) => {
        const contract = job.contract && job.contract[0]; // Supabase returns array for 1:N but typically 1:1 here logic
        const schedule = job.schedule && job.schedule[0];

        // If contract exists, price is salary
        const displayPrice = contract ? Number(contract.monthly_salary) : (job.price_fixed || 0);

        return {
            id: job.id,
            creator_id: job.creator_user_id,
            creator_name: job.creator?.full_name || 'Usuario',
            creator_avatar: getAvatarUrl(job.creator?.full_name || 'U'),
            title: job.title,
            description: job.description,
            category: job.category,
            district: job.district,
            neighborhood: job.neighborhood,
            price: displayPrice,
            urgency: (job.description?.includes('URGENTE') ? 'high' : 'medium') as UrgencyLevel,
            status: mapDbStatusToUi(job.status),
            created_at: job.created_at,
            selected_helper_id: null,
            // New mappings
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
            } : undefined
        };
    });
  },

  createTask: async (payload: CreateTaskPayload): Promise<void> => {
    const descriptionWithMeta = `${payload.description} [URGENCY:${payload.urgency}]`;

    // 1. Insert Base Job
    const { data: jobData, error: jobError } = await supabase
      .from('VoyJobs')
      .insert({
        creator_user_id: payload.creator_id,
        title: payload.title,
        description: descriptionWithMeta,
        category: payload.category,
        district: payload.district,
        neighborhood: payload.neighborhood,
        price_fixed: payload.is_contract ? 0 : payload.price, // If contract, price is in contract table
        status: 'OPEN',
        job_type: payload.job_type
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // 2. Insert Schedule if needed
    if (payload.schedule && (payload.job_type === 'WEEKLY' || payload.job_type === 'MONTHLY')) {
        const { error: schedError } = await supabase
            .from('VoyWorkSchedules')
            .insert({
                job_id: jobData.id,
                period_type: payload.job_type,
                day_of_week: payload.schedule.days,
                start_time: payload.schedule.startTime,
                end_time: payload.schedule.endTime
            });
        if (schedError) console.error("Error creating schedule", schedError);
    }

    // 3. Insert Contract if needed
    if (payload.is_contract && payload.contract) {
        const { error: contractError } = await supabase
            .from('VoyWorkContracts')
            .insert({
                job_id: jobData.id,
                contract_type: payload.contract.type,
                monthly_salary: payload.contract.salary,
                social_security: payload.contract.socialSecurity
            });
        if (contractError) console.error("Error creating contract", contractError);
    }
  },

  getTaskApplications: async (taskId: string): Promise<TaskApplication[]> => {
    const { data, error } = await supabase
      .from('VoyJobApplications')
      .select(`*, helper:VoyUsers!helper_user_id ( full_name )`)
      .eq('job_id', taskId);

    if (error) return [];

    return data.map((app: any) => ({
      id: app.id,
      task_id: app.job_id,
      helper_id: app.helper_user_id,
      helper_name: app.helper?.full_name || 'Helper',
      helper_avatar: getAvatarUrl(app.helper?.full_name || 'H'),
      helper_rating: 5.0, 
      message: app.message,
      status: app.status === 'PENDING' ? 'pending' : app.status === 'ACCEPTED' ? 'accepted' : 'rejected'
    }));
  },

  applyToTask: async (taskId: string, message: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; 
    
    const { data: profile } = await supabase.from('VoyUsers').select('id').eq('auth_user_id', user.id).single();
    if (profile) {
        await supabase.from('VoyJobApplications').insert({
            job_id: taskId,
            helper_user_id: profile.id,
            message: message,
            status: 'PENDING'
        });
    }
  },

  acceptApplication: async (taskId: string, applicationId: string, helperId: string): Promise<void> => {
      await supabase.from('VoyJobs').update({ status: 'IN_PROGRESS' }).eq('id', taskId);
      await supabase.from('VoyJobApplications').update({ status: 'ACCEPTED' }).eq('id', applicationId);
      
      const { data: job } = await supabase.from('VoyJobs').select('creator_user_id, price_fixed').eq('id', taskId).single();
      if (job) {
          await supabase.from('VoyJobAssignments').insert({
              job_id: taskId,
              helper_user_id: helperId,
              requester_user_id: job.creator_user_id,
              agreed_price: job.price_fixed,
              status: 'ASSIGNED'
          });
      }
  },

  getPostedTasks: async (userId: string): Promise<Task[]> => {
      const { data } = await supabase
        .from('VoyJobs')
        .select(`
            *, 
            schedule:VoyWorkSchedules (*),
            contract:VoyWorkContracts (*)
        `)
        .eq('creator_user_id', userId)
        .order('created_at', { ascending: false });

      return (data || []).map((job: any) => {
         const contract = job.contract?.[0];
         const schedule = job.schedule?.[0];
         const displayPrice = contract ? Number(contract.monthly_salary) : (job.price_fixed || 0);

         return {
            id: job.id,
            creator_id: job.creator_user_id,
            creator_name: 'Me', 
            title: job.title,
            category: job.category,
            district: job.district,
            neighborhood: job.neighborhood,
            price: displayPrice,
            urgency: 'medium',
            status: mapDbStatusToUi(job.status),
            created_at: job.created_at,
            is_contract: !!contract,
            contract: contract,
            schedule: schedule
         }
      });
  },

  getCompletedTasks: async (userId: string): Promise<Task[]> => {
      const { data } = await supabase
        .from('VoyJobAssignments')
        .select(`job:VoyJobs (*)`)
        .eq('helper_user_id', userId);

      return (data || []).map((row: any) => ({
          id: row.job.id,
          creator_id: row.job.creator_user_id,
          creator_name: 'Cliente',
          title: row.job.title,
          category: row.job.category,
          district: row.job.district,
          neighborhood: row.job.neighborhood,
          price: row.job.price_fixed,
          urgency: 'medium',
          status: mapDbStatusToUi(row.job.status),
          created_at: row.job.created_at
      }));
  }
};

// Chat methods
export const ChatService = {
  getMessages: async (chatId: string) => {
    const { data, error } = await supabase
      .from('VoyMessages')
      .select(`*, sender:VoyUsers!sender_user_id ( full_name )`)
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages', error);
      return [];
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      chat_id: m.chat_id,
      sender_user_id: m.sender_user_id,
      sender_name: m.sender?.full_name || null,
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at || null
    }));
  },

  sendMessage: async (chatId: string, text: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const authUser = userData?.user;
    if (!authUser) throw new Error('Not authenticated');

    const { data: profile, error: profErr } = await supabase.from('VoyUsers').select('id, full_name').eq('auth_user_id', authUser.id).maybeSingle();
    if (profErr) throw profErr;

    const senderId = profile?.id || null;

    const { data, error } = await supabase
      .from('VoyMessages')
      .insert({ chat_id: chatId, sender_user_id: senderId, body: text })
      .select()
      .single();

    if (error) {
      console.error('Error sending message', error);
      throw error;
    }

    return { id: data.id, chat_id: data.chat_id, sender_user_id: data.sender_user_id, sender_name: profile?.full_name || null, body: data.body, sent_at: data.sent_at };
  },

  // Subscribe to new messages for a chat. callback receives the inserted row.
  subscribeToMessages: (chatId: string, callback: (msg: any) => void) => {
    const channel = supabase
      .channel(`public:VoyMessages:chat_${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'VoyMessages', filter: `chat_id=eq.${chatId}` }, (payload) => {
        callback(payload.new);
      })
      .subscribe();

    return {
      unsubscribe: () => { supabase.removeChannel(channel); }
    };
  }
};