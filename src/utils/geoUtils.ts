/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Property } from '../types/property';

// Base coordinates for Taman Seri Gedung, 08000 Sungai Petani, Kedah, Malaysia
const BASE_LAT = 5.6422;
const BASE_LNG = 100.4965;

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export function parseStreetIndex(streetName: string): number {
  const match = streetName.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 2;
}

/**
 * Calculates deterministic geographic coordinates for each property in Taman Seri Gedung
 * based on its street corridor and house sequence.
 */
export function getPropertyCoordinates(property: Property): GeoCoordinate {
  const houseNum = parseInt(property.house_no, 10) || 1;
  const streetIdx = parseStreetIndex(property.street_name);

  // Street spacing along North-South axis
  const streetLatOffset = (streetIdx - 2) * 0.00032;

  // Parcel offset along the East-West street road
  const unitInRow = houseNum % 32;
  const lngOffset = unitInRow * 0.00016;

  // Even house numbers on North side of street, odd on South side
  const sideOfStreet = (houseNum % 2 === 0) ? 0.00007 : -0.00007;

  return {
    lat: Number((BASE_LAT + streetLatOffset + sideOfStreet).toFixed(6)),
    lng: Number((BASE_LNG + lngOffset).toFixed(6)),
  };
}

/**
 * Generates polygon coordinates representing a standard landed single-storey terrace parcel
 * (approx 20ft x 65ft / 6m x 20m)
 */
export function getPropertyParcelPolygon(property: Property): [number, number][] {
  const center = getPropertyCoordinates(property);
  const halfWidth = 0.000055;  // East-West parcel width
  const halfDepth = 0.000075;  // North-South parcel depth

  return [
    [center.lat + halfDepth, center.lng - halfWidth],
    [center.lat + halfDepth, center.lng + halfWidth],
    [center.lat - halfDepth, center.lng + halfWidth],
    [center.lat - halfDepth, center.lng - halfWidth],
  ];
}

/**
 * Generates bounding box for the entire Taman Seri Gedung development plan
 */
export function getDevelopmentBounds(): [[number, number], [number, number]] {
  return [
    [BASE_LAT - 0.0010, BASE_LNG - 0.0010],
    [BASE_LAT + 0.0075, BASE_LNG + 0.0065],
  ];
}
