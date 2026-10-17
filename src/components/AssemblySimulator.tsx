import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
  Layers,
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
  color: string;
  educationalTip: string;
  modelUrl: string;
  slotPos: [number, number, number];
  targetScale: number;
  rotation: [number, number, number];
  prerequisiteId?: string;
  prerequisiteName?: string;
}

// 6 Core Hardware Components for PC Assembly
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
    modelUrl: '/models/cpu.glb',
    slotPos: [-0.34, 0.49, -1.02],
    targetScale: 0.24,
    rotation: [-Math.PI / 2, 0, 0]
  },
  {
    id: 'cooler',
    order: 2,
    name: 'İşlemci Soğutucu Fanı',
    role: 'Termal Soğutma',
    slotName: 'CPU Üstü Fan Bloğu',
    icon: '❄️',
    color: '#06b6d4',
    educationalTip: 'İşlemci çalışırken çok ısınır. Termal macun ve alüminyum fan bloğu sayesinde işlemci serin kalarak hızlı çalışır!',
    modelUrl: '', // High-fidelity procedural cooler with spinning fan
    slotPos: [-0.34, 0.52, -1.02],
    targetScale: 1.0,
    rotation: [0, 0, 0],
    prerequisiteId: 'cpu',
    prerequisiteName: 'İşlemci (CPU)'
  },
  {
    id: 'ram',
    order: 3,
    name: 'RAM Bellek (DDR5)',
    role: 'Geçici Çalışma Hafızası',
    slotName: 'DDR DIMM Yuvası',
    icon: '⚡',
    color: '#a855f7',
    educationalTip: 'RAM çentiğini yuva ile hizalayıp iki ucundan bastırarak mandalların tık diye kilitlenmesini sağlıyoruz!',
    modelUrl: '/models/ram.glb',
    slotPos: [0.72, 0.58, -1.02],
    targetScale: 0.22,
    rotation: [0, Math.PI / 2, 0]
  },
  {
    id: 'gpu',
    order: 4,
    name: 'Ekran Kartı (GPU)',
    role: 'Görüntü ve 3D Grafik',
    slotName: 'PCI Express x16 Yuvası',
    icon: '🎮',
    color: '#f59e0b',
    educationalTip: 'Ekran kartını anakartın en uzun yuvası olan PCI Express (PCIe) yuvasına takıyoruz. Monitöre görüntü ve oyunları verir!',
    modelUrl: '/models/graphics-card.glb',
    slotPos: [-0.16, 0.58, 0.12],
    targetScale: 0.22,
    rotation: [0, 0, 0]
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
    modelUrl: '/models/storage.glb',
    slotPos: [0.08, 0.48, -0.32],
    targetScale: 0.22,
    rotation: [0, Math.PI / 2, 0]
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
    modelUrl: '', // High-fidelity braided harness cable
    slotPos: [1.48, 0.54, -0.92],
    targetScale: 1.0,
    rotation: [0, 0, 0]
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

  // 3D Object Collections
  const loadedGltfCacheRef = useRef<Map<string, THREE.Group>>(new Map());
  const installedMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const animatingMeshesRef = useRef<Map<string, { group: THREE.Group; startY: number; targetY: number; progress: number }>>(new Map());
  const coolerFanRef = useRef<THREE.Group | null>(null);
  const gpuFansRef = useRef<THREE.Group[]>([]);
  const rgbMeshesRef = useRef<THREE.Mesh[]>([]);

  // Monitor Canvas Texture References
  const monitorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const monitorTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // States
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(10);
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

  // Helper Material Builders
  const metallicMat = (color: number, roughness = 0.2, metalness = 0.9) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const matteMat = (color: number, roughness = 0.7, metalness = 0.15) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const glowMat = (color: number, intensity = 0.8) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.2,
      metalness: 0.5
    });

  // Dynamic Monitor Canvas Renderer (Simulates Real BIOS & OS Boot)
  const updateMonitorDisplay = useCallback((lines: string[], poweredOn: boolean) => {
    if (!monitorCanvasRef.current || !monitorTextureRef.current) return;
    const ctx = monitorCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const w = monitorCanvasRef.current.width;
    const h = monitorCanvasRef.current.height;

    // Background
    if (!poweredOn) {
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 34px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STANDBY / KAPALI', w / 2, h / 2 - 20);
      ctx.fillStyle = '#475569';
      ctx.font = '22px monospace';
      ctx.fillText('Montajı tamamlayıp güç düğmesine basınız.', w / 2, h / 2 + 30);

      // Blinking amber dot
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 + 90, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Powered On: Cyber Blue/Green Terminal
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      // Scanline effect
      ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2);
      }

      // Top BIOS Header Bar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, 70);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('BOZOK UEFI BIOS v2.4 (c) 2026', 25, 45);

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('SİSTEM: ÇALIŞIYOR', w - 25, 45);

      // Content Lines
      ctx.textAlign = 'left';
      lines.forEach((line, idx) => {
        const yPos = 120 + idx * 44;
        ctx.fillStyle = line.includes('[OK]') ? '#4ade80' : line.includes('HATA') ? '#ef4444' : '#94a3b8';
        ctx.font = 'bold 23px monospace';
        ctx.fillText(`> ${line}`, 30, yPos);
      });
    }

    monitorTextureRef.current.needsUpdate = true;
  }, []);

  // Build Procedural High-Fidelity Cooler (Tower Heatsink with 120mm RGB Fan)
  const buildHighEndCooler = (): THREE.Group => {
    const group = new THREE.Group();
    group.name = 'cpu_tower_cooler';

    // 1. Mirror Polished Copper Baseplate
    const baseplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.08, 0.85),
      metallicMat(0xb45309, 0.1, 0.95)
    );
    baseplate.position.y = 0.04;
    group.add(baseplate);

    // 2. 4 U-Shaped Copper Heatpipes
    [-0.24, -0.08, 0.08, 0.24].forEach(hx => {
      const pipeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.85, 12);
      const pipe = new THREE.Mesh(pipeGeo, metallicMat(0xb45309, 0.15, 0.95));
      pipe.position.set(hx, 0.45, 0);
      group.add(pipe);
    });

    // 3. 28 Aluminum Cooling Fin Stack
    for (let f = 0; f < 24; f++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.012, 0.75),
        metallicMat(0xd1d5db, 0.2, 0.85)
      );
      fin.position.set(0, 0.16 + f * 0.028, 0);
      group.add(fin);
    }

    // 4. 120mm RGB Fan Assembly
    const fanFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.98, 0.16),
      matteMat(0x18181b, 0.8, 0.2)
    );
    fanFrame.position.set(0, 0.48, 0.46);
    group.add(fanFrame);

    // RGB Halo Ring
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.03, 16, 32),
      glowMat(0x06b6d4, 0.8)
    );
    halo.position.set(0, 0.48, 0.55);
    group.add(halo);
    rgbMeshesRef.current.push(halo);

    // Rotating Fan Blades Hub
    const fanHub = new THREE.Group();
    fanHub.position.set(0, 0.48, 0.54);

    const centerCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16),
      metallicMat(0x38bdf8, 0.3, 0.8)
    );
    centerCap.rotation.x = Math.PI / 2;
    fanHub.add(centerCap);

    for (let b = 0; b < 9; b++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.05, 0.015),
        matteMat(0x27272a, 0.6, 0.3)
      );
      const angle = (b / 9) * Math.PI * 2;
      blade.position.set(Math.cos(angle) * 0.24, Math.sin(angle) * 0.24, 0);
      blade.rotation.z = angle + 0.35;
      fanHub.add(blade);
    }

    group.add(fanHub);
    coolerFanRef.current = fanHub;

    return group;
  };

  // Build Braided 24-Pin ATX Cable Harness
  const buildBraidedPowerCable = (): THREE.Group => {
    const group = new THREE.Group();

    // 24-Pin Nylon Connector Plug (White)
    const plug = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.28, 1.15),
      matteMat(0xf8fafc, 0.8, 0.1)
    );
    plug.position.y = 0.05;
    group.add(plug);

    // Side latch
    const latch = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.22, 0.25),
      matteMat(0xe2e8f0)
    );
    latch.position.set(0.16, 0.05, 0);
    group.add(latch);

    // 4 Bundles of braided nylon cables curving toward the PSU
    [-0.3, -0.1, 0.1, 0.3].forEach((zOff) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.18, zOff * 0.8),
        new THREE.Vector3(0.35, 0.55, zOff * 0.7),
        new THREE.Vector3(0.9, 0.45, zOff * 0.5),
        new THREE.Vector3(1.4, 0.2, zOff * 0.2)
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.045, 8, false);
      const tubeMat = matteMat(0x18181b, 0.8, 0.1);
      const cable = new THREE.Mesh(tubeGeo, tubeMat);
      group.add(cable);
    });

    // Cable Comb (Clear Acrylic Clip)
    const comb = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.15, 0.65),
      glowMat(0xec4899, 0.5)
    );
    comb.position.set(0.45, 0.52, 0);
    group.add(comb);
    rgbMeshesRef.current.push(comb);

    return group;
  };

  // Build Engineering Open Test Bench Frame
  const buildBenchTable = (): THREE.Group => {
    const group = new THREE.Group();

    // 1. Heavy Anodized Aluminum Top Plate
    const plateGeo = new THREE.BoxGeometry(7.2, 0.18, 5.8);
    const plateMat = matteMat(0x111318, 0.7, 0.5);
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = 0.09;
    plate.receiveShadow = true;
    group.add(plate);

    // 2. 4 Solid Chrome Extrusion Legs
    [
      [-3.3, -2.6],
      [3.3, -2.6],
      [-3.3, 2.6],
      [3.3, 2.6]
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.8, 16),
        metallicMat(0x94a3b8, 0.2, 0.9)
      );
      leg.position.set(lx, -0.3, lz);
      group.add(leg);

      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16),
        matteMat(0x18181b)
      );
      foot.position.set(lx, -0.66, lz);
      group.add(foot);
    });

    // 3. Antistatic ESD Grid Mat with Measurement Marks
    const matGeo = new THREE.BoxGeometry(5.4, 0.02, 4.4);
    const matMat = matteMat(0x0c1322, 0.85, 0.15);
    const esdMat = new THREE.Mesh(matGeo, matMat);
    esdMat.position.set(0, 0.19, 0);
    esdMat.receiveShadow = true;
    group.add(esdMat);

    // Mat Cyan Glowing Perimeter Border
    const border = new THREE.Mesh(
      new THREE.BoxGeometry(5.44, 0.025, 4.44),
      glowMat(0x0284c7, 0.4)
    );
    border.position.set(0, 0.188, 0);
    group.add(border);

    // 4. Brass Motherboard Standoffs (Elevating the board)
    [
      [-1.8, -1.8],
      [1.8, -1.8],
      [-1.8, 1.8],
      [1.8, 1.8],
      [0, -1.8],
      [0, 1.8]
    ].forEach(([sx, sz]) => {
      const standoff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.24, 12),
        metallicMat(0xd4af37, 0.2, 0.9)
      );
      standoff.position.set(sx, 0.31, sz);
      group.add(standoff);
    });

    // 5. Vandal Momentary Power Switch with Glowing Ring (Front of Bench)
    const switchBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.08, 24),
      metallicMat(0xe2e8f0, 0.1, 0.95)
    );
    switchBase.position.set(2.8, 0.22, 2.4);
    group.add(switchBase);

    const switchBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.09, 24),
      metallicMat(0x38bdf8, 0.2, 0.9)
    );
    switchBtn.position.set(2.8, 0.23, 2.4);
    group.add(switchBtn);

    const switchLed = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.015, 12, 24),
      glowMat(0x10b981, 0.9)
    );
    switchLed.rotation.x = Math.PI / 2;
    switchLed.position.set(2.8, 0.27, 2.4);
    group.add(switchLed);
    rgbMeshesRef.current.push(switchLed);

    return group;
  };

  // Preload All 3D GLTF Models on Mount
  useEffect(() => {
    const loader = new GLTFLoader();
    const urlsToLoad = [
      { id: 'motherboard', url: '/models/motherboard.glb' },
      { id: 'cpu', url: '/models/cpu.glb' },
      { id: 'ram', url: '/models/ram.glb' },
      { id: 'gpu', url: '/models/graphics-card.glb' },
      { id: 'storage', url: '/models/storage.glb' },
      { id: 'psu', url: '/models/psu.glb' },
      { id: 'monitor', url: '/models/monitor.glb' }
    ];

    let loadedCount = 0;
    urlsToLoad.forEach(item => {
      loader.load(
        item.url,
        (gltf) => {
          // Enable shadow casting and receiving for all meshes
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          loadedGltfCacheRef.current.set(item.id, gltf.scene);
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / urlsToLoad.length) * 100));

          if (loadedCount >= urlsToLoad.length) {
            setIsLoadingModels(false);
          }
        },
        undefined,
        () => {
          // If a file fails, proceed gracefully
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / urlsToLoad.length) * 100));
          if (loadedCount >= urlsToLoad.length) {
            setIsLoadingModels(false);
          }
        }
      );
    });
  }, []);

  // Main Three.js Scene Setup (Runs once after models are preloaded)
  useEffect(() => {
    if (isLoadingModels || !containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene with Deep OLED Vignette & Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070a);
    scene.fog = new THREE.FogExp2(0x06070a, 0.04);
    sceneRef.current = scene;

    // 2. Camera: Isometric Perspective
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.8, 3.4, 4.4);
    camera.lookAt(0, 0.4, 0);
    cameraRef.current = camera;

    // 3. Renderer with ACESFilmic Tone Mapping (Key for Photorealism!)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(getOptimalPixelRatio());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Orbit Controls (Optimized for Touch & Smartboard)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.4, 0);
    controls.minDistance = 2.2;
    controls.maxDistance = 11.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't clip below workbench
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    controlsRef.current = controls;

    // 5. Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8f0, 2.6);
    keyLight.position.set(4, 9, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    fillLight.position.set(-5, 6, -4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xa855f7, 0.9, 12);
    rimLight.position.set(0, 3.5, 0);
    scene.add(rimLight);

    // 6. Add Engineering Bench Table
    const bench = buildBenchTable();
    scene.add(bench);

    // 7. Add Real 3D Motherboard (`motherboard.glb`)
    const moboGltf = loadedGltfCacheRef.current.get('motherboard');
    if (moboGltf) {
      const moboClone = moboGltf.clone(true);
      // Auto center around origin
      const box = new THREE.Box3().setFromObject(moboClone);
      const center = box.getCenter(new THREE.Vector3());

      const boardWrapper = new THREE.Group();
      moboClone.position.set(-center.x, -center.y, -center.z);
      boardWrapper.add(moboClone);

      // Lay flat on test bench
      boardWrapper.rotation.x = -Math.PI / 2;
      const moboScale = 0.42;
      boardWrapper.scale.set(moboScale, moboScale, moboScale);
      boardWrapper.position.set(0, 0.45, 0);

      scene.add(boardWrapper);
    }

    // 8. Add Real 3D Power Supply Unit (`psu.glb`)
    const psuGltf = loadedGltfCacheRef.current.get('psu');
    if (psuGltf) {
      const psuClone = psuGltf.clone(true);
      const box = new THREE.Box3().setFromObject(psuClone);
      const center = box.getCenter(new THREE.Vector3());

      const psuWrapper = new THREE.Group();
      psuClone.position.set(-center.x, -center.y, -center.z);
      psuWrapper.add(psuClone);

      psuWrapper.scale.set(0.38, 0.38, 0.38);
      psuWrapper.position.set(2.8, 0.65, -0.4);
      scene.add(psuWrapper);
    }

    // 9. Add Real 3D Diagnostic Monitor (`monitor.glb`) with Dynamic Live Canvas Screen
    const monitorCanvas = document.createElement('canvas');
    monitorCanvas.width = 1024;
    monitorCanvas.height = 640;
    monitorCanvasRef.current = monitorCanvas;

    const monitorTexture = new THREE.CanvasTexture(monitorCanvas);
    monitorTexture.colorSpace = THREE.SRGBColorSpace;
    monitorTextureRef.current = monitorTexture;

    // Draw initial standby state
    updateMonitorDisplay([], false);

    const monGltf = loadedGltfCacheRef.current.get('monitor');
    if (monGltf) {
      const monClone = monGltf.clone(true);
      const box = new THREE.Box3().setFromObject(monClone);
      const center = box.getCenter(new THREE.Vector3());

      // Replace screen material with our dynamic canvas texture
      monClone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.name.includes('RenderMonitor') || mesh.name.includes('Screen') || mesh.name.includes('Cube_RenderMonitor')) {
            mesh.material = new THREE.MeshBasicMaterial({
              map: monitorTexture
            });
          }
        }
      });

      const monWrapper = new THREE.Group();
      monClone.position.set(-center.x, -center.y, -center.z);
      monWrapper.add(monClone);

      monWrapper.scale.set(0.12, 0.12, 0.12);
      monWrapper.position.set(-3.2, 0.5, -1.2);
      monWrapper.rotation.y = Math.PI / 4;
      scene.add(monWrapper);
    }

    // 10. ResizeObserver
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

    // 11. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Animate any parts dropping smoothly into sockets
      animatingMeshesRef.current.forEach((item, partId) => {
        item.progress = Math.min(1.0, item.progress + delta * 2.8);
        const ease = 1 - Math.pow(1 - item.progress, 3);
        item.group.position.y = item.startY + (item.targetY - item.startY) * ease;

        if (item.progress >= 1.0) {
          animatingMeshesRef.current.delete(partId);
          soundService.playSnap();
        }
      });

      // If powered on: spin CPU cooler fan & GPU fans, cycle RGB lights
      if (isPowerOn) {
        if (coolerFanRef.current) {
          coolerFanRef.current.rotation.z += delta * 18.0;
        }
        gpuFansRef.current.forEach((fan) => {
          fan.rotation.z += delta * 15.0;
        });

        // Dynamic rainbow RGB wave
        const hue = (elapsed * 0.35) % 1;
        const color = new THREE.Color().setHSL(hue, 0.95, 0.6);
        rgbMeshesRef.current.forEach((mesh) => {
          if (mesh.material && 'emissive' in mesh.material) {
            (mesh.material as THREE.MeshStandardMaterial).emissive.copy(color);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9 + Math.sin(elapsed * 4) * 0.3;
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);

      // Project 3D Slot positions to 2D Screen Coordinates
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
  }, [isLoadingModels, isPowerOn, installedParts, selectedPartId, updateMonitorDisplay]);

  // Install Hardware Component by ID
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

    // Build or clone real 3D model
    let modelGroup: THREE.Group;

    if (partId === 'cooler') {
      modelGroup = buildHighEndCooler();
    } else if (partId === 'cable') {
      modelGroup = buildBraidedPowerCable();
    } else {
      const gltf = loadedGltfCacheRef.current.get(partId === 'ssd' ? 'storage' : partId === 'gpu' ? 'gpu' : partId);
      if (gltf) {
        modelGroup = gltf.clone(true);
        // Normalize center
        const box = new THREE.Box3().setFromObject(modelGroup);
        const center = box.getCenter(new THREE.Vector3());
        modelGroup.position.set(-center.x, -center.y, -center.z);

        const wrapper = new THREE.Group();
        wrapper.add(modelGroup);
        modelGroup = wrapper;
      } else {
        modelGroup = new THREE.Group();
      }
    }

    // Scale and Orient to match socket
    modelGroup.scale.set(part.targetScale, part.targetScale, part.targetScale);
    modelGroup.rotation.set(...part.rotation);

    // Initial floating spawn position for smooth drop animation
    const targetY = part.slotPos[1];
    const startY = targetY + 1.4;
    modelGroup.position.set(part.slotPos[0], startY, part.slotPos[2]);
    sceneRef.current.add(modelGroup);

    installedMeshesRef.current.set(partId, modelGroup);
    animatingMeshesRef.current.set(partId, {
      group: modelGroup,
      startY,
      targetY,
      progress: 0
    });

    // Sound effect
    soundService.playSnap();

    // Update state
    setInstalledParts(prev => {
      const next = new Set(prev);
      next.add(partId);
      return next;
    });

    // Educational Turkish feedback
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

  // Click on 3D Slot Hotspot Badge
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

  // Quick Camera Angles (Optimized for Touch Screen & Smartboard)
  const focusCamera = (preset: 'overview' | 'cpu' | 'ram' | 'gpu') => {
    soundService.playSelect();
    if (!controlsRef.current || !cameraRef.current) return;

    if (preset === 'overview') {
      cameraRef.current.position.set(3.8, 3.4, 4.4);
      controlsRef.current.target.set(0, 0.4, 0);
    } else if (preset === 'cpu') {
      cameraRef.current.position.set(-0.34, 2.2, 0.6);
      controlsRef.current.target.set(-0.34, 0.5, -1.02);
    } else if (preset === 'ram') {
      cameraRef.current.position.set(1.4, 2.0, 0.4);
      controlsRef.current.target.set(0.72, 0.5, -1.02);
    } else if (preset === 'gpu') {
      cameraRef.current.position.set(-0.16, 1.8, 2.0);
      controlsRef.current.target.set(-0.16, 0.5, 0.12);
    }
  };

  // Power On Test (Grand Finale)
  const handlePowerOn = () => {
    if (installedParts.size < ASSEMBLY_PARTS.length || isPowerOn || isPoweringUp) return;

    setIsPoweringUp(true);
    soundService.playPowerHum();

    setFeedbackToast({
      message: '⚡ Güç düğmesine basıldı! Elektrik akımı anakarta iletiliyor...',
      type: 'info'
    });

    // Step 1: Fan spin & RGB wave
    setTimeout(() => {
      setIsPowerOn(true);
      const lines = [
        'BOZOK UEFI BIOS v2.4 (c) 2026',
        'LGA CPU: Intel Core i7 @ 4.90 GHz [OK]',
        'Termal Soğutucu: 1850 RPM AKTİF [OK]'
      ];
      setBootLogLines(lines);
      updateMonitorDisplay(lines, true);
    }, 400);

    // Step 2: Retro BIOS POST Beep
    setTimeout(() => {
      soundService.playPowerBeep();
      const lines = [
        'BOZOK UEFI BIOS v2.4 (c) 2026',
        'LGA CPU: Intel Core i7 @ 4.90 GHz [OK]',
        'Termal Soğutucu: 1850 RPM AKTİF [OK]',
        'DDR5 RAM: 16 GB Dual-Channel [OK]',
        'PCIe GPU: NVIDIA GeForce RTX [OK]'
      ];
      setBootLogLines(lines);
      updateMonitorDisplay(lines, true);
    }, 1100);

    // Step 3: Fast SSD & Power
    setTimeout(() => {
      const lines = [
        'BOZOK UEFI BIOS v2.4 (c) 2026',
        'LGA CPU: Intel Core i7 @ 4.90 GHz [OK]',
        'Termal Soğutucu: 1850 RPM AKTİF [OK]',
        'DDR5 RAM: 16 GB Dual-Channel [OK]',
        'PCIe GPU: NVIDIA GeForce RTX [OK]',
        'M.2 NVMe SSD: 1000 GB Gen4 [OK]',
        'PSU 12V / 5V Güç Beslemesi [OK]',
        'SİSTEM BAŞARIYLA BAŞLATILDI!'
      ];
      setBootLogLines(lines);
      updateMonitorDisplay(lines, true);
    }, 1700);

    // Step 4: Celebration Fanfare + Confetti + Certificate
    setTimeout(() => {
      soundService.playCelebration();
      setIsPoweringUp(false);

      confetti({
        particleCount: 130,
        spread: 100,
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
    updateMonitorDisplay([], false);
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
                Gerçekçi 3D Donanım Montajı
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
              className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition flex items-center gap-1"
              title="Genel Masa Görünümü"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Masa</span>
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

        {/* Loading Overlay while GLB 3D models are downloading */}
        {isLoadingModels && (
          <div className="absolute inset-0 z-40 bg-lab-950/95 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse">
              <Layers className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="flex flex-col items-center text-center max-w-xs">
              <h3 className="text-base font-black text-white mb-1">
                Gerçekçi 3D Parçalar Yükleniyor...
              </h3>
              <p className="text-xs text-zinc-400 mb-3">
                Asus Anakart, Intel CPU, DDR5 RAM ve RTX Ekran Kartı hazırlanıyor
              </p>
              <div className="w-48 h-2 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700/60">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-emerald-400 mt-2">
                %{loadingProgress}
              </span>
            </div>
          </div>
        )}

        {/* Top Educational Feedback Toast Banner */}
        {feedbackToast && !isLoadingModels && (
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
        {!isLoadingModels && projectedSlots.map(slot => {
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

        {/* Live BIOS Diagnostics HUD Overlay (When PC is Powered On) */}
        {isPowerOn && bootLogLines.length > 0 && (
          <div className="absolute top-20 left-4 z-20 pointer-events-none hidden md:block animate-in fade-in slide-in-from-left duration-300">
            <div className="w-72 p-3.5 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-cyan-500/40 shadow-2xl font-mono text-xs text-cyan-300">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-900/60 mb-2 font-bold">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  BOZOK OS CANLI TEST
                </span>
                <span className="text-[10px] text-cyan-400 font-black">UEFI BIOS</span>
              </div>
              <div className="space-y-1.5">
                {bootLogLines.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 leading-tight">
                    <span className="text-emerald-400 font-bold">›</span>
                    <span className={line.includes('[OK]') ? 'text-emerald-300 font-semibold' : 'text-zinc-300'}>
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating Quick Action Button: Install Current Selected Part */}
        {!isLoadingModels && !installedParts.has(selectedPartId) && (
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
        {/* If all 6 parts are installed, show Grand Finale Power-On CTA */}
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
