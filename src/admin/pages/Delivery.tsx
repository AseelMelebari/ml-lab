/// <reference types="google.maps" />
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Plus, Pencil, Trash2, MapPinned, Clock, CalendarX, Power, Undo2, Eraser, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData, must } from '../useData';
import { PageHeader, Panel, Modal, Toggle, Empty, MoneyInput } from '../ui';
import { PageLoader, Spinner } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { loadGoogleMaps, mapsConfigured } from '../../lib/maps';
import { formatSAR } from '../../../shared/money';
import { formatDateAr, formatTimeAr, riyadhToday } from '../../../shared/dates';
import { errorMessageAr } from '../../../shared/labels';
import { MAKKAH_BOUNDS, MAKKAH_CENTER, circlePolygon, inMakkahBounds, type LatLng } from '../../../shared/geo';
import type { DeliverySlot, DeliveryZone, StoreSettings } from '../../lib/types';

const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function ZoneMap({ polygon, onChange, others }: { polygon: LatLng[]; onChange: (p: LatLng[]) => void; others: DeliveryZone[] }) {
  const el = useRef<HTMLDivElement>(null);
  const polyRef = useRef<google.maps.Polygon | null>(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const [ready, setReady] = useState(false);
  const syncing = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(async () => {
      if (cancelled || !el.current) return;
      const { Map, Polygon } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
      const center = polygon[0] ?? MAKKAH_CENTER;
      const map = new Map(el.current, { center, zoom: polygon.length ? 14 : 12, gestureHandling: 'greedy', clickableIcons: false, streetViewControl: false, mapTypeControl: false, restriction: { latLngBounds: MAKKAH_BOUNDS, strictBounds: false } });
      others.forEach((z) => new Polygon({ map, paths: z.polygon, strokeColor: '#8A6E5C', strokeOpacity: 0.5, strokeWeight: 1, fillColor: '#8A6E5C', fillOpacity: 0.08, clickable: false }));
      const poly = new Polygon({ map, paths: polygon, editable: true, strokeColor: '#60351F', strokeWeight: 2, fillColor: '#BC8965', fillOpacity: 0.25 });
      polyRef.current = poly;
      if (polygon.length > 2) {
        const b = new google.maps.LatLngBounds();
        polygon.forEach((p) => b.extend(p));
        map.fitBounds(b, 40);
      }
      const emit = () => {
        if (syncing.current) return;
        const path = poly.getPath().getArray().map((ll) => ({ lat: +ll.lat().toFixed(6), lng: +ll.lng().toFixed(6) }));
        changeRef.current(path);
      };
      const bindPath = () => {
        const path = poly.getPath();
        ['set_at', 'insert_at', 'remove_at'].forEach((ev) => path.addListener(ev, emit));
      };
      bindPath();
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) poly.getPath().push(e.latLng);
      });
      poly.addListener('rightclick', (e: google.maps.PolyMouseEvent) => {
        if (e.vertex != null) poly.getPath().removeAt(e.vertex);
      });
      setReady(true);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External changes (clear / undo / circle helper) → redraw
  useEffect(() => {
    const poly = polyRef.current;
    if (!poly) return;
    const current = poly.getPath().getArray().map((ll) => `${ll.lat().toFixed(6)},${ll.lng().toFixed(6)}`).join('|');
    const next = polygon.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|');
    if (current === next) return;
    syncing.current = true;
    poly.setPath(polygon);
    const path = poly.getPath();
    ['set_at', 'insert_at', 'remove_at'].forEach((ev) =>
      path.addListener(ev, () => changeRef.current(path.getArray().map((ll) => ({ lat: +ll.lat().toFixed(6), lng: +ll.lng().toFixed(6) })))),
    );
    syncing.current = false;
  }, [polygon]);

  return (
    <div className="relative h-80 overflow-hidden rounded-2xl border border-cocoa/10 bg-cream-200 sm:h-96">
      <div ref={el} className="absolute inset-0" />
      {!ready && <div className="absolute inset-0 grid place-items-center"><Spinner className="h-6 w-6 text-cocoa" /></div>}
    </div>
  );
}

