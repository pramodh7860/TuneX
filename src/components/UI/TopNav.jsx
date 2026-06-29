import React from 'react';
import { useCarStore } from '../../store';
import { carModelsInfo } from '../../data/models';
import { User, LogOut, ChevronDown } from 'lucide-react';

export default function TopNav() {
  const selectedModel = useCarStore(state => state.selectedModel) || 'bugatti';
  const modelInfo = carModelsInfo[selectedModel] || carModelsInfo.bugatti;
  
  const user = useCarStore(state => state.user);
  const setShowLoginModal = useCarStore(state => state.setShowLoginModal);
  const logout = useCarStore(state => state.logout);

  return (
    <div className="absolute top-0 left-0 w-full p-8 md:p-12 flex justify-between items-start pointer-events-none z-50">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-5xl font-extralight tracking-[0.25em] text-white uppercase drop-shadow-2xl">{modelInfo.brand}</h1>
        <p className="text-white/60 tracking-[0.3em] text-[10px] uppercase font-medium ml-1">{modelInfo.name}</p>
      </div>

      {/* Auth Controls on Right */}
      <div className="flex items-center gap-4 pointer-events-auto">
        {user ? (
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 select-none">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gold-500/20 flex items-center justify-center text-[10px] text-gold-500 font-bold border border-gold-500/30">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-[10px] text-white/80 tracking-widest uppercase font-bold">{user.name}</span>
              <ChevronDown size={12} className="text-white/40 group-hover:text-white/80 transition-colors" />
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-300 origin-top-right z-50">
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold">Logged in as</p>
                <p className="text-[10px] text-white/80 truncate font-light">{user.email}</p>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-[10px] tracking-widest uppercase font-bold"
              >
                <LogOut size={12} className="text-red-500/80" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-gold-500 hover:text-white font-bold tracking-widest uppercase text-[9px] rounded-full transition-all duration-300 shadow-md shadow-white/5 hover:shadow-gold-500/15"
          >
            <User size={12} />
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}

