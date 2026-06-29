import React, { Suspense } from 'react';
import * as THREE from 'three';
import { useCarStore } from '../../store';
import { cars } from '../../data/cars';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, Center } from '@react-three/drei';
import { MODEL_CONFIG } from '../../config/models';
import { Check, X } from 'lucide-react';

const colorsExternal = [
  { name: 'Nero Nemesis', value: '#111111' },
  { name: 'Bianco Avus', value: '#ececeb' },
  { name: 'Rosso Corsa', value: '#d40000' },
  { name: 'Riviera Blue', value: '#008ecc' },
  { name: 'Verde Mantis', value: '#5acc22' },
  { name: 'Liquid Bronze', value: '#8c6742' },
];

const colorsInternal = [
  { name: 'Nero', value: '#121212' },
  { name: 'Cuoio', value: '#965b32' },
  { name: 'Crema', value: '#e8e4c9' },
  { name: 'Rosso', value: '#6e1313' },
];

export default function ContextPanel() {
  const activeCategory = useCarStore(state => state.activeCategory);
  
  // Reactive hooks for visual updates inside the panel
  useCarStore(state => state.selectedEngine);
  useCarStore(state => state.selectedWheels);
  useCarStore(state => state.selectedAero);
  useCarStore(state => state.selectedWeightSetup);
  
  // Live stats from engine
  const stats = useCarStore.getState().getComputedStats();
  
  const selectedModel = useCarStore(state => state.selectedModel);
  const currentCar = cars[selectedModel] || cars['bugatti'];

  // State specific pickers
  const bodyColor = useCarStore(state => state.bodyColor);
  const setBodyColor = useCarStore(state => state.setBodyColor);
  
  const interiorColor = useCarStore(state => state.interiorColor);
  const setInteriorColor = useCarStore(state => state.setInteriorColor);

  const selectedWheels = useCarStore(state => state.selectedWheels);
  const setSelectedWheels = useCarStore(state => state.setSelectedWheels);

  const selectedAero = useCarStore(state => state.selectedAero);
  const setSelectedAero = useCarStore(state => state.setSelectedAero);

  const selectedEngine = useCarStore(state => state.selectedEngine);
  const setSelectedEngine = useCarStore(state => state.setSelectedEngine);

  const selectedWeight = useCarStore(state => state.selectedWeightSetup);
  const setSelectedWeight = useCarStore(state => state.setSelectedWeightSetup);

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

  // Modular Renders
  let title = 'Tuning Context';
  let ContentRender = null;

  switch (activeCategory) {
    case 'ai':
      title = 'AI Auto-Tuner';
      ContentRender = <AIChat currentCar={currentCar} />;
      break;
    case 'paint':
      title = 'Exterior Finish';
      ContentRender = <ColorPicker colors={colorsExternal} selected={bodyColor} onSelect={setBodyColor} />;
      break;
    case 'interior':
      title = 'Upholstery & Trim';
      ContentRender = <ColorPicker colors={colorsInternal} selected={interiorColor} onSelect={setInteriorColor} />;
      break;
    case 'wheels':
      title = 'Alloy Engineering';
      ContentRender = <HorizontalCards items={currentCar.wheels} selected={selectedWheels} onSelect={setSelectedWheels} />;
      break;
    case 'aero':
      title = 'Active Aerodynamics';
      ContentRender = <HorizontalCards items={currentCar.aero} selected={selectedAero} onSelect={setSelectedAero} />;
      break;
    case 'engine':
      title = 'Heart & Soul';
      ContentRender = <VerticalCards items={currentCar.engines} selected={selectedEngine} onSelect={setSelectedEngine} />;
      break;
    case 'weight':
      title = 'Chassis Diet';
      ContentRender = <VerticalCards items={currentCar.weight} selected={selectedWeight} onSelect={setSelectedWeight} />;
      break;
  }

  return (
    <div className="absolute top-0 right-0 h-full w-[420px] bg-gradient-to-l from-black/95 to-transparent pointer-events-none z-40 flex flex-col justify-center">
      <div className="mr-12 ml-6 p-8 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-2xl shadow-2xl pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] will-change-transform">
        
        {/* Module Title */}
        <h2 className="text-sm font-extralight tracking-[0.3em] uppercase text-white/80 mb-6 drop-shadow-md">
          {title}
        </h2>
        
        {/* Dynamic Controls Region */}
        <div className="min-h-[220px]">
          {ContentRender}
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-10" />

        {/* Live Segmented Performance Dashboard */}
        <div>
          <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-2">
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-bold">Telemetry</h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold">Build Score:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${
                stats.totalScore < 40 ? 'text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                stats.totalScore < 70 ? 'text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' :
                'text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
              }`}>
                {stats.totalScore}/100
              </span>
            </div>
          </div>
          <SegmentedGauge label="Velocity (Top Speed)" percent={stats.topSpeedPercent} value={`${stats.topSpeedValue}`} />
          <SegmentedGauge label="0-60 Sprint" percent={stats.zeroToSixtyPercent} value={`${stats.zeroToSixtyValue}`} />
          <SegmentedGauge label="Kinetic Thrust" percent={stats.accelerationPercent} value={`${stats.accelerationValue}`} />
          <SegmentedGauge label="Mechanical Grip" percent={stats.gripPercent} value={`${stats.gripValue}`} />
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

        {/* Cost & Save Actions Row */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">Total Cost</span>
            <span className="text-xl md:text-2xl font-light text-gold-500 tracking-wider drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              {stats.price}
            </span>
          </div>

          <div className="min-w-[170px]">
            {user ? (
              <button
                onClick={handleSave}
                disabled={saveStatus === 'loading'}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 text-[9px] font-bold tracking-widest uppercase rounded-full border transition-all duration-300 ${
                  saveStatus === 'loading'
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
        
      </div>
    </div>
  );
}

// Subcomponents

const ColorPicker = ({ colors, selected, onSelect }) => (
  <div className="flex flex-wrap gap-4 mt-6">
    {colors.map(c => (
      <button 
        key={c.name}
        onClick={() => onSelect(c.value)}
        title={c.name}
        className={`w-10 h-10 rounded-full transition-all duration-500 relative group
          ${selected === c.value ? 'scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)] ring-[1.5px] ring-white/60 ring-offset-4 ring-offset-black/90' : 'border border-white/20 hover:scale-105'}
        `}
        style={{ backgroundColor: c.value }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none opacity-50" />
      </button>
    ))}
  </div>
);

const HorizontalCards = ({ items, selected, onSelect }) => (
  <div className="flex gap-4 overflow-x-auto snap-x no-scrollbar pb-4 mt-4 -mx-2 px-2">
    {items.map(item => (
      <button
        key={item.id}
        onClick={() => onSelect(item.id)}
        className={`shrink-0 w-[140px] aspect-[4/5] rounded-xl flex flex-col justify-end p-4 snap-center transition-all duration-500 overflow-hidden relative group border
          ${selected === item.id ? 'border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.15)] ring-1 ring-white/50' : 'border-white/10 hover:border-white/30 bg-white/5'}
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent mix-blend-luminosity" />
        {selected === item.id && <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent mix-blend-overlay" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10" />
        
        <ItemThumbnail item={item} />
        
        <div className="relative z-10 text-left">
          <h4 className={`text-[11px] font-bold tracking-[0.15em] uppercase mb-1 drop-shadow-md ${selected === item.id ? 'text-white' : 'text-white/60'}`}>{item.name}</h4>
          {item.price > 0 && <p className="text-[10px] text-white/50 tracking-wider">${item.price.toLocaleString()}</p>}
        </div>
      </button>
    ))}
  </div>
);

