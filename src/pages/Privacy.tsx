import { useStore } from '../context/StoreContext';
import { useSeo } from '../lib/seo';

export default function Privacy() {
  const { settings } = useStore();
  useSeo({ title: 'سياسة الخصوصية' });
  return (
    <div className="container-x max-w-3xl py-14 sm:py-20">
      <h1 className="text-3xl font-bold sm:text-4xl">سياسة الخصوصية</h1>
      <p className="mt-3 text-sm text-espresso/50">آخر تحديث: {new Date().getFullYear()}</p>
      {/* OWNER REVIEW REQUIRED: This text is a starting template, not legal advice.
          Review it (ideally with a legal advisor) against the Saudi Personal Data
          Protection Law (PDPL) before launch. */}
      <div className="mt-6 rounded-2xl border border-caramel/40 bg-caramel/10 p-4 text-sm leading-relaxed text-cocoa" role="note">
        ملاحظة لصاحب المتجر: هذا النص مسودة مبدئية ويحتاج مراجعة قبل الإطلاق، ويُفضّل مراجعته مع مختص قانوني بما يتوافق مع نظام حماية البيانات الشخصية في المملكة العربية السعودية.
      </div>
      <div className="mt-10 space-y-8 leading-loose text-espresso/80">
        <section>
          <h2 className="mb-2 text-xl font-semibold">البيانات التي نجمعها</h2>
          <p>عند تقديم طلب، نجمع فقط البيانات اللازمة لتنفيذه: الاسم، رقم الجوال، البريد الإلكتروني، رقم الواتساب (إن اختلف)، اسم الحي، موقع التوصيل على الخريطة (الإحداثيات)، تفاصيل العنوان الاختيارية، وملاحظات الطلب.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold">كيف نستخدم بياناتك</h2>
          <ul className="list-disc space-y-1 pe-5 ps-5">
            <li>تجهيز طلبك وتوصيله إلى الموقع المحدد داخل مكة المكرمة.</li>
            <li>التواصل معك عبر واتساب لتأكيد الطلب وترتيبات الدفع والتوصيل.</li>
            <li>إرسال رسائل بريد إلكتروني متعلقة بطلبك (استلام، تأكيد، توصيل، إلغاء).</li>
          </ul>
          <p className="mt-2">لا نبيع بياناتك ولا نستخدمها لأغراض تسويقية دون موافقتك.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold">حماية البيانات</h2>
          <p>تُحفظ بيانات الطلبات في قاعدة بيانات محمية، ولا يطّلع عليها إلا المسؤولون المخوّلون عن المتجر. يتم الدفع وترتيباته عبر واتساب، ولا نجمع بيانات بطاقات الدفع عبر الموقع.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold">مزودو الخدمة</h2>
          <p>نستخدم مزودي خدمات تقنية لتشغيل المتجر: استضافة الموقع، قاعدة البيانات، خدمة إرسال البريد الإلكتروني، وخرائط Google لتحديد موقع التوصيل. تتم معالجة البيانات لدى هؤلاء المزودين بالقدر اللازم لتقديم الخدمة.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold">حقوقك</h2>
          <p>يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها، بما لا يتعارض مع متطلبات حفظ السجلات النظامية. للتواصل: واتساب <span className="ltr">{settings.phone}</span>{settings.contact_email && <> أو البريد <span className="ltr">{settings.contact_email}</span></>}.</p>
        </section>
      </div>
    </div>
  );
}
