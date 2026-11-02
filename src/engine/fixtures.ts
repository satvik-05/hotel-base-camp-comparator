import type { Hotel, Place, Scenario } from './types';

export const places3: Place[] = [
  { id: 'P1', name: 'One', type: 'attraction', importance: 5 },
  { id: 'P2', name: 'Two', type: 'food', importance: 5 },
  { id: 'P3', name: 'Three', type: 'attraction', importance: 5 },
];

export const hotel = (id: string, stayCost: number, times: [number, number, number]): Hotel => ({
  id,
  name: `Hotel ${id}`,
  stayCost,
  roundTripMinutes: { P1: times[0], P2: times[1], P3: times[2] },
});

export const scenarioOf = (hotels: Hotel[], places: Place[] = places3): Scenario => ({
  hotels,
  places,
});