function ZoneEditor({ zone, others, onClose, onSaved }: { zone: Partial<DeliveryZone>; others: DeliveryZone[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [z, setZ] = useState<Partial<DeliveryZone>>({ polygon: [], fee_halalas: 0, min_order_halalas: 0, is_active: false, sort_order: 0, ...zone });
  const [json, setJson] = useState(JSON.stringify(zone.polygon ?? []));
  const [circle, setCircle] = useState({ lat: String(MAKKAH_CENTER.lat), lng: String(MAKKAH_CENTER.lng), km: '3' });
  const [saving, setSaving] = useState(false);
  const poly = z.polygon ?? [];
  const setPoly = (p: LatLng[]) => {
    setZ((x) => ({ ...x, polygon: p }));
    setJson(JSON.stringify(p));
  };

  const save = async () => {
    if (!z.name_ar?.trim()) return toast('error', 'اسم المنطقة مطلوب');
    if (poly.length < 3) return toast('error', 'حدد 3 نقاط على الأقل لحدود المنطقة');
    if (poly.some((p) => !inMakkahBounds(p))) return toast('error', 'لا يمكن أن تمتد المنطقة خارج مكة المكرمة');
    setSaving(true);
    const row = { name_ar: z.name_ar.trim(), polygon: poly, fee_halalas: z.fee_halalas ?? 0, min_order_halalas: z.min_order_halalas ?? 0, is_active: !!z.is_active, sort_order: z.sort_order ?? 0, notes: z.notes || null };
    const { error } = z.id ? await supabase.from('delivery_zones').update(row).eq('id', z.id) : await supabase.from('delivery_zones').insert(row);
    setSaving(false);
    if (error) return toast('error', errorMessageAr(error.message, error.message));
    toast('success', 'تم حفظ المنطقة');
    onSaved();
  };

  return (
    <Modal wide open onClose={onClose} title={z.id ? 'تعديل منطقة التوصيل' : 'منطقة توصيل جديدة'} footer={<><button onClick={onClose} className="btn-ghost btn-sm">إلغاء</button><button onClick={save} disabled={saving} className="btn-primary btn-sm">{saving && <Spinner className="h-4 w-4" />} حفظ</button></>}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">اسم المنطقة / الحي *</label><input className="input" value={z.name_ar ?? ''} onChange={(e) => setZ({ ...z, name_ar: e.target.value })} placeholder="مثال: العزيزية" /></div>
          <div><label className="label">رسوم التوصيل</label><MoneyInput value={z.fee_halalas ?? 0} onChange={(h) => setZ({ ...z, fee_halalas: h ?? 0 })} /></div>
          <div><label className="label">الحد الأدنى للطلب في هذه المنطقة</label><MoneyInput value={z.min_order_halalas ?? 0} onChange={(h) => setZ({ ...z, min_order_halalas: h ?? 0 })} /></div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="label mb-0">حدود المنطقة ({poly.length} نقاط)</label>
            <div className="flex gap-1">
              <button type="button" onClick={() => setPoly(poly.slice(0, -1))} disabled={!poly.length} className="btn-ghost btn-sm"><Undo2 className="h-4 w-4" /> تراجع</button>
              <button type="button" onClick={() => setPoly([])} disabled={!poly.length} className="btn-ghost btn-sm"><Eraser className="h-4 w-4" /> مسح</button>
            </div>
          </div>
          {mapsConfigured ? (
            <>
              <ZoneMap polygon={poly} onChange={setPoly} others={others.filter((o) => o.id !== z.id)} />
              <p className="hint">اضغط على الخريطة لإضافة نقاط حول المنطقة. اسحب النقاط لتعديلها، وكليك يمين على نقطة لحذفها.</p>
            </>
          ) : (
            <p className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900">خرائط Google غير مهيأة — استخدم أداة الدائرة أدناه أو الصق الإحداثيات.</p>
          )}
        </div>

        <details className="rounded-2xl border border-cocoa/10 p-4">
          <summary className="cursor-pointer text-sm font-medium">أدوات متقدمة: دائرة حول نقطة / إحداثيات</summary>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <input dir="ltr" className="input py-2 text-sm" value={circle.lat} onChange={(e) => setCircle({ ...circle, lat: e.target.value })} aria-label="خط العرض" />
            <input dir="ltr" className="input py-2 text-sm" value={circle.lng} onChange={(e) => setCircle({ ...circle, lng: e.target.value })} aria-label="خط الطول" />
            <input dir="ltr" className="input py-2 text-sm" value={circle.km} onChange={(e) => setCircle({ ...circle, km: e.target.value })} aria-label="نصف القطر كم" />
          </div>
          <button type="button" className="btn-secondary btn-sm mt-2" onClick={() => setPoly(circlePolygon({ lat: +circle.lat, lng: +circle.lng }, +circle.km || 1))}>إنشاء دائرة (خط العرض، خط الطول، نصف القطر بالكم)</button>
          <label className="label mt-4 text-xs">الإحداثيات (JSON)</label>
          <textarea dir="ltr" rows={3} className="input font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} onBlur={() => { try { const p = JSON.parse(json); if (Array.isArray(p)) setZ((x) => ({ ...x, polygon: p })); } catch { toast('error', 'صيغة JSON غير صحيحة'); } }} />
        </details>

        <div><label className="label">ملاحظات داخلية</label><input className="input" value={z.notes ?? ''} onChange={(e) => setZ({ ...z, notes: e.target.value })} /></div>
        <Toggle label="المنطقة مفعّلة" description="فقط المناطق المفعّلة تقبل الطلبات" checked={!!z.is_active} onChange={(v) => setZ({ ...z, is_active: v })} />
      </div>
    </Modal>
  );
}

function SlotEditor({ slot, onClose, onSaved }: { slot: Partial<DeliverySlot>; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [s, setS] = useState<Partial<DeliverySlot>>({ weekdays: [0, 1, 2, 3, 4, 6], start_time: '16:00', end_time: '20:00', capacity: null, is_active: true, sort_order: 0, ...slot });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!s.label_ar?.trim()) return toast('error', 'اسم الفترة مطلوب');
    if (!s.weekdays?.length) return toast('error', 'اختر يومًا واحدًا على الأقل');
    if ((s.end_time ?? '') <= (s.start_time ?? '')) return toast('error', 'وقت النهاية يجب أن يكون بعد البداية');
    setSaving(true);
    const row = { label_ar: s.label_ar.trim(), weekdays: s.weekdays, start_time: s.start_time, end_time: s.end_time, capacity: s.capacity, is_active: s.is_active, sort_order: s.sort_order ?? 0 };
    const { error } = s.id ? await supabase.from('delivery_slots').update(row).eq('id', s.id) : await supabase.from('delivery_slots').insert(row);
    setSaving(false);
    if (error) return toast('error', 'تعذر الحفظ');
    onSaved();
  };
  return (
    <Modal open onClose={onClose} title={s.id ? 'تعديل فترة التوصيل' : 'فترة توصيل جديدة'} footer={<><button onClick={onClose} className="btn-ghost btn-sm">إلغاء</button><button onClick={save} disabled={saving} className="btn-primary btn-sm">{saving && <Spinner className="h-4 w-4" />} حفظ</button></>}>
      <div className="space-y-4">
        <div><label className="label">اسم الفترة *</label><input className="input" value={s.label_ar ?? ''} onChange={(e) => setS({ ...s, label_ar: e.target.value })} placeholder="مثال: فترة العصر" /></div>
        <div>
          <label className="label">الأيام</label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d, i) => {
              const on = s.weekdays?.includes(i);
              return <button type="button" key={i} onClick={() => setS({ ...s, weekdays: on ? s.weekdays!.filter((x) => x !== i) : [...(s.weekdays ?? []), i].sort() })} className={clsx('rounded-full border px-3 py-1.5 text-sm', on ? 'border-cocoa bg-cocoa text-white' : 'border-cocoa/15')}>{d}</button>;
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">من (توقيت مكة)</label><input type="time" className="input" value={s.start_time?.slice(0, 5)} onChange={(e) => setS({ ...s, start_time: e.target.value })} /></div>
          <div><label className="label">إلى</label><input type="time" className="input" value={s.end_time?.slice(0, 5)} onChange={(e) => setS({ ...s, end_time: e.target.value })} /></div>
        </div>
        <div><label className="label">أقصى عدد طلبات لهذه الفترة في اليوم</label><input type="number" min={0} className="input" placeholder="غير محدود" value={s.capacity ?? ''} onChange={(e) => setS({ ...s, capacity: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0) })} /></div>
        <Toggle label="الفترة مفعّلة" checked={!!s.is_active} onChange={(v) => setS({ ...s, is_active: v })} />
      </div>
    </Modal>
  );
}

