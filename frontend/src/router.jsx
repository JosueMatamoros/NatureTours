import {
  createBrowserRouter,
  Outlet,
  ScrollRestoration,
} from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";
import Tours from "./pages/Tours";
import PaymentPage from "./pages/PaymentPage";

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
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/checkout",
        element: <Checkout />,
      },
      {
        path: "/payment/:bookingId",
        element: <PaymentPage />,
      },
      {
        path: "/tours",
        element: <Tours />,
      },
      {
        path: "/success/:paymentId",
        element: <Success />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
