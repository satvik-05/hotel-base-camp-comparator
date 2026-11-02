import { compare, validateBudget, validateImportance, validateScenario } from './index';
import { hotel, places3, scenarioOf } from './fixtures';
import type { Scenario } from './types';

const codes = (s: unknown) => validateScenario(s).map((e) => e.code);
const good = (): Scenario => scenarioOf([hotel('A', 100, [10, 20, 30]), hotel('B', 200, [10, 20, 30])]);

describe('validateBudget', () => {
  it.each([0, 1, 1_000_000])('accepts %i', (b) => expect(validateBudget(b)).toEqual([]));
  it.each([-1, 1_000_001, 1.5, NaN, Infinity, '500', null, undefined])('rejects %s', (b) => {
    expect(validateBudget(b)[0]?.code).toBe('INVALID_BUDGET');
  });
});

describe('validateImportance', () => {
  it.each([1, 3, 5])('accepts %i', (v) => expect(validateImportance(v)).toEqual([]));
  it.each([0, 6, 2.5, NaN, '3', undefined])('rejects %s', (v) => {
    expect(validateImportance(v)[0]?.code).toBe('INVALID_IMPORTANCE');
  });
});

describe('validateScenario', () => {
  it('accepts a good scenario', () => expect(validateScenario(good())).toEqual([]));

  it('rejects too few / too many hotels and places', () => {
    expect(codes(scenarioOf([hotel('A', 1, [1, 1, 1])]))).toContain('INVALID_HOTEL_COUNT');
    const eleven = Array.from({ length: 11 }, (_, i) => hotel(`H${i}`, 10, [1, 1, 1]));
    expect(codes(scenarioOf(eleven))).toContain('INVALID_HOTEL_COUNT');
    expect(codes({ ...good(), places: places3.slice(0, 2) })).toContain('INVALID_PLACE_COUNT');
    const sixteen = Array.from({ length: 16 }, (_, i) => ({ ...places3[0]!, id: `Q${i}` }));
    expect(codes({ ...good(), places: sixteen })).toContain('INVALID_PLACE_COUNT');
  });

  it.each(['a1', '1A', '', 'HAS SPACE', 'A'.repeat(17), 'lower'])('rejects malformed id %j', (id) => {
    const s = scenarioOf([hotel(id, 100, [1, 2, 3]), hotel('B', 100, [1, 2, 3])]);
    expect(codes(s)).toContain('MALFORMED_ID');
  });

  it('accepts 16-char ids with dash/underscore', () => {
    const s = scenarioOf([hotel('A-B_C123456789012'.slice(0, 16), 100, [1, 2, 3]), hotel('B', 100, [1, 2, 3])]);
    expect(codes(s)).toEqual([]);
  });

  it('rejects duplicate hotel ids', () => {
    const s = scenarioOf([hotel('A', 100, [1, 2, 3]), hotel('A', 200, [1, 2, 3])]);
    expect(codes(s)).toContain('DUPLICATE_ID');
  });

  it('rejects an id shared between a hotel and a place (ids unique across the scenario)', () => {
    const s = scenarioOf([hotel('P1', 100, [1, 2, 3]), hotel('B', 200, [1, 2, 3])]);
    expect(codes(s)).toContain('DUPLICATE_ID');
  });

  it('rejects empty / whitespace names', () => {
    const s = good();
    expect(codes({ ...s, hotels: [{ ...s.hotels[0]!, name: '   ' }, s.hotels[1]] })).toContain('EMPTY_NAME');
    expect(codes({ ...s, places: [{ ...places3[0]!, name: '' }, places3[1], places3[2]] })).toContain('EMPTY_NAME');
  });

  it('rejects unsupported place type', () => {
    const s = good();
    expect(codes({ ...s, places: [{ ...places3[0]!, type: 'museum' }, places3[1], places3[2]] })).toContain('INVALID_PLACE_TYPE');
  });

  it.each([0, 1_000_001, 10.5, -5, NaN])('rejects stay cost %s', (cost) => {
    const s = scenarioOf([hotel('A', cost, [1, 2, 3]), hotel('B', 100, [1, 2, 3])]);
    expect(codes(s)).toContain('INVALID_STAY_COST');
  });

  it.each([0, 6, 2.5])('rejects place importance %s', (imp) => {
    const s = good();
    expect(codes({ ...s, places: [{ ...places3[0]!, importance: imp }, places3[1], places3[2]] })).toContain('INVALID_IMPORTANCE');
  });

  it.each([0, 601, 12.5, NaN, -3])('rejects travel time %s', (t) => {
    const s = scenarioOf([hotel('A', 100, [t, 2, 3]), hotel('B', 100, [1, 2, 3])]);
    expect(codes(s)).toContain('INVALID_TRAVEL_TIME');
  });

  it('accepts travel-time boundaries 1 and 600', () => {
    const s = scenarioOf([hotel('A', 100, [1, 600, 3]), hotel('B', 100, [1, 2, 3])]);
    expect(codes(s)).toEqual([]);
  });

  it('rejects missing and unknown place times', () => {
    const s = good();
    const missing = { ...s.hotels[0]!, roundTripMinutes: { P1: 1, P2: 2 } };
    expect(codes({ ...s, hotels: [missing, s.hotels[1]] })).toContain('MISSING_PLACE_TIME');
    const extra = { ...s.hotels[0]!, roundTripMinutes: { P1: 1, P2: 2, P3: 3, P9: 4 } };
    expect(codes({ ...s, hotels: [extra, s.hotels[1]] })).toContain('UNKNOWN_PLACE_TIME');
    const swapped = { ...s.hotels[0]!, roundTripMinutes: { P1: 1, P2: 2, PX: 3 } };
    const c = codes({ ...s, hotels: [swapped, s.hotels[1]] });
    expect(c).toContain('MISSING_PLACE_TIME');
    expect(c).toContain('UNKNOWN_PLACE_TIME');
  });

  it.each([null, undefined, 42, 'x', {}, { hotels: [], places: 3 }])('rejects malformed scenario %j', (s) => {
    expect(codes(s)).toContain('MALFORMED_SCENARIO');
  });
});

