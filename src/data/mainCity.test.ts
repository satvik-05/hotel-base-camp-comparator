import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { compare, withImportance } from '../engine';
import type { EngineOk } from '../engine';
import {
  EXPECTED_BUDGET,
  EXPECTED_HOTELS,
  EXPECTED_IMPORTANCE_TOTAL,
  EXPECTED_RANK_ORDER,
  EXPECTED_STORY,
} from './expected';
import { createMainScenario, MAIN_BUDGET, MARKER_POSITIONS, WHAT_IF } from './mainCity';
import { PLACE_ORDER, TRAVEL_ROWS } from './travelMatrix';

const ok = (r: ReturnType<typeof compare>): EngineOk => {
  if (r.status !== 'ok') throw new Error(JSON.stringify(r.errors));
  return r;
};
const scenario = createMainScenario();
const base = ok(compare(scenario, MAIN_BUDGET));

describe('main city shape', () => {
  it('has exactly 10 hotels and 15 places and validates', () => {
    expect(scenario.hotels).toHaveLength(10);
    expect(scenario.places).toHaveLength(15);
    expect(base.status).toBe('ok');
  });

  it('has >=3 attractions, >=3 food stops, >=3 importance values', () => {
    const count = (t: string) => scenario.places.filter((p) => p.type === t).length;
    expect(count('attraction')).toBeGreaterThanOrEqual(3);
    expect(count('food')).toBeGreaterThanOrEqual(3);
    expect(new Set(scenario.places.map((p) => p.importance)).size).toBeGreaterThanOrEqual(3);
  });

  it('has a complete 10x15 matrix matching the place order', () => {
    expect(Object.keys(TRAVEL_ROWS)).toHaveLength(10);
    for (const row of Object.values(TRAVEL_ROWS)) expect(row).toHaveLength(15);
    expect(scenario.places.map((p) => p.id)).toEqual([...PLACE_ORDER]);
    for (const h of scenario.hotels) expect(Object.keys(h.roundTripMinutes).sort()).toEqual([...PLACE_ORDER].sort());
  });

  it('positions all 25 markers distinctly inside the 1000x640 map', () => {
    const ids = [...scenario.hotels.map((h) => h.id), ...scenario.places.map((p) => p.id)];
    expect(ids).toHaveLength(25);
    const pts = ids.map((id) => MARKER_POSITIONS[id]);
    expect(pts.every((p) => p && p.x > 0 && p.x < 1000 && p.y > 0 && p.y < 640)).toBe(true);
    expect(new Set(pts.map((p) => `${p!.x},${p!.y}`)).size).toBe(25);
  });

  it('is deterministic: every call materializes an identical, frozen scenario', () => {
    const again = createMainScenario();
    expect(again).toEqual(scenario);
    expect(again).not.toBe(scenario);
    expect(Object.isFrozen(again.hotels[0]!.roundTripMinutes)).toBe(true);
  });

  it('engine code never touches marker geometry or city data', () => {
    const dir = join(process.cwd(), 'src/engine');
    const src = readdirSync(dir).filter((f) => !f.endsWith('.test.ts')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
    expect(src).not.toMatch(/MARKER_POSITIONS|\.\.\/data|MapPoint/);
  });
});

describe('documented answers are reproduced by the engine (not fed to it)', () => {
  it('uses the documented budget and importance total', () => {
    expect(MAIN_BUDGET).toBe(EXPECTED_BUDGET);
    expect(base.importanceTotal).toBe(EXPECTED_IMPORTANCE_TOTAL);
  });

  it.each(EXPECTED_HOTELS)('$id total, average, affordability, remaining, rank', (e) => {
    const got = base.evaluations.find((x) => x.hotelId === e.id)!;
    expect(got).toMatchObject({
      stayCost: e.cost,
      weightedTravelTotal: e.total,
      weightedAverage: e.avg,
      affordable: e.affordable,
      remainingBudget: e.remaining,
      rank: e.rank,
    });
  });

  it('matches the documented rank order', () => {
    expect(base.ranking.map((e) => e.hotelId)).toEqual([...EXPECTED_RANK_ORDER]);
  });
});

describe('main-scenario story conditions', () => {
  const S = EXPECTED_STORY;

  it('4-7 hotels are initially affordable', () => {
    expect(base.ranking.length).toBeGreaterThanOrEqual(4);
    expect(base.ranking.length).toBeLessThanOrEqual(7);
    expect(base.ranking).toHaveLength(S.affordableCount);
  });

  it('the unique most accessible hotel is over budget', () => {
    const totals = base.evaluations.map((e) => e.weightedTravelTotal).sort((a, b) => a - b);
    expect(totals[0]).toBeLessThan(totals[1]!);
    const best = base.evaluations.find((e) => e.weightedTravelTotal === totals[0])!;
    expect(best.hotelId).toBe(S.mostAccessible);
    expect(best).toMatchObject({ affordable: false, rank: null, shortfall: 80 });
  });

  it('the recommendation is not the cheapest affordable hotel', () => {
    const cheapest = [...base.ranking].sort((a, b) => a.stayCost - b.stayCost)[0]!;
    expect(cheapest.hotelId).toBe(S.cheapestAffordable);
    expect(base.recommended!.hotelId).not.toBe(cheapest.hotelId);
  });

  it('affordable hotels fall on both sides of the 90-minute longest-trip line', () => {
    const longest = (id: string) => base.ranking.find((e) => e.hotelId === id)!.longestTripMinutes;
    expect(longest(S.allTripsWithin90)).toBeLessThanOrEqual(90);
    expect(longest(S.hasTripOver90)).toBeGreaterThan(90);
  });

  it('raising the budget to the accessible hotel cost recommends it, exactly at the boundary', () => {
    const best = base.evaluations.find((e) => e.hotelId === S.mostAccessible)!;
    expect(S.boundaryBudget).toBe(best.stayCost);
    const at = ok(compare(scenario, best.stayCost));
    expect(at.recommended!.hotelId).toBe(S.mostAccessible);
    expect(at.evaluations.find((e) => e.hotelId === S.mostAccessible)).toMatchObject({ remainingBudget: 0, rank: 1 });
    expect(ok(compare(scenario, best.stayCost - 1)).recommended!.hotelId).toBe(S.justBelowBoundaryRecommended);
  });

  it('changing the what-if importance changes the recommended hotel (and only that place alone does)', () => {
    expect(WHAT_IF).toMatchObject({ placeId: S.whatIf.placeId, importance: S.whatIf.importance });
    const after = ok(compare(withImportance(scenario, WHAT_IF.placeId, WHAT_IF.importance), MAIN_BUDGET));
    expect(after.importanceTotal).toBe(S.whatIf.importanceTotal);
    expect(after.recommended!.hotelId).toBe(S.whatIf.recommended);
    expect(after.recommended!.hotelId).not.toBe(base.recommended!.hotelId);
    expect(after.ranking.map((e) => e.hotelId)).toEqual([...S.whatIf.rankOrder]);
    expect(after.evaluations.find((e) => e.hotelId === 'H_RIVERST')!.weightedTravelTotal).toBe(S.whatIf.totals.H_RIVERST);
    expect(after.evaluations.find((e) => e.hotelId === 'H_LANTERN')!.weightedTravelTotal).toBe(S.whatIf.totals.H_LANTERN);
  });

  it('reset: a fresh scenario at the original budget reproduces the original result exactly', () => {
    ok(compare(withImportance(scenario, 'RIVER', 5), 980));
    expect(ok(compare(createMainScenario(), MAIN_BUDGET))).toEqual(base);
  });
});

describe('anti-circularity', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });

  it('no non-test source file imports data/expected', () => {
    const offenders = walk(join(process.cwd(), 'src'))
      .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.(ts|tsx)$/.test(f) && !f.endsWith('data/expected.ts'))
      .filter((f) => /from\s+['"][^'"]*expected['"]/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
