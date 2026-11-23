export const WORLD_SEED = 4182026;
export const INITIAL_POPULATION = 1_000_000;
export const MAP_WIDTH = 360;
export const MAP_HEIGHT = 180;

export type Terrain = 'ocean' | 'coast' | 'plains' | 'highlands' | 'mountains';

export interface Country {
  id: string;
  name: string;
  color: string;
  population: number;
  landCells: number;
}

export interface WorldCell {
  terrain: Terrain;
  countryIndex: number;
  population: number;
}

export interface PlanetWorld {
  seed: number;
  width: number;
  height: number;
  cells: WorldCell[];
  countries: Country[];
  totalPopulation: number;
}

const COUNTRY_NAMES = [
  'Aurelia', 'Veyra', 'Caldris', 'Orinth', 'Myrr', 'Solenne',
  'Tavora', 'Eldara', 'Nym', 'Korvale', 'Ilyth', 'Bracken'
];

const COUNTRY_COLORS = [
  '#a98a69', '#8b9b72', '#a47b72', '#789a91',
  '#9b8eaf', '#b39b63', '#668d9e', '#a17d9a',
  '#7d967d', '#b18a72', '#7f8eae', '#9b9b70'
];

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const fade = (t: number) => t * t * (3 - 2 * t);
  const hash = (a: number, b: number) => {
    let n = Math.imul(a + seed, 374761393) + Math.imul(b - seed, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const sx = fade(fx);
  const sy = fade(fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  const top = a + (b - a) * sx;
  const bottom = c + (d - c) * sx;
  return top + (bottom - top) * sy;
}

interface Landmass {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rotation: number;
  strength: number;
}

interface CountrySeed {
  x: number;
  y: number;
}

function wrapDistanceX(a: number, b: number): number {
  const direct = Math.abs(a - b);
  return Math.min(direct, MAP_WIDTH - direct);
}

function generateLandmasses(rand: () => number): Landmass[] {
  const masses: Landmass[] = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    masses.push({
      x: rand() * MAP_WIDTH,
      y: 24 + rand() * (MAP_HEIGHT - 48),
      rx: 19 + rand() * 35,
      ry: 12 + rand() * 25,
      rotation: (rand() - 0.5) * 1.2,
      strength: 0.78 + rand() * 0.22
    });
  }
  return masses;
}

function landScore(x: number, y: number, masses: Landmass[], seed: number): number {
  let continental = 0;
  for (const mass of masses) {
    const dx = wrapDistanceX(x, mass.x);
    const dy = y - mass.y;
    const cos = Math.cos(mass.rotation);
    const sin = Math.sin(mass.rotation);
    const rx = (dx * cos - dy * sin) / mass.rx;
    const ry = (dx * sin + dy * cos) / mass.ry;
    const distance = Math.sqrt(rx * rx + ry * ry);
    const influence = mass.strength - distance * 0.43;
    continental = Math.max(continental, influence);
  }
  const broad = smoothNoise(x / 30, y / 22, seed) - 0.5;
  const detail = smoothNoise(x / 9, y / 8, seed + 91) - 0.5;
  const fine = smoothNoise(x / 3.5, y / 3.5, seed + 177) - 0.5;
  return continental + broad * 0.28 + detail * 0.12 + fine * 0.045;
}

export function generatePlanetWorld(seed = WORLD_SEED): PlanetWorld {
  const rand = seededRandom(seed);
  const masses = generateLandmasses(rand);
  const rawLand = new Uint8Array(MAP_WIDTH * MAP_HEIGHT);
  const elevation = new Float32Array(MAP_WIDTH * MAP_HEIGHT);
  const countrySeeds: CountrySeed[] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const index = y * MAP_WIDTH + x;
      const polarPenalty = Math.abs((y / MAP_HEIGHT) * 2 - 1) * 0.12;
      const score = landScore(x, y, masses, seed) - polarPenalty;
      elevation[index] = score;
      rawLand[index] = score > 0.015 ? 1 : 0;
    }
  }

  // Pick country centres from generated land so every country starts with territory.
  for (let i = 0; i < COUNTRY_NAMES.length; i++) {
    let chosen = -1;
    for (let attempt = 0; attempt < 500; attempt++) {
      const x = Math.floor(rand() * MAP_WIDTH);
      const y = 12 + Math.floor(rand() * (MAP_HEIGHT - 24));
      const index = y * MAP_WIDTH + x;
      if (rawLand[index]) {
        chosen = index;
        break;
      }
    }
    if (chosen < 0) {
      chosen = Math.floor((MAP_HEIGHT / 2) * MAP_WIDTH + (i * MAP_WIDTH / COUNTRY_NAMES.length));
    }
    countrySeeds.push({ x: chosen % MAP_WIDTH, y: Math.floor(chosen / MAP_WIDTH) });
  }

  const cells: WorldCell[] = new Array(MAP_WIDTH * MAP_HEIGHT);
  const countryLandCounts = new Array(COUNTRY_NAMES.length).fill(0) as number[];
  const countryWeights = new Array(COUNTRY_NAMES.length).fill(0) as number[];
  const cellWeights = new Float64Array(MAP_WIDTH * MAP_HEIGHT);

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const index = y * MAP_WIDTH + x;
      if (!rawLand[index]) {
        cells[index] = { terrain: 'ocean', countryIndex: -1, population: 0 };
        continue;
      }
      let nearest = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (let c = 0; c < countrySeeds.length; c++) {
        const dx = wrapDistanceX(x, countrySeeds[c].x);
        const dy = y - countrySeeds[c].y;
        const distance = dx * dx + dy * dy;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = c;
        }
      }
      const score = elevation[index];
      const terrain: Terrain = score > 0.49 ? 'mountains' : score > 0.34 ? 'highlands' : 'plains';
      const left = y * MAP_WIDTH + (x === 0 ? MAP_WIDTH - 1 : x - 1);
      const right = y * MAP_WIDTH + (x === MAP_WIDTH - 1 ? 0 : x + 1);
      const up = y > 0 ? index - MAP_WIDTH : -1;
      const down = y < MAP_HEIGHT - 1 ? index + MAP_WIDTH : -1;
      const nearOcean = [left, right, up, down].some((neighbor) => neighbor >= 0 && !rawLand[neighbor]);
      cells[index] = { terrain: nearOcean ? 'coast' : terrain, countryIndex: nearest, population: 0 };
      countryLandCounts[nearest]++;
      const latitudeFactor = 0.55 + (1 - Math.abs((y / MAP_HEIGHT) * 2 - 1)) * 0.45;
      const terrainFactor = terrain === 'mountains' ? 0.28 : terrain === 'highlands' ? 0.72 : 1;
      const coastFactor = nearOcean ? 1.25 : 1;
      const weight = latitudeFactor * terrainFactor * coastFactor;
      cellWeights[index] = weight;
      countryWeights[nearest] += weight;
    }
  }

  const totalWeight = countryWeights.reduce((sum, value) => sum + value, 0);
  const populations = countryWeights.map((weight) => Math.floor(INITIAL_POPULATION * weight / totalWeight));
  let remainder = INITIAL_POPULATION - populations.reduce((sum, value) => sum + value, 0);
  const remainderOrder = countryWeights
    .map((weight, index) => ({ index, fraction: INITIAL_POPULATION * weight / totalWeight - populations[index] }))
    .sort((a, b) => b.fraction - a.fraction);
  for (let i = 0; i < remainder; i++) populations[remainderOrder[i].index]++;

  const countries = COUNTRY_NAMES.map((name, index): Country => ({
    id: `country-${String(index + 1).padStart(2, '0')}`,
    name,
    color: COUNTRY_COLORS[index],
    population: populations[index],
    landCells: countryLandCounts[index]
  }));

  // Distribute each country's people over its land cells using the same deterministic weights.
  const countryAssigned = new Array(COUNTRY_NAMES.length).fill(0) as number[];
  for (let index = 0; index < cells.length; index++) {
    const cell = cells[index];
    if (cell.countryIndex < 0) continue;
    const weight = cellWeights[index];
    const country = countries[cell.countryIndex];
    const allocation = Math.floor(country.population * weight / countryWeights[cell.countryIndex]);
    cell.population = allocation;
    countryAssigned[cell.countryIndex] += allocation;
  }
  // Put rounding remainder into the first land cell belonging to each country.
  for (let c = 0; c < countries.length; c++) {
    const extra = countries[c].population - countryAssigned[c];
    if (extra <= 0) continue;
    const firstCell = cells.find((cell) => cell.countryIndex === c);
    if (firstCell) firstCell.population += extra;
  }

  return {
    seed,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    cells,
    countries,
    totalPopulation: countries.reduce((sum, country) => sum + country.population, 0)
  };
}

export function getWorldSummary(world: PlanetWorld): string {
  const land = world.cells.filter((cell) => cell.countryIndex >= 0).length;
  return `${world.countries.length} COUNTRIES · ${world.totalPopulation.toLocaleString('en-US')} INHABITANTS · ${Math.round(land / world.cells.length * 100)}% LAND`;
}
