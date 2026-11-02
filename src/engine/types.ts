export type PlaceType = 'attraction' | 'food';

export interface Place {
  readonly id: string;
  readonly name: string;
  readonly type: PlaceType;
  /** Whole number 1–5. */
  readonly importance: number;
}

export interface Hotel {
  readonly id: string;
  readonly name: string;
  /** Quoted price for the complete stay (whole currency units). */
  readonly stayCost: number;
  /** Complete hotel → place → hotel minutes, keyed by every place id. */
  readonly roundTripMinutes: Readonly<Record<string, number>>;
}

export interface Scenario {
  readonly hotels: readonly Hotel[];
  readonly places: readonly Place[];
}

export interface Contribution {
  readonly placeId: string;
  readonly importance: number;
  readonly roundTripMinutes: number;
  /** importance × roundTripMinutes, in importance-minutes. */
  readonly value: number;
}

export type HotelStatus = 'RECOMMENDED' | 'RANKED' | 'OVER_BUDGET';

export interface HotelEvaluation {
  readonly hotelId: string;
  readonly name: string;
  readonly stayCost: number;
  readonly contributions: readonly Contribution[];
  /** Exact integer; the only quantity used for ranking. */
  readonly weightedTravelTotal: number;
  /** Rounded-half-up tenths of the weighted average (display only). */
  readonly roundedTenths: number;
  /** One-decimal display string, e.g. "28.0". */
  readonly weightedAverage: string;
  readonly longestTripMinutes: number;
  readonly affordable: boolean;
  /** budget - stayCost (negative when over budget). */
  readonly remainingBudget: number;
  /** Amount over budget; 0 when affordable. */
  readonly shortfall: number;
  readonly rank: number | null;
  readonly status: HotelStatus;
  /** Human-readable eligibility / rank reason. */
  readonly reason: string;
}

export type ValidationCode =
  | 'INVALID_HOTEL_COUNT'
  | 'INVALID_PLACE_COUNT'
  | 'MALFORMED_ID'
  | 'DUPLICATE_ID'
  | 'EMPTY_NAME'
  | 'INVALID_PLACE_TYPE'
  | 'INVALID_BUDGET'
  | 'INVALID_STAY_COST'
  | 'INVALID_IMPORTANCE'
  | 'INVALID_TRAVEL_TIME'
  | 'MISSING_PLACE_TIME'
  | 'UNKNOWN_PLACE_TIME'
  | 'MALFORMED_SCENARIO';

export interface ValidationError {
  readonly code: ValidationCode;
  readonly message: string;
  /** Dotted locator, e.g. "hotels[2].roundTripMinutes.CLOCK". */
  readonly path: string;
}

export interface EngineInvalid {
  readonly status: 'invalid';
  readonly errors: readonly ValidationError[];
}

export type Outcome = 'RECOMMENDED' | 'NO_AFFORDABLE_HOTEL';

export interface EngineOk {
  readonly status: 'ok';
  readonly budget: number;
  readonly importanceTotal: number;
  /** Every hotel, in scenario input order. */
  readonly evaluations: readonly HotelEvaluation[];
  /** Affordable hotels only, best first, ranks 1..n. */
  readonly ranking: readonly HotelEvaluation[];
  readonly recommended: HotelEvaluation | null;
  readonly outcome: Outcome;
}

export type EngineResult = EngineOk | EngineInvalid;
