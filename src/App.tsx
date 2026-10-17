import React, { useState, useEffect } from 'react';
import type { HardwareDataset, HardwareItem } from './types/hardware';
import { storageService } from './services/storage';
import { soundService } from './services/sound';
import { Navbar } from './components/Navbar';
import { Hardware3DViewer } from './components/Hardware3DViewer';
import { HardwareInfoPanel } from './components/HardwareInfoPanel';
import { HardwareSelector } from './components/HardwareSelector';
import { CompareModal } from './components/CompareModal';
import { QuizModal } from './components/QuizModal';
import { AdminModal } from './components/AdminModal';
import { AssemblySimulator } from './components/AssemblySimulator';

import { Box, FileText } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Dataset State (Loaded from localStorage or defaults)
  const [dataset, setDataset] = useState<HardwareDataset>(() => storageService.loadData());

  // 2. Currently selected Hardware
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>('cpu');

  // 3. UI Navigation Modes
  const [activeMode, setActiveMode] = useState<'inspect' | 'compare' | 'quiz' | 'admin' | 'assembly'>('inspect');

  // 4. Large font toggle (smartboard readability)
  const [isLargeFont, setIsLargeFont] = useState(false);

  // 5. Mobile Screen View Mode ('3d' or 'info' on mobile devices)
  const [mobileTab, setMobileTab] = useState<'3d' | 'info'>('3d');

  // 6. Right Side Info Panel Visibility (Desktop / Smartboard & Fullscreen toggle)
  const [isInfoPanelVisible, setIsInfoPanelVisible] = useState(true);

  // Auto-hide right info panel when entering fullscreen so 3D model takes full screen
  useEffect(() => {
    const handleFsChange = () => {
      if (document.fullscreenElement) {
        setIsInfoPanelVisible(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Safe fallback if selected ID was deleted in admin
  const activeHardware: HardwareItem =
    dataset.hardware.find(h => h.id === selectedHardwareId) ||
    dataset.hardware[0];

  // 3D PC Montaj Atölyesi Mode
  if (activeMode === 'assembly') {
    return (
      <div className={`w-screen h-screen flex flex-col bg-lab-950 text-slate-100 overflow-hidden font-sans ${isLargeFont ? 'text-lg' : 'text-base'}`}>
        <AssemblySimulator
          onBackToLab={() => setActiveMode('inspect')}
          isLargeFont={isLargeFont}
        />
      </div>
    );
  }

  return (
    <div className={`w-screen h-screen flex flex-col bg-lab-950 text-slate-100 overflow-hidden font-sans ${isLargeFont ? 'text-lg' : 'text-base'}`}>
      {/* Top Navbar */}
      <Navbar
        activeMode={activeMode}
        onSelectMode={(mode) => setActiveMode(mode)}
        isLargeFont={isLargeFont}
        onToggleLargeFont={() => setIsLargeFont(!isLargeFont)}
      />

      {/* Mobile Screen View Switcher (Visible only on mobile / small screens) */}
      <div className="lg:hidden flex items-center justify-between px-3 py-1.5 bg-lab-950/95 border-b border-zinc-800/80 z-20">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold truncate">
          <span className="text-white font-bold">{activeHardware.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-lab-850 text-zinc-300 border border-zinc-700/60">
            {activeHardware.category}
          </span>
        </div>

        <div className="flex items-center p-0.5 rounded-xl bg-lab-900 border border-zinc-800 flex-shrink-0">
          <button
            onClick={() => setMobileTab('3d')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              mobileTab === '3d'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Model</span>
          </button>
          <button
            onClick={() => {
              setIsInfoPanelVisible(true);
              setMobileTab('info');
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              mobileTab === 'info'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bilgi Kartı</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (On Mobile: Clean Switcher; On Desktop & Smartboard: Full Side-by-Side or Collapsible 3D) */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-hidden">
        {/* 3D Hardware Explorer */}
        <div className={`flex-1 h-full relative min-h-0 ${mobileTab === '3d' ? 'flex' : (isInfoPanelVisible ? 'hidden lg:flex' : 'flex')}`}>
          <Hardware3DViewer
            hardware={activeHardware}
          />
          {/* Floating button to open Info Panel ("Bilgileri Aç") */}
          {(!isInfoPanelVisible || mobileTab === '3d') && (
            <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-20 pointer-events-auto ${!isInfoPanelVisible ? 'flex' : 'flex lg:hidden'}`}>
              <button
                onClick={() => {
                  soundService.playClick();
                  setIsInfoPanelVisible(true);
                  setMobileTab('info');
                }}
                className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-lab-900/90 hover:bg-lab-800/95 backdrop-blur-xl border border-zinc-700/80 hover:border-amber-400/60 text-xs sm:text-sm font-bold text-zinc-100 shadow-2xl active:scale-95 transition-all group"
                title="Donanım Bilgi Panelini Aç"
              >
                <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Bilgileri Aç</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Info Panel */}
        {isInfoPanelVisible && (
          <div className={`w-full lg:w-[420px] xl:w-[460px] 2xl:w-[500px] 3xl:w-[580px] 4k:w-[680px] h-full flex-shrink-0 z-10 ${mobileTab === 'info' ? 'flex' : 'hidden lg:flex'}`}>
            <HardwareInfoPanel
              hardware={activeHardware}
              onOpenQuiz={() => setActiveMode('quiz')}
              isLargeFont={isLargeFont}
              onClose={() => {
                setIsInfoPanelVisible(false);
                setMobileTab('3d');
              }}
            />
          </div>
        )}
      </main>

      {/* Bottom Area: Hardware Selector Carousel & Category Tabs */}
      <footer className="flex-shrink-0">
        <HardwareSelector
          hardwareList={dataset.hardware}
          categories={dataset.categories}
          selectedId={activeHardware.id}
          onSelect={(item) => setSelectedHardwareId(item.id)}
        />
      </footer>

      {/* Modals */}
      {activeMode === 'compare' && (
        <CompareModal
          hardwareList={dataset.hardware}
          defaultHardwareId={activeHardware.id}
          onClose={() => setActiveMode('inspect')}
        />
      )}

      {activeMode === 'quiz' && (
        <QuizModal
          hardware={activeHardware}
          onClose={() => setActiveMode('inspect')}
        />
      )}

      {activeMode === 'admin' && (
        <AdminModal
          dataset={dataset}
          onUpdateDataset={(newDataset) => setDataset(newDataset)}
          onClose={() => setActiveMode('inspect')}
        />
      )}
    </div>
  );
};

export default App;
