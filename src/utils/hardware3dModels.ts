import * as THREE from 'three';

// Material helpers
const metallicMat = (color: number, roughness = 0.3, metalness = 0.8) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const matteMat = (color: number, roughness = 0.8, metalness = 0.1) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const goldMat = () =>
  new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.9 });

const glowMat = (color: number) =>
  new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.5
  });

/**
 * Procedurally generates realistic 3D hardware models
 */
export function buildHardwareModel(hardwareId: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `model_${hardwareId}`;

  switch (hardwareId) {
    case 'cpu':
      return buildCPU(group);
    case 'ram':
      return buildRAM(group);
    case 'gpu':
      return buildGPU(group);
    case 'motherboard':
      return buildMotherboard(group);
    case 'ssd':
      return buildSSD(group);
    case 'hdd':
      return buildHDD(group);
    case 'psu':
      return buildPSU(group);
    case 'cpu_cooler':
      return buildCooler(group);
    case 'case':
      return buildCase(group);
    case 'keyboard':
      return buildKeyboard(group);
    case 'mouse':
      return buildMouse(group);
    case 'monitor':
      return buildMonitor(group);
    case 'usb_flash':
      return buildUsbFlash(group);
    default:
      return buildGeneric(group, hardwareId);
  }
}

// 1. CPU
function buildCPU(group: THREE.Group): THREE.Group {
  // PCB Substrate (greenish/black)
  const pcbGeo = new THREE.BoxGeometry(2.4, 0.12, 2.4);
  const pcbMat = matteMat(0x1a3322, 0.6, 0.2);
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  pcb.castShadow = true;
  pcb.receiveShadow = true;
  group.add(pcb);

  // Metallic IHS (Integrated Heat Spreader)
  const ihsGeo = new THREE.BoxGeometry(1.8, 0.18, 1.8);
  const ihsMat = metallicMat(0xcccccc, 0.2, 0.85);
  const ihs = new THREE.Mesh(ihsGeo, ihsMat);
  ihs.position.y = 0.14;
  ihs.castShadow = true;
  group.add(ihs);

  // Core raised ridge
  const ridgeGeo = new THREE.BoxGeometry(1.6, 0.05, 1.6);
  const ridgeMat = metallicMat(0x999999, 0.3, 0.8);
  const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
  ridge.position.y = 0.24;
  group.add(ridge);

  // Gold indicator triangle on corner
  const triGeo = new THREE.ConeGeometry(0.12, 0.05, 3);
  const tri = new THREE.Mesh(triGeo, goldMat());
  tri.position.set(-1.0, 0.07, -1.0);
  tri.rotation.y = Math.PI / 4;
  group.add(tri);

  // Bottom golden contact pins / LGA pads
  const pinPlateGeo = new THREE.BoxGeometry(2.1, 0.04, 2.1);
  const pinPlate = new THREE.Mesh(pinPlateGeo, goldMat());
  pinPlate.position.y = -0.07;
  group.add(pinPlate);

  // SMD Capacitors in center bottom
  const smdCenterGeo = new THREE.BoxGeometry(0.7, 0.06, 0.7);
  const smdCenter = new THREE.Mesh(smdCenterGeo, matteMat(0x2a2a2a));
  smdCenter.position.y = -0.08;
  group.add(smdCenter);

  return group;
}

// 2. RAM
function buildRAM(group: THREE.Group): THREE.Group {
  // PCB board (Dark Blue/Black)
  const pcbGeo = new THREE.BoxGeometry(3.6, 0.9, 0.08);
  const pcbMat = matteMat(0x0f1d36, 0.5, 0.2);
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  pcb.castShadow = true;
  group.add(pcb);

  // Golden contact pins on bottom
  const pinGeo = new THREE.BoxGeometry(3.4, 0.16, 0.09);
  const pin = new THREE.Mesh(pinGeo, goldMat());
  pin.position.y = -0.42;
  group.add(pin);

  // Notch in golden pins
  const notchGeo = new THREE.BoxGeometry(0.15, 0.2, 0.12);
  const notch = new THREE.Mesh(notchGeo, matteMat(0x060913));
  notch.position.set(0.2, -0.42, 0);
  group.add(notch);

  // DRAM memory chips (8 chips, 4 on each side)
  const chipGeo = new THREE.BoxGeometry(0.35, 0.45, 0.05);
  const chipMat = matteMat(0x1a1a1a, 0.7, 0.3);

  const xPositions = [-1.3, -0.7, -0.1, 0.6, 1.2];
  xPositions.forEach(x => {
    // Front chip
    const chipF = new THREE.Mesh(chipGeo, chipMat);
    chipF.position.set(x, 0.08, 0.06);
    group.add(chipF);

    // Back chip
    const chipB = new THREE.Mesh(chipGeo, chipMat);
    chipB.position.set(x, 0.08, -0.06);
    group.add(chipB);
  });

  // Metallic Heat Spreader / RGB top bar
  const spreaderGeo = new THREE.BoxGeometry(3.7, 0.35, 0.18);
  const spreaderMat = metallicMat(0x38bdf8, 0.3, 0.7);
  const spreader = new THREE.Mesh(spreaderGeo, spreaderMat);
  spreader.position.y = 0.4;
  group.add(spreader);

  // RGB glowing top strip
  const rgbGeo = new THREE.BoxGeometry(3.6, 0.08, 0.12);
  const rgb = new THREE.Mesh(rgbGeo, glowMat(0x00f0ff));
  rgb.position.y = 0.55;
  group.add(rgb);

  return group;
}

