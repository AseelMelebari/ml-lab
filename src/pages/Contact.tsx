import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../lib/seo';
import { WhatsAppIcon, InstagramIcon } from '../components/Icons';
import { whatsappLink } from '../../shared/whatsapp';
import { FaqList } from './Home';
import { SectionHeading } from '../components/ui';

export default function Contact() {
  const { settings } = useStore();
  useSeo({ title: 'تواصل معنا', description: 'تواصل مع دفوة عبر واتساب لطلبات الكوكيز في مكة المكرمة.' });
  const cards = [
    { icon: WhatsAppIcon, title: 'واتساب', value: settings.phone, href: whatsappLink(settings.whatsapp_number, 'السلام عليكم دفوة 🤎'), ltr: true },
    { icon: Phone, title: 'الجوال', value: settings.phone, href: `tel:${settings.phone}`, ltr: true },
    ...(settings.contact_email ? [{ icon: Mail, title: 'البريد الإلكتروني', value: settings.contact_email, href: `mailto:${settings.contact_email}`, ltr: true }] : []),
    ...(settings.instagram_url ? [{ icon: InstagramIcon, title: 'إنستقرام', value: 'تابعنا', href: settings.instagram_url, ltr: false }] : []),
  ];
  return (
    <div>
      <section className="relative overflow-hidden bg-cream-200">
        <div className="grain absolute inset-0" aria-hidden="true" />
        <div className="container-x relative py-16 text-center sm:py-24">
          <p className="eyebrow mb-3">Contact</p>
          <h1 className="text-4xl font-bold sm:text-5xl">تواصل معنا</h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-espresso/65">يسعدنا نسمع منك! أسرع طريقة للتواصل هي واتساب.</p>
        </div>
      </section>
      <section className="container-x -mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <a key={i} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="card group relative flex flex-col items-center p-7 text-center transition hover:-translate-y-1 hover:shadow-lift">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-cream-200 text-cocoa transition group-hover:bg-cocoa group-hover:text-white"><c.icon className="h-6 w-6" /></span>
            <h2 className="mt-4 font-semibold">{c.title}</h2>
            <p className={`mt-1 text-sm text-espresso/60 ${c.ltr ? 'ltr' : ''}`}>{c.value}</p>
          </a>
        ))}
      </section>
      <section className="container-x mt-10 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-3xl bg-cream-100 p-6"><MapPin className="h-6 w-6 shrink-0 text-caramel" /><p>نخدم <strong>مكة المكرمة فقط</strong> — للمناطق المعتمدة في نطاق التوصيل.</p></div>
        <div className="flex items-center gap-4 rounded-3xl bg-cream-100 p-6"><Clock className="h-6 w-6 shrink-0 text-caramel" /><p>الطلب قبل موعد التسليم بـ <strong>{settings.lead_time_hours} ساعة</strong> على الأقل.</p></div>
      </section>
      {settings.faqs.length > 0 && (
        <section className="container-x py-20">
          <SectionHeading eyebrow="FAQ" title="أسئلة شائعة" />
          <FaqList />
        </section>
      )}
    </div>
  );
}
