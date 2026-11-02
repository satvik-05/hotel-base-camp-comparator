import type { Place } from '../../engine/types';
import { buildCity } from './build';

/** Hyderabad: real landmark names; hotels, prices and travel times are invented and approximate (see docs/DESIGN.md). */
export const PLACE_ORDER = [
  'CHARMINAR', 'GOLCONDA', 'HUSSAIN', 'SALARJUNG', 'BIRLA',
  'QUTB', 'SHILPA', 'NEHRUZOO', 'BIRYANI', 'IRANI',
  'HALEEM', 'DOSA', 'KEBAB', 'CAFES', 'MANDI',
] as const;

const PLACE_DEFS: readonly Place[] = [
  { id: 'CHARMINAR', name: 'Charminar', type: 'attraction', importance: 5 },
  { id: 'GOLCONDA', name: 'Golconda Fort', type: 'attraction', importance: 4 },
  { id: 'HUSSAIN', name: 'Hussain Sagar', type: 'attraction', importance: 4 },
  { id: 'SALARJUNG', name: 'Salar Jung Museum', type: 'attraction', importance: 3 },
  { id: 'BIRLA', name: 'Birla Mandir', type: 'attraction', importance: 2 },
  { id: 'QUTB', name: 'Qutb Shahi Tombs', type: 'attraction', importance: 2 },
  { id: 'SHILPA', name: 'Shilparamam', type: 'attraction', importance: 1 },
  { id: 'NEHRUZOO', name: 'Nehru Zoo Park', type: 'attraction', importance: 3 },
  { id: 'BIRYANI', name: 'Secunderabad Biryani', type: 'food', importance: 5 },
  { id: 'IRANI', name: 'Nampally Irani Chai', type: 'food', importance: 3 },
  { id: 'HALEEM', name: 'Madina Haleem Stalls', type: 'food', importance: 4 },
  { id: 'DOSA', name: 'Kachiguda Dosa Row', type: 'food', importance: 2 },
  { id: 'KEBAB', name: 'Tolichowki Kebabs', type: 'food', importance: 3 },
  { id: 'CAFES', name: 'Jubilee Hills Cafes', type: 'food', importance: 2 },
  { id: 'MANDI', name: 'Mehdipatnam Mandi', type: 'food', importance: 1 },
];

const HOTEL_DEFS: readonly { id: string; name: string; stayCost: number }[] = [
  { id: 'H_BANJARA', name: 'Banjara Heights', stayCost: 20000 },
  { id: 'H_HITEC', name: 'HITEC Gateway', stayCost: 17000 },
  { id: 'H_GACHI', name: 'Gachibowli Stay', stayCost: 9500 },
  { id: 'H_ABIDS', name: 'Abids Courtyard', stayCost: 30000 },
  { id: 'H_NECKLACE', name: 'Necklace Road Inn', stayCost: 24000 },
  { id: 'H_SECUND', name: 'Secunderabad Lodge', stayCost: 23000 },
  { id: 'H_OLDCITY', name: 'Old City Haveli', stayCost: 30500 },
  { id: 'H_JUBILEE', name: 'Jubilee Hills Retreat', stayCost: 20500 },
  { id: 'H_AIRPORT', name: 'Airport Lodge', stayCost: 6000 },
  { id: 'H_LBNAGAR', name: 'LB Nagar Budget Inn', stayCost: 12000 },
];

/** Round-trip minutes (hotel -> place -> hotel), columns in PLACE_ORDER. Constants only. */
const TRAVEL_ROWS: Readonly<Record<string, readonly number[]>> = {
  H_BANJARA: [75, 65, 43, 68, 33, 68, 81, 71, 68, 46, 75, 72, 49, 57, 33],
  H_HITEC: [104, 78, 88, 104, 103, 73, 25, 108, 100, 94, 105, 103, 69, 49, 87],
  H_GACHI: [119, 85, 111, 123, 105, 73, 47, 117, 115, 103, 132, 119, 85, 71, 93],
  H_ABIDS: [41, 87, 43, 36, 28, 87, 95, 60, 69, 16, 45, 42, 74, 83, 42],
  H_NECKLACE: [70, 71, 29, 56, 23, 74, 95, 75, 63, 34, 67, 59, 60, 72, 41],
  H_SECUND: [95, 111, 40, 84, 62, 109, 102, 100, 16, 73, 84, 57, 89, 94, 89],
  H_OLDCITY: [17, 83, 69, 25, 57, 95, 104, 36, 79, 45, 15, 54, 79, 94, 60],
  H_JUBILEE: [102, 67, 74, 85, 77, 53, 53, 100, 92, 79, 90, 89, 42, 19, 63],
  H_AIRPORT: [111, 125, 134, 131, 139, 127, 156, 95, 154, 140, 115, 142, 133, 148, 127],
  H_LBNAGAR: [81, 122, 103, 86, 96, 134, 159, 96, 102, 97, 92, 76, 129, 129, 98],
};

