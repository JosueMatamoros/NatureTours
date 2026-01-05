import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/checkout",
    element: <Checkout />,
  },
  {
    path: "/success",
    element: <Success />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
