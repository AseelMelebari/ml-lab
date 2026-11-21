import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';
import { Cookie } from '../components/CookieArt';

export default function NotFound() {
  useSeo({ title: 'الصفحة غير موجودة', noindex: true });
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <Cookie className="w-40 animate-float-slow" seed={8} />
      <h1 className="mt-8 text-3xl font-bold">الصفحة غير موجودة</h1>
      <p className="mt-3 text-espresso/60">يبدو إن هالقطعة انأكلت قبل ما توصل 🍪</p>
      <Link to="/" className="btn-primary mt-8">العودة للرئيسية</Link>
    </div>
  );
}
