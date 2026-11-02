/**
 * Hand-authored round-trip minutes (hotel -> place -> hotel). Constants only: no map geometry,
 * no randomness. Row format is regular so scripts/verify_expected.py can parse it.
 * Column order is PLACE_ORDER below.
 */
export const PLACE_ORDER = [
  'CLOCK', 'MUSEUM', 'MARKET', 'RIVER', 'CASTLE', 'BRIDGE', 'GARDEN', 'OBSERV',
  'NOODLE', 'EELPIE', 'BUNS', 'CHOWDER', 'TEA', 'SKEWER', 'CUSTARD',
] as const;

export const TRAVEL_ROWS: Readonly<Record<string, readonly number[]>> = {
  H_DOCKS: [70, 78, 66, 40, 110, 58, 96, 118, 72, 34, 70, 30, 80, 88, 100],
  H_MOSSLN: [56, 60, 58, 72, 48, 84, 40, 52, 60, 80, 58, 86, 62, 74, 90],
  H_TRAMDEP: [40, 44, 38, 58, 70, 52, 76, 82, 36, 64, 40, 66, 44, 60, 74],
  H_LANTERN: [24, 30, 28, 50, 62, 48, 70, 66, 26, 52, 30, 54, 32, 58, 64],
  H_WILLOW: [36, 40, 46, 70, 22, 64, 26, 28, 44, 74, 50, 76, 40, 70, 80],
  H_RIVERST: [44, 50, 40, 18, 74, 20, 52, 60, 50, 24, 46, 20, 50, 64, 70],
  H_CLOCKGR: [12, 16, 18, 34, 40, 38, 44, 46, 14, 36, 12, 40, 16, 38, 42],
  H_OPAL: [16, 22, 20, 40, 44, 36, 50, 52, 18, 40, 16, 42, 20, 42, 48],
  H_MARIGOLD: [18, 20, 24, 44, 46, 42, 48, 50, 22, 44, 20, 46, 22, 46, 50],
  H_SKYLINE: [14, 18, 22, 36, 42, 40, 46, 48, 16, 38, 14, 40, 18, 40, 44],
};
