import * as THREE from 'three';
import './style.css';

const mount = document.querySelector<HTMLDivElement>('#planet-canvas');
const dateNode = document.querySelector<HTMLElement>('#world-date');
const timeNode = document.querySelector<HTMLElement>('#world-time');
const pauseButton = document.querySelector<HTMLButtonElement>('#pause-button');
const statusNode = document.querySelector<HTMLElement>('#clock-status');

if (!mount || !dateNode || !timeNode || !pauseButton || !statusNode) {
  throw new Error('MICROVERSE could not initialize: required interface element is missing.');
}

const mountElement = mount;
const dateElement = dateNode;
const timeElement = timeNode;
const pauseElement = pauseButton;
const statusElement = statusNode;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#080a12');

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0, 5.3);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
mountElement.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0x8293c4, 1.15);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffe2c2, 2.5);
keyLight.position.set(-3, 2, 4);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x6e68ff, 16, 12);
rimLight.position.set(3, -1, -3);
scene.add(rimLight);

function random(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createPlanetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas texture is unavailable.');

  const rand = random(4182026);
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#172b43');
  gradient.addColorStop(0.48, '#174c55');
  gradient.addColorStop(1, '#10283d');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Seeded, irregular landmasses: deliberately fictional rather than Earth geography.
  const landColors = ['#71866d', '#879071', '#9b936f', '#687e72'];
  for (let i = 0; i < 34; i++) {
    const cx = rand() * canvas.width;
    const cy = 100 + rand() * (canvas.height - 200);
    const rx = 35 + rand() * 190;
    const ry = 18 + rand() * 105;
    context.beginPath();
    for (let p = 0; p <= 48; p++) {
      const angle = (p / 48) * Math.PI * 2;
      const wobble = 0.72 + rand() * 0.52;
      const x = cx + Math.cos(angle) * rx * wobble;
      const y = cy + Math.sin(angle) * ry * wobble;
      if (p === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fillStyle = landColors[Math.floor(rand() * landColors.length)];
    context.fill();
    context.strokeStyle = 'rgba(190, 190, 145, 0.22)';
    context.lineWidth = 3;
    context.stroke();
  }

  // Fine atmospheric/cloud streaks.
  for (let i = 0; i < 420; i++) {
    const x = rand() * canvas.width;
    const y = rand() * canvas.height;
    const length = 8 + rand() * 95;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + length * 0.5, y - 5 - rand() * 12, x + length, y + rand() * 5);
    context.strokeStyle = `rgba(220, 231, 235, ${0.025 + rand() * 0.075})`;
    context.lineWidth = 1 + rand() * 4;
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

const planetGroup = new THREE.Group();
scene.add(planetGroup);

const planetGeometry = new THREE.SphereGeometry(1.55, 96, 64);
const planetMaterial = new THREE.MeshStandardMaterial({
  map: createPlanetTexture(),
  roughness: 0.92,
  metalness: 0.02
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planetGroup.add(planet);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.61, 64, 48),
  new THREE.MeshBasicMaterial({ color: 0x688cff, transparent: true, opacity: 0.10, side: THREE.BackSide })
);
planetGroup.add(atmosphere);

const starGeometry = new THREE.BufferGeometry();
const starPositions: number[] = [];
const starRand = random(99173);
for (let i = 0; i < 900; i++) {
  const radius = 7 + starRand() * 18;
  const theta = starRand() * Math.PI * 2;
  const phi = Math.acos(2 * starRand() - 1);
  starPositions.push(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0xcbd2ff, size: 0.025, transparent: true, opacity: 0.8 })
);
scene.add(stars);

let dragging = false;
let previousX = 0;
let previousY = 0;
let targetRotationY = 0.35;
let targetRotationX = 0.12;
let cameraDistance = 5.3;

renderer.domElement.addEventListener('pointerdown', (event) => {
  dragging = true;
  previousX = event.clientX;
  previousY = event.clientY;
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  targetRotationY += (event.clientX - previousX) * 0.005;
  targetRotationX += (event.clientY - previousY) * 0.003;
  targetRotationX = THREE.MathUtils.clamp(targetRotationX, -1.1, 1.1);
  previousX = event.clientX;
  previousY = event.clientY;
});
const stopDrag = () => { dragging = false; };
renderer.domElement.addEventListener('pointerup', stopDrag);
renderer.domElement.addEventListener('pointercancel', stopDrag);
renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * 0.004, 3.5, 8);
}, { passive: false });

let touchDistance = 0;
renderer.domElement.addEventListener('touchstart', (event) => {
  if (event.touches.length === 2) {
    const a = event.touches[0];
    const b = event.touches[1];
    touchDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }
}, { passive: true });
renderer.domElement.addEventListener('touchmove', (event) => {
  if (event.touches.length !== 2 || touchDistance === 0) return;
  const a = event.touches[0];
  const b = event.touches[1];
  const nextDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  cameraDistance = THREE.MathUtils.clamp(cameraDistance + (touchDistance - nextDistance) * 0.012, 3.5, 8);
  touchDistance = nextDistance;
}, { passive: true });
renderer.domElement.addEventListener('touchend', () => { touchDistance = 0; }, { passive: true });

function resize(): void {
  const width = Math.max(1, mountElement.clientWidth);
  const height = Math.max(1, mountElement.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(mount);
resize();

let simulationMinutes = 0;
let running = true;
let lastClockUpdate = performance.now();

function renderClock(): void {
  const totalMinutes = Math.floor(simulationMinutes);
  const days = Math.floor(totalMinutes / 1440);
  const minuteOfDay = totalMinutes % 1440;
  const year = Math.floor(days / 365);
  const dayOfYear = days % 365;
  const month = Math.floor(dayOfYear / 30) + 1;
  const dayOfMonth = (dayOfYear % 30) + 1;
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = minuteOfDay % 60;
  dateElement.textContent = `DAY ${String(dayOfMonth).padStart(3, '0')} · MONTH ${String(month).padStart(2, '0')} · YEAR ${String(year).padStart(4, '0')}`;
  timeElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

pauseElement.addEventListener('click', () => {
  running = !running;
  pauseElement.innerHTML = running ? 'Ⅱ <span>PAUSE WORLD</span>' : '▶ <span>RESUME WORLD</span>';
  statusElement.textContent = running ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED';
  statusElement.classList.toggle('paused', !running);
  lastClockUpdate = performance.now();
});

function animate(now: number): void {
  requestAnimationFrame(animate);
  const elapsed = Math.min((now - lastClockUpdate) / 1000, 0.25);
  lastClockUpdate = now;
  if (running) {
    simulationMinutes += elapsed;
    renderClock();
  }
  planetGroup.rotation.y += (targetRotationY - planetGroup.rotation.y) * 0.035;
  planetGroup.rotation.x += (targetRotationX - planetGroup.rotation.x) * 0.035;
  camera.position.z += (cameraDistance - camera.position.z) * 0.08;
  stars.rotation.y += 0.00004;
  renderer.render(scene, camera);
}
renderClock();
requestAnimationFrame(animate);

window.addEventListener('beforeunload', () => {
  resizeObserver.disconnect();
  renderer.dispose();
  planetGeometry.dispose();
  planetMaterial.dispose();
  starGeometry.dispose();
});
