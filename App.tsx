
import React, { useState, useEffect, useRef } from 'react';
import { User, Task, ViewState, UrgencyLevel, TaskApplication, UserRole, JobType, ContractType } from './types';
import { ApiService, ChatService } from './services/api';
import { DISTRICTS, CATEGORIES, URGENCY_LABELS, URGENCY_COLORS, DAYS_OF_WEEK, CONTRACT_TYPES } from './constants';
import { BottomNav } from './components/BottomNav';
import { TaskCard } from './components/TaskCard';
import { ArrowLeft, MapPin, Send, Star, CheckCircle, ShieldCheck, Camera, LogOut, MessageSquare, Briefcase, List, Info, Heart, UserPlus, LogIn, ChevronRight, Calendar, FileText } from 'lucide-react';



const Header: React.FC<{ title?: string, subtitle?: string, user?: User }> = ({ title, subtitle, user }) => (
  <header className="px-5 pt-6 pb-2 bg-white sticky top-0 z-40 shadow-sm">
    <div className="flex justify-between items-center">
        <div>
            {subtitle && <p className="text-xs font-bold text-primary tracking-wider uppercase mb-0.5">{subtitle}</p>}
            <h1 className="font-display font-bold text-2xl text-dark">{title || 'YaVoy'}</h1>
        </div>
        {user && (
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary p-0.5">
                <img src={user.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
            </div>
        )}
    </div>
  </header>
);

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  
  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('PARTICULAR');
  const [district, setDistrict] = useState('Arganzuela');
  const [neighborhood, setNeighborhood] = useState('Legazpi');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatInputRef = useRef<HTMLInputElement | null>(null);
    type ChatMessage = { id: string; sender: 'me' | 'them'; text: string; time: string; helper_name?: string; helper_avatar?: string };
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');

    const sendChatMessage = async (text?: string) => {
        const msg = (text ?? chatInput).trim();
        if (!msg || !selectedTask) return;
        const optimistic: ChatMessage = { id: String(Date.now()), sender: 'me', text: msg, time: new Date().toISOString() };
        setChatMessages(prev => [...prev, optimistic]);
        setChatInput('');
        try {
            await ChatService.sendMessage(selectedTask.id, msg);
        } catch (err) {
            console.error('Failed to send message', err);
            alert('Error enviando mensaje');
        }
    };

    useEffect(() => {
        // scroll to bottom when messages change
        if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        // focus input when opening chat view
        if (chatInputRef.current) chatInputRef.current.focus();
    }, []);

    useEffect(() => {
        let sub: { unsubscribe: () => void } | null = null;
        const load = async () => {
            if (view !== 'CHAT' || !selectedTask) {
                setChatMessages([]);
                return;
            }

            const msgs = await ChatService.getMessages(selectedTask.id);
            const mapped = msgs.map((m: any) => ({
                id: String(m.id),
                sender: m.sender_user_id && user && String(m.sender_user_id) === String(user.id) ? 'me' as const : 'them' as const,
                text: m.body,
                time: m.sent_at,
                helper_name: m.sender_name || undefined
            }));
            setChatMessages(mapped);

            // subscribe to new messages
            try {
                sub = ChatService.subscribeToMessages(selectedTask.id, (newRow: any) => {
                    const incoming = {
                        id: String(newRow.id),
                        sender: newRow.sender_user_id && user && String(newRow.sender_user_id) === String(user.id) ? 'me' as const : 'them' as const,
                        text: newRow.body,
                        time: newRow.sent_at,
                        helper_name: newRow.sender_name || undefined
                    };
                    setChatMessages(prev => [...prev, incoming]);
                });
            } catch (err) {
                console.warn('Realtime subscribe failed', err);
            }
        };

        load();

        return () => {
            if (sub) sub.unsubscribe();
        };
    }, [view, selectedTask, user]);
  
  // New States for Detail/Profile
  const [candidates, setCandidates] = useState<TaskApplication[]>([]);
  const [profileTab, setProfileTab] = useState<'posted' | 'jobs'>('posted');
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);

  // --- POST TASK STATE ---
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    price: '', // Becomes fixed price or salary
    district: 'Arganzuela',
    neighborhood: DISTRICTS['Arganzuela'][0],
    category: 'RECADOS',
    urgency: 'medium' as UrgencyLevel,
  });

  // Advanced Task State
  const [jobType, setJobType] = useState<JobType>('ONE_OFF');
  const [isContract, setIsContract] = useState(false);
  const [scheduleData, setScheduleData] = useState({
      days: [] as number[],
      startTime: '09:00',
      endTime: '14:00'
  });
  const [contractData, setContractData] = useState({
      salary: '',
      type: 'FULL_TIME' as ContractType,
      socialSecurity: true
  });

  useEffect(() => {
    // Initial fetch
    if (view === 'HOME') {
        ApiService.getTasks().then(setTasks);
    }
  }, [view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const u = await ApiService.signIn(email, password);
        setUser(u);
        setView('HOME');
    } catch (e: any) {
        console.error(e);
        alert(e.message || 'Error al iniciar sesión.');
    } finally {
        setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const u = await ApiService.signUp(email, password, fullName, role, district, neighborhood);
        setUser(u);
        setView('HOME');
        alert("¡Cuenta creada con éxito!");
    } catch (e: any) {
        console.error(e);
        setPassword(''); 
        alert(e.message || 'Error al registrarse.');
    } finally {
        setLoading(false);
    }
  };

  const refreshTasks = () => {
      ApiService.getTasks().then(setTasks);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
        await ApiService.createTask({
            creator_id: user.id,
            title: newTask.title,
            description: newTask.description,
            price: Number(newTask.price), // Handled in API (ignored if contract)
            district: newTask.district,
            neighborhood: newTask.neighborhood,
            category: newTask.category,
            urgency: newTask.urgency,
            // New Complex Fields
            job_type: isContract ? 'MONTHLY' : jobType, // Contract implies recurring usually
            is_contract: isContract,
            schedule: (jobType !== 'ONE_OFF' || isContract) ? {
                days: scheduleData.days,
                startTime: scheduleData.startTime,
                endTime: scheduleData.endTime
            } : undefined,
            contract: isContract ? {
                salary: Number(contractData.salary),
                type: contractData.type,
                socialSecurity: contractData.socialSecurity
            } : undefined
        });
        refreshTasks();
        setView('HOME');
        // Reset form
        setNewTask({ ...newTask, title: '', description: '', price: '' });
        setJobType('ONE_OFF');
        setIsContract(false);
    } catch (e) {
        console.error(e);
        alert('Error creando tarea');
    } finally {
        setLoading(false);
    }
  };

  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);
    if (user && task.creator_id === user.id) {
        setLoading(true);
        const apps = await ApiService.getTaskApplications(task.id);
        setCandidates(apps);
        setLoading(false);
    }
    setView('TASK_DETAIL');
  };

  const handleAcceptCandidate = async (application: TaskApplication) => {
      if (!selectedTask) return;
      if (window.confirm(`¿Confirmas a ${application.helper_name} para esta tarea?`)) {
          await ApiService.acceptApplication(selectedTask.id, application.id, application.helper_id);
          const updatedTask = { ...selectedTask, status: 'in_progress' as const, selected_helper_id: application.helper_id };
          setSelectedTask(updatedTask);
          setCandidates(candidates.map(c => c.id === application.id ? {...c, status: 'accepted'} : c));
          refreshTasks();
      }
  };

  const toggleDay = (dayVal: number) => {
      const current = scheduleData.days;
      if (current.includes(dayVal)) {
          setScheduleData({ ...scheduleData, days: current.filter(d => d !== dayVal) });
      } else {
          setScheduleData({ ...scheduleData, days: [...current, dayVal].sort() });
      }
  };

  const loadProfileHistory = async () => {
      if (!user) return;
      if (profileTab === 'posted') {
          const t = await ApiService.getPostedTasks(user.id);
          setHistoryTasks(t);
      } else {
          const t = await ApiService.getCompletedTasks(user.id);
          setHistoryTasks(t);
      }
  };

  useEffect(() => {
      if (view === 'PROFILE') {
          loadProfileHistory();
      }
  }, [view, profileTab]);


  // --- RENDERERS ---

  const renderLogin = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white overflow-y-auto">
      <div className="w-20 h-20 mb-6 rotate-3 transition-transform hover:rotate-6">
                 {logoError ? (
                        <span className="text-4xl text-primary font-bold">Y!</span>
                 ) : (
                     <img
                         src="YaVoy.ico"
                         alt="YaVoy Logo"
                         className="w-full h-full object-contain drop-shadow-xl"
                         onError={() => setLogoError(true)}
                     />
                 )}
      </div>
      <h1 className="text-3xl font-display font-bold text-dark mb-1">YaVoy</h1>
      <p className="text-center text-grey mb-8 text-sm">Micro-tareas y empleo local.</p>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-full max-w-xs">
          <button 
            onClick={() => { setAuthMode('login'); setPassword(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'login' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
          >
              Iniciar Sesión
          </button>
          <button 
            onClick={() => { setAuthMode('register'); setPassword(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'register' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
          >
              Registrarse
          </button>
      </div>

      {authMode === 'login' ? (
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4 animate-in fade-in duration-300">
            <input type="email" placeholder="Tu email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:border-primary outline-none" />
            <input type="password" placeholder="Contraseña" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:border-primary outline-none" />
            <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2">
                {loading ? <span>Entrando...</span> : <><span>Entrar</span> <LogIn size={18} /></>}
            </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="w-full max-w-xs space-y-4 animate-in slide-in-from-right duration-300">
             <input type="text" placeholder="Nombre completo" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:border-primary outline-none" />
             <input type="email" placeholder="Tu email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:border-primary outline-none" />
             <input type="password" placeholder="Contraseña" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:border-primary outline-none" />
            
            <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase ml-1">¿Qué buscas?</p>
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setRole('PARTICULAR')} className={`p-3 rounded-xl border text-left transition-all ${role === 'PARTICULAR' || role === 'COMPANY' ? 'bg-primary/10 border-primary' : 'bg-gray-50 border-gray-100'}`}>
                        <span className="block text-xl mb-1">🏠</span>
                        <span className={`text-xs font-bold block ${role === 'PARTICULAR' ? 'text-primary' : 'text-gray-600'}`}>Publicar</span>
                    </button>
                    <button type="button" onClick={() => setRole('WORKER')} className={`p-3 rounded-xl border text-left transition-all ${role === 'WORKER' ? 'bg-primary/10 border-primary' : 'bg-gray-50 border-gray-100'}`}>
                        <span className="block text-xl mb-1">🛠️</span>
                        <span className={`text-xs font-bold block ${role === 'WORKER' ? 'text-primary' : 'text-gray-600'}`}>Trabajar</span>
                    </button>
                </div>
                {(role === 'PARTICULAR' || role === 'COMPANY') && (
                     <div className="flex items-center space-x-2 mt-2 px-1">
                        <input type="checkbox" id="isCompany" checked={role === 'COMPANY'} onChange={(e) => setRole(e.target.checked ? 'COMPANY' : 'PARTICULAR')} className="rounded text-primary focus:ring-primary" />
                        <label htmlFor="isCompany" className="text-xs text-gray-500">Soy una empresa</label>
                     </div>
                )}
            </div>
            <div className="flex space-x-2">
                 <select value={district} onChange={e => { const dist = e.target.value as keyof typeof DISTRICTS; setDistrict(dist); setNeighborhood(DISTRICTS[dist][0]); }} className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    {Object.keys(DISTRICTS).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    {(DISTRICTS[district as keyof typeof DISTRICTS] || []).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-dark text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2">
                {loading ? <span>Registrando...</span> : <><span>Crear Cuenta</span> <UserPlus size={18} /></>}
            </button>
        </form>
      )}
    </div>
  );

  const renderHome = () => (
    <div className="pb-24">
      <Header 
        title="Tareas cerca" 
        subtitle={user?.neighborhood ? `${user.neighborhood}, Madrid` : 'Madrid'} 
        user={user || undefined}
      />
      
      <div className="mt-4 px-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Categorías</h3>
        <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
                <button key={cat.id} className="flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-all">
                    <span className="text-2xl mb-1">{cat.icon}</span>
                    <span className="text-[10px] font-bold text-gray-600">{cat.label}</span>
                </button>
            ))}
        </div>
      </div>

      <div className="px-5 mt-6 space-y-4">
        <h2 className="font-display font-bold text-dark text-lg">Recientes en tu zona</h2>
        {tasks.filter(t => t.status === 'open').map(task => (
            <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
        ))}
        {tasks.filter(t => t.status === 'open').length === 0 && (
            <div className="text-center py-10 text-gray-400">
                <p>No hay tareas disponibles en tu zona.</p>
            </div>
        )}
      </div>
    </div>
  );

  const renderPostTask = () => (
    <div className="pb-24 bg-white min-h-screen">
      <div className="px-5 pt-6 pb-4 border-b border-gray-100 bg-white sticky top-0 z-40 flex items-center">
         <h1 className="font-display font-bold text-xl flex-1">Publicar tarea</h1>
      </div>

      <form onSubmit={handleCreateTask} className="p-5 space-y-6">
        
        {/* Type Selector */}
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Oferta</label>
            <div className="flex bg-gray-50 p-1 rounded-xl">
                <button type="button" onClick={() => { setJobType('ONE_OFF'); setIsContract(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${jobType === 'ONE_OFF' && !isContract ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Puntual</button>
                <button type="button" onClick={() => { setJobType('WEEKLY'); setIsContract(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${jobType !== 'ONE_OFF' && !isContract ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Recurrente</button>
                <button type="button" onClick={() => { setIsContract(true); setJobType('MONTHLY'); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isContract ? 'bg-dark shadow text-white' : 'text-gray-500'}`}>Contrato</button>
            </div>
        </div>

        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
            <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="Ej: Acompañar al médico" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:border-primary outline-none font-medium" />
        </div>

        {/* Category Grid */}
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
            <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => setNewTask({...newTask, category: cat.id})} className={`p-3 rounded-xl border text-xs font-medium transition-all ${newTask.category === cat.id ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-200 text-gray-600'}`}>
                        <span className="block text-lg mb-1">{cat.icon}</span> {cat.label}
                    </button>
                ))}
            </div>
        </div>

        {/* RECURRING OR CONTRACT SCHEDULE */}
        {(jobType !== 'ONE_OFF' || isContract) && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Horario y Días</label>
                <div className="flex justify-between mb-3">
                    {DAYS_OF_WEEK.map(day => (
                        <button 
                            key={day.val} 
                            type="button" 
                            onClick={() => toggleDay(day.val)}
                            className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${scheduleData.days.includes(day.val) ? 'bg-primary text-white' : 'bg-white text-gray-400 border border-gray-200'}`}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
                <div className="flex space-x-2">
                    <input type="time" value={scheduleData.startTime} onChange={e => setScheduleData({...scheduleData, startTime: e.target.value})} className="flex-1 p-2 rounded-lg border border-gray-200 text-sm" />
                    <span className="text-gray-400 self-center">-</span>
                    <input type="time" value={scheduleData.endTime} onChange={e => setScheduleData({...scheduleData, endTime: e.target.value})} className="flex-1 p-2 rounded-lg border border-gray-200 text-sm" />
                </div>
            </div>
        )}

        {/* PRICE / SALARY INPUTS */}
        <div className="flex space-x-4">
             <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{isContract ? 'Salario Mensual (€)' : 'Precio (€)'}</label>
                <input 
                    required
                    type="number" 
                    value={isContract ? contractData.salary : newTask.price}
                    onChange={e => {
                        if (isContract) setContractData({...contractData, salary: e.target.value});
                        else setNewTask({...newTask, price: e.target.value});
                    }}
                    placeholder={isContract ? "1100" : "15"} 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:border-primary outline-none font-display font-bold text-lg"
                />
             </div>
             {!isContract && (
                 <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Urgencia</label>
                    <select value={newTask.urgency} onChange={e => setNewTask({...newTask, urgency: e.target.value as UrgencyLevel})} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none appearance-none font-medium">
                        <option value="low">Sin prisa</option>
                        <option value="medium">Hoy</option>
                        <option value="high">¡Urgente!</option>
                    </select>
                 </div>
             )}
        </div>

        {/* CONTRACT EXTRAS */}
        {isContract && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Contrato</label>
                    <select value={contractData.type} onChange={e => setContractData({...contractData, type: e.target.value as ContractType})} className="w-full p-3 bg-white rounded-lg border border-gray-200 text-sm">
                        {CONTRACT_TYPES.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                    </select>
                 </div>
                 <div className="flex items-center space-x-2">
                     <input type="checkbox" id="ss" checked={contractData.socialSecurity} onChange={e => setContractData({...contractData, socialSecurity: e.target.checked})} className="rounded text-primary focus:ring-primary" />
                     <label htmlFor="ss" className="text-sm text-gray-700">Alta en Seguridad Social incluida</label>
                 </div>
            </div>
        )}

        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
            <textarea required rows={4} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Describe qué necesitas..." className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:border-primary outline-none resize-none" />
        </div>

        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ubicación</label>
            <div className="flex space-x-2">
                <select value={newTask.district} onChange={e => { const dist = e.target.value as keyof typeof DISTRICTS; setNewTask({...newTask, district: dist, neighborhood: DISTRICTS[dist][0]}); }} className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                    {Object.keys(DISTRICTS).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={newTask.neighborhood} onChange={e => setNewTask({...newTask, neighborhood: e.target.value})} className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                    {(DISTRICTS[newTask.district as keyof typeof DISTRICTS] || []).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
        </div>

        <button type="submit" disabled={loading} className={`w-full text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all ${isContract ? 'bg-dark' : 'bg-primary'}`}>
            {loading ? 'Publicando...' : 'Publicar Tarea'}
        </button>
      </form>
    </div>
  );

  const renderTaskDetail = () => {
    if (!selectedTask) return null;
    const isCreator = user && selectedTask.creator_id === user.id;

    // Helper for schedule display
    const getScheduleText = () => {
        if (!selectedTask.schedule) return null;
        const days = selectedTask.schedule.day_of_week
          .map(d => DAYS_OF_WEEK.find(day => day.val === d)?.label)
          .join(', ');
        return `${days} de ${selectedTask.schedule.start_time.slice(0,5)} a ${selectedTask.schedule.end_time.slice(0,5)}`;
    };

    return (
        <div className="bg-white min-h-screen pb-24 relative">
             <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-md">
                <button onClick={() => setView('HOME')} className="p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeft size={24} className="text-dark"/>
                </button>
                <span className="font-bold text-sm text-gray-500">{isCreator ? 'Gestionar Anuncio' : 'Detalles de Tarea'}</span>
                <ShieldCheck size={24} className="text-gray-300"/>
             </div>

             <div className="px-6 pt-2">
                <div className="flex justify-between items-start mb-4">
                    {selectedTask.is_contract ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-dark text-white">CONTRATO</span>
                    ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${URGENCY_COLORS[selectedTask.urgency]}`}>
                            {URGENCY_LABELS[selectedTask.urgency]}
                        </span>
                    )}
                    <div className="text-right">
                        <span className="font-display font-bold text-3xl text-dark">{selectedTask.price}€</span>
                        {selectedTask.is_contract && <span className="block text-xs text-gray-400">/ mes</span>}
                    </div>
                </div>

                <h1 className="font-display font-bold text-2xl text-dark mb-4">{selectedTask.title}</h1>

                {/* Contract / Schedule Info Card */}
                {(selectedTask.schedule || selectedTask.contract) && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3 border border-gray-100">
                        {selectedTask.schedule && (
                            <div className="flex items-start text-sm">
                                <Calendar size={18} className="text-primary mr-3 mt-0.5" />
                                <div>
                                    <p className="font-bold text-dark">Horario</p>
                                    <p className="text-gray-600">{getScheduleText()}</p>
                                </div>
                            </div>
                        )}
                        {selectedTask.contract && (
                             <div className="flex items-start text-sm pt-2 border-t border-gray-200">
                                <FileText size={18} className="text-primary mr-3 mt-0.5" />
                                <div>
                                    <p className="font-bold text-dark">Condiciones Laborales</p>
                                    <p className="text-gray-600">
                                        {CONTRACT_TYPES.find(t => t.val === selectedTask.contract?.contract_type)?.label}
                                    </p>
                                    {selectedTask.contract.social_security && (
                                        <p className="text-green-600 text-xs font-bold flex items-center mt-1">
                                            <CheckCircle size={10} className="mr-1"/> Alta Seguridad Social
                                        </p>
                                    )}
                                </div>
                             </div>
                        )}
                    </div>
                )}

                {/* SAFETY BANNER */}
                {selectedTask.category === 'MAYORES' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 flex items-start">
                        <Info size={18} className="text-blue-600 mr-2 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800">
                            <p className="font-bold mb-1">Aviso de seguridad para Mayores</p>
                            <p>Esta tarea implica asistencia a personas mayores. Recuerda no compartir datos bancarios ni manejar dinero.</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-3 mb-6 p-3 border border-gray-100 rounded-xl">
                    <img src={selectedTask.creator_avatar} className="w-10 h-10 rounded-full" alt="Creator"/>
                    <div>
                        <p className="text-sm font-bold text-dark">{selectedTask.creator_name}</p>
                        <div className="flex items-center">
                            <Star size={12} className="text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-500 ml-1">4.8</span>
                        </div>
                    </div>
                </div>

                <div className="prose text-gray-600 mb-8 text-sm leading-relaxed">
                    <p>{selectedTask.description || 'Sin descripción adicional.'}</p>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
                    <MapPin size={16} />
                    <span>{selectedTask.neighborhood}, {selectedTask.district}</span>
                </div>
                
                {/* ADVERTISER / CANDIDATE LIST */}
                {isCreator && (
                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="font-bold text-dark text-lg mb-4 flex items-center">Solicitudes <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{candidates.length}</span></h3>
                        
                        {selectedTask.status === 'in_progress' && (
                             <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center space-x-3">
                                <CheckCircle className="text-green-500" size={24} />
                                <div>
                                    <p className="font-bold text-green-800 text-sm">Trato cerrado</p>
                                    <p className="text-xs text-green-600">Has aceptado una solicitud.</p>
                                </div>
                             </div>
                        )}

                        <div className="space-y-4">
                            {candidates.map(candidate => (
                                <div key={candidate.id} className={`p-4 rounded-xl border transition-all ${candidate.status === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-3">
                                            <img src={candidate.helper_avatar} className="w-10 h-10 rounded-full object-cover" alt={candidate.helper_name}/>
                                            <div>
                                                <p className="font-bold text-sm text-dark">{candidate.helper_name}</p>
                                                <div className="flex items-center text-xs text-gray-500"><Star size={10} className="text-yellow-400 fill-current mr-1" />{candidate.helper_rating}</div>
                                            </div>
                                        </div>
                                        {candidate.status === 'accepted' ? <span className="px-2 py-1 bg-green-200 text-green-800 text-[10px] font-bold rounded-md">ACEPTADO</span> : <span className="text-[10px] text-gray-400">{candidate.status}</span>}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-3 mb-3 p-2 bg-gray-50 rounded-lg italic">"{candidate.message}"</p>
                                    {selectedTask.status === 'open' && (
                                        <div className="flex space-x-2 mt-2">
                                            <button onClick={() => setView('CHAT')} className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 flex items-center justify-center space-x-1"><MessageSquare size={14} /><span>Chat</span></button>
                                            <button onClick={() => handleAcceptCandidate(candidate)} className="flex-1 py-2 rounded-lg bg-dark text-white text-xs font-bold flex items-center justify-center space-x-1 shadow-sm"><CheckCircle size={14} /><span>Aceptar</span></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* WORKER VIEW */}
                {!isCreator && selectedTask.status === 'open' && (
                    <div className="fixed bottom-0 left-0 w-full p-5 bg-white border-t border-gray-100 pb-safe">
                        <button onClick={() => { ApiService.applyToTask(selectedTask.id, "¡Hola! Estoy interesado en ayudarte."); alert('¡Solicitud enviada!'); setView('HOME'); }} className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform">
                            <span>Me ofrezco {selectedTask.is_contract ? 'para el puesto' : `por ${selectedTask.price}€`}</span>
                            <Send size={18} />
                        </button>
                    </div>
                )}
             </div>
        </div>
    );
  };

  const renderProfile = () => {
      if (!user) return null;
      return (
          <div className="pb-24 bg-gray-50 min-h-screen">
              <div className="bg-white pb-6 rounded-b-3xl shadow-sm z-10 relative">
                  <Header title="Perfil" />
                  <div className="flex flex-col items-center mt-4 px-6">
                      <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden mb-4 relative">
                          <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <h2 className="font-display font-bold text-2xl text-dark flex items-center">{user.full_name}{user.is_pro && <CheckCircle size={20} className="text-blue-500 ml-2 fill-current text-white bg-blue-500 rounded-full" />}</h2>
                      <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">{user.user_type === 'company' ? 'Empresa' : 'Particular'}</span>
                          <span className="text-gray-500 text-sm">{user.neighborhood}, Madrid</span>
                      </div>
                      <div className="flex items-center space-x-6 mt-6 w-full justify-center">
                          <div className="text-center"><span className="block font-bold text-xl text-dark">{user.rating_avg}</span><span className="text-xs text-gray-400 uppercase tracking-wide">Rating</span></div>
                          <div className="w-px h-8 bg-gray-200"></div>
                          <div className="text-center"><span className="block font-bold text-xl text-dark">{user.rating_count}</span><span className="text-xs text-gray-400 uppercase tracking-wide">Opiniones</span></div>
                      </div>
                  </div>
              </div>

              <div className="px-4 mt-6">
                  <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                      <button onClick={() => setProfileTab('posted')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${profileTab === 'posted' ? 'bg-dark text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}><List size={14} /><span>Mis Anuncios</span></button>
                      <button onClick={() => setProfileTab('jobs')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${profileTab === 'jobs' ? 'bg-dark text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}><Briefcase size={14} /><span>Mis Trabajos</span></button>
                  </div>
                  <div className="space-y-4">
                      {historyTasks.map(task => (
                          <div key={task.id} onClick={() => handleTaskClick(task)} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:scale-95 transition-transform">
                              <div className="flex justify-between items-center mb-2">
                                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${task.status === 'open' ? 'bg-blue-100 text-blue-700' : task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                      {task.status === 'open' ? 'Abierto' : task.status === 'in_progress' ? 'En curso' : 'Finalizado'}
                                  </span>
                                  <span className="font-bold text-primary">{task.price}€{task.is_contract && '/mes'}</span>
                              </div>
                              <h4 className="font-bold text-dark text-sm mb-1">{task.title}</h4>
                              <p className="text-xs text-gray-400">{new Date(task.created_at).toLocaleDateString()}</p>
                          </div>
                      ))}
                      {historyTasks.length === 0 && <div className="text-center py-8 opacity-50"><p className="text-sm">No tienes historial aquí.</p></div>}
                  </div>
              </div>
              
              <div className="px-6 pb-6">
                  <button onClick={() => { setUser(null); setView('LOGIN'); }} className="mt-10 w-full py-3 text-red-500 font-medium text-sm flex items-center justify-center space-x-2"><LogOut size={16} /><span>Cerrar Sesión</span></button>
              </div>
          </div>
      )
  }

  const renderChat = () => (
      <div className="pb-24 pt-6 px-5 min-h-screen bg-white flex flex-col">
           <h1 className="font-display font-bold text-2xl text-dark mb-6">Mensajes</h1>

           <div className="flex-1 overflow-y-auto space-y-4 px-1" style={{ paddingBottom: '140px' }}>
               {chatMessages.length === 0 && (
                   <div className="text-center text-gray-400 mt-10">No hay mensajes todavía. Empieza la conversación abajo.</div>
               )}

               {chatMessages.map(m => (
                   <div key={m.id} className={`flex items-start ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                       {m.sender === 'them' && (
                           <div className="flex items-start space-x-3 max-w-full">
                               <img src={m.helper_avatar || 'https://picsum.photos/id/1011/200/200'} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt={m.helper_name || 'User'} />
                               <div>
                                   <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm max-w-[75vw] break-words">
                                       <p className="text-sm text-gray-800 leading-snug">{m.text}</p>
                                   </div>
                                   <div className="text-[10px] text-gray-400 mt-1 ml-1">{m.helper_name || 'Contacto'} · {new Date(m.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                               </div>
                           </div>
                       )}

                       {m.sender === 'me' && (
                           <div className="flex items-end flex-col max-w-full">
                               <div className="bg-primary text-white p-3 rounded-2xl shadow max-w-[75vw] break-words ml-3 text-sm">
                                   <p className="leading-snug">{m.text}</p>
                               </div>
                               <div className="text-[10px] text-gray-400 mt-1">Tú · {new Date(m.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                           </div>
                       )}
                   </div>
               ))}

               <div ref={messagesEndRef} />
           </div>

           <div className="fixed left-0 right-0 bottom-0 p-4 bg-white border-t border-gray-100 flex items-center space-x-2">
               <input
                   ref={chatInputRef}
                   value={chatInput}
                   onChange={e => setChatInput(e.target.value)}
                   onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                   placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
                   className="flex-1 p-3 rounded-2xl border border-gray-200 outline-none resize-none"
                   aria-label="Escribe un mensaje"
               />
               <button onClick={() => sendChatMessage()} disabled={!chatInput.trim()} className={`px-4 py-3 rounded-2xl font-bold ${chatInput.trim() ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                   Enviar
               </button>
           </div>
      </div>
  )

  if (view === 'LOGIN') return renderLogin();

  return (
    <div className="bg-light min-h-screen font-sans text-dark max-w-md mx-auto relative shadow-2xl">
      {view === 'HOME' && renderHome()}
      {view === 'POST_TASK' && renderPostTask()}
      {view === 'TASK_DETAIL' && renderTaskDetail()}
      {view === 'PROFILE' && renderProfile()}
      {view === 'CHAT' && renderChat()}
      {view !== 'TASK_DETAIL' && <BottomNav currentView={view} onChangeView={setView} />}
    </div>
  );
};

export default App;
