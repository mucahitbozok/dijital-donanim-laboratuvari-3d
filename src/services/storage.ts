import type { HardwareDataset } from '../types/hardware';
import { initialHardwareData, defaultCategories } from '../data/defaultHardware';

const STORAGE_KEY = 'bozok_hardware_lab_data_v1';

export const storageService = {
  loadData(): HardwareDataset {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.hardware) && parsed.hardware.length > 0) {
          // Merge any newly introduced default model3d paths
          parsed.hardware = parsed.hardware.map((item: any) => {
            const defaultItem = initialHardwareData.hardware.find(d => d.id === item.id);
            if (defaultItem && !item.model3d && defaultItem.model3d) {
              item.model3d = defaultItem.model3d;
            }
            return item;
          });

          // Ensure categories array exists
          if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
            const catSet = new Set<string>(defaultCategories);
            parsed.hardware.forEach((item: any) => {
              if (item.category && item.category.trim()) {
                catSet.add(item.category.trim());
              }
            });
            parsed.categories = Array.from(catSet);
          }

          return parsed;
        }
      }
    } catch (e) {
      console.warn('LocalStorage okuma hatası, varsayılan veri kullanılıyor:', e);
    }
    return initialHardwareData;
  },

  saveData(dataset: HardwareDataset): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    } catch (e) {
      console.error('LocalStorage kaydetme hatası:', e);
    }
  },

  resetToDefault(): HardwareDataset {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    return initialHardwareData;
  },

  exportData(dataset: HardwareDataset): void {
    const jsonStr = JSON.stringify(dataset, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `donanim_laboratuvari_veri_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  importData(jsonString: string): HardwareDataset {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.hardware)) {
      throw new Error('Geçersiz donanım veri dosyası!');
    }
    if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      const catSet = new Set<string>(defaultCategories);
      parsed.hardware.forEach((item: any) => {
        if (item.category && item.category.trim()) {
          catSet.add(item.category.trim());
        }
      });
      parsed.categories = Array.from(catSet);
    }
    this.saveData(parsed);
    return parsed;
  }
};
