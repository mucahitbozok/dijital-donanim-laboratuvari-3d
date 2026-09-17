import React, { useState } from 'react';
import type { HardwareItem } from '../types/hardware';
import { soundService } from '../services/sound';
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

  const setPreset = (idA: string, idB: string) => {
    soundService.playSelect();
    setLeftId(idA);
    setRightId(idB);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-lab-900 border border-sky-500/40 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-lab-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Donanım Karşılaştırma Modu
              </h2>
              <p className="text-xs text-slate-400">
                İki donanımı yan yana koyarak görev ve özellik farklarını keşfedin.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition min-h-[44px]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-6 py-3 bg-lab-800/40 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Önerilen Kıyaslamalar:
          </span>
          <button
            onClick={() => setPreset('ram', 'ssd')}
            className={`px-3 py-1.5 rounded-xl font-bold transition min-h-[36px] ${
              leftId === 'ram' && rightId === 'ssd'
                ? 'bg-sky-500 text-slate-950'
                : 'bg-lab-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            RAM vs SSD
          </button>
          <button
            onClick={() => setPreset('hdd', 'ssd')}
            className={`px-3 py-1.5 rounded-xl font-bold transition min-h-[36px] ${
              leftId === 'hdd' && rightId === 'ssd'
                ? 'bg-sky-500 text-slate-950'
                : 'bg-lab-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            HDD vs SSD
          </button>
          <button
            onClick={() => setPreset('cpu', 'gpu')}
            className={`px-3 py-1.5 rounded-xl font-bold transition min-h-[36px] ${
              leftId === 'cpu' && rightId === 'gpu'
                ? 'bg-sky-500 text-slate-950'
                : 'bg-lab-700/60 text-slate-300 hover:bg-slate-700'
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
            <div className="p-4 rounded-2xl bg-lab-850 border border-slate-700/80">
              <label className="block text-xs font-bold text-sky-400 uppercase mb-2">
                1. Donanım:
              </label>
              <select
                value={leftId}
                onChange={(e) => {
                  soundService.playSelect();
                  setLeftId(e.target.value);
                }}
                aria-label="1. Donanım Seçimi"
                className="w-full p-3 rounded-xl bg-lab-900 border border-slate-700 text-white font-bold text-base focus:ring-2 focus:ring-sky-500 outline-none"
              >
                {hardwareList.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Right Hardware Picker */}
            <div className="p-4 rounded-2xl bg-lab-850 border border-slate-700/80">
              <label className="block text-xs font-bold text-purple-400 uppercase mb-2">
                2. Donanım:
              </label>
              <select
                value={rightId}
                onChange={(e) => {
                  soundService.playSelect();
                  setRightId(e.target.value);
                }}
                aria-label="2. Donanım Seçimi"
                className="w-full p-3 rounded-xl bg-lab-900 border border-slate-700 text-white font-bold text-base focus:ring-2 focus:ring-purple-500 outline-none"
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
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-lab-950/60 shadow-xl text-left">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-lab-800/80 border-b border-slate-700/80">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-1/4">
                    Özellik
                  </th>
                  <th className="p-4 text-left w-3/8 text-sky-400 font-extrabold text-base">
                    {leftItem.name}
                  </th>
                  <th className="p-4 text-left w-3/8 text-purple-400 font-extrabold text-base">
                    {rightItem.name}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {/* Kategori */}
                <tr className="hover:bg-lab-900/50">
                  <td className="p-4 font-bold text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    Kategori
                  </td>
                  <td className="p-4 font-semibold text-white">
                    <span className="px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-300 text-xs font-bold">
                      {leftItem.category}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-white">
                    <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-bold">
                      {rightItem.category}
                    </span>
                  </td>
                </tr>

                {/* 1 Cümlede Özet */}
                <tr className="hover:bg-lab-900/50">
                  <td className="p-4 font-bold text-slate-400 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    Kısaca Özeti
                  </td>
                  <td className="p-4 text-slate-200 leading-relaxed font-medium">
                    {leftItem.summary || leftItem.shortDescription}
                  </td>
                  <td className="p-4 text-slate-200 leading-relaxed font-medium">
                    {rightItem.summary || rightItem.shortDescription}
                  </td>
                </tr>

                {/* Görevi */}
                <tr className="hover:bg-lab-900/50">
                  <td className="p-4 font-bold text-slate-400 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    Temel Görevi
                  </td>
                  <td className="p-4 text-slate-200 leading-relaxed">
                    {leftItem.function}
                  </td>
                  <td className="p-4 text-slate-200 leading-relaxed">
                    {rightItem.function}
                  </td>
                </tr>

                {/* Nerede Bulunur? */}
                <tr className="hover:bg-lab-900/50">
                  <td className="p-4 font-bold text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Nerede Bulunur?
                  </td>
                  <td className="p-4 text-slate-200 leading-relaxed">
                    {leftItem.location}
                  </td>
                  <td className="p-4 text-slate-200 leading-relaxed">
                    {rightItem.location}
                  </td>
                </tr>

                {/* Önemli Bilgi / Ayırıcı Fark */}
                <tr className="hover:bg-lab-900/50">
                  <td className="p-4 font-bold text-slate-400 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-pink-400" />
                    Önemli Fark
                  </td>
                  <td className="p-4 text-slate-300 leading-relaxed text-xs">
                    {leftItem.importantInfo || 'Standart bileşen.'}
                  </td>
                  <td className="p-4 text-slate-300 leading-relaxed text-xs">
                    {rightItem.importantInfo || 'Standart bileşen.'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-lab-950/80 flex items-center justify-end">
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition min-h-[48px]"
          >
            Kapat ve İncelemeye Dön
          </button>
        </div>
      </div>
    </div>
  );
};
