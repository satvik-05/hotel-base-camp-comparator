import type { Contribution, Hotel, Place } from './types';

export const contribution = (importance: number, roundTripMinutes: number): number =>
  importance * roundTripMinutes;

export const importanceTotal = (places: readonly Place[]): number =>
  places.reduce((sum, p) => sum + p.importance, 0);

export function contributionsFor(hotel: Hotel, places: readonly Place[]): Contribution[] {
  return places.map((p) => {
    const roundTripMinutes = hotel.roundTripMinutes[p.id] as number;
    return {
      placeId: p.id,
      importance: p.importance,
      roundTripMinutes,
      value: contribution(p.importance, roundTripMinutes),
    };
  });
}

export const weightedTravelTotal = (contributions: readonly Contribution[]): number =>
  contributions.reduce((sum, c) => sum + c.value, 0);

/** Round-half-up of total / importanceTotal to tenths, integer arithmetic only. */
export const roundedTenths = (total: number, impTotal: number): number =>
  Math.floor((20 * total + impTotal) / (2 * impTotal));

export const formatTenths = (tenths: number): string =>
  `${Math.floor(tenths / 10)}.${tenths % 10}`;
