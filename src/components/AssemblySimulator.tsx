import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import confetti from 'canvas-confetti';
import { soundService } from '../services/sound';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

interface Props {
  onBackToLab: () => void;
  isLargeFont?: boolean;
}

interface AssemblyPart {
  id: string;
  name: string;
  slotName: string;
  info: string;
  // Position on desk in front of the motherboard
  deskPos: [number, number, number];
  // Target slot position on the motherboard
  slotPos: [number, number, number];
  prerequisiteId?: string;
  prerequisiteHint?: string;
}

// 8 Core Hardware Components (Matching a.mp4 video)
const ASSEMBLY_PARTS: AssemblyPart[] = [
  {
    id: 'cpu',
    name: 'İşlemci (CPU)',
    slotName: 'İşlemci soketi',
    info: 'Bilgisayarın beynidir. Bütün işlemleri yapar ve komutları yürütür.',
    deskPos: [-1.9, 0.05, 2.3],
    slotPos: [-0.65, 0.15, -0.45]
  },
  {
    id: 'cooler',
    name: 'İşlemci soğutucusu (Fan)',
    slotName: 'Soğutucu yeri',
    info: 'İşlemci ısınır. Soğutucu ve fan ısıyı dışarı atar. İşlemcinin üstüne takılır.',
    deskPos: [-2.7, 0.25, 2.3],
    slotPos: [-0.65, 0.44, -0.45],
    prerequisiteId: 'cpu',
    prerequisiteHint: 'Soğutucuyu işlemciden sonra takmalısın. Önce işlemciyi sokete yerleştir!'
  },
  {
    id: 'ram1',
    name: 'Bellek (RAM 1)',
    slotName: 'Bellek yuvası',
    info: 'Geçici hafızadır. Bilgisayar açıkken çalışan programların verilerini saklar.',
    deskPos: [-1.3, 0.35, 2.3],
    slotPos: [1.05, 0.32, -0.35]
  },
  {
    id: 'ram2',
    name: 'Bellek (RAM 2)',
    slotName: 'Bellek yuvası',
    info: 'İkinci bellek modülü. Çift kanal çalışarak bilgisayarı daha da hızlandırır.',
    deskPos: [-0.8, 0.35, 2.3],
    slotPos: [1.28, 0.32, -0.35]
  },
  {
    id: 'wifi',
    name: 'Wi-Fi kartı',
    slotName: 'Wi-Fi kartı yuvası',
    info: 'Bilgisayarın kablosuz olarak internete ve yerel ağlara bağlanmasını sağlar.',
    deskPos: [-0.1, 0.22, 2.3],
    slotPos: [0.4, 0.16, -0.05]
  },
  {
    id: 'battery',
    name: 'Pil (CMOS)',
    slotName: 'Pil yuvası',
    info: 'Bilgisayar kapalıyken saat ve tarih ayarını korur.',
    deskPos: [0.5, 0.05, 2.3],
    slotPos: [-1.45, 0.12, 0.7]
  },
  {
    id: 'ssd',
    name: 'SSD',
    slotName: 'SSD yuvası',
    info: 'İşletim sistemini ve dosyaları kalıcı olarak süper hızlı saklayan depolama birimidir.',
    deskPos: [1.2, 0.06, 2.3],
    slotPos: [-1.0, 0.14, -0.05]
  },
  {
    id: 'gpu',
    name: 'Ekran kartı',
    slotName: 'Ekran kartı yuvası',
    info: 'Bilgisayardaki görüntüleri işler ve monitöre aktarır. 3D grafikler ve oyunlar için gereklidir.',
    deskPos: [2.2, 0.35, 2.3],
    slotPos: [-0.5, 0.35, 0.45]
  }
];

// Motherboard Hotspot Labels (for "Etiketleri göster" mode matching a.mp4 at 00:28)
interface BoardLabel {
  name: string;
  pos: [number, number, number];
}