const VerticalCards = ({ items, selected, onSelect }) => (
  <div className="flex flex-col gap-3 mt-4">
    {items.map(item => (
      <button
        key={item.id}
        onClick={() => onSelect(item.id)}
        className={`w-full p-4 rounded-xl border text-left transition-all duration-500 relative overflow-hidden group flex justify-between items-center
          ${selected === item.id ? 'border-white/50 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'border-white/10 hover:border-white/30 bg-white/5'}
        `}
      >
        <div className="relative z-10">
          <h4 className={`text-[11px] font-bold tracking-[0.15em] uppercase drop-shadow-md ${selected === item.id ? 'text-white' : 'text-white/60'}`}>{item.name}</h4>
          <div className="flex flex-wrap gap-x-3">
            {item.effect && Object.entries(item.effect).map(([key, val]) => val !== 0 && (
              <p key={key} className="text-[10px] text-white/60 tracking-wider mt-1">
                {val > 0 ? '+' : ''}{val} {key.toUpperCase()}
              </p>
            ))}
          </div>
        </div>
        {selected === item.id && <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_12px_#ffffff]" />}
      </button>
    ))}
  </div>
);

const SegmentedGauge = ({ label, percent, value }) => {
  const segments = 18;
  const activeSegments = Math.round((percent / 100) * segments);
  return (
    <div className="flex flex-col gap-[6px] w-full mb-5">
      <div className="flex justify-between items-end">
        <span className="text-[9px] font-semibold tracking-[0.2em] text-white/50 uppercase">{label}</span>
        <span className="text-[11px] font-light tracking-wider text-white drop-shadow-md">{value}</span>
      </div>
      <div className="flex gap-[3px] h-[6px]">
        {Array.from({ length: segments }).map((_, i) => (
          <div 
            key={i}
            className={`flex-1 rounded-[1px] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${
              i < activeSegments 
                ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]' 
                : 'bg-white/10'
            }`}
            style={{ transitionDelay: `${i * 15}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

function ThumbnailModel({ url, isCarbon }) {
  const { scene } = useGLTF(url);
  const cloned = React.useMemo(() => {
    const c = scene.clone();
    
    // Auto-scale to fit within 1 unit area synchronously
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (maxDim > 0) {
      const scale = 1.2 / maxDim; // Adjust fill size
      c.scale.set(scale, scale, scale);
    }
    
    // Face it slightly towards camera and tilt down
    c.rotation.y = Math.PI / 5;
    c.rotation.x = Math.PI / 16;

    return c;
  }, [scene]);
  
  return <primitive object={cloned} />;
}

function ItemThumbnail({ item }) {
  let glbPath = null;
  const nameL = item.name.toLowerCase();
  
  if (nameL.includes('carbon')) {
    glbPath = MODEL_CONFIG.getUrl('pax_michelin');
  } else if (nameL.includes('stock') || nameL.includes('pax') || nameL.includes('standard') || nameL.includes('slicks')) {
    glbPath = MODEL_CONFIG.getUrl('carbon_fiber');
  }
  
  if (!glbPath) return null;

  return (
    <div className="absolute inset-0 top-0 bottom-12 z-0 pointer-events-none opacity-90 transition-opacity duration-500 group-hover:opacity-100">
      <Canvas camera={{ position: [1.5, 1, 1.5], fov: 40 }} dpr={[1, 2]} gl={{ preserveDrawingBuffer: false, antialias: true }}>
        <ambientLight intensity={2} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <Environment preset="studio" />
        <Suspense fallback={null}>
          <Center>
            <ThumbnailModel url={glbPath} isCarbon={nameL.includes('carbon')} />
          </Center>
        </Suspense>
      </Canvas>
    </div>
  );
}

import { getAiTuningRecommendation } from '../../services/aiClient';
import { Bot, Sparkles, Loader2 } from 'lucide-react';

const AIChat = ({ currentCar }) => {
  const [goal, setGoal] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('Describe your track or driving goal, and I will instantly configure the optimal parts.');

  const setSelectedEngine = useCarStore(state => state.setSelectedEngine);
  const setSelectedWheels = useCarStore(state => state.setSelectedWheels);
  const setSelectedAero = useCarStore(state => state.setSelectedAero);

  const handleConsult = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setMessage('Analyzing optimal telemetry...');
    
    const rec = await getAiTuningRecommendation(goal);
    
    if (rec && rec._error === 'RATE_LIMIT') {
      setMessage('API Quota Exceeded (Too Many Requests). Please wait 1 minute before your next setup.');
    } else if (rec && !rec._error) {
      // Map JSON to actual upgrades 
      // Engine: stock -> 0, anything else -> 1
      const eIdx = rec.engine === 'stock' ? 0 : 1;
      // Tires: street -> 0, sport -> 1, racing -> max
      let tIdx = 0;
      if (rec.tires === 'sport') tIdx = 1;
      if (rec.tires === 'racing') tIdx = 2;
      // Aero: stock -> 0, high_downforce/low_drag -> 1
      const aIdx = rec.aero === 'stock' ? 0 : 1;

      // Ensure boundaries
      const finalE = Math.min(eIdx, currentCar.engines.length - 1);
      const finalT = Math.min(tIdx, currentCar.wheels.length - 1);
      const finalA = Math.min(aIdx, currentCar.aero.length - 1);

      setSelectedEngine(currentCar.engines[finalE].id);
      setSelectedWheels(currentCar.wheels[finalT].id);
      setSelectedAero(currentCar.aero[finalA].id);

      setMessage(`Loadout secured! Deployed: ${rec.engine} powertrain, ${rec.tires} slicks, and ${rec.aero} bodywork.`);
    } else {
      setMessage('Comm link failed. Please verify your connection or try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="flex items-start gap-4 p-5 bg-gold-500/10 border border-gold-500/20 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Bot size={64} />
        </div>
        <div className="w-10 h-10 shrink-0 bg-gold-500/20 rounded-full flex items-center justify-center border border-gold-500/30">
           <Sparkles size={18} className="text-gold-500" />
        </div>
        <p className="text-sm font-light text-white tracking-wide leading-relaxed">
          {message}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="E.g., I want to dominate the Nürburgring..."
          className="w-full h-24 bg-white/5 border border-white/10 hover:border-white/20 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 rounded-xl p-4 text-sm text-white placeholder-white/30 resize-none transition-all outline-none"
        />
        
        <button
          onClick={handleConsult}
          disabled={loading || !goal.trim()}
          className="w-full bg-white text-black font-bold tracking-widest uppercase text-xs py-4 rounded-xl hover:bg-gold-500 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : 'Process Configuration'}
        </button>
      </div>
    </div>
  );
};

