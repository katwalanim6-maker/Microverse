export const WORLD_SEED = 4182026;
export const SPECIES_NAME = 'Senpe';
export const INITIAL_POPULATION_PER_COUNTRY = 1_000_000;
export const COUNTRY_COUNT = 100;
export const INITIAL_POPULATION = COUNTRY_COUNT * INITIAL_POPULATION_PER_COUNTRY;
export const TARGET_LAND_PERCENT = 73;
export const MAP_WIDTH = 3240;
export const MAP_HEIGHT = 1620;
const MAP_SCALE = MAP_WIDTH / 1620;

export type Terrain = 'ocean' | 'coast' | 'plains' | 'highlands' | 'mountains';
export type Biome = 'ocean' | 'coast' | 'grassland' | 'forest' | 'desert' | 'tundra' | 'alpine';

export interface CountryGeography {
  surfaceAreaPercent: number;
  landSharePercent: number;
  coastlineCells: number;
  riverCells: number;
  highestElevation: number;
  terrain: Record<'coast' | 'plains' | 'highlands' | 'mountains', number>;
  biomes: Record<'coast' | 'grassland' | 'forest' | 'desert' | 'tundra' | 'alpine', number>;
}

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
  geography: CountryGeography;
}

export interface WorldCell {
  terrain: Terrain;
  countryIndex: number;
  population: number;
  elevation: number;
  moisture: number;
  temperature: number;
  biome: Biome;
  river: boolean;
  tectonicActivity: number;
  volcanic: boolean;
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

interface TectonicPlate {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function generateTectonicPlates(seed: number): TectonicPlate[] {
  const rand = seededRandom(seed + 74021);
  return Array.from({ length: 18 }, () => {
    const angle = rand() * Math.PI * 2;
    const speed = 0.25 + rand() * 0.75;
    return {
      x: rand() * MAP_WIDTH,
      y: 36 * MAP_SCALE + rand() * (MAP_HEIGHT - 72 * MAP_SCALE),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    };
  });
}

function signedWrapDeltaX(from: number, to: number): number {
  let delta = to - from;
  if (delta > MAP_WIDTH / 2) delta -= MAP_WIDTH;
  if (delta < -MAP_WIDTH / 2) delta += MAP_WIDTH;
  return delta;
}

function sampleTectonics(x: number, y: number, plates: TectonicPlate[]): {
  activity: number;
  uplift: number;
  volcanic: boolean;
} {
  let nearest = plates[0];
  let second = plates[1];
  let nearestDistance = Number.POSITIVE_INFINITY;
  let secondDistance = Number.POSITIVE_INFINITY;
  for (const plate of plates) {
    const dx = wrapDistanceX(x, plate.x);
    const dy = y - plate.y;
    const distance = dx * dx + dy * dy;
    if (distance < nearestDistance) {
      second = nearest;
      secondDistance = nearestDistance;
      nearest = plate;
      nearestDistance = distance;
    } else if (distance < secondDistance) {
      second = plate;
      secondDistance = distance;
    }
  }
  const nxRaw = signedWrapDeltaX(nearest.x, second.x);
  const nyRaw = second.y - nearest.y;
  const normalLength = Math.hypot(nxRaw, nyRaw) || 1;
  const nx = nxRaw / normalLength;
  const ny = nyRaw / normalLength;
  const relativeMotion = (second.vx - nearest.vx) * nx + (second.vy - nearest.vy) * ny;
  const convergence = Math.max(0, Math.min(1, 0.5 - relativeMotion * 0.9));
  const divergence = Math.max(0, Math.min(1, 0.5 + relativeMotion * 0.9));
  const boundaryGap = Math.max(0, Math.sqrt(secondDistance) - Math.sqrt(nearestDistance));
  const boundaryInfluence = Math.exp(-boundaryGap / (22.5 * MAP_SCALE));
  const activity = boundaryInfluence * Math.min(1, 0.35 + Math.abs(relativeMotion));
  const uplift = boundaryInfluence * (0.035 + convergence * 0.29);
  return {
    activity,
    uplift,
    volcanic: boundaryInfluence > 0.46 && (convergence > 0.66 || divergence > 0.66)
  };
}

function wrapDistanceX(a: number, b: number): number {
  const direct = Math.abs(a - b);
  return Math.min(direct, MAP_WIDTH - direct);
}

function generateLandmasses(rand: () => number): Landmass[] {
  const masses: Landmass[] = [];
  for (let i = 0; i < 9; i++) {
    masses.push({
      x: rand() * MAP_WIDTH,
      y: 54 * MAP_SCALE + rand() * (MAP_HEIGHT - 108 * MAP_SCALE),
      rx: (81 + rand() * 138) * MAP_SCALE,
      ry: (48 + rand() * 99) * MAP_SCALE,
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
    + (smoothNoise(x / (135 * MAP_SCALE), y / (99 * MAP_SCALE), seed) - 0.5) * 0.28
    + (smoothNoise(x / (40.5 * MAP_SCALE), y / (36 * MAP_SCALE), seed + 91) - 0.5) * 0.12
    + (smoothNoise(x / (15.75 * MAP_SCALE), y / (15.75 * MAP_SCALE), seed + 177) - 0.5) * 0.045;
}

function selectCountrySeeds(landIndices: ArrayLike<number>, rand: () => number): CountrySeed[] {
  if (landIndices.length < COUNTRY_COUNT) {
    throw new Error('The generated planet does not contain enough land for 100 countries.');
  }
  const seeds: number[] = [];
  const selected = new Uint8Array(MAP_WIDTH * MAP_HEIGHT);
  const first = Math.floor(rand() * landIndices.length);
  seeds.push(landIndices[first]);
  selected[landIndices[first]] = 1;

  // Sample one candidate in every eight land cells to reduce repeated full-grid scans.
  const candidates: number[] = [];
  for (let i = 0; i < landIndices.length; i += 8) candidates.push(landIndices[i]);
  if (candidates[candidates.length - 1] !== landIndices[landIndices.length - 1]) candidates.push(landIndices[landIndices.length - 1]);
  const minDistances = new Float64Array(candidates.length);
  minDistances.fill(Number.POSITIVE_INFINITY);
  while (seeds.length < COUNTRY_COUNT) {
    const latest = seeds[seeds.length - 1];
    const sx = latest % MAP_WIDTH;
    const sy = Math.floor(latest / MAP_WIDTH);
    let bestPosition = -1;
    let bestDistance = -1;
    for (let i = 0; i < candidates.length; i++) {
      const index = candidates[i];
      const dx = wrapDistanceX(index % MAP_WIDTH, sx);
      const dy = Math.floor(index / MAP_WIDTH) - sy;
      const distance = dx * dx + dy * dy;
      if (distance < minDistances[i]) minDistances[i] = distance;
      if (!selected[index] && minDistances[i] > bestDistance) { bestDistance = minDistances[i]; bestPosition = i; }
    }
    if (bestPosition < 0) throw new Error('Could not place 100 distinct country seeds.');
    seeds.push(candidates[bestPosition]);
    selected[candidates[bestPosition]] = 1;
  }
  return seeds.map((index) => ({ x: index % MAP_WIDTH, y: Math.floor(index / MAP_WIDTH) }));
}

export function generatePlanetWorld(seed = WORLD_SEED): PlanetWorld {
  const rand = seededRandom(seed);
  const masses = generateLandmasses(rand);
  const tectonicPlates = generateTectonicPlates(seed);
  const scores = new Float32Array(MAP_WIDTH * MAP_HEIGHT);
  // Pack score + cell index into sortable numeric keys to avoid over a million
  // short-lived JavaScript objects on mobile devices.
  const orderKeys = new Float64Array(MAP_WIDTH * MAP_HEIGHT);
  const orderScale = 4294967296;
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
      // Quantize score to an integer before packing. Fractional score values
      // cannot be recovered safely with modulo after multiplication.
      const scoreBucket = Math.round(score * 100000) + 100000;
      orderKeys[index] = scoreBucket * orderScale + index;
    }
  }

  // Select land by spherical cell area, not raw pixel count, so the planet's surface is 73% land.
  orderKeys.sort();
  const rawLand = new Uint8Array(orderKeys.length);
  const targetSurfaceWeight = totalSurfaceWeight * TARGET_LAND_PERCENT / 100;
  const landIndexBuffer = new Int32Array(orderKeys.length);
  let landCount = 0;
  let selectedSurfaceWeight = 0;
  let lastLandIndex = -1;
  for (let rank = orderKeys.length - 1; rank >= 0; rank--) {
    if (selectedSurfaceWeight >= targetSurfaceWeight) break;
    const index = Math.round(orderKeys[rank] % orderScale);
    const y = Math.floor(index / MAP_WIDTH);
    const surfaceWeight = Math.cos((0.5 - y / MAP_HEIGHT) * Math.PI);
    rawLand[index] = 1;
    landIndexBuffer[landCount++] = index;
    selectedSurfaceWeight += surfaceWeight;
    lastLandIndex = index;
  }

  // The final whole cell can cross the target. Keep whichever side is closer
  // to 73% so the finite grid has the smallest possible area-weight error.
  if (lastLandIndex >= 0) {
    const lastRow = Math.floor(lastLandIndex / MAP_WIDTH);
    const lastSurfaceWeight = Math.cos((0.5 - lastRow / MAP_HEIGHT) * Math.PI);
    const withLastError = Math.abs(selectedSurfaceWeight - targetSurfaceWeight);
    const withoutLastError = Math.abs(selectedSurfaceWeight - lastSurfaceWeight - targetSurfaceWeight);
    if (withoutLastError < withLastError) {
      rawLand[lastLandIndex] = 0;
      landCount--;
      selectedSurfaceWeight -= lastSurfaceWeight;
    }
  }

  const landIndices = landIndexBuffer.subarray(0, landCount);
  const countrySeeds = selectCountrySeeds(landIndices, rand);
  const cells: WorldCell[] = new Array(orderKeys.length);
  const countryLandCounts = new Array(COUNTRY_COUNT).fill(0) as number[];
  const countryWeights = new Array(COUNTRY_COUNT).fill(0) as number[];
  const countrySurfaceWeights = new Array(COUNTRY_COUNT).fill(0) as number[];
  const landThreshold = scores[landIndices[landIndices.length - 1]];
  const cellWeights = new Float32Array(orderKeys.length);
  // Build an explicit owner lookup for the 100 seed cells. Seed ownership
  // takes priority over distance calculations, guaranteeing every country
  // starts with at least one land cell.
  const countryOwners = new Int16Array(orderKeys.length);
  countryOwners.fill(-1);
  const seedOwnerByCell = new Map<number, number>();
  for (let country = 0; country < countrySeeds.length; country++) {
    const seedIndex = countrySeeds[country].y * MAP_WIDTH + countrySeeds[country].x;
    if (!rawLand[seedIndex]) {
      throw new Error(`Country ${country + 1} seed ${seedIndex} is not land.`);
    }
    const existingSeedOwner = seedOwnerByCell.get(seedIndex);
    if (existingSeedOwner !== undefined) {
      throw new Error(`Countries ${existingSeedOwner + 1} and ${country + 1} share seed cell ${seedIndex}.`);
    }
    seedOwnerByCell.set(seedIndex, country);
  }
  // Build a coarse Voronoi ownership atlas once, then expand it over the
  // high-resolution geography. This avoids comparing ~3.8 million land cells
  // against all 100 seeds (hundreds of millions of distance checks).
  // Seed cells are pinned below, so every country is guaranteed to own land.
  const ownershipScale = 10;
  const ownershipWidth = Math.ceil(MAP_WIDTH / ownershipScale);
  const ownershipHeight = Math.ceil(MAP_HEIGHT / ownershipScale);
  const coarseOwners = new Int16Array(ownershipWidth * ownershipHeight);
  for (let coarseY = 0; coarseY < ownershipHeight; coarseY++) {
    const y = Math.min(MAP_HEIGHT - 1, coarseY * ownershipScale + ownershipScale / 2);
    for (let coarseX = 0; coarseX < ownershipWidth; coarseX++) {
      const x = Math.min(MAP_WIDTH - 1, coarseX * ownershipScale + ownershipScale / 2);
      let nearestCountry = -1;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (let country = 0; country < countrySeeds.length; country++) {
        const dx = wrapDistanceX(x, countrySeeds[country].x);
        const dy = y - countrySeeds[country].y;
        const distance = dx * dx + dy * dy;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestCountry = country;
        }
      }
      if (nearestCountry < 0) throw new Error(`Coarse geography cell ${coarseX},${coarseY} could not be assigned.`);
      coarseOwners[coarseY * ownershipWidth + coarseX] = nearestCountry;
    }
  }
  for (const index of landIndices) {
    const pinnedOwner = seedOwnerByCell.get(index) ?? -1;
    if (pinnedOwner !== -1) {
      countryOwners[index] = pinnedOwner;
      continue;
    }
    const x = index % MAP_WIDTH;
    const y = Math.floor(index / MAP_WIDTH);
    const coarseX = Math.min(ownershipWidth - 1, Math.floor(x / ownershipScale));
    const coarseY = Math.min(ownershipHeight - 1, Math.floor(y / ownershipScale));
    const owner = coarseOwners[coarseY * ownershipWidth + coarseX];
    if (owner < 0 || owner >= COUNTRY_COUNT) {
      throw new Error(`Land cell ${index} received invalid coarse owner ${owner}.`);
    }
    countryOwners[index] = owner;
  }
  for (let country = 0; country < COUNTRY_COUNT; country++) {
    const seedIndex = countrySeeds[country].y * MAP_WIDTH + countrySeeds[country].x;
    if (countryOwners[seedIndex] !== country) {
      throw new Error(`Country ${country + 1} seed ownership mismatch: expected ${country}, got ${countryOwners[seedIndex]}.`);
    }
  }
  const riverSources = new Int32Array(COUNTRY_COUNT);
  riverSources.fill(-1);
  const riverSourceHeights = new Float32Array(COUNTRY_COUNT);
  riverSourceHeights.fill(0.34);

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const index = y * MAP_WIDTH + x;
      if (!rawLand[index]) {
        cells[index] = { terrain: 'ocean', countryIndex: -1, population: 0, elevation: 0, moisture: 0, temperature: 0, biome: 'ocean', river: false, tectonicActivity: 0, volcanic: false };
        continue;
      }
      const nearest = countryOwners[index];
      if (nearest < 0 || nearest >= COUNTRY_COUNT) {
        throw new Error(`Land cell ${index} has invalid owner ${nearest}; seed count=${countrySeeds.length}.`);
      }
      const score = scores[index];
      const broadRelief = smoothNoise(x / (75 * MAP_SCALE), y / (57 * MAP_SCALE), seed + 201);
      const ridgeNoise = 1 - Math.abs(smoothNoise(x / (24 * MAP_SCALE), y / (21 * MAP_SCALE), seed + 207) * 2 - 1);
      const fineRelief = smoothNoise(x / (9.6 * MAP_SCALE), y / (9.6 * MAP_SCALE), seed + 209);
      const tectonics = sampleTectonics(x, y, tectonicPlates);
      const relativeElevation = Math.max(0, Math.min(1,
        ((score - landThreshold) / 0.62) * 0.56 + broadRelief * 0.14 + ridgeNoise * 0.12 + fineRelief * 0.05 + tectonics.uplift + tectonics.activity * 0.08
      ));
      const baseTerrain: Terrain = relativeElevation > 0.72 ? 'mountains' : relativeElevation > 0.39 ? 'highlands' : 'plains';
      const left = y * MAP_WIDTH + (x === 0 ? MAP_WIDTH - 1 : x - 1);
      const right = y * MAP_WIDTH + (x === MAP_WIDTH - 1 ? 0 : x + 1);
      const up = y > 0 ? index - MAP_WIDTH : -1;
      const down = y < MAP_HEIGHT - 1 ? index + MAP_WIDTH : -1;
      const nearOcean = [left, right, up, down].some((neighbor) => neighbor >= 0 && !rawLand[neighbor]);
      const terrain: Terrain = nearOcean ? 'coast' : baseTerrain;
      const latitude = 1 - Math.abs((y / (MAP_HEIGHT - 1)) * 2 - 1);
      const moisture = Math.max(0, Math.min(1,
        smoothNoise(x / (19 * MAP_SCALE), y / (14 * MAP_SCALE), seed + 311) * 0.55
        + smoothNoise(x / (5.5 * MAP_SCALE), y / (4.5 * MAP_SCALE), seed + 313) * 0.25
        + (nearOcean ? 0.16 : 0.04)
      ));
      const temperature = Math.max(0, Math.min(1, latitude * 0.92 + 0.08 - relativeElevation * 0.22));
      const biome: Biome = baseTerrain === 'mountains' && relativeElevation > 0.78
        ? 'alpine'
        : temperature < 0.2 ? 'tundra'
        : moisture < 0.22 ? 'desert'
        : moisture > 0.62 ? 'forest'
        : 'grassland';
      cells[index] = {
        terrain, countryIndex: nearest, population: 0,
        elevation: relativeElevation, moisture, temperature, biome, river: false,
        tectonicActivity: tectonics.activity, volcanic: tectonics.volcanic
      };
      if (terrain !== 'coast' && relativeElevation > riverSourceHeights[nearest]) {
        riverSourceHeights[nearest] = relativeElevation;
        riverSources[nearest] = index;
      }
      countryLandCounts[nearest]++;
      const latitudeFactor = 0.55 + latitude * 0.45;
      const terrainFactor = baseTerrain === 'mountains' ? 0.28 : baseTerrain === 'highlands' ? 0.72 : 1;
      const weight = latitudeFactor * terrainFactor * (nearOcean ? 1.25 : 1);
      cellWeights[index] = weight;
      countryWeights[nearest] += weight;
      countrySurfaceWeights[nearest] += Math.cos((0.5 - y / MAP_HEIGHT) * Math.PI);
    }
  }