const BOARD_LABELS: BoardLabel[] = [
  { name: 'Giriş çıkış portları', pos: [-2.0, 0.5, -1.35] },
  { name: 'Soğutucu yeri', pos: [-0.65, 0.5, -0.9] },
  { name: 'İşlemci soketi', pos: [-0.65, 0.25, -0.45] },
  { name: 'Wi-Fi kartı yuvası', pos: [0.4, 0.3, -0.05] },
  { name: 'Bellek yuvası', pos: [1.15, 0.4, -0.35] },
  { name: 'Güç soketi', pos: [2.05, 0.3, -0.55] },
  { name: 'SATA portları', pos: [2.05, 0.25, 0.5] },
  { name: 'Yonga seti', pos: [1.4, 0.3, 0.55] },
  { name: 'SSD yuvası', pos: [-1.0, 0.25, -0.05] },
  { name: 'Pil yuvası', pos: [-1.45, 0.2, 0.7] },
  { name: 'Ekran kartı yuvası', pos: [-0.5, 0.25, 0.45] }
];

interface ProjectedLabel {
  name: string;
  screenX: number;
  screenY: number;
  visible: boolean;
}

type FeedbackType = 'correct' | 'wrong' | 'empty' | null;

interface FeedbackModal {
  type: FeedbackType;
  title?: string;
  message: string;
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

  // Mesh & Object References
  const partMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const animatingPartsRef = useRef<Map<string, { group: THREE.Group; startPos: THREE.Vector3; targetPos: THREE.Vector3; progress: number }>>(new Map());
  const coolerFanRef = useRef<THREE.Group | null>(null);
  const gpuFanRef = useRef<THREE.Group | null>(null);

