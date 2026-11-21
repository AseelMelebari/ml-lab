import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PageLoader } from './components/ui';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home';

const Shop = lazy(() => import('./pages/Shop'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderReceived = lazy(() => import('./pages/OrderReceived'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const NotFound = lazy(() => import('./pages/NotFound'));
// The admin dashboard is a separate bundle — customers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
            <Route
              path="*"
              element={
                <StoreProvider>
                  <CartProvider>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route element={<Layout />}>
                          <Route index element={<Home />} />
                          <Route path="shop" element={<Shop />} />
                          <Route path="product/:slug" element={<ProductPage />} />
                          <Route path="cart" element={<Cart />} />
                          <Route path="checkout" element={<Checkout />} />
                          <Route path="order/:id" element={<OrderReceived />} />
                          <Route path="about" element={<About />} />
                          <Route path="contact" element={<Contact />} />
                          <Route path="privacy" element={<Privacy />} />
                          <Route path="*" element={<NotFound />} />
                        </Route>
                      </Routes>
                    </Suspense>
                  </CartProvider>
                </StoreProvider>
              }
            />
          </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  );
}
