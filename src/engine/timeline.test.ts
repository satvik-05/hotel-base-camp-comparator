import { compare } from './index';
import { budgetTimeline } from './timeline';
import { hotel, scenarioOf } from './fixtures';
import { createMainScenario } from '../data/mainCity';

describe('budgetTimeline', () => {
  it('small scenario: none, then each improvement at exactly the stay cost', () => {
    const s = scenarioOf([hotel('A', 100, [9, 9, 9]), hotel('B', 200, [5, 5, 5]), hotel('C', 300, [7, 7, 7])]);
    expect(budgetTimeline(s)).toEqual([
      { from: 0, to: 99, recommendedId: null },
      { from: 100, to: 199, recommendedId: 'A' },
      { from: 200, to: null, recommendedId: 'B' }, // C never wins, so no segment for it
    ]);
  });

  it('merges costs that do not change the recommendation', () => {
    const s = scenarioOf([hotel('A', 100, [1, 1, 1]), hotel('B', 150, [9, 9, 9])]);
    expect(budgetTimeline(s)).toHaveLength(2);
  });

  it('agrees with compare() at every budget in the main city (boundaries included)', () => {
    const scenario = createMainScenario();
    const timeline = budgetTimeline(scenario);
    for (let budget = 0; budget <= 1400; budget++) {
      const seg = timeline.find((t) => budget >= t.from && (t.to === null || budget <= t.to))!;
      const r = compare(scenario, budget);
      expect(r.status === 'ok' && (r.recommended?.hotelId ?? null)).toBe(seg.recommendedId);
    }
  });

  it('main city ends with Clocktower Grand exactly at its stay cost', () => {
    const t = budgetTimeline(createMainScenario());
    expect(t[0]).toMatchObject({ from: 0, recommendedId: null });
    const flip = t.find((s) => s.recommendedId === 'H_CLOCKGR')!;
    expect(flip.from).toBe(980);
    expect(t[t.indexOf(flip) - 1]!.recommendedId).toBe('H_LANTERN');
  });

  it('returns nothing for an invalid scenario', () => {
    expect(budgetTimeline(scenarioOf([hotel('A', 100, [1, 1, 1])]))).toEqual([]);
  });
});