// 3. GPU (Ekran Kartı)
function buildGPU(group: THREE.Group): THREE.Group {
  // Main shroud body
  const shroudGeo = new THREE.BoxGeometry(4.0, 1.8, 0.8);
  const shroudMat = matteMat(0x1e222d, 0.6, 0.4);
  const shroud = new THREE.Mesh(shroudGeo, shroudMat);
  shroud.castShadow = true;
  group.add(shroud);

  // Dual Cooling Fans
  [-1.0, 1.0].forEach(fanX => {
    // Fan rim
    const rimGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.85, 32);
    const rimMat = matteMat(0x111622, 0.8, 0.1);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(fanX, 0, 0.03);
    group.add(rim);

    // Fan center hub
    const hubGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.88, 16);
    const hubMat = metallicMat(0x38bdf8, 0.3, 0.8);
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(fanX, 0, 0.04);
    group.add(hub);

    // Fan blades
    for (let b = 0; b < 7; b++) {
      const bladeGeo = new THREE.BoxGeometry(0.42, 0.08, 0.02);
      const blade = new THREE.Mesh(bladeGeo, matteMat(0x2d3748));
      const angle = (b / 7) * Math.PI * 2;
      blade.position.set(fanX + Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 0.42);
      blade.rotation.z = angle + 0.3;
      group.add(blade);
    }
  });

  // PCIe Gold Connector on bottom
  const pcieGeo = new THREE.BoxGeometry(2.4, 0.22, 0.08);
  const pcie = new THREE.Mesh(pcieGeo, goldMat());
  pcie.position.set(0.2, -1.0, -0.32);
  group.add(pcie);

  // Rear I/O metal bracket (Silver)
  const bracketGeo = new THREE.BoxGeometry(0.1, 2.4, 0.95);
  const bracket = new THREE.Mesh(bracketGeo, metallicMat(0xd1d5db, 0.2, 0.9));
  bracket.position.set(-2.05, 0.1, 0);
  group.add(bracket);

  // Glowing GeForce/Radeon style logo bar
  const logoGeo = new THREE.BoxGeometry(1.6, 0.2, 0.05);
  const logo = new THREE.Mesh(logoGeo, glowMat(0xa855f7));
  logo.position.set(0, 0.85, 0.4);
  group.add(logo);

  return group;
}

