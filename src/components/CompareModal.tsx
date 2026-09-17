import React, { useState } from 'react';
import type { HardwareItem } from '../types/hardware';
import { soundService } from '../services/sound';
import { getCategoryTheme } from '../utils/theme';
import {
  X,
  GitCompare,
  ArrowRightLeft,
  Sparkles,
  Cpu,
  MapPin,
  HelpCircle
} from 'lucide-react';

interface Props {
  hardwareList: HardwareItem[];
  defaultHardwareId: string;
  onClose: () => void;
}

export const CompareModal: React.FC<Props> = ({
  hardwareList,
  defaultHardwareId,
  onClose
}) => {
  // Select initial two items for comparison
  const [leftId, setLeftId] = useState<string>(
    defaultHardwareId === 'ram' ? 'ram' : (defaultHardwareId || 'ram')
  );
  const [rightId, setRightId] = useState<string>(
    defaultHardwareId === 'ram' ? 'ssd' : (defaultHardwareId === 'hdd' ? 'ssd' : 'ssd')
  );

  const leftItem = hardwareList.find(h => h.id === leftId) || hardwareList[0];
  const rightItem = hardwareList.find(h => h.id === rightId) || hardwareList[1] || hardwareList[0];

  const leftTheme = getCategoryTheme(leftItem?.category || '');
  const rightTheme = getCategoryTheme(rightItem?.category || '');

  const setPreset = (idA: string, idB: string) => {
    soundService.playSelect();
    setLeftId(idA);
    setRightId(idB);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-lab-900 border border-zinc-700/80 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-lab-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Donanım Karşılaştırma Modu
              </h2>
              <p className="text-xs text-zinc-400">
                İki donanımı yan yana koyarak görev ve özellik farklarını keşfedin.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition min-h-[44px]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-6 py-3 bg-lab-850/60 border-b border-zinc-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-zinc-400 uppercase tracking-wider mr-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Önerilen Kıyaslamalar:
          </span>
          <button
            onClick={() => setPreset('ram', 'ssd')}
            className={`px-3 py-1.5 rounded-xl font-bold transition min-h-[36px] ${
              leftId === 'ram' && rightId === 'ssd'
                ? 'bg-amber-400 text-zinc-950 shadow-md font-black'
                : 'bg-lab-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            RAM vs SSD
          </button>
          <button
            onClick={() => setPreset('hdd', 'ssd')}
            className={`px-3 py-1.5 rounded-xl font-bold transition min-h-[36px] ${
              leftId === 'hdd' && rightId === 'ssd'
                ? 'bg-amber-400 text-zinc-950 shadow-md font-black'
                : 'bg-lab-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            HDD vs SSD
          </button>
          <button
            onClick={() => setPreset('cpu', 'gpu')}
            className={`px-3 py-1.5 rounded-xl font-bold transition min-h-[36px] ${
              leftId === 'cpu' && rightId === 'gpu'
                ? 'bg-amber-400 text-zinc-950 shadow-md font-black'
                : 'bg-lab-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            CPU vs GPU
          </button>
        </div>

        {/* Content Body: Selectors & Comparison Matrix */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Hardware Selectors (Side-by-side dropdowns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Hardware Picker */}
            <div className="p-4 rounded-2xl bg-lab-850 border border-zinc-800">
              <label className={`block text-xs font-bold uppercase mb-2 ${leftTheme.textColor}`}>
                1. Donanım ({leftItem.category}):
              </label>
              <select
                value={leftId}
                onChange={(e) => {
                  soundService.playSelect();
                  setLeftId(e.target.value);
                }}
                aria-label="1. Donanım Seçimi"
                className="w-full p-3 rounded-xl bg-lab-900 border border-zinc-700 text-white font-bold text-base focus:ring-2 focus:ring-amber-400 outline-none"
              >
                {hardwareList.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Right Hardware Picker */}
            <div className="p-4 rounded-2xl bg-lab-850 border border-zinc-800">
              <label className={`block text-xs font-bold uppercase mb-2 ${rightTheme.textColor}`}>
                2. Donanım ({rightItem.category}):
              </label>
              <select
                value={rightId}
                onChange={(e) => {
                  soundService.playSelect();
                  setRightId(e.target.value);
                }}
                aria-label="2. Donanım Seçimi"
                className="w-full p-3 rounded-xl bg-lab-900 border border-zinc-700 text-white font-bold text-base focus:ring-2 focus:ring-purple-400 outline-none"
              >
                {hardwareList.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-lab-950/70 shadow-xl text-left">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-lab-800/80 border-b border-zinc-700/80">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-400 w-1/4">
                    Özellik
                  </th>
                  <th className={`p-4 text-left w-3/8 ${leftTheme.textColor} font-extrabold text-base`}>
                    {leftItem.name}
                  </th>
                  <th className={`p-4 text-left w-3/8 ${rightTheme.textColor} font-extrabold text-base`}>
                    {rightItem.name}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm">
                {/* Kategori */}
                <tr className="hover:bg-lab-900/50">
                  <td className="p-4 font-bold text-zinc-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Kategori
                  </td>
                  <td className="p-4 font-semibold text-white">
                    <span className={`px-2.5 py-1 rounded-md ${leftTheme.badgeBg} ${leftTheme.textColor} border ${leftTheme.badgeBorder} text-xs font-bold`}>
                      {leftItem.category}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-white">
                    <span className={`px-2.5 py-1 rounded-md ${rightTheme.badgeBg} ${rightTheme.textColor} border ${rightTheme.badgeBorder} text-xs font-bold`}>
                      {rightItem.category}
                    </span>
                  </td>
                </tr>

                {/* 1 Cümlede Özet */}
                <tr className="hover:bg-lab-900/50">
                  <td className="p-4 font-bold text-zinc-400 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    Kısaca Özeti
                  </td>
                  <td className="p-4 text-zinc-200 leading-relaxed font-medium">
                    {leftItem.summary || leftItem.shortDescription}
                  </td>
                  <td className="p-4 text-zinc-200 leading-relaxed font-medium">
                    {rightItem.summary || rightItem.shortDescription}
                  </td>
                </tr>

                {/* Görevi */}
                <tr className="hover:bg-lab-900/50">
                  <td className="p-4 font-bold text-zinc-400 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    Temel Görevi
                  </td>
                  <td className="p-4 text-zinc-200 leading-relaxed">
                    {leftItem.function}
                  </td>
                  <td className="p-4 text-zinc-200 leading-relaxed">
                    {rightItem.function}
                  </td>
                </tr>

                {/* Nerede Bulunur? */}
                <tr className="hover:bg-lab-900/50">
                  <td className="p-4 font-bold text-zinc-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Nerede Bulunur?
                  </td>
                  <td className="p-4 text-zinc-200 leading-relaxed">
                    {leftItem.location}
                  </td>
                  <td className="p-4 text-zinc-200 leading-relaxed">
                    {rightItem.location}
                  </td>
                </tr>

                {/* Önemli Bilgi / Ayırıcı Fark */}
                <tr className="hover:bg-lab-900/50">
                  <td className="p-4 font-bold text-zinc-400 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-pink-400" />
                    Önemli Fark
                  </td>
                  <td className="p-4 text-zinc-300 leading-relaxed text-xs">
                    {leftItem.importantInfo || 'Standart bileşen.'}
                  </td>
                  <td className="p-4 text-zinc-300 leading-relaxed text-xs">
                    {rightItem.importantInfo || 'Standart bileşen.'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-lab-950/80 flex items-center justify-end">
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-sm transition min-h-[48px]"
          >
            Kapat ve İncelemeye Dön
          </button>
        </div>
      </div>
    </div>
  );
};
