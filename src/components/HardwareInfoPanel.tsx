import React, { useState, useEffect } from 'react';
import type { HardwareItem } from '../types/hardware';
import { speechService } from '../services/speech';
import { soundService } from '../services/sound';
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

  return (
    <div className="w-full h-full flex flex-col bg-lab-900/90 backdrop-blur-xl border-l border-slate-800/80 p-6 overflow-y-auto custom-scrollbar select-none text-left">
      {/* Header: Name, Category badge, Listen button */}
      <div className="flex items-start justify-between gap-3 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {hardware.category}
            </span>
          </div>
          <h2 className={`${isLargeFont ? 'text-3xl lg:text-4xl' : 'text-2xl lg:text-3xl'} font-black text-white tracking-tight leading-tight`}>
            {hardware.name}
          </h2>
        </div>

        {/* Listen (Sesli Anlatım) Button */}
        <button
          onClick={handleToggleSpeech}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition shadow-lg min-h-[48px] ${
            isSpeaking
              ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 animate-pulse'
              : 'bg-lab-800 hover:bg-sky-500/20 text-sky-400 border border-sky-500/40 active:scale-95'
          }`}
          title="Donanım açıklamasını sesli dinle"
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-5 h-5 text-slate-950" />
              <span className="text-xs tracking-wider">DURDUR</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5 text-sky-400" />
              <span className="text-xs tracking-wider">DİNLE</span>
            </>
          )}
        </button>
      </div>

      {/* 1 Sentence Educational Summary Highlight Box */}
      <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 to-purple-950/60 border border-sky-500/40 shadow-card-glow">
        <div className="flex items-center gap-2 mb-1.5 text-sky-300 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>1 Cümlede Özet</span>
        </div>
        <p className={`${isLargeFont ? 'text-base lg:text-lg' : 'text-sm lg:text-base'} font-medium text-slate-100 leading-relaxed`}>
          "{hardware.summary || hardware.shortDescription}"
        </p>
      </div>

      {/* Structured Content Cards */}
      <div className="flex-1 space-y-4">
        {/* Görevi (Function) */}
        <div className="p-4 rounded-2xl bg-lab-800/60 border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>Görevi</span>
          </div>
          <p className={`${isLargeFont ? 'text-base' : 'text-sm'} text-slate-200 leading-relaxed font-normal`}>
            {hardware.function || hardware.shortDescription}
          </p>
        </div>

        {/* Nerede Bulunur? (Location) */}
        <div className="p-4 rounded-2xl bg-lab-800/60 border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Nerede Bulunur?</span>
          </div>
          <p className={`${isLargeFont ? 'text-base' : 'text-sm'} text-slate-200 leading-relaxed font-normal`}>
            {hardware.location || 'Bilgisayar sistemi içerisinde yer alır.'}
          </p>
        </div>

        {/* Önemli Bilgiler (Important Info) */}
        {hardware.importantInfo && (
          <div className="p-4 rounded-2xl bg-lab-800/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Önemli Bilgi</span>
            </div>
            <p className={`${isLargeFont ? 'text-base' : 'text-sm'} text-slate-200 leading-relaxed font-normal`}>
              {hardware.importantInfo}
            </p>
          </div>
        )}
      </div>

      {/* Action Button for Interactive Quiz Mode */}
      <div className="pt-5 mt-4 border-t border-slate-800/80">
        <button
          onClick={() => {
            soundService.playClick();
            onOpenQuiz();
          }}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-slate-950 font-bold text-base tracking-wide shadow-neon transition active:scale-95 min-h-[50px]"
        >
          <HelpCircle className="w-5 h-5 text-slate-950" />
          <span>Hazır Mısın? (3 Soru)</span>
        </button>
      </div>
    </div>
  );
};
