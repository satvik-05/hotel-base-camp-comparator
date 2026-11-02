/**
 * DOCUMENTED ANSWERS for the main scenario at budget 900 (see docs/DESIGN.md).
 * Used ONLY by tests and docs. App/engine code must never import this file.
 * Computed independently by scripts/verify_expected.py (also checks this file).
 * One hotel per line, in the fixed format the script parses.
 */
export const EXPECTED_IMPORTANCE_TOTAL = 41;
export const EXPECTED_BUDGET = 900;

// id, cost, total (importance-minutes), avg (1 dp), affordable, remaining (budget - cost), rank
export const EXPECTED_HOTELS = [
  { id: 'H_DOCKS', cost: 520, total: 2874, avg: '70.1', affordable: true, remaining: 380, rank: 6 },
  { id: 'H_MOSSLN', cost: 610, total: 2640, avg: '64.4', affordable: true, remaining: 290, rank: 5 },
  { id: 'H_TRAMDEP', cost: 690, total: 2158, avg: '52.6', affordable: true, remaining: 210, rank: 4 },
  { id: 'H_LANTERN', cost: 760, total: 1712, avg: '41.8', affordable: true, remaining: 140, rank: 1 },
  { id: 'H_WILLOW', cost: 830, total: 2048, avg: '50.0', affordable: true, remaining: 70, rank: 3 },
  { id: 'H_RIVERST', cost: 900, total: 1766, avg: '43.1', affordable: true, remaining: 0, rank: 2 },
  { id: 'H_CLOCKGR', cost: 980, total: 1096, avg: '26.7', affordable: false, remaining: -80, rank: null },
  { id: 'H_OPAL', cost: 1060, total: 1256, avg: '30.6', affordable: false, remaining: -160, rank: null },
  { id: 'H_MARIGOLD', cost: 1150, total: 1358, avg: '33.1', affordable: false, remaining: -250, rank: null },
  { id: 'H_SKYLINE', cost: 1290, total: 1182, avg: '28.8', affordable: false, remaining: -390, rank: null },
] as const;

export const EXPECTED_RANK_ORDER = [
  'H_LANTERN', 'H_RIVERST', 'H_WILLOW', 'H_TRAMDEP', 'H_MOSSLN', 'H_DOCKS',
] as const;

export const EXPECTED_STORY = {
  affordableCount: 6,
  cheapestAffordable: 'H_DOCKS',
  recommended: 'H_LANTERN',
  mostAccessible: 'H_CLOCKGR', // total 1096, unique lowest, over budget by 80
  /** Budget at which the most accessible hotel becomes recommended (its stay cost). */
  boundaryBudget: 980,
  justBelowBoundaryRecommended: 'H_LANTERN', // budget 979
  /** RIVER 3 -> 5 changes the recommendation at budget 900. */
  whatIf: {
    placeId: 'RIVER',
    importance: 5,
    importanceTotal: 43,
    recommended: 'H_RIVERST',
    totals: { H_RIVERST: 1802, H_LANTERN: 1812 },
    rankOrder: ['H_RIVERST', 'H_LANTERN', 'H_WILLOW', 'H_TRAMDEP', 'H_MOSSLN', 'H_DOCKS'],
  },
  /** Affordable hotel with every trip <= 90 / one with a trip > 90 (longest trips in minutes). */
  allTripsWithin90: 'H_LANTERN',
  hasTripOver90: 'H_DOCKS',
} as const;

/**
 * DOCUMENTED ANSWERS for the demo cities at each city's default budget (same rule as above: tests and docs
 * only). Hotel lines use the same fixed format; scripts/verify_expected.py recomputes all of it independently
 * from the raw numbers in src/data/cities/<id>.ts.
 */