  // Raycasting & Dragging
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5));
  const activeDraggedPartRef = useRef<string | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // State
  const [installedParts, setInstalledParts] = useState<Set<string>>(new Set());
  const [selectedPartInfo, setSelectedPartInfo] = useState<AssemblyPart | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [projectedLabels, setProjectedLabels] = useState<ProjectedLabel[]>([]);
  const [feedback, setFeedback] = useState<FeedbackModal | null>(null);
  const [isPowerOn, setIsPowerOn] = useState<boolean>(false);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundService.isSoundEnabled());

  // High-DPI Smartboard & 4K optimization
  const getOptimalPixelRatio = () => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const is4K = typeof window !== 'undefined' && (window.innerWidth >= 2400 || window.innerHeight >= 1400);
    return is4K ? Math.min(dpr, 1.25) : Math.min(dpr, 2);
  };

  // Helper Material Builders (Pedagogical clean style matching a.mp4)
  const pcbGreenMat = () => new THREE.MeshStandardMaterial({ color: 0x5a9e84, roughness: 0.5, metalness: 0.1 });
  const traceWhiteMat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.05 });
  const socketMat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 });
  const goldMat = () => new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 });
  const silverMat = () => new THREE.MeshStandardMaterial({ color: 0xd8e0e8, roughness: 0.25, metalness: 0.85 });
  const darkChipMat = () => new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.3 });

  // 1. Build Motherboard (Matching a.mp4)
  const buildMotherboard = (): THREE.Group => {
    const group = new THREE.Group();
    group.name = 'pedagogical_motherboard';

    // Green ATX PCB Board
    const pcbGeo = new THREE.BoxGeometry(4.8, 0.08, 4.2);
    const pcb = new THREE.Mesh(pcbGeo, pcbGreenMat());
    pcb.position.set(0, 0.04, -0.4);
    pcb.receiveShadow = true;
    pcb.castShadow = true;
    group.add(pcb);

    // Printed White Text "ANAKART" on bottom left of PCB
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 512;
    textCanvas.height = 128;
    const tCtx = textCanvas.getContext('2d');
    if (tCtx) {
      tCtx.clearRect(0, 0, 512, 128);
      tCtx.fillStyle = '#ffffff';
      tCtx.font = 'bold 52px Arial, sans-serif';
      tCtx.fillText('ANAKART', 20, 75);
      tCtx.font = 'bold 24px Arial, sans-serif';
      tCtx.fillStyle = 'rgba(255,255,255,0.75)';
      tCtx.fillText('MAINBOARD v1.0', 20, 110);
    }
    const textTex = new THREE.CanvasTexture(textCanvas);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.4),
      new THREE.MeshBasicMaterial({ map: textTex, transparent: true })
    );
    labelMesh.rotation.x = -Math.PI / 2;
    labelMesh.position.set(-1.45, 0.085, 1.25);
    group.add(labelMesh);

    // White Circuit Traces on Green PCB
    const traces = [
      { x: -0.65, z: 0.4, w: 2.2, h: 0.03 },
      { x: 0.2, z: 0.8, w: 0.03, h: 1.2 },
      { x: -1.2, z: -0.8, w: 0.03, h: 1.4 },
      { x: 0.8, z: -0.8, w: 1.4, h: 0.03 },
      { x: 0.4, z: 0.2, w: 1.2, h: 0.03 },
      { x: -1.0, z: 0.1, w: 1.6, h: 0.03 }
    ];
    traces.forEach(tr => {
      const line = new THREE.Mesh(new THREE.BoxGeometry(tr.w, 0.005, tr.h), traceWhiteMat());
      line.position.set(tr.x, 0.082, tr.z);
      group.add(line);
    });

    // CPU Socket Area (Square socket with dark pin grid & silver frame)
    const cpuBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 1.2), socketMat(0xf1f5f9));
    cpuBase.position.set(-0.65, 0.08, -0.45);
    group.add(cpuBase);

    const pinGrid = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.95), socketMat(0x27272a));
    pinGrid.position.set(-0.65, 0.12, -0.45);
    group.add(pinGrid);

    const goldCenter = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), goldMat());
    goldCenter.position.set(-0.65, 0.125, -0.45);
    group.add(goldCenter);

    // 4 CPU Cooler Mounting Standoff Holes
    [[-1.15, -0.95], [-0.15, -0.95], [-1.15, 0.05], [-0.15, 0.05]].forEach(([hx, hz]) => {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 16), silverMat());
      hole.position.set(hx, 0.09, hz);
      group.add(hole);
    });

    // 2 Vertical DDR RAM Slots (Upper right)
    [1.05, 1.28].forEach(rx => {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 1.8), socketMat(0xfef08a));
      slot.position.set(rx, 0.13, -0.35);
      group.add(slot);

      [-0.9, 0.9].forEach(lz => {
        const latch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.1), socketMat(0xffffff));
        latch.position.set(rx, 0.15, -0.35 + lz);
        group.add(latch);
      });
    });

    // PCIe x16 Expansion Slot (Long horizontal slot with gold lane)
    const pcie1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.14), socketMat(0xe2e8f0));
    pcie1.position.set(-0.5, 0.12, 0.45);
    group.add(pcie1);

    const pcie1Lane = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.04, 0.04), goldMat());
    pcie1Lane.position.set(-0.5, 0.18, 0.45);
    group.add(pcie1Lane);

    const pcieClip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.16), socketMat(0xffffff));
    pcieClip.position.set(0.72, 0.14, 0.45);
    group.add(pcieClip);

    // Secondary / Short PCIe slots
    const pcie2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.12), socketMat(0xe2e8f0));
    pcie2.position.set(-1.0, 0.11, -0.05);
    group.add(pcie2);

    const pcieX1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.12), socketMat(0xe2e8f0));
    pcieX1.position.set(0.4, 0.11, -0.05);
    group.add(pcieX1);

    // 24-Pin ATX Power Header (White block on far right)
    const atx24 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 1.1), socketMat(0xffffff));
    atx24.position.set(2.05, 0.18, -0.55);
    group.add(atx24);

    // 4 Blue SATA Ports (Stacked on right)
    for (let s = 0; s < 4; s++) {
      const sata = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.18), socketMat(0x2563eb));
      sata.position.set(2.05, 0.13, 0.2 + s * 0.24);
      group.add(sata);
    }

    // Chipset Heatsink (Silver finned block with black square top)
    const chipset = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.85), silverMat());
    chipset.position.set(1.4, 0.16, 0.55);
    group.add(chipset);

    const chipCore = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.45), darkChipMat());
    chipCore.position.set(1.4, 0.29, 0.55);
    group.add(chipCore);

    // Capacitors (Blue & grey cylinders along top and left)
    for (let c = 0; c < 12; c++) {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16),
        socketMat(c % 2 === 0 ? 0x0284c7 : 0x64748b)
      );
      cap.position.set(-1.8 + c * 0.28, 0.15, -2.15);
      group.add(cap);
    }

    // Rear I/O Ports Metal Block (Top left)
    const ioBlock = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 1.6), silverMat());
    ioBlock.position.set(-2.0, 0.32, -1.35);
    group.add(ioBlock);

    // CR2032 Round Battery Socket (Empty base waiting for battery)
    const battSocket = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24), socketMat(0x18181b));
    battSocket.position.set(-1.45, 0.08, 0.7);
    group.add(battSocket);

    return group;
  };

  // 2. Build 3D Components
  // 1. CPU
  const buildCpu = (): THREE.Group => {
    const group = new THREE.Group();
    const sub = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.9), pcbGreenMat());
    group.add(sub);
    const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.72), silverMat());
    ihs.position.y = 0.05;
    group.add(ihs);
    const tri = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.04, 3), goldMat());
    tri.position.set(-0.36, 0.08, -0.36);
    tri.rotation.y = Math.PI / 4;
    group.add(tri);
    return group;
  };

  // 2. Cooler (Fan)
  const buildCooler = (): THREE.Group => {
    const group = new THREE.Group();
    const finBlock = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), silverMat());
    finBlock.position.y = 0.18;
    group.add(finBlock);

    const shroud = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 1.25), socketMat(0x334155));
    shroud.position.y = 0.42;
    group.add(shroud);

    const fanGroup = new THREE.Group();
    fanGroup.position.y = 0.44;

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16), socketMat(0x0284c7));
    fanGroup.add(hub);

    for (let b = 0; b < 7; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.06), socketMat(0x64748b));
      const angle = (b / 7) * Math.PI * 2;
      blade.position.set(Math.cos(angle) * 0.28, 0, Math.sin(angle) * 0.28);
      blade.rotation.y = angle + 0.3;
      fanGroup.add(blade);
    }
    group.add(fanGroup);
    coolerFanRef.current = fanGroup;

    return group;
  };

  // 3 & 4. RAM Modülleri (Turquoise DDR sticks as in a.mp4)
  const buildRam = (): THREE.Group => {
    const group = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 1.7), socketMat(0x0d9488));
    stick.position.y = 0.24;
    group.add(stick);

    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 1.72), silverMat());
    topBar.position.y = 0.48;
    group.add(topBar);

    const goldPins = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 1.6), goldMat());
    goldPins.position.y = -0.02;
    group.add(goldPins);

    return group;
  };

  // 5. Wi-Fi Kartı (Small green card with 2 antennas sticking up as in a.mp4)
  const buildWifi = (): THREE.Group => {
    const group = new THREE.Group();
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.04), pcbGreenMat());
    card.position.y = 0.16;
    group.add(card);

    const goldConn = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.05), goldMat());
    goldConn.position.y = -0.02;
    group.add(goldConn);

    // 2 Antennas pointing upward
    [-0.14, 0.14].forEach(ax => {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8), darkChipMat());
      ant.position.set(ax, 0.5, 0);
      ant.rotation.z = ax < 0 ? 0.25 : -0.25;
      group.add(ant);
    });

    return group;
  };

  // 6. Pil (CR2032 Round Coin Battery)
  const buildBattery = (): THREE.Group => {
    const group = new THREE.Group();
    const batt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 24), silverMat());
    group.add(batt);

    // Printed Text "CR2032 3V" on top
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#d8e0e8';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CR2032', 64, 55);
      ctx.fillText('3V', 64, 85);
    }
    const tex = new THREE.CanvasTexture(canvas);
    const topFace = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), new THREE.MeshBasicMaterial({ map: tex }));
    topFace.rotation.x = -Math.PI / 2;
    topFace.position.y = 0.032;
    group.add(topFace);

    return group;
  };

  // 7. SSD (M.2 NVMe stick with "CTRL" and "NAND" labels as in a.mp4)
  const buildSsd = (): THREE.Group => {
    const group = new THREE.Group();
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.3), pcbGreenMat());
    group.add(pcb);

    const chip1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.22), darkChipMat());
    chip1.position.set(-0.2, 0.03, 0);
    group.add(chip1);

    const chip2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.22), darkChipMat());
    chip2.position.set(0.25, 0.03, 0);
    group.add(chip2);

    const goldPins = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.26), goldMat());
    goldPins.position.set(-0.68, 0, 0);
    group.add(goldPins);

    return group;
  };

  // 8. GPU (Ekran Kartı with pink top accent line and fan as in a.mp4)
  const buildGpu = (): THREE.Group => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 0.35), socketMat(0x64748b));
    body.position.y = 0.38;
    group.add(body);

    const pinkStripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.04, 0.36), socketMat(0xf43f5e));
    pinkStripe.position.y = 0.74;
    group.add(pinkStripe);

    const gpuFan = new THREE.Group();
    gpuFan.position.set(0.3, 0.38, 0.18);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 12, 24), socketMat(0x334155));
    gpuFan.add(rim);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16), socketMat(0x38bdf8));
    hub.rotation.x = Math.PI / 2;
    gpuFan.add(hub);

    for (let b = 0; b < 6; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.02), socketMat(0x1e293b));
      const angle = (b / 6) * Math.PI * 2;
      blade.position.set(Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, 0);
      blade.rotation.z = angle;
      gpuFan.add(blade);
    }
    group.add(gpuFan);
    gpuFanRef.current = gpuFan;

    const pcieGold = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.06), goldMat());
    pcieGold.position.set(0, -0.06, 0);
    group.add(pcieGold);

    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.45), silverMat());
    bracket.position.set(-1.08, 0.42, 0);
    group.add(bracket);

    return group;
  };

  // Main Scene Setup
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene with soft mint/teal background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd6e5e3);
    sceneRef.current = scene;

    // 2. Camera: Isometric view looking down onto the board and desk
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0.0, 5.4, 5.6);
    camera.lookAt(0, 0.2, 0.2);
    cameraRef.current = camera;

    // 3. Renderer with soft shadows
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

    // 4. Orbit Controls (dragging on empty space rotates the board, as in a.mp4)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.2, 0.2);
    controls.minDistance = 3.0;
    controls.maxDistance = 14.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controlsRef.current = controls;

    // 5. Clean Balanced Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfffbf0, 2.0);
    mainLight.position.set(4, 9, 6);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.0);
    fillLight.position.set(-5, 6, -4);
    scene.add(fillLight);

    // 6. Workbench Desk in Foreground
    const deskGeo = new THREE.BoxGeometry(10, 0.2, 9);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6, metalness: 0.1 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = -0.1;
    desk.receiveShadow = true;
    scene.add(desk);

    // 7. Add Pedagogical Motherboard
    const mobo = buildMotherboard();
    scene.add(mobo);

    // 8. Place All 8 Components on the Desk in Front of the Motherboard
    ASSEMBLY_PARTS.forEach(part => {
      let obj: THREE.Group;
      switch (part.id) {
        case 'cpu': obj = buildCpu(); break;
        case 'cooler': obj = buildCooler(); break;
        case 'ram1': obj = buildRam(); break;
        case 'ram2': obj = buildRam(); break;
        case 'wifi': obj = buildWifi(); break;
        case 'battery': obj = buildBattery(); break;
        case 'ssd': obj = buildSsd(); break;
        case 'gpu': obj = buildGpu(); break;
        default: obj = new THREE.Group();
      }

      obj.position.set(...part.deskPos);
      obj.userData = { partId: part.id };
      scene.add(obj);
      partMeshesRef.current.set(part.id, obj);
    });

    // 9. ResizeObserver
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w <= 0 || h <= 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    // 10. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Animate any parts gliding into sockets
      animatingPartsRef.current.forEach((item, partId) => {
        item.progress = Math.min(1.0, item.progress + delta * 2.8);
        const ease = 1 - Math.pow(1 - item.progress, 3);

        const currentX = item.startPos.x + (item.targetPos.x - item.startPos.x) * ease;
        const currentZ = item.startPos.z + (item.targetPos.z - item.startPos.z) * ease;
        const arcY = Math.sin(ease * Math.PI) * 0.8;
        const currentY = item.startPos.y + (item.targetPos.y - item.startPos.y) * ease + arcY;

        item.group.position.set(currentX, currentY, currentZ);

        if (item.progress >= 1.0) {
          animatingPartsRef.current.delete(partId);
          item.group.position.copy(item.targetPos);
          soundService.playSnap();
        }
      });

      // Spin fans when powered on
      if (isPowerOn) {
        if (coolerFanRef.current) {
          coolerFanRef.current.rotation.y += delta * 16.0;
        }
        if (gpuFanRef.current) {
          gpuFanRef.current.rotation.z += delta * 14.0;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Project "Etiketleri Göster" Slot Labels
      if (containerRef.current && cameraRef.current) {
        const widthHalf = containerRef.current.clientWidth / 2;
        const heightHalf = containerRef.current.clientHeight / 2;

        const projected: ProjectedLabel[] = BOARD_LABELS.map(lbl => {
          const vector = new THREE.Vector3(...lbl.pos);
          vector.project(camera);
          const isVisible = vector.z < 1.0;
          const screenX = vector.x * widthHalf + widthHalf;
          const screenY = -(vector.y * heightHalf) + heightHalf;
          return {
            name: lbl.name,
            screenX,
            screenY,
            visible: isVisible
          };
        });
        setProjectedLabels(projected);
      }
    };
    animate();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [isPowerOn]);

  // Pointer Interaction (Drag & Drop + Click to Info)
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // Check hit on any of our 8 part meshes
    const partGroups = Array.from(partMeshesRef.current.values());
    const intersects = raycasterRef.current.intersectObjects(partGroups, true);

    if (intersects.length > 0) {
      let topGroup: THREE.Object3D | null = intersects[0].object;
      while (topGroup && topGroup.parent && !topGroup.userData.partId) {
        topGroup = topGroup.parent;
      }

      if (topGroup && topGroup.userData.partId) {
        const partId = topGroup.userData.partId;
        const part = ASSEMBLY_PARTS.find(p => p.id === partId);
        if (part) {
          soundService.playClick();
          setSelectedPartInfo(part);

          // If not installed, start dragging
          if (!installedParts.has(partId)) {
            activeDraggedPartRef.current = partId;
            isDraggingRef.current = true;
            if (controlsRef.current) controlsRef.current.enabled = false;

            // Lift part slightly while dragging
            topGroup.position.y += 0.3;
          }
        }
      }
    }
  }, [installedParts]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !activeDraggedPartRef.current || !canvasRef.current || !cameraRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const intersectPoint = new THREE.Vector3();
    if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectPoint)) {
      const mesh = partMeshesRef.current.get(activeDraggedPartRef.current);
      if (mesh) {
        mesh.position.set(intersectPoint.x, 0.6, intersectPoint.z);
      }
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (!isDraggingRef.current || !activeDraggedPartRef.current) return;

    const partId = activeDraggedPartRef.current;
    const mesh = partMeshesRef.current.get(partId);
    const part = ASSEMBLY_PARTS.find(p => p.id === partId);

    isDraggingRef.current = false;
    activeDraggedPartRef.current = null;
    if (controlsRef.current) controlsRef.current.enabled = true;

    if (!mesh || !part) return;

    const dropPos = mesh.position;

    // Find closest slot among all 8 slots on the motherboard
    let closestPart: AssemblyPart | null = null;
    let minDistance = Infinity;

    ASSEMBLY_PARTS.forEach(candidate => {
      const slotVec = new THREE.Vector3(...candidate.slotPos);
      const dist = dropPos.distanceTo(slotVec);
      if (dist < minDistance) {
        minDistance = dist;
        closestPart = candidate;
      }
    });

    const SNAP_THRESHOLD = 1.0; // Distance tolerance

    if (minDistance < SNAP_THRESHOLD && closestPart) {
      const targetSlotPart: AssemblyPart = closestPart;

      // 1. Correct Slot!
      if (targetSlotPart.id === part.id || (part.id.startsWith('ram') && targetSlotPart.id.startsWith('ram'))) {
        // Prerequisite check (e.g. Cooler requires CPU)
        if (part.prerequisiteId && !installedParts.has(part.prerequisiteId)) {
          soundService.playIncorrect();
          mesh.position.set(...part.deskPos);
          setFeedback({
            type: 'wrong',
            message: part.prerequisiteHint || 'Soğutucuyu işlemciden sonra takmalısın.'
          });
          return;
        }

        // Install Part!
        soundService.playSnap();
        mesh.position.set(...part.slotPos);

        setInstalledParts(prev => {
          const next = new Set(prev);
          next.add(part.id);
          return next;
        });

        setFeedback({
          type: 'correct',
          message: `Doğru! ${part.name} doğru yuvaya takıldı.`
        });
      } else {
        // 2. Wrong Slot! (Matching a.mp4 red feedback card)
        soundService.playIncorrect();
        mesh.position.set(...part.deskPos);
        setFeedback({
          type: 'wrong',
          message: `Yanlış! Burası ${targetSlotPart.slotName}. ${part.name} buraya takılmaz. Şekle ve boyuta bak!`
        });
      }
    } else {
      // 3. Dropped in Empty Space (Matching a.mp4 blue card)
      soundService.playIncorrect();
      mesh.position.set(...part.deskPos);
      setFeedback({
        type: 'empty',
        message: 'Parçayı bir yuvanın üstüne bırakmalısın.'
      });
    }
  }, [installedParts]);

  // Click on a part's Desk Slot or Card to auto-install (Smartboard Tap Fallback)
  const handleQuickInstall = (partId: string) => {
    if (installedParts.has(partId)) return;
    const part = ASSEMBLY_PARTS.find(p => p.id === partId);
    const mesh = partMeshesRef.current.get(partId);
    if (!part || !mesh) return;

    if (part.prerequisiteId && !installedParts.has(part.prerequisiteId)) {
      soundService.playIncorrect();
      setFeedback({
        type: 'wrong',
        message: part.prerequisiteHint || 'Soğutucuyu işlemciden sonra takmalısın.'
      });
      return;
    }

    const startPos = mesh.position.clone();
    const targetPos = new THREE.Vector3(...part.slotPos);

    animatingPartsRef.current.set(partId, {
      group: mesh,
      startPos,
      targetPos,
      progress: 0
    });

    soundService.playSnap();
    setInstalledParts(prev => {
      const next = new Set(prev);
      next.add(partId);
      return next;
    });

    setFeedback({
      type: 'correct',
      message: `Doğru! ${part.name} doğru yuvaya takıldı.`
    });
  };

  // Check if all 8 parts installed -> Trigger power on & celebration
  useEffect(() => {
    if (installedParts.size === ASSEMBLY_PARTS.length && !isPowerOn) {
      setTimeout(() => {
        setIsPowerOn(true);
        soundService.playPowerBeep();
        soundService.playCelebration();

        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 }
        });

        setShowCertificate(true);
      }, 800);
    }
  }, [installedParts, isPowerOn]);

  // Baştan Başla (Reset)
  const handleReset = () => {
    soundService.playClick();
    ASSEMBLY_PARTS.forEach(part => {
      const mesh = partMeshesRef.current.get(part.id);
      if (mesh) {
        mesh.position.set(...part.deskPos);
      }
    });
    animatingPartsRef.current.clear();
    setInstalledParts(new Set());
    setSelectedPartInfo(null);
    setFeedback(null);
    setIsPowerOn(false);
    setShowCertificate(false);
  };

  return (
    <div className={`w-full h-full flex flex-col bg-[#d6e5e3] text-slate-800 relative overflow-hidden select-none font-sans ${isLargeFont ? 'text-lg' : 'text-base'}`}>
      {/* 1. Header (Matching a.mp4 Top Bar) */}
      <header className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between pointer-events-none">
        {/* Left Side: Title & Action Pills */}
        <div className="flex flex-col gap-2.5 pointer-events-auto">
          {/* Main Title Pill */}
          <div className="px-5 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-sm border border-slate-200/80 inline-flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Anakartı Tamamla!
            </h1>
          </div>

          {/* Buttons: Etiketleri Göster, Baştan Başla, Laboratuvara Dön */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundService.playClick();
                setShowLabels(!showLabels);
              }}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold shadow-sm border transition flex items-center gap-1.5 active:scale-95 ${
                showLabels
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white/90 hover:bg-white text-slate-700 border-slate-200/80'
              }`}
            >
              {showLabels ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showLabels ? 'Etiketleri gizle' : 'Etiketleri göster'}</span>
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-2xl bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Baştan başla</span>
            </button>

            <button
              onClick={() => {
                soundService.playClick();
                onBackToLab();
              }}
              className="px-3 py-2 rounded-2xl bg-white/90 hover:bg-white text-slate-600 border border-slate-200/80 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 flex items-center gap-1"
              title="Laboratuvara Dön"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Laboratuvar</span>
            </button>
          </div>
        </div>

        {/* Right Side: Counter Pill (Takılan: X / 8) & Audio Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md shadow-sm border border-slate-200/80 font-black text-xs sm:text-sm text-slate-900">
            Takılan: <span className="text-emerald-600 font-black">{installedParts.size} / {ASSEMBLY_PARTS.length}</span>
          </div>

          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundService.setSoundEnabled(next);
            }}
            className="p-2 rounded-2xl bg-white/90 hover:bg-white text-slate-600 border border-slate-200/80 shadow-sm transition"
            title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* 2. Top Right Part Info Card (Matching a.mp4 Info Card) */}
      {selectedPartInfo && (
        <div className="absolute top-20 right-4 z-30 w-80 sm:w-88 p-4 rounded-3xl bg-white/95 backdrop-blur-md shadow-xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {selectedPartInfo.name}
            </h3>
            <button
              onClick={() => setSelectedPartInfo(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {selectedPartInfo.info}
          </p>
          {!installedParts.has(selectedPartInfo.id) && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">
                Hedef: {selectedPartInfo.slotName}
              </span>
              <button
                onClick={() => handleQuickInstall(selectedPartInfo.id)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition active:scale-95"
              >
                Yuvaya Tak
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Center Feedback Modal (Matching a.mp4 Correct / Wrong / Empty cards) */}
      {feedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-[90%] max-w-sm pointer-events-auto animate-in zoom-in-95 duration-200">
          <div
            onClick={() => setFeedback(null)}
            className={`p-6 rounded-3xl shadow-2xl text-center text-white cursor-pointer transition-transform hover:scale-102 ${
              feedback.type === 'correct'
                ? 'bg-[#22c55e] border-2 border-emerald-400/50 shadow-emerald-600/30'
                : feedback.type === 'wrong'
                ? 'bg-[#f43f5e] border-2 border-rose-400/50 shadow-rose-600/30'
                : 'bg-[#2563eb] border-2 border-blue-400/50 shadow-blue-600/30'
            }`}
          >
            <p className="text-sm sm:text-base font-black leading-snug whitespace-pre-line">
              {feedback.message}
            </p>
            <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-wider text-white/80 bg-black/10 px-2.5 py-0.5 rounded-full">
              Kapatmak için dokun
            </span>
          </div>
        </div>
      )}

      {/* 4. Main 3D Canvas Area */}
      <div className="flex-1 relative min-h-0 w-full overflow-hidden" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />

        {/* 5. "Etiketleri Göster" Mode: 3D Projected Screen Labels (Matching a.mp4 at 00:28) */}
        {showLabels && projectedLabels.map((lbl, idx) => {
          if (!lbl.visible) return null;
          return (
            <div
              key={idx}
              style={{
                left: `${lbl.screenX}px`,
                top: `${lbl.screenY}px`,
                transform: 'translate(-50%, -50%)'
              }}
              className="absolute z-10 pointer-events-none transition-transform"
            >
              <div className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold shadow-md border border-white/20 whitespace-nowrap">
                {lbl.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Footer (Matching a.mp4 Bottom Instructions) */}
      <footer className="flex-shrink-0 py-2.5 px-4 text-center z-20 pointer-events-none">
        <p className="text-xs sm:text-sm font-bold text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Parçayı sürükleyip doğru yuvaya bırak. Soğutucuyu işlemciden sonra tak. Bilgi için parçaya tıkla. Boş yere sürükleyerek anakartı döndür.
        </p>
      </footer>

      {/* 7. Success Achievement Certificate Modal (When 8/8 Completed) */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl relative flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-3xl mb-3 shadow-inner">
              🎓
            </div>

            <span className="text-[11px] font-black tracking-widest text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-1">
              TEBRİKLER!
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              Anakartı Başarıyla Tamamladın!
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              Tüm 8 donanım birimini (İşlemci, Soğutucu, Bellekler, Ekran Kartı, M.2 SSD, Wi-Fi Kartı ve CMOS Pili) doğru yuvalara yerleştirdin. Bilgisayar çalışmaya hazır!
            </p>

            <div className="flex items-center gap-2.5 w-full">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition"
              >
                🔄 Baştan Başla
              </button>
              <button
                onClick={onBackToLab}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md transition"
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
