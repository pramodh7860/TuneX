import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cars } from './data/cars';

export const useCarStore = create(
  persist(
    (set, get) => ({
      // --- THREE.JS REFERENCES (DO NOT PERSIST) ---
      meshes: {},
      wheelMeshes: {},
      wheelGroups: {},
      bodyMeshes: {},
      interiorMeshes: {},
      aeroMeshes: {},
      setMeshes: (meshes) => set({ meshes }),
      setWheelMeshes: (wheelMeshes) => set({ wheelMeshes }),
      setWheelGroups: (wheelGroups) => set({ wheelGroups }),
      setBodyMeshes: (bodyMeshes) => set({ bodyMeshes }),
      setInteriorMeshes: (interiorMeshes) => set({ interiorMeshes }),
      setAeroMeshes: (aeroMeshes) => set({ aeroMeshes }),

      // --- VISUAL UI STATE ---
      isWheelRotating: false,
      setIsWheelRotating: (val) => set({ isWheelRotating: val }),
      wheelColor: '#e5e7eb', // Default alloy color
      setWheelColor: (color) => set({ wheelColor: color }),
      bodyColor: '#111111', // Default Nero Nemesis
      setBodyColor: (color) => set({ bodyColor: color }),
      interiorColor: '#965b32', // Default Cuoio
      setInteriorColor: (color) => set({ interiorColor: color }),
      cameraPreset: null,
      setCameraPreset: (preset) => set({ cameraPreset: preset }),
      
      activeCategory: 'paint', // controls bottom dock and right panel context
      setActiveCategory: (cat) => set({ activeCategory: cat }),

      // --- AUTHENTICATION STATE ---
      user: null,
      showLoginModal: false,
      setUser: (user) => {
        if (user === null) {
          set({
            user: null,
            selectedModel: 'bugatti',
            selectedEngine: 'engine_0',
            engine: 'engine_0',
            selectedWheels: 'wheels_0',
            selectedAero: 'aero_0',
            selectedWeightSetup: 'weight_0',
            bodyColor: '#111111',
            interiorColor: '#965b32',
            wheelColor: '#e5e7eb',
            isWheelRotating: false,
            cameraPreset: null,
            activeCategory: 'paint',
          });
        } else {
          set({ user });
          get().applyCarConfig(user.savedCarConfig || {});
        }
      },
      logout: () => {
        set({
          user: null,
          selectedModel: 'bugatti',
          selectedEngine: 'engine_0',
          engine: 'engine_0',
          selectedWheels: 'wheels_0',
          selectedAero: 'aero_0',
          selectedWeightSetup: 'weight_0',
          bodyColor: '#111111',
          interiorColor: '#965b32',
          wheelColor: '#e5e7eb',
          isWheelRotating: false,
          cameraPreset: null,
          activeCategory: 'paint',
        });
      },
      setShowLoginModal: (show) => set({ showLoginModal: show }),

      applyCarConfig: (config) => {
        if (!config) return;
        set({
          selectedModel: config.selectedModel || 'bugatti',
          selectedEngine: config.selectedEngine || 'engine_0',
          engine: config.selectedEngine || 'engine_0',
          selectedWheels: config.selectedWheels || 'wheels_0',
          selectedAero: config.selectedAero || 'aero_0',
          selectedWeightSetup: config.selectedWeightSetup || 'weight_0',
          bodyColor: config.bodyColor || '#111111',
          interiorColor: config.interiorColor || '#965b32',
          wheelColor: config.wheelColor || '#e5e7eb',
        });
      },

      saveCarConfigToDb: async () => {
        const state = get();
        if (!state.user) return { success: false, error: 'User not signed in' };

        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';
        const config = {
          selectedModel: state.selectedModel,
          selectedEngine: state.selectedEngine,
          selectedWheels: state.selectedWheels,
          selectedAero: state.selectedAero,
          selectedWeightSetup: state.selectedWeightSetup,
          bodyColor: state.bodyColor,
          interiorColor: state.interiorColor,
          wheelColor: state.wheelColor
        };

        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/save-car`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: state.user.email,
              config
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to save configuration');

          // Update local user state
          const updatedUser = {
            ...state.user,
            savedCarConfig: config
          };
          set({ user: updatedUser });
          return { success: true };
        } catch (err) {
          console.error('Save configuration error:', err);
          return { success: false, error: err.message };
        }
      },
      
      selectedModel: 'bugatti', // 'bugatti', 'ferrari', 'porsche', 'mercedes', 'mclaren'
      setSelectedModel: (model) => set({ 
        selectedModel: model,
        selectedEngine: 'engine_0',
        engine: 'engine_0',
        selectedWheels: 'wheels_0',
        selectedAero: 'aero_0',
        selectedWeightSetup: 'weight_0'
      }),

      // --- MODIFICATIONS (PERSISTED) ---
      engine: 'engine_0', // Backward compatibility for UI
      selectedEngine: 'engine_0',
      selectedWheels: 'wheels_0',
      selectedAero: 'aero_0',
      selectedWeightSetup: 'weight_0',

      setEngine: (eng) => set({ engine: eng, selectedEngine: eng }), // Backwards compatibility for ui
      setSelectedEngine: (id) => {
        set({ selectedEngine: id, engine: id });
        try {
          const audio = new Audio('/sounds/rev.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch(e) {}
      },
      setSelectedWheels: (id) => {
         set({ selectedWheels: id, wheelColor: '#e5e7eb' });
      },
      setSelectedAero: (id) => set({ selectedAero: id }),
      setSelectedWeightSetup: (id) => set({ selectedWeightSetup: id }),

      // --- COMPUTED PERFORMANCE STATS ---
      getComputedStats: () => {
        const state = get();
        const car = cars[state.selectedModel] || cars['bugatti'];
        
        const engineMod = car.engines.find(e => e.id === state.selectedEngine) || car.engines[0];
        const wheelMod = car.wheels.find(w => w.id === state.selectedWheels) || car.wheels[0];
        const aeroMod = car.aero.find(a => a.id === state.selectedAero) || car.aero[0];
        const weightMod = car.weight.find(w => w.id === state.selectedWeightSetup) || car.weight[0];

        const effectSum = (stat) => (engineMod.effect[stat] || 0) + (wheelMod.effect[stat] || 0) + (aeroMod.effect[stat] || 0) + (weightMod.effect[stat] || 0);

        const clamp = (val) => Math.min(100, Math.max(0, val));

        const finalVelocity = clamp(car.baseStats.velocity + effectSum('velocity'));
        const finalSprint = clamp(car.baseStats.sprint + effectSum('sprint'));
        const finalThrust = clamp(car.baseStats.thrust + effectSum('thrust'));
        const finalGrip = clamp(car.baseStats.grip + effectSum('grip'));

        // Calculate total configuration score
        const rawScore = (finalVelocity * 0.30) + (finalSprint * 0.25) + (finalThrust * 0.25) + (finalGrip * 0.20);
        const totalConfigScore = Math.round(rawScore);

        // Calculate total cost
        const totalCost = (engineMod.price || 0) + (wheelMod.price || 0) + (aeroMod.price || 0) + (weightMod.price || 0);

        // Convert directly to UI-friendly values based on clamped 0-100 logic
        return {
          topSpeedValue: finalVelocity,
          zeroToSixtyValue: finalSprint,
          accelerationValue: finalThrust,
          gripValue: finalGrip,
          
          topSpeedPercent: finalVelocity,
          zeroToSixtyPercent: finalSprint, 
          accelerationPercent: finalThrust,
          gripPercent: finalGrip,
          
          totalScore: totalConfigScore,
          priceValue: totalCost,
          price: `$${totalCost.toLocaleString()}`
        };
      }
    }),
    {
      name: 'car-tuning-storage', // key in local storage
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        selectedEngine: state.selectedEngine,
        engine: state.engine,
        selectedWheels: state.selectedWheels,
        selectedAero: state.selectedAero,
        selectedWeightSetup: state.selectedWeightSetup,
        bodyColor: state.bodyColor,
        interiorColor: state.interiorColor,
        wheelColor: state.wheelColor,
        cameraPreset: state.cameraPreset,
        user: state.user
      }),
    }
  )
);
