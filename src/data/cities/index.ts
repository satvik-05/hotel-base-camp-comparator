import { HYDERABAD } from './hyderabad';
import { KYOTO } from './kyoto';
import { LISBON } from './lisbon';
import { MARLOWE } from './marlowe';
import type { CityDefinition } from './types';

export type { BackdropSpec, CityDefinition, Currency, MapPoint } from './types';

export const DEFAULT_CITY_ID = 'marlowe';

/** The cities offered on the landing screen and the city picker, in display order. */
export const CITIES: readonly CityDefinition[] = Object.freeze([MARLOWE, HYDERABAD, KYOTO, LISBON]);

export function getCity(id: string): CityDefinition {
  return CITIES.find((c) => c.id === id) ?? MARLOWE;
}
