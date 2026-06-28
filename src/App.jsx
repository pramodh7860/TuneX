import React from 'react';
import CanvasContainer from './components/CanvasContainer';
import TopNav from './components/UI/TopNav';
import BottomDock from './components/UI/BottomDock';
import ContextPanel from './components/UI/ContextPanel';
import Sidebar from './components/UI/Sidebar';
import PriceDisplay from './components/UI/PriceDisplay';
import LoginPage from './components/UI/LoginPage';

function App() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-black via-[#050505] to-[#0a0a0a]">
        <CanvasContainer />
      </div>

      {/* UI Layer */}
      <div className="relative z-10 w-full h-full pointer-events-none flex">
        <TopNav />
        <Sidebar />
        <ContextPanel />
        <BottomDock />
        <PriceDisplay />
      </div>

      {/* Auth Screen Overlay */}
      <LoginPage />
    </div>
  );
}

export default App;

