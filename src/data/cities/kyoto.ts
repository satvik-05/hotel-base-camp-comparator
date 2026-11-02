import type { Place } from '../../engine/types';
import { buildCity } from './build';

/** Kyoto: real landmark names; hotels, prices and travel times are invented and approximate (see docs/DESIGN.md). */
export const PLACE_ORDER = [
  'FUSHIMI', 'KIYOMIZU', 'KINKAKU', 'ARASHIYAMA', 'NIJO',
  'GINKAKU', 'PALACE', 'TOJI', 'NISHIKI', 'GION',
  'RAMEN', 'PONTOCHO', 'UJI', 'YUDOFU', 'SOBA',
] as const;

const PLACE_DEFS: readonly Place[] = [
  { id: 'FUSHIMI', name: 'Fushimi Inari Taisha', type: 'attraction', importance: 5 },
  { id: 'KIYOMIZU', name: 'Kiyomizu-dera', type: 'attraction', importance: 5 },
  { id: 'KINKAKU', name: 'Kinkaku-ji', type: 'attraction', importance: 4 },
  { id: 'ARASHIYAMA', name: 'Arashiyama Bamboo Grove', type: 'attraction', importance: 4 },
  { id: 'NIJO', name: 'Nijo Castle', type: 'attraction', importance: 3 },
  { id: 'GINKAKU', name: 'Ginkaku-ji', type: 'attraction', importance: 3 },
  { id: 'PALACE', name: 'Imperial Palace', type: 'attraction', importance: 2 },
  { id: 'TOJI', name: 'Toji Pagoda', type: 'attraction', importance: 1 },
  { id: 'NISHIKI', name: 'Nishiki Market', type: 'food', importance: 5 },
  { id: 'GION', name: 'Gion Kaiseki', type: 'food', importance: 4 },
  { id: 'RAMEN', name: 'Station Ramen Alley', type: 'food', importance: 3 },
  { id: 'PONTOCHO', name: 'Pontocho Dining', type: 'food', importance: 3 },
  { id: 'UJI', name: 'Uji Matcha Sweets', type: 'food', importance: 2 },
  { id: 'YUDOFU', name: 'Nanzen-ji Yudofu', type: 'food', importance: 2 },
  { id: 'SOBA', name: 'Demachi Soba', type: 'food', importance: 1 },
];

const HOTEL_DEFS: readonly { id: string; name: string; stayCost: number }[] = [
  { id: 'H_STATION', name: 'Station Sora Inn', stayCost: 85000 },
  { id: 'H_GION', name: 'Gion Lantern House', stayCost: 111000 },
  { id: 'H_KAWARA', name: 'Kawaramachi Stay', stayCost: 112000 },
  { id: 'H_ARASHI', name: 'Arashiyama Riverside', stayCost: 22000 },
  { id: 'H_KITAYAMA', name: 'Kitayama Garden Inn', stayCost: 36000 },
  { id: 'H_FUSHIMI', name: 'Fushimi Gate Lodge', stayCost: 53000 },
  { id: 'H_NISHIJIN', name: 'Nishijin Weaver House', stayCost: 56000 },
  { id: 'H_DEMACHI', name: 'Demachi Hostel', stayCost: 63000 },
  { id: 'H_HIGASHI', name: 'Higashiyama Machiya', stayCost: 98000 },
  { id: 'H_KARASUMA', name: 'Karasuma Business Hotel', stayCost: 95000 },
];

/** Round-trip minutes (hotel -> place -> hotel), columns in PLACE_ORDER. Constants only. */
const TRAVEL_ROWS: Readonly<Record<string, readonly number[]>> = {
  H_STATION: [39, 35, 68, 70, 45, 57, 56, 26, 34, 36, 16, 39, 75, 47, 55],
  H_GION: [47, 28, 61, 70, 38, 46, 36, 42, 24, 17, 34, 22, 92, 29, 39],
  H_KAWARA: [48, 34, 59, 73, 34, 50, 35, 44, 19, 20, 38, 19, 85, 38, 38],
  H_ARASHI: [69, 82, 66, 25, 66, 78, 74, 63, 74, 70, 70, 75, 106, 83, 74],
  H_KITAYAMA: [65, 63, 40, 77, 47, 52, 34, 72, 51, 60, 67, 48, 93, 58, 30],
  H_FUSHIMI: [17, 43, 68, 69, 63, 67, 61, 34, 49, 46, 33, 54, 81, 65, 68],
  H_NISHIJIN: [63, 60, 29, 66, 32, 54, 34, 65, 43, 49, 63, 47, 96, 61, 37],
  H_DEMACHI: [64, 50, 50, 74, 36, 36, 25, 61, 37, 41, 58, 40, 87, 45, 18],
  H_HIGASHI: [46, 22, 60, 78, 41, 45, 42, 44, 29, 24, 36, 27, 85, 34, 50],
  H_KARASUMA: [61, 41, 52, 68, 24, 44, 27, 43, 23, 28, 39, 24, 94, 43, 37],
};

