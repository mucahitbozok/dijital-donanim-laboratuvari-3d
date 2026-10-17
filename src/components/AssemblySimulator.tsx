import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import confetti from 'canvas-confetti';
import { soundService } from '../services/sound';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  CheckCircle2,
  AlertCircle,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';

interface Props {
  onBackToLab: () => void;
  isLargeFont?: boolean;
}

interface AssemblyPart {
  id: string;
  order: number;
  name: string;
  role: string;
  slotName: string;
  icon: string;
  color: string;
  educationalTip: string;
  slotPos: [number, number, number];
  prerequisiteId?: string;
  prerequisiteName?: string;
}

const ASSEMBLY_PARTS: AssemblyPart[] = [
  {
    id: 'cpu',
    order: 1,
    name: 'İşlemci (CPU)',
    role: 'Bilgisayarın Beyni',
    slotName: 'LGA CPU Soketi',
    icon: '🧠',
    color: '#6366f1',
    educationalTip: 'İşlemciyi soketteki altın üçgen çentiğine göre dikkatlice yerleştiriyoruz. Bilgisayarın tüm hesaplamalarını yapar!',
    slotPos: [-0.65, 0.12, -0.55]
  },
  {
    id: 'cooler',
    order: 2,
    name: 'İşlemci Soğutucu Fanı',
    role: 'Termal Soğutma',
    slotName: 'CPU Üstü Fan Montajı',
    icon: '❄️',
    color: '#06b6d4',
    educationalTip: 'İşlemci çalışırken çok ısınır. Termal macun ve alüminyum fan bloğu sayesinde işlemci serin kalarak hızlı çalışır!',
    slotPos: [-0.65, 0.46, -0.55],
    prerequisiteId: 'cpu',
    prerequisiteName: 'İşlemci (CPU)'
  },
  {
    id: 'ram',
    order: 3,
    name: 'RAM Bellek (DDR5)',
    role: 'Geçici Çalışma Hafızası',
    slotName: 'DDR RAM Yuvası',
    icon: '⚡',
    color: '#a855f7',
    educationalTip: 'RAM çentiğini yuva ile hizalayıp iki ucundan bastırarak mandalların tık diye kilitlenmesini sağlıyoruz!',
    slotPos: [0.65, 0.22, -0.45]
  },
  {
    id: 'gpu',
    order: 4,
    name: 'Ekran Kartı (GPU)',
    role: 'Görüntü ve 3D Grafik',
    slotName: 'PCIe x16 Geniş Yuva',
    icon: '🎮',
    color: '#f59e0b',
    educationalTip: 'Ekran kartını anakartın en uzun yuvası olan PCI Express (PCIe) yuvasına takıyoruz. Monitöre görüntü ve oyunları verir!',
    slotPos: [0.0, 0.26, 0.45]
  },
  {
    id: 'ssd',
    order: 5,
    name: 'M.2 NVMe SSD',
    role: 'Işık Hızında Kalıcı Depolama',
    slotName: 'M.2 NVMe Yuvası',
    icon: '💾',
    color: '#10b981',
    educationalTip: 'M.2 SSD\'yi 30 derece açıyla yuvasına takıp vidayla sabitliyoruz. Windows ve tüm oyunlar burada saklanır!',
    slotPos: [0.15, 0.12, -0.05]
  },
  {
    id: 'cable',
    order: 6,
    name: '24-Pin Güç Kablosu',
    role: 'Anakart Ana Elektrik Beslemesi',
    slotName: '24-Pin ATX Güç Girişi',
    icon: '🔌',
    color: '#ec4899',
    educationalTip: 'Güç kaynağından (PSU) gelen kalın 24-pin ana güç kablosunu takıyoruz. Bilgisayarın kalbine elektrik enerjisi verir!',
    slotPos: [1.65, 0.26, -0.65]
  }
];

interface ProjectedSlot {
  partId: string;
  name: string;
  slotName: string;
  screenX: number;
  screenY: number;
  visible: boolean;
  installed: boolean;
  isTarget: boolean;
}

