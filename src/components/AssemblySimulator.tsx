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
  Info,
  Camera
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
  educationalTip: string;
  // Desk position (in front of the motherboard, waiting to be assembled)
  deskPos: [number, number, number];
  // Target motherboard socket position
  slotPos: [number, number, number];
  prerequisiteId?: string;
  prerequisiteName?: string;
}

// 6 Core Hardware Parts positioned in front of motherboard on desk (matching user's reference diagram)
const ASSEMBLY_PARTS: AssemblyPart[] = [
  {
    id: 'cpu',
    order: 1,
    name: 'İşlemci (CPU)',
    role: 'Bilgisayarın Beyni',
    slotName: 'LGA CPU Soketi',
    icon: '🧠',
    educationalTip: 'İşlemciyi soketteki altın üçgen çentiğine göre dikkatlice yerleştiriyoruz. Bilgisayarın tüm hesaplamalarını yapar!',
    deskPos: [-1.8, 0.05, 2.3],
    slotPos: [-0.65, 0.16, -0.45]
  },
  {
    id: 'cooler',
    order: 2,
    name: 'İşlemci Soğutucu Fanı',
    role: 'Termal Soğutma',
    slotName: 'İşlemci Üstü Fan Yuvası',
    icon: '❄️',
    educationalTip: 'İşlemci çalışırken çok ısınır. Soğutucu fan sayesinde işlemci serin kalarak hızlı ve güvenli çalışır!',
    deskPos: [-2.6, 0.25, 2.3],
    slotPos: [-0.65, 0.45, -0.45],
    prerequisiteId: 'cpu',
    prerequisiteName: 'İşlemci (CPU)'
  },
  {
    id: 'ram',
    order: 3,
    name: 'RAM Bellek (DDR)',
    role: 'Geçici Çalışma Hafızası',
    slotName: 'DDR RAM Yuvası',
    icon: '⚡',
    educationalTip: 'RAM çentiğini yuva ile hizalayıp iki ucundan bastırarak mandalların tık diye kilitlenmesini sağlıyoruz!',
    deskPos: [-1.0, 0.35, 2.3],
    slotPos: [1.15, 0.35, -0.35]
  },
  {
    id: 'gpu',
    order: 4,
    name: 'Ekran Kartı (GPU)',
    role: 'Görüntü ve 3D Grafik',
    slotName: 'PCIe x16 Geniş Yuva',
    icon: '🎮',
    educationalTip: 'Ekran kartını anakartın en uzun yuvası olan PCI Express (PCIe) yuvasına takıyoruz. Monitöre görüntü ve oyunları verir!',
    deskPos: [2.1, 0.35, 2.3],
    slotPos: [-0.5, 0.35, 0.45]
  },
  {
    id: 'ssd',
    order: 5,
    name: 'M.2 NVMe SSD',
    role: 'Işık Hızında Kalıcı Depolama',
    slotName: 'M.2 NVMe Yuvası',
    icon: '💾',
    educationalTip: 'M.2 SSD\'yi yuvasına takıp sabitleme vidasını sıkıyoruz. Windows, dosyalar ve tüm oyunlar burada saklanır!',
    deskPos: [1.1, 0.06, 2.3],
    slotPos: [0.4, 0.16, -0.05]
  },
  {
    id: 'cable',
    order: 6,
    name: '24-Pin Güç Bağlantısı',
    role: 'Anakart Ana Elektrik Beslemesi',
    slotName: '24-Pin ATX Güç Girişi',
    icon: '🔌',
    educationalTip: 'Güç kaynağından (PSU) gelen kalın 24-pin ana güç kablosunu takıyoruz. Bilgisayarın kalbine elektrik enerjisi verir!',
    deskPos: [0.1, 0.2, 2.3],
    slotPos: [2.05, 0.28, -0.55]
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

  // Mesh Tracking
  const partMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const animatingPartsRef = useRef<Map<string, { group: THREE.Group; startPos: THREE.Vector3; targetPos: THREE.Vector3; progress: number }>>(new Map());
  const fanBladesRef = useRef<THREE.Group | null>(null);
  const gpuFanRef = useRef<THREE.Group | null>(null);
  const powerLedRef = useRef<THREE.Mesh | null>(null);

  // States
  const [installedParts, setInstalledParts] = useState<Set<string>>(new Set());
  const [selectedPartId, setSelectedPartId] = useState<string>('cpu');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' } | null>({
    message: 'Masada bekleyen donanım parçalarından birine dokun ve anakarttaki parıldayan yuvasına tak!',
    type: 'info'
  });
  const [isPowerOn, setIsPowerOn] = useState<boolean>(false);
  const [isPoweringUp, setIsPoweringUp] = useState<boolean>(false);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [projectedSlots, setProjectedSlots] = useState<ProjectedSlot[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundService.isSoundEnabled());

  // High-DPI Smartboard & 4K optimization
  const getOptimalPixelRatio = () => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const is4K = typeof window !== 'undefined' && (window.innerWidth >= 2400 || window.innerHeight >= 1400);
    return is4K ? Math.min(dpr, 1.25) : Math.min(dpr, 2);
  };

  // Helper Material Factories (Pedagogical, High-Contrast & Clean)
  const pcbGreenMat = () => new THREE.MeshStandardMaterial({ color: 0x5a9e84, roughness: 0.5, metalness: 0.1 });
  const traceWhiteMat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.05 });
  const socketMat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 });
  const goldMat = () => new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 });
  const silverMat = () => new THREE.MeshStandardMaterial({ color: 0xd8e0e8, roughness: 0.25, metalness: 0.85 });
  const darkChipMat = () => new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.3 });
  const glowMat = (color: number) => new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.8,
    roughness: 0.2
  });

  // 1. Build Pedagogical Green Motherboard (Matching User's Reference Image)
  const buildPedagogicalMotherboard = (): THREE.Group => {
    const group = new THREE.Group();
    group.name = 'pedagogical_motherboard';

    // Main Green PCB Board (ATX Size)
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
      tCtx.font = 'bold 54px Arial, sans-serif';
      tCtx.fillText('ANAKART', 15, 75);
      tCtx.font = 'bold 26px Arial, sans-serif';
      tCtx.fillStyle = 'rgba(255,255,255,0.7)';
      tCtx.fillText('MAINBOARD v1.0', 15, 110);
    }
    const textTex = new THREE.CanvasTexture(textCanvas);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.4),
      new THREE.MeshBasicMaterial({ map: textTex, transparent: true })
    );
    labelMesh.rotation.x = -Math.PI / 2;
    labelMesh.position.set(-1.45, 0.085, 1.25);
    group.add(labelMesh);

    // White Circuit Trace Lines on PCB surface (giving distinct motherboard aesthetic)
    const traces = [
      { x: -0.65, z: 0.4, w: 2.2, h: 0.03 },
      { x: 0.2, z: 0.8, w: 0.03, h: 1.2 },
      { x: -1.2, z: -0.8, w: 0.03, h: 1.4 },
      { x: 0.8, z: -0.8, w: 1.4, h: 0.03 },
      { x: 0.4, z: 0.2, w: 1.2, h: 0.03 },
      { x: -1.0, z: 0.1, w: 1.6, h: 0.03 }
    ];
    traces.forEach(tr => {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(tr.w, 0.005, tr.h),
        traceWhiteMat()
      );
      line.position.set(tr.x, 0.082, tr.z);
      group.add(line);
    });

    // CPU Socket Area (Square socket with dark pin grid & silver frame)
    const cpuBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.08, 1.2),
      socketMat(0xf1f5f9)
    );
    cpuBase.position.set(-0.65, 0.08, -0.45);
    group.add(cpuBase);

    // Gold LGA Pin Matrix inside socket
    const pinGrid = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.04, 0.95),
      socketMat(0x27272a)
    );
    pinGrid.position.set(-0.65, 0.12, -0.45);
    group.add(pinGrid);

    const goldCenter = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.05, 0.4),
      goldMat()
    );
    goldCenter.position.set(-0.65, 0.125, -0.45);
    group.add(goldCenter);

    // 4 CPU Cooler Mounting Holes
    [[-1.15, -0.95], [-0.15, -0.95], [-1.15, 0.05], [-0.15, 0.05]].forEach(([hx, hz]) => {
      const hole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.1, 16),
        silverMat()
      );
      hole.position.set(hx, 0.09, hz);
      group.add(hole);
    });

    // 2 Vertical DDR RAM Slots (on the upper right)
    [1.05, 1.28].forEach((rx) => {
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.18, 1.8),
        socketMat(0xfef08a) // Pale ivory / beige slot
      );
      slot.position.set(rx, 0.13, -0.35);
      group.add(slot);

      // White latches on both ends
      [-0.9, 0.9].forEach(lz => {
        const latch = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.22, 0.1),
          socketMat(0xffffff)
        );
        latch.position.set(rx, 0.15, -0.35 + lz);
        group.add(latch);
      });
    });

    // PCIe x16 Expansion Slots (Long horizontal slots with gold contact strip)
    // Slot 1 (Primary for GPU)
    const pcie1 = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.16, 0.14),
      socketMat(0xe2e8f0)
    );
    pcie1.position.set(-0.5, 0.12, 0.45);
    group.add(pcie1);

    const pcie1Lane = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.04, 0.04),
      goldMat()
    );
    pcie1Lane.position.set(-0.5, 0.18, 0.45);
    group.add(pcie1Lane);

    // White retention latch on right end
    const pcieClip = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.2, 0.16),
      socketMat(0xffffff)
    );
    pcieClip.position.set(0.72, 0.14, 0.45);
    group.add(pcieClip);

    // Secondary PCIe Slot (above main slot)
    const pcie2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.14, 0.12),
      socketMat(0xe2e8f0)
    );
    pcie2.position.set(-1.0, 0.11, -0.05);
    group.add(pcie2);

    // Short PCIe x1 Slot
    const pcieX1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.14, 0.12),
      socketMat(0xe2e8f0)
    );
    pcieX1.position.set(0.4, 0.11, -0.05);
    group.add(pcieX1);

    // 24-Pin ATX Power Header (Vertical white block on far right edge)
    const atx24 = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.28, 1.1),
      socketMat(0xffffff)
    );
    atx24.position.set(2.05, 0.18, -0.55);
    group.add(atx24);

    // 4 Blue SATA Ports (Stacked on right edge)
    for (let s = 0; s < 4; s++) {
      const sata = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.18, 0.18),
        socketMat(0x2563eb) // Vibrant Blue
      );
      sata.position.set(2.05, 0.13, 0.2 + s * 0.24);
      group.add(sata);
    }

    // Chipset Aluminum Heatsink (Silver finned block with black central square)
    const chipset = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.25, 0.85),
      silverMat()
    );
    chipset.position.set(1.4, 0.16, 0.55);
    group.add(chipset);

    const chipCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.04, 0.45),
      darkChipMat()
    );
    chipCore.position.set(1.4, 0.29, 0.55);
    group.add(chipCore);

    // Row of Neat Cylindrical Capacitors (Blue/Grey) along top and left
    for (let c = 0; c < 12; c++) {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16),
        socketMat(c % 2 === 0 ? 0x0284c7 : 0x64748b)
      );
      cap.position.set(-1.8 + c * 0.28, 0.15, -2.15);
      group.add(cap);
    }
    for (let c = 0; c < 5; c++) {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16),
        socketMat(0x475569)
      );
      cap.position.set(-1.8, 0.15, -1.8 + c * 0.28);
      group.add(cap);
    }

    // Rear I/O Ports Metal Block (Top left)
    const ioBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.55, 1.6),
      silverMat()
    );
    ioBlock.position.set(-2.0, 0.32, -1.35);
    group.add(ioBlock);

    // CR2032 Round Battery Socket
    const battSocket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24),
      socketMat(0x18181b)
    );
    battSocket.position.set(-1.45, 0.08, 0.7);
    group.add(battSocket);

    // Battery inside socket (Shiny silver coin cell)
    const coinBatt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.06, 24),
      silverMat()
    );
    coinBatt.position.set(-1.45, 0.11, 0.7);
    group.add(coinBatt);

    // Power Indicator LED on Motherboard
    const powerLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.04, 0.06),
      glowMat(0x10b981)
    );
    powerLed.position.set(2.0, 0.1, 1.2);
    group.add(powerLed);
    powerLedRef.current = powerLed;

    return group;
  };

  // 2. Build Components that sit in front of Motherboard on the Desk
  // CPU
  const buildCpuObject = (): THREE.Group => {
    const group = new THREE.Group();
    // Green Substrate
    const sub = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.9), pcbGreenMat());
    group.add(sub);
    // Silver Metal IHS
    const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.72), silverMat());
    ihs.position.y = 0.05;
    group.add(ihs);
    // Gold triangle mark
    const tri = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.04, 3), goldMat());
    tri.position.set(-0.36, 0.08, -0.36);
    tri.rotation.y = Math.PI / 4;
    group.add(tri);
    return group;
  };

  // Cooler Fan
  const buildCoolerObject = (): THREE.Group => {
    const group = new THREE.Group();
    // Aluminum Finned Base
    const finBlock = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), silverMat());
    finBlock.position.y = 0.18;
    group.add(finBlock);

    // Fan Shroud Frame
    const shroud = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 1.25), socketMat(0x334155));
    shroud.position.y = 0.42;
    group.add(shroud);

    // Rotating Fan Hub & Blades
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
    fanBladesRef.current = fanGroup;

    return group;
  };

  // RAM Modülü
  const buildRamObject = (): THREE.Group => {
    const group = new THREE.Group();
    // Turquoise/Cyan heatspreader (as in reference image)
    const stick = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 1.7), socketMat(0x0d9488));
    stick.position.y = 0.24;
    group.add(stick);

    // Top silver accent bar
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 1.72), silverMat());
    topBar.position.y = 0.48;
    group.add(topBar);

    // Gold bottom contacts
    const goldPins = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 1.6), goldMat());
    goldPins.position.y = -0.02;
    group.add(goldPins);

    return group;
  };

  // GPU (Ekran Kartı)
  const buildGpuObject = (): THREE.Group => {
    const group = new THREE.Group();
    // Shroud Body (Grey / Slate with top pink accent line as in reference image)
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 0.35), socketMat(0x64748b));
    body.position.y = 0.38;
    group.add(body);

    const pinkStripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.04, 0.36), socketMat(0xf43f5e));
    pinkStripe.position.y = 0.74;
    group.add(pinkStripe);

    // Fan on GPU front face
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

    // Gold PCIe connector at bottom
    const pcieGold = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.06), goldMat());
    pcieGold.position.set(0, -0.06, 0);
    group.add(pcieGold);

    // Silver Rear Bracket (left)
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.45), silverMat());
    bracket.position.set(-1.08, 0.42, 0);
    group.add(bracket);

    return group;
  };

  // M.2 SSD
  const buildSsdObject = (): THREE.Group => {
    const group = new THREE.Group();
    // Green PCB stick
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.3), pcbGreenMat());
    group.add(pcb);

    // Black NAND Flash chips
    const chip1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.22), darkChipMat());
    chip1.position.set(-0.2, 0.03, 0);
    group.add(chip1);

    const chip2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.22), darkChipMat());
    chip2.position.set(0.25, 0.03, 0);
    group.add(chip2);

    // Gold pins
    const goldPins = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.26), goldMat());
    goldPins.position.set(-0.68, 0, 0);
    group.add(goldPins);

    return group;
  };

  // 24-Pin ATX Cable Connector
  const buildCableObject = (): THREE.Group => {
    const group = new THREE.Group();
    // White 24-Pin plug
    const plug = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 1.1), socketMat(0xffffff));
    group.add(plug);

    // Thick black sleeved cable harness rising up and curving back
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.16, 0),
      new THREE.Vector3(0.3, 0.6, 0.2),
      new THREE.Vector3(0.8, 0.7, 0.4),
      new THREE.Vector3(1.4, 0.5, 0.6)
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.12, 10, false);
    const tube = new THREE.Mesh(tubeGeo, socketMat(0x18181b));
    group.add(tube);

    return group;
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene with Clean Mint / Soft Grey Studio Background (Matching User's Reference Diagram)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd6e5e3); // Clean soft mint-teal studio backdrop
    sceneRef.current = scene;

    // 2. Camera (Clean High-Angle Isometric View)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0.0, 5.2, 5.8);
    camera.lookAt(0, 0.2, 0.2);
    cameraRef.current = camera;

    // 3. Renderer with Soft Studio Shadows
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

    // 4. Orbit Controls (Optimized for Akıllı Tahta & Mobile)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.2, 0.2);
    controls.minDistance = 3.0;
    controls.maxDistance = 14.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    controlsRef.current = controls;

    // 5. Bright Balanced Classroom Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfffbf0, 2.0);
    mainSun.position.set(4, 9, 6);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 1024;
    mainSun.shadow.mapSize.height = 1024;
    mainSun.shadow.bias = -0.0005;
    scene.add(mainSun);

    const skyFill = new THREE.DirectionalLight(0xe0f2fe, 1.0);
    skyFill.position.set(-5, 6, -4);
    scene.add(skyFill);

    // 6. Workbench Table Surface (Clean Light Grey Desk in Foreground)
    const deskGeo = new THREE.BoxGeometry(10, 0.2, 9);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.6,
      metalness: 0.1
    });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = -0.1;
    desk.receiveShadow = true;
    scene.add(desk);

    // 7. Add Pedagogical Motherboard
    const mobo = buildPedagogicalMotherboard();
    scene.add(mobo);

    // 8. Place All 6 Components in their Starting Positions on the Desk in Front of the Motherboard!
    ASSEMBLY_PARTS.forEach(part => {
      let partObj: THREE.Group;
      switch (part.id) {
        case 'cpu':
          partObj = buildCpuObject();
          break;
        case 'cooler':
          partObj = buildCoolerObject();
          break;
        case 'ram':
          partObj = buildRamObject();
          break;
        case 'gpu':
          partObj = buildGpuObject();
          break;
        case 'ssd':
          partObj = buildSsdObject();
          break;
        case 'cable':
          partObj = buildCableObject();
          break;
        default:
          partObj = new THREE.Group();
      }

      // Initial placement: on the desk in front of the motherboard
      partObj.position.set(...part.deskPos);
      scene.add(partObj);
      partMeshesRef.current.set(part.id, partObj);
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

      // Animate any parts sliding from desk into motherboard socket
      animatingPartsRef.current.forEach((item, partId) => {
        item.progress = Math.min(1.0, item.progress + delta * 2.5);
        // Smooth ease-out cubic
        const ease = 1 - Math.pow(1 - item.progress, 3);

        // Arc path (lifts up in the air then lands in slot)
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

      // If powered on: spin CPU cooler fan & GPU fan smoothly
      if (isPowerOn) {
        if (fanBladesRef.current) {
          fanBladesRef.current.rotation.y += delta * 16.0;
        }
        if (gpuFanRef.current) {
          gpuFanRef.current.rotation.z += delta * 14.0;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Project Motherboard Slot 3D Positions to 2D Screen for Hotspot Badges
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

  // Install a Component: It lifts from the desk in front of motherboard and flies into the socket!
  const handleInstallPart = (partId: string) => {
    if (installedParts.has(partId)) return;

    const part = ASSEMBLY_PARTS.find(p => p.id === partId);
    if (!part) return;

    // Prerequisite Check (Cooler requires CPU first)
    if (part.prerequisiteId && !installedParts.has(part.prerequisiteId)) {
      soundService.playIncorrect();
      setFeedbackToast({
        message: `Dikkat! ${part.name} takılmadan önce ${part.prerequisiteName} sokete yerleştirilmelidir!`,
        type: 'warn'
      });
      return;
    }

    const mesh = partMeshesRef.current.get(partId);
    if (!mesh) return;

    // Fly from desk position to socket position
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

    setFeedbackToast({
      message: `Harika! ${part.name} yuvasına yerleşti. ${part.educationalTip}`,
      type: 'success'
    });

    // Auto-select next uninstalled part
    const nextUninstalled = ASSEMBLY_PARTS.find(p => !installedParts.has(p.id) && p.id !== partId);
    if (nextUninstalled) {
      setSelectedPartId(nextUninstalled.id);
    }
  };

  // Click on 3D Slot Hotspot Badge or Desk Part
  const handleSlotBadgeClick = (slotPartId: string) => {
    soundService.playClick();
    if (installedParts.has(slotPartId)) {
      const part = ASSEMBLY_PARTS.find(p => p.id === slotPartId);
      setFeedbackToast({
        message: `${part?.name} zaten başarıyla anakarta takılmış durumda!`,
        type: 'info'
      });
      return;
    }

    if (selectedPartId === slotPartId) {
      handleInstallPart(slotPartId);
    } else {
      const slotPart = ASSEMBLY_PARTS.find(p => p.id === slotPartId);
      setSelectedPartId(slotPartId);
      setFeedbackToast({
        message: `Bu yuva: ${slotPart?.slotName}. ${slotPart?.name} parçasını seçtin, takmak için dokun!`,
        type: 'info'
      });
    }
  };

  // Camera Presets (Akıllı Tahta & Mobile Friendly)
  const focusCamera = (preset: 'overview' | 'cpu' | 'ram' | 'gpu') => {
    soundService.playSelect();
    if (!controlsRef.current || !cameraRef.current) return;

    if (preset === 'overview') {
      cameraRef.current.position.set(0.0, 5.2, 5.8);
      controlsRef.current.target.set(0, 0.2, 0.2);
    } else if (preset === 'cpu') {
      cameraRef.current.position.set(-0.65, 3.2, 2.2);
      controlsRef.current.target.set(-0.65, 0.3, -0.45);
    } else if (preset === 'ram') {
      cameraRef.current.position.set(1.15, 3.2, 2.2);
      controlsRef.current.target.set(1.15, 0.3, -0.35);
    } else if (preset === 'gpu') {
      cameraRef.current.position.set(-0.5, 3.0, 3.0);
      controlsRef.current.target.set(-0.5, 0.3, 0.45);
    }
  };

  // Power On (Grand Finale)
  const handlePowerOn = () => {
    if (installedParts.size < ASSEMBLY_PARTS.length || isPowerOn || isPoweringUp) return;

    setIsPoweringUp(true);
    soundService.playPowerHum();

    setFeedbackToast({
      message: '⚡ Bilgisayar çalıştırılıyor... Güç akımı anakart devrelerine iletiliyor!',
      type: 'info'
    });

    // Phase 1: Fan starts spinning
    setTimeout(() => {
      setIsPowerOn(true);
      if (powerLedRef.current) {
        (powerLedRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
      }
    }, 400);

    // Phase 2: BIOS POST Beep
    setTimeout(() => {
      soundService.playPowerBeep();
    }, 1100);

    // Phase 3: Confetti + Fanfare + Certificate
    setTimeout(() => {
      soundService.playCelebration();
      setIsPoweringUp(false);

      confetti({
        particleCount: 140,
        spread: 100,
        origin: { y: 0.6 }
      });

      setFeedbackToast({
        message: '🎉 TEBRİKLER! Tüm donanımlar başarıyla çalıştı ve sistem açıldı!',
        type: 'success'
      });

      setShowCertificate(true);
    }, 2000);
  };

  // Reset Assembly
  const handleReset = () => {
    soundService.playClick();
    // Return all parts to desk positions
    ASSEMBLY_PARTS.forEach(part => {
      const mesh = partMeshesRef.current.get(part.id);
      if (mesh) {
        mesh.position.set(...part.deskPos);
      }
    });
    animatingPartsRef.current.clear();
    setInstalledParts(new Set());
    setSelectedPartId('cpu');
    setIsPowerOn(false);
    setIsPoweringUp(false);
    setShowCertificate(false);
    focusCamera('overview');

    setFeedbackToast({
      message: 'Masa sıfırlandı! Parçalar önünde hazır bekliyor, yeni bir montaja başlayabilirsin.',
      type: 'info'
    });
  };

  const progressPercent = Math.round((installedParts.size / ASSEMBLY_PARTS.length) * 100);
  const activeSelectedPart = ASSEMBLY_PARTS.find(p => p.id === selectedPartId) || ASSEMBLY_PARTS[0];

  return (
    <div className={`w-full h-full flex flex-col bg-slate-900 text-slate-100 relative overflow-hidden select-none ${isLargeFont ? 'text-lg' : 'text-base'}`}>
      {/* Top Header Navigation */}
      <header className="flex-shrink-0 bg-slate-900/95 border-b border-slate-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundService.playClick();
              onBackToLab();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs sm:text-sm transition shadow-sm active:scale-95"
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
              <span className="hidden md:inline text-xs font-bold text-slate-400">
                5 & 6. Sınıf Bilişim Teknolojileri
              </span>
            </div>
            <h1 className="text-sm sm:text-base lg:text-lg font-black text-white flex items-center gap-2">
              <span>🛠️ 3D Anakart Montaj Atölyesi</span>
            </h1>
          </div>
        </div>

        {/* Center Progress Tracker */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-slate-800/80 border border-slate-700">
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-bold text-slate-400">
              Montaj İlerlemesi
            </span>
            <span className="text-xs font-black text-emerald-400">
              {installedParts.size} / {ASSEMBLY_PARTS.length} Parça (%{progressPercent})
            </span>
          </div>
          <div className="w-28 h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right Tools (Camera Presets, Reset, Sound) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Focus Cameras */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold">
            <button
              onClick={() => focusCamera('overview')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1"
              title="Genel Masa Görünümü"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Masa</span>
            </button>
            <button
              onClick={() => focusCamera('cpu')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="İşlemci ve Fan Bölgesi"
            >
              CPU
            </button>
            <button
              onClick={() => focusCamera('ram')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="RAM Bölgesi"
            >
              RAM
            </button>
            <button
              onClick={() => focusCamera('gpu')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Ekran Kartı Bölgesi"
            >
              GPU
            </button>
          </div>

          {/* Reset Assembly */}
          <button
            onClick={handleReset}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition active:scale-95 flex items-center gap-1.5"
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
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
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
              className={`p-3 sm:p-3.5 rounded-2xl backdrop-blur-xl border shadow-xl flex items-center gap-3 ${
                feedbackToast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200 shadow-emerald-950/50'
                  : feedbackToast.type === 'warn'
                  ? 'bg-amber-950/90 border-amber-500/60 text-amber-200 shadow-amber-950/50'
                  : 'bg-slate-900/90 border-emerald-500/40 text-emerald-200 shadow-black/50'
              }`}
            >
              <div className="flex-shrink-0">
                {feedbackToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {feedbackToast.type === 'warn' && <AlertCircle className="w-5 h-5 text-amber-400" />}
                {feedbackToast.type === 'info' && <Info className="w-5 h-5 text-emerald-400" />}
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
                    : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-emerald-400 hover:scale-105'
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

        {/* Floating Quick Action Button: Install Current Selected Part */}
        {!installedParts.has(selectedPartId) && (
          <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
            <button
              onClick={() => handleInstallPart(selectedPartId)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm sm:text-base shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 transition"
            >
              <span>{activeSelectedPart.icon}</span>
              <span>{activeSelectedPart.name} Yuvaya Tak</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mobile progress pill */}
        <div className="lg:hidden absolute top-3 right-3 z-20 pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-bold text-emerald-400 backdrop-blur-md">
            {installedParts.size} / 6 Parça
          </div>
        </div>
      </div>

      {/* Bottom Area: Parça Çantası / Inventory Drawer & Power-On Bar */}
      <footer className="flex-shrink-0 bg-slate-900/95 border-t border-slate-800 p-2.5 sm:p-3.5 z-30">
        {/* If all 6 parts are installed, show Grand Finale Power-On CTA */}
        {installedParts.size === ASSEMBLY_PARTS.length ? (
          <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-slate-900/90 border border-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.35)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl flex-shrink-0 animate-pulse">
                ⚡
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>Tebrikler! Tüm Donanımlar Başarıyla Takıldı</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-300">
                  Şimdi güç düğmesine basarak bilgisayarı çalıştırabilir ve fanların dönüşünü izleyebilirsin!
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
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📦</span>
                <span>MONTAJ MASASI (Bir parça seç ve anakarttaki parıldayan yuvasına tak)</span>
              </span>
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">
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
                        ? 'bg-slate-800 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/50'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-300'
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
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-400 font-bold border border-slate-700">
                          #{part.order}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white truncate">
                        {part.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
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
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/50 p-6 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.4)] relative flex flex-col items-center text-center">
            {/* Ribbon Badge */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-300 p-0.5 shadow-2xl mb-4">
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-3xl">
                🎓
              </div>
            </div>

            <span className="text-xs font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 mb-2">
              BAŞARI BELGESİ
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
              DİJİTAL DONANIM USTASI
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
              Tebrikler! 5 & 6. Sınıf Bilişim Teknolojileri ve Yazılım dersi donanım ünitesi kapsamında tüm parçaları doğru yuvalara yerleştirip bilgisayarı başarıyla çalıştırdın.
            </p>

            {/* Hardware Installed Checklist */}
            <div className="w-full bg-slate-950/80 rounded-2xl border border-slate-800 p-3.5 mb-6 text-left grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>CPU (İşlemci) Soketi</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Soğutucu Fan Montajı</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>DDR RAM Yuvası</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>PCIe Ekran Kartı</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>M.2 NVMe SSD</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
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
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition"
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