// 4. Motherboard (Anakart)
function buildMotherboard(group: THREE.Group): THREE.Group {
  // Main PCB ATX Board
  const pcbGeo = new THREE.BoxGeometry(3.8, 0.1, 3.8);
  const pcbMat = matteMat(0x0c1322, 0.7, 0.3);
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  pcb.castShadow = true;
  pcb.receiveShadow = true;
  group.add(pcb);

  // CPU Socket area
  const socketBaseGeo = new THREE.BoxGeometry(1.3, 0.12, 1.3);
  const socketBase = new THREE.Mesh(socketBaseGeo, matteMat(0x334155));
  socketBase.position.set(-0.5, 0.08, -0.5);
  group.add(socketBase);

  // Socket metal frame & lever
  const frameGeo = new THREE.BoxGeometry(1.1, 0.15, 1.1);
  const frame = new THREE.Mesh(frameGeo, metallicMat(0xcccccc, 0.2, 0.85));
  frame.position.set(-0.5, 0.11, -0.5);
  group.add(frame);

  // 4 RAM DIMM Slots
  [-0.3, -0.1, 0.1, 0.3].forEach((offset, idx) => {
    const slotGeo = new THREE.BoxGeometry(0.12, 0.2, 2.0);
    const slotMat = idx % 2 === 0 ? matteMat(0x0284c7) : matteMat(0x1e293b);
    const slot = new THREE.Mesh(slotGeo, slotMat);
    slot.position.set(0.7 + offset, 0.12, -0.4);
    group.add(slot);
  });

  // VRM Heatsinks near CPU socket (Aluminum Fins)
  const vrm1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.4), metallicMat(0x475569, 0.3, 0.7));
  vrm1.position.set(-1.4, 0.28, -0.5);
  group.add(vrm1);

  const vrm2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.4), metallicMat(0x475569, 0.3, 0.7));
  vrm2.position.set(-0.5, 0.28, -1.4);
  group.add(vrm2);

  // 2 PCIe x16 Slots
  [0.4, 1.2].forEach(zPos => {
    const pcieSlot = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.14), matteMat(0x1e293b));
    pcieSlot.position.set(0, 0.11, zPos);
    group.add(pcieSlot);

    // Silver reinforcement on top slot
    if (zPos === 0.4) {
      const shield = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.19, 0.16), metallicMat(0x94a3b8, 0.2, 0.8));
      shield.position.set(0, 0.11, zPos);
      group.add(shield);
    }
  });

  // M.2 NVMe Slot with Armor Heatsink
  const m2Shield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.4), metallicMat(0x0ea5e9, 0.4, 0.6));
  m2Shield.position.set(0.1, 0.12, 0.0);
  group.add(m2Shield);

  // Chipset Heatsink with glowing logo
  const chipset = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), metallicMat(0x1e293b, 0.3, 0.8));
  chipset.position.set(1.1, 0.18, 0.9);
  group.add(chipset);

  const chipsetLed = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.5), glowMat(0x00f0ff));
  chipsetLed.position.set(1.1, 0.18, 0.9);
  group.add(chipsetLed);

  // SATA Ports
  for (let s = 0; s < 4; s++) {
    const sata = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), matteMat(0x0284c7));
    sata.position.set(1.65, 0.14, 0.4 + s * 0.32);
    group.add(sata);
  }

  // 24-Pin ATX Power Header
  const atxPower = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 1.2), matteMat(0xf8fafc));
  atxPower.position.set(1.65, 0.16, -0.6);
  group.add(atxPower);

  // Rear I/O Shield block
  const ioBlock = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.65, 1.8), metallicMat(0x64748b, 0.3, 0.7));
  ioBlock.position.set(-1.6, 0.35, -0.8);
  group.add(ioBlock);

  return group;
}

// 5. SSD (M.2 NVMe & 2.5" Hybrid Form)
function buildSSD(group: THREE.Group): THREE.Group {
  // 2.5" Solid State Drive enclosure
  const bodyGeo = new THREE.BoxGeometry(2.4, 0.25, 3.4);
  const bodyMat = metallicMat(0x1e293b, 0.4, 0.6);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  // Top metallic brushed label
  const labelGeo = new THREE.BoxGeometry(2.0, 0.02, 2.8);
  const labelMat = metallicMat(0x0f172a, 0.2, 0.8);
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.y = 0.13;
  group.add(label);

  // Cyan high-speed accent stripe
  const stripeGeo = new THREE.BoxGeometry(1.8, 0.03, 0.15);
  const stripe = new THREE.Mesh(stripeGeo, glowMat(0x00f0ff));
  stripe.position.set(0, 0.135, -0.6);
  group.add(stripe);

  // SATA Power & Data Connector pins
  const connBaseGeo = new THREE.BoxGeometry(1.4, 0.14, 0.3);
  const connBase = new THREE.Mesh(connBaseGeo, matteMat(0x0f172a));
  connBase.position.set(-0.2, -0.02, 1.75);
  group.add(connBase);

  const goldPinsGeo = new THREE.BoxGeometry(1.2, 0.05, 0.1);
  const goldPins = new THREE.Mesh(goldPinsGeo, goldMat());
  goldPins.position.set(-0.2, -0.02, 1.88);
  group.add(goldPins);

  // Corner mounting screw holes
  [[-1.0, -1.5], [1.0, -1.5], [-1.0, 1.5], [1.0, 1.5]].forEach(([x, z]) => {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 12), metallicMat(0x94a3b8, 0.2, 0.9));
    screw.position.set(x, 0, z);
    group.add(screw);
  });

  return group;
}

