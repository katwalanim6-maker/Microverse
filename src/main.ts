import * as THREE from 'three';
import { generatePlanetWorld, getWorldSummary, type PlanetWorld } from './simulation/world/planet';
import './style.css';

const mount = document.querySelector<HTMLDivElement>('#planet-canvas');
const dateNode = document.querySelector<HTMLElement>('#world-date');
const timeNode = document.querySelector<HTMLElement>('#world-time');
const statusNode = document.querySelector<HTMLElement>('#clock-status');
const worldPageNode = document.querySelector<HTMLElement>('#world-page');
const infoPageNode = document.querySelector<HTMLElement>('#info-page');
const pageButtons = document.querySelectorAll<HTMLButtonElement>('[data-page]');
const backToWorldButton = document.querySelector<HTMLButtonElement>('#back-to-world');
const zoomLevelNode = document.querySelector<HTMLElement>('#zoom-level');
const yearNode = document.querySelector<HTMLElement>('#world-year');
const summaryNode = document.querySelector<HTMLElement>('#world-summary');
const countryListNode = document.querySelector<HTMLElement>('#country-list');
const countryDetailNode = document.querySelector<HTMLElement>('#country-detail');
const countrySearchNode = document.querySelector<HTMLInputElement>('#country-search');

if (!mount || !dateNode || !timeNode || !statusNode || !worldPageNode || !infoPageNode) {
  throw new Error('MICROVERSE could not initialize: required interface element is missing.');
}

const mountElement = mount;
const dateElement = dateNode;
const timeElement = timeNode;
const statusElement = statusNode;
const worldPageElement = worldPageNode;
const infoPageElement = infoPageNode;
function setActivePage(page: 'world' | 'info'): void {
  worldPageElement.hidden = page !== 'world';
  infoPageElement.hidden = page !== 'info';
  pageButtons.forEach((button) => button.classList.toggle('active', button.dataset.page === page));
  if (page === 'world') resize();
}
pageButtons.forEach((button) => button.addEventListener('click', () => setActivePage(button.dataset.page === 'info' ? 'info' : 'world')));
backToWorldButton?.addEventListener('click', () => setActivePage('world'));
const world: PlanetWorld = generatePlanetWorld();
if (summaryNode) summaryNode.textContent = getWorldSummary(world);

