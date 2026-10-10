import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './RacingGame.css';

const TAU = Math.PI * 2;
const MAPS = [
  { id: 'harbor', name: 'Midnight Harbor', descriptor: 'CITY · NIGHT', rx: 235, rz: 220, ground: '#0d1219', asphalt: '#42454a', sky: '#111b2b', fog: '#253348', fogDensity: 0.00125, sun: '#ffe2c2', accent: '#d9ae55' },
  { id: 'canyon', name: 'Redline Canyon', descriptor: 'DESERT · DUSK', rx: 250, rz: 210, ground: '#8b5835', asphalt: '#4c4945', sky: '#d4865d', fog: '#d9956a', fogDensity: 0.00072, sun: '#fff0d1', accent: '#ffb643' },
  { id: 'alpine', name: 'Alpine Pass', descriptor: 'MOUNTAIN · DAWN', rx: 245, rz: 228, ground: '#9badb4', asphalt: '#41484d', sky: '#9fbdd2', fog: '#a9c4d6', fogDensity: 0.0009, sun: '#e8f5ff', accent: '#8de4ff' },
];

function makeCar(color = '#ff4d28', isPlayer = false) {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color, metalness: 0.72, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12 });
  const carbon = new THREE.MeshStandardMaterial({ color: '#10151b', metalness: 0.65, roughness: 0.38 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#142431', metalness: 0.72, roughness: 0.12, transparent: true, opacity: 0.88, clearcoat: 1 });
  const shellShape = new THREE.Shape();
  shellShape.moveTo(-0.68, -2.08); shellShape.lineTo(0.68, -2.08); shellShape.lineTo(0.91, -1.52);
  shellShape.lineTo(0.94, 0.83); shellShape.lineTo(0.81, 1.66); shellShape.lineTo(0.57, 2.02);
  shellShape.lineTo(-0.57, 2.02); shellShape.lineTo(-0.81, 1.66); shellShape.lineTo(-0.94, 0.83);
  shellShape.lineTo(-0.91, -1.52); shellShape.closePath();
  const shellGeo = new THREE.ExtrudeGeometry(shellShape, { depth: 0.52, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.075, bevelThickness: 0.07 });
  shellGeo.translate(0, 0, -0.26); shellGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(shellGeo, paint); body.position.y = 0.59; car.add(body);
  const cockpitShape = new THREE.Shape();
  cockpitShape.moveTo(-0.92, 0.78); cockpitShape.lineTo(-0.43, 1.39); cockpitShape.quadraticCurveTo(-0.31, 1.46, -0.12, 1.46);
  cockpitShape.lineTo(0.52, 1.43); cockpitShape.quadraticCurveTo(0.68, 1.4, 0.78, 1.28);
  cockpitShape.lineTo(1.34, 0.78); cockpitShape.lineTo(0.95, 0.76); cockpitShape.lineTo(-0.73, 0.76); cockpitShape.closePath();
  const cockpitGeo = new THREE.ExtrudeGeometry(cockpitShape, { depth: 1.32, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.035, bevelThickness: 0.035 });
  cockpitGeo.translate(0, 0, -0.66); cockpitGeo.rotateY(-Math.PI / 2);
  const cockpit = new THREE.Mesh(cockpitGeo, glass); car.add(cockpit);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.07, 0.81), paint); roof.position.set(0, 1.43, 0.11); car.add(roof);
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#101216', roughness: 0.76 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#aeb8c4', metalness: 0.94, roughness: 0.2 });
  const wheelMeshes = [];
  for (const x of [-0.91, 0.91]) for (const z of [-1.33, 1.31]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.24, 28), wheelMat); wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.43, z); car.add(wheel); wheelMeshes.push(wheel);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.255, 20), rimMat); rim.rotation.z = Math.PI / 2; rim.position.set(x * 1.05, 0.43, z); car.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.27, 12), carbon); hub.rotation.z = Math.PI / 2; hub.position.set(x * 1.1, 0.43, z); car.add(hub);
  }
  for (const x of [-0.63, 0.63]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.06), new THREE.MeshBasicMaterial({ color: '#ebfaff' })); head.position.set(x, 0.75, -2.03); car.add(head);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.075, 0.06), new THREE.MeshBasicMaterial({ color: '#ff263c' })); tail.position.set(x * 0.8, 0.75, 2.02); car.add(tail);
  }
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.12, 0.31), carbon); wing.position.set(0, 1.18, 1.78); car.add(wing);
  for (const x of [-0.61, 0.61]) { const support = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), carbon); support.position.set(x, 1.02, 1.65); car.add(support); }
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.16, 0.28), carbon); diffuser.position.set(0, 0.34, 1.82); car.add(diffuser);
  for (const x of [-0.81, 0.81]) { const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 2.35), carbon); skirt.position.set(x, 0.37, 0); car.add(skirt); }
  const flames = [-0.4, 0.4].map((x, i) => {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(i ? 0.2 : 0.17, 1.25, 8), new THREE.MeshBasicMaterial({ color: i ? '#20e6ff' : '#ffbe42', transparent: true, opacity: 0.92 }));
    flame.rotation.x = Math.PI / 2; flame.position.set(x, 0.48, 2.1); flame.visible = false; car.add(flame); return flame;
  });
  car.userData.wheels = wheelMeshes;
  car.userData.nitroFlames = flames;
  car.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return car;
}

function trackPoint(angle, track) {
  const { rx, rz } = track;
  const c = Math.cos(angle), s = Math.sin(angle);
  if (track.id === 'canyon') return { x: rx * c + 36 * Math.sin(2 * angle), z: rz * s + 18 * Math.sin(2 * angle) };
  if (track.id === 'alpine') return { x: rx * c * (1 + 0.15 * Math.cos(2 * angle)) + 21 * Math.sin(3 * angle), z: rz * s * (1 + 0.12 * Math.cos(2 * angle)) };
  return { x: rx * c, z: rz * s };
}

function trackFrame(angle, lane, track) {
  const step = 0.002, point = trackPoint(angle, track), before = trackPoint(angle - step, track), after = trackPoint(angle + step, track);
  let tx = (after.x - before.x) / (2 * step), tz = (after.z - before.z) / (2 * step);
  const magnitude = Math.hypot(tx, tz) || 1; tx /= magnitude; tz /= magnitude;
  const d2x = (after.x - 2 * point.x + before.x) / (step * step), d2z = (after.z - 2 * point.z + before.z) / (step * step);
  const curvature = Math.abs(tx * d2z - tz * d2x) / magnitude ** 2;
  const radius = curvature > 1e-5 ? 1 / curvature : 1000;
  return { x: point.x + tz * lane, z: point.z - tx * lane, tx, tz, radius };
}

function makeTrackMetrics(track) {
  const count = 1024, distances = new Float64Array(count + 1);
  let previous = trackPoint(0, track);
  for (let i = 1; i <= count; i++) {
    const point = trackPoint(i / count * TAU, track);
    distances[i] = distances[i - 1] + Math.hypot(point.x - previous.x, point.z - previous.z);
    previous = point;
  }
  return {
    length: distances[count],
    distanceAt(angle) {
      const sample = THREE.MathUtils.clamp(angle / TAU * count, 0, count);
      const index = Math.min(count - 1, Math.floor(sample)), fraction = sample - index;
      return THREE.MathUtils.lerp(distances[index], distances[index + 1], fraction);
    },
  };
}

