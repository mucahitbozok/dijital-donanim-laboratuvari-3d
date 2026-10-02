import React, { useState } from 'react';
import type { HardwareDataset, HardwareItem } from './types/hardware';
import { storageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { Hardware3DViewer } from './components/Hardware3DViewer';
import { HardwareInfoPanel } from './components/HardwareInfoPanel';
import { HardwareSelector } from './components/HardwareSelector';
import { CompareModal } from './components/CompareModal';
import { QuizModal } from './components/QuizModal';
import { AdminModal } from './components/AdminModal';

export const App: React.FC = () => {
  // 1. Dataset State (Loaded from localStorage or defaults)
  const [dataset, setDataset] = useState<HardwareDataset>(() => storageService.loadData());

  // 2. Currently selected Hardware
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>('cpu');

  // 3. UI Navigation Modes
  const [activeMode, setActiveMode] = useState<'inspect' | 'compare' | 'quiz' | 'admin'>('inspect');

  // 4. Large font toggle (smartboard readability)
  const [isLargeFont, setIsLargeFont] = useState(false);

  // Safe fallback if selected ID was deleted in admin
  const activeHardware: HardwareItem =
    dataset.hardware.find(h => h.id === selectedHardwareId) ||
    dataset.hardware[0];

  return (
    <div className={`w-screen h-screen flex flex-col bg-lab-950 text-slate-100 overflow-hidden font-sans ${isLargeFont ? 'text-lg' : 'text-base'}`}>
      {/* Top Navbar */}
      <Navbar
        activeMode={activeMode}
        onSelectMode={(mode) => setActiveMode(mode)}
        isLargeFont={isLargeFont}
        onToggleLargeFont={() => setIsLargeFont(!isLargeFont)}
      />

      {/* Main Workspace (Split into 3D Viewer on Left/Center, Info Panel on Right) */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-hidden">
        {/* Left/Center Area: 3D Hardware Explorer */}
        <div className="flex-1 h-3/5 lg:h-full relative min-h-0">
          <Hardware3DViewer
            hardware={activeHardware}
          />
        </div>

        {/* Right Area: Dynamic Info Panel */}
        <div className="w-full lg:w-[420px] xl:w-[460px] 2xl:w-[500px] 3xl:w-[580px] 4k:w-[680px] h-2/5 lg:h-full flex-shrink-0 z-10">
          <HardwareInfoPanel
            hardware={activeHardware}
            onOpenQuiz={() => setActiveMode('quiz')}
            isLargeFont={isLargeFont}
          />
        </div>
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
