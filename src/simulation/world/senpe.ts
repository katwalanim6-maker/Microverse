export const SENPE_MATURITY_AGE = 6;
export const SENPE_LIFESPAN_YEARS = 35;
export const SENPE_BIRTHS_PER_ADULT_YEAR = 1 / 29;
export const SENPE_POPULATION_STORAGE_KEY = 'microverse-senpe-population-v1';

export interface SenpePopulationState {
  version: 1;
  seed: number;
  processedYear: number;
  ageCohorts: number[][];
  births: number;
  deaths: number;
  birthRemainders: number[];
}

export interface SenpePopulationStats {
  total: number;
  young: number;
  mature: number;
  births: number;
  deaths: number;
  year: number;
}

export function createSenpePopulationState(seed: number, countryPopulations: number[]): SenpePopulationState {
  const ageCohorts = countryPopulations.map((population) => {
    const base = Math.floor(population / SENPE_LIFESPAN_YEARS);
    const remainder = population - base * SENPE_LIFESPAN_YEARS;
    return Array.from({ length: SENPE_LIFESPAN_YEARS }, (_, age) => base + (age < remainder ? 1 : 0));
  });
  return {
    version: 1,
    seed,
    processedYear: 0,
    ageCohorts,
    births: 0,
    deaths: 0,
    birthRemainders: countryPopulations.map(() => 0)
  };
}

export function loadSenpePopulationState(seed: number, countryPopulations: number[]): SenpePopulationState {
  try {
    const raw = localStorage.getItem(SENPE_POPULATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SenpePopulationState;
      const valid = parsed.version === 1
        && parsed.seed === seed
        && Number.isInteger(parsed.processedYear)
        && parsed.processedYear >= 0
        && Array.isArray(parsed.ageCohorts)
        && parsed.ageCohorts.length === countryPopulations.length
        && parsed.ageCohorts.every((cohort) => Array.isArray(cohort)
          && cohort.length === SENPE_LIFESPAN_YEARS
          && cohort.every((value) => Number.isSafeInteger(value) && value >= 0))
        && Array.isArray(parsed.birthRemainders)
        && parsed.birthRemainders.length === countryPopulations.length
        && parsed.birthRemainders.every((value) => Number.isFinite(value) && value >= 0 && value < 1)
        && Number.isSafeInteger(parsed.births) && parsed.births >= 0
        && Number.isSafeInteger(parsed.deaths) && parsed.deaths >= 0;
      if (valid) return parsed;
    }
  } catch {
    // A corrupt or unavailable local save is replaced with a safe genesis state.
  }
  return createSenpePopulationState(seed, countryPopulations);
}

export function saveSenpePopulationState(state: SenpePopulationState): void {
  try {
    localStorage.setItem(SENPE_POPULATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The simulation remains playable when browser storage is unavailable.
  }
}

export function advanceSenpePopulation(state: SenpePopulationState, targetYear: number): boolean {
  if (!Number.isInteger(targetYear) || targetYear <= state.processedYear) return false;
  while (state.processedYear < targetYear) {
    for (let country = 0; country < state.ageCohorts.length; country++) {
      const cohort = state.ageCohorts[country];
      const maturePopulation = cohort.slice(SENPE_MATURITY_AGE).reduce((sum, value) => sum + value, 0);
      const expectedBirths = maturePopulation * SENPE_BIRTHS_PER_ADULT_YEAR + state.birthRemainders[country];
      const births = Math.floor(expectedBirths);
      state.birthRemainders[country] = expectedBirths - births;
      const deaths = cohort[SENPE_LIFESPAN_YEARS - 1];
      for (let age = SENPE_LIFESPAN_YEARS - 1; age > 0; age--) cohort[age] = cohort[age - 1];
      cohort[0] = births;
      state.births += births;
      state.deaths += deaths;
    }
    state.processedYear++;
  }
  return true;
}

export function getSenpePopulationStats(state: SenpePopulationState): SenpePopulationStats {
  let total = 0;
  let young = 0;
  let mature = 0;
  for (const cohort of state.ageCohorts) {
    for (let age = 0; age < cohort.length; age++) {
      total += cohort[age];
      if (age < SENPE_MATURITY_AGE) young += cohort[age];
      else mature += cohort[age];
    }
  }
  return { total, young, mature, births: state.births, deaths: state.deaths, year: state.processedYear };
}

export function getSenpeCountryPopulations(state: SenpePopulationState): number[] {
  return state.ageCohorts.map((cohort) => cohort.reduce((sum, value) => sum + value, 0));
}
