import type { Place } from '../../engine/types';
import { buildCity } from './build';

/** Lisbon: real landmark names; hotels, prices and travel times are invented and approximate (see docs/DESIGN.md). */
export const PLACE_ORDER = [
  'BELEM', 'JERONIMOS', 'CASTELO', 'ALFAMA', 'SANTAJUSTA',
  'OCEANARIO', 'CRISTOREI', 'EDUARDO', 'PASTEIS', 'TIMEOUT',
  'BAIRRO', 'OURIQUE', 'MOURARIA', 'ALCANTARA', 'SODRE',
] as const;

const PLACE_DEFS: readonly Place[] = [
  { id: 'BELEM', name: 'Belém Tower', type: 'attraction', importance: 5 },
  { id: 'JERONIMOS', name: 'Jerónimos Monastery', type: 'attraction', importance: 4 },
  { id: 'CASTELO', name: 'São Jorge Castle', type: 'attraction', importance: 5 },
  { id: 'ALFAMA', name: 'Alfama Lanes', type: 'attraction', importance: 3 },
  { id: 'SANTAJUSTA', name: 'Santa Justa Lift', type: 'attraction', importance: 2 },
  { id: 'OCEANARIO', name: 'Oceanário', type: 'attraction', importance: 3 },
  { id: 'CRISTOREI', name: 'Cristo Rei', type: 'attraction', importance: 4 },
  { id: 'EDUARDO', name: 'Eduardo VII Park', type: 'attraction', importance: 1 },
  { id: 'PASTEIS', name: 'Pastéis de Belém', type: 'food', importance: 5 },
  { id: 'TIMEOUT', name: 'Time Out Market', type: 'food', importance: 4 },
  { id: 'BAIRRO', name: 'Bairro Alto Tascas', type: 'food', importance: 3 },
  { id: 'OURIQUE', name: 'Campo de Ourique Grill', type: 'food', importance: 2 },
  { id: 'MOURARIA', name: 'Mouraria Petiscos', type: 'food', importance: 3 },
  { id: 'ALCANTARA', name: 'Alcântara Grill', type: 'food', importance: 2 },
  { id: 'SODRE', name: 'Cais do Sodré Seafood', type: 'food', importance: 1 },
];

const HOTEL_DEFS: readonly { id: string; name: string; stayCost: number }[] = [
  { id: 'H_BAIXA', name: 'Baixa Pombal Hotel', stayCost: 1210 },
  { id: 'H_CHIADO', name: 'Chiado Terrace', stayCost: 1020 },
  { id: 'H_ALFAMA', name: 'Alfama Azulejo House', stayCost: 880 },
  { id: 'H_BELEM', name: 'Belém Riverside Inn', stayCost: 790 },
  { id: 'H_BAIRRO', name: 'Bairro Alto Loft', stayCost: 1300 },
  { id: 'H_AVENIDA', name: 'Avenida Suites', stayCost: 730 },
  { id: 'H_PARQUE', name: 'Parque das Nações Stay', stayCost: 590 },
  { id: 'H_AIRPORT', name: 'Aeroporto Lodge', stayCost: 650 },
  { id: 'H_SINTRA', name: 'Sintra Hills Guesthouse', stayCost: 420 },
  { id: 'H_CASCAIS', name: 'Cascais Bay Inn', stayCost: 320 },
];

/** Round-trip minutes (hotel -> place -> hotel), columns in PLACE_ORDER. Constants only. */
const TRAVEL_ROWS: Readonly<Record<string, readonly number[]>> = {
  H_BAIXA: [66, 56, 15, 19, 14, 66, 47, 27, 57, 20, 17, 30, 17, 42, 18],
  H_CHIADO: [67, 60, 18, 19, 15, 66, 47, 32, 59, 17, 16, 31, 20, 37, 16],
  H_ALFAMA: [62, 66, 14, 14, 17, 60, 54, 36, 59, 22, 23, 39, 16, 42, 22],
  H_BELEM: [24, 18, 60, 57, 55, 78, 40, 49, 14, 50, 49, 43, 58, 29, 55],
  H_BAIRRO: [59, 57, 18, 24, 15, 67, 48, 26, 55, 20, 13, 28, 20, 38, 20],
  H_AVENIDA: [68, 61, 21, 25, 21, 62, 51, 21, 58, 24, 18, 25, 18, 40, 23],
  H_PARQUE: [89, 91, 61, 62, 61, 15, 91, 56, 87, 75, 67, 67, 59, 75, 65],
  H_AIRPORT: [91, 76, 67, 62, 67, 38, 75, 60, 78, 67, 68, 62, 67, 77, 64],
  H_SINTRA: [105, 108, 129, 127, 143, 135, 133, 126, 107, 137, 138, 116, 138, 133, 126],
  H_CASCAIS: [122, 113, 135, 143, 130, 176, 123, 141, 126, 132, 126, 122, 145, 134, 144],
};

