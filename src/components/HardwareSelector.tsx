import React, { useState, useMemo } from 'react';
import type { HardwareItem } from '../types/hardware';
import { soundService } from '../services/sound';
import { getCategoryTheme } from '../utils/theme';
import {
  Cpu,
  Layers,
  HardDrive,
  Monitor,
  Zap,
  Fan,
  Keyboard,
  Speaker,
  Wifi,
  Radio,
  SlidersHorizontal
} from 'lucide-react';

interface Props {
  hardwareList: HardwareItem[];
  categories?: string[];
  selectedId: string;
  onSelect: (hardware: HardwareItem) => void;
}

export const HardwareSelector: React.FC<Props> = ({
  hardwareList,
  categories,
  selectedId,
  onSelect
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');

  // Extract categories dynamically from dataset categories or hardwareList
  const categoryOptions = useMemo(() => {
    const baseCategories = categories && categories.length > 0
      ? categories
      : [
          'İşlem',
          'Bellek',
          'Görüntü',
          'Ana Donanım',
          'Depolama',
          'Güç',
          'Soğutma',
          'Giriş',
          'Çıkış',
          'Giriş/Çıkış',
          'Ağ'
        ];

    const combinedSet = new Set<string>();
    baseCategories.forEach(c => combinedSet.add(c));
    hardwareList.forEach(h => {
      if (h.category && h.category.trim()) {
        combinedSet.add(h.category.trim());
      }
    });

    return ['Tümü', ...Array.from(combinedSet)];
  }, [categories, hardwareList]);

  // If selected category was deleted or renamed, reset to 'Tümü'
  React.useEffect(() => {
    if (selectedCategory !== 'Tümü' && !categoryOptions.includes(selectedCategory)) {
      setSelectedCategory('Tümü');
    }
  }, [categoryOptions, selectedCategory]);

  // Filter hardware by category
  const filteredList = useMemo(() => {
    if (selectedCategory === 'Tümü') return hardwareList;
    return hardwareList.filter(h => h.category === selectedCategory);
  }, [hardwareList, selectedCategory]);

  const handleCardClick = (item: HardwareItem) => {
    soundService.playSelect();
    onSelect(item);
  };

  // Helper icon by category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'İşlem':
        return <Cpu className="w-4 h-4" />;
      case 'Bellek':
        return <Layers className="w-4 h-4" />;
      case 'Görüntü':
        return <Monitor className="w-4 h-4" />;
      case 'Depolama':
        return <HardDrive className="w-4 h-4" />;
      case 'Güç':
        return <Zap className="w-4 h-4" />;
      case 'Soğutma':
        return <Fan className="w-4 h-4" />;
      case 'Giriş':
        return <Keyboard className="w-4 h-4" />;
      case 'Çıkış':
        return <Speaker className="w-4 h-4" />;
      case 'Ağ':
        return <Wifi className="w-4 h-4" />;
      default:
        return <Radio className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full bg-lab-950/95 border-t border-zinc-800/80 p-3 flex flex-col gap-2.5 backdrop-blur-xl z-20 select-none">
      {/* Category Pills (Horizontal Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 px-2.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
          <span>Kategoriler:</span>
        </div>
        {categoryOptions.map((cat) => {
          const isCatSelected = selectedCategory === cat;
          const catTheme = getCategoryTheme(cat);
          return (
            <button
              key={cat}
              onClick={() => {
                soundService.playClick();
                setSelectedCategory(cat);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[38px] ${
                isCatSelected
                  ? (cat === 'Tümü' ? 'bg-white text-zinc-950 shadow-[0_0_15px_rgba(255,255,255,0.3)] font-black scale-105' : `${catTheme.pillActive} scale-105`)
                  : 'bg-lab-900/80 text-zinc-300 hover:bg-lab-800 hover:text-white border border-zinc-800'
              }`}
            >
              {cat !== 'Tümü' && (
                <span className={isCatSelected ? '' : catTheme.textColor}>
                  {getCategoryIcon(cat)}
                </span>
              )}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Hardware Items Touch Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar py-1">
        {filteredList.map((item) => {
          const isSelected = item.id === selectedId;
          const itemTheme = getCategoryTheme(item.category);

          return (
            <button
              key={item.id}
              onClick={() => handleCardClick(item)}
              style={
                isSelected
                  ? { boxShadow: `0 0 20px ${itemTheme.activeCardGlow}` }
                  : undefined
              }
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all text-left group min-h-[56px] ${
                isSelected
                  ? `bg-gradient-to-r ${itemTheme.activeCardBg} ${itemTheme.activeCardBorder} text-white scale-105`
                  : 'bg-lab-900/90 hover:bg-lab-850 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {/* Icon Container */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-white text-zinc-950 shadow-md font-bold'
                    : `bg-lab-800 ${itemTheme.textColor} group-hover:bg-lab-750`
                }`}
              >
                {getCategoryIcon(item.category)}
              </div>

              {/* Title and Category label */}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white whitespace-nowrap group-hover:text-white transition">
                  {item.name}
                </span>
                <span className={`text-[11px] font-semibold transition ${isSelected ? 'text-zinc-200' : itemTheme.textColor}`}>
                  {item.category}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
