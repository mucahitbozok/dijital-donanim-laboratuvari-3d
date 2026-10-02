import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { HardwareItem, Hotspot } from '../types/hardware';
import { buildHardwareModel } from '../utils/hardware3dModels';
import { soundService } from '../services/sound';
import {
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Sparkles,
  X,
  Compass
} from 'lucide-react';

interface Props {
  hardware: HardwareItem;
  onSelectHotspot?: (hotspot: Hotspot) => void;
}

interface ProjectedHotspot extends Hotspot {
  screenX: number;
  screenY: number;
  visible: boolean;
}

export const Hardware3DViewer: React.FC<Props> = ({
  hardware,
  onSelectHotspot
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameId = useRef<number>(0);

  // States
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [projectedHotspots, setProjectedHotspots] = useState<ProjectedHotspot[]>([]);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080a);
    scene.fog = new THREE.FogExp2(0x07080a, 0.07);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.2, 2.4, 4.2);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Orbit Controls (Optimized for Touch & Smartboards)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.0;
    controls.maxDistance = 12.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.15; // Don't flip under the floor
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 1.4;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    controlsRef.current = controls;

    // 5. Lighting (Clean High-Contrast Studio Setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    // Key Light (Crisp daylight white)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Rim Light (Clean silver/lavender edge highlight)
    const rimLight = new THREE.DirectionalLight(0xc7d2fe, 0.9);
    rimLight.position.set(-6, 3, -5);
    scene.add(rimLight);

    // Secondary Accent Fill Light (Warm ground bounce)
    const fillLight = new THREE.PointLight(0xffeedd, 0.6, 20);
    fillLight.position.set(0, -2, -3);
    scene.add(fillLight);

    // 6. Pedestal / Tech Floor Grid
    const floorGroup = new THREE.Group();

    // Shadow catcher floor
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.5;
    floor.receiveShadow = true;
    floorGroup.add(floor);

    // Circular Glowing Tech Rings (Subtle graphite and violet)
    const ring1Geo = new THREE.RingGeometry(2.2, 2.24, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x6366f1, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = -1.49;
    floorGroup.add(ring1);

    const ring2Geo = new THREE.RingGeometry(1.6, 1.62, 48);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xa1a1aa, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = -1.49;
    floorGroup.add(ring2);

    scene.add(floorGroup);

    // Handle Window Resizing
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Gentle floating sine wave for the model
      if (modelGroupRef.current) {
        modelGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.08;
      }

      controls.update();
      renderer.render(scene, camera);

      // Project 3D Hotspot Coordinates to 2D Screen
      if (modelGroupRef.current && cameraRef.current && containerRef.current) {
        const modelWorldPos = modelGroupRef.current.position;
        const widthHalf = containerRef.current.clientWidth / 2;
        const heightHalf = containerRef.current.clientHeight / 2;

        const projected: ProjectedHotspot[] = (hardware.hotspots || []).map(hs => {
          const pos = hs.position || [0, 0.3, 0];
          const vector = new THREE.Vector3(
            pos[0] + modelWorldPos.x,
            pos[1] + modelWorldPos.y,
            pos[2] + modelWorldPos.z
          );

          // Check if point is in front of camera
          vector.project(camera);
          const isVisible = vector.z < 1.0;

          const screenX = vector.x * widthHalf + widthHalf;
          const screenY = -(vector.y * heightHalf) + heightHalf;

          return {
            ...hs,
            screenX,
            screenY,
            visible: isVisible
          };
        });

        setProjectedHotspots(projected);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId.current);
      renderer.dispose();
    };
  }, [hardware.hotspots]);

  // Update auto-rotation on controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);

  // Load Model whenever active hardware changes
  useEffect(() => {
    if (!sceneRef.current) return;

    setIsLoadingModel(true);
    setActiveHotspot(null);

    // Remove previous model group
    if (modelGroupRef.current) {
      sceneRef.current.remove(modelGroupRef.current);
      modelGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      modelGroupRef.current = null;
    }

    // Candidate URLs: explicit model3d, or auto-detect in /models/{id}.glb + aliases
    const candidateUrls: string[] = [];
    if (hardware.model3d && hardware.model3d.trim() !== '') {
      candidateUrls.push(hardware.model3d.trim());
    }
    candidateUrls.push(`/models/${hardware.id}.glb`);

    const aliases: Record<string, string[]> = {
      cpu: ['/models/cpu.glb'],
      gpu: ['/models/graphics-card.glb', '/models/graphics_card.glb', '/models/ekran-karti.glb'],
      motherboard: ['/models/motherboard.glb', '/models/anakart.glb', '/models/mainboard.glb'],
      ram: ['/models/ram.glb'],
      ssd: ['/models/storage.glb', '/models/depolama.glb'],
      hdd: ['/models/storage.glb', '/models/hard-drive.glb'],
      psu: ['/models/psu.glb', '/models/power-supply.glb', '/models/power_supply.glb'],
      case: ['/models/computer_case.glb', '/models/kasa.glb', '/models/pc-case.glb'],
      cpu_cooler: ['/models/cooler.glb', '/models/sogutucu.glb'],
      mouse: ['/models/mouse.glb', '/models/fare.glb'],
      keyboard: ['/models/keyboard.glb', '/models/klavye.glb'],
      scanner: ['/models/scanner.glb', '/models/tarayici.glb'],
      webcam: ['/models/web-camera.glb', '/models/webcam.glb'],
      microphone: ['/models/mic.glb', '/models/microphone.glb'],
      mic: ['/models/mic.glb'],
      speaker: ['/models/studio_speaker.glb', '/models/speaker.glb', '/models/hoparlor.glb'],
      monitor: ['/models/monitor.glb', '/models/ekran.glb'],
      printer: ['/models/printer.glb', '/models/yazici.glb'],
      headphones: ['/models/headphones.glb', '/models/kulaklik.glb'],
      cd_dvd: ['/models/cd.glb', '/models/cd_dvd.glb'],
      cd: ['/models/cd.glb'],
      usb_flash: ['/models/usb_flash_drive.glb', '/models/usb.glb', '/models/usb_flash.glb'],
      usb: ['/models/usb_flash_drive.glb'],
      router: ['/models/router.glb'],
      modem: ['/models/router.glb'],
      ethernet_cable: ['/models/ethernet-plug.glb'],
      ethernet_card: ['/models/ethernet-to-pcie.glb']
    };

    if (aliases[hardware.id]) {
      candidateUrls.push(...aliases[hardware.id]);
    }

    const loader = new GLTFLoader();

    function tryLoadUrl(urlIndex: number) {
      if (urlIndex >= candidateUrls.length) {
        loadProcedural();
        return;
      }

      const currentUrl = candidateUrls[urlIndex];
      loader.load(
        currentUrl,
        (gltf) => {
          const loadedModel = gltf.scene;
          loadedModel.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Accurate auto center & scale to fit screen
          const box = new THREE.Box3().setFromObject(loadedModel);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 3.2 / (maxDim || 1);

          loadedModel.scale.set(scale, scale, scale);
          loadedModel.position.set(
            -center.x * scale,
            -center.y * scale,
            -center.z * scale
          );

          modelGroupRef.current = loadedModel;
          sceneRef.current?.add(loadedModel);
          setIsLoadingModel(false);
        },
        undefined,
        () => {
          // If this URL fails, try next candidate or procedural
          tryLoadUrl(urlIndex + 1);
        }
      );
    }

    tryLoadUrl(0);

    function loadProcedural() {
      const proceduralModel = buildHardwareModel(hardware.id);
      modelGroupRef.current = proceduralModel;
      sceneRef.current?.add(proceduralModel);
      setIsLoadingModel(false);
    }

    // Reset camera position smoothly
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(3.2, 2.4, 4.2);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [hardware.id, hardware.model3d]);

  // Camera Position Controls
  const setCameraView = (view: 'front' | 'back' | 'top' | 'isometric') => {
    if (!cameraRef.current || !controlsRef.current) return;
    soundService.playClick();
    setIsAutoRotating(false);

    switch (view) {
      case 'front':
        cameraRef.current.position.set(0, 0.4, 4.5);
        break;
      case 'back':
        cameraRef.current.position.set(0, 0.4, -4.5);
        break;
      case 'top':
        cameraRef.current.position.set(0, 5.0, 0.1);
        break;
      case 'isometric':
        cameraRef.current.position.set(3.2, 2.4, 4.2);
        break;
    }
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current || !controlsRef.current) return;
    soundService.playClick();
    const newDistance = cameraRef.current.position.length() + delta;
    if (newDistance > 2.0 && newDistance < 11.0) {
      cameraRef.current.position.multiplyScalar((cameraRef.current.position.length() + delta) / cameraRef.current.position.length());
      controlsRef.current.update();
    }
  };

  const handleHotspotClick = (hs: Hotspot) => {
    soundService.playSelect();
    setActiveHotspot(hs);
    if (onSelectHotspot) onSelectHotspot(hs);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center bg-radial-vignette overflow-hidden select-none"
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none touch-none"
        title="3D Modeli parmağınızla döndürebilir ve yakınlaştırabilirsiniz"
      />

      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 flex items-center justify-center bg-lab-950/80 backdrop-blur-md z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />
            <span className="text-zinc-200 font-bold text-base tracking-wide">
              Donanım Hazırlanıyor...
            </span>
          </div>
        </div>
      )}

      {/* Floating 3D Interactive Hotspot Markers (Projected onto Screen) */}
      {projectedHotspots.map((hs, index) => {
        if (!hs.visible) return null;
        const isSelected = activeHotspot?.id === hs.id;

        return (
          <div
            key={hs.id}
            style={{
              transform: `translate(${hs.screenX}px, ${hs.screenY}px) translate(-50%, -50%)`,
              position: 'absolute',
              left: 0,
              top: 0
            }}
            className="z-10 pointer-events-auto transition-transform duration-75"
          >
            <button
              onClick={() => handleHotspotClick(hs)}
              className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all focus:outline-none ${
                isSelected
                  ? 'scale-125 bg-amber-400 text-zinc-950 ring-4 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.5)] font-black'
                  : 'bg-zinc-900/90 text-zinc-200 hover:bg-white hover:text-zinc-950 border-2 border-zinc-400/80 shadow-lg hover:scale-110'
              }`}
              title={hs.label}
            >
              {/* Outer pulsing radar ring */}
              <span className="absolute inset-0 rounded-full border border-zinc-400/50 animate-ping opacity-60 pointer-events-none" />
              <span className="font-bold text-sm tracking-tighter">
                {index + 1}
              </span>

              {/* Hover/Touch Tooltip */}
              <span className="absolute bottom-full mb-2 px-3 py-1.5 rounded-lg bg-zinc-900/95 border border-zinc-700 text-zinc-100 text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition pointer-events-none">
                {hs.label}
              </span>
            </button>
          </div>
        );
      })}

      {/* Active Hotspot Educational Info Card (Glassmorphism Popup) */}
      {activeHotspot && (
        <div className="absolute top-6 left-6 right-6 md:right-auto md:max-w-md z-30 animate-fade-in">
          <div className="p-5 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl text-left">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h4 className="text-lg font-bold text-white tracking-wide">
                  {activeHotspot.label}
                </h4>
              </div>
              <button
                onClick={() => setActiveHotspot(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-zinc-200 text-sm leading-relaxed mb-4">
              {activeHotspot.info}
            </p>
            <div className="flex items-center justify-end">
              <button
                onClick={() => setActiveHotspot(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs tracking-wider transition min-h-[44px]"
              >
                ANLADIM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar (Touch & Smartboard First) */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-20 pointer-events-none">
        {/* Left: Camera Angle Presets */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-lab-900/90 backdrop-blur-md border border-zinc-800 shadow-xl pointer-events-auto">
          <button
            onClick={() => setCameraView('top')}
            className="px-3.5 py-2.5 rounded-xl font-semibold text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 active:bg-zinc-700 transition flex items-center gap-1.5 min-h-[48px]"
            title="Üst Görünüm"
          >
            <Compass className="w-4 h-4 text-zinc-400" />
            <span>Üst</span>
          </button>
          <button
            onClick={() => setCameraView('isometric')}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs text-amber-400 hover:bg-amber-400/15 active:bg-amber-400/25 transition min-h-[48px]"
            title="Açıyı Sıfırla"
          >
            Sıfırla
          </button>
        </div>

        {/* Right: Interaction Toggles (Auto-Rotate, Zoom) */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-lab-900/90 backdrop-blur-md border border-zinc-800 shadow-xl pointer-events-auto">
          {/* Auto rotate toggle */}
          <button
            onClick={() => {
              soundService.playClick();
              setIsAutoRotating(!isAutoRotating);
            }}
            className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 min-h-[48px] ${
              isAutoRotating
                ? 'bg-zinc-800 text-white border border-zinc-600'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
            title="Otomatik Dönüşü Başlat / Durdur"
          >
            {isAutoRotating ? <Pause className="w-4 h-4 text-emerald-400" /> : <Play className="w-4 h-4 text-zinc-300" />}
            <span>{isAutoRotating ? 'Dönüşü Durdur' : 'Oto Döndür'}</span>
          </button>

          {/* Zoom In */}
          <button
            onClick={() => handleZoom(-0.8)}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            title="Yaklaştır"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => handleZoom(0.8)}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
