import type { Hotel, Place, Scenario } from '../engine/types';
import { PLACE_ORDER, TRAVEL_ROWS } from './travelMatrix';

/** Presentation-only marker position on a 1000 x 640 schematic map. Never used in calculation. */
export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export const MAIN_BUDGET = 900;
export const DEFAULT_INSPECTED_HOTEL_ID = 'H_LANTERN';
/** The "what if?" place: raising its importance changes the recommended hotel. */
export const WHAT_IF = { placeId: 'RIVER', importance: 5 } as const;

const PLACE_DEFS: readonly Place[] = [
  { id: 'CLOCK', name: 'Great Clocktower', type: 'attraction', importance: 5 },
  { id: 'MUSEUM', name: 'Museum of Lost Maps', type: 'attraction', importance: 4 },
  { id: 'MARKET', name: 'Midnight Lantern Market', type: 'attraction', importance: 5 },
  { id: 'RIVER', name: 'Riverside Walk', type: 'attraction', importance: 3 },
  { id: 'CASTLE', name: 'Gullwing Castle', type: 'attraction', importance: 2 },
  { id: 'BRIDGE', name: 'Brass Bridge', type: 'attraction', importance: 2 },
  { id: 'GARDEN', name: 'Moonpetal Gardens', type: 'attraction', importance: 1 },
  { id: 'OBSERV', name: 'Starwheel Observatory', type: 'attraction', importance: 3 },
  { id: 'NOODLE', name: 'Saffron Noodle Bar', type: 'food', importance: 4 },
  { id: 'EELPIE', name: 'Smoky Eel-Pie Stall', type: 'food', importance: 3 },
  { id: 'BUNS', name: 'Sugar Bun Bakery', type: 'food', importance: 2 },
  { id: 'CHOWDER', name: 'Harbour Chowder Shack', type: 'food', importance: 3 },
  { id: 'TEA', name: 'Copper Kettle Tea House', type: 'food', importance: 1 },
  { id: 'SKEWER', name: 'Ember Skewer Alley', type: 'food', importance: 2 },
  { id: 'CUSTARD', name: 'Plum Custard Cart', type: 'food', importance: 1 },
];

const HOTEL_DEFS: readonly { id: string; name: string; stayCost: number }[] = [
  { id: 'H_DOCKS', name: 'Dockyard Dorms', stayCost: 520 },
  { id: 'H_MOSSLN', name: 'Moss Lane B&B', stayCost: 610 },
  { id: 'H_TRAMDEP', name: 'Tram Depot Inn', stayCost: 690 },
  { id: 'H_LANTERN', name: 'Lamplighter Lodge', stayCost: 760 },
  { id: 'H_WILLOW', name: 'Willow Terrace', stayCost: 830 },
  { id: 'H_RIVERST', name: 'Riverside Rest', stayCost: 900 },
  { id: 'H_CLOCKGR', name: 'Clocktower Grand', stayCost: 980 },
  { id: 'H_OPAL', name: 'Opal Tower Suites', stayCost: 1060 },
  { id: 'H_MARIGOLD', name: 'Marigold Plaza', stayCost: 1150 },
  { id: 'H_SKYLINE', name: 'Skyline Residence', stayCost: 1290 },
];

export const MARKER_POSITIONS: Readonly<Record<string, MapPoint>> = {
  // places
  CASTLE: { x: 120, y: 70 }, GARDEN: { x: 410, y: 70 }, OBSERV: { x: 600, y: 80 },
  BRIDGE: { x: 810, y: 110 }, MUSEUM: { x: 240, y: 250 }, CLOCK: { x: 450, y: 220 },
  TEA: { x: 680, y: 170 }, RIVER: { x: 800, y: 310 }, BUNS: { x: 390, y: 330 },
  MARKET: { x: 690, y: 420 }, CHOWDER: { x: 900, y: 400 }, NOODLE: { x: 560, y: 500 },
  EELPIE: { x: 770, y: 520 }, SKEWER: { x: 200, y: 580 }, CUSTARD: { x: 600, y: 590 },
  // hotels
  H_WILLOW: { x: 280, y: 130 }, H_RIVERST: { x: 920, y: 200 }, H_CLOCKGR: { x: 540, y: 300 },
  H_MARIGOLD: { x: 660, y: 310 }, H_MOSSLN: { x: 80, y: 300 }, H_SKYLINE: { x: 260, y: 380 },
  H_OPAL: { x: 470, y: 420 }, H_TRAMDEP: { x: 100, y: 470 }, H_LANTERN: { x: 380, y: 520 },
  H_DOCKS: { x: 930, y: 540 },
};

/** Builds a fresh, deep-frozen copy of the main scenario (called on every load/reset). */
export function createMainScenario(): Scenario {
  const hotels: Hotel[] = HOTEL_DEFS.map((h) => {
    const row = TRAVEL_ROWS[h.id];
    if (!row) throw new Error(`No travel row for ${h.id}`);
    const roundTripMinutes = Object.freeze(
      Object.fromEntries(PLACE_ORDER.map((pid, i) => [pid, row[i] as number])),
    );
    return Object.freeze({ ...h, roundTripMinutes });
  });
  const places = PLACE_DEFS.map((p) => Object.freeze({ ...p }));
  return Object.freeze({ hotels: Object.freeze(hotels), places: Object.freeze(places) });
}