  // Trace a natural drainage path from each country's highest interior point.
  // Rivers follow downhill cells and terminate at the coast or ocean.
  for (let countryIndex = 0; countryIndex < COUNTRY_COUNT; countryIndex++) {
    const source = riverSources[countryIndex];
    if (source < 0) continue;
    let current = source;
    const visited = new Set<number>();
    for (let step = 0; step < 660; step++) {
      if (visited.has(current)) break;
      visited.add(current);
      const currentCell = cells[current];
      currentCell.river = true;
      if (currentCell.terrain === 'coast') break;
      const cx = current % MAP_WIDTH;
      const cy = Math.floor(current / MAP_WIDTH);
      let next = -1;
      let lowest = currentCell.elevation;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = cy + dy;
          if (ny < 0 || ny >= MAP_HEIGHT) continue;
          const nx = (cx + dx + MAP_WIDTH) % MAP_WIDTH;
          const candidateIndex = ny * MAP_WIDTH + nx;
          const candidate = cells[candidateIndex];
          const candidateHeight = candidate.terrain === 'ocean' ? -1 : candidate.elevation;
          if (candidateHeight < lowest) {
            lowest = candidateHeight;
            next = candidateIndex;
          }
        }
      }
      if (next < 0) break;
      current = next;
      if (cells[current].terrain === 'ocean') break;
    }
  }

  const geography = Array.from({ length: COUNTRY_COUNT }, () => ({
    coastlineCells: 0,
    riverCells: 0,
    highestElevation: 0,
    terrain: { coast: 0, plains: 0, highlands: 0, mountains: 0 },
    biomes: { coast: 0, grassland: 0, forest: 0, desert: 0, tundra: 0, alpine: 0 }
  }));
  for (const cell of cells) {
    if (cell.countryIndex < 0) continue;
    const stats = geography[cell.countryIndex];
    if (cell.terrain === 'coast') {
      stats.coastlineCells++;
      stats.biomes.coast++;
    } else if (cell.terrain !== 'ocean') {
      stats.terrain[cell.terrain]++;
      if (cell.biome !== 'ocean') stats.biomes[cell.biome]++;
    }
    if (cell.river) stats.riverCells++;
    stats.highestElevation = Math.max(stats.highestElevation, cell.elevation);
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
    status: 'unsettled',
    geography: {
      surfaceAreaPercent: countrySurfaceWeights[index] / totalSurfaceWeight * 100,
      landSharePercent: countrySurfaceWeights[index] / selectedSurfaceWeight * 100,
      ...geography[index]
    }
  }));

  for (let country = 0; country < COUNTRY_COUNT; country++) {
    if (countryLandCounts[country] < 1) throw new Error(`Country ${country + 1} has no land cells after territory assignment.`);
  }

  // Allocate exactly one million people to each country, then distribute them across its land.
  const countryAssigned = new Array(COUNTRY_COUNT).fill(0) as number[];
  const firstCellIndices = new Int32Array(COUNTRY_COUNT);
  firstCellIndices.fill(-1);
  for (let index = 0; index < cells.length; index++) {
    const cell = cells[index];
    if (cell.countryIndex < 0) continue;
    const countryIndex = cell.countryIndex;
    if (firstCellIndices[countryIndex] < 0) firstCellIndices[countryIndex] = index;
    const weightTotal = countryWeights[countryIndex];
    if (weightTotal <= 0) throw new Error(`Country ${countryIndex + 1} has no territory.`);
    const allocation = Math.floor(INITIAL_POPULATION_PER_COUNTRY * cellWeights[index] / weightTotal);
    cell.population = allocation;
    countryAssigned[countryIndex] += allocation;
  }
  for (let c = 0; c < countries.length; c++) {
    const extra = countries[c].population - countryAssigned[c];
    const firstCellIndex = firstCellIndices[c];
    if (firstCellIndex < 0) throw new Error(`Country ${c + 1} has no land cells.`);
    cells[firstCellIndex].population += extra;
  }

  const landPercent = selectedSurfaceWeight / totalSurfaceWeight * 100;
  const totalPopulation = countries.reduce((sum, country) => sum + country.population, 0);
  if (countries.length !== COUNTRY_COUNT || totalPopulation !== INITIAL_POPULATION) {
    throw new Error('World generation failed its country-count or population invariant.');
  }

  return { seed, width: MAP_WIDTH, height: MAP_HEIGHT, cells, countries, totalPopulation, landPercent };
}

export function getWorldSummary(world: PlanetWorld): string {
  return `${world.countries.length} COUNTRIES · ${world.totalPopulation.toLocaleString('en-US')} SENPE · ${world.landPercent.toFixed(0)}% LAND`;
}
