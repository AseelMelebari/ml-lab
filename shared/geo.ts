export interface LatLng {
  lat: number;
  lng: number;
}

/** Al-Masjid al-Haram — default map centre. */
export const MAKKAH_CENTER: LatLng = { lat: 21.4225, lng: 39.8262 };

/** Hard safety box around Makkah — mirrors dafwa_in_makkah_bounds() in SQL. */
export const MAKKAH_BOUNDS = { south: 21.15, north: 21.75, west: 39.55, east: 40.15 };

export function inMakkahBounds(p: LatLng): boolean {
  return p.lat >= MAKKAH_BOUNDS.south && p.lat <= MAKKAH_BOUNDS.north && p.lng >= MAKKAH_BOUNDS.west && p.lng <= MAKKAH_BOUNDS.east;
}

/** Ray-casting point-in-polygon — mirrors dafwa_point_in_polygon() in SQL. */
export function pointInPolygon(p: LatLng, polygon: LatLng[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i].lat, xi = polygon[i].lng, yj = polygon[j].lat, xj = polygon[j].lng;
    if (yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function googleMapsLink(lat: number | string, lng: number | string): string {
  const la = Number(lat).toFixed(6);
  const ln = Number(lng).toFixed(6);
  return `https://www.google.com/maps/search/?api=1&query=${la},${ln}`;
}

/** Approximate circle → polygon (for quickly drafting a zone around a point). */
export function circlePolygon(center: LatLng, radiusKm: number, points = 24): LatLng[] {
  const out: LatLng[] = [];
  const latR = radiusKm / 110.574;
  const lngR = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
  for (let i = 0; i < points; i++) {
    const a = (i / points) * 2 * Math.PI;
    out.push({ lat: +(center.lat + latR * Math.sin(a)).toFixed(6), lng: +(center.lng + lngR * Math.cos(a)).toFixed(6) });
  }
  return out;
}

/** Extracts coordinates from "21.42, 39.82" or a Google Maps URL. */
export function parseCoordinates(text: string): LatLng | null {
  const m =
    /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/.exec(text) ||
    /[?&](?:q|query|ll)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/.exec(text) ||
    /(-?\d{1,2}\.\d{3,})\s*[,،\s]\s*(-?\d{1,3}\.\d{3,})/.exec(text);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