function showCountry(country: PlanetWorld['countries'][number]): void {
  if (!countryDetailNode) return;
  const countryCells = world.cells.filter((cell) => cell.countryIndex === world.countries.indexOf(country));
  const terrainCount = { plains: 0, highlands: 0, mountains: 0, coast: 0 };
  for (const cell of countryCells) {
    if (cell.terrain in terrainCount) terrainCount[cell.terrain as keyof typeof terrainCount]++;
  }
  const landShare = (country.landCells / world.cells.filter((cell) => cell.countryIndex >= 0).length) * world.landPercent;
  const density = country.landCells > 0 ? country.population / country.landCells : 0;
  countryDetailNode.innerHTML = `
    <div class="country-title-row"><span class="country-swatch" style="--country-color:${country.color}"></span><div><p class="eyebrow">COUNTRY PROFILE // ${country.id.toUpperCase()}</p><h3>${country.name}</h3><span class="country-status">FOUNDATION STATUS: ${country.status.toUpperCase()}</span></div></div>
    <div class="country-stat-grid">
      <div><small>POPULATION</small><strong>${country.population.toLocaleString('en-US')}</strong></div>
      <div><small>LAND CELLS</small><strong>${country.landCells.toLocaleString('en-US')}</strong></div>
      <div><small>SHARE OF LAND</small><strong>${landShare.toFixed(2)}%</strong></div>
      <div><small>PEOPLE / CELL</small><strong>${Math.round(density).toLocaleString('en-US')}</strong></div>
    </div>
    <div class="country-info-heading">NATIONAL INFORMATION</div>
    <dl class="country-facts">
      <div><dt>Capital</dt><dd>${country.capital ?? 'Not established'}</dd></div>
      <div><dt>Government</dt><dd>${country.government}</dd></div>
      <div><dt>Currency</dt><dd>${country.currency}</dd></div>
      <div><dt>Economic model</dt><dd>${country.economy}</dd></div>
      <div><dt>Founded</dt><dd>${country.foundedYear === null ? 'Not established' : `Year ${country.foundedYear}`}</dd></div>
    </dl>
    <div class="country-info-heading">GEOGRAPHY</div>
    <div class="terrain-bars">
      <span>Plains <b>${terrainCount.plains}</b></span><span>Highlands <b>${terrainCount.highlands}</b></span><span>Mountains <b>${terrainCount.mountains}</b></span><span>Coastal cells <b>${terrainCount.coast}</b></span>
    </div>
    <p class="country-footnote">Government, capital, currency and economic details will emerge as the civilization develops. They are intentionally not pre-assigned.</p>`;
  countryListNode?.querySelectorAll<HTMLButtonElement>('.country-choice').forEach((button) => {
    button.classList.toggle('selected', button.dataset.countryId === country.id);
  });
  setActivePage('info');
}
function renderCountryList(filter = ''): void {
  if (!countryListNode) return;
  const normalized = filter.trim().toLocaleLowerCase();
  const matches = world.countries.filter((country) => country.name.toLocaleLowerCase().includes(normalized));
  countryListNode.innerHTML = matches.map((country) =>
    `<button class="country-choice" type="button" data-country-id="${country.id}"><span class="country-swatch" style="--country-color:${country.color}"></span><span>${country.name}</span><small>${country.population.toLocaleString('en-US')}</small></button>`
  ).join('');
  countryListNode.querySelectorAll<HTMLButtonElement>('.country-choice').forEach((button) => {
    button.addEventListener('click', () => {
      const country = world.countries.find((item) => item.id === button.dataset.countryId);
      if (country) showCountry(country);
    });
  });
}
renderCountryList();
countrySearchNode?.addEventListener('input', () => renderCountryList(countrySearchNode.value));

const scene = new THREE.Scene();
scene.background = new THREE.Color('#080a12');

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0, 4.65);

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

