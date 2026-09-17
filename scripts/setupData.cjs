const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '../dijital_donanim_laboratuvari_veri.json'), 'utf-8');
const data = JSON.parse(raw);

const hotspotCoords = {
  cpu: {
    core: [0, 0.25, 0],
    contacts: [0, -0.25, 0]
  },
  ram: {
    module: [0.6, 0.2, 0.08],
    contacts: [0, -0.65, 0]
  },
  gpu: {
    chip: [0, 0.2, 0.2],
    fan: [-0.8, 0, 0.4],
    ports: [-1.8, 0, -0.2]
  },
  motherboard: {
    cpu_socket: [-0.5, 0.15, -0.4],
    ram_slots: [0.6, 0.15, -0.4],
    pcie: [0, 0.15, 0.5],
    m2: [0.1, 0.15, 0.1],
    sata: [1.2, 0.15, 0.7],
    power: [1.2, 0.15, -0.8]
  },
  ssd: {
    controller: [-0.4, 0.15, 0],
    nand: [0.4, 0.15, 0],
    interface: [-1.2, 0, 0]
  },
  hdd: {
    platter: [0.3, 0.15, -0.2],
    head: [-0.5, 0.15, 0.4],
    interface: [-1.2, -0.1, 0.5]
  },
  psu: {
    fan: [0, 0.8, 0],
    connectors: [1.1, 0, 0],
    switch: [-1.1, 0, 0]
  }
};

data.hardware.forEach(h => {
  if (hotspotCoords[h.id]) {
    h.hotspots = h.hotspots.map(hs => ({
      ...hs,
      position: hotspotCoords[h.id][hs.id] || [0, 0.3, 0]
    }));
  }
});

const outDir = path.join(__dirname, '../src/data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'defaultData.json'), JSON.stringify(data, null, 2), 'utf-8');

const tsContent = `import type { HardwareDataset } from '../types/hardware';
import defaultRawData from './defaultData.json';

export const initialHardwareData: HardwareDataset = defaultRawData as unknown as HardwareDataset;
`;
fs.writeFileSync(path.join(outDir, 'defaultHardware.ts'), tsContent, 'utf-8');

console.log('Successfully created src/data/defaultData.json and src/data/defaultHardware.ts');