export default function Delivery() {
  const toast = useToast();
  const { data, loading, reload } = useData(async () => {
    const [z, s, d, st] = await Promise.all([
      supabase.from('delivery_zones').select('*').order('sort_order').order('created_at'),
      supabase.from('delivery_slots').select('*').order('start_time'),
      supabase.from('unavailable_dates').select('*').gte('date', riyadhToday()).order('date'),
      supabase.from('store_settings').select('*').single(),
    ]);
    return { zones: must(z) as DeliveryZone[], slots: must(s) as DeliverySlot[], dates: must(d) as { id: string; date: string; reason: string | null }[], settings: must(st) as StoreSettings };
  });
  const [zoneEdit, setZoneEdit] = useState<Partial<DeliveryZone> | null>(null);
  const [slotEdit, setSlotEdit] = useState<Partial<DeliverySlot> | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [ops, setOps] = useState<Partial<StoreSettings> | null>(null);

  if (loading && !data) return <PageLoader />;
  if (!data) return null;
  const o = { ...data.settings, ...ops };

  const saveOps = async () => {
    const { error } = await supabase.from('store_settings').update({
      accepting_orders: o.accepting_orders, closure_message: o.closure_message, lead_time_hours: o.lead_time_hours, booking_window_days: o.booking_window_days, max_orders_per_day: o.max_orders_per_day,
    }).eq('id', true);
    if (error) return toast('error', 'تعذر الحفظ');
    toast('success', 'تم حفظ إعدادات الطلب');
    setOps(null);
    reload();
  };
  const toggleZone = async (z: DeliveryZone) => {
    const { error } = await supabase.from('delivery_zones').update({ is_active: !z.is_active }).eq('id', z.id);
    if (error) toast('error', 'تعذر التحديث');
    reload();
  };

  return (
    <div>
      <PageHeader title="إدارة التوصيل" subtitle="التوصيل داخل مكة المكرمة فقط — فقط المناطق المعتمدة تقبل الطلبات" />

      <Panel className="mb-6" title={<span className="flex items-center gap-2"><Power className="h-4 w-4 text-caramel" /> استقبال الطلبات والجدولة</span>} actions={ops && <button onClick={saveOps} className="btn-primary btn-sm"><Save className="h-4 w-4" /> حفظ</button>}>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <Toggle label="استقبال الطلبات مفتوح" description="أوقفه مؤقتًا لإيقاف الطلبات الجديدة (إجازة، ضغط…)" checked={o.accepting_orders} onChange={(v) => setOps({ ...ops, accepting_orders: v })} />
            <div><label className="label text-xs">رسالة الإيقاف للعملاء</label><input className="input" value={o.closure_message} onChange={(e) => setOps({ ...ops, closure_message: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label text-xs">أقل مدة قبل التسليم (ساعة)</label><input type="number" min={1} max={720} className="input" value={o.lead_time_hours} onChange={(e) => setOps({ ...ops, lead_time_hours: Math.max(1, parseInt(e.target.value) || 24) })} /></div>
            <div><label className="label text-xs">أقصى حجز مسبق (يوم)</label><input type="number" min={1} max={120} className="input" value={o.booking_window_days} onChange={(e) => setOps({ ...ops, booking_window_days: Math.max(1, parseInt(e.target.value) || 21) })} /></div>
            <div><label className="label text-xs">أقصى طلبات باليوم</label><input type="number" min={0} className="input" placeholder="غير محدود" value={o.max_orders_per_day ?? ''} onChange={(e) => setOps({ ...ops, max_orders_per_day: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0) })} /></div>
          </div>
        </div>
        {o.lead_time_hours !== 24 && <p className="mt-3 text-xs text-amber-800">تنبيه: النصوص التسويقية في الإعلانات تذكر 24 ساعة — حدّثها من إعدادات المتجر إذا غيّرت المدة.</p>}
      </Panel>

      <Panel className="mb-6" title={<span className="flex items-center gap-2"><MapPinned className="h-4 w-4 text-caramel" /> مناطق التوصيل</span>} padded={false} actions={<button onClick={() => setZoneEdit({ sort_order: data.zones.length * 10 })} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> منطقة جديدة</button>}>
        {!data.zones.length ? (
          <Empty>لا توجد مناطق. أضف منطقة وفعّلها حتى يتمكن العملاء من الطلب.</Empty>
        ) : (
          <table className="table-admin">
            <thead><tr><th>المنطقة</th><th>الرسوم</th><th>الحد الأدنى</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              {data.zones.map((z) => (
                <tr key={z.id}>
                  <td className="font-medium">{z.name_ar}<div className="text-xs text-espresso/45">{z.polygon.length} نقاط{z.notes && ` · ${z.notes}`}</div></td>
                  <td>{formatSAR(z.fee_halalas)}</td>
                  <td>{z.min_order_halalas ? formatSAR(z.min_order_halalas) : '—'}</td>
                  <td><button onClick={() => toggleZone(z)} className={clsx('chip', z.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-600')}>{z.is_active ? 'مفعّلة' : 'متوقفة'}</button></td>
                  <td className="whitespace-nowrap">
                    <button onClick={() => setZoneEdit(z)} className="inline-grid h-8 w-8 place-items-center rounded-full hover:bg-cream-200" aria-label="تعديل"><Pencil className="h-4 w-4" /></button>
                    <button onClick={async () => { if (window.confirm('حذف المنطقة؟ الطلبات السابقة تحتفظ باسم المنطقة.')) { await supabase.from('delivery_zones').delete().eq('id', z.id); reload(); } }} className="inline-grid h-8 w-8 place-items-center rounded-full text-red-700/70 hover:bg-red-50" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={<span className="flex items-center gap-2"><Clock className="h-4 w-4 text-caramel" /> فترات التوصيل</span>} padded={false} actions={<button onClick={() => setSlotEdit({})} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> فترة</button>}>
          {!data.slots.length ? <Empty>لا توجد فترات توصيل.</Empty> : (
            <ul className="divide-y divide-cocoa/5">
              {data.slots.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.label_ar} <span className="text-sm font-normal text-espresso/55">{formatTimeAr(s.start_time)} – {formatTimeAr(s.end_time)}</span></p>
                    <p className="text-xs text-espresso/50">{s.weekdays.map((d) => WEEKDAYS[d]).join('، ')} · {s.capacity == null ? 'بدون حد' : `حد ${s.capacity} طلب`}</p>
                  </div>
                  <span className={clsx('chip', s.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-600')}>{s.is_active ? 'مفعّلة' : 'متوقفة'}</span>
                  <button onClick={() => setSlotEdit(s)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-cream-200" aria-label="تعديل"><Pencil className="h-4 w-4" /></button>
                  <button onClick={async () => { if (window.confirm('حذف الفترة؟')) { await supabase.from('delivery_slots').delete().eq('id', s.id); reload(); } }} className="grid h-8 w-8 place-items-center rounded-full text-red-700/70 hover:bg-red-50" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={<span className="flex items-center gap-2"><CalendarX className="h-4 w-4 text-caramel" /> أيام غير متاحة (إجازات)</span>}>
          <form
            className="mb-4 flex flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newDate) return;
              const { error } = await supabase.from('unavailable_dates').insert({ date: newDate, reason: newReason || null });
              if (error) toast('error', error.message.includes('duplicate') ? 'التاريخ موجود مسبقًا' : 'تعذر الإضافة');
              setNewDate('');
              setNewReason('');
              reload();
            }}
          >
            <input type="date" min={riyadhToday()} className="input w-auto py-2.5" value={newDate} onChange={(e) => setNewDate(e.target.value)} aria-label="التاريخ" required />
            <input className="input min-w-[120px] flex-1 py-2.5" value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="السبب (اختياري)" aria-label="السبب" />
            <button className="btn-primary btn-sm"><Plus className="h-4 w-4" /> إضافة</button>
          </form>
          {!data.dates.length ? <p className="text-sm text-espresso/50">لا توجد أيام محجوبة قادمة.</p> : (
            <ul className="space-y-2">
              {data.dates.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-2xl bg-cream-100 px-4 py-2.5 text-sm">
                  <span><strong>{formatDateAr(d.date, { year: true })}</strong>{d.reason && <span className="text-espresso/55"> — {d.reason}</span>}</span>
                  <button onClick={async () => { await supabase.from('unavailable_dates').delete().eq('id', d.id); reload(); }} className="text-espresso/40 hover:text-red-700" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {zoneEdit && <ZoneEditor zone={zoneEdit} others={data.zones} onClose={() => setZoneEdit(null)} onSaved={() => { setZoneEdit(null); reload(); }} />}
      {slotEdit && <SlotEditor slot={slotEdit} onClose={() => setSlotEdit(null)} onSaved={() => { setSlotEdit(null); reload(); toast('success', 'تم الحفظ'); }} />}
    </div>
  );
}