/** Presentation-only marker positions on the 1000 x 640 schematic map. Never used in calculation. */
const MARKERS = {
  CHARMINAR: { x: 662, y: 363 }, GOLCONDA: { x: 302, y: 270 }, HUSSAIN: { x: 638, y: 127 },
  SALARJUNG: { x: 724, y: 291 }, BIRLA: { x: 592, y: 288 }, QUTB: { x: 170, y: 255 },
  SHILPA: { x: 169, y: 87 }, NEHRUZOO: { x: 462, y: 373 }, BIRYANI: { x: 782, y: 45 },
  IRANI: { x: 628, y: 55 }, HALEEM: { x: 641, y: 433 }, DOSA: { x: 808, y: 208 },
  KEBAB: { x: 279, y: 184 }, CAFES: { x: 308, y: 98 }, MANDI: { x: 443, y: 290 },
  H_BANJARA: { x: 483, y: 108 }, H_HITEC: { x: 155, y: 48 }, H_GACHI: { x: 102, y: 192 },
  H_ABIDS: { x: 664, y: 223 }, H_NECKLACE: { x: 496, y: 249 }, H_SECUND: { x: 798, y: 140 },
  H_OLDCITY: { x: 506, y: 186 }, H_JUBILEE: { x: 312, y: 46 }, H_AIRPORT: { x: 386, y: 546 },
  H_LBNAGAR: { x: 910, y: 370 },
} as const;

export const HYDERABAD = buildCity({
  id: 'hyderabad',
  name: 'Hyderabad',
  country: 'India',
  blurb: 'Old City heritage, lakes and a sprawling tech belt. Traffic makes distance matter.',
  currency: { symbol: '₹', locale: 'en-IN' },
  budget: 20500,
  slider: { max: 60000, step: 500 },
  defaultInspectedHotelId: 'H_BANJARA',
  placeDefs: PLACE_DEFS,
  hotelDefs: HOTEL_DEFS,
  placeOrder: PLACE_ORDER,
  travelRows: TRAVEL_ROWS,
  markers: MARKERS,
  backdrop: {
    texture: 'blocks',
    parks: ['M 346 132 C 356 136 408 153 408 153 C 408 153 356 136 346 132 C 335 129 335 129 346 132 Z', 'M 465 351 C 481 352 549 348 559 352 C 568 357 536 376 520 378 C 505 380 473 369 464 364 C 454 360 465 353 465 351 C 465 349 450 351 465 351 Z', 'M 194 243 C 205 243 246 234 262 241 C 278 247 298 275 288 282 C 279 289 221 288 206 282 C 190 275 196 250 194 243 C 192 237 183 244 194 243 Z'],
    water: ['M 611 96 C 620 106 672 154 665 155 C 659 156 580 113 571 103 C 562 94 604 97 611 96 C 617 95 601 86 611 96 Z', 'M 233 108 C 231 111 221 125 221 125 C 221 125 231 111 233 108 C 235 106 235 106 233 108 Z'],
    rivers: [
      {
        d: 'M 6 235 C 15 237 43 241 63 244 C 83 248 103 251 124 255 C 145 258 166 262 188 266 C 209 269 230 272 254 276 C 277 280 300 284 330 289 C 359 293 392 299 428 303 C 465 306 511 308 550 307 C 589 307 629 301 663 300 C 696 299 728 300 753 303 C 779 306 797 313 817 317 C 837 321 856 325 875 328 C 894 331 911 332 929 334 C 947 337 964 340 980 341 C 997 343 1013 344 1029 345 C 1045 346 1060 348 1076 349 C 1091 350 1113 352 1121 353',
        width: 16,
      },
    ],
    roads: ['M 739 88 C 734 93 719 109 708 120 C 697 132 687 144 675 158 C 663 171 642 186 637 203 C 632 221 643 246 644 265 C 644 283 639 300 641 315 C 643 330 650 342 656 355 C 662 367 674 382 679 390 C 684 397 685 399 686 401', 'M 81 98 C 91 98 121 97 141 97 C 161 97 182 97 202 100 C 223 103 241 108 262 112 C 283 117 304 121 328 125 C 353 130 377 133 407 139 C 437 144 473 149 508 160 C 542 172 591 197 613 208 C 635 218 634 220 638 223', 'M 423 223 C 408 224 360 229 333 231 C 306 233 275 232 260 237 C 246 242 247 257 244 261', 'M 645 313 C 657 313 695 314 719 314 C 742 315 763 315 783 316 C 804 318 824 319 843 323 C 862 326 883 333 898 336 C 913 340 928 344 934 345', 'M 303 90 C 317 91 356 94 385 98 C 413 102 444 105 475 114 C 506 123 556 146 572 152'],
    bridges: [],
    labels: [
      {
        x: 577,
        y: 261,
        text: 'OLD CITY',
      },
      {
        x: 12,
        y: 286,
        text: 'HITEC CITY',
      },
      {
        x: 710,
        y: 22,
        text: 'SECUNDERABAD',
      },
      {
        x: 455,
        y: 33,
        text: 'BANJARA HILLS',
      },
      {
        x: 580,
        y: 33,
        text: 'HUSSAIN SAGAR',
      },
      {
        x: 860,
        y: 305,
        text: 'MUSI RIVER',
      },
      {
        x: 244,
        y: 340,
        text: 'GOLCONDA',
      },
    ],
  },
});
