import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Tours", to: "/tours" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Services", to: "/services" },
];

export default function Navbar({ variant = "overlay" }) {
  const [open, setOpen] = useState(false);
  const isOverlay = variant === "overlay";

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={[
        "z-50",
        isOverlay ? "absolute inset-x-0 top-2" : "relative pt-2",
      ].join(" ")}
    >
      <div className="mx-auto w-[min(1100px,92%)]">
        <nav
          className={[
            "relative flex items-center justify-between gap-3",
            "h-16 overflow-hidden",
            "rounded-2xl px-4",
            "backdrop-blur-xl",
            "transition-colors duration-300",
            isOverlay
              ? [
                  "border border-white/10",
                  "bg-transparent",
                  "shadow-lg shadow-black/20",
                ].join(" ")
              : [
                  "border border-gray-200",
                  "bg-white/80",
                  "shadow-lg shadow-black/10",
                ].join(" "),
          ].join(" ")}
        >
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="La Fortuna Nature Tours logo"
              className="h-15 w-15"
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2">
            {LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => {
                  // Overlay: NO mostrar estado activo, solo hover
                  if (isOverlay) {
                    return [
                      "rounded-xl px-3 py-2 text-sm transition",
                      "text-white/80 hover:text-white hover:bg-white/10",
                    ].join(" ");
                  }

                  // Normal: sí mostrar estado activo
                  return [
                    "rounded-xl px-3 py-2 text-sm transition",
                    isActive
                      ? "text-gray-900 bg-gray-100"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  ].join(" ");
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* CTA */}
            <NavLink
              to="/SelecTour"
              className={[
                "hidden md:inline-flex items-center justify-center",
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                // Paleta emerald como en TourCard
                isOverlay
                  ? "bg-emerald-700 text-white hover:bg-emerald-800 shadow-md shadow-emerald-700/30"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/30",
              ].join(" ")}
            >
              Make a Reservation
            </NavLink>

            {/* Mobile button */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={[
                "md:hidden inline-flex items-center justify-center",
                "h-10 w-10 rounded-xl transition ring-1",
                isOverlay
                  ? "bg-white/5 hover:bg-white/10 ring-white/10 text-white/80"
                  : "bg-gray-100 hover:bg-gray-200 ring-gray-200 text-gray-700",
              ].join(" ")}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? (
                // X
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                // Hamburger
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 7h14M5 12h14M5 17h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div
            className={[
              "mt-3 md:hidden",
              "rounded-2xl border backdrop-blur-xl p-3 shadow-lg",
              isOverlay
                ? "border-white/10 bg-gray-900/5 shadow-black/20"
                : "border-gray-200 bg-white/90 shadow-black/10",
            ].join(" ")}
          >
            <div className="grid gap-1">
              {LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => {
                    // Overlay: NO mostrar activo, solo hover
                    if (isOverlay) {
                      return [
                        "rounded-xl px-3 py-2 text-sm transition",
                        "text-white/80 hover:text-white hover:bg-white/10",
                      ].join(" ");
                    }

                    // Normal: sí mostrar activo
                    return [
                      "rounded-xl px-3 py-2 text-sm transition",
                      isActive
                        ? "text-gray-900 bg-gray-100"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                    ].join(" ");
                  }}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}

              <NavLink
                to="/SelecTour"
                className={[
                  "mt-2 inline-flex items-center justify-center",
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  // Paleta emerald como en TourCard
                  isOverlay
                    ? "bg-emerald-400/90 text-emerald-950 hover:bg-emerald-300 shadow-md shadow-emerald-400/20"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20",
                ].join(" ")}
                onClick={() => setOpen(false)}
              >
                Make a Reservation
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