function createPlanetTexture(worldData: PlanetWorld): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas texture is unavailable.');

  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = worldData.width;
  mapCanvas.height = worldData.height;
  const mapContext = mapCanvas.getContext('2d');
  if (!mapContext) throw new Error('Geography map is unavailable.');

  const image = mapContext.createImageData(worldData.width, worldData.height);
  const colors = worldData.countries.map((country) => {
    const value = Number.parseInt(country.color.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  });

  for (let y = 0; y < worldData.height; y++) {
    for (let x = 0; x < worldData.width; x++) {
      const index = y * worldData.width + x;
      const cell = worldData.cells[index];
      const offset = index * 4;
      if (cell.countryIndex < 0) {
        const latitude = Math.abs((y / worldData.height) * 2 - 1);
        const depth = Math.round(8 + (1 - latitude) * 13);
        image.data[offset] = 12;
        image.data[offset + 1] = 37 + depth;
        image.data[offset + 2] = 58 + depth * 2;
        image.data[offset + 3] = 255;
        continue;
      }

      const base = colors[cell.countryIndex];
      let shade = 0;
      if (cell.terrain === 'coast') shade = 18;
      else if (cell.terrain === 'highlands') shade = -12;
      else if (cell.terrain === 'mountains') shade = 26;

      const rightX = (x + 1) % worldData.width;
      const right = worldData.cells[y * worldData.width + rightX];
      const down = y + 1 < worldData.height ? worldData.cells[(y + 1) * worldData.width + x] : null;
      const border = (right.countryIndex >= 0 && right.countryIndex !== cell.countryIndex)
        || (down !== null && down.countryIndex >= 0 && down.countryIndex !== cell.countryIndex);
      const borderShade = border ? 0.42 : 1;
      image.data[offset] = Math.max(0, Math.min(255, (base[0] + shade) * borderShade));
      image.data[offset + 1] = Math.max(0, Math.min(255, (base[1] + shade) * borderShade));
      image.data[offset + 2] = Math.max(0, Math.min(255, (base[2] + shade) * borderShade));
      image.data[offset + 3] = 255;
    }
  }

  mapContext.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = true;
  context.drawImage(mapCanvas, 0, 0, canvas.width, canvas.height);

  // Deterministic terrain micro-relief becomes visible as the camera zooms closer.
  const detailRand = random(worldData.seed + 1907);
  for (let i = 0; i < 14500; i++) {
    const px = detailRand() * canvas.width;
    const py = detailRand() * canvas.height;
    const cellX = Math.min(worldData.width - 1, Math.floor(px / canvas.width * worldData.width));
    const cellY = Math.min(worldData.height - 1, Math.floor(py / canvas.height * worldData.height));
    const cell = worldData.cells[cellY * worldData.width + cellX];
    if (!cell || cell.countryIndex < 0) continue;
    const size = 0.5 + detailRand() * (cell.terrain === 'mountains' ? 3.8 : 2.2);
    const alpha = 0.025 + detailRand() * (cell.terrain === 'mountains' ? 0.12 : 0.065);
    context.beginPath();
    context.ellipse(px, py, size * (1.2 + detailRand()), size * 0.45, detailRand() * Math.PI, 0, Math.PI * 2);
    context.fillStyle = cell.terrain === 'mountains'
      ? `rgba(238, 229, 211, ${alpha})`
      : `rgba(8, 12, 18, ${alpha})`;
    context.fill();
  }

  // Fine atmospheric streaks sit above the authoritative geography layer.
  const rand = random(worldData.seed + 701);
  for (let i = 0; i < 420; i++) {
    const x = rand() * canvas.width;
    const y = rand() * canvas.height;
    const length = 8 + rand() * 95;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + length * 0.5, y - 5 - rand() * 12, x + length, y + rand() * 5);
    context.strokeStyle = 'rgba(220, 231, 235, ' + (0.018 + rand() * 0.055) + ')';
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

const planetGeometry = new THREE.SphereGeometry(1.72, 192, 128);
const planetMaterial = new THREE.MeshStandardMaterial({
  map: createPlanetTexture(world),
  roughness: 0.92,
  metalness: 0.02
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planetGroup.add(planet);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.79, 96, 64),
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
let pointerStartX = 0;
let pointerStartY = 0;
let targetRotationY = 0.35;
let targetRotationX = 0.12;
let cameraDistance = 4.65;

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  dragging = true;
  previousX = event.clientX;
  previousY = event.clientY;
  pointerStartX = event.clientX;
  pointerStartY = event.clientY;
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const deltaX = event.clientX - previousX;
  const deltaY = event.clientY - previousY;

  // Higher sensitivity and quicker visual follow make the globe track the user's hand.
  targetRotationY += deltaX * 0.009;
  targetRotationX = THREE.MathUtils.clamp(
    targetRotationX + deltaY * 0.006,
    -1.1,
    1.1
  );

  previousX = event.clientX;
  previousY = event.clientY;
});
function selectCountryAtPointer(clientX: number, clientY: number): void {
  const rect = renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  planetGroup.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(planet, false)[0];
  const uv = hit?.uv;
  if (!uv) return;
  const x = Math.min(world.width - 1, Math.max(0, Math.floor(uv.x * world.width)));
  const y = Math.min(world.height - 1, Math.max(0, Math.floor((1 - uv.y) * world.height)));
  let cell = world.cells[y * world.width + x];
  if (!cell || cell.countryIndex < 0) {
    for (let radius = 1; radius <= 3 && (!cell || cell.countryIndex < 0); radius++) {
      for (let dy = -radius; dy <= radius && (!cell || cell.countryIndex < 0); dy++) {
        for (let dx = -radius; dx <= radius && (!cell || cell.countryIndex < 0); dx++) {
          const candidateX = (x + dx + world.width) % world.width;
          const candidateY = Math.min(world.height - 1, Math.max(0, y + dy));
          const candidate = world.cells[candidateY * world.width + candidateX];
          if (candidate.countryIndex >= 0) cell = candidate;
        }
      }
    }
  }
  if (cell && cell.countryIndex >= 0) showCountry(world.countries[cell.countryIndex]);
}
const stopDrag = (event: PointerEvent) => {
  const wasClick = Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY) < 7;
  dragging = false;
  if (wasClick) selectCountryAtPointer(event.clientX, event.clientY);
};
renderer.domElement.addEventListener('pointerup', stopDrag);
renderer.domElement.addEventListener('pointercancel', () => { dragging = false; });
renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * 0.003, 2.15, 9.5);
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
  cameraDistance = THREE.MathUtils.clamp(cameraDistance + (touchDistance - nextDistance) * 0.012, 2.15, 9.5);
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

