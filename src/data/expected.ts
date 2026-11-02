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
