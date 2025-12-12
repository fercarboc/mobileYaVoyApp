import React from 'react';
import { Home, PlusCircle, User, MessageCircle } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  const getButtonClass = (view: ViewState) => {
    const isActive = currentView === view;
    return `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      isActive ? 'text-primary' : 'text-grey'
    }`;
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-20 bg-white border-t border-gray-200 pb-safe">
      <div className="grid grid-cols-4 h-full max-w-md mx-auto">
        <button onClick={() => onChangeView('HOME')} className={getButtonClass('HOME')}>
          <Home size={24} strokeWidth={currentView === 'HOME' ? 2.5 : 2} />
          <span className="text-xs font-medium">Inicio</span>
        </button>

        <button onClick={() => onChangeView('POST_TASK')} className={getButtonClass('POST_TASK')}>
          <div className="bg-primary rounded-full p-2 -mt-6 border-4 border-white shadow-lg text-white">
             <PlusCircle size={32} />
          </div>
          <span className="text-xs font-medium text-primary">Publicar</span>
        </button>

        <button onClick={() => onChangeView('CHAT')} className={getButtonClass('CHAT')}>
           <div className="relative">
            <MessageCircle size={24} strokeWidth={currentView === 'CHAT' ? 2.5 : 2} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
           </div>
          <span className="text-xs font-medium">Chat</span>
        </button>

        <button onClick={() => onChangeView('PROFILE')} className={getButtonClass('PROFILE')}>
          <User size={24} strokeWidth={currentView === 'PROFILE' ? 2.5 : 2} />
          <span className="text-xs font-medium">Perfil</span>
        </button>
      </div>
    </div>
  );
};