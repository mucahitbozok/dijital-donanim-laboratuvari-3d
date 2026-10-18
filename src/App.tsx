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

import { Box, FileText, Wrench } from 'lucide-react';

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

  // 6. Right Side Info Panel Visibility (Desktop / Smartboard & Fullscreen toggle - starts closed)
  const [isInfoPanelVisible, setIsInfoPanelVisible] = useState(false);

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
      <div className={`w-screen h-[100dvh] flex flex-col bg-lab-950 text-slate-100 overflow-hidden font-sans ${isLargeFont ? 'text-lg' : 'text-base'}`}>
        <AssemblySimulator
          onBackToLab={() => setActiveMode('inspect')}
          isLargeFont={isLargeFont}
        />
      </div>
    );
  }

  return (
    <div className={`w-screen h-[100dvh] flex flex-col bg-lab-950 text-slate-100 overflow-hidden font-sans ${isLargeFont ? 'text-lg' : 'text-base'}`}>
      {/* Top Navbar */}
      <Navbar
        activeMode={activeMode}
        onSelectMode={(mode) => setActiveMode(mode)}
        isLargeFont={isLargeFont}
        onToggleLargeFont={() => setIsLargeFont(!isLargeFont)}
        isInfoPanelVisible={isInfoPanelVisible}
        onToggleInfoPanel={() => {
          setIsInfoPanelVisible(prev => {
            const next = !prev;
            setMobileTab(next ? 'info' : '3d');
            return next;
          });
        }}
      />

      {/* Mobile Screen View Switcher & Quick Navigation Bar */}
      <div className="md:hidden flex items-center justify-between px-2.5 py-1.5 bg-lab-950/95 border-b border-zinc-800/80 z-20 gap-2">
        {/* Prominent Anakartı Tamamla Mobile Shortcut */}
        <button
          onClick={() => {
            soundService.playClick();
            setActiveMode('assembly');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition border shadow-sm flex-shrink-0 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 active:scale-95"
          title="Anakartı Tamamla! 3D Simülasyonu"
        >
          <Wrench className="w-3.5 h-3.5 text-emerald-400" />
          <span>Anakartı Tamamla!</span>
        </button>

        <div className="flex items-center p-0.5 rounded-xl bg-lab-900 border border-zinc-800 flex-shrink-0">
          <button
            onClick={() => {
              setMobileTab('3d');
              setIsInfoPanelVisible(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              !isInfoPanelVisible || mobileTab === '3d'
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              isInfoPanelVisible && mobileTab === 'info'
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
      <main className="flex-1 flex flex-col md:flex-row min-h-0 min-w-0 relative overflow-hidden">
        {/* 3D Hardware Explorer */}
        <div className={`flex-1 h-full relative min-h-0 min-w-0 overflow-hidden ${!isInfoPanelVisible ? 'flex w-full' : (mobileTab === '3d' ? 'flex' : 'hidden md:flex')}`}>
          <Hardware3DViewer
            hardware={activeHardware}
          />

          {/* Floating button on 3D view: ALWAYS visible when info panel is closed */}
          {!isInfoPanelVisible && (
            <div className="absolute top-4 right-4 z-30 pointer-events-auto animate-fade-in">
              <button
                onClick={() => {
                  soundService.playClick();
                  setIsInfoPanelVisible(true);
                  setMobileTab('info');
                }}
                className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-zinc-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all border border-amber-300/80 cursor-pointer"
                title="Donanım Bilgi Panelini Aç"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950" />
                <span>Bilgileri Aç</span>
              </button>
            </div>
          )}

          {/* On mobile: if mobileTab === '3d' but infoPanel is open in background, quick button to switch */}
          {isInfoPanelVisible && mobileTab === '3d' && (
            <div className="md:hidden absolute top-3 right-3 z-30 pointer-events-auto animate-fade-in">
              <button
                onClick={() => {
                  soundService.playClick();
                  setMobileTab('info');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-zinc-950 font-bold text-xs shadow-xl active:scale-95"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-950" />
                <span>Bilgileri Aç</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Info Panel */}
        {isInfoPanelVisible && (
          <aside className={`w-full md:w-[400px] lg:w-[450px] xl:w-[480px] 2xl:w-[520px] 3xl:w-[600px] 4k:w-[700px] h-full flex-shrink-0 z-20 min-w-0 flex flex-col animate-fade-in ${mobileTab === 'info' ? 'flex' : 'hidden md:flex'}`}>
            <HardwareInfoPanel
              hardware={activeHardware}
              onOpenQuiz={() => setActiveMode('quiz')}
              isLargeFont={isLargeFont}
              onClose={() => {
                setIsInfoPanelVisible(false);
                setMobileTab('3d');
              }}
            />
          </aside>
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
