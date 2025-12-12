
import React from 'react';
import { Task } from '../types';
import { URGENCY_COLORS, URGENCY_LABELS, DAYS_OF_WEEK } from '../constants';
import { MapPin, Clock, Briefcase, Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const timeAgo = (dateStr: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const getScheduleText = () => {
    if (!task.schedule || !task.schedule.day_of_week) return null;
    const days = task.schedule.day_of_week
      .map(d => DAYS_OF_WEEK.find(day => day.val === d)?.label)
      .filter(Boolean)
      .join(', ');
    return `${days} • ${task.schedule.start_time.slice(0,5)}-${task.schedule.end_time.slice(0,5)}`;
  };

  return (
    <div 
      onClick={() => onClick(task)}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform duration-100 cursor-pointer relative overflow-hidden"
    >
      {/* Visual Indicator for Contract */}
      {task.is_contract && (
        <div className="absolute top-0 right-0 bg-dark text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl z-10">
          CONTRATO
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
           <img src={task.creator_avatar} alt={task.creator_name} className="w-8 h-8 rounded-full object-cover bg-gray-200" />
           <div>
             <p className="text-xs text-gray-500 font-medium">{task.creator_name}</p>
             <p className="text-[10px] text-gray-400">{timeAgo(task.created_at)} atrás</p>
           </div>
        </div>
        {!task.is_contract && (
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold font-badge uppercase ${URGENCY_COLORS[task.urgency]}`}>
            {URGENCY_LABELS[task.urgency]}
          </span>
        )}
      </div>

      <div className="flex justify-between items-start">
        <h3 className="font-display font-bold text-dark text-lg leading-tight mb-2 flex-1 pr-2">
            {task.title}
        </h3>
        <div className="text-right">
            <span className={`font-display font-bold text-xl ${task.is_contract ? 'text-dark' : 'text-primary'}`}>
                {task.price}€
            </span>
            {task.is_contract && <span className="block text-[9px] text-gray-400 uppercase font-medium">Mensuales</span>}
        </div>
      </div>

      {/* Schedule Info */}
      {(task.job_type === 'WEEKLY' || task.job_type === 'MONTHLY') && task.schedule && (
        <div className="flex items-center text-xs text-gray-600 mb-2 bg-gray-50 p-1.5 rounded-lg inline-flex">
            <Calendar size={12} className="mr-1.5" />
            <span className="font-medium">{getScheduleText()}</span>
        </div>
      )}

      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
        <div className="flex items-center">
            <MapPin size={14} className="mr-1 text-gray-400" />
            {task.neighborhood}
        </div>
        <div className="flex items-center">
            <Clock size={14} className="mr-1 text-gray-400" />
            {task.status === 'open' ? 'Disponible' : 'Cerrado'}
        </div>
      </div>
    </div>
  );
};