// 6. HDD (Sabit Disk - Şeffaf/Açık İç Mekanizma Görünümü)
function buildHDD(group: THREE.Group): THREE.Group {
  // Heavy cast aluminum base tray
  const baseGeo = new THREE.BoxGeometry(2.6, 0.45, 3.6);
  const baseMat = metallicMat(0x334155, 0.3, 0.7);
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.castShadow = true;
  group.add(base);

  // Internal chamber recess (dark cavity)
  const cavity = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 3.2), matteMat(0x0b1120));
  cavity.position.y = 0.15;
  group.add(cavity);

  // Shiny Magnetic Platters (Dönen Parlak Disk)
  const platterGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.06, 48);
  const platterMat = metallicMat(0xe2e8f0, 0.05, 0.95);
  const platter = new THREE.Mesh(platterGeo, platterMat);
  platter.position.set(0, 0.22, -0.4);
  group.add(platter);

  // Platter Spindle Motor Cap
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24), metallicMat(0x64748b, 0.2, 0.8));
  spindle.position.set(0, 0.26, -0.4);
  group.add(spindle);

  // Read/Write Actuator Arm (Okuma-Yazma Kafası)
  const armPivot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16), metallicMat(0x475569));
  armPivot.position.set(-0.7, 0.24, 0.8);
  group.add(armPivot);

  // Triangular actuator arm extending over the platter
  const armBeam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 1.2), metallicMat(0xc0c0c0, 0.15, 0.9));
  armBeam.position.set(-0.4, 0.26, 0.3);
  armBeam.rotation.y = 0.35;
  group.add(armBeam);

  // Voice coil magnet arc
  const magnet = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.08, 8, 16, Math.PI / 2), metallicMat(0xd4af37, 0.3, 0.8));
  magnet.rotation.x = Math.PI / 2;
  magnet.position.set(-0.8, 0.24, 1.1);
  group.add(magnet);

  // SATA Data/Power pins
  const sata = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.2), matteMat(0x0f172a));
  sata.position.set(-0.4, -0.1, 1.85);
  group.add(sata);

  return group;
}

// 7. PSU (Güç Kaynağı)
function buildPSU(group: THREE.Group): THREE.Group {
  // Main metal box
  const boxGeo = new THREE.BoxGeometry(2.8, 2.0, 2.8);
  const boxMat = matteMat(0x18181b, 0.7, 0.3);
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.castShadow = true;
  group.add(box);

  // Top 120mm Fan Grill
  const grillRim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 12, 32), metallicMat(0x71717a, 0.3, 0.8));
  grillRim.rotation.x = Math.PI / 2;
  grillRim.position.y = 1.02;
  group.add(grillRim);

  // Fan Hub
  const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24), matteMat(0x27272a));
  fanHub.position.y = 1.01;
  group.add(fanHub);

  // Fan blades inside
  for (let b = 0; b < 7; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.2), matteMat(0x3f3f46));
    const angle = (b / 7) * Math.PI * 2;
    blade.position.set(Math.cos(angle) * 0.55, 0.95, Math.sin(angle) * 0.55);
    blade.rotation.y = -angle;
    group.add(blade);
  }

  // AC Power Socket on back
  const acSocket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.1), matteMat(0x09090b));
  acSocket.position.set(-0.7, 0.2, 1.42);
  group.add(acSocket);

  // Red/Black I/O Rocker Switch
  const switchBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.08), matteMat(0xef4444));
  switchBox.position.set(0.4, 0.2, 1.42);
  group.add(switchBox);

  // Side Brand / 80-Plus Gold Spec Plate
  const specPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, 1.8), metallicMat(0x0f172a, 0.4, 0.6));
  specPlate.position.set(1.42, 0, 0);
  group.add(specPlate);

  const goldBadge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.4), goldMat());
  goldBadge.position.set(1.43, 0.2, 0.4);
  group.add(goldBadge);

  // Modular Cable Connectors (Front)
  [-0.6, 0, 0.6].forEach(x => {
    [-0.3, 0.3].forEach(y => {
      const socket = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.1), matteMat(0x27272a));
      socket.position.set(x, y, -1.42);
      group.add(socket);
    });
  });

  return group;
}

// 8. CPU Cooler (İşlemci Soğutucusu)
function buildCooler(group: THREE.Group): THREE.Group {
  // Dense Aluminum Heat Fin Stack
  const fins = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 1.4), metallicMat(0xd1d5db, 0.3, 0.8));
  fins.position.y = 0.5;
  fins.castShadow = true;
  group.add(fins);

  // 4 Copper Heatpipes passing through bottom base
  [-0.6, -0.2, 0.2, 0.6].forEach(x => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 16), metallicMat(0xb45309, 0.2, 0.9));
    pipe.position.set(x, 0.5, 0);
    group.add(pipe);
  });

  // Copper Baseplate
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.6), metallicMat(0xb45309, 0.2, 0.9));
  base.position.y = -0.65;
  group.add(base);

  // RGB Fan mounted on side
  const fanShroud = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.1, 0.3), matteMat(0x1e293b));
  fanShroud.position.set(0, 0.5, 0.85);
  group.add(fanShroud);

  const fanRgb = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 12, 32), glowMat(0x00f0ff));
  fanRgb.position.set(0, 0.5, 0.95);
  group.add(fanRgb);

  return group;
}

