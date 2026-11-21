import { Link } from 'react-router-dom';
import { Heart, Coffee, Users } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../lib/seo';
import { Cookie } from '../components/CookieArt';

export default function About() {
  const { settings } = useStore();
  useSeo({ title: 'عن دفوة', description: 'حكاية دفوة — كوكيز طازج يُخبز بحب في مكة المكرمة، ليكون جزءًا من لحظاتكم الحلوة وجمعاتكم.' });
  const paragraphs = settings.brand_story.split('\n').filter(Boolean);
  return (
    <div>
      <section className="relative overflow-hidden bg-cream-200">
        <div className="grain absolute inset-0" aria-hidden="true" />
        <Cookie className="absolute -left-12 -top-8 w-56 opacity-30" seed={1} tone="golden" />
        <Cookie className="absolute -bottom-16 -right-10 w-64 opacity-25" seed={6} tone="cocoa" />
        <div className="container-x relative py-20 text-center sm:py-28">
          <p className="eyebrow mb-3">About DAFWA</p>
          <h1 className="text-4xl font-bold sm:text-6xl">عن دفوة</h1>
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-espresso/65">{settings.hero_title}</p>
        </div>
      </section>
      <section className="container-x max-w-3xl py-20">
        <div className="space-y-6 font-display text-xl font-light leading-[2.2] text-espresso/85 sm:text-2xl sm:leading-[2.2]">
          {paragraphs.map((p, i) => <p key={i} className={i === 1 ? 'font-medium text-cocoa' : ''}>{p}</p>)}
        </div>
      </section>
      <section className="container-x grid gap-5 pb-10 sm:grid-cols-3">
        {[
          [Heart, 'حب التفاصيل', 'من ريحة الخَبز لآخر قطعة في العلبة.'],
          [Coffee, 'رفيق قهوتك', 'قطعة كوكيز تكمّل فنجان القهوة.'],
          [Users, 'لمّة الناس', 'نطمح نكون جزء من جمعتكم الحلوة.'],
        ].map(([Icon, t, d], i) => {
          const I = Icon as typeof Heart;
          return (
            <div key={i} className="card p-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cream-200 text-cocoa"><I className="h-6 w-6" /></span>
              <h3 className="mt-5 text-lg font-semibold">{t as string}</h3>
              <p className="mt-2 text-sm leading-relaxed text-espresso/60">{d as string}</p>
            </div>
          );
        })}
      </section>
      <div className="py-10 text-center">
        <Link to="/shop" className="btn-primary px-8 py-4 text-base">تسوق الآن</Link>
      </div>
    </div>
  );
}