/** Presentation-only marker positions on the 1000 x 640 schematic map. Never used in calculation. */
const MARKERS = {
  FUSHIMI: { x: 732, y: 381 }, KIYOMIZU: { x: 890, y: 403 }, KINKAKU: { x: 377, y: 51 },
  ARASHIYAMA: { x: 102, y: 209 }, NIJO: { x: 507, y: 55 }, GINKAKU: { x: 910, y: 197 },
  PALACE: { x: 627, y: 231 }, TOJI: { x: 436, y: 385 }, NISHIKI: { x: 716, y: 308 },
  GION: { x: 779, y: 231 }, RAMEN: { x: 572, y: 307 }, PONTOCHO: { x: 813, y: 26 },
  UJI: { x: 864, y: 568 }, YUDOFU: { x: 926, y: 269 }, SOBA: { x: 856, y: 97 },
  H_STATION: { x: 575, y: 401 }, H_GION: { x: 703, y: 129 }, H_KAWARA: { x: 646, y: 189 },
  H_ARASHI: { x: 115, y: 164 }, H_KITAYAMA: { x: 656, y: 49 }, H_FUSHIMI: { x: 696, y: 476 },
  H_NISHIJIN: { x: 471, y: 155 }, H_DEMACHI: { x: 781, y: 190 }, H_HIGASHI: { x: 890, y: 361 },
  H_KARASUMA: { x: 461, y: 232 },
} as const;

export const KYOTO = buildCity({
  id: 'kyoto',
  name: 'Kyoto',
  country: 'Japan',
  blurb: 'Temples spread around a tidy grid. Trains and walking make short hops cheap, far ones slow.',
  currency: { symbol: '¥', locale: 'en-US' },
  budget: 56000,
  slider: { max: 200000, step: 1000 },
  defaultInspectedHotelId: 'H_FUSHIMI',
  placeDefs: PLACE_DEFS,
  hotelDefs: HOTEL_DEFS,
  placeOrder: PLACE_ORDER,
  travelRows: TRAVEL_ROWS,
  markers: MARKERS,
  backdrop: {
    texture: 'grid',
    parks: ['M 601 115 C 622 119 726 131 724 139 C 723 147 613 167 593 163 C 572 159 600 123 601 115 C 603 106 581 110 601 115 Z', 'M 247 74 C 269 73 346 60 379 65 C 412 70 456 97 444 105 C 433 114 344 116 310 114 C 275 113 249 103 238 96 C 228 90 245 78 247 74 C 248 70 225 75 247 74 Z', 'M 925 245 C 938 235 992 183 1006 186 C 1020 189 1022 253 1008 263 C 995 273 939 248 925 245 C 911 242 911 255 925 245 Z'],
    water: [],
    rivers: [
      {
        d: 'M 701 6 C 701 13 700 34 700 49 C 700 65 697 79 701 97 C 704 116 716 132 722 159 C 727 186 742 229 734 259 C 725 288 686 314 670 337 C 653 360 641 387 635 397',
        width: 14,
      },
      {
        d: 'M 73 161 C 78 169 87 195 104 212 C 121 228 155 243 174 260 C 194 277 204 297 222 314 C 240 332 272 357 282 366',
        width: 12,
      },
    ],
    roads: ['M 211 228 C 230 228 284 228 326 228 C 368 228 401 228 463 227 C 524 227 629 225 697 225 C 764 225 824 227 867 228 C 910 228 940 228 955 228', 'M 216 286 C 236 288 291 290 335 293 C 379 295 423 300 480 302 C 537 305 614 309 676 309 C 739 308 809 301 854 299 C 899 296 931 294 946 293', 'M 628 70 C 628 79 627 103 626 122 C 625 142 621 160 620 188 C 620 216 621 263 622 290 C 623 317 626 338 626 351 C 627 364 627 365 627 368', 'M 518 72 C 515 81 508 106 501 126 C 494 147 479 170 476 197 C 473 223 476 257 481 283 C 486 308 500 333 505 347 C 510 361 510 362 511 365'],
    bridges: [],
    labels: [
      {
        x: 672,
        y: 62,
        text: 'KITAYAMA',
      },
      {
        x: 788,
        y: 308,
        text: 'DOWNTOWN',
      },
      {
        x: 668,
        y: 513,
        text: 'KYOTO STATION',
      },
      {
        x: 25,
        y: 118,
        text: 'ARASHIYAMA',
      },
      {
        x: 832,
        y: 471,
        text: 'HIGASHIYAMA',
      },
      {
        x: 703,
        y: 79,
        text: 'KAMO RIVER',
      },
      {
        x: 738,
        y: 535,
        text: 'FUSHIMI',
      },
    ],
  },
});