/** Presentation-only marker positions on the 1000 x 640 schematic map. Never used in calculation. */
const MARKERS = {
  BELEM: { x: 412, y: 398 }, JERONIMOS: { x: 428, y: 471 }, CASTELO: { x: 857, y: 395 },
  ALFAMA: { x: 619, y: 178 }, SANTAJUSTA: { x: 918, y: 255 }, OCEANARIO: { x: 860, y: 97 },
  CRISTOREI: { x: 712, y: 570 }, EDUARDO: { x: 567, y: 320 }, PASTEIS: { x: 434, y: 326 },
  TIMEOUT: { x: 596, y: 100 }, BAIRRO: { x: 751, y: 178 }, OURIQUE: { x: 482, y: 249 },
  MOURARIA: { x: 867, y: 325 }, ALCANTARA: { x: 579, y: 392 }, SODRE: { x: 648, y: 248 },
  H_BAIXA: { x: 584, y: 485 }, H_CHIADO: { x: 726, y: 466 }, H_ALFAMA: { x: 907, y: 217 },
  H_BELEM: { x: 714, y: 344 }, H_BAIRRO: { x: 715, y: 405 }, H_AVENIDA: { x: 791, y: 283 },
  H_PARQUE: { x: 807, y: 51 }, H_AIRPORT: { x: 728, y: 120 }, H_SINTRA: { x: 188, y: 106 },
  H_CASCAIS: { x: 137, y: 397 },
} as const;

export const LISBON = buildCity({
  id: 'lisbon',
  name: 'Lisbon',
  country: 'Portugal',
  blurb: 'Seven hills above the Tagus. Steep streets and far-out day trips stretch the clock.',
  currency: { symbol: '€', locale: 'en-US' },
  budget: 790,
  slider: { max: 1500, step: 10 },
  defaultInspectedHotelId: 'H_AVENIDA',
  placeDefs: PLACE_DEFS,
  hotelDefs: HOTEL_DEFS,
  placeOrder: PLACE_ORDER,
  travelRows: TRAVEL_ROWS,
  markers: MARKERS,
  backdrop: {
    texture: 'blocks',
    parks: ['M 546 229 C 562 226 628 196 641 214 C 654 232 643 315 626 336 C 608 358 549 359 536 341 C 522 323 544 247 546 229 C 547 210 530 231 546 229 Z', 'M 753 265 C 753 270 757 296 757 296 C 757 296 753 270 753 265 C 752 260 752 260 753 265 Z', 'M 91 42 C 98 40 118 37 132 35 C 146 33 163 26 175 28 C 188 29 201 30 208 42 C 214 55 222 92 216 104 C 209 117 185 113 171 118 C 156 122 140 130 128 130 C 116 130 104 130 98 118 C 92 106 94 73 92 60 C 91 48 91 45 91 42 C 90 38 84 43 91 42 Z'],
    water: ['M -120 448 C -93 448 8 447 41 448 C 74 449 66 451 79 453 C 92 455 106 457 119 460 C 132 462 146 464 160 466 C 173 469 187 471 202 474 C 216 476 231 480 245 482 C 260 483 275 482 290 482 C 305 483 321 483 337 484 C 353 484 370 485 387 486 C 404 487 422 488 440 488 C 458 489 476 488 496 488 C 516 489 537 490 561 490 C 585 491 609 497 641 492 C 673 488 721 476 753 463 C 785 450 813 433 835 414 C 858 394 873 368 887 344 C 900 320 908 293 917 270 C 926 247 936 229 941 206 C 947 183 949 147 951 131 C 953 115 925 112 954 108 C 982 104 1092 -1 1120 108 C 1148 217 1327 651 1120 760 C 913 869 87 760 -120 760 Z'],
    rivers: [],
    roads: ['M 784 224 C 788 245 804 325 810 353 C 815 382 817 389 818 396', 'M 707 199 C 709 220 723 291 721 322 C 718 353 695 376 690 387', 'M 513 462 C 525 462 557 464 584 465 C 612 465 646 469 678 465 C 710 462 746 455 775 443 C 803 431 837 401 850 393', 'M 694 356 C 710 353 763 344 791 340 C 818 336 842 344 859 331 C 876 318 881 283 890 262 C 900 240 914 212 918 202'],
    bridges: ['M 644 478 L 650 635'],
    labels: [
      {
        x: 838,
        y: 472,
        text: 'BAIXA',
      },
      {
        x: 531,
        y: 527,
        text: 'BELÉM',
      },
      {
        x: 879,
        y: 577,
        text: 'TEJO ESTUARY',
      },
      {
        x: 905,
        y: 118,
        text: 'PARQUE DAS NAÇÕES',
      },
      {
        x: 481,
        y: 217,
        text: 'MONSANTO',
      },
      {
        x: 170,
        y: 58,
        text: 'SINTRA HILLS',
      },
    ],
  },
});
