import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Solo hacer scroll al top si es una navegación PUSH (ir hacia adelante)
    // No hacer scroll si es POP (botón back/forward del browser)
    if (navigationType === "PUSH" && prevPathname.current !== pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    prevPathname.current = pathname;
  }, [pathname, navigationType]);

  return null;
}

export default ScrollToTop;
