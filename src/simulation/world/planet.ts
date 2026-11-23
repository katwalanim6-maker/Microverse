export const WORLD_SEED = 4182026;
export const INITIAL_POPULATION_PER_COUNTRY = 1_000_000;
export const COUNTRY_COUNT = 100;
export const INITIAL_POPULATION = COUNTRY_COUNT * INITIAL_POPULATION_PER_COUNTRY;
export const TARGET_LAND_PERCENT = 73;
export const MAP_WIDTH = 360;
export const MAP_HEIGHT = 180;

export type Terrain = 'ocean' | 'coast' | 'plains' | 'highlands' | 'mountains';

export interface Country {
  id: string;
  name: string;
  color: string;
  population: number;
  landCells: number;
  capital: string | null;
  government: string;
  currency: string;
  economy: string;
  foundedYear: number | null;
  status: 'unsettled' | 'established';
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
  landPercent: number;
}

const NAME_PREFIXES = ["Ael","Bel","Cor","Dra","Eri","Fal","Gal","Ith","Kor","Lun"];
const NAME_SUFFIXES = ["ara","en","oria","eth","una","ovar","ira","yss","alon","eia"];
const COUNTRY_NAMES = NAME_PREFIXES.flatMap((prefix) =>
  NAME_SUFFIXES.map((suffix) => prefix + suffix)
);
const COUNTRY_COLORS = ["#9f5656","#5db176","#9b69bf","#b1a543","#639fab","#b96e96","#62ab49","#5751bd","#b48974","#50a586","#af57b7","#afc464","#567a9f","#b15d6e","#69bf70","#6e43b1","#ab9363","#6eb9b7","#ab4993","#82bd51","#747eb4","#a55b50","#57b77f","#a964c4","#9f9f56","#5d98b1","#bf698d","#50b143","#6f63ab","#b9916e","#49ab93","#bd51b8","#9fb474","#506fa5","#b7575f","#64c479","#7a569f","#b1a05d","#69b8bf","#b14387","#7bab63","#6e71b9","#ab6249","#51bd8d","#a974b4","#9aa550","#578fb7","#c4647f","#569f56","#765db1","#bf9b69","#43b1a5","#ab639f","#96b96e","#4962ab","#bd5751","#74b489","#8650a5","#b7af57","#64afc4","#9f567a","#6eb15d","#7069bf","#b16e43","#63ab94","#b76eb9","#91ab49","#5182bd","#b4747d","#50a55b","#8157b7","#c4a964","#569e9f","#b15d98","#8bbf69","#4350b1","#ab7063","#6eb991","#9549ab","#b8bd51","#749eb4","#a5506f","#5eb757","#7964c4","#9f7c56","#5db1a0","#bf69b6","#87b143","#637aab","#b96e71","#49ab64","#8d51bd","#b4aa74","#509aa5","#b7578e","#7fc464","#57569f","#b1765d","#69bf9c","#a543b1"];

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
  const top = hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * sx;
  const bottom = hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * sx;
  return top + (bottom - top) * sy;
}

interface Landmass {
  x: number; y: number; rx: number; ry: number; rotation: number; strength: number;
}

interface CountrySeed { x: number; y: number; }

function wrapDistanceX(a: number, b: number): number {
  const direct = Math.abs(a - b);
  return Math.min(direct, MAP_WIDTH - direct);
}

