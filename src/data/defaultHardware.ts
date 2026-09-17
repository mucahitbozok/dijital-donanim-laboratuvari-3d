import type { HardwareDataset } from '../types/hardware';
import defaultRawData from './defaultData.json';

export const defaultCategories: string[] = [
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

export const initialHardwareData: HardwareDataset = {
  ...(defaultRawData as unknown as HardwareDataset),
  categories: (defaultRawData as any).categories || defaultCategories
};
