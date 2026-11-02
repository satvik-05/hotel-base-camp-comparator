import { compare, withImportance } from './index';
import type { EngineOk, Place } from './types';
import { hotel, places3, scenarioOf } from './fixtures';

const ok = (r: ReturnType<typeof compare>): EngineOk => {
  if (r.status !== 'ok') throw new Error(`invalid: ${JSON.stringify(r.errors)}`);
  return r;
};
const order = (r: EngineOk) => r.ranking.map((e) => e.hotelId);

describe('budget equality', () => {
  const s = scenarioOf([hotel('A', 500, [10, 10, 10]), hotel('B', 501, [1, 1, 1])]);

  it('a hotel exactly on budget is affordable and can win', () => {
    const r = ok(compare(s, 500));
    expect(r.evaluations[0]).toMatchObject({ affordable: true, remainingBudget: 0, shortfall: 0, rank: 1 });
    expect(r.recommended?.hotelId).toBe('A');
  });

  it('one unit over budget is unranked, labelled, and never recommended', () => {
    const r = ok(compare(s, 500));
    expect(r.evaluations[1]).toMatchObject({ affordable: false, shortfall: 1, rank: null, status: 'OVER_BUDGET' });
    expect(r.evaluations[1]!.reason).toBe('Over budget by 1: not ranked, never recommended.');
    expect(order(r)).toEqual(['A']);
  });

  it('crossing the boundary makes the better hotel recommended', () => {
    expect(ok(compare(s, 501)).recommended?.hotelId).toBe('B');
  });
});

describe('ranking rules', () => {
  it('ranks by exact total even when rounded averages display identically', () => {
    const places: Place[] = [
      { id: 'P1', name: 'One', type: 'attraction', importance: 5 },
      { id: 'P2', name: 'Two', type: 'food', importance: 5 },
      { id: 'P3', name: 'Three', type: 'attraction', importance: 4 },
    ];
    // importance total 14: 141/14 = 10.07 -> "10.1"; 142/14 = 10.14 -> "10.1"
    const s = scenarioOf([hotel('CHEAP', 100, [13, 13, 3]), hotel('PRICEY', 900, [12, 13, 4])], places);
    const r = ok(compare(s, 1000));
    const [cheap, pricey] = r.evaluations;
    expect([cheap!.weightedTravelTotal, pricey!.weightedTravelTotal]).toEqual([142, 141]);
    expect(cheap!.weightedAverage).toBe('10.1');
    expect(pricey!.weightedAverage).toBe('10.1');
    expect(order(r)).toEqual(['PRICEY', 'CHEAP']); // cost must not rescue the higher exact total
  });

  it('accessibility tie is resolved by lower stay cost', () => {
    const s = scenarioOf([hotel('A', 300, [10, 10, 10]), hotel('B', 200, [10, 10, 10]), hotel('C', 250, [10, 10, 10])]);
    expect(order(ok(compare(s, 1000)))).toEqual(['B', 'C', 'A']);
  });

  it('complete tie is resolved by hotel ID in ASCII order, regardless of input order', () => {
    const s = scenarioOf([hotel('Z9', 100, [5, 5, 5]), hotel('A10', 100, [5, 5, 5]), hotel('A2', 100, [5, 5, 5]), hotel('A-1', 100, [5, 5, 5]), hotel('A_1', 100, [5, 5, 5])]);
    // ASCII: '-'(45) < '1'(49) < '2'(50) < '_'(95); so A-1, A10, A2, A_1, Z9
    expect(order(ok(compare(s, 1000)))).toEqual(['A-1', 'A10', 'A2', 'A_1', 'Z9']);
  });

  it('names and input order never break ties', () => {
    const a = { ...hotel('B', 100, [5, 5, 5]), name: 'Aardvark Inn' };
    const b = { ...hotel('A', 100, [5, 5, 5]), name: 'Zebra Lodge' };
    expect(order(ok(compare(scenarioOf([a, b]), 1000)))).toEqual(['A', 'B']);
  });

  it('assigns unique gapless ranks and exactly one Recommended', () => {
    const s = scenarioOf([
      hotel('A', 100, [9, 9, 9]), hotel('B', 100, [9, 9, 9]), hotel('C', 100, [1, 1, 1]), hotel('D', 9999, [1, 1, 1]),
    ]);
    const r = ok(compare(s, 500));
    expect(r.ranking.map((e) => e.rank)).toEqual([1, 2, 3]);
    expect(r.evaluations.filter((e) => e.status === 'RECOMMENDED')).toHaveLength(1);
    expect(r.recommended?.hotelId).toBe('C');
    expect(r.evaluations.find((e) => e.hotelId === 'D')?.rank).toBeNull();
  });

  it('keeps evaluations in input order while ranking separately', () => {
    const s = scenarioOf([hotel('A', 100, [9, 9, 9]), hotel('B', 100, [1, 1, 1])]);
    const r = ok(compare(s, 500));
    expect(r.evaluations.map((e) => e.hotelId)).toEqual(['A', 'B']);
    expect(order(r)).toEqual(['B', 'A']);
  });

  it('computes totals, averages, longest trip, and remaining budget', () => {
    const s = scenarioOf([hotel('A', 400, [10, 20, 30]), hotel('B', 900, [1, 1, 1])], [
      { ...places3[0]!, importance: 3 }, { ...places3[1]!, importance: 2 }, { ...places3[2]!, importance: 1 },
    ]);
    const r = ok(compare(s, 1000));
    expect(r.importanceTotal).toBe(6);
    expect(r.evaluations[0]).toMatchObject({
      weightedTravelTotal: 3 * 10 + 2 * 20 + 1 * 30, // 100
      weightedAverage: '16.7',
      longestTripMinutes: 30,
      remainingBudget: 600,
    });
  });
});