function makeTrackRibbon(track, width, y, sampleCount = 320) {
  const positions = [], uvs = [], indices = [];
  for (let i = 0; i <= sampleCount; i++) {
    const a = i / sampleCount * TAU, frame = trackFrame(a, 0, track);
    positions.push(frame.x + frame.tz * width / 2, y, frame.z - frame.tx * width / 2, frame.x - frame.tz * width / 2, y, frame.z + frame.tx * width / 2);
    uvs.push(0, i / sampleCount * 36, 1, i / sampleCount * 36);
    if (i < sampleCount) { const n = i * 2; indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function trackCurve(track, offset = 0, y = 0.02) {
  const points = [];
  for (let i = 0; i < 180; i++) { const f = trackFrame(i / 180 * TAU, offset, track); points.push(new THREE.Vector3(f.x, y, f.z)); }
  return new THREE.CatmullRomCurve3(points, true);
}

function makeAsphaltTexture(baseColor) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = baseColor; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 24000; i++) {
    const value = 42 + Math.random() * 44; ctx.fillStyle = `rgba(${value},${value},${value},${Math.random() * 0.18})`;
    const size = Math.random() * 2.2; ctx.fillRect(Math.random() * 512, Math.random() * 512, size, size);
  }
  for (let i = 0; i < 9; i++) {
    ctx.beginPath(); ctx.moveTo(Math.random() * 512, Math.random() * 512); ctx.lineTo(Math.random() * 512, Math.random() * 512);
    ctx.strokeStyle = `rgba(8,10,13,${0.08 + Math.random() * 0.1})`; ctx.lineWidth = 1 + Math.random() * 3; ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(3, 3); texture.anisotropy = 8;
  return texture;
}

function buildTrack(scene, track) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1100, 1100), new THREE.MeshStandardMaterial({ color: track.ground, roughness: 0.98 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.15; ground.receiveShadow = true; scene.add(ground);
  const { rx, rz } = track; const roadWidth = 14;
  const road = new THREE.Mesh(makeTrackRibbon(track, roadWidth, 0.01), new THREE.MeshStandardMaterial({ color: '#ffffff', map: makeAsphaltTexture(track.asphalt), roughness: 0.86, metalness: 0.04, side: THREE.DoubleSide }));
  road.receiveShadow = true; scene.add(road);
  for (const [offset, color, thick] of [[-roadWidth / 2, '#d8d8d4', 0.22], [roadWidth / 2, '#d8d8d4', 0.22], [0, '#eee9df', 0.075]]) {
    const edge = new THREE.Mesh(new THREE.TubeGeometry(trackCurve(track, offset, 0.045), 540, thick, 6, true), new THREE.MeshStandardMaterial({ color, roughness: 0.76, metalness: 0.08 }));
    scene.add(edge);
  }
  const postGeometry = new THREE.BoxGeometry(0.13, 0.82, 0.13);
  const postMaterial = new THREE.MeshStandardMaterial({ color: '#68727c', metalness: 0.75, roughness: 0.48 });
  const postInstances = new THREE.InstancedMesh(postGeometry, postMaterial, 264);
  const postTransform = new THREE.Object3D();
  let postIndex = 0;
  for (const side of [-1, 1]) {
    const offset = side * (roadWidth / 2 + 2.2);
    const rail = new THREE.Mesh(new THREE.TubeGeometry(trackCurve(track, offset, 0.84), 540, 0.13, 8, true), new THREE.MeshStandardMaterial({ color: '#8b9298', metalness: 0.82, roughness: 0.34 })); scene.add(rail);
    for (let i = 0; i < 132; i++) {
      const a = i / 132 * TAU, frame = trackFrame(a, offset, track);
      postTransform.position.set(frame.x, 0.42, frame.z); postTransform.updateMatrix(); postInstances.setMatrixAt(postIndex++, postTransform.matrix);
    }
  }
  postInstances.instanceMatrix.needsUpdate = true; postInstances.castShadow = true; scene.add(postInstances);
  const dashMat = new THREE.MeshBasicMaterial({ color: '#e9f8ff' });
  for (let i = 0; i < 72; i += 2) {
    const a = i / 72 * TAU, b = (i + 0.8) / 72 * TAU, pa = trackPoint(a, track), pb = trackPoint(b, track);
    const pts = [new THREE.Vector3(pa.x, 0.07, pa.z), new THREE.Vector3(pb.x, 0.07, pb.z)];
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(...pts), 1, 0.07, 5, false), dashMat));
  }
  // Start/finish stripe across the track.
  const start = new THREE.Group();
  const startFrame = trackFrame(0, 0, track);
  start.position.set(startFrame.x, 0, startFrame.z); start.rotation.y = Math.atan2(startFrame.tx, startFrame.tz);
  for (let i = 0; i < 12; i++) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(roadWidth / 12, 0.035, 0.8), new THREE.MeshBasicMaterial({ color: i % 2 ? '#f4f4ef' : '#10131a' }));
    tile.position.set(-roadWidth/2 + (i + 0.5) * roadWidth/12, 0.09, 0); start.add(tile);
  }
  scene.add(start);
  const jumpA = 2.25;
  const jumpFrame = trackFrame(jumpA, 0, track);
  const tangentX = jumpFrame.tx, tangentZ = jumpFrame.tz;
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(roadWidth - 2, 0.72, 9), new THREE.MeshStandardMaterial({ color: track.accent, emissive: track.accent, emissiveIntensity: 0.48, metalness: 0.35 }));
  ramp.position.set(jumpFrame.x, 0.36, jumpFrame.z); ramp.rotation.y = Math.atan2(-tangentX, -tangentZ); ramp.rotation.x = -0.13; scene.add(ramp);
  for (const side of [-1, 1]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 8.7), new THREE.MeshBasicMaterial({ color: '#20e6ff' }));
    strip.position.set(side * (roadWidth - 2) / 2, 0.8, 0); strip.rotation.x = -0.13; ramp.add(strip);
  }
  // Give each circuit its own recognizable skyline and roadside terrain.
  if (track.id === 'harbor') {
    for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      const x = Math.cos(a) * (rx + side * 13), z = Math.sin(a) * (rz + side * 13);
      const lamp = new THREE.Group(); lamp.position.set(x, 0, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 7.6, 6), new THREE.MeshStandardMaterial({ color: '#171e2a', metalness: 0.7 })); pole.position.y = 3.8; lamp.add(pole);
      const hue = track.sun;
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.4), new THREE.MeshBasicMaterial({ color: hue })); bulb.position.y = 7.55; lamp.add(bulb);
      if (i % 4 === 0) { const glow = new THREE.PointLight(hue, 16, 24, 2); glow.position.y = 7.35; lamp.add(glow); }
      scene.add(lamp);
    }
  }
    const cyanWindows = [], pinkWindows = [];
    const windowGeometry = new THREE.BoxGeometry(0.55, 0.85, 0.08);
    const cyanMaterial = new THREE.MeshBasicMaterial({ color: '#35dfff' });
    const pinkMaterial = new THREE.MeshBasicMaterial({ color: '#ff429d' });
    const windowTransform = new THREE.Object3D();
    for (let i = 0; i < 54; i++) {
    const a = i / 54 * TAU, radius = Math.max(rx, rz) + (i % 2 ? 28 : 52);
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    const h = 26 + ((i * 37) % 52), w = 15 + ((i * 11) % 16);
      const tower = new THREE.Group(); tower.position.set(x, 0, z); tower.lookAt(0, 15, 0);
    const building = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ color: i % 3 ? '#172436' : '#25243b', metalness: 0.45, roughness: 0.7, emissive: i % 4 ? '#071523' : '#190b25', emissiveIntensity: 0.6 }));
    building.position.y = h/2; tower.add(building);
      const rows = Math.floor(h / 3);
    for (let row = 0; row < rows; row++) for (let col = -1; col <= 1; col++) {
      if ((row * 7 + i * 3 + col) % 4 === 0) continue;
      const localPosition = new THREE.Vector3(col * 1.7, 3 + row * 2.3, w / 2 + 0.08).applyEuler(tower.rotation).add(tower.position);
      windowTransform.position.copy(localPosition); windowTransform.rotation.copy(tower.rotation); windowTransform.scale.set(1, 1, 1); windowTransform.updateMatrix();
      ((i + row + col) % 3 ? cyanWindows : pinkWindows).push(windowTransform.matrix.clone());
    }
    scene.add(tower);
  }
    for (const [matrices, material] of [[cyanWindows, cyanMaterial], [pinkWindows, pinkMaterial]]) {
      const windows = new THREE.InstancedMesh(windowGeometry, material, matrices.length);
      matrices.forEach((matrix, index) => windows.setMatrixAt(index, matrix));
      windows.instanceMatrix.needsUpdate = true; scene.add(windows);
    }
  } else if (track.id === 'canyon') {
    for (let i = 0; i < 42; i++) {
      const a = i / 42 * TAU, radius = Math.max(rx, rz) + 28 + (i % 4) * 18;
      const scale = 18 + ((i * 13) % 27), rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: i % 3 ? '#a8673e' : '#674632', roughness: 0.96 }));
      rock.scale.set(scale, 13 + ((i * 7) % 22), scale * (0.7 + (i % 3) * 0.12));
      rock.position.set(Math.cos(a) * radius, rock.scale.y * 0.65, Math.sin(a) * radius); rock.rotation.set(i * 0.31, i * 0.7, i * 0.17); rock.castShadow = true; scene.add(rock);
    }
    for (let i = 0; i < 28; i++) {
      const a = i / 28 * TAU, radius = Math.max(rx, rz) + 66 + (i % 3) * 22;
      const cactus = new THREE.Group(); cactus.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      const green = new THREE.MeshStandardMaterial({ color: '#4d6b47', roughness: 0.94 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 4.5, 7), green); trunk.position.y = 2.25; cactus.add(trunk);
      for (const side of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 2.2, 7), green); arm.position.set(side * 0.65, 2.6, 0); arm.rotation.z = side * 0.55; cactus.add(arm); }
      scene.add(cactus);
    }
  } else {
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * TAU, radius = Math.max(rx, rz) + 72 + (i % 4) * 24;
      const base = 36 + ((i * 9) % 24), height = 82 + ((i * 31) % 85);
      const mountain = new THREE.Group(); mountain.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      const peak = new THREE.Mesh(new THREE.ConeGeometry(base, height, 7), new THREE.MeshStandardMaterial({ color: i % 2 ? '#617887' : '#536978', roughness: 0.98 })); peak.position.y = height * 0.43; peak.rotation.y = i * 0.37; mountain.add(peak);
      const snow = new THREE.Mesh(new THREE.ConeGeometry(base * 0.46, height * 0.4, 7), new THREE.MeshStandardMaterial({ color: '#e7f1f3', roughness: 0.84 })); snow.position.y = height * 0.78; snow.rotation.y = peak.rotation.y; mountain.add(snow);
      scene.add(mountain);
      if (i % 2 === 0) { const pine = new THREE.Mesh(new THREE.ConeGeometry(4 + i % 4, 15 + i % 7, 6), new THREE.MeshStandardMaterial({ color: '#29483f', roughness: 0.96 })); pine.position.set(Math.cos(a) * (radius - 22), 7, Math.sin(a) * (radius - 22)); scene.add(pine); }
    }
  }
  return { rx, rz, roadWidth };
}

