import type { Country } from '../world/planet';

export type LifeStage = 'infant' | 'child' | 'teen' | 'adult' | 'elder';
export type HealthStatus = 'healthy' | 'ill' | 'recovering' | 'deceased';

export interface Individual {
  id: string;
  countryId: string;
  regionId: string | null;
  birthDay: number;
  health: HealthStatus;
  alive: boolean;
}

export interface CountryPopulation {
  countryId: string;
  population: number;
}

export type PopulationEvent =
  | { type: 'birth'; day: number; individualId: string; countryId: string }
  | { type: 'death'; day: number; individualId: string; countryId: string }
  | { type: 'migration'; day: number; individualId: string; fromCountryId: string; toCountryId: string }
  | { type: 'illness'; day: number; individualId: string; countryId: string }
  | { type: 'recovery'; day: number; individualId: string; countryId: string };

export interface PopulationLedger {
  day: number;
  countries: Record<string, number>;
  totalPopulation: number;
  events: PopulationEvent[];
}

export function getLifeStage(ageDays: number): LifeStage {
  if (!Number.isFinite(ageDays) || ageDays < 0) throw new Error('Age must be a non-negative number of days.');
  const years = ageDays / 365;
  if (years < 2) return 'infant';
  if (years < 13) return 'child';
  if (years < 18) return 'teen';
  if (years < 65) return 'adult';
  return 'elder';
}

export function getAgeDays(individual: Individual, currentDay: number): number {
  if (!Number.isFinite(currentDay) || currentDay < individual.birthDay) {
    throw new Error('Current day cannot be earlier than the individual birth day.');
  }
  return currentDay - individual.birthDay;
}

export function createIndividual(input: {
  id: string;
  countryId: string;
  birthDay: number;
  regionId?: string | null;
}): Individual {
  if (!input.id.trim() || !input.countryId.trim()) throw new Error('Individual and country IDs are required.');
  if (!Number.isFinite(input.birthDay) || input.birthDay < 0) throw new Error('Birth day must be a non-negative number.');
  return {
    id: input.id,
    countryId: input.countryId,
    regionId: input.regionId ?? null,
    birthDay: input.birthDay,
    health: 'healthy',
    alive: true
  };
}

export function createPopulationLedger(countries: Country[]): PopulationLedger {
  const totals: Record<string, number> = {};
  for (const country of countries) {
    if (totals[country.id] !== undefined) throw new Error(`Duplicate country ID: ${country.id}`);
    if (!Number.isSafeInteger(country.population) || country.population < 0) {
      throw new Error(`Invalid starting population for ${country.id}`);
    }
    totals[country.id] = country.population;
  }
  return {
    day: 0,
    countries: totals,
    totalPopulation: Object.values(totals).reduce((sum, value) => sum + value, 0),
    events: []
  };
}

function requireCountry(ledger: PopulationLedger, countryId: string): void {
  if (!Object.prototype.hasOwnProperty.call(ledger.countries, countryId)) {
    throw new Error(`Unknown country: ${countryId}`);
  }
}

export function applyPopulationEvent(ledger: PopulationLedger, event: PopulationEvent): PopulationLedger {
  if (!Number.isSafeInteger(event.day) || event.day < ledger.day) {
    throw new Error('Population events must use a valid day and cannot travel backwards in time.');
  }
  const nextCountries = { ...ledger.countries };
  let nextTotal = ledger.totalPopulation;

  if (event.type === 'birth') {
    requireCountry(ledger, event.countryId);
    nextCountries[event.countryId] += 1;
    nextTotal += 1;
  } else if (event.type === 'death') {
    requireCountry(ledger, event.countryId);
    if (nextCountries[event.countryId] <= 0) throw new Error('A country cannot have a negative population.');
    nextCountries[event.countryId] -= 1;
    nextTotal -= 1;
  } else if (event.type === 'migration') {
    requireCountry(ledger, event.fromCountryId);
    requireCountry(ledger, event.toCountryId);
    if (event.fromCountryId === event.toCountryId) throw new Error('Migration must change the country of residence.');
    if (nextCountries[event.fromCountryId] <= 0) throw new Error('The origin country has no resident to migrate.');
    nextCountries[event.fromCountryId] -= 1;
    nextCountries[event.toCountryId] += 1;
  } else {
    requireCountry(ledger, event.countryId);
  }

  const calculatedTotal = Object.values(nextCountries).reduce((sum, value) => sum + value, 0);
  if (calculatedTotal !== nextTotal || calculatedTotal < 0) {
    throw new Error('Population ledger invariant failed.');
  }

  return {
    day: event.day,
    countries: nextCountries,
    totalPopulation: nextTotal,
    events: [...ledger.events, event]
  };
}

export function validateInitialPopulation(countries: Country[], expectedPerCountry = 1_000_000): void {
  if (countries.length !== 100) throw new Error(`Expected 100 countries; received ${countries.length}.`);
  for (const country of countries) {
    if (country.population !== expectedPerCountry) {
      throw new Error(`${country.name} must start with ${expectedPerCountry.toLocaleString('en-US')} inhabitants.`);
    }
  }
}

export function applyIndividualEvent(individual: Individual, event: PopulationEvent): Individual {
  if (event.type === 'birth') {
    throw new Error('Create a newborn with createIndividual, then record the birth in the population ledger.');
  }
  if (event.individualId !== individual.id) throw new Error('Event individual ID does not match the individual record.');
  if (!individual.alive || individual.health === 'deceased') throw new Error('A deceased individual cannot receive further life events.');

  if (event.type === 'death') {
    if (event.countryId !== individual.countryId) throw new Error('Death country does not match current residence.');
    return { ...individual, alive: false, health: 'deceased' };
  }
  if (event.type === 'migration') {
    if (event.fromCountryId !== individual.countryId) throw new Error('Migration origin does not match current residence.');
    return { ...individual, countryId: event.toCountryId };
  }
  if (event.countryId !== individual.countryId) throw new Error('Health event country does not match current residence.');
  if (event.type === 'illness') {
    if (individual.health !== 'healthy') throw new Error('Only a healthy individual can become ill in this initial model.');
    return { ...individual, health: 'ill' };
  }
  if (individual.health !== 'ill') throw new Error('Only an ill individual can recover in this initial model.');
  return { ...individual, health: 'recovering' };
}
