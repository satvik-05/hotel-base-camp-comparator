import type { Scenario } from '../engine';
import { DEFAULT_CITY_ID, getCity } from '../data/cities';

/** Strict whole-number parser: anything that is not an optional minus plus digits becomes NaN. */
export function parseWhole(raw: string): number {
  return /^\s*-?\d+\s*$/.test(raw) ? Number(raw.trim()) : NaN;
}

export interface LoadedState {
  readonly phase: 'loaded';
  /** Which demo city this trip is in; Reset restores this city's original. */
  readonly cityId: string;
  /** The original city as loaded (original importances); never edited in place. */
  readonly scenario: Scenario;
  /** Raw field text, so invalid entries stay visible instead of being silently coerced. */
  readonly budgetInput: string;
  readonly importanceInputs: Readonly<Record<string, string>>;
  /** UI-only: never passed to the engine. */
  readonly inspectedId: string;
}

export type ComparatorState = { readonly phase: 'empty' } | LoadedState;

export type Action =
  | { type: 'LOAD'; cityId?: string }
  | { type: 'RESET' }
  | { type: 'SET_BUDGET'; value: string }
  | { type: 'SET_IMPORTANCE'; placeId: string; value: string }
  | { type: 'INSPECT'; hotelId: string };

export const initialState: ComparatorState = { phase: 'empty' };

/** Fresh materialization of a city's trip: original data, budget, importances, inspected hotel. */
export function freshLoadedState(cityId: string = DEFAULT_CITY_ID): LoadedState {
  const city = getCity(cityId);
  const scenario = city.createScenario();
  return {
    phase: 'loaded',
    cityId: city.id,
    scenario,
    budgetInput: String(city.budget),
    importanceInputs: Object.fromEntries(scenario.places.map((p) => [p.id, String(p.importance)])),
    inspectedId: city.defaultInspectedHotelId,
  };
}

export function reducer(state: ComparatorState, action: Action): ComparatorState {
  if (action.type === 'LOAD') return freshLoadedState(action.cityId);
  if (action.type === 'RESET') return freshLoadedState(state.phase === 'loaded' ? state.cityId : DEFAULT_CITY_ID);
  if (state.phase !== 'loaded') return state;
  switch (action.type) {
    case 'SET_BUDGET':
      return { ...state, budgetInput: action.value };
    case 'SET_IMPORTANCE':
      if (!(action.placeId in state.importanceInputs)) return state;
      return { ...state, importanceInputs: { ...state.importanceInputs, [action.placeId]: action.value } };
    case 'INSPECT':
      return state.scenario.hotels.some((h) => h.id === action.hotelId)
        ? { ...state, inspectedId: action.hotelId }
        : state;
    default:
      return state;
  }
}
