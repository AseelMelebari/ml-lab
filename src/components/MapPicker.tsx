/// <reference types="google.maps" />
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Crosshair, MapPin, X, CheckCircle2, AlertCircle, Search, LocateFixed, ExternalLink } from 'lucide-react';
import { loadGoogleMaps, mapsConfigured } from '../lib/maps';
import type { DeliveryZone } from '../lib/types';
import { MAKKAH_BOUNDS, MAKKAH_CENTER, googleMapsLink, parseCoordinates, pointInPolygon, type LatLng } from '../../shared/geo';
import { Spinner } from './ui';

export function zoneFor(p: LatLng | null, zones: DeliveryZone[]): DeliveryZone | null {
  if (!p) return null;
  return zones.find((z) => pointInPolygon(p, z.polygon)) ?? null;
}

function geolocate(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  });
}

function ZoneStatus({ point, zones }: { point: LatLng | null; zones: DeliveryZone[] }) {
  if (!point) return null;
  const z = zoneFor(point, zones);
  return z ? (
    <p className="flex items-center gap-2 text-sm font-medium text-sage">
      <CheckCircle2 className="h-4 w-4" /> داخل نطاق التوصيل — {z.name_ar}
    </p>
  ) : (
    <p className="flex items-center gap-2 text-sm font-medium text-red-700">
      <AlertCircle className="h-4 w-4" /> هذا الموقع خارج نطاق التوصيل المعتمد داخل مكة
    </p>
  );
}

