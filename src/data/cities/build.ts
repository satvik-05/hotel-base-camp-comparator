import type { Hotel, Place, Scenario } from '../../engine/types';
import type { BackdropSpec, CityDefinition, Currency, MapPoint } from './types';

export interface CitySource {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  readonly blurb: string;
  readonly currency: Currency;
  readonly budget: number;
  readonly slider: { readonly max: number; readonly step: number };
  readonly defaultInspectedHotelId: string;
  readonly placeDefs: readonly Place[];
  readonly hotelDefs: readonly { readonly id: string; readonly name: string; readonly stayCost: number }[];
  /** Column order of `travelRows`. */
  readonly placeOrder: readonly string[];
  readonly travelRows: Readonly<Record<string, readonly number[]>>;
  readonly markers: Readonly<Record<string, MapPoint>>;
  readonly backdrop: BackdropSpec;
}

/** Builds a demo city. Like Marlowe Bay, the numbers are hand-frozen constants: no geometry or randomness at runtime. */
export function buildCity(src: CitySource): CityDefinition {
  const createScenario = (): Scenario => {
    const hotels: Hotel[] = src.hotelDefs.map((h) => {
      const row = src.travelRows[h.id];
      if (!row) throw new Error(`No travel row for ${h.id}`);
      const roundTripMinutes = Object.freeze(Object.fromEntries(src.placeOrder.map((pid, i) => [pid, row[i] as number])));
      return Object.freeze({ ...h, roundTripMinutes });
    });
    const places = src.placeDefs.map((p) => Object.freeze({ ...p }));
    return Object.freeze({ hotels: Object.freeze(hotels), places: Object.freeze(places) });
  };
  return Object.freeze({
    id: src.id,
    name: src.name,
    country: src.country,
    blurb: src.blurb,
    fictional: false,
    currency: src.currency,
    budget: src.budget,
    slider: src.slider,
    defaultInspectedHotelId: src.defaultInspectedHotelId,
    markers: src.markers,
    backdrop: src.backdrop,
    createScenario,
  });
}
