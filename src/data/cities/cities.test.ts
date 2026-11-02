import { compare } from '../../engine';
import type { EngineOk } from '../../engine';
import { EXPECTED_CITIES } from '../expected';
import { CITIES, DEFAULT_CITY_ID, getCity } from './index';

const ok = (r: ReturnType<typeof compare>): EngineOk => {
  if (r.status !== 'ok') throw new Error('expected ok: ' + JSON.stringify(r.errors));
  return r;
};

const DEMO = CITIES.filter((c) => !c.fictional);

describe('city registry', () => {
  it('offers Marlowe Bay (default, fictional) plus Hyderabad, Kyoto and Lisbon, with unique ids', () => {
    expect(CITIES.map((c) => c.id)).toEqual(['marlowe', 'hyderabad', 'kyoto', 'lisbon']);
    expect(new Set(CITIES.map((c) => c.id)).size).toBe(CITIES.length);
    expect(DEFAULT_CITY_ID).toBe('marlowe');
    expect(getCity('marlowe').fictional).toBe(true);
    expect(DEMO.map((c) => c.name)).toEqual(['Hyderabad', 'Kyoto', 'Lisbon']);
  });

  it('falls back to Marlowe Bay for an unknown id', () => {
    expect(getCity('atlantis').id).toBe('marlowe');
  });
});

describe.each(CITIES)('$name', (city) => {
  const scenario = city.createScenario();

  it('is a valid 10-hotel, 15-place scenario at its default budget', () => {
    expect(scenario.hotels).toHaveLength(10);
    expect(scenario.places).toHaveLength(15);
    ok(compare(scenario, city.budget));
  });

  it('has 8 attractions, 7 food stops and varied importances', () => {
    expect(scenario.places.filter((p) => p.type === 'attraction')).toHaveLength(8);
    expect(scenario.places.filter((p) => p.type === 'food')).toHaveLength(7);
    expect(new Set(scenario.places.map((p) => p.importance)).size).toBeGreaterThanOrEqual(3);
  });

  it('returns a fresh deep-frozen scenario on every call (Reset restores originals)', () => {
    const a = city.createScenario();
    const b = city.createScenario();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(a.hotels[0])).toBe(true);
    expect(Object.isFrozen(a.hotels[0]!.roundTripMinutes)).toBe(true);
    expect(Object.isFrozen(a.places[0])).toBe(true);
  });

  it('has a marker for each of the 25 hotels and places, inside the map, and none stacked', () => {
    const ids = [...scenario.hotels.map((h) => h.id), ...scenario.places.map((p) => p.id)];
    expect(Object.keys(city.markers).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      const m = city.markers[id]!;
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.x).toBeLessThanOrEqual(1000);
      expect(m.y).toBeGreaterThanOrEqual(0);
      expect(m.y).toBeLessThanOrEqual(640);
    }
    const spots = new Set(ids.map((id) => `${city.markers[id]!.x},${city.markers[id]!.y}`));
    expect(spots.size).toBe(25);
  });

  it('has a default inspected hotel that exists and a usable slider range', () => {
    expect(scenario.hotels.some((h) => h.id === city.defaultInspectedHotelId)).toBe(true);
    expect(city.slider.max).toBeGreaterThan(Math.max(...scenario.hotels.map((h) => h.stayCost)));
    expect(city.slider.step).toBeGreaterThan(0);
    expect(city.currency.symbol.length).toBeGreaterThan(0);
  });

  it('has a backdrop made of non-empty paths and uniquely named labels', () => {
    const b = city.backdrop;
    for (const d of [...b.parks, ...b.water, ...b.roads, ...b.bridges, ...b.rivers.map((r) => r.d)]) expect(d).toMatch(/^M /);
    expect(new Set(b.labels.map((l) => l.text)).size).toBe(b.labels.length);
  });
});