// 9. Case (Kasa)
function buildCase(group: THREE.Group): THREE.Group {
  // Tower chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.0, 3.8), matteMat(0x0f172a, 0.6, 0.4));
  chassis.castShadow = true;
  group.add(chassis);

  // Tempered glass transparent side
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.8
  });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.6, 3.4), glassMat);
  glass.position.set(1.02, 0, 0);
  group.add(glass);

  // Front RGB intake strip
  const frontLed = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.4, 0.08), glowMat(0xa855f7));
  frontLed.position.set(0, 0, -1.92);
  group.add(frontLed);

  return group;
}

// 10. Mouse
function buildMouse(group: THREE.Group): THREE.Group {
  // Ergonomic curved body
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 24), matteMat(0x18181b, 0.5, 0.3));
  body.scale.set(0.9, 0.6, 1.4);
  body.castShadow = true;
  group.add(body);

  // Scroll wheel
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16), metallicMat(0x00f0ff, 0.2, 0.8));
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.42, -0.6);
  group.add(wheel);

  // RGB backlight accent
  const rgb = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 24), glowMat(0x38bdf8));
  rgb.rotation.x = Math.PI / 2.5;
  rgb.position.set(0, 0.35, 0.4);
  group.add(rgb);

  return group;
}

// 11. Keyboard
function buildKeyboard(group: THREE.Group): THREE.Group {
  // Keyboard base tray
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 1.8), metallicMat(0x1e293b, 0.4, 0.6));
  base.castShadow = true;
  group.add(base);

  // Key array grid
  for (let r = -2; r <= 2; r++) {
    for (let c = -5; c <= 5; c++) {
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.24), matteMat(0x0f172a, 0.7, 0.2));
      key.position.set(c * 0.36, 0.18, r * 0.32);
      group.add(key);
    }
  }

  // Spacebar
  const spacebar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.24), glowMat(0x00f0ff));
  spacebar.position.set(0, 0.18, 0.68);
  group.add(spacebar);

  return group;
}

// 12. Monitor
function buildMonitor(group: THREE.Group): THREE.Group {
  // Display Screen frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 0.15), matteMat(0x09090b, 0.6, 0.3));
  frame.position.y = 0.5;
  frame.castShadow = true;
  group.add(frame);

  // Display Panel Screen (Glowing Cyber Display)
  const screen = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.0, 0.02), glowMat(0x0284c7));
  screen.position.set(0, 0.5, 0.08);
  group.add(screen);

  // Monitor Stand Neck & Base
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 16), metallicMat(0x64748b, 0.3, 0.8));
  neck.position.set(0, -0.3, -0.2);
  group.add(neck);

  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 24), metallicMat(0x475569, 0.3, 0.8));
  stand.position.set(0, -0.9, -0.1);
  group.add(stand);

  return group;
}

// 13. USB Flash
function buildUsbFlash(group: THREE.Group): THREE.Group {
  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 1.8), metallicMat(0x0ea5e9, 0.3, 0.7));
  body.castShadow = true;
  group.add(body);

  // USB Metal Type-A Connector
  const connector = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.7), metallicMat(0xd1d5db, 0.2, 0.9));
  connector.position.set(0, 0, 1.15);
  group.add(connector);

  // Plastic inside connector
  const plastic = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), glowMat(0x00f0ff));
  plastic.position.set(0, 0.04, 1.15);
  group.add(plastic);

  return group;
}

// Generic hardware model with holographic chip & glowing data lines
function buildGeneric(group: THREE.Group, _id: string): THREE.Group {
  // High tech module container
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 2.4), matteMat(0x0f172a, 0.5, 0.4));
  box.castShadow = true;
  group.add(box);

  // Floating glowing core icon
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), glowMat(0x38bdf8));
  core.position.y = 0.8;
  group.add(core);

  // Orbiting data ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.04, 8, 32), glowMat(0xa855f7));
  ring.rotation.x = Math.PI / 3;
  ring.position.y = 0.8;
  group.add(ring);

  // Gold connector edge
  const connector = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.2), goldMat());
  connector.position.set(0, -0.35, 1.25);
  group.add(connector);

  return group;
}
