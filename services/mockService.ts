
import { Task, User, TaskApplication } from '../types';

// Mock Users
const MOCK_USER: User = {
  id: 'u1',
  full_name: 'Carlos Vecino',
  email: 'carlos@yavoy.es',
  district: 'Arganzuela',
  neighborhood: 'Legazpi',
  bio: 'Soy manitas y tengo paciencia enseñando tecnología. Busco ayudar en el barrio.',
  skills: ['Montaje de muebles', 'Tecnología para mayores', 'Electricidad básica'],
  is_pro: true,
  user_type: 'particular',
  rating_avg: 4.9,
  rating_count: 12,
  avatar_url: 'https://picsum.photos/id/1005/200/200'
};

const OTHER_USERS: Record<string, User> = {
  'u2': {
    id: 'u2',
    full_name: 'Maria López',
    email: 'maria@gmail.com',
    district: 'Usera',
    neighborhood: 'Moscardó',
    skills: ['Acompañamiento', 'Compras', 'Farmacia'],
    is_pro: false,
    user_type: 'particular',
    rating_avg: 4.8,
    rating_count: 8,
    avatar_url: 'https://picsum.photos/id/1011/200/200'
  },
  'u3': {
    id: 'u3',
    full_name: 'Pedro M.',
    email: 'pedro@gmail.com',
    district: 'Arganzuela',
    neighborhood: 'Delicias',
    skills: ['Coche propio', 'Fuerza física'],
    is_pro: false,
    user_type: 'particular',
    rating_avg: 5.0,
    rating_count: 3,
    avatar_url: 'https://picsum.photos/id/1012/200/200'
  }
};

// Mock Tasks
let TASKS_STORE: Task[] = [
  {
    id: 't1',
    creator_id: 'u2',
    creator_name: 'Maria López',
    creator_avatar: 'https://picsum.photos/id/1011/200/200',
    title: 'Acompañar al médico',
    description: 'Necesito alguien que acompañe a mi madre al centro de salud de Usera mañana a las 10:00. Solo acompañar y ayudarla a entrar.',
    category: 'senior',
    district: 'Usera',
    neighborhood: 'Moscardó',
    price: 15,
    urgency: 'high',
    status: 'open',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 't2',
    creator_id: 'u3',
    creator_name: 'Pedro M.',
    creator_avatar: 'https://picsum.photos/id/1012/200/200',
    title: 'Configurar WhatsApp y contactos',
    description: 'Me han regalado un móvil nuevo y no sé pasar los contactos ni poner el WhatsApp. ¿Alguien me ayuda media hora?',
    category: 'tech',
    district: 'Arganzuela',
    neighborhood: 'Delicias',
    price: 12,
    urgency: 'low',
    status: 'open',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 't3',
    creator_id: 'u2',
    creator_name: 'Maria López',
    creator_avatar: 'https://picsum.photos/id/1011/200/200',
    title: 'Cambiar bombilla techo alto',
    description: 'Se ha fundido la bombilla del pasillo y no me puedo subir a la escalera. Es cosa de 5 minutos.',
    category: 'handyman',
    district: 'Usera',
    neighborhood: 'Almendrales',
    price: 10,
    urgency: 'medium',
    status: 'open',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 't5',
    creator_id: 'u4',
    creator_name: 'Luisa G.',
    creator_avatar: 'https://picsum.photos/id/1025/200/200',
    title: 'Subir la compra semanal',
    description: 'Hago la compra online pero no me la suben a casa. Necesito ayuda para subir 4 bolsas al 3º (hay ascensor).',
    category: 'errands',
    district: 'Arganzuela',
    neighborhood: 'Chopera',
    price: 8,
    urgency: 'medium',
    status: 'open',
    created_at: new Date(Date.now() - 4000000).toISOString(),
  },
  // Task created by the current user (Mock)
  {
    id: 't4',
    creator_id: 'u1',
    creator_name: 'Carlos Vecino',
    creator_avatar: 'https://picsum.photos/id/1005/200/200',
    title: 'Limpieza de trastero',
    description: 'Tengo muchas cajas acumuladas y necesito ayuda para organizarlo.',
    category: 'home',
    district: 'Arganzuela',
    neighborhood: 'Legazpi',
    price: 40,
    urgency: 'low',
    status: 'open',
    created_at: new Date(Date.now() - 1200000).toISOString(),
  }
];

