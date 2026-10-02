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
    <header className="w-full bg-lab-950/95 border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between gap-4 backdrop-blur-xl z-30 select-none">
      {/* Brand & App Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 3xl:w-12 3xl:h-12 4k:w-14 4k:h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.35)]">
          <Cpu className="w-6 h-6 3xl:w-7 3xl:h-7 4k:w-8 4k:h-8 text-white" />
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className="text-[10px] 3xl:text-xs 4k:text-sm font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25">
              ÖĞRETMEN BOZOK
            </span>
          </div>
          <h1 className="text-base lg:text-lg 3xl:text-xl 4k:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>DİJİTAL DONANIM LABORATUVARI</span>
            <span className="hidden sm:inline-block text-xs 3xl:text-sm font-bold text-zinc-400 px-2 py-0.5 rounded-full bg-lab-850 border border-zinc-700/70">
              3D
            </span>
          </h1>
        </div>
      </div>

      {/* Center Navigation Modes (Touch-friendly buttons) */}
      <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-lab-900/90 border border-zinc-800/80">
        <button
          onClick={() => {
            soundService.playClick();
            onSelectMode('inspect');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 3xl:px-5 3xl:py-2.5 4k:px-6 4k:py-3 rounded-xl 3xl:rounded-2xl text-xs 3xl:text-sm 4k:text-base font-bold transition min-h-[44px] 3xl:min-h-[50px] 4k:min-h-[58px] ${
            activeMode === 'inspect'
              ? 'bg-white text-zinc-950 font-black shadow-[0_0_15px_rgba(255,255,255,0.25)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
          }`}
        >
          <Cpu className="w-4 h-4 3xl:w-5 3xl:h-5" />
          <span className="hidden md:inline">İncele</span>
        </button>

        <button
          onClick={() => {
            soundService.playClick();
            onSelectMode('compare');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 3xl:px-5 3xl:py-2.5 4k:px-6 4k:py-3 rounded-xl 3xl:rounded-2xl text-xs 3xl:text-sm 4k:text-base font-bold transition min-h-[44px] 3xl:min-h-[50px] 4k:min-h-[58px] ${
            activeMode === 'compare'
              ? 'bg-amber-400 text-zinc-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
          }`}
        >
          <GitCompare className="w-4 h-4 3xl:w-5 3xl:h-5" />
          <span className="hidden md:inline">Karşılaştır</span>
        </button>

        <button
          onClick={() => {
            soundService.playClick();
            onSelectMode('quiz');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 3xl:px-5 3xl:py-2.5 4k:px-6 4k:py-3 rounded-xl 3xl:rounded-2xl text-xs 3xl:text-sm 4k:text-base font-bold transition min-h-[44px] 3xl:min-h-[50px] 4k:min-h-[58px] ${
            activeMode === 'quiz'
              ? 'bg-purple-500 text-white font-black shadow-[0_0_15px_rgba(168,85,247,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
          }`}
        >
          <HelpCircle className="w-4 h-4 3xl:w-5 3xl:h-5" />
          <span className="hidden md:inline">Hazır Mısın?</span>
        </button>
      </nav>

      {/* Right Controls: Font Scale, Sound, Fullscreen, Admin */}
      <div className="flex items-center gap-1.5 3xl:gap-2">
        {/* Large font toggle for smartboard */}
        <button
          onClick={() => {
            soundService.playClick();
            onToggleLargeFont();
          }}
          className={`w-11 h-11 3xl:w-13 3xl:h-13 4k:w-15 4k:h-15 rounded-xl 3xl:rounded-2xl flex items-center justify-center transition ${
            isLargeFont
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
          }`}
          title={isLargeFont ? 'Normal Yazı Boyutuna Dön' : 'Sınıf Ekranı / Büyük Yazı Modu'}
        >
          <Type className="w-5 h-5 3xl:w-6 3xl:h-6" />
        </button>

        {/* Audio Toggle */}
        <button
          onClick={toggleSound}
          className={`w-11 h-11 3xl:w-13 3xl:h-13 4k:w-15 4k:h-15 rounded-xl 3xl:rounded-2xl flex items-center justify-center transition ${
            isSoundOn
              ? 'text-zinc-200 hover:bg-zinc-800/80'
              : 'text-zinc-600 hover:bg-zinc-800/80'
          }`}
          title={isSoundOn ? 'Ses Efektlerini Kapat' : 'Ses Efektlerini Aç'}
        >
          {isSoundOn ? <Volume2 className="w-5 h-5 3xl:w-6 3xl:h-6" /> : <VolumeX className="w-5 h-5 3xl:w-6 3xl:h-6" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="w-11 h-11 3xl:w-13 3xl:h-13 4k:w-15 4k:h-15 rounded-xl 3xl:rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
          title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Modu (Akıllı Tahta)'}
        >
          {isFullscreen ? <Minimize className="w-5 h-5 3xl:w-6 3xl:h-6" /> : <Maximize className="w-5 h-5 3xl:w-6 3xl:h-6" />}
        </button>

        {/* Teacher Admin Panel Trigger */}
        <button
          onClick={() => {
            soundService.playClick();
            onSelectMode('admin');
          }}
          className={`flex items-center gap-1.5 px-3 py-2 3xl:px-4 3xl:py-2.5 4k:px-5 4k:py-3 rounded-xl 3xl:rounded-2xl text-xs 3xl:text-sm 4k:text-base font-bold transition min-h-[44px] 3xl:min-h-[50px] 4k:min-h-[58px] ${
            activeMode === 'admin'
              ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
              : 'bg-lab-850 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/60'
          }`}
          title="Öğretmen Yönetim Paneli"
        >
          <Settings className="w-4 h-4 3xl:w-5 3xl:h-5 text-purple-400" />
          <span className="hidden lg:inline">Öğretmen Paneli</span>
        </button>
      </div>
    </header>
  );
};