function MapModal({ initial, zones, onClose, onConfirm }: { initial: LatLng | null; zones: DeliveryZone[]; onClose: () => void; onConfirm: (p: LatLng) => void }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const searchEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [center, setCenter] = useState<LatLng | null>(initial);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    document.body.style.overflow = 'hidden';
    loadGoogleMaps()
      .then(async () => {
        if (cancelled || !mapEl.current) return;
        const { Map, Polygon } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
        const map = new Map(mapEl.current, {
          center: initial ?? MAKKAH_CENTER,
          zoom: initial ? 17 : 13,
          gestureHandling: 'greedy',
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          restriction: { latLngBounds: MAKKAH_BOUNDS, strictBounds: false },
          styles: [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }],
        });
        mapRef.current = map;
        zones.forEach((z) => new Polygon({ map, paths: z.polygon, strokeColor: '#60351F', strokeOpacity: 0.6, strokeWeight: 2, fillColor: '#BC8965', fillOpacity: 0.08, clickable: false }));
        map.addListener('idle', () => {
          const c = map.getCenter();
          if (c) setCenter({ lat: +c.lat().toFixed(6), lng: +c.lng().toFixed(6) });
        });
        setStatus('ready');

        // Address search — requires "Places API (New)". Optional: silently skipped if unavailable.
        try {
          const places = (await google.maps.importLibrary('places')) as any;
          if (places.PlaceAutocompleteElement && searchEl.current && !cancelled) {
            const ac = new places.PlaceAutocompleteElement({
              includedRegionCodes: ['sa'],
              locationRestriction: MAKKAH_BOUNDS,
            });
            ac.setAttribute('placeholder', 'ابحث عن عنوان أو معلم في مكة');
            ac.style.width = '100%';
            searchEl.current.replaceChildren(ac);
            const go = async (place: any) => {
              await place.fetchFields({ fields: ['location'] });
              if (place.location) {
                map.panTo(place.location);
                map.setZoom(17);
              }
            };
            ac.addEventListener('gmp-select', (e: any) => e.placePrediction && go(e.placePrediction.toPlace()));
            ac.addEventListener('gmp-placeselect', (e: any) => e.place && go(e.place));
          }
        } catch {
          /* search optional */
        }
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = async () => {
    setLocating(true);
    setGeoError(null);
    try {
      const p = await geolocate();
      mapRef.current?.panTo(p);
      mapRef.current?.setZoom(17);
    } catch {
      setGeoError('تعذر الوصول لموقعك. تأكد من السماح للمتصفح بالوصول للموقع، أو حرّك الخريطة يدويًا.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-offwhite sm:items-center sm:justify-center sm:bg-espresso/50 sm:p-6 sm:backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="تحديد موقع التوصيل">
      <div className="flex h-full w-full flex-col overflow-hidden bg-offwhite sm:h-[86vh] sm:max-w-3xl sm:rounded-4xl sm:shadow-lift">
        <div className="flex items-center gap-3 border-b border-cocoa/10 px-4 py-3">
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-cocoa/5" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">حدد موقع التوصيل</h2>
            <p className="truncate text-xs text-espresso/55">حرّك الخريطة حتى يكون الدبوس على باب بيتك</p>
          </div>
        </div>
        <div className="border-b border-cocoa/10 px-4 py-3">
          <div ref={searchEl} className="dafwa-search min-h-[44px]">
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-cocoa/15 bg-white px-3 text-sm text-espresso/40">
              <Search className="h-4 w-4" /> البحث عن عنوان (يتطلب تفعيل خدمة البحث)
            </div>
          </div>
        </div>
        <div className="relative flex-1">
          <div ref={mapEl} className="absolute inset-0 bg-cream-200" />
          {status === 'loading' && <div className="absolute inset-0 grid place-items-center"><Spinner className="h-7 w-7 text-cocoa" /></div>}
          {status === 'error' && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-espresso/70">تعذر تحميل الخريطة. تحقق من الاتصال وحاول مرة أخرى.</div>
          )}
          {status === 'ready' && (
            <>
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full" aria-hidden="true">
                <MapPin className="h-11 w-11 fill-cocoa text-offwhite drop-shadow-lg" strokeWidth={1.5} />
              </div>
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-espresso/40" aria-hidden="true" />
              <button onClick={useMyLocation} disabled={locating} className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-cocoa shadow-lift transition hover:bg-cream-100">
                {locating ? <Spinner className="h-4 w-4" /> : <LocateFixed className="h-4 w-4" />} موقعي الحالي
              </button>
            </>
          )}
        </div>
        <div className="space-y-3 border-t border-cocoa/10 bg-white px-4 py-4 pb-safe">
          {geoError && <p className="text-sm text-red-700">{geoError}</p>}
          <ZoneStatus point={center} zones={zones} />
          <button disabled={!center || status !== 'ready'} onClick={() => center && onConfirm(center)} className="btn-primary w-full py-4 text-base">
            <CheckCircle2 className="h-5 w-5" /> تأكيد الموقع
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Delivery location field. With a Google Maps key: full-screen map with fixed pin.
 * Without one: current-location + paste-coordinates fallback (still validated server-side).
 */
export function MapPicker({ value, zones, onChange, error }: { value: LatLng | null; zones: DeliveryZone[]; onChange: (p: LatLng | null) => void; error?: string | null }) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const useMyLocation = async () => {
    setLocating(true);
    setManualError(null);
    try {
      onChange(await geolocate());
    } catch {
      setManualError('تعذر الوصول لموقعك. اسمح للمتصفح بالوصول للموقع أو الصق رابط الموقع.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className={clsx('rounded-3xl border p-4', zoneFor(value, zones) ? 'border-sage/40 bg-sage/5' : 'border-red-300 bg-red-50/60')}>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-cocoa shadow-sm"><MapPin className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">تم تحديد الموقع</p>
              <p className="ltr mt-0.5 text-right text-xs text-espresso/55">{value.lat.toFixed(5)}, {value.lng.toFixed(5)}</p>
              <div className="mt-2"><ZoneStatus point={value} zones={zones} /></div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {mapsConfigured && <button type="button" onClick={() => setOpen(true)} className="btn-secondary btn-sm">تعديل الموقع</button>}
            {!mapsConfigured && <button type="button" onClick={() => onChange(null)} className="btn-secondary btn-sm">تغيير الموقع</button>}
            <a href={googleMapsLink(value.lat, value.lng)} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
              <ExternalLink className="h-4 w-4" /> معاينة في خرائط Google
            </a>
          </div>
        </div>
      ) : mapsConfigured ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={clsx('group flex w-full items-center gap-4 rounded-3xl border-2 border-dashed p-5 text-right transition hover:border-cocoa/40 hover:bg-cream-100', error ? 'border-red-300' : 'border-cocoa/20')}
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-cream-200 text-cocoa transition group-hover:bg-cocoa group-hover:text-white"><Crosshair className="h-6 w-6" /></span>
          <span>
            <span className="block font-semibold">حدد موقعك على الخريطة</span>
            <span className="text-sm text-espresso/55">ابحث عن عنوانك، أو استخدم موقعك الحالي، أو حرّك الدبوس</span>
          </span>
        </button>
      ) : (
        <div className={clsx('space-y-3 rounded-3xl border p-4', error ? 'border-red-300' : 'border-cocoa/15')}>
          <button type="button" onClick={useMyLocation} disabled={locating} className="btn-secondary w-full">
            {locating ? <Spinner className="h-4 w-4" /> : <LocateFixed className="h-4 w-4" />} استخدم موقعي الحالي
          </button>
          <div className="flex items-center gap-3 text-xs text-espresso/45"><span className="h-px flex-1 bg-cocoa/10" />أو<span className="h-px flex-1 bg-cocoa/10" /></div>
          <div className="flex gap-2">
            <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="الصق رابط موقعك من خرائط Google" className="input flex-1 text-sm" dir="ltr" aria-label="رابط الموقع أو الإحداثيات" />
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                const p = parseCoordinates(manual);
                if (p) {
                  setManualError(null);
                  onChange(p);
                } else setManualError('ما قدرنا نقرأ الإحداثيات من الرابط. انسخ الإحداثيات مثل: 21.4225, 39.8262');
              }}
            >
              تأكيد
            </button>
          </div>
        </div>
      )}
      {(manualError || error) && <p className="field-error">{manualError || error}</p>}
      {open && (
        <MapModal
          initial={value}
          zones={zones}
          onClose={() => setOpen(false)}
          onConfirm={(p) => {
            onChange(p);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
