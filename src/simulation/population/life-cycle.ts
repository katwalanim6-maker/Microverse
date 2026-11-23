export type HealthState = 'healthy' | 'ill' | 'recovering';
export type LifeStage = 'infant' | 'child' | 'adolescent' | 'adult' | 'elder';

export interface PersonRecord {
  id: string;
  countryId: string;
  regionId: string;
  birthMinute: number;
  ageMinutes: number;
  health: HealthState;
  alive: boolean;
}

export type PopulationEvent =
  | { type: 'birth'; personId: string; countryId: string; regionId: string; atMinute: number }
  | { type: 'illness'; personId: string; atMinute: number; cause: string }
  | { type: 'recovery'; personId: string; atMinute: number }
  | { type: 'death'; personId: string; atMinute: number; cause: string }
  | { type: 'migration'; personId: string; fromCountryId: string; toCountryId: string; fromRegionId: string; toRegionId: string; atMinute: number };

export function getLifeStage(ageMinutes: number): LifeStage {
  const ageYears = ageMinutes / (365 * 24 * 60);
  if (ageYears < 2) return 'infant';
  if (ageYears < 12) return 'child';
  if (ageYears < 18) return 'adolescent';
  if (ageYears < 65) return 'adult';
  return 'elder';
}

export function createBirth(
  id: string,
  countryId: string,
  regionId: string,
  atMinute: number
): { person: PersonRecord; event: PopulationEvent } {
  if (!id || !countryId || !regionId || !Number.isFinite(atMinute) || atMinute < 0) {
    throw new Error('Birth requires valid identity, location and simulation time.');
  }
  const person: PersonRecord = {
    id, countryId, regionId, birthMinute: atMinute, ageMinutes: 0, health: 'healthy', alive: true
  };
  return {
    person,
    event: { type: 'birth', personId: id, countryId, regionId, atMinute }
  };
}

function assertLiving(person: PersonRecord): void {
  if (!person.alive) throw new Error('A deceased person cannot undergo a living-person transition.');
}

export function applyIllness(person: PersonRecord, atMinute: number, cause: string): PopulationEvent {
  assertLiving(person);
  if (person.health === 'ill') throw new Error('Person is already ill.');
  person.health = 'ill';
  return { type: 'illness', personId: person.id, atMinute, cause };
}

export function recoverFromIllness(person: PersonRecord, atMinute: number): PopulationEvent {
  assertLiving(person);
  if (person.health !== 'ill') throw new Error('Only an ill person can recover.');
  person.health = 'recovering';
  return { type: 'recovery', personId: person.id, atMinute };
}

export function completeRecovery(person: PersonRecord): void {
  assertLiving(person);
  if (person.health !== 'recovering') throw new Error('Person is not recovering.');
  person.health = 'healthy';
}

export function recordDeath(person: PersonRecord, atMinute: number, cause: string): PopulationEvent {
  assertLiving(person);
  person.alive = false;
  return { type: 'death', personId: person.id, atMinute, cause };
}

export function migratePerson(
  person: PersonRecord,
  toCountryId: string,
  toRegionId: string,
  atMinute: number
): PopulationEvent {
  assertLiving(person);
  if (!toCountryId || !toRegionId) throw new Error('Migration requires a destination.');
  const event: PopulationEvent = {
    type: 'migration',
    personId: person.id,
    fromCountryId: person.countryId,
    toCountryId,
    fromRegionId: person.regionId,
    toRegionId,
    atMinute
  };
  person.countryId = toCountryId;
  person.regionId = toRegionId;
  return event;
}

export function advanceAge(person: PersonRecord, elapsedMinutes: number): void {
  assertLiving(person);
  if (!Number.isFinite(elapsedMinutes) || elapsedMinutes < 0) {
    throw new Error('Elapsed simulation time must be a non-negative number.');
  }
  person.ageMinutes += elapsedMinutes;
}
