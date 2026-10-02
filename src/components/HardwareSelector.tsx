import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { HardwareItem } from '../types/hardware';
import { soundService } from '../services/sound';
import { getCategoryTheme } from '../utils/theme';
import { defaultCategoryDescriptions } from '../data/defaultHardware';
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
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);

  // Drag-to-scroll and momentum refs
  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const hasMoved = useRef(false);
  const velocityX = useRef(0);
  const lastPointerX = useRef(0);
  const lastPointerTime = useRef(0);
  const momentumAnimId = useRef<number | null>(null);

  // Extract categories dynamically from dataset categories or hardwareList
  const categoryOptions = useMemo(() => {
    const baseCategories = categories && categories.length > 0
      ? categories
      : [
          'Giriş Birimi',
          'Çıkış Birimi',
          'Hem Giriş Hem Çıkış Birimi',
          'İşlem',
          'Bellek',
          'Görüntü',
          'Ana Donanım',
          'Depolama',
          'Güç',
          'Soğutma',
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
  useEffect(() => {
    if (selectedCategory !== 'Tümü' && !categoryOptions.includes(selectedCategory)) {
      setSelectedCategory('Tümü');
    }
  }, [categoryOptions, selectedCategory]);

  // Filter hardware by category
  const filteredList = useMemo(() => {
    if (selectedCategory === 'Tümü') return hardwareList;
    return hardwareList.filter(h => h.category === selectedCategory);
  }, [hardwareList, selectedCategory]);

  // Check scrollability to toggle navigation arrows and edge fade masks
  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScrollability();
    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);
    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [filteredList, checkScrollability]);

  // Auto-scroll selected hardware item into view smoothly
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isPointerDown.current) return;
    const activeEl = container.querySelector(`[data-id="${selectedId}"]`) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedId, selectedCategory]);

  // Smooth arrow button navigation
  const scrollByAmount = (offset: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (momentumAnimId.current) cancelAnimationFrame(momentumAnimId.current);
    el.scrollBy({ left: offset, behavior: 'smooth' });
    soundService.playClick();
  };

  // Global pointer move & up listeners for smooth drag-to-scroll anywhere on screen
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isPointerDown.current) return;
      const el = scrollContainerRef.current;
      if (!el) return;

      const currentX = e.clientX;
      const deltaX = currentX - startX.current;

      // Only consider it a drag if moved more than 10px (prevents accidental drag on tap)
      if (Math.abs(deltaX) > 10) {
        hasMoved.current = true;
        setIsGrabbing(true);
      }

      if (hasMoved.current) {
        el.scrollLeft = startScrollLeft.current - deltaX;

        // Track instantaneous velocity for natural momentum glide
        const now = performance.now();
        const dt = now - lastPointerTime.current;
        if (dt > 10) {
          velocityX.current = (currentX - lastPointerX.current) / dt;
          lastPointerX.current = currentX;
          lastPointerTime.current = now;
        }
      }
    };

    const handleGlobalPointerUp = () => {
      if (!isPointerDown.current) return;
      isPointerDown.current = false;
      setIsGrabbing(false);

      const el = scrollContainerRef.current;
      if (el && Math.abs(velocityX.current) > 0.15 && hasMoved.current) {
        let vel = velocityX.current * -16;
        const decay = 0.92;
        const step = () => {
          if (!el || Math.abs(vel) < 0.5) return;
          el.scrollLeft += vel;
          vel *= decay;
          momentumAnimId.current = requestAnimationFrame(step);
        };
        momentumAnimId.current = requestAnimationFrame(step);
      }

      // If user was dragging, keep hasMoved true briefly so trailing click doesn't trigger selection
      if (hasMoved.current) {
        setTimeout(() => {
          hasMoved.current = false;
        }, 120);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  // Pointer drag start
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (momentumAnimId.current) {
      cancelAnimationFrame(momentumAnimId.current);
    }
    const el = scrollContainerRef.current;
    if (!el) return;

    isPointerDown.current = true;
    hasMoved.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = el.scrollLeft;
    lastPointerX.current = e.clientX;
    lastPointerTime.current = performance.now();
    velocityX.current = 0;
  };

  // Horizontal mouse wheel scrolling over carousel
  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (e.deltaY !== 0 && e.deltaX === 0) {
      el.scrollLeft += e.deltaY * 0.85;
    }
  };

  const handleCardClick = (item: HardwareItem) => {
    // If user was dragging/swiping, ignore click
    if (hasMoved.current) {
      return;
    }
    soundService.playSelect();
    onSelect(item);
  };

  // Helper icon by category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Giriş':
      case 'Giriş Birimi':
      case 'Giriş Birimleri':
        return <Keyboard className="w-4 h-4" />;
      case 'Çıkış':
      case 'Çıkış Birimi':
      case 'Çıkış Birimleri':
        return <Speaker className="w-4 h-4" />;
      case 'Giriş/Çıkış':
      case 'Hem Giriş Hem Çıkış Birimi':
      case 'Hem Giriş Hem Çıkış Birimleri':
      case 'Hem Giriş Hem Çıkış':
        return <Radio className="w-4 h-4" />;
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
      case 'Ağ':
        return <Wifi className="w-4 h-4" />;
      default:
        return <Radio className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full bg-lab-950/95 border-t border-zinc-800/80 p-3 flex flex-col gap-2.5 backdrop-blur-xl z-20 select-none">
      {/* Category Pills (Horizontal Scrollable) */}
      <div 
        ref={categoryScrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
      >
        <div className="flex items-center gap-1.5 px-2.5 text-xs font-bold text-zinc-400 uppercase tracking-wider flex-shrink-0">
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

      {/* Category Educational Description Banner (Visible when a specific category is selected) */}
      {selectedCategory !== 'Tümü' && defaultCategoryDescriptions[selectedCategory] && (
        <div className="px-3 py-1.5 rounded-xl bg-lab-900/90 border border-zinc-800/90 text-xs flex items-center gap-2 text-zinc-300 animate-fade-in">
          <span className="font-bold text-amber-400 flex-shrink-0">💡 {selectedCategory}:</span>
          <span className="truncate md:whitespace-normal font-medium">{defaultCategoryDescriptions[selectedCategory]}</span>
        </div>
      )}

      {/* Modern Grab & Drag Hardware Carousel Container */}
      <div className="relative group/carousel w-full">
        {/* Left Smooth Arrow Button */}
        <button
          onClick={() => scrollByAmount(-320)}
          aria-label="Sola kaydır"
          className={`absolute left-1 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-lab-900/95 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
            canScrollLeft ? 'opacity-90 hover:opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right Smooth Arrow Button */}
        <button
          onClick={() => scrollByAmount(320)}
          aria-label="Sağa kaydır"
          className={`absolute right-1 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-lab-900/95 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
            canScrollRight ? 'opacity-90 hover:opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Left Edge Subtle Fade Gradient */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-lab-950 via-lab-950/80 to-transparent pointer-events-none z-20 transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Right Edge Subtle Fade Gradient */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-lab-950 via-lab-950/80 to-transparent pointer-events-none z-20 transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Grab-to-Scroll Hardware Items Track */}
        <div
          ref={scrollContainerRef}
          onPointerDown={handlePointerDown}
          onWheel={handleWheel}
          className={`flex items-center gap-3 overflow-x-auto custom-scrollbar py-2 px-1 touch-pan-y transition-colors ${
            isGrabbing ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          style={{ scrollBehavior: isGrabbing ? 'auto' : 'smooth' }}
        >
          {filteredList.map((item) => {
            const isSelected = item.id === selectedId;
            const itemTheme = getCategoryTheme(item.category);

            return (
              <button
                key={item.id}
                data-id={item.id}
                type="button"
                onClick={() => handleCardClick(item)}
                draggable={false}
                style={
                  isSelected
                    ? { boxShadow: `0 0 22px ${itemTheme.activeCardGlow}` }
                    : undefined
                }
                className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-200 text-left group select-none min-h-[58px] ${
                  isSelected
                    ? `bg-gradient-to-r ${itemTheme.activeCardBg} ${itemTheme.activeCardBorder} text-white scale-105 shadow-lg`
                    : 'bg-lab-900/85 hover:bg-lab-850/95 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:-translate-y-0.5'
                }`}
              >
                {/* Icon Container */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all pointer-events-none ${
                    isSelected
                      ? 'bg-white text-zinc-950 shadow-md font-bold'
                      : `bg-lab-800 ${itemTheme.textColor} group-hover:bg-lab-750`
                  }`}
                >
                  {getCategoryIcon(item.category)}
                </div>

                {/* Title and Category label */}
                <div className="flex flex-col pointer-events-none">
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
    </div>
  );
};