export default function RacingGame() {
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const setupStepRef = useRef(0);
  const setupActionAtRef = useRef(0);
  const [speed, setSpeed] = useState(0);
  const [lap, setLap] = useState(1);
  const [time, setTime] = useState('00:00.00');
  const [best, setBest] = useState('--:--.--');
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [place, setPlace] = useState(1);
  const [nitro, setNitro] = useState(100);
  const [driftScore, setDriftScore] = useState(0);
  const [takeDowns, setTakeDowns] = useState(0);
  const [takeDownVisible, setTakeDownVisible] = useState(false);
  const [airborne, setAirborne] = useState(false);
  const [finished, setFinished] = useState(false);
  const [selectedMap, setSelectedMap] = useState('harbor');
  const [setupStep, setSetupStep] = useState(0);
  const [raceMode, setRaceMode] = useState('duo');
  const raceModeRef = useRef('duo');
  const [place2, setPlace2] = useState(2);
  const [raceSnapshot, setRaceSnapshot] = useState([]);
  const [speed2, setSpeed2] = useState(0);
  const [lap2, setLap2] = useState(1);
  const [nitro2, setNitro2] = useState(100);
  const [winner, setWinner] = useState('');
  const [powerupToast, setPowerupToast] = useState('');
  const goToSetupStep = (step) => {
    const now = performance.now();
    if (now - setupActionAtRef.current < 350) return;
    setupActionAtRef.current = now;
    setupStepRef.current = step;
    setSetupStep(step);
  };
  const selectRaceMode = (mode) => { raceModeRef.current = mode; setRaceMode(mode); };
  const selectedTrack = MAPS.find((item) => item.id === selectedMap) || MAPS[0];
  const sampledCourse = Array.from({ length: 128 }, (_, index) => trackPoint(index / 128 * TAU, selectedTrack));
  const courseBounds = sampledCourse.reduce((bounds, point) => ({ minX: Math.min(bounds.minX, point.x), maxX: Math.max(bounds.maxX, point.x), minZ: Math.min(bounds.minZ, point.z), maxZ: Math.max(bounds.maxZ, point.z) }), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });
  const mapCoordinates = (angle) => { const point = trackPoint(angle, selectedTrack); return { x: 8 + (point.x - courseBounds.minX) / (courseBounds.maxX - courseBounds.minX) * 84, y: 8 + (point.z - courseBounds.minZ) / (courseBounds.maxZ - courseBounds.minZ) * 52 }; };
  const mapRoutePath = `${sampledCourse.map((point, index) => `${index ? 'L' : 'M'} ${8 + (point.x - courseBounds.minX) / (courseBounds.maxX - courseBounds.minX) * 84} ${8 + (point.z - courseBounds.minZ) / (courseBounds.maxZ - courseBounds.minZ) * 52}`).join(' ')} Z`;
  const fieldSize = raceMode === 'duo' ? 7 : 6;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'NEON CIRCUIT — 3D Racing';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      host.innerHTML = '<div class="rc-webgl-error">This browser could not start WebGL. Try enabling hardware acceleration.</div>';
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.42;
    host.appendChild(renderer.domElement);
    const track = MAPS.find((item) => item.id === selectedMap) || MAPS[0];
    const scene = new THREE.Scene(); scene.background = new THREE.Color(track.sky); scene.fog = new THREE.FogExp2(track.fog, track.fogDensity);
    const camera = new THREE.PerspectiveCamera(70, host.clientWidth / (host.clientHeight / 2), 0.1, 350);
    const camera2 = new THREE.PerspectiveCamera(70, host.clientWidth / (host.clientHeight / 2), 0.1, 350);
    scene.add(new THREE.HemisphereLight('#d8e5ff', track.ground, 2.05));
    const sun = new THREE.DirectionalLight(track.sun, 3.1); sun.position.set(-100, 145, 180); sun.castShadow = true; sun.shadow.mapSize.set(512, 512); scene.add(sun);
    const { rx, rz, roadWidth } = buildTrack(scene, track);
    const trackMetrics = makeTrackMetrics(track);
    const player = makeCar('#e94b32', true); scene.add(player);
    const startFrame1 = trackFrame(0, -1.7, track), startFrame2 = trackFrame(0, 1.7, track);
    player.position.set(startFrame1.x, 0.05, startFrame1.z); player.rotation.y = Math.atan2(-startFrame1.tx, -startFrame1.tz);
    const player2 = makeCar('#3f9aff', true); scene.add(player2);
    player2.position.set(startFrame2.x, 0.05, startFrame2.z); player2.rotation.y = Math.atan2(-startFrame2.tx, -startFrame2.tz);
    camera.position.set(startFrame1.x - startFrame1.tx * 22, 3.8, startFrame1.z - startFrame1.tz * 22); camera.fov = 58; camera.updateProjectionMatrix();
    camera.lookAt(startFrame1.x + startFrame1.tx * 30, 0.7, startFrame1.z + startFrame1.tz * 30);
    camera2.position.set(startFrame2.x - startFrame2.tx * 22, 3.8, startFrame2.z - startFrame2.tz * 22);
    camera2.lookAt(startFrame2.x + startFrame2.tx * 30, 0.7, startFrame2.z + startFrame2.tz * 30);
    const rivalColors = ['#31c5ba', '#f0bf43', '#9574e7', '#eb6b9a', '#59a1ee'];
    const rivals = rivalColors.map((c, i) => {
      const car = makeCar(c); scene.add(car);
      const baseLane = (i % 2 ? 1 : -1) * 3.6;
      const gridGap = 3 + Math.floor(i / 2) * 5.4 + (i % 2) * 0.25;
      return {
        car, angle: (TAU - gridGap / rz) % TAU, raceLaps: -1,
        speed: 0, targetSpeed: 0, maxSpeed: 55,
        engineForce: 13.5, brakeForce: 13.5, cornerGrip: 18,
        nitro: 100, nitroBoost: 0, nitroCooldown: 1 + i * 1.35, nextNitroAt: 4 + i * 1.8,
        powerupTimer: 0, powerupType: '',
        lane: baseLane, baseLane, laneTarget: baseLane,
        thinkTimer: 0, passTimer: 0, phase: i * 1.7, airtime: 0,
        knockdownTimer: 0, knockdownDirection: 1, spinAngle: 0,
      };
    });
    rivals.forEach(({ car, angle, lane }) => { const frame = trackFrame(angle, lane, track); car.position.set(frame.x, 0.05, frame.z); car.rotation.y = Math.atan2(-frame.tx, -frame.tz); });
    const lapLength = trackMetrics.length;
    // Neon direction boards give each bend a fast arcade-racer silhouette.
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * TAU, side = i % 2 ? 1 : -1;
      const board = new THREE.Group();
      board.position.set(Math.cos(a) * (rx + side * 12), 4.8, Math.sin(a) * (rz + side * 12));
      board.lookAt(0, 4.8, 0);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.35, 0.22), new THREE.MeshBasicMaterial({ color: '#0b1524' })); board.add(plate);
      for (let j = -1; j <= 1; j++) {
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.75, 3), new THREE.MeshStandardMaterial({ color: i % 2 ? '#e9e4d8' : '#d9ae55', metalness: 0.2, roughness: 0.68 }));
        arrow.rotation.z = -Math.PI/2; arrow.position.set(j * 1.15, 0, 0.14); board.add(arrow);
      }
      scene.add(board);
    }
    const state = { angle: 0, velocity: 0, lane: -1.7, laneVelocity: 0, elapsed: 0, lap: 1, started: false, paused: false, finished: false, lastLap: 0, lastUi: 0, offroad: false, nitro: 100, driftScore: 0, airtime: 0, dashCooldown: 0, takeDowns: 0, lastTakeDown: -10 };
    state.powerupTimer = 0; state.powerupType = ''; state.powerupToast = ''; state.powerupToastTimer = 0;
    const state2 = { angle: 0, velocity: 0, lane: 1.7, laneVelocity: 0, lap: 1, raceLaps: 0, nitro: 100, driftScore: 0, airtime: 0, finished: false, powerupTimer: 0, powerupType: '' };
    const pickupRingGeometry = new THREE.TorusGeometry(1.12, 0.16, 8, 18);
    const pickupCoreGeometry = new THREE.OctahedronGeometry(0.57, 0);
    const pickupMaterials = {
      turbo: new THREE.MeshStandardMaterial({ color: '#ffbf4a', emissive: '#ff8500', emissiveIntensity: 1.1, metalness: 0.35, roughness: 0.28 }),
      nitro: new THREE.MeshStandardMaterial({ color: '#6ff5ff', emissive: '#0aaaff', emissiveIntensity: 1.1, metalness: 0.32, roughness: 0.25 }),
    };
    const pickups = Array.from({ length: 12 }, (_, index) => {
      const group = new THREE.Group();
      const type = Math.random() < 0.52 ? 'turbo' : 'nitro';
      const ring = new THREE.Mesh(pickupRingGeometry, pickupMaterials[type]);
      const core = new THREE.Mesh(pickupCoreGeometry, pickupMaterials[type]); core.scale.setScalar(0.73);
      group.add(ring, core);
      const angle = (index + 0.5) / 12 * TAU + (Math.random() - 0.5) * 0.22;
      const lane = (Math.random() - 0.5) * 7.2;
      const frame = trackFrame(angle, lane, track);
      group.position.set(frame.x, 2.15, frame.z); scene.add(group);
      return { group, ring, angle, lane, type, active: true, respawnAt: 0, phase: Math.random() * TAU };
    });
    const keys = new Set();
    const onDown = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      if (e.key === 'Shift') keys.add(e.code.toLowerCase()); else keys.add(e.key.toLowerCase());
      if ((e.key.toLowerCase() === 'p' || e.key === 'Escape') && !state.finished) { state.paused = !state.paused; setPaused(state.paused); }
      if (e.key === 'Enter' && !state.started) {
        if (setupStepRef.current < 2) goToSetupStep(setupStepRef.current + 1);
        else { state.started = true; setStarted(true); }
      }
    };
    const onUp = (e) => { if (e.key === 'Shift') keys.delete(e.code.toLowerCase()); else keys.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp);
    let frame = 0, previous = performance.now();
    const animate = (now) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - previous) / 1000, 0.05); previous = now;
      const active = state.started && !state.paused;
      if (active) {
        state.elapsed += dt;
        const throttle = keys.has('w');
        const brake = keys.has('s');
        const drifting = keys.has(' ') && (keys.has('a') || keys.has('d'));
        const boosting = keys.has('shiftleft') && state.nitro > 0;
        state.powerupTimer = Math.max(0, state.powerupTimer - dt);
        const pickupBoost = state.powerupType === 'turbo' && state.powerupTimer > 0;
        const steer = (keys.has('a') ? 1 : 0) - (keys.has('d') ? 1 : 0);
        const aerodynamicDrag = 0.4 + state.velocity * state.velocity * 0.0005;
        const engineForce = throttle ? 13.5 : 0;
        const nitroForce = (boosting ? 6 : 0) + (pickupBoost ? 5.5 : 0);
        const brakeForce = brake ? 13.5 : 0;
        state.velocity = THREE.MathUtils.clamp(state.velocity + (engineForce + nitroForce - brakeForce - aerodynamicDrag) * dt, 0, boosting ? 62 : pickupBoost ? 64 : 55);
        if (boosting) state.nitro = Math.max(0, state.nitro - 32 * dt);
        else if (drifting) state.nitro = Math.min(100, state.nitro + 13 * dt);
        else state.nitro = Math.min(100, state.nitro + 2 * dt);
        if (drifting && state.velocity > 7) state.driftScore += Math.round(state.velocity * 1.7 * dt);
        const lateralAcceleration = steer * Math.min(12.5, state.velocity * 0.32);
        const tireGrip = drifting ? 0.85 : 4.8;
        state.laneVelocity = (state.laneVelocity || 0) + lateralAcceleration * dt;
        state.laneVelocity *= Math.exp(-tireGrip * dt);
        state.lane = THREE.MathUtils.clamp(state.lane + state.laneVelocity * dt, -8.4, 8.4);
        const lanePenalty = Math.abs(state.lane) > roadWidth * 0.44 ? 0.62 : 1;
        if (lanePenalty < 1) state.velocity = Math.max(0, state.velocity - 16 * dt);
        const curveRadius = trackFrame(state.angle, 0, track).radius;
        const prev = state.angle;
        state.angle += state.velocity * dt / Math.max(1, curveRadius);
        if (prev < 2.25 && state.angle >= 2.25) state.airtime = 1.15;
        state.airtime = Math.max(0, state.airtime - dt);
        if (prev < TAU && state.angle >= TAU) {
          state.angle -= TAU; state.lap += 1;
          const lapTime = state.elapsed - state.lastLap; state.lastLap = state.elapsed;
          setBest((b) => b === '--:--.--' || lapTime < parseTime(b) ? formatTime(lapTime) : b);
          if (state.lap > 3) { state.lap = 3; state.paused = true; state.finished = true; state.velocity = 0; setFinished(true); setPaused(true); setWinner('PLAYER 1 WINS'); }
          setLap(state.lap);
        }
        state.offroad = Math.abs(state.lane) > roadWidth * 0.42;
        if (raceModeRef.current === 'duo') {
        const steer2 = (keys.has('arrowleft') ? 1 : 0) - (keys.has('arrowright') ? 1 : 0);
        const drifting2 = keys.has('enter') && steer2 !== 0;
        const boosting2 = keys.has('shiftright') && state2.nitro > 0;
        state2.powerupTimer = Math.max(0, state2.powerupTimer - dt);
        const pickupBoost2 = state2.powerupType === 'turbo' && state2.powerupTimer > 0;
        const throttle2 = keys.has('arrowup'), brake2 = keys.has('arrowdown');
        const drag2 = 0.4 + state2.velocity * state2.velocity * 0.0005;
        state2.velocity = THREE.MathUtils.clamp(state2.velocity + ((throttle2 ? 13.5 : 0) + (boosting2 ? 6 : 0) + (pickupBoost2 ? 5.5 : 0) - (brake2 ? 13.5 : 0) - drag2) * dt, 0, boosting2 ? 62 : pickupBoost2 ? 64 : 55);
        if (boosting2) state2.nitro = Math.max(0, state2.nitro - 32 * dt);
        else if (drifting2) state2.nitro = Math.min(100, state2.nitro + 13 * dt);
        else state2.nitro = Math.min(100, state2.nitro + 2 * dt);
        if (drifting2 && state2.velocity > 7) state2.driftScore += Math.round(state2.velocity * 1.7 * dt);
        state2.laneVelocity = (state2.laneVelocity + steer2 * Math.min(12.5, state2.velocity * 0.32) * dt) * Math.exp(-(drifting2 ? 0.85 : 4.8) * dt);
        state2.lane = THREE.MathUtils.clamp(state2.lane + state2.laneVelocity * dt, -8.4, 8.4);
        if (Math.abs(state2.lane) > roadWidth * 0.44) state2.velocity = Math.max(0, state2.velocity - 16 * dt);
        const previousAngle2 = state2.angle;
        const radius2 = trackFrame(state2.angle, 0, track).radius;
        state2.angle = (state2.angle + state2.velocity * dt / Math.max(1, radius2)) % TAU;
        if (previousAngle2 < 2.25 && state2.angle >= 2.25) state2.airtime = 1.15;
        state2.airtime = Math.max(0, state2.airtime - dt);
        if (state2.angle < previousAngle2) {
          state2.raceLaps += 1; state2.lap += 1;
          if (state2.lap > 3) { state2.lap = 3; state2.finished = true; state2.velocity = 0; state.paused = true; state.finished = true; setFinished(true); setPaused(true); setWinner('PLAYER 2 WINS'); }
        }
        const p2Frame = trackFrame(state2.angle, state2.lane, track), p2x = p2Frame.x, p2z = p2Frame.z;
        const p2Jump = state2.airtime > 0 ? Math.sin((1.15 - state2.airtime) / 1.15 * Math.PI) * 5.2 : 0;
        player2.position.set(p2x, 0.05 + p2Jump, p2z);
        player2.userData.wheels.forEach((wheel) => { wheel.rotateY(-state2.velocity * dt / 0.39); });
        player2.userData.nitroFlames.forEach((flame, i) => { flame.visible = boosting2; flame.scale.setScalar(boosting2 ? 1 + Math.sin(now * 0.04 + i) * 0.15 : 0.001); });
        const tangent2 = new THREE.Vector3(p2Frame.tx, 0, p2Frame.tz);
        player2.rotation.y = Math.atan2(-tangent2.x, -tangent2.z) + Math.atan2(state2.laneVelocity, Math.max(state2.velocity, 1)) * (drifting2 ? 0.8 : 0.2);
        player2.rotation.z = THREE.MathUtils.lerp(player2.rotation.z, -steer2 * Math.min(0.055, state2.velocity * 0.00065), 1 - Math.exp(-5 * dt));
        player2.rotation.x = state2.airtime > 0 ? Math.sin((1.15 - state2.airtime) * 5) * 0.42 : 0;
        const cameraTarget2 = player2.position.clone().add(new THREE.Vector3(-tangent2.x * 13, 6 + p2Jump * 0.55, -tangent2.z * 13));
        camera2.position.lerp(cameraTarget2, 1 - Math.pow(0.001, dt));
        camera2.fov = THREE.MathUtils.lerp(camera2.fov, boosting2 ? 74 : 68, 1 - Math.pow(0.002, dt)); camera2.updateProjectionMatrix();
        camera2.lookAt(player2.position.clone().add(new THREE.Vector3(tangent2.x * 11, 1.35, tangent2.z * 11)));
        }
        const playerProgress = (state.lap - 1) * lapLength + trackMetrics.distanceAt(state.angle);
        const playerProgress2 = state2.raceLaps * lapLength + trackMetrics.distanceAt(state2.angle);
        const racers = [...rivals.map((rival) => ({ angle: rival.angle, lane: rival.lane, speed: rival.speed, rival })), { angle: state.angle, lane: state.lane, speed: state.velocity, rival: null, playerId: 1 }, ...(raceModeRef.current === 'duo' ? [{ angle: state2.angle, lane: state2.lane, speed: state2.velocity, rival: null, playerId: 2 }] : [])];
        for (const rival of rivals) {
          const rivalRadius = trackFrame(rival.angle, 0, track).radius;
          let closestGap = Infinity, closestSpeed = rival.speed;
          let blocked = false;
          for (const other of racers) {
            if (other.rival === rival) continue;
            const gapAngle = (other.angle - rival.angle + TAU) % TAU;
            const gap = trackMetrics.distanceAt(gapAngle);
            if (gap > 4 && gap < 38 && Math.abs(other.lane - rival.lane) < 2.8 && gap < closestGap) {
              closestGap = gap;
              closestSpeed = other.speed;
            }
            if (gap > 4 && gap < 20 && Math.abs(other.lane - rival.lane) < 2.8) blocked = true;
          }
          rival.thinkTimer -= dt;
          if (rival.thinkTimer <= 0 && rival.knockdownTimer <= 0) {
            const thinkStep = 0.22 + ((rival.phase * 17) % 11) * 0.018;
            rival.thinkTimer = thinkStep;
            if (blocked) {
              rival.laneTarget = rival.lane >= 0 ? -3.6 : 3.6;
              rival.passTimer = 2.8;
            }
            if (!blocked) rival.passTimer = Math.max(0, rival.passTimer - thinkStep);
            if (!blocked && rival.passTimer === 0) rival.laneTarget = rival.baseLane;
          }
          rival.knockdownTimer = Math.max(0, rival.knockdownTimer - dt);
          if (rival.knockdownTimer === 0 && rival.spinAngle !== 0) {
            rival.laneTarget = rival.baseLane;
            rival.spinAngle = 0;
          }
          rival.nitroCooldown = Math.max(0, rival.nitroCooldown - dt);
          rival.nitroBoost = Math.max(0, rival.nitroBoost - dt);
          rival.powerupTimer = Math.max(0, rival.powerupTimer - dt);
          const rivalPickupBoost = rival.powerupType === 'turbo' && rival.powerupTimer > 0;
          if (rival.nitroBoost === 0) rival.nitro = Math.min(100, rival.nitro + 2 * dt);
          const curveSpeedLimit = Math.sqrt(rival.cornerGrip * rivalRadius);
          const draftBoost = closestGap > 10 && closestGap < 34 ? 1.8 : 0;
          const straightLine = curveSpeedLimit >= 58;
          const boostOpportunity = rival.laneTarget !== rival.baseLane || (closestGap > 8 && closestGap < 34) || state.elapsed >= rival.nextNitroAt;
          if (rival.knockdownTimer === 0 && rival.nitroBoost === 0 && rival.nitroCooldown === 0 && rival.nitro >= 28 && straightLine && boostOpportunity) {
            rival.nitroBoost = 1.15;
            rival.nitroCooldown = 7.5 + (rival.phase % 3) * 1.2;
            rival.nextNitroAt = state.elapsed + 6 + (rival.phase % 4) * 1.5;
          }
          const boostingRival = rival.nitroBoost > 0 && rival.nitro > 0;
          if (boostingRival) rival.nitro = Math.max(0, rival.nitro - 32 * dt);
          const topSpeed = boostingRival ? 62 : rivalPickupBoost ? 64 : rival.maxSpeed;
          rival.targetSpeed = Math.min(topSpeed, curveSpeedLimit + draftBoost + (boostingRival ? 6 : 0) + (rivalPickupBoost ? 5.5 : 0));
          if (closestGap < 11) rival.targetSpeed = Math.min(rival.targetSpeed, closestSpeed + Math.max(0, closestGap - 6) * 0.38);
          const knockedDown = rival.knockdownTimer > 0;
          const throttle = knockedDown ? 0 : (rival.targetSpeed - rival.speed > 0.8 ? rival.engineForce + (boostingRival ? 6 : 0) : 0);
          const brake = knockedDown ? 18 : (rival.speed - rival.targetSpeed > 1.1 ? rival.brakeForce : 0);
          const drag = 0.4 + rival.speed * rival.speed * 0.0005;
          rival.speed = THREE.MathUtils.clamp(rival.speed + (throttle - brake - drag) * dt, 0, topSpeed);
          if (knockedDown) rival.spinAngle += rival.knockdownDirection * 12 * dt;
          const oldLane = rival.lane;
          rival.lane = THREE.MathUtils.damp(rival.lane, rival.laneTarget, 1.5, dt);
          const laneVelocity = (rival.lane - oldLane) / Math.max(dt, 0.001);
          const previousAngle = rival.angle;
          rival.angle = (rival.angle + rival.speed * dt / rivalRadius) % TAU;
          if (rival.angle < previousAngle) rival.raceLaps += 1;
          if (previousAngle < 2.25 && rival.angle >= 2.25) rival.airtime = 1.15;
          rival.airtime = Math.max(0, rival.airtime - dt);
          const rivalFrame = trackFrame(rival.angle, rival.lane, track), x = rivalFrame.x, z = rivalFrame.z;
          const rivalJump = rival.airtime > 0 ? Math.sin((1.15 - rival.airtime) / 1.15 * Math.PI) * 5.2 : 0;
          rival.car.position.set(x, 0.05 + rivalJump, z);
          rival.car.rotation.y = Math.atan2(-rivalFrame.tx, -rivalFrame.tz) + Math.atan2(laneVelocity, Math.max(rival.speed, 1)) * 0.18 + rival.spinAngle;
          rival.car.rotation.z = knockedDown ? rival.knockdownDirection * (0.65 + Math.sin(now * 0.035) * 0.22) : THREE.MathUtils.clamp(-laneVelocity * 0.018, -0.08, 0.08);
          rival.car.rotation.x = knockedDown ? Math.sin(now * 0.028) * 0.22 : rival.airtime > 0 ? Math.sin((1.15 - rival.airtime) * 5) * 0.42 : 0;
          rival.car.userData.wheels.forEach((wheel) => { wheel.rotateY(-rival.speed * dt / 0.39); });
          rival.car.userData.nitroFlames.forEach((flame, i) => { flame.visible = boostingRival || rivalPickupBoost; flame.scale.setScalar(boostingRival || rivalPickupBoost ? 1 + Math.sin(now * 0.04 + i) * 0.15 : 0.001); });
        }
        state.dashCooldown = Math.max(0, state.dashCooldown - dt);
        if (boosting && state.velocity > 24 && state.dashCooldown === 0) {
          const playerFrame = trackFrame(state.angle, state.lane, track), playerX = playerFrame.x, playerZ = playerFrame.z;
          const target = rivals
            .filter((rival) => rival.knockdownTimer === 0 && rival.raceLaps * lapLength + trackMetrics.distanceAt(rival.angle) > playerProgress - 2)
            .map((rival) => ({ rival, distance: Math.hypot(rival.car.position.x - playerX, rival.car.position.z - playerZ) }))
            .filter(({ distance }) => distance < 5.2)
            .sort((a, b) => a.distance - b.distance)[0]?.rival;
          if (target) {
            target.knockdownTimer = 1.85;
            target.knockdownDirection = target.lane >= state.lane ? 1 : -1;
            target.spinAngle = 0;
            target.speed = Math.min(target.speed, Math.max(7, state.velocity * 0.18));
            target.laneTarget = THREE.MathUtils.clamp(target.lane + target.knockdownDirection * 3.2, -8.3, 8.3);
            target.nitroBoost = 0;
            target.nitroCooldown = Math.max(target.nitroCooldown, 5);
            target.nextNitroAt = state.elapsed + 5;
            state.dashCooldown = 1.2;
            state.takeDowns += 1;
            state.lastTakeDown = state.elapsed;
          }
        }
        const playerFrame = trackFrame(state.angle, state.lane, track), x = playerFrame.x, z = playerFrame.z;
        const jumpHeight = state.airtime > 0 ? Math.sin((1.15 - state.airtime) / 1.15 * Math.PI) * 5.2 : 0;
        player.position.set(x, 0.05 + jumpHeight, z);
        if (prev < 2.25 && state.angle >= 2.25) state.nitro = Math.min(100, state.nitro + 18);
        player.userData.nitroFlames.forEach((flame, i) => { flame.visible = boosting; flame.scale.setScalar(boosting ? 1 + Math.sin(now * 0.04 + i) * 0.15 : 0.001); });
        player.userData.wheels.forEach((wheel) => { wheel.rotateY(-state.velocity * dt / 0.39); });
        const tangent = new THREE.Vector3(playerFrame.tx, 0, playerFrame.tz);
        player.rotation.y = Math.atan2(-tangent.x, -tangent.z) + Math.atan2(state.laneVelocity, Math.max(state.velocity, 1)) * (drifting ? 0.8 : 0.2);
        player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, -steer * Math.min(0.055, state.velocity * 0.00065), 1 - Math.exp(-5 * dt));
        player.rotation.x = state.airtime > 0 ? Math.sin((1.15 - state.airtime) * 5) * 0.42 : 0;
        const cameraTarget = player.position.clone().add(new THREE.Vector3(-tangent.x * 13, 6 + jumpHeight * 0.55, -tangent.z * 13));
        camera.position.lerp(cameraTarget, 1 - Math.pow(0.001, dt));
        camera.fov = THREE.MathUtils.lerp(camera.fov, boosting ? 74 : 68, 1 - Math.pow(0.002, dt)); camera.updateProjectionMatrix();
        camera.lookAt(player.position.clone().add(new THREE.Vector3(tangent.x * 11, 1.35, tangent.z * 11)));
        for (const pickup of pickups) {
          if (!pickup.active && state.elapsed >= pickup.respawnAt) {
            pickup.active = true; pickup.type = Math.random() < 0.52 ? 'turbo' : 'nitro';
            pickup.ring.material = pickupMaterials[pickup.type]; pickup.group.children[1].material = pickupMaterials[pickup.type];
            pickup.angle = Math.random() * TAU; pickup.lane = (Math.random() - 0.5) * 7.2; pickup.group.visible = true;
          }
          if (pickup.active) {
            pickup.phase += dt * 1.7; pickup.group.rotation.y += dt * 1.25;
            pickup.group.position.y = 2.15 + Math.sin(pickup.phase) * 0.38;
          }
        }
        const pickupRacers = [
          { label: 'PLAYER 1', entity: state, angle: state.angle, lane: state.lane },
          ...(raceModeRef.current === 'duo' ? [{ label: 'PLAYER 2', entity: state2, angle: state2.angle, lane: state2.lane }] : []),
          ...rivals.filter((rival) => rival.knockdownTimer <= 0).map((rival, index) => ({ label: `RIVAL ${String(index + 1).padStart(2, '0')}`, entity: rival, angle: rival.angle, lane: rival.lane })),
        ];
        for (const pickup of pickups) {
          if (!pickup.active) continue;
          const pickupDistance = trackMetrics.distanceAt(pickup.angle);
          const collector = pickupRacers.map((racer) => {
            const along = Math.abs(trackMetrics.distanceAt(racer.angle) - pickupDistance);
            const around = Math.min(along, lapLength - along);
            return { racer, distance: Math.hypot(around, racer.lane - pickup.lane) };
          }).sort((a, b) => a.distance - b.distance)[0];
          if (!collector || collector.distance > 4.25) continue;
          const { racer } = collector, entity = racer.entity;
          if (pickup.type === 'turbo') { entity.powerupTimer = 3.6; entity.powerupType = 'turbo'; }
          else {
            entity.nitro = Math.min(100, entity.nitro + 42);
            entity.powerupTimer = 1.4; entity.powerupType = 'nitro';
            if (entity.car) { entity.nitroBoost = Math.max(entity.nitroBoost, 1.4); entity.nitroCooldown = Math.min(entity.nitroCooldown, 0.8); }
          }
          pickup.active = false; pickup.group.visible = false; pickup.respawnAt = state.elapsed + 7 + Math.random() * 7;
          state.powerupToast = `${racer.label} · ${pickup.type === 'turbo' ? 'TURBO BOOST' : 'NITRO CELL'}`; state.powerupToastTimer = 1.8;
        }
        state.powerupToastTimer = Math.max(0, state.powerupToastTimer - dt);
        const player1Ahead = playerProgress > playerProgress2 + 4, player2Ahead = playerProgress2 > playerProgress + 4;
        const npcAhead1 = rivals.filter((r) => r.raceLaps * lapLength + trackMetrics.distanceAt(r.angle) > playerProgress + 4).length;
        const npcAhead2 = rivals.filter((r) => r.raceLaps * lapLength + trackMetrics.distanceAt(r.angle) > playerProgress2 + 4).length;
        const currentPlace = 1 + npcAhead1 + (raceModeRef.current === 'duo' && player2Ahead ? 1 : 0);
        const currentPlace2 = 1 + npcAhead2 + (player1Ahead || (!player1Ahead && !player2Ahead) ? 1 : 0);
        if (now - state.lastUi > 100) {
          state.lastUi = now;
          const raceLength = lapLength * 3;
          const standings = [
            ...rivals.map((rival, index) => ({ id: `r${index + 1}`, label: `RIVAL ${String(index + 1).padStart(2, '0')}`, shortLabel: `R${index + 1}`, color: rivalColors[index], angle: rival.angle, progress: rival.raceLaps * lapLength + trackMetrics.distanceAt(rival.angle) })),
            { id: 'p1', label: 'PLAYER 1', shortLabel: 'P1', color: '#ff654e', angle: state.angle, progress: (state.lap - 1) * lapLength + trackMetrics.distanceAt(state.angle) },
            ...(raceModeRef.current === 'duo' ? [{ id: 'p2', label: 'PLAYER 2', shortLabel: 'P2', color: '#58a9ff', angle: state2.angle, progress: state2.raceLaps * lapLength + trackMetrics.distanceAt(state2.angle) }] : []),
          ].sort((a, b) => b.progress - a.progress).map((racer, index) => ({ ...racer, place: index + 1, percent: THREE.MathUtils.clamp(racer.progress / raceLength, 0, 1) * 100 }));
          setRaceSnapshot(standings); setPowerupToast(state.powerupToastTimer > 0 ? state.powerupToast : '');
          setSpeed(Math.round(state.velocity * 3.6)); setSpeed2(Math.round(state2.velocity * 3.6)); setLap2(state2.lap); setPlace(currentPlace); setPlace2(currentPlace2); setTime(formatTime(state.elapsed)); setPaused(state.paused); setNitro(state.nitro); setNitro2(state2.nitro); setDriftScore(state.driftScore); setAirborne(state.airtime > 0); setTakeDowns(state.takeDowns); setTakeDownVisible(state.elapsed - state.lastTakeDown < 1.4);
        }
      }
      if (state.started && raceModeRef.current === 'duo') {
        const size = renderer.getSize(new THREE.Vector2()), halfHeight = size.y / 2;
        camera.aspect = size.x / halfHeight; camera.updateProjectionMatrix();
        camera2.aspect = size.x / halfHeight; camera2.updateProjectionMatrix();
        renderer.setScissorTest(true);
        renderer.setViewport(0, halfHeight, size.x, halfHeight); renderer.setScissor(0, halfHeight, size.x, halfHeight); renderer.render(scene, camera);
        renderer.setViewport(0, 0, size.x, halfHeight); renderer.setScissor(0, 0, size.x, halfHeight); renderer.render(scene, camera2);
        renderer.setScissorTest(false);
      } else {
        const size = renderer.getSize(new THREE.Vector2()); camera.aspect = size.x / size.y; camera.updateProjectionMatrix(); renderer.render(scene, camera);
      }
    };
    frame = requestAnimationFrame(animate);
    const resize = () => { if (!host.clientWidth || !host.clientHeight) return; renderer.setSize(host.clientWidth, host.clientHeight); camera.aspect = host.clientWidth / (state.started && raceModeRef.current === 'duo' ? host.clientHeight / 2 : host.clientHeight); camera2.aspect = host.clientWidth / (host.clientHeight / 2); camera.updateProjectionMatrix(); camera2.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(host);
    gameRef.current = {
      pause: () => { if (state.finished) return; state.paused = !state.paused; setPaused(state.paused); },
      start: () => { state.started = true; setStarted(true); },
      restart: () => {
        state.angle = 0; state.velocity = 0; state.lane = -1.7; state.laneVelocity = 0; state.elapsed = 0; state.lap = 1; state.lastLap = 0; state.nitro = 100; state.driftScore = 0; state.airtime = 0; state.dashCooldown = 0; state.takeDowns = 0; state.lastTakeDown = -10; state.powerupTimer = 0; state.powerupType = ''; state.powerupToast = ''; state.powerupToastTimer = 0; state.paused = false; state.finished = false;
        state2.angle = 0; state2.velocity = 0; state2.lane = 1.7; state2.laneVelocity = 0; state2.lap = 1; state2.raceLaps = 0; state2.nitro = 100; state2.driftScore = 0; state2.airtime = 0; state2.powerupTimer = 0; state2.powerupType = ''; state2.finished = false;
        pickups.forEach((pickup) => { pickup.active = true; pickup.respawnAt = 0; pickup.group.visible = true; pickup.angle = Math.random() * TAU; pickup.lane = (Math.random() - 0.5) * 7.2; pickup.type = Math.random() < 0.52 ? 'turbo' : 'nitro'; pickup.ring.material = pickupMaterials[pickup.type]; pickup.group.children[1].material = pickupMaterials[pickup.type]; const itemFrame = trackFrame(pickup.angle, pickup.lane, track); pickup.group.position.set(itemFrame.x, 2.15, itemFrame.z); });
        const resetFrame1 = trackFrame(0, -1.7, track), resetFrame2 = trackFrame(0, 1.7, track);
        player.position.set(resetFrame1.x, 0.05, resetFrame1.z); player2.position.set(resetFrame2.x, 0.05, resetFrame2.z);
        player.rotation.y = Math.atan2(-resetFrame1.tx, -resetFrame1.tz); player2.rotation.y = Math.atan2(-resetFrame2.tx, -resetFrame2.tz);
        rivals.forEach((rival, i) => {
          const gap = 3 + Math.floor(i / 2) * 5.4 + (i % 2) * 0.25;
          rival.angle = (TAU - gap / rz) % TAU; rival.raceLaps = -1; rival.speed = 0; rival.airtime = 0; rival.nitro = 100; rival.nitroBoost = 0; rival.nitroCooldown = 1 + i * 1.35; rival.nextNitroAt = 4 + i * 1.8; rival.powerupTimer = 0; rival.powerupType = ''; rival.knockdownTimer = 0; rival.knockdownDirection = 1; rival.spinAngle = 0;
          rival.lane = rival.baseLane; rival.laneTarget = rival.baseLane; rival.passTimer = 0; rival.thinkTimer = 0;
          const frame = trackFrame(rival.angle, rival.lane, track);
          rival.car.position.set(frame.x, 0.05, frame.z);
        });
        setPowerupToast(''); setFinished(false); setStarted(true); setPaused(false); setLap(1); setTime('00:00.00'); setSpeed(0); setNitro(100); setDriftScore(0); setTakeDowns(0); setTakeDownVisible(false); setPlace(1); setPlace2(2); setSpeed2(0); setLap2(1); setNitro2(100); setWinner(''); setRaceSnapshot([]);
      },
    };
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); renderer.dispose(); host.removeChild(renderer.domElement); scene.traverse((o) => { o.geometry?.dispose(); if (Array.isArray(o.material)) o.material.forEach((m) => { m.map?.dispose(); m.dispose(); }); else { o.material?.map?.dispose(); o.material?.dispose(); } }); };
  }, [selectedMap]);

  return (
    <div className={`racing-game ${started ? `rc-running ${raceMode === 'duo' ? 'rc-split-screen' : 'rc-solo'}` : `rc-setup-step-${setupStep}`}`}>
      <div className="rc-scene" ref={hostRef} />
      <div className="rc-vignette" />
      {started && raceMode === 'duo' && <div className="rc-split-divider" />}
      <header className="rc-topbar">
        <a className="rc-brand" href="/" aria-label="Neon Circuit home"><span className="rc-brand-mark">N</span><span>NEON<span className="rc-brand-muted"> / </span>CIRCUIT<small>ARCADE MOTOR CLUB</small></span></a>
        <div className="rc-top-right">{started ? <><span className="rc-live"><i /> CIRCUIT LIVE</span><button className="rc-icon-button" onClick={() => gameRef.current?.pause()} aria-label={paused ? 'Resume race' : 'Pause race'}>{paused ? '▶' : 'Ⅱ'}</button></> : <span className="rc-setup-label">ARCADE RACING <i /> {raceMode === 'duo' ? '2 PLAYER' : '1 PLAYER'}</span>}<a href="/" className="rc-exit">EXIT <span>↗</span></a></div>
      </header>
      <main className="rc-interface">
        {started && <>
          <section className="rc-live-map" aria-label="Track map and live racer positions">
            <div className="rc-live-map-heading"><span>TRACK MAP</span><b>LIVE ORDER</b></div>
            <svg className="rc-map-svg" viewBox="0 0 100 68" role="img" aria-label={`Live ${selectedTrack.name} map showing all ${fieldSize} racer positions`}>
              <path d={mapRoutePath} className="rc-map-road-edge" />
              <path d={mapRoutePath} className="rc-map-road" />
              <path d={mapRoutePath} className="rc-map-centerline" />
              <circle cx={mapCoordinates(0).x} cy={mapCoordinates(0).y} r="1.3" className="rc-map-start-marker" />
              {raceSnapshot.map((racer) => { const point = mapCoordinates(racer.angle); return <circle key={racer.id} cx={point.x} cy={point.y} r={racer.id[0] === 'p' ? 3.1 : 2.2} fill={racer.color} className={racer.id[0] === 'p' ? 'rc-map-player-dot' : ''}><title>{racer.label} · P{racer.place}</title></circle>; })}
            </svg>
            <ol className="rc-live-standings">{raceSnapshot.map((racer) => <li key={racer.id} className={racer.id[0] === 'p' ? 'rc-live-player' : ''}><b>{String(racer.place).padStart(2, '0')}</b><i style={{ background: racer.color }} /><span>{racer.label}</span>{racer.id[0] === 'p' && <em>{racer.shortLabel}</em>}</li>)}</ol>
          </section>
          <section className="rc-progress-panel" aria-label="Race progress and player positions">
            <div className="rc-progress-heading"><span>RACE PROGRESS</span><b>3 LAPS</b></div>
            {raceSnapshot.filter((racer) => racer.id[0] === 'p').map((racer) => <div className="rc-racer-progress" key={racer.id}>
              <b className="rc-progress-player" style={{ color: racer.color }}>{racer.shortLabel}</b>
              <div className="rc-progress-track"><i style={{ width: `${racer.percent}%`, background: racer.color }} /><span style={{ left: `${racer.percent}%`, borderColor: racer.color, color: racer.color }}>{String(racer.place).padStart(2, '0')}</span></div>
              <b className="rc-progress-rank">{String(racer.place).padStart(2, '0')}<small> / {String(fieldSize).padStart(2, '0')}</small></b>
            </div>)}
          </section>
        </>}
        {!started && <section className={`rc-setup-panel ${setupStep === 0 ? 'rc-setup-welcome' : ''}`} aria-label={`Race setup step ${setupStep + 1} of 3`}>
          <div className="rc-setup-progress"><span>RACE SETUP</span><b>0{setupStep + 1}<i> / 03</i></b><div><i style={{ width: `${(setupStep + 1) * 33.333}%` }} /></div></div>
          {setupStep === 0 && <div className="rc-welcome-content"><span className="rc-welcome-kicker">NEON CIRCUIT PRESENTS</span><h1>SPORTS CAR<br /><b>CHALLENGE</b></h1><p>Take the wheel. Own the circuit.<br />Your race starts here.</p><button className="rc-next-button" onClick={() => goToSetupStep(1)}>NEXT <span>CHOOSE YOUR TRACK</span><b>↗</b></button><small className="rc-enter-hint">OR PRESS ENTER</small></div>}
          {setupStep === 1 && <div className="rc-track-step"><span className="rc-step-kicker">01 &nbsp; / &nbsp; CIRCUIT SELECT</span><h2>Choose your track.</h2><p>Three routes. One starting grid.</p><div className="rc-map-picker" aria-label="Choose a race map">{MAPS.map((map, index) => <button key={map.id} className={`rc-map-option ${selectedMap === map.id ? 'rc-map-selected' : ''}`} onClick={() => setSelectedMap(map.id)} aria-pressed={selectedMap === map.id}><small>0{index + 1} &nbsp; · &nbsp; {map.descriptor}</small><b>{map.name}</b><span>{selectedMap === map.id ? 'SELECTED ✓' : 'SELECT TRACK +'}</span></button>)}</div><div className="rc-setup-actions"><button className="rc-back-button" onClick={() => goToSetupStep(0)}>← BACK</button><button className="rc-next-button" onClick={() => goToSetupStep(2)}>NEXT <span>DRIVER SETUP</span><b>↗</b></button></div><small className="rc-enter-hint">PRESS ENTER TO CONTINUE</small></div>}
          {setupStep === 2 && <div className="rc-driver-step"><span className="rc-step-kicker">02 &nbsp; / &nbsp; GRID SETUP</span><h2>Choose your race.</h2><p>{selectedTrack.name} · 5 competitive rivals</p><div className="rc-mode-picker" role="group" aria-label="Choose number of players"><button className={raceMode === 'solo' ? 'rc-mode-option rc-mode-selected' : 'rc-mode-option'} onClick={() => selectRaceMode('solo')} aria-pressed={raceMode === 'solo'}><b>1P</b><span>SOLO RACE</span><small>Race against the rivals</small></button><button className={raceMode === 'duo' ? 'rc-mode-option rc-mode-selected' : 'rc-mode-option'} onClick={() => selectRaceMode('duo')} aria-pressed={raceMode === 'duo'}><b>2P</b><span>SPLIT SCREEN</span><small>Race side by side</small></button></div><div className="rc-driver-cards"><article><span>P1</span><b>PLAYER ONE</b><small>W A S D &nbsp; · &nbsp; SHIFT NITRO<br />SPACE + STEER TO DRIFT</small></article>{raceMode === 'duo' ? <article><span>P2</span><b>PLAYER TWO</b><small>ARROW KEYS &nbsp; · &nbsp; RIGHT SHIFT<br />ENTER + STEER TO DRIFT</small></article> : <article className="rc-rival-card"><span>05</span><b>RIVAL DRIVERS</b><small>FULL SPEED AI<br />NITRO + DASH TAKEDOWNS</small></article>}</div><div className="rc-race-rules"><span>03 LAPS</span><i /><span>{raceMode === 'duo' ? '07 RACERS' : '06 RACERS'}</span><i /><span>NITRO + DASH</span></div><div className="rc-setup-actions"><button className="rc-back-button" onClick={() => goToSetupStep(1)}>← BACK</button><button className="rc-next-button rc-start-button" onClick={() => gameRef.current?.start()}>START {raceMode === 'duo' ? '2P RACE' : 'SOLO RACE'} <span>{selectedTrack.name.toUpperCase()}</span><b>↗</b></button></div><small className="rc-enter-hint">PRESS ENTER TO START</small></div>}
        </section>}
        {started && <section className="rc-hud" aria-label="Race telemetry">
          <div className="rc-hud-corner"><span className="rc-eyebrow">PLAYER 1 · POSITION</span><div className="rc-position">{String(place).padStart(2, '0')}<small> / {String(fieldSize).padStart(2, '0')}</small></div></div>
          <div className="rc-speed"><strong>{String(speed).padStart(3, '0')}</strong><span>KM/H</span><div className="rc-speed-meter"><i style={{ width: `${Math.min(speed / 2.5, 100)}%` }} /></div></div>
          <div className="rc-hud-bottom"><div><span className="rc-eyebrow">LAP</span><strong>{String(lap).padStart(2, '0')}<small> / 03</small></strong></div><div><span className="rc-eyebrow">TIME</span><strong className="rc-timer">{time}</strong></div></div>
          <div className="rc-nitro"><div><span className="rc-eyebrow">NITRO</span><b>{Math.round(nitro)}%</b></div><div className="rc-nitro-meter"><i style={{ width: `${nitro}%` }} /></div></div>
          <div className={`rc-scoreline ${takeDownVisible ? 'rc-takedown' : ''}`}><span>{takeDownVisible ? 'NITRO TAKEDOWN' : takeDowns ? `KNOCKDOWNS · ${takeDowns}` : airborne ? 'AIRBORNE · +NITRO' : driftScore ? 'DRIFT SCORE' : 'DRIFT TO CHARGE'}</span><b>{takeDownVisible ? '× 1' : driftScore.toLocaleString()}</b></div>
        </section>}
        {started && raceMode === 'duo' && <section className="rc-hud rc-hud-secondary" aria-label="Player 2 race telemetry"><div className="rc-hud-corner"><span className="rc-eyebrow">PLAYER 2 · POSITION</span><div className="rc-position">{String(place2).padStart(2, '0')}<small> / 07</small></div></div><div className="rc-speed"><strong>{String(speed2).padStart(3, '0')}</strong><span>KM/H</span><div className="rc-speed-meter"><i style={{ width: `${Math.min(speed2 / 2.5, 100)}%` }} /></div></div><div className="rc-hud-bottom"><div><span className="rc-eyebrow">LAP</span><strong>{String(lap2).padStart(2, '0')}<small> / 03</small></strong></div><div><span className="rc-eyebrow">TIME</span><strong className="rc-timer">{time}</strong></div></div><div className="rc-nitro"><div><span className="rc-eyebrow">NITRO</span><b>{Math.round(nitro2)}%</b></div><div className="rc-nitro-meter"><i style={{ width: `${nitro2}%` }} /></div></div></section>}
        {started && powerupToast && <div className={`rc-powerup-toast ${powerupToast.includes('TURBO') ? 'rc-powerup-turbo' : ''}`} role="status">{powerupToast}</div>}
        {paused && !finished && <div className="rc-pause"><span>SESSION PAUSED</span><button onClick={() => gameRef.current?.pause()}>RESUME RACE <b>↗</b></button><small>Press P to resume</small></div>}
        {finished && <div className="rc-finish"><span>🏁 &nbsp; {MAPS.find((item) => item.id === selectedMap)?.name.toUpperCase()}</span><h2>RACE<br /><b>COMPLETE.</b></h2><p>{winner} &nbsp; · &nbsp; FINAL TIME {time}</p><button onClick={() => gameRef.current?.restart()}>RACE AGAIN <b>↗</b></button></div>}
        {started && <div className="rc-controlbar"><div className="rc-controls"><b>P1</b><span className="rc-keyset"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span>SHIFT · SPACE</span>{raceMode === 'duo' && <><span className="rc-control-divider" /><b>P2</b><span className="rc-keyset"><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></span><span>RSHIFT · ENTER</span></>}</div><div className="rc-hint">P <span>PAUSE</span><i /> <span>BEST</span> {best}</div></div>}
      </main>
      <footer className="rc-footer"><span>NC—001 &nbsp; / &nbsp; {MAPS.find((item) => item.id === selectedMap)?.name.toUpperCase()}</span><span>DRIFT. BOOST. FLY. <b>✳</b></span><span>RACE THE NIGHT</span></footer>
    </div>
  );
}

function formatTime(seconds) { const min = Math.floor(seconds / 60), sec = Math.floor(seconds % 60), cs = Math.floor((seconds % 1) * 100); return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`; }
function parseTime(s) { const [m, rest] = s.split(':'); const [sec, cs] = rest.split('.'); return Number(m)*60+Number(sec)+Number(cs)/100; }

