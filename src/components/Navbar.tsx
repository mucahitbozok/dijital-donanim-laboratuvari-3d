import React, { useState } from 'react';
import { soundService } from '../services/sound';
import {
  Cpu,
  GitCompare,
  HelpCircle,
  Settings,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Type
} from 'lucide-react';

interface Props {
  activeMode: 'inspect' | 'compare' | 'quiz' | 'admin';
  onSelectMode: (mode: 'inspect' | 'compare' | 'quiz' | 'admin') => void;
  isLargeFont: boolean;
  onToggleLargeFont: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeMode,
  onSelectMode,
  isLargeFont,
  onToggleLargeFont
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);

  const toggleFullscreen = () => {
    soundService.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const toggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    soundService.setSoundEnabled(next);
    if (next) soundService.playClick();
  };

  return (
    <header className="w-full bg-lab-950/95 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-4 backdrop-blur-xl z-30 select-none">
      {/* Brand & App Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center text-slate-950 shadow-neon">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-widest text-sky-400 uppercase bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-400/20">
              ÖĞRETMEN BOZOK
            </span>
          </div>
          <h1 className="text-base lg:text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>DİJİTAL DONANIM LABORATUVARI</span>
            <span className="hidden sm:inline-block text-xs font-bold text-slate-400 px-2 py-0.5 rounded-full bg-lab-800 border border-slate-700/60">
              3D
            </span>
          </h1>
        </div>
      </div>

      {/* Center Navigation Modes (Touch-friendly buttons) */}
      <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-lab-900/90 border border-slate-800/80">
        <button
          onClick={() => {
            soundService.playClick();
            onSelectMode('inspect');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition min-h-[44px] ${
            activeMode === 'inspect'
              ? 'bg-sky-500 text-slate-950 shadow-neon'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span className="hidden md:inline">İncele</span>
        </button>

        <button
          onClick={() => {
            soundService.playClick();
            onSelectMode('compare');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition min-h-[44px] ${
            activeMode === 'compare'
              ? 'bg-sky-500 text-slate-950 shadow-neon'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span className="hidden md:inline">Karşılaştır</span>
        </button>

        <button
          onClick={() => {
            soundService.playClick();
            onSelectMode('quiz');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition min-h-[44px] ${
            activeMode === 'quiz'
              ? 'bg-sky-500 text-slate-950 shadow-neon'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden md:inline">Hazır Mısın?</span>
        </button>
      </nav>

      {/* Right Controls: Font Scale, Sound, Fullscreen, Admin */}
      <div className="flex items-center gap-1.5">
        {/* Large font toggle for smartboard */}
        <button
          onClick={() => {
            soundService.playClick();
            onToggleLargeFont();
          }}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
            isLargeFont
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
              : 'text-slate-300 hover:bg-slate-800/80'
          }`}
          title={isLargeFont ? 'Normal Yazı Boyutuna Dön' : 'Sınıf Ekranı / Büyük Yazı Modu'}
        >
          <Type className="w-5 h-5" />
        </button>

        {/* Audio Toggle */}
        <button
          onClick={toggleSound}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
            isSoundOn
              ? 'text-sky-400 hover:bg-slate-800/80'
              : 'text-slate-500 hover:bg-slate-800/80'
          }`}
          title={isSoundOn ? 'Ses Efektlerini Kapat' : 'Ses Efektlerini Aç'}
        >
          {isSoundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
          title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Modu (Akıllı Tahta)'}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        {/* Teacher Admin Panel Trigger */}
        <button
          onClick={() => {
            soundService.playClick();
            onSelectMode('admin');
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition min-h-[44px] ${
            activeMode === 'admin'
              ? 'bg-purple-600 text-white shadow-neon-purple'
              : 'bg-lab-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/50'
          }`}
          title="Öğretmen Yönetim Paneli"
        >
          <Settings className="w-4 h-4 text-purple-400" />
          <span className="hidden lg:inline">Öğretmen Paneli</span>
        </button>
      </div>
    </header>
  );
};
