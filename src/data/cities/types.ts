import type { Scenario } from '../../engine/types';

/** Presentation-only marker position on a 1000 x 640 schematic map. Never used in calculation. */
export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export interface Currency {
  /** Shown before every amount, e.g. "$", "₹". */
  readonly symbol: string;
  /** Locale used only for digit grouping, e.g. "en-IN" groups 1,25,000. */
  readonly locale: string;
}

/**
 * Decorative map backdrop for one city: SVG path data in the 1000 x 640 map space. Purely
 * presentational; none of it carries data and none of it feeds a calculation.
 */
export interface BackdropSpec {
  readonly texture: 'blocks' | 'grid';
  readonly parks: readonly string[];
  /** Filled water (lakes, the sea). */
  readonly water: readonly string[];
  readonly rivers: readonly { readonly d: string; readonly width: number }[];
  readonly roads: readonly string[];
  readonly bridges: readonly string[];
  readonly labels: readonly { readonly x: number; readonly y: number; readonly text: string; readonly rotate?: number }[];
}

export interface CityDefinition {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  /** One line shown on the city card. */
  readonly blurb: string;
  /** True for the invented Marlowe Bay; false for demo cities that use real landmark names. */
  readonly fictional: boolean;
  readonly currency: Currency;
  /** The initial whole-stay budget (and what Reset restores). */
  readonly budget: number;
  readonly slider: { readonly max: number; readonly step: number };
  /** The hotel inspected on load and after Reset. */
  readonly defaultInspectedHotelId: string;
  readonly markers: Readonly<Record<string, MapPoint>>;
  readonly backdrop: BackdropSpec;
  /** A fresh, deep-frozen copy of the original scenario (called on every load/reset). */
  readonly createScenario: () => Scenario;
}