function generateLandmasses(rand: () => number): Landmass[] {
  const masses: Landmass[] = [];
  for (let i = 0; i < 9; i++) {
    masses.push({
      x: rand() * MAP_WIDTH,
      y: 18 + rand() * (MAP_HEIGHT - 36),
      rx: 18 + rand() * 31,
      ry: 11 + rand() * 22,
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
    const influence = mass.strength - Math.sqrt(rx * rx + ry * ry) * 0.43;
    continental = Math.max(continental, influence);
  }
  return continental
    + (smoothNoise(x / 30, y / 22, seed) - 0.5) * 0.28
    + (smoothNoise(x / 9, y / 8, seed + 91) - 0.5) * 0.12
    + (smoothNoise(x / 3.5, y / 3.5, seed + 177) - 0.5) * 0.045;
}

function selectCountrySeeds(landIndices: number[], rand: () => number): CountrySeed[] {
  if (landIndices.length < COUNTRY_COUNT) {
    throw new Error('The generated planet does not contain enough land for 100 countries.');
  }
  const seeds: number[] = [];
  const selected = new Uint8Array(MAP_WIDTH * MAP_HEIGHT);
  const first = Math.floor(rand() * landIndices.length);
  seeds.push(landIndices[first]);
  selected[landIndices[first]] = 1;

  // Farthest-point sampling spreads country capitals across the available land.
  const minDistances = new Float64Array(landIndices.length);
  minDistances.fill(Number.POSITIVE_INFINITY);
  while (seeds.length < COUNTRY_COUNT) {
    const latest = seeds[seeds.length - 1];
    const sx = latest % MAP_WIDTH;
    const sy = Math.floor(latest / MAP_WIDTH);
    let bestPosition = -1;
    let bestDistance = -1;
    for (let i = 0; i < landIndices.length; i++) {
      const index = landIndices[i];
      const dx = wrapDistanceX(index % MAP_WIDTH, sx);
      const dy = Math.floor(index / MAP_WIDTH) - sy;
      const distance = dx * dx + dy * dy;
      if (distance < minDistances[i]) minDistances[i] = distance;
      if (!selected[index] && minDistances[i] > bestDistance) {
        bestDistance = minDistances[i];
        bestPosition = i;
      }
    }
    if (bestPosition < 0) throw new Error('Could not place 100 distinct country seeds.');
    seeds.push(landIndices[bestPosition]);
    selected[landIndices[bestPosition]] = 1;
  }
  return seeds.map((index) => ({ x: index % MAP_WIDTH, y: Math.floor(index / MAP_WIDTH) }));
}

export function generatePlanetWorld(seed = WORLD_SEED): PlanetWorld {
  const rand = seededRandom(seed);
  const masses = generateLandmasses(rand);
  const scores = new Float32Array(MAP_WIDTH * MAP_HEIGHT);
  const ranked: Array<{ index: number; score: number; surfaceWeight: number }> = [];
  let totalSurfaceWeight = 0;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const index = y * MAP_WIDTH + x;
      const polarPenalty = Math.abs((y / MAP_HEIGHT) * 2 - 1) * 0.12;
      const score = landScore(x, y, masses, seed) - polarPenalty;
      scores[index] = score;
      const latitudeRadians = ((0.5 - y / MAP_HEIGHT) * Math.PI);
      const surfaceWeight = Math.cos(latitudeRadians);
      totalSurfaceWeight += surfaceWeight;
      ranked.push({ index, score, surfaceWeight });
    }
  }

  // Select land by spherical cell area, not raw pixel count, so the planet's surface is 73% land.
  ranked.sort((a, b) => b.score - a.score);
  const rawLand = new Uint8Array(ranked.length);
  const targetSurfaceWeight = totalSurfaceWeight * TARGET_LAND_PERCENT / 100;
  const landIndices: number[] = [];
  let selectedSurfaceWeight = 0;
  for (const cell of ranked) {
    if (selectedSurfaceWeight >= targetSurfaceWeight) break;
    rawLand[cell.index] = 1;
    landIndices.push(cell.index);
    selectedSurfaceWeight += cell.surfaceWeight;
  }

  // The final whole cell can cross the target. Keep whichever side is closer
  // to 73% so the finite grid has the smallest possible area-weight error.
  const lastLandIndex = landIndices[landIndices.length - 1];
  const lastLandCell = ranked.find((cell) => cell.index === lastLandIndex);
  if (lastLandCell) {
    const withLastError = Math.abs(selectedSurfaceWeight - targetSurfaceWeight);
    const withoutLastError = Math.abs(
      selectedSurfaceWeight - lastLandCell.surfaceWeight - targetSurfaceWeight
    );
    if (withoutLastError < withLastError) {
      rawLand[lastLandIndex] = 0;
      landIndices.pop();
      selectedSurfaceWeight -= lastLandCell.surfaceWeight;
    }
  }

  const countrySeeds = selectCountrySeeds(landIndices, rand);
  const cells: WorldCell[] = new Array(ranked.length);
  const countryLandCounts = new Array(COUNTRY_COUNT).fill(0) as number[];
  const countryWeights = new Array(COUNTRY_COUNT).fill(0) as number[];
  const cellWeights = new Float64Array(ranked.length);

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
      const score = scores[index];
      const baseTerrain: Terrain = score > 0.49 ? 'mountains' : score > 0.34 ? 'highlands' : 'plains';
      const left = y * MAP_WIDTH + (x === 0 ? MAP_WIDTH - 1 : x - 1);
      const right = y * MAP_WIDTH + (x === MAP_WIDTH - 1 ? 0 : x + 1);
      const up = y > 0 ? index - MAP_WIDTH : -1;
      const down = y < MAP_HEIGHT - 1 ? index + MAP_WIDTH : -1;
      const nearOcean = [left, right, up, down].some((neighbor) => neighbor >= 0 && !rawLand[neighbor]);
      cells[index] = { terrain: nearOcean ? 'coast' : baseTerrain, countryIndex: nearest, population: 0 };
      countryLandCounts[nearest]++;
      const latitudeFactor = 0.55 + (1 - Math.abs((y / MAP_HEIGHT) * 2 - 1)) * 0.45;
      const terrainFactor = baseTerrain === 'mountains' ? 0.28 : baseTerrain === 'highlands' ? 0.72 : 1;
      const weight = latitudeFactor * terrainFactor * (nearOcean ? 1.25 : 1);
      cellWeights[index] = weight;
      countryWeights[nearest] += weight;
    }
  }

  const countries: Country[] = COUNTRY_NAMES.map((name, index) => ({
    id: `country-${String(index + 1).padStart(3, '0')}`,
    name,
    color: COUNTRY_COLORS[index],
    population: INITIAL_POPULATION_PER_COUNTRY,
    landCells: countryLandCounts[index],
    capital: null,
    government: 'Not yet established',
    currency: 'Not yet established',
    economy: 'Not yet established',
    foundedYear: null,
    status: 'unsettled'
  }));

  // Allocate exactly one million people to each country, then distribute them across its land.
  const countryAssigned = new Array(COUNTRY_COUNT).fill(0) as number[];
  for (let index = 0; index < cells.length; index++) {
    const cell = cells[index];
    if (cell.countryIndex < 0) continue;
    const countryIndex = cell.countryIndex;
    const weightTotal = countryWeights[countryIndex];
    if (weightTotal <= 0) throw new Error(`Country ${countryIndex + 1} has no territory.`);
    const allocation = Math.floor(INITIAL_POPULATION_PER_COUNTRY * cellWeights[index] / weightTotal);
    cell.population = allocation;
    countryAssigned[countryIndex] += allocation;
  }
  for (let c = 0; c < countries.length; c++) {
    const extra = countries[c].population - countryAssigned[c];
    const firstCell = cells.find((cell) => cell.countryIndex === c);
    if (!firstCell) throw new Error(`Country ${c + 1} has no land cells.`);
    firstCell.population += extra;
  }

  const landPercent = selectedSurfaceWeight / totalSurfaceWeight * 100;
  const totalPopulation = countries.reduce((sum, country) => sum + country.population, 0);
  if (countries.length !== COUNTRY_COUNT || totalPopulation !== INITIAL_POPULATION) {
    throw new Error('World generation failed its country-count or population invariant.');
  }

  return { seed, width: MAP_WIDTH, height: MAP_HEIGHT, cells, countries, totalPopulation, landPercent };
}

export function getWorldSummary(world: PlanetWorld): string {
  return `${world.countries.length} COUNTRIES · ${world.totalPopulation.toLocaleString('en-US')} INHABITANTS · ${world.landPercent.toFixed(0)}% LAND`;
}
