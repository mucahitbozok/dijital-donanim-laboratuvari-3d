import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onBackToLab: () => void;
  isLargeFont?: boolean;
}

export const AssemblySimulator: React.FC<Props> = ({ onBackToLab }) => {
  // Listen for message from embedded Anakartı Tamamla simulation
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data === 'back-to-lab') {
        onBackToLab();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onBackToLab]);

  return (
    <div className="w-full h-full relative bg-[#dff3ee] overflow-hidden select-none">
      {/* Floating Return Button */}
      <div className="absolute top-2.5 right-3.5 z-50 pointer-events-auto">
        <button
          onClick={onBackToLab}
          className="px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-[#12332c] font-bold text-xs sm:text-sm border-2 border-[#b7ddd2] shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          title="Dijital Donanım Laboratuvarı'na Geri Dön"
        >
          <ArrowLeft className="w-4 h-4 text-[#1f9d55]" />
          <span>Laboratuvara Dön</span>
        </button>
      </div>

      {/* Embedded Anakartı Tamamla! Simulation */}
      <iframe
        src="/anakarti-tamamla.html"
        title="Anakartı Tamamla!"
        className="w-full h-full border-0 block"
        allow="fullscreen"
      />
    </div>
  );
};

export default AssemblySimulator;
