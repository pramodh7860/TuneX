import React from 'react';
import { useCarStore } from '../../store';
import { Loader2, Check, X } from 'lucide-react';

export default function PriceDisplay() {
  useCarStore(state => state.selectedEngine);
  useCarStore(state => state.selectedWheels);
  useCarStore(state => state.selectedAero);
  useCarStore(state => state.selectedWeightSetup);

  const stats = useCarStore.getState().getComputedStats();

  const user = useCarStore(state => state.user);
  const saveCarConfigToDb = useCarStore(state => state.saveCarConfigToDb);
  const setShowLoginModal = useCarStore(state => state.setShowLoginModal);

  const [saveStatus, setSaveStatus] = React.useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleSave = async () => {
    setSaveStatus('loading');
    const res = await saveCarConfigToDb();
    if (res.success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setErrorMessage(res.error || 'Failed to save');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  let scoreColor = 'text-white';
  if (stats.totalScore < 40) scoreColor = 'text-red-500';
  else if (stats.totalScore < 70) scoreColor = 'text-yellow-500';
  else scoreColor = 'text-green-500';

  return (
    <div className="absolute bottom-0 left-0 p-8 md:p-12 flex flex-col gap-5 pointer-events-auto z-50">

      {/* Configuration Score */}
      <div className="flex flex-col gap-1 group">
        <span className="text-white/40 text-[9px] tracking-[0.2em] uppercase font-bold group-hover:text-white/70 transition-colors">Total Configuration</span>
        <span className={`text-2xl md:text-3xl font-light tracking-wider drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-500 ${scoreColor}`}>
          {stats.totalScore}
        </span>
      </div>

      {/* Build Total Cost */}
      <div className="flex flex-col gap-1 group relative">
        <span className="text-white/40 text-[9px] tracking-[0.2em] uppercase font-bold group-hover:text-white/70 transition-colors">Total Cost</span>
        <span
          key={stats.price}
          className="text-2xl md:text-3xl font-light text-gold-500 tracking-wider drop-shadow-[0_0_15px_rgba(212,175,55,0.6)] animate-in fade-in zoom-in duration-300"
        >
          {stats.price}
        </span>
      </div>

      {/* Save Build Button */}
      <div className="mt-2 min-w-[160px]">
        {user ? (
          <button
            onClick={handleSave}
            disabled={saveStatus === 'loading'}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 text-[9px] font-bold tracking-widest uppercase rounded-full border transition-all duration-300 ${saveStatus === 'loading'
              ? 'border-white/10 bg-white/5 text-white/50 cursor-not-allowed'
              : saveStatus === 'success'
                ? 'border-green-500 bg-green-500/10 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.25)]'
                : saveStatus === 'error'
                  ? 'border-red-500 bg-red-500/10 text-red-500'
                  : 'border-white/10 hover:border-gold-500 hover:text-gold-500 hover:bg-gold-500/5 bg-white/5 text-white/80'
              }`}
          >
            {saveStatus === 'loading' && <Loader2 className="animate-spin" size={12} />}
            {saveStatus === 'success' && <Check size={12} />}
            {saveStatus === 'error' && <X size={12} />}

            {saveStatus === 'loading' && 'Locking Build...'}
            {saveStatus === 'success' && 'Build Secured'}
            {saveStatus === 'error' && 'Secure Failed'}
            {saveStatus === 'idle' && 'Secure to Garage'}
          </button>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 text-[9px] font-bold tracking-widest uppercase rounded-full border border-white/5 hover:border-white/20 hover:bg-white/5 bg-white/0 text-white/40 hover:text-white/70 transition-all duration-300"
          >
            Sign In to Save Build
          </button>
        )}
      </div>

    </div>
  );
}