const CLOCK_STORAGE_KEY = 'microverse-clock-v1';
const nowAtStart = Date.now();
let simulationMinutes = 0;
let lastWallClockMs = nowAtStart;

try {
  const saved = localStorage.getItem(CLOCK_STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved) as { version: number; seed: number; simulationMinutes: number; savedAt: number };
    if (parsed.version === 1 && parsed.seed === world.seed && Number.isFinite(parsed.simulationMinutes) && Number.isFinite(parsed.savedAt)) {
      simulationMinutes = parsed.simulationMinutes + Math.max(0, nowAtStart - parsed.savedAt) / 1000;
    }
  }
} catch {
  // A blocked or corrupt local save must never prevent the world from starting.
}

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
  if (yearNode) yearNode.textContent = `YEAR ${String(year).padStart(4, '0')}`;
}

function saveClock(): void {
  try {
    localStorage.setItem(CLOCK_STORAGE_KEY, JSON.stringify({
      version: 1,
      seed: world.seed,
      simulationMinutes: simulationMinutes + Math.max(0, Date.now() - lastWallClockMs) / 1000,
      savedAt: Date.now()
    }));
  } catch {
    // Storage may be unavailable in private or restricted browsing modes.
  }
}

function catchUpWorldTime(): void {
  const now = Date.now();
  simulationMinutes += Math.max(0, now - lastWallClockMs) / 1000;
  lastWallClockMs = now;
  renderClock();
  saveClock();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') catchUpWorldTime();
  else saveClock();
});
window.addEventListener('pagehide', saveClock);
window.setInterval(saveClock, 5000);

function animate(now: number): void {
  requestAnimationFrame(animate);
  const elapsedSeconds = Math.max(0, (Date.now() - lastWallClockMs) / 1000);
  lastWallClockMs = Date.now();
  simulationMinutes += elapsedSeconds;
  renderClock();
  const zoomLabel = cameraDistance < 3.1 ? 'LOCAL VIEW · SURFACE DETAIL' : cameraDistance < 4.7 ? 'REGIONAL VIEW · TERRAIN DETAIL' : cameraDistance < 6.5 ? 'CONTINENT VIEW · COUNTRY DETAIL' : 'PLANET VIEW · GLOBAL DETAIL';
  if (zoomLevelNode && zoomLevelNode.textContent !== zoomLabel) zoomLevelNode.textContent = zoomLabel;
  // Faster damping reduces the lag between pointer movement and globe rotation.
  const rotationFollow = dragging ? 0.42 : 0.16;
  planetGroup.rotation.y += (targetRotationY - planetGroup.rotation.y) * rotationFollow;
  planetGroup.rotation.x += (targetRotationX - planetGroup.rotation.x) * rotationFollow;
  camera.position.z += (cameraDistance - camera.position.z) * 0.08;
  stars.rotation.y += 0.00004;
  renderer.render(scene, camera);
}
renderClock();
saveClock();
requestAnimationFrame(animate);

window.addEventListener('beforeunload', () => {
  resizeObserver.disconnect();
  renderer.dispose();
  planetGeometry.dispose();
  planetMaterial.dispose();
  starGeometry.dispose();
});
