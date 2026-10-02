import React, { useState, useEffect } from 'react';
import type { HardwareItem } from '../types/hardware';
import { speechService } from '../services/speech';
import { soundService } from '../services/sound';
import { getCategoryTheme } from '../utils/theme';
import { defaultCategoryDescriptions } from '../data/defaultHardware';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Sparkles,
  MapPin,
  Cpu,
  AlertCircle
} from 'lucide-react';

interface Props {
  hardware: HardwareItem;
  onOpenQuiz: () => void;
  isLargeFont?: boolean;
}

export const HardwareInfoPanel: React.FC<Props> = ({
  hardware,
  onOpenQuiz,
  isLargeFont = false
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop speech if hardware changes
  useEffect(() => {
    speechService.stop();
    setIsSpeaking(false);
  }, [hardware.id]);

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      soundService.playClick();
      // Read out: Name, Görevi, and 1-sentence summary
      const textToRead = `${hardware.name}. Kategorisi: ${hardware.category}. Görevi: ${hardware.function}. Kısaca özetlemek gerekirse: ${hardware.summary}`;
      const started = speechService.speak(
        textToRead,
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );
      if (started) {
        setIsSpeaking(true);
      }
    }
  };

  const theme = getCategoryTheme(hardware.category);

  return (
    <div className="w-full h-full flex flex-col bg-lab-900/95 backdrop-blur-xl border-l border-zinc-800/80 p-6 overflow-y-auto custom-scrollbar select-none text-left">
      {/* Header: Name, Category badge, Listen button */}
      <div className="flex items-start justify-between gap-3 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.textColor} border ${theme.badgeBorder}`}>
              {hardware.category}
            </span>
          </div>
          <h2 className={`${isLargeFont ? 'text-3xl lg:text-4xl' : 'text-2xl lg:text-3xl'} font-black text-white tracking-tight leading-tight`}>
            {hardware.name}
          </h2>
          {defaultCategoryDescriptions[hardware.category] && (
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed line-clamp-2" title={defaultCategoryDescriptions[hardware.category]}>
              {defaultCategoryDescriptions[hardware.category]}
            </p>
          )}
        </div>

        {/* Listen (Sesli Anlatım) Button */}
        <button
          onClick={handleToggleSpeech}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition shadow-lg min-h-[48px] ${
            isSpeaking
              ? 'bg-amber-400 text-zinc-950 ring-4 ring-amber-400/30 animate-pulse font-black'
              : 'bg-lab-850 hover:bg-lab-800 text-zinc-200 border border-zinc-700/80 hover:border-zinc-500 active:scale-95'
          }`}
          title="Donanım açıklamasını sesli dinle"
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-5 h-5 text-zinc-950" />
              <span className="text-xs tracking-wider">DURDUR</span>
            </>
          ) : (
            <>
              <Volume2 className={`w-5 h-5 ${theme.textColor}`} />
              <span className="text-xs tracking-wider font-semibold">DİNLE</span>
            </>
          )}
        </button>
      </div>

      {/* 1 Sentence Educational Summary Highlight Box */}
      <div
        style={{ borderLeftColor: theme.hex }}
        className="my-5 p-4 rounded-2xl bg-lab-850/80 border-l-4 border-y border-r border-zinc-800/90 shadow-card-glow"
      >
        <div className={`flex items-center gap-2 mb-1.5 ${theme.textColor} font-bold text-xs uppercase tracking-wider`}>
          <Sparkles className="w-4 h-4" />
          <span>1 Cümlede Özet</span>
        </div>
        <p className={`${isLargeFont ? 'text-base lg:text-lg' : 'text-sm lg:text-base'} font-medium text-zinc-100 leading-relaxed`}>
          "{hardware.summary || hardware.shortDescription}"
        </p>
      </div>

      {/* Structured Content Cards */}
      <div className="flex-1 space-y-4">
        {/* Görevi (Function) */}
        <div className="p-4 rounded-2xl bg-lab-850/60 border border-zinc-800/80">
          <div className="flex items-center gap-2 mb-1.5 text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className={`w-4 h-4 ${theme.textColor}`} />
            <span>Görevi</span>
          </div>
          <p className={`${isLargeFont ? 'text-base' : 'text-sm'} text-zinc-200 leading-relaxed font-normal`}>
            {hardware.function || hardware.shortDescription}
          </p>
        </div>

        {/* Nerede Bulunur? (Location) */}
        <div className="p-4 rounded-2xl bg-lab-850/60 border border-zinc-800/80">
          <div className="flex items-center gap-2 mb-1.5 text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Nerede Bulunur?</span>
          </div>
          <p className={`${isLargeFont ? 'text-base' : 'text-sm'} text-zinc-200 leading-relaxed font-normal`}>
            {hardware.location || 'Bilgisayar sistemi içerisinde yer alır.'}
          </p>
        </div>

        {/* Önemli Bilgiler (Important Info) */}
        {hardware.importantInfo && (
          <div className="p-4 rounded-2xl bg-lab-850/60 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Önemli Bilgi</span>
            </div>
            <p className={`${isLargeFont ? 'text-base' : 'text-sm'} text-zinc-200 leading-relaxed font-normal`}>
              {hardware.importantInfo}
            </p>
          </div>
        )}
      </div>

      {/* Action Button for Interactive Quiz Mode */}
      <div className="pt-5 mt-4 border-t border-zinc-800/80">
        <button
          onClick={() => {
            soundService.playClick();
            onOpenQuiz();
          }}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-base tracking-wide shadow-[0_0_25px_rgba(124,58,237,0.35)] transition active:scale-95 min-h-[50px]"
        >
          <HelpCircle className="w-5 h-5 text-white" />
          <span>Hazır Mısın? (3 Soru)</span>
        </button>
      </div>
    </div>
  );
};
