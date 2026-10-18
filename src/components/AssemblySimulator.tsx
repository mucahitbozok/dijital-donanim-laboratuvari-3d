import React, { useEffect } from 'react';

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