describe('NO_AFFORDABLE_HOTEL', () => {
  const s = scenarioOf([hotel('A', 300, [1, 1, 1]), hotel('B', 500, [1, 1, 1])]);

  it('is a valid ok result with no winner or ranks, and shortfalls retained', () => {
    const r = ok(compare(s, 299));
    expect(r.outcome).toBe('NO_AFFORDABLE_HOTEL');
    expect(r.recommended).toBeNull();
    expect(r.ranking).toEqual([]);
    expect(r.evaluations.map((e) => [e.rank, e.shortfall, e.status])).toEqual([
      [null, 1, 'OVER_BUDGET'],
      [null, 201, 'OVER_BUDGET'],
    ]);
  });

  it('budget 0 is valid and nothing is affordable', () => {
    expect(ok(compare(s, 0)).outcome).toBe('NO_AFFORDABLE_HOTEL');
  });

  it('moving the budget up leaves no stale state either way', () => {
    expect(ok(compare(s, 300)).recommended?.hotelId).toBe('A');
    expect(ok(compare(s, 299)).recommended).toBeNull();
  });
});

describe('budget vs importance changes', () => {
  const places: Place[] = [
    { id: 'P1', name: 'One', type: 'attraction', importance: 1 },
    { id: 'P2', name: 'Two', type: 'food', importance: 1 },
    { id: 'P3', name: 'Three', type: 'attraction', importance: 1 },
  ];
  const s = scenarioOf([hotel('NEAR1', 100, [10, 50, 50]), hotel('NEAR2', 200, [50, 10, 50])], places);

  it('budget change alone keeps every contribution identical', () => {
    const a = ok(compare(s, 150));
    const b = ok(compare(s, 250));
    expect(b.evaluations.map((e) => e.contributions)).toEqual(a.evaluations.map((e) => e.contributions));
    expect(a.ranking).toHaveLength(1);
    expect(b.ranking).toHaveLength(2);
  });

  it('importance change recomputes contributions, totals, averages and ranks', () => {
    const before = ok(compare(s, 500));
    expect(order(before)).toEqual(['NEAR1', 'NEAR2']); // tie on 110 total -> cheaper first
    const after = ok(compare(withImportance(s, 'P2', 5), 500));
    expect(after.importanceTotal).toBe(7);
    expect(after.evaluations[0]!.contributions[1]).toMatchObject({ importance: 5, value: 250 });
    expect(after.evaluations[1]!.weightedTravelTotal).toBe(50 + 50 + 50);
    expect(order(after)).toEqual(['NEAR2', 'NEAR1']);
  });

  it('withImportance does not mutate the original scenario', () => {
    withImportance(s, 'P2', 5);
    expect(s.places[1]!.importance).toBe(1);
  });

  it('out-of-range importance becomes an invalid result', () => {
    expect(compare(withImportance(s, 'P2', 6), 500).status).toBe('invalid');
    expect(compare(withImportance(s, 'P2', NaN), 500).status).toBe('invalid');
  });
});
