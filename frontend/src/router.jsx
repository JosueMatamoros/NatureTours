import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Outlet,
  ScrollRestoration,
} from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import AdminGuard from "./router/AdminGuard";

import Home from "./pages/HomePage";
import NotFound from "./pages/NotFound";

const Checkout = lazy(() => import("./pages/Checkout"));
const Success = lazy(() => import("./pages/Success"));
const SelecTour = lazy(() => import("./pages/SelecTourPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ToursPage = lazy(() => import("./pages/ToursPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ReservacionesPage = lazy(() => import("./pages/ReservacionesPage"));
const CabalgatasPage = lazy(() => import("./pages/CabalgatasPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
    </div>
  );
}

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function RootLayout() {
  return (
    <>
      <ScrollRestoration getKey={(location) => location.pathname} />
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Home /> },

      {
        path: "/checkout",
        element: (
          <LazyPage>
            <Checkout />
          </LazyPage>
        ),
      },
      {
        path: "/payment/:bookingId",
        element: (
          <LazyPage>
            <PaymentPage />
          </LazyPage>
        ),
      },
      {
        path: "/SelecTour",
        element: (
          <LazyPage>
            <SelecTour />
          </LazyPage>
        ),
      },
      {
        path: "/success/:paymentId",
        element: (
          <LazyPage>
            <Success />
          </LazyPage>
        ),
      },
      {
        path: "/about",
        element: (
          <LazyPage>
            <AboutUs />
          </LazyPage>
        ),
      },
      {
        path: "/contact",
        element: (
          <LazyPage>
            <ContactPage />
          </LazyPage>
        ),
      },
      {
        path: "/services",
        element: (
          <LazyPage>
            <ServicesPage />
          </LazyPage>
        ),
      },
      {
        path: "/tours",
        element: (
          <LazyPage>
            <ToursPage />
          </LazyPage>
        ),
      },

      {
        path: "/login",
        element: (
          <LazyPage>
            <LoginPage />
          </LazyPage>
        ),
      },

      {
        element: <AdminGuard />,
        children: [
          {
            path: "/matamoros",
            element: (
              <LazyPage>
                <AdminPage />
              </LazyPage>
            ),
          },
          {
            path: "/matamoros/reservaciones",
            element: (
              <LazyPage>
                <ReservacionesPage />
              </LazyPage>
            ),
          },
          {
            path: "/matamoros/cabalgatas",
            element: (
              <LazyPage>
                <CabalgatasPage />
              </LazyPage>
            ),
          },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;