export const EXPECTED_CITIES = {
  hyderabad: {
    budget: 20500,
    importanceTotal: 44,
    rankOrder: ['H_BANJARA', 'H_JUBILEE', 'H_HITEC', 'H_LBNAGAR', 'H_GACHI', 'H_AIRPORT'],
    recommended: 'H_BANJARA',
    mostAccessible: 'H_ABIDS',
    boundaryBudget: 30000,
    hotels: [
      { id: 'H_BANJARA', cost: 20000, total: 2723, avg: '61.9', affordable: true, remaining: 500, rank: 1 },
      { id: 'H_HITEC', cost: 17000, total: 3997, avg: '90.8', affordable: true, remaining: 3500, rank: 3 },
      { id: 'H_GACHI', cost: 9500, total: 4642, avg: '105.5', affordable: true, remaining: 11000, rank: 5 },
      { id: 'H_ABIDS', cost: 30000, total: 2425, avg: '55.1', affordable: false, remaining: -9500, rank: null },
      { id: 'H_NECKLACE', cost: 24000, total: 2600, avg: '59.1', affordable: false, remaining: -3500, rank: null },
      { id: 'H_SECUND', cost: 23000, total: 3368, avg: '76.5', affordable: false, remaining: -2500, rank: null },
      { id: 'H_OLDCITY', cost: 30500, total: 2467, avg: '56.1', affordable: false, remaining: -10000, rank: null },
      { id: 'H_JUBILEE', cost: 20500, total: 3404, avg: '77.4', affordable: true, remaining: 0, rank: 2 },
      { id: 'H_AIRPORT', cost: 6000, total: 5713, avg: '129.8', affordable: true, remaining: 14500, rank: 6 },
      { id: 'H_LBNAGAR', cost: 12000, total: 4534, avg: '103.0', affordable: true, remaining: 8500, rank: 4 },
    ],
  },
  kyoto: {
    budget: 56000,
    importanceTotal: 47,
    rankOrder: ['H_FUSHIMI', 'H_NISHIJIN', 'H_KITAYAMA', 'H_ARASHI'],
    recommended: 'H_FUSHIMI',
    mostAccessible: 'H_GION',
    boundaryBudget: 111000,
    hotels: [
      { id: 'H_STATION', cost: 85000, total: 2144, avg: '45.6', affordable: false, remaining: -29000, rank: null },
      { id: 'H_GION', cost: 111000, total: 1902, avg: '40.5', affordable: false, remaining: -55000, rank: null },
      { id: 'H_KAWARA', cost: 112000, total: 1934, avg: '41.1', affordable: false, remaining: -56000, rank: null },
      { id: 'H_ARASHI', cost: 22000, total: 3299, avg: '70.2', affordable: true, remaining: 34000, rank: 4 },
      { id: 'H_KITAYAMA', cost: 36000, total: 2717, avg: '57.8', affordable: true, remaining: 20000, rank: 3 },
      { id: 'H_FUSHIMI', cost: 53000, total: 2444, avg: '52.0', affordable: true, remaining: 3000, rank: 1 },
      { id: 'H_NISHIJIN', cost: 56000, total: 2478, avg: '52.7', affordable: true, remaining: 0, rank: 2 },
      { id: 'H_DEMACHI', cost: 63000, total: 2318, avg: '49.3', affordable: false, remaining: -7000, rank: null },
      { id: 'H_HIGASHI', cost: 98000, total: 1996, avg: '42.5', affordable: false, remaining: -42000, rank: null },
      { id: 'H_KARASUMA', cost: 95000, total: 2018, avg: '42.9', affordable: false, remaining: -39000, rank: null },
    ],
  },
  lisbon: {
    budget: 790,
    importanceTotal: 47,
    rankOrder: ['H_AVENIDA', 'H_BELEM', 'H_AIRPORT', 'H_PARQUE', 'H_SINTRA', 'H_CASCAIS'],
    recommended: 'H_AVENIDA',
    mostAccessible: 'H_BAIRRO',
    boundaryBudget: 1300,
    hotels: [
      { id: 'H_BAIXA', cost: 1210, total: 1756, avg: '37.4', affordable: false, remaining: -420, rank: null },
      { id: 'H_CHIADO', cost: 1020, total: 1793, avg: '38.1', affordable: false, remaining: -230, rank: null },
      { id: 'H_ALFAMA', cost: 880, total: 1836, avg: '39.1', affordable: false, remaining: -90, rank: null },
      { id: 'H_BELEM', cost: 790, total: 2006, avg: '42.7', affordable: true, remaining: 0, rank: 2 },
      { id: 'H_BAIRRO', cost: 1300, total: 1740, avg: '37.0', affordable: false, remaining: -510, rank: null },
      { id: 'H_AVENIDA', cost: 730, total: 1864, avg: '39.7', affordable: true, remaining: 60, rank: 1 },
      { id: 'H_PARQUE', cost: 590, total: 3349, avg: '71.3', affordable: true, remaining: 200, rank: 4 },
      { id: 'H_AIRPORT', cost: 650, total: 3293, avg: '70.1', affordable: true, remaining: 140, rank: 3 },
      { id: 'H_SINTRA', cost: 420, total: 5867, avg: '124.8', affordable: true, remaining: 370, rank: 5 },
      { id: 'H_CASCAIS', cost: 320, total: 6214, avg: '132.2', affordable: true, remaining: 470, rank: 6 },
    ],
  },
} as const;
