import {
  BUDGET_MAX,
  BUDGET_MIN,
  HOTEL_COUNT_MAX,
  HOTEL_COUNT_MIN,
  ID_PATTERN,
  IMPORTANCE_MAX,
  IMPORTANCE_MIN,
  PLACE_COUNT_MAX,
  PLACE_COUNT_MIN,
  PLACE_TYPES,
  STAY_COST_MAX,
  STAY_COST_MIN,
  TRAVEL_MAX,
  TRAVEL_MIN,
} from './constants';
import type { ValidationError } from './types';

const isWhole = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function validateBudget(budget: unknown): ValidationError[] {
  return isWhole(budget, BUDGET_MIN, BUDGET_MAX)
    ? []
    : [
        {
          code: 'INVALID_BUDGET',
          path: 'budget',
          message: `Budget must be a whole number from ${BUDGET_MIN} to ${BUDGET_MAX.toLocaleString('en-US')}.`,
        },
      ];
}

export function validateImportance(importance: unknown, path = 'importance'): ValidationError[] {
  return isWhole(importance, IMPORTANCE_MIN, IMPORTANCE_MAX)
    ? []
    : [
        {
          code: 'INVALID_IMPORTANCE',
          path,
          message: `Importance must be a whole number from ${IMPORTANCE_MIN} to ${IMPORTANCE_MAX}.`,
        },
      ];
}

/** Validates the complete scenario; returns every problem found (empty = valid). */
export function validateScenario(input: unknown): ValidationError[] {
  if (!isRecord(input) || !Array.isArray(input.hotels) || !Array.isArray(input.places)) {
    return [
      {
        code: 'MALFORMED_SCENARIO',
        path: 'scenario',
        message: 'Scenario must contain hotels and places lists.',
      },
    ];
  }
  const errors: ValidationError[] = [];
  const { hotels, places } = input as { hotels: unknown[]; places: unknown[] };

  if (hotels.length < HOTEL_COUNT_MIN || hotels.length > HOTEL_COUNT_MAX) {
    errors.push({
      code: 'INVALID_HOTEL_COUNT',
      path: 'hotels',
      message: `Hotel count must be ${HOTEL_COUNT_MIN}–${HOTEL_COUNT_MAX}; got ${hotels.length}.`,
    });
  }
  if (places.length < PLACE_COUNT_MIN || places.length > PLACE_COUNT_MAX) {
    errors.push({
      code: 'INVALID_PLACE_COUNT',
      path: 'places',
      message: `Place count must be ${PLACE_COUNT_MIN}–${PLACE_COUNT_MAX}; got ${places.length}.`,
    });
  }

  const seen = new Set<string>();
  const checkId = (id: unknown, path: string): void => {
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
      errors.push({
        code: 'MALFORMED_ID',
        path,
        message: `ID ${JSON.stringify(id)} must match ${ID_PATTERN.source}.`,
      });
      return;
    }
    if (seen.has(id)) {
      errors.push({ code: 'DUPLICATE_ID', path, message: `Duplicate ID "${id}".` });
    }
    seen.add(id);
  };
  const checkName = (name: unknown, path: string): void => {
    if (typeof name !== 'string' || name.trim() === '') {
      errors.push({ code: 'EMPTY_NAME', path, message: 'Display name must not be empty.' });
    }
  };

  const placeIds: string[] = [];
  places.forEach((p, i) => {
    const path = `places[${i}]`;
    if (!isRecord(p)) {
      errors.push({ code: 'MALFORMED_SCENARIO', path, message: 'Place must be an object.' });
      return;
    }
    checkId(p.id, `${path}.id`);
    checkName(p.name, `${path}.name`);
    if (!(PLACE_TYPES as readonly unknown[]).includes(p.type)) {
      errors.push({
        code: 'INVALID_PLACE_TYPE',
        path: `${path}.type`,
        message: `Place type must be one of: ${PLACE_TYPES.join(', ')}.`,
      });
    }
    errors.push(...validateImportance(p.importance, `${path}.importance`));
    if (typeof p.id === 'string') placeIds.push(p.id);
  });

  hotels.forEach((h, i) => {
    const path = `hotels[${i}]`;
    if (!isRecord(h)) {
      errors.push({ code: 'MALFORMED_SCENARIO', path, message: 'Hotel must be an object.' });
      return;
    }
    checkId(h.id, `${path}.id`);
    checkName(h.name, `${path}.name`);
    if (!isWhole(h.stayCost, STAY_COST_MIN, STAY_COST_MAX)) {
      errors.push({
        code: 'INVALID_STAY_COST',
        path: `${path}.stayCost`,
        message: `Stay cost must be a whole number from ${STAY_COST_MIN} to ${STAY_COST_MAX.toLocaleString('en-US')}.`,
      });
    }
    const times = h.roundTripMinutes;
    if (!isRecord(times)) {
      errors.push({
        code: 'MISSING_PLACE_TIME',
        path: `${path}.roundTripMinutes`,
        message: 'Hotel needs a round-trip time for every place.',
      });
      return;
    }
    for (const pid of placeIds) {
      if (!Object.prototype.hasOwnProperty.call(times, pid)) {
        errors.push({
          code: 'MISSING_PLACE_TIME',
          path: `${path}.roundTripMinutes.${pid}`,
          message: `Missing round-trip time for place "${pid}".`,
        });
      }
    }
    for (const [key, value] of Object.entries(times)) {
      const tpath = `${path}.roundTripMinutes.${key}`;
      if (!placeIds.includes(key)) {
        errors.push({
          code: 'UNKNOWN_PLACE_TIME',
          path: tpath,
          message: `Round-trip time given for unknown place "${key}".`,
        });
      } else if (!isWhole(value, TRAVEL_MIN, TRAVEL_MAX)) {
        errors.push({
          code: 'INVALID_TRAVEL_TIME',
          path: tpath,
          message: `Travel time must be a whole number from ${TRAVEL_MIN} to ${TRAVEL_MAX} minutes.`,
        });
      }
    }
  });

  return errors;
}
