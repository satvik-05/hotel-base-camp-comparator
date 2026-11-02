import { createMainScenario, DEFAULT_INSPECTED_HOTEL_ID, MAIN_BUDGET, MARKER_POSITIONS } from '../mainCity';
import type { CityDefinition } from './types';

/** The original, fully fictional Marlowe Bay (see ../mainCity.ts), described as a CityDefinition. */
export const MARLOWE: CityDefinition = Object.freeze({
  id: 'marlowe',
  name: 'Marlowe Bay',
  country: 'Fictional',
  blurb: 'The invented reference city the spec is built around: six affordable hotels and one tempting near-miss.',
  fictional: true,
  currency: { symbol: '$', locale: 'en-US' },
  budget: MAIN_BUDGET,
  slider: { max: 1500, step: 10 },
  defaultInspectedHotelId: DEFAULT_INSPECTED_HOTEL_ID,
  markers: MARKER_POSITIONS,
  createScenario: createMainScenario,
  backdrop: {
    texture: 'blocks' as const,
    parks: [
      'M 338 38 Q 400 8 476 36 Q 508 82 452 114 Q 382 128 344 98 Z',
      'M 62 40 Q 120 14 186 44 Q 206 90 150 108 Q 86 112 60 80 Z',
      'M 700 540 Q 760 486 820 548 Q 800 612 726 606 Q 690 580 700 540 Z',
    ],
    water: [],
    rivers: [{ d: 'M 870 0 C 930 120 790 210 840 330 S 890 540 840 640', width: 34 }],
    roads: [
      'M -10 215 C 250 190 500 250 1010 207',
      'M -10 455 C 300 430 620 480 1010 452',
      'M 345 -10 C 330 200 385 450 360 650',
      'M 622 -10 C 645 220 598 430 640 650',
    ],
    bridges: ['M 808 216 L 918 207', 'M 818 455 L 930 452'],
    labels: [
      { x: 58, y: 30, text: 'OLD TOWN' },
      { x: 352, y: 26, text: 'GARDEN QUARTER' },
      { x: 540, y: 470, text: 'MARKET QUARTER' },
      { x: 900, y: 256, text: 'RIVERSIDE' },
      { x: 862, y: 626, text: 'HARBOUR' },
    ],
  },
});
