import { contribution, contributionsFor, formatTenths, importanceTotal, roundedTenths, weightedTravelTotal } from './calculate';
import type { Place } from './types';

describe('contribution arithmetic (spec illustration)', () => {
  const places: Place[] = [
    { id: 'CLOCK', name: 'Clock', type: 'attraction', importance: 3 },
    { id: 'MARKET', name: 'Market', type: 'food', importance: 2 },
  ];
  const hotel = { id: 'H', name: 'H', stayCost: 1, roundTripMinutes: { CLOCK: 20, MARKET: 40 } };

  it('multiplies importance by minutes', () => {
    expect(contribution(3, 20)).toBe(60);
    expect(contribution(2, 40)).toBe(80);
  });

  it('sums to 140 importance-minutes with 28.0 average', () => {
    const cs = contributionsFor(hotel, places);
    expect(cs.map((c) => c.value)).toEqual([60, 80]);
    const total = weightedTravelTotal(cs);
    const imp = importanceTotal(places);
    expect(total).toBe(140);
    expect(imp).toBe(5);
    expect(formatTenths(roundedTenths(total, imp))).toBe('28.0');
  });
});

describe('round-half-up display', () => {
  it.each([
    [1, 4, '0.3'], // 0.25 -> 0.3 (half rounds up)
    [21, 20, '1.1'], // 1.05 -> 1.1
    [1, 8, '0.1'], // 0.125 -> 0.1
    [3, 8, '0.4'], // 0.375 -> 0.4
    [0, 7, '0.0'],
    [140, 5, '28.0'],
    [1712, 41, '41.8'], // 41.756..
    [99, 10, '9.9'],
    [995, 100, '10.0'], // 9.95 -> 10.0 carries into the integer part
  ])('total %i / importance %i -> %s', (t, i, shown) => {
    expect(formatTenths(roundedTenths(t, i))).toBe(shown);
  });
});
