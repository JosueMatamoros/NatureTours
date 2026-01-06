import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Tours", to: "/tours" },
  { label: "Experiences", to: "/experiences" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // Cierra el menú si pasas a pantalla grande
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="absolute inset-x-0 top-2 z-50">
      <div className="mx-auto w-[min(1100px,92%)]">
        <nav
          className={[
            "flex items-center justify-between gap-3",
            "h-16 overflow-hidden",
            "rounded-2xl border border-white/10",
            "backdrop-blur-xl",
            "px-4 shadow-lg shadow-black/20",
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
          <div className="hidden items-center gap-2 md:flex">
            {LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-xl px-3 py-2 text-sm",
                    isActive ? "text-white bg-white/10" : "text-white/70 hover:text-white/90",
                    "hover:bg-white/5 transition",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* CTA */}
            <NavLink
              to="/plan"
              className={({ isActive }) =>
                [
                  "hidden md:inline-flex items-center justify-center",
                  "rounded-xl px-4 py-2 text-sm font-semibold",
                  isActive ? "bg-emerald-800 text-white" : "bg-emerald-700 text-white",
                  "hover:bg-emerald-800 transition",
                  "shadow-md shadow-emerald-700/30",
                ].join(" ")
              }
            >
              Plan Your Trip
            </NavLink>

            {/* Mobile button */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={[
                "md:hidden inline-flex items-center justify-center",
                "h-10 w-10 rounded-xl",
                "bg-white/5 hover:bg-white/10 transition",
                "ring-1 ring-white/10",
                "text-white/80",
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
              "rounded-2xl border border-white/10",
              "bg-emerald-950/55 backdrop-blur-xl",
              "p-3 shadow-lg shadow-black/20",
            ].join(" ")}
          >
            <div className="grid gap-1">
              {LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "rounded-xl px-3 py-2 text-sm",
                      isActive ? "text-white bg-white/10" : "text-white/75 hover:text-white/95",
                      "hover:bg-white/5 transition",
                    ].join(" ")
                  }
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}

              <NavLink
                to="/plan"
                className={[
                  "mt-2 inline-flex items-center justify-center",
                  "rounded-xl px-4 py-2 text-sm font-semibold",
                  "bg-emerald-400/90 text-emerald-950",
                  "hover:bg-emerald-300 transition",
                  "shadow-md shadow-emerald-400/20",
                ].join(" ")}
                onClick={() => setOpen(false)}
              >
                Plan Your Trip
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
