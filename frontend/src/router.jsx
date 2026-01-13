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
import SelecTour from "./pages/SelecTourPage";
import PaymentPage from "./pages/PaymentPage";
import AboutUs from "./pages/AboutUs";

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
        path: "/SelecTour",
        element: <SelecTour />,
      },
      {
        path: "/success/:paymentId",
        element: <Success />,
      },
      {
        path: "/about",
        element: <AboutUs />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