// Mock Applications
let APPLICATIONS_STORE: TaskApplication[] = [
  {
    id: 'a1',
    task_id: 't4',
    helper_id: 'u2',
    helper_name: 'Maria López',
    helper_avatar: 'https://picsum.photos/id/1011/200/200',
    helper_rating: 4.8,
    message: 'Hola Carlos, vivo cerca y tengo experiencia organizando.',
    status: 'pending'
  },
  {
    id: 'a2',
    task_id: 't4',
    helper_id: 'u3',
    helper_name: 'Pedro M.',
    helper_avatar: 'https://picsum.photos/id/1012/200/200',
    helper_rating: 5.0,
    message: 'Me interesa. Tengo fuerza para mover cajas.',
    status: 'pending'
  }
];


// Service Methods
export const MockService = {
  login: async (email: string): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_USER), 800);
    });
  },

  getTasks: async (): Promise<Task[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...TASKS_STORE]), 500);
    });
  },

  createTask: async (task: Omit<Task, 'id' | 'created_at' | 'status' | 'creator_name' | 'creator_avatar'>): Promise<Task> => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      status: 'open',
      creator_name: MOCK_USER.full_name,
      creator_avatar: MOCK_USER.avatar_url
    };
    TASKS_STORE.unshift(newTask); 
    return Promise.resolve(newTask);
  },

  // Advertiser Side: Get applications for my task
  getTaskApplications: async (taskId: string): Promise<TaskApplication[]> => {
     return new Promise((resolve) => {
         const apps = APPLICATIONS_STORE.filter(a => a.task_id === taskId);
         setTimeout(() => resolve(apps), 500);
     });
  },

  // Helper Side: Apply to a task
  applyToTask: async (taskId: string, message: string): Promise<TaskApplication> => {
     const newApp: TaskApplication = {
        id: Math.random().toString(36).substr(2,9),
        task_id: taskId,
        helper_id: MOCK_USER.id,
        helper_name: MOCK_USER.full_name,
        helper_avatar: MOCK_USER.avatar_url || '',
        helper_rating: MOCK_USER.rating_avg,
        message,
        status: 'pending'
     };
     APPLICATIONS_STORE.push(newApp);
     return Promise.resolve(newApp);
  },

  // Advertiser Side: Accept an application
  acceptApplication: async (taskId: string, applicationId: string, helperId: string): Promise<void> => {
      // Update task status
      const taskIndex = TASKS_STORE.findIndex(t => t.id === taskId);
      if (taskIndex >= 0) {
          TASKS_STORE[taskIndex].status = 'in_progress';
          TASKS_STORE[taskIndex].selected_helper_id = helperId;
      }

      // Update application status
      const appIndex = APPLICATIONS_STORE.findIndex(a => a.id === applicationId);
      if (appIndex >= 0) {
          APPLICATIONS_STORE[appIndex].status = 'accepted';
      }
      
      return Promise.resolve();
  },

  // Advertiser History
  getPostedTasks: async (userId: string): Promise<Task[]> => {
      return Promise.resolve(TASKS_STORE.filter(t => t.creator_id === userId));
  },

  // Worker History
  getCompletedTasks: async (userId: string): Promise<Task[]> => {
      // In a real app this would query tasks where selected_helper_id == userId AND status == done
      // For mock, we just check if they are the selected helper
      return Promise.resolve(TASKS_STORE.filter(t => t.selected_helper_id === userId));
  }
};