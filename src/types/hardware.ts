export type HardwareCategory =
  | 'Tümü'
  | 'İşlem'
  | 'Bellek'
  | 'Görüntü'
  | 'Ana Donanım'
  | 'Depolama'
  | 'Güç'
  | 'Soğutma'
  | 'Giriş'
  | 'Çıkış'
  | 'Giriş/Çıkış'
  | 'Ağ';

export interface Hotspot {
  id: string;
  label: string;
  info: string;
  position?: [number, number, number]; // 3D coordinates [x, y, z]
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // index of correct option
  explanation: string;
}

export interface HardwareItem {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  function: string;
  location: string;
  importantInfo: string;
  summary: string;
  image?: string;
  model3d?: string;
  hotspots: Hotspot[];
  questions: QuizQuestion[];
  missions: string[];
}

export interface HardwareDataset {
  schemaVersion: string;
  app: {
    name: string;
    brand: string;
    target: string;
    mode: string;
  };
  learningLoop: string[];
  contentNotes: Record<string, string>;
  categories?: string[];
  hardware: HardwareItem[];
}