describe('invalid-state clearing', () => {
  const assertCleared = (r: ReturnType<typeof compare>) => {
    expect(r.status).toBe('invalid');
    for (const key of ['ranking', 'recommended', 'evaluations', 'outcome', 'importanceTotal']) {
      expect(r).not.toHaveProperty(key);
    }
  };

  it('duplicate ID yields only errors (no partial ranking)', () => {
    assertCleared(compare(scenarioOf([hotel('A', 100, [1, 2, 3]), hotel('A', 100, [1, 2, 3]), hotel('C', 50, [1, 2, 3])]), 500));
  });

  it('incomplete mapping yields only errors even though other hotels are valid', () => {
    const bad = { id: 'B', name: 'B', stayCost: 10, roundTripMinutes: { P1: 1, P2: 2 } };
    assertCleared(compare(scenarioOf([hotel('A', 100, [1, 2, 3]), bad]), 500));
  });

  it.each([-1, 1_000_001, 2.5, NaN])('invalid budget %s yields only errors', (b) => {
    const r = compare(good(), b);
    assertCleared(r);
    if (r.status === 'invalid') expect(r.errors[0]?.code).toBe('INVALID_BUDGET');
  });

  it('invalid importance yields only errors', () => {
    const s = good();
    assertCleared(compare({ ...s, places: [{ ...places3[0]!, importance: 9 }, places3[1]!, places3[2]!] }, 500));
  });

  it('reports every error found, each with a path', () => {
    const r = compare(scenarioOf([hotel('a', 0, [0, 2, 3]), hotel('B', 1, [1, 2, 3])]), -1);
    expect(r.status === 'invalid' && r.errors.length).toBeGreaterThanOrEqual(4);
    expect(r.status === 'invalid' && r.errors.every((e) => e.path && e.message)).toBe(true);
  });
});
