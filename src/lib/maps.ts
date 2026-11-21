/// <reference types="google.maps" />
/**
 * Loads the Google Maps JavaScript API once (dynamic library import bootstrap).
 * Required APIs: "Maps JavaScript API" and (for address search) "Places API (New)".
 */
const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
export const mapsConfigured = Boolean(KEY);

let loading: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (!KEY) return Promise.reject(new Error('MAPS_NOT_CONFIGURED'));
  if (typeof (window as any).google?.maps?.importLibrary === "function") return Promise.resolve(window.google.maps);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const cbName = '__dafwaMapsReady';
    (window as any)[cbName] = () => resolve(window.google.maps);
    const s = document.createElement('script');
    const params = new URLSearchParams({ key: KEY, v: 'weekly', language: 'ar', region: 'SA', loading: 'async', callback: cbName });
    s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    s.async = true;
    s.onerror = () => {
      loading = null;
      reject(new Error('MAPS_LOAD_FAILED'));
    };
    document.head.appendChild(s);
  });
  return loading;
}