describe.each(DEMO)('$name demo story (budget and ranking rules)', (city) => {
  const scenario = city.createScenario();
  const at = (budget: number) => ok(compare(scenario, budget));
  const result = at(city.budget);

  it('has 4-7 affordable hotels, one exactly on budget, and the recommendation is not the cheapest affordable', () => {
    expect(result.ranking.length).toBeGreaterThanOrEqual(4);
    expect(result.ranking.length).toBeLessThanOrEqual(7);
    expect(result.evaluations.some((e) => e.stayCost === city.budget)).toBe(true);
    const cheapest = [...result.ranking].sort((a, b) => a.stayCost - b.stayCost)[0]!;
    expect(result.recommended!.hotelId).not.toBe(cheapest.hotelId);
    expect(result.recommended!.hotelId).toBe(city.defaultInspectedHotelId);
    expect(result.recommended!.remainingBudget).toBeGreaterThan(0);
  });

  it('the single most accessible hotel is over budget, and becomes recommended at exactly its cost', () => {
    const totals = result.evaluations.map((e) => e.weightedTravelTotal);
    const best = result.evaluations.find((e) => e.weightedTravelTotal === Math.min(...totals))!;
    expect(totals.filter((t) => t === best.weightedTravelTotal)).toHaveLength(1);
    expect(best.affordable).toBe(false);
    expect(at(best.stayCost).recommended!.hotelId).toBe(best.hotelId);
    expect(at(best.stayCost - 1).recommended!.hotelId).not.toBe(best.hotelId);
  });

  it('splits at 90 minutes: one affordable hotel has every trip within 90, another has a longer trip', () => {
    const longest = result.ranking.map((e) => e.longestTripMinutes);
    expect(longest.some((m) => m <= 90)).toBe(true);
    expect(longest.some((m) => m > 90)).toBe(true);
  });

  it('keeps every marker label clear of the others and of the zoom/compass corners', () => {
    type Box = readonly [number, number, number, number];
    const pad = 5;
    // Same label geometry as CityMap.tsx: hotel names sit above their badge, place names and values below the dot.
    const box = (id: string, x: number, y: number): Box => {
      const hotel = scenario.hotels.find((h) => h.id === id);
      if (hotel) {
        const w = Math.max(40, hotel.name.length * 8.2);
        return [x - w / 2 - pad, y - 35 - pad, x + w / 2 + pad, y + 15 + pad];
      }
      const w = Math.max(scenario.places.find((p) => p.id === id)!.name.length * 7, 118);
      return [x - w / 2 - pad, y - 13 - pad, x + w / 2 + pad, y + 47 + pad];
    };
    const hit = (a: Box, b: Box) => Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 0 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 0;
    const boxes = Object.entries(city.markers).map(([id, m]) => [id, box(id, m.x, m.y)] as const);
    const clashes: string[] = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (hit(boxes[i]![1], boxes[j]![1])) clashes.push(`${boxes[i]![0]}/${boxes[j]![0]}`);
    for (const [id, b] of boxes) {
      if (hit(b, [925, -10, 1010, 175]) || hit(b, [-10, 530, 120, 650])) clashes.push(`${id}/reserved corner`);
      if (b[0] < 0 || b[1] < 0 || b[2] > 1000 || b[3] > 640) clashes.push(`${id}/outside map`);
    }
    expect(clashes).toEqual([]);
  });

  it('budget 0 gives NO_AFFORDABLE_HOTEL with every shortfall kept', () => {
    const none = at(0);
    expect(none.outcome).toBe('NO_AFFORDABLE_HOTEL');
    expect(none.recommended).toBeNull();
    expect(none.evaluations.every((e) => e.shortfall === e.stayCost)).toBe(true);
  });

  it('matches the documented answers in expected.ts (engine vs independent record)', () => {
    const exp = EXPECTED_CITIES[city.id as keyof typeof EXPECTED_CITIES];
    expect(exp.budget).toBe(city.budget);
    expect(result.importanceTotal).toBe(exp.importanceTotal);
    expect(result.ranking.map((e) => e.hotelId)).toEqual([...exp.rankOrder]);
    expect(result.recommended!.hotelId).toBe(exp.recommended);
    expect(Math.min(...result.evaluations.map((e) => e.weightedTravelTotal))).toBe(
      result.evaluations.find((e) => e.hotelId === exp.mostAccessible)!.weightedTravelTotal,
    );
    expect(result.evaluations.find((e) => e.hotelId === exp.mostAccessible)!.stayCost).toBe(exp.boundaryBudget);
    for (const h of exp.hotels) {
      const e = result.evaluations.find((x) => x.hotelId === h.id)!;
      expect({ cost: e.stayCost, total: e.weightedTravelTotal, avg: e.weightedAverage, affordable: e.affordable, remaining: e.remainingBudget, rank: e.rank }).toEqual({
        cost: h.cost, total: h.total, avg: h.avg, affordable: h.affordable, remaining: h.remaining, rank: h.rank,
      });
    }
  });
});

describe('Hyderabad specifics', () => {
  it('uses Indian digit grouping and rupees, with a generous slider', () => {
    const h = getCity('hyderabad');
    expect(h.currency).toEqual({ symbol: '₹', locale: 'en-IN' });
    expect(h.slider.max).toBeGreaterThanOrEqual(60000);
  });

  it('names real landmarks but only invented hotels', () => {
    const s = getCity('hyderabad').createScenario();
    expect(s.places.map((p) => p.name)).toEqual(expect.arrayContaining(['Charminar', 'Golconda Fort', 'Hussain Sagar']));
    expect(s.hotels.every((h) => /^H_[A-Z]+$/.test(h.id))).toBe(true);
  });
});
