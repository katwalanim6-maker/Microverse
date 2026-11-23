import * as THREE from 'three';
import { generatePlanetWorld, getWorldSummary, type Biome, type PlanetWorld } from './simulation/world/planet';
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
  const landShare = country.geography.surfaceAreaPercent;
  countryDetailNode.innerHTML = `
    <div class="country-title-row"><span class="country-swatch" style="--country-color:${country.color}"></span><div><p class="eyebrow">COUNTRY PROFILE // ${country.id.toUpperCase()}</p><h3>${country.name}</h3><span class="country-status">FOUNDATION STATUS: ${country.status.toUpperCase()}</span></div></div>
    <div class="country-stat-grid">
      <div><small>POPULATION</small><strong>${country.population.toLocaleString('en-US')}</strong></div>
      <div><small>LAND CELLS</small><strong>${country.landCells.toLocaleString('en-US')}</strong></div>
      <div><small>PLANET SURFACE</small><strong>${landShare.toFixed(2)}%</strong></div>
      <div><small>SHARE OF LAND</small><strong>${country.geography.landSharePercent.toFixed(2)}%</strong></div>
    </div>
    <div class="country-info-heading">NATIONAL INFORMATION</div>
    <dl class="country-facts">
      <div><dt>Capital</dt><dd>${country.capital ?? 'Not established'}</dd></div>
      <div><dt>Government</dt><dd>${country.government}</dd></div>
      <div><dt>Currency</dt><dd>${country.currency}</dd></div>
      <div><dt>Economic model</dt><dd>${country.economy}</dd></div>
      <div><dt>Founded</dt><dd>${country.foundedYear === null ? 'Not established' : `Year ${country.foundedYear}`}</dd></div>
    </dl>
    <div class="country-info-heading">PHYSICAL GEOGRAPHY</div>
    <div class="terrain-bars">
      <span>Plains <b>${country.geography.terrain.plains.toLocaleString('en-US')}</b></span>
      <span>Highlands <b>${country.geography.terrain.highlands.toLocaleString('en-US')}</b></span>
      <span>Mountains <b>${country.geography.terrain.mountains.toLocaleString('en-US')}</b></span>
      <span>Coastal cells <b>${country.geography.coastlineCells.toLocaleString('en-US')}</b></span>
      <span>River cells <b>${country.geography.riverCells.toLocaleString('en-US')}</b></span>
      <span>Highest relief <b>${Math.round(country.geography.highestElevation * 100)} / 100</b></span>
    </div>
    <div class="country-info-heading">BIOMES</div>
    <div class="terrain-bars">
      <span>Forest <b>${country.geography.biomes.forest}</b></span>
      <span>Grassland <b>${country.geography.biomes.grassland}</b></span>
      <span>Desert <b>${country.geography.biomes.desert}</b></span>
      <span>Tundra <b>${country.geography.biomes.tundra}</b></span>
      <span>Alpine <b>${country.geography.biomes.alpine}</b></span>
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

// Wide framing shows the Sun, Earth and Moon together at the starting zoom.
const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 220);
camera.position.set(0, 0, 28);
// The observer camera orbits Earth; dragging never rotates the planet or celestial bodies.
let cameraAzimuth = 0;
let cameraPolar = Math.PI / 2;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
mountElement.appendChild(renderer.domElement);

// Soft base illumination remains low enough for the moving day/night terminator to read.
const ambient = new THREE.AmbientLight(0x8293c4, 0.34);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffe2c2, 2.8);
scene.add(keyLight);
const moonLight = new THREE.DirectionalLight(0x9eb8ff, 0.22);
scene.add(moonLight);
// DirectionalLight targets must belong to the scene for world-space aiming.
scene.add(keyLight.target);
scene.add(moonLight.target);

const rimLight = new THREE.PointLight(0x6e68ff, 12, 14);
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
  canvas.width = 3072;
  canvas.height = 1536;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas texture is unavailable.');

  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = worldData.width;
  mapCanvas.height = worldData.height;
  const mapContext = mapCanvas.getContext('2d');
  if (!mapContext) throw new Error('Geography map is unavailable.');

  const image = mapContext.createImageData(worldData.width, worldData.height);
  const biomeColors: Record<Biome, [number, number, number]> = {
    ocean: [12, 42, 68],
    coast: [177, 164, 119],
    grassland: [105, 132, 76],
    forest: [42, 91, 62],
    desert: [181, 143, 83],
    tundra: [142, 157, 153],
    alpine: [111, 122, 124]
  };
  const countryTints = worldData.countries.map((country) => {
    const value = Number.parseInt(country.color.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  });

  for (let y = 0; y < worldData.height; y++) {
    for (let x = 0; x < worldData.width; x++) {
      const index = y * worldData.width + x;
      const cell = worldData.cells[index];
      const offset = index * 4;
      const rightX = (x + 1) % worldData.width;
      const right = worldData.cells[y * worldData.width + rightX];
      const down = y + 1 < worldData.height ? worldData.cells[(y + 1) * worldData.width + x] : null;
      const left = worldData.cells[y * worldData.width + (x === 0 ? worldData.width - 1 : x - 1)];
      const up = y > 0 ? worldData.cells[(y - 1) * worldData.width + x] : cell;
      // Political borders are rendered as independent smooth 3D curves, not texture pixels.
      if (cell.countryIndex < 0) {
        const depth = Math.round(8 + cell.elevation * 13);
        image.data[offset] = 8;
        image.data[offset + 1] = 31 + depth;
        image.data[offset + 2] = 55 + depth * 2;
        image.data[offset + 3] = 255;
        continue;
      }
      const base: [number, number, number] = cell.volcanic
        ? [91, 76, 69]
        : biomeColors[cell.terrain === 'coast' ? 'coast' : cell.biome];
      const tint = countryTints[cell.countryIndex];
      const slopeShade = Math.max(0.72, Math.min(1.28, 1 + (left.elevation - right.elevation) * 0.85 + (up.elevation - (down?.elevation ?? cell.elevation)) * 0.85));
      const altitudeShade = 0.84 + cell.elevation * 0.30;
      const countryMix = 0.13;
      const borderShade = 1;
      const riverColor: [number, number, number] = [48, 133, 180];
      for (let channel = 0; channel < 3; channel++) {
        const natural = base[channel] * (1 - countryMix) + tint[channel] * countryMix;
        const shaded = natural * slopeShade * altitudeShade * borderShade;
        image.data[offset + channel] = cell.river ? riverColor[channel] : Math.max(0, Math.min(255, shaded));
      }
      image.data[offset + 3] = 255;
    }
  }

  mapContext.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = true;
  context.drawImage(mapCanvas, 0, 0, canvas.width, canvas.height);

  // Deterministic terrain micro-relief becomes visible as the camera zooms closer.
  const detailRand = random(worldData.seed + 1907);
  for (let i = 0; i < 32000; i++) {
    const px = detailRand() * canvas.width;
    const py = detailRand() * canvas.height;
    const cellX = Math.min(worldData.width - 1, Math.floor(px / canvas.width * worldData.width));
    const cellY = Math.min(worldData.height - 1, Math.floor(py / canvas.height * worldData.height));
    const cell = worldData.cells[cellY * worldData.width + cellX];
    if (!cell || cell.countryIndex < 0) continue;
    const size = 0.45 + detailRand() * (cell.terrain === 'mountains' ? 4.8 : 2.8);
    const alpha = 0.035 + detailRand() * (cell.terrain === 'mountains' ? 0.16 : 0.085);
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
// Hierarchical orbital mechanics: the Earth and Moon share the Sun-centred
// yearly orbit, while the Moon has its own monthly orbit around Earth's position.
const earthOrbit = new THREE.Group();
scene.add(earthOrbit);

// Slightly wider system spacing keeps the Sun clearly separated from Earth.
const earthOrbitRadius = 8.8;
const planetGroup = new THREE.Group();
planetGroup.position.set(earthOrbitRadius, 0, 0);
earthOrbit.add(planetGroup);

// Manual globe manipulation and the planet's own daily spin are independent.
const planetSpin = new THREE.Group();
planetGroup.add(planetSpin);

const moonOrbit = new THREE.Group();
moonOrbit.position.set(earthOrbitRadius, 0, 0);
earthOrbit.add(moonOrbit);

function sampleSurface(u: number, v: number): { elevation: number; land: number } {
  const wrappedU = ((u % 1) + 1) % 1;
  const gx = wrappedU * world.width - 0.5;
  const gy = THREE.MathUtils.clamp((1 - v) * world.height - 0.5, 0, world.height - 1);
  const x0Raw = Math.floor(gx);
  const x0 = (x0Raw % world.width + world.width) % world.width;
  const x1 = (x0 + 1) % world.width;
  const y0 = Math.floor(gy);
  const y1 = Math.min(world.height - 1, y0 + 1);
  const tx = gx - x0Raw;
  const ty = gy - y0;
  const a = world.cells[y0 * world.width + x0];
  const b = world.cells[y0 * world.width + x1];
  const c = world.cells[y1 * world.width + x0];
  const d = world.cells[y1 * world.width + x1];
  const blend = (av: number, bv: number, cv: number, dv: number) =>
    (av * (1 - tx) + bv * tx) * (1 - ty) + (cv * (1 - tx) + dv * tx) * ty;
  return {
    elevation: blend(a.elevation, b.elevation, c.elevation, d.elevation),
    land: blend(a.countryIndex >= 0 ? 1 : 0, b.countryIndex >= 0 ? 1 : 0, c.countryIndex >= 0 ? 1 : 0, d.countryIndex >= 0 ? 1 : 0)
  };
}

const planetGeometry = new THREE.SphereGeometry(1.72, 1080, 540);
const positions = planetGeometry.getAttribute('position');
const uvs = planetGeometry.getAttribute('uv');
for (let vertex = 0; vertex < positions.count; vertex++) {
  const u = uvs.getX(vertex);
  const v = uvs.getY(vertex);
  const sample = sampleSurface(u, v);
  const nx = positions.getX(vertex);
  const ny = positions.getY(vertex);
  const nz = positions.getZ(vertex);
  const length = Math.hypot(nx, ny, nz) || 1;
  // Land and ocean both have real relief. Bilinear sampling softens grid seams,
  // while the higher-amplitude elevation field makes mountains physically visible.
  const broadDetail = Math.sin(u * 92 + world.seed * 0.001) * Math.sin(v * 61 + world.seed * 0.002);
  const fineDetail = Math.sin(u * 410 + world.seed * 0.003) * Math.sin(v * 290 + world.seed * 0.004);
  const landHeight = 0.028 + sample.elevation * 0.235 + broadDetail * 0.006 + fineDetail * 0.0018;
  const oceanDepth = -0.018 + sample.elevation * 0.018;
  const radius = 1.72 + oceanDepth * (1 - sample.land) + landHeight * sample.land;
  positions.setXYZ(vertex, nx / length * radius, ny / length * radius, nz / length * radius);
}
planetGeometry.computeVertexNormals();
planetGeometry.computeBoundingSphere();

function createCountryBorderOverlay(worldData: PlanetWorld): THREE.LineSegments {
  type BorderEdge = { a: string; b: string };
  type GridPoint = { x: number; y: number };
  const edges: BorderEdge[] = [];
  const points = new Map<string, GridPoint>();
  const adjacency = new Map<string, number[]>();
  const pointKey = (x: number, y: number) => {
    const wrappedX = (x % worldData.width + worldData.width) % worldData.width;
    return `${wrappedX},${y}`;
  };
  const addEdge = (ax: number, ay: number, bx: number, by: number) => {
    const a = pointKey(ax, ay);
    const b = pointKey(bx, by);
    if (a === b) return;
    points.set(a, { x: (ax % worldData.width + worldData.width) % worldData.width, y: ay });
    points.set(b, { x: (bx % worldData.width + worldData.width) % worldData.width, y: by });
    const edgeIndex = edges.length;
    edges.push({ a, b });
    const aList = adjacency.get(a) ?? [];
    aList.push(edgeIndex);
    adjacency.set(a, aList);
    const bList = adjacency.get(b) ?? [];
    bList.push(edgeIndex);
    adjacency.set(b, bList);
  };

  for (let y = 0; y < worldData.height; y++) {
    for (let x = 0; x < worldData.width; x++) {
      const current = worldData.cells[y * worldData.width + x];
      if (current.countryIndex < 0) continue;
      const right = worldData.cells[y * worldData.width + ((x + 1) % worldData.width)];
      if (right.countryIndex >= 0 && right.countryIndex !== current.countryIndex) {
        addEdge(x + 1, y, x + 1, y + 1);
      }
      if (y + 1 < worldData.height) {
        const below = worldData.cells[(y + 1) * worldData.width + x];
        if (below.countryIndex >= 0 && below.countryIndex !== current.countryIndex) {
          addEdge(x, y + 1, x + 1, y + 1);
        }
      }
    }
  }

  const used = new Uint8Array(edges.length);
  const linePositions: number[] = [];
  const surfacePoint = (point: GridPoint): THREE.Vector3 => {
    const u = point.x / worldData.width;
    const v = 1 - point.y / worldData.height;
    const sample = sampleSurface(u, v);
    const phi = u * Math.PI * 2;
    const theta = (1 - v) * Math.PI;
    const radius = 1.72 + 0.035 + sample.elevation * 0.235;
    return new THREE.Vector3(
      -Math.cos(phi) * Math.sin(theta) * radius,
      Math.cos(theta) * radius,
      Math.sin(phi) * Math.sin(theta) * radius
    );
  };
  const walk = (start: string, firstEdge: number): string[] => {
    const path = [start];
    let current = start;
    let edgeIndex = firstEdge;
    while (!used[edgeIndex]) {
      used[edgeIndex] = 1;
      const edge = edges[edgeIndex];
      const next = edge.a === current ? edge.b : edge.a;
      path.push(next);
      if (next === start) break;
      const nextEdges = (adjacency.get(next) ?? []).filter((candidate) => !used[candidate]);
      if (nextEdges.length !== 1) break;
      current = next;
      edgeIndex = nextEdges[0];
    }
    return path;
  };
  const addSmoothPath = (path: string[]) => {
    if (path.length < 3) return;
    const closed = path[0] === path[path.length - 1];
    const keys = closed ? path.slice(0, -1) : path;
    if (keys.length < 3) return;
    const vectors = keys.map((key) => surfacePoint(points.get(key)!));
    const curve = new THREE.CatmullRomCurve3(vectors, closed, 'centripetal', 0.5);
    const smooth = curve.getPoints(Math.max(16, keys.length * 4));
    for (let i = 0; i < smooth.length - 1; i++) {
      linePositions.push(
        smooth[i].x, smooth[i].y, smooth[i].z,
        smooth[i + 1].x, smooth[i + 1].y, smooth[i + 1].z
      );
    }
  };

  // Start at junctions and open ends first, then consume remaining closed loops.
  for (const [key, linked] of adjacency) {
    if (linked.length === 2) continue;
    for (const edgeIndex of linked) {
      if (!used[edgeIndex]) addSmoothPath(walk(key, edgeIndex));
    }
  }
  for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex++) {
    if (!used[edgeIndex]) addSmoothPath(walk(edges[edgeIndex].a, edgeIndex));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xe8e4ff,
    transparent: true,
    opacity: 0.82,
    depthWrite: false
  });
  return new THREE.LineSegments(geometry, material);
}
const planetMaterial = new THREE.MeshStandardMaterial({
  map: createPlanetTexture(world),
  roughness: 0.92,
  metalness: 0.02
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planetSpin.add(planet);
const countryBorders = createCountryBorderOverlay(world);
planetSpin.add(countryBorders);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.79, 96, 64),
  new THREE.MeshBasicMaterial({ color: 0x688cff, transparent: true, opacity: 0.10, side: THREE.BackSide })
);
planetSpin.add(atmosphere);

const starGeometry = new THREE.BufferGeometry();
const starPositions: number[] = [];
const starRand = random(99173);
for (let i = 0; i < 1500; i++) {
  const radius = 45 + starRand() * 30;
  const theta = starRand() * Math.PI * 2;
  const phi = Math.acos(2 * starRand() - 1);
  starPositions.push(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({
  color: 0xdce2ff, size: 0.045, transparent: true, opacity: 0.78, sizeAttenuation: true
});
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Celestial objects occupy fixed world-space positions. The planet rotates beneath
// the fixed sun to create the day/night cycle; manual globe dragging never moves them.
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.92, 40, 32),
  new THREE.MeshBasicMaterial({ color: 0xffd27a })
);
scene.add(sun);
const sunGlow = new THREE.Mesh(
  new THREE.SphereGeometry(1.28, 32, 24),
  new THREE.MeshBasicMaterial({ color: 0xffb84d, transparent: true, opacity: 0.16, side: THREE.BackSide })
);
sun.add(sunGlow);
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.20, 28, 20),
  new THREE.MeshStandardMaterial({ color: 0xcbd5e8, roughness: 0.9, metalness: 0.02, emissive: 0x202b45 })
);
// The Moon follows a wider 43-unit orbit around Earth and is slightly smaller.
moon.position.set(43, 0, 0);
moonOrbit.add(moon);
const moonHalo = new THREE.Mesh(
  new THREE.SphereGeometry(0.30, 18, 14),
  new THREE.MeshBasicMaterial({ color: 0x9eb8ff, transparent: true, opacity: 0.12, side: THREE.BackSide })
);
moon.add(moonHalo);

const activePointers = new Map<number, { x: number; y: number }>();
const pointerStarts = new Map<number, { x: number; y: number }>();
let pinchDistance = 0;
let clickCandidate = false;
let cameraDistance = 28;

function distanceBetweenPointers(): number {
  const points = [...activePointers.values()];
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  renderer.domElement.setPointerCapture(event.pointerId);
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  pointerStarts.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (activePointers.size === 1) {
    clickCandidate = true;
  } else {
    // A multi-touch gesture is exclusively a zoom gesture, never a camera orbit gesture.
    clickCandidate = false;
    pinchDistance = distanceBetweenPointers();
  }
});

renderer.domElement.addEventListener('pointermove', (event) => {
  const previous = activePointers.get(event.pointerId);
  if (!previous) return;
  const next = { x: event.clientX, y: event.clientY };
  activePointers.set(event.pointerId, next);

  if (activePointers.size >= 2) {
    const nextDistance = distanceBetweenPointers();
    if (pinchDistance > 0 && nextDistance > 0) {
      cameraDistance = THREE.MathUtils.clamp(
        cameraDistance + (pinchDistance - nextDistance) * 0.010,
        2.05,
        90
      );
    }
    pinchDistance = nextDistance;
    return;
  }

  const deltaX = next.x - previous.x;
  const deltaY = next.y - previous.y;
  if (Math.hypot(next.x - (pointerStarts.get(event.pointerId)?.x ?? next.x),
                 next.y - (pointerStarts.get(event.pointerId)?.y ?? next.y)) > 7) {
    clickCandidate = false;
  }

  // Dragging moves the observer around Earth. The planet, Sun, Moon and stars
  // remain in their own world-space coordinate systems.
  const orbitSensitivity = 0.0052;
  cameraAzimuth += deltaX * orbitSensitivity;
  // Allow continuous vertical orbit through both poles for a full 360° observer orbit.
  // The spherical camera offset remains continuous as polar crosses 0 and PI.
  cameraPolar -= deltaY * orbitSensitivity;
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

function finishPointer(event: PointerEvent): void {
  const start = pointerStarts.get(event.pointerId);
  const wasSinglePointerClick = clickCandidate
    && activePointers.size === 1
    && start !== undefined
    && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 7;
  activePointers.delete(event.pointerId);
  pointerStarts.delete(event.pointerId);

  if (activePointers.size === 0) {
    pinchDistance = 0;
    if (wasSinglePointerClick) selectCountryAtPointer(event.clientX, event.clientY);
  } else if (activePointers.size === 1) {
    // Rebase the remaining finger so lifting one finger never causes a rotation jump.
    const remaining = [...activePointers.entries()][0];
    activePointers.set(remaining[0], { ...remaining[1] });
    pointerStarts.set(remaining[0], { ...remaining[1] });
    pinchDistance = 0;
    clickCandidate = false;
  } else {
    pinchDistance = distanceBetweenPointers();
  }
}
renderer.domElement.addEventListener('pointerup', finishPointer);
renderer.domElement.addEventListener('pointercancel', finishPointer);
renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * 0.0025, 2.05, 90);
}, { passive: false });

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
  const zoomLabel = cameraDistance < 2.45 ? 'CLOSE VIEW · ELEVATION & RIVERS' : cameraDistance < 3.4 ? 'LOCAL VIEW · TERRAIN & BIOMES' : cameraDistance < 4.8 ? 'REGIONAL VIEW · COUNTRY GEOGRAPHY' : cameraDistance < 6.5 ? 'CONTINENT VIEW · NATIONAL BORDERS' : cameraDistance > 24 ? 'SYSTEM VIEW · SUN & MOON' : 'PLANET VIEW · GLOBAL DETAIL';
  if (zoomLevelNode && zoomLevelNode.textContent !== zoomLabel) zoomLevelNode.textContent = zoomLabel;
  // Orbital periods follow the world's calendar:
  // Earth day = 1,440 simulation minutes; Moon month = 30 days;
  // Earth year = 365 days. The Sun remains at the solar-system origin.
  const dayAngle = (simulationMinutes / 1440) * Math.PI * 2;
  const monthAngle = (simulationMinutes / (30 * 1440)) * Math.PI * 2;
  const yearAngle = (simulationMinutes / (365 * 1440)) * Math.PI * 2;

  earthOrbit.rotation.y = yearAngle;
  moonOrbit.rotation.y = monthAngle;
  planetSpin.rotation.y = dayAngle;

  // Keep Earth as the viewing target while orbiting the camera around it.
  // Sun, Moon and stars remain fixed in world space (apart from their own orbits).
  earthOrbit.updateMatrixWorld(true);
  const earthPosition = planetGroup.getWorldPosition(new THREE.Vector3());
  const moonPosition = moon.getWorldPosition(new THREE.Vector3());
  const cameraOffset = new THREE.Vector3(
    cameraDistance * Math.sin(cameraPolar) * Math.sin(cameraAzimuth),
    cameraDistance * Math.cos(cameraPolar),
    cameraDistance * Math.sin(cameraPolar) * Math.cos(cameraAzimuth)
  );
  camera.position.copy(earthPosition).add(cameraOffset);
  camera.lookAt(earthPosition);

  // Directional sunlight comes from the actual fixed Sun position and points
  // toward Earth. Moonlight follows the Moon's actual orbital position.
  keyLight.position.copy(sun.position);
  keyLight.target.position.copy(earthPosition);
  moonLight.position.copy(moonPosition);
  moonLight.target.position.copy(earthPosition);
  starMaterial.opacity = 0.78;
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
  countryBorders.geometry.dispose();
  (countryBorders.material as THREE.Material).dispose();
  starGeometry.dispose();
});