export const AssemblySimulator: React.FC<Props> = ({ onBackToLab, isLargeFont = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number>(0);

  // 3D Object References
  const workbenchGroupRef = useRef<THREE.Group | null>(null);
  const installedMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const animatingMeshesRef = useRef<Map<string, { group: THREE.Group; startY: number; targetY: number; progress: number }>>(new Map());
  const fanBladeGroupRef = useRef<THREE.Group | null>(null);
  const gpuFansRef = useRef<THREE.Group[]>([]);
  const rgbMeshesRef = useRef<THREE.Mesh[]>([]);
  const monitorScreenMeshRef = useRef<THREE.Mesh | null>(null);

  // State
  const [installedParts, setInstalledParts] = useState<Set<string>>(new Set());
  const [selectedPartId, setSelectedPartId] = useState<string>('cpu');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' } | null>({
    message: 'Hoş geldin! Alttaki parçalardan birini seç ve anakarttaki parıldayan yuvasına takarak montaja başla!',
    type: 'info'
  });
  const [isPowerOn, setIsPowerOn] = useState<boolean>(false);
  const [isPoweringUp, setIsPoweringUp] = useState<boolean>(false);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [projectedSlots, setProjectedSlots] = useState<ProjectedSlot[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundService.isSoundEnabled());
  const [bootLogLines, setBootLogLines] = useState<string[]>([]);

  // High-DPI Smartboard & 4K optimization
  const getOptimalPixelRatio = () => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const is4K = typeof window !== 'undefined' && (window.innerWidth >= 2400 || window.innerHeight >= 1400);
    return is4K ? Math.min(dpr, 1.25) : Math.min(dpr, 2);
  };

  // Helper: Material factories
  const metallicMat = (color: number, roughness = 0.25, metalness = 0.85) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const matteMat = (color: number, roughness = 0.7, metalness = 0.15) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const goldMat = () =>
    new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.95 });
  const glowMat = (color: number, intensity = 0.8) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.2,
      metalness: 0.5
    });

  // Construct Realistic Motherboard on Test Bench
  const buildMotherboardBase = (): THREE.Group => {
    const group = new THREE.Group();
    group.name = 'motherboard_base';

    // 1. Dark ATX PCB Board
    const pcbGeo = new THREE.BoxGeometry(3.8, 0.08, 3.8);
    const pcbMat = matteMat(0x0c1322, 0.65, 0.25);
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.castShadow = true;
    pcb.receiveShadow = true;
    group.add(pcb);

    // Subtle golden PCB trace lines on surface
    const traceMat = goldMat();
    for (let i = 0; i < 8; i++) {
      const trace = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.085, 1.4), traceMat);
      trace.position.set(-0.3 + i * 0.15, 0.005, 0.2);
      group.add(trace);
    }

    // 2. CPU Socket LGA Base & Silver Frame
    const socketBase = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 1.25), matteMat(0x27272a));
    socketBase.position.set(-0.65, 0.05, -0.55);
    group.add(socketBase);

    // Socket golden pin grid inside
    const pinGrid = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.11, 0.95), goldMat());
    pinGrid.position.set(-0.65, 0.055, -0.55);
    group.add(pinGrid);

    // Metal Retention Frame & Lever
    const socketFrame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 1.15), metallicMat(0x94a3b8, 0.2, 0.9));
    socketFrame.position.set(-0.65, 0.065, -0.55);
    group.add(socketFrame);

    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), metallicMat(0xcfd8dc));
    lever.rotation.x = Math.PI / 2;
    lever.position.set(-1.25, 0.09, -0.55);
    group.add(lever);

    // 4 CPU Cooler Mounting Standoff Holes
    [
      [-1.15, -1.05],
      [-0.15, -1.05],
      [-1.15, -0.05],
      [-0.15, -0.05]
    ].forEach(([sx, sz]) => {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 12), metallicMat(0x64748b));
      hole.position.set(sx, 0.07, sz);
      group.add(hole);
    });

    // 3. VRM Massive Aluminum Heatsinks (Top & Left of CPU)
    const vrm1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 1.4), metallicMat(0x334155, 0.3, 0.7));
    vrm1.position.set(-1.45, 0.25, -0.55);
    group.add(vrm1);

    const vrm2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.45), metallicMat(0x334155, 0.3, 0.7));
    vrm2.position.set(-0.65, 0.25, -1.45);
    group.add(vrm2);

    // 4. DDR RAM Slots (4 Slots, slots 2 and 4 color highlighted)
    [-0.3, -0.1, 0.1, 0.3].forEach((offset, idx) => {
      const slotGeo = new THREE.BoxGeometry(0.12, 0.18, 2.0);
      const isDualChan = idx === 1 || idx === 3;
      const slotMat = isDualChan ? matteMat(0x2563eb) : matteMat(0x1e293b);
      const slot = new THREE.Mesh(slotGeo, slotMat);
      slot.position.set(0.65 + offset, 0.1, -0.45);
      group.add(slot);

      // White latches on ends
      [-1.0, 1.0].forEach(lz => {
        const latch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.1), matteMat(0xf8fafc));
        latch.position.set(0.65 + offset, 0.12, -0.45 + lz);
        group.add(latch);
      });
    });

    // 5. PCIe Slots (x16 top reinforced, x16 bottom)
    const pcie1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.14), metallicMat(0x94a3b8, 0.2, 0.8));
    pcie1.position.set(0.0, 0.09, 0.45);
    group.add(pcie1);

    const pcie2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.14), matteMat(0x1e293b));
    pcie2.position.set(0.0, 0.08, 1.25);
    group.add(pcie2);

    // 6. M.2 Slot Base & Standoff Screw
    const m2Base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.4), matteMat(0x0f172a));
    m2Base.position.set(-0.65, 0.07, -0.05);
    group.add(m2Base);

    const m2Screw = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 12), metallicMat(0xd4af37));
    m2Screw.position.set(0.95, 0.08, -0.05);
    group.add(m2Screw);

    // 7. 24-Pin ATX Power Header (White connector block with pins)
    const atxHeader = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 1.3), matteMat(0xf1f5f9));
    atxHeader.position.set(1.65, 0.14, -0.65);
    group.add(atxHeader);

    // 8. Chipset Heatsink with RGB Logo Area
    const chipset = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 1.0), metallicMat(0x1e293b, 0.25, 0.8));
    chipset.position.set(1.15, 0.14, 0.95);
    group.add(chipset);

    const chipsetLed = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.27, 0.6), glowMat(0x6366f1, 0.4));
    chipsetLed.position.set(1.15, 0.14, 0.95);
    group.add(chipsetLed);
    rgbMeshesRef.current.push(chipsetLed);

    // 9. Rear I/O Ports Shield Block
    const ioBlock = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 2.0), metallicMat(0x475569, 0.3, 0.7));
    ioBlock.position.set(-1.6, 0.36, -0.85);
    group.add(ioBlock);

    return group;
  };

  // Construct Assembleable 3D Components
  const buildCpuModel = (): THREE.Group => {
    const group = new THREE.Group();
    // PCB Substrate
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 1.05), matteMat(0x14532d));
    group.add(pcb);
    // Silver IHS
    const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), metallicMat(0xe2e8f0, 0.15, 0.9));
    ihs.position.y = 0.05;
    group.add(ihs);
    // Golden Triangle Corner
    const tri = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.03, 3), goldMat());
    tri.position.set(-0.45, 0.07, -0.45);
    tri.rotation.y = Math.PI / 4;
    group.add(tri);
    return group;
  };

  const buildCoolerModel = (): THREE.Group => {
    const group = new THREE.Group();
    // Copper Base
    const copperBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 1.0), metallicMat(0xb45309, 0.2, 0.9));
    group.add(copperBase);

    // Heatpipes
    [-0.3, 0.3].forEach(px => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12), metallicMat(0xb45309, 0.2, 0.9));
      pipe.position.set(px, 0.35, 0);
      group.add(pipe);
    });

    // Aluminum Fin Stack
    const finStack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 1.0), metallicMat(0xcfd8dc, 0.25, 0.8));
    finStack.position.y = 0.35;
    group.add(finStack);

    // RGB Fan Shroud on top
    const fanFrame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 1.25), matteMat(0x0f172a));
    fanFrame.position.y = 0.68;
    group.add(fanFrame);

    // RGB Glowing Outer Ring
    const rgbRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.04, 16, 32), glowMat(0x06b6d4, 0.7));
    rgbRing.rotation.x = Math.PI / 2;
    rgbRing.position.y = 0.72;
    group.add(rgbRing);
    rgbMeshesRef.current.push(rgbRing);

    // Rotating Fan Blades Group
    const bladesGroup = new THREE.Group();
    bladesGroup.position.y = 0.72;

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16), metallicMat(0x38bdf8));
    bladesGroup.add(hub);

    for (let b = 0; b < 7; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.08), matteMat(0x1e293b));
      const angle = (b / 7) * Math.PI * 2;
      blade.position.set(Math.cos(angle) * 0.28, 0, Math.sin(angle) * 0.28);
      blade.rotation.y = angle + 0.3;
      bladesGroup.add(blade);
    }

    group.add(bladesGroup);
    fanBladeGroupRef.current = bladesGroup;

    return group;
  };

  const buildRamModel = (): THREE.Group => {
    const group = new THREE.Group();
    // PCB strip
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 1.8), matteMat(0x0f172a));
    group.add(pcb);

    // Heatspreader plates (Both sides)
    const spreader = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 1.82), metallicMat(0x1e1b4b, 0.3, 0.7));
    spreader.position.y = 0.04;
    group.add(spreader);

    // Gold fingers at bottom
    const goldPins = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 1.7), goldMat());
    goldPins.position.y = -0.22;
    group.add(goldPins);

    // Top RGB Diffuser Strip
    const rgbBar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 1.84), glowMat(0xa855f7, 0.9));
    rgbBar.position.y = 0.24;
    group.add(rgbBar);
    rgbMeshesRef.current.push(rgbBar);

    return group;
  };

  const buildGpuModel = (): THREE.Group => {
    const group = new THREE.Group();

    // Shroud Body
    const shroud = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.45), matteMat(0x18181b, 0.5, 0.5));
    shroud.position.y = 0.35;
    group.add(shroud);

    // Dual Fans
    const fans: THREE.Group[] = [];
    [-0.55, 0.55].forEach(fx => {
      const fanObj = new THREE.Group();
      fanObj.position.set(fx, 0.35, 0.24);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 12, 24), metallicMat(0x52525b));
      fanObj.add(rim);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), metallicMat(0x38bdf8));
      hub.rotation.x = Math.PI / 2;
      fanObj.add(hub);

      for (let b = 0; b < 6; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.02), matteMat(0x27272a));
        const angle = (b / 6) * Math.PI * 2;
        blade.position.set(Math.cos(angle) * 0.2, Math.sin(angle) * 0.2, 0);
        blade.rotation.z = angle + 0.3;
        fanObj.add(blade);
      }
      group.add(fanObj);
      fans.push(fanObj);
    });
    gpuFansRef.current = fans;

    // Bottom Gold PCIe Connector
    const pcieGold = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.06), goldMat());
    pcieGold.position.set(0.1, -0.15, -0.16);
    group.add(pcieGold);

    // Silver Rear Bracket
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.6), metallicMat(0xd1d5db, 0.15, 0.9));
    bracket.position.set(-1.14, 0.35, 0);
    group.add(bracket);

    // Side Glowing Logo Bar
    const logo = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.05), glowMat(0xf59e0b, 0.8));
    logo.position.set(0, 0.82, 0.18);
    group.add(logo);
    rgbMeshesRef.current.push(logo);

    return group;
  };

  const buildSsdModel = (): THREE.Group => {
    const group = new THREE.Group();
    // PCB stick
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.32), matteMat(0x064e3b));
    group.add(pcb);

    // NAND Flash & Controller chips
    const chip1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.24), matteMat(0x18181b));
    chip1.position.set(-0.25, 0.03, 0);
    group.add(chip1);

    const chip2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.24), matteMat(0x18181b));
    chip2.position.set(0.25, 0.03, 0);
    group.add(chip2);

    // Cyan NVMe Aluminum Heatsink Cover
    const heatsink = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.34), metallicMat(0x10b981, 0.3, 0.8));
    heatsink.position.set(0.05, 0.06, 0);
    group.add(heatsink);

    // Gold connector pins
    const goldPins = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.28), goldMat());
    goldPins.position.set(-0.72, 0, 0);
    group.add(goldPins);

    // Green Activity Indicator LED
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), glowMat(0x22c55e, 0.6));
    led.position.set(0.58, 0.08, 0.1);
    group.add(led);
    rgbMeshesRef.current.push(led);

    return group;
  };

  const buildCableModel = (): THREE.Group => {
    const group = new THREE.Group();

    // 24-Pin ATX Connector Head (White Nylon Plug)
    const plugHead = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.35, 1.25), matteMat(0xf8fafc, 0.8, 0.1));
    group.add(plugHead);

    // Locking Clip on side
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.3), matteMat(0xe2e8f0));
    clip.position.set(0.2, 0.05, 0);
    group.add(clip);

    // Braided Cable bundle looping upwards and towards PSU
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(0.4, 0.7, 0.1),
      new THREE.Vector3(1.1, 0.6, 0.3),
      new THREE.Vector3(1.6, 0.3, 0.5)
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.16, 12, false);
    const tubeMat = matteMat(0x1e1b4b, 0.7, 0.2);
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    group.add(tube);

    // Neon Accent cable combs / clips
    [0.3, 0.7].forEach(tVal => {
      const pt = curve.getPoint(tVal);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.03, 8, 16), glowMat(0xec4899, 0.7));
      ring.position.copy(pt);
      group.add(ring);
      rgbMeshesRef.current.push(ring);
    });

    return group;
  };

  // Build Workbench Environment (Table, ESD Mat, PSU, Diagnostics Monitor)
  const buildWorkbench = (): THREE.Group => {
    const group = new THREE.Group();

    // 1. Brushed Gunmetal Desk Surface
    const deskGeo = new THREE.BoxGeometry(11, 0.3, 8);
    const deskMat = matteMat(0x090b10, 0.8, 0.2);
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = -0.2;
    desk.receiveShadow = true;
    group.add(desk);

    // 2. Anti-Static ESD Grid Mat under Motherboard
    const matGeo = new THREE.BoxGeometry(5.2, 0.03, 4.8);
    const matCover = matteMat(0x0f172a, 0.9, 0.1);
    const esdMat = new THREE.Mesh(matGeo, matCover);
    esdMat.position.set(0.1, -0.04, 0);
    esdMat.receiveShadow = true;
    group.add(esdMat);

    // Mat Neon Border Glow
    const border = new THREE.Mesh(new THREE.BoxGeometry(5.24, 0.035, 4.84), glowMat(0x38bdf8, 0.2));
    border.position.set(0.1, -0.042, 0);
    group.add(border);

    // 3. Power Supply Unit (PSU) on Table
    const psuGeo = new THREE.BoxGeometry(1.8, 1.2, 2.0);
    const psuMat = matteMat(0x18181b, 0.6, 0.4);
    const psu = new THREE.Mesh(psuGeo, psuMat);
    psu.position.set(3.4, 0.45, -0.6);
    psu.castShadow = true;
    group.add(psu);

    // PSU Gold 80+ Badge
    const psuBadge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.35), goldMat());
    psuBadge.position.set(2.48, 0.6, -0.6);
    group.add(psuBadge);

    // PSU Fan Grill
    const psuGrill = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 16), metallicMat(0x3f3f46));
    psuGrill.position.set(3.4, 1.06, -0.6);
    group.add(psuGrill);

    // 4. Diagnostic LCD Test Monitor on Stand
    const monStand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 16), metallicMat(0x64748b));
    monStand.position.set(-3.2, 0.6, -1.8);
    group.add(monStand);

    const monFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.12), matteMat(0x18181b));
    monFrame.position.set(-3.2, 1.4, -1.8);
    monFrame.rotation.y = Math.PI / 5;
    group.add(monFrame);

    // Monitor Screen Canvas texture
    const screenGeo = new THREE.BoxGeometry(2.2, 1.2, 0.04);
    const screenMat = glowMat(0x0284c7, 0.15);
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(-3.2, 1.4, -1.74);
    screen.rotation.y = Math.PI / 5;
    group.add(screen);
    monitorScreenMeshRef.current = screen;

    return group;
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070a);
    scene.fog = new THREE.FogExp2(0x06070a, 0.045);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.8, 3.6, 4.4);
    camera.lookAt(0, 0.2, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(getOptimalPixelRatio());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.2, 0);
    controls.minDistance = 2.2;
    controls.maxDistance = 11.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Keep camera strictly above workbench
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(5, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-6, 5, -5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xa855f7, 1.0, 10);
    fillLight.position.set(0, 3, 0);
    scene.add(fillLight);

    // 6. Add Workbench Environment & Motherboard
    const workbench = buildWorkbench();
    scene.add(workbench);
    workbenchGroupRef.current = workbench;

    const motherboard = buildMotherboardBase();
    scene.add(motherboard);

    // 7. Handle Resize with ResizeObserver
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w <= 0 || h <= 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    // 8. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Animate any parts sliding/snapping into place
      animatingMeshesRef.current.forEach((item, partId) => {
        item.progress = Math.min(1.0, item.progress + delta * 2.8);
        // Ease out quad
        const ease = 1 - (1 - item.progress) * (1 - item.progress);
        item.group.position.y = item.startY + (item.targetY - item.startY) * ease;

        if (item.progress >= 1.0) {
          animatingMeshesRef.current.delete(partId);
          soundService.playSnap();
        }
      });

      // If computer is powered on: spin fans & pulse RGB
      if (isPowerOn) {
        if (fanBladeGroupRef.current) {
          fanBladeGroupRef.current.rotation.y += delta * 18.0;
        }
        gpuFansRef.current.forEach(f => {
          f.rotation.z += delta * 14.0;
        });

        // Dynamic RGB wave cycling
        const hue = (elapsed * 0.3) % 1;
        const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
        rgbMeshesRef.current.forEach(mesh => {
          if (mesh.material && 'emissive' in mesh.material) {
            (mesh.material as THREE.MeshStandardMaterial).emissive.copy(color);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9 + Math.sin(elapsed * 4) * 0.3;
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);

      // Project 3D slot positions to 2D screen coordinates for Smartboard touch badges
      if (containerRef.current && cameraRef.current) {
        const widthHalf = containerRef.current.clientWidth / 2;
        const heightHalf = containerRef.current.clientHeight / 2;

        const projected: ProjectedSlot[] = ASSEMBLY_PARTS.map(part => {
          const vector = new THREE.Vector3(...part.slotPos);
          vector.project(camera);
          const isVisible = vector.z < 1.0;
          const screenX = vector.x * widthHalf + widthHalf;
          const screenY = -(vector.y * heightHalf) + heightHalf;

          return {
            partId: part.id,
            name: part.name,
            slotName: part.slotName,
            screenX,
            screenY,
            visible: isVisible,
            installed: installedParts.has(part.id),
            isTarget: selectedPartId === part.id
          };
        });

        setProjectedSlots(projected);
      }
    };

    animate();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [isPowerOn, installedParts, selectedPartId]);

  // Install a component by ID
  const handleInstallPart = (partId: string) => {
    if (installedParts.has(partId)) return;

    const part = ASSEMBLY_PARTS.find(p => p.id === partId);
    if (!part) return;

    // Prerequisite check (e.g. Cooler requires CPU)
    if (part.prerequisiteId && !installedParts.has(part.prerequisiteId)) {
      soundService.playIncorrect();
      setFeedbackToast({
        message: `Dikkat! ${part.name} takılmadan önce ${part.prerequisiteName} sokete yerleştirilmelidir!`,
        type: 'warn'
      });
      return;
    }

    if (!sceneRef.current) return;

    // Build the 3D model
    let model: THREE.Group;
    switch (partId) {
      case 'cpu':
        model = buildCpuModel();
        break;
      case 'cooler':
        model = buildCoolerModel();
        break;
      case 'ram':
        model = buildRamModel();
        break;
      case 'gpu':
        model = buildGpuModel();
        break;
      case 'ssd':
        model = buildSsdModel();
        break;
      case 'cable':
        model = buildCableModel();
        break;
      default:
        model = new THREE.Group();
    }

    // Spawn 1.4 units above target slot for smooth sliding snap animation
    const targetY = part.slotPos[1];
    const startY = targetY + 1.4;
    model.position.set(part.slotPos[0], startY, part.slotPos[2]);
    sceneRef.current.add(model);

    installedMeshesRef.current.set(partId, model);
    animatingMeshesRef.current.set(partId, {
      group: model,
      startY,
      targetY,
      progress: 0
    });

    // Audio snap
    soundService.playSnap();

    // Update state
    setInstalledParts(prev => {
      const next = new Set(prev);
      next.add(partId);
      return next;
    });

    // Inform user with educational feedback
    setFeedbackToast({
      message: `Tebrikler! ${part.name} yerine oturdu. ${part.educationalTip}`,
      type: 'success'
    });

    // Auto-advance to next uninstalled part
    const nextUninstalled = ASSEMBLY_PARTS.find(p => !installedParts.has(p.id) && p.id !== partId);
    if (nextUninstalled) {
      setSelectedPartId(nextUninstalled.id);
    }
  };

  // Click on a 3D slot hotspot badge
  const handleSlotBadgeClick = (slotPartId: string) => {
    soundService.playClick();
    if (installedParts.has(slotPartId)) {
      const part = ASSEMBLY_PARTS.find(p => p.id === slotPartId);
      setFeedbackToast({
        message: `${part?.name} zaten başarıyla takılmış durumda!`,
        type: 'info'
      });
      return;
    }

    // If currently selected matches this slot, install it!
    if (selectedPartId === slotPartId) {
      handleInstallPart(slotPartId);
    } else {
      // User tapped a different slot: select it or warn
      const slotPart = ASSEMBLY_PARTS.find(p => p.id === slotPartId);
      setSelectedPartId(slotPartId);
      setFeedbackToast({
        message: `Bu yuva: ${slotPart?.slotName}. ${slotPart?.name} parçasını seçtin, takmak için dokun!`,
        type: 'info'
      });
    }
  };

  // Camera Presets for Quick Navigation (Akıllı Tahta & Mobile friendly)
  const focusCamera = (preset: 'overview' | 'cpu' | 'ram' | 'gpu') => {
    soundService.playSelect();
    if (!controlsRef.current || !cameraRef.current) return;

    if (preset === 'overview') {
      cameraRef.current.position.set(3.8, 3.6, 4.4);
      controlsRef.current.target.set(0, 0.2, 0);
    } else if (preset === 'cpu') {
      cameraRef.current.position.set(-0.6, 2.2, 1.2);
      controlsRef.current.target.set(-0.65, 0.3, -0.55);
    } else if (preset === 'ram') {
      cameraRef.current.position.set(1.4, 2.0, 1.2);
      controlsRef.current.target.set(0.65, 0.2, -0.45);
    } else if (preset === 'gpu') {
      cameraRef.current.position.set(0.2, 1.8, 2.6);
      controlsRef.current.target.set(0.0, 0.3, 0.45);
    }
  };

  // The Power-On Grand Finale Sequence
  const handlePowerOn = () => {
    if (installedParts.size < ASSEMBLY_PARTS.length || isPowerOn || isPoweringUp) return;

    setIsPoweringUp(true);
    soundService.playPowerHum();

    setFeedbackToast({
      message: '⚡ Güç düğmesine basıldı! Elektrik akımı anakarta iletiliyor...',
      type: 'info'
    });

    // Step 1: Fan spin & RGB wave begins
    setTimeout(() => {
      setIsPowerOn(true);
      setBootLogLines([
        'BOZOK BIOS v2.4 (c) 2026 - Dijital Donanım Lab',
        'Kontrol: LGA CPU [OK] 100%'
      ]);
    }, 400);

    // Step 2: Retro BIOS POST Beep
    setTimeout(() => {
      soundService.playPowerBeep();
      setBootLogLines(prev => [
        ...prev,
        'Kontrol: DDR5 16GB Bellek [OK]',
        'Kontrol: PCI Express x16 GPU [OK]'
      ]);
    }, 1100);

    // Step 3: Fast SSD & Power Check
    setTimeout(() => {
      setBootLogLines(prev => [
        ...prev,
        'Kontrol: M.2 NVMe SSD 1TB [OK]',
        'SİSTEM DURUMU: TÜM BİRİMLER ÇALIŞIYOR!'
      ]);
    }, 1700);

    // Step 4: Celebration Fanfare + Confetti + Certificate
    setTimeout(() => {
      soundService.playCelebration();
      setIsPoweringUp(false);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });

      setFeedbackToast({
        message: '🎉 TEBRİKLER! Bilgisayar başarıyla çalıştı ve BOZOK OS açıldı!',
        type: 'success'
      });

      setShowCertificate(true);
    }, 2400);
  };

  // Reset Assembly to try again
  const handleReset = () => {
    soundService.playClick();
    if (sceneRef.current) {
      installedMeshesRef.current.forEach(mesh => {
        sceneRef.current?.remove(mesh);
      });
    }
    installedMeshesRef.current.clear();
    animatingMeshesRef.current.clear();
    setInstalledParts(new Set());
    setSelectedPartId('cpu');
    setIsPowerOn(false);
    setIsPoweringUp(false);
    setShowCertificate(false);
    setBootLogLines([]);
    focusCamera('overview');

    setFeedbackToast({
      message: 'Montaj masası sıfırlandı! Yeni bir bilgisayar toplamaya hazırsın.',
      type: 'info'
    });
  };

  const progressPercent = Math.round((installedParts.size / ASSEMBLY_PARTS.length) * 100);
  const activeSelectedPart = ASSEMBLY_PARTS.find(p => p.id === selectedPartId) || ASSEMBLY_PARTS[0];

  return (
    <div className={`w-full h-full flex flex-col bg-lab-950 text-slate-100 relative overflow-hidden select-none ${isLargeFont ? 'text-lg' : 'text-base'}`}>
      {/* Top Header Navigation */}
      <header className="flex-shrink-0 bg-lab-950/90 border-b border-zinc-800/80 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundService.playClick();
              onBackToLab();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-lab-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 font-bold text-xs sm:text-sm transition shadow-sm active:scale-95"
            title="Laboratuvar İnceleme Moduna Dön"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Laboratuvara Dön</span>
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                AÇIK TEST MASASI
              </span>
              <span className="hidden md:inline text-xs font-bold text-zinc-400">
                5 & 6. Sınıf Bilişim Teknolojileri
              </span>
            </div>
            <h1 className="text-sm sm:text-base lg:text-lg font-black text-white flex items-center gap-2">
              <span>🛠️ 3D PC Montaj Atölyesi</span>
            </h1>
          </div>
        </div>

        {/* Center Progress Tracker */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-lab-900 border border-zinc-800">
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-bold text-zinc-400">
              Montaj İlerlemesi
            </span>
            <span className="text-xs font-black text-emerald-400">
              {installedParts.size} / {ASSEMBLY_PARTS.length} Parça (%{progressPercent})
            </span>
          </div>
          <div className="w-28 h-2.5 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700/60">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right Tools (Camera, Reset, Sound) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Focus Cameras */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-lab-900 border border-zinc-800 text-xs font-bold">
            <button
              onClick={() => focusCamera('overview')}
              className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Genel Masa Görünümü"
            >
              Masa
            </button>
            <button
              onClick={() => focusCamera('cpu')}
              className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="İşlemci ve Fan Bölgesi"
            >
              CPU
            </button>
            <button
              onClick={() => focusCamera('ram')}
              className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="RAM ve Güç Bölgesi"
            >
              RAM
            </button>
            <button
              onClick={() => focusCamera('gpu')}
              className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Ekran Kartı Bölgesi"
            >
              GPU
            </button>
          </div>

          {/* Reset Assembly */}
          <button
            onClick={handleReset}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-lab-850 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/60 text-xs font-bold transition active:scale-95 flex items-center gap-1.5"
            title="Montajı Baştan Başlat"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Sıfırla</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundService.setSoundEnabled(next);
            }}
            className="p-2 rounded-xl bg-lab-850 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/60 transition"
            title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main 3D Canvas Area */}
      <div className="flex-1 relative min-h-0 w-full overflow-hidden" ref={containerRef}>
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

        {/* Top Educational Feedback Toast Banner */}
        {feedbackToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl pointer-events-auto animate-in fade-in slide-in-from-top duration-300">
            <div
              className={`p-3 sm:p-3.5 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 ${
                feedbackToast.type === 'success'
                  ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-200 shadow-emerald-950/50'
                  : feedbackToast.type === 'warn'
                  ? 'bg-amber-950/85 border-amber-500/50 text-amber-200 shadow-amber-950/50'
                  : 'bg-lab-900/90 border-cyan-500/40 text-cyan-200 shadow-black/60'
              }`}
            >
              <div className="flex-shrink-0">
                {feedbackToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {feedbackToast.type === 'warn' && <AlertCircle className="w-5 h-5 text-amber-400" />}
                {feedbackToast.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
              </div>
              <p className="text-xs sm:text-sm font-semibold flex-1 leading-snug">
                {feedbackToast.message}
              </p>
            </div>
          </div>
        )}

        {/* 3D Projected Touch-Friendly Hotspot Badges on Motherboard */}
        {projectedSlots.map(slot => {
          if (!slot.visible || slot.installed) return null;

          const isTarget = slot.isTarget;
          return (
            <div
              key={slot.partId}
              style={{
                left: `${slot.screenX}px`,
                top: `${slot.screenY}px`,
                transform: 'translate(-50%, -50%)'
              }}
              className="absolute z-10 pointer-events-auto transition-transform"
            >
              <button
                onClick={() => handleSlotBadgeClick(slot.partId)}
                className={`group flex items-center gap-1.5 px-3 py-2 rounded-2xl backdrop-blur-md border text-xs font-black shadow-2xl transition-all duration-300 active:scale-95 ${
                  isTarget
                    ? 'bg-emerald-500 text-zinc-950 border-white scale-110 shadow-[0_0_25px_rgba(16,185,129,0.7)] animate-bounce'
                    : 'bg-lab-900/90 text-zinc-200 border-zinc-700/80 hover:border-emerald-400 hover:scale-105'
                }`}
                title={`${slot.name} yuvasına dokun ve monte et`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="truncate max-w-[150px]">
                  {isTarget ? `👇 BURAYA TAK!` : slot.slotName}
                </span>
              </button>
            </div>
          );
        })}

        {/* 3D Monitor Dynamic Diagnostics Box (Fixed on Left) */}
        {isPowerOn && (
          <div className="absolute top-20 left-4 z-20 pointer-events-none hidden md:block">
            <div className="w-64 p-3 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-cyan-500/40 shadow-2xl font-mono text-[11px] text-cyan-300">
              <div className="flex items-center justify-between pb-1.5 border-b border-cyan-900/60 mb-2 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  BOZOK OS v2.4
                </span>
                <span className="text-[9px] text-cyan-500">CANLI TEST</span>
              </div>
              <div className="space-y-1">
                {bootLogLines.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-emerald-400">›</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating Quick Action Button: Install Current Selected Part */}
        {!installedParts.has(selectedPartId) && (
          <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
            <button
              onClick={() => handleInstallPart(selectedPartId)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm sm:text-base shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 transition"
            >
              <span>{activeSelectedPart.icon}</span>
              <span>{activeSelectedPart.name} Yuvaya Yerleştir</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mobile progress pill */}
        <div className="lg:hidden absolute top-3 right-3 z-20 pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-lab-900/90 border border-zinc-700 text-xs font-bold text-emerald-400 backdrop-blur-md">
            {installedParts.size} / 6 Parça
          </div>
        </div>
      </div>

      {/* Bottom Area: Parça Çantası / Inventory Drawer & Power-On Bar */}
      <footer className="flex-shrink-0 bg-lab-950/95 border-t border-zinc-800/80 p-2.5 sm:p-3.5 z-30">
        {/* If all 6 parts are installed, show the Grand Finale Power-On CTA! */}
        {installedParts.size === ASSEMBLY_PARTS.length ? (
          <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-indigo-950/90 border border-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.35)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl flex-shrink-0 animate-pulse">
                ⚡
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>Tebrikler! Tüm Donanımlar Başarıyla Takıldı</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </h3>
                <p className="text-xs text-zinc-300">
                  Şimdi güç düğmesine basarak sistemi başlatabilir ve test edebilirsin!
                </p>
              </div>
            </div>

            <button
              onClick={handlePowerOn}
              disabled={isPowerOn || isPoweringUp}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-2xl transition-all active:scale-95 ${
                isPowerOn
                  ? 'bg-emerald-600 text-white cursor-default'
                  : isPoweringUp
                  ? 'bg-amber-500 text-zinc-950 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-zinc-950 hover:brightness-110 shadow-[0_0_30px_rgba(16,185,129,0.6)]'
              }`}
            >
              <Zap className="w-5 h-5 text-zinc-950" />
              <span>{isPowerOn ? 'SİSTEM ÇALIŞIYOR ✅' : isPoweringUp ? 'AÇILIYOR...' : 'BİLGİSAYARI ÇALIŞTIR'}</span>
            </button>
          </div>
        ) : (
          /* Normal Inventory: 6 Assembleable Hardware Cards */
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📦</span>
                <span>MONTAJ PARÇA ÇANTASI (Bir parça seç ve anakarttaki yuvaya dokun)</span>
              </span>
              <span className="text-xs font-bold text-zinc-400 hidden sm:inline">
                Seçili: <strong className="text-white">{activeSelectedPart.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-2.5">
              {ASSEMBLY_PARTS.map(part => {
                const isInstalled = installedParts.has(part.id);
                const isSelected = selectedPartId === part.id;

                return (
                  <button
                    key={part.id}
                    onClick={() => {
                      soundService.playClick();
                      setSelectedPartId(part.id);
                      if (!isInstalled) {
                        setFeedbackToast({
                          message: `${part.name} seçildi. ${part.educationalTip}`,
                          type: 'info'
                        });
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 relative overflow-hidden min-h-[72px] sm:min-h-[82px] active:scale-95 ${
                      isInstalled
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : isSelected
                        ? 'bg-lab-800 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/50'
                        : 'bg-lab-900 hover:bg-lab-850 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-lg sm:text-xl">{part.icon}</span>
                      {isInstalled ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          <span>Takıldı</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-lab-850 text-zinc-400 font-bold border border-zinc-700/60">
                          #{part.order}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white truncate">
                        {part.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {part.slotName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </footer>

      {/* Achievement Certificate Modal (After Successful Power-On) */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-3xl bg-lab-900 border border-emerald-500/50 p-6 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.4)] relative flex flex-col items-center text-center">
            {/* Ribbon Badge */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-300 p-0.5 shadow-2xl mb-4">
              <div className="w-full h-full rounded-[22px] bg-lab-950 flex items-center justify-center text-3xl">
                🎓
              </div>
            </div>

            <span className="text-xs font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 mb-2">
              BAŞARI BELGESİ
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
              DİJİTAL DONANIM USTASI
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-sm mb-6 leading-relaxed">
              Tebrikler! 5 & 6. Sınıf Bilişim Teknolojileri ve Yazılım dersi donanım ünitesi kapsamında tüm parçaları doğru yuvalara yerleştirip bilgisayarı başarıyla çalıştırdın.
            </p>

            {/* Hardware Installed Checklist */}
            <div className="w-full bg-lab-950/80 rounded-2xl border border-zinc-800 p-3.5 mb-6 text-left grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>CPU (İşlemci) Soketi</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Soğutucu Fan Montajı</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>DDR5 RAM Yuvası</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>PCIe Ekran Kartı</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>M.2 NVMe SSD</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>24-Pin Güç Bağlantısı</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
              <button
                onClick={() => {
                  soundService.playClick();
                  handleReset();
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-lab-800 hover:bg-zinc-800 text-zinc-200 font-bold text-xs sm:text-sm border border-zinc-700 transition"
              >
                🔄 Yeniden Montaj Yap
              </button>
              <button
                onClick={() => {
                  soundService.playClick();
                  onBackToLab();
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-zinc-950 font-black text-xs sm:text-sm shadow-lg transition"
              >
                🔙 Laboratuvara Dön
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssemblySimulator;
