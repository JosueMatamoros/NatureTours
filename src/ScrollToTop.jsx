import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function  ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // si "instant" te da error en algunos browsers, cambialo por "auto"
  }, [pathname]);

  return null;
}

export default ScrollToTop;
