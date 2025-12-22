import { useEffect, useState } from "react";

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
    <header className="fixed inset-x-0 top-2 z-50">
      <div className="mx-auto w-[min(1100px,92%)]">
        <nav
          className={[
            "flex items-center justify-between gap-3",
            "h-16 overflow-hidden",
            "rounded-2xl border border-white/10",
            "bg-emerald-950/40 backdrop-blur-xl",
            "px-4 shadow-lg shadow-black/20",
          ].join(" ")}
        >
          {/* Brand */}
          <a href="#" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="La Fortuna Nature Tours logo"
              className="h-16 w-16 "
            />
            <span className="text-sm font-semibold tracking-wide text-white/90">
              Pura Vida
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden items-center gap-2 md:flex">
            {[
              "Home",
              "Experiences",
              "Destinations",
              "Itineraries",
              "Sustainability",
              "Contact",
            ].map((item) => (
              <a
                key={item}
                href="#"
                className={[
                  "rounded-xl px-3 py-2 text-sm",
                  "text-white/70 hover:text-white/90",
                  "hover:bg-white/5 transition",
                ].join(" ")}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* CTA */}
            <a
              href="#"
              className={[
                "hidden md:inline-flex items-center justify-center",
                "rounded-xl px-4 py-2 text-sm font-semibold",
                "bg-primary-green text-white",
                "hover:bg-primary-green/90 transition",
                "shadow-md shadow-primary-green/30",
              ].join(" ")}
            >
              Plan Your Trip
            </a>

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
              {[
                "Home",
                "Experiences",
                "Destinations",
                "Itineraries",
                "Sustainability",
                "Contact",
              ].map((item) => (
                <a
                  key={item}
                  href="#"
                  className={[
                    "rounded-xl px-3 py-2 text-sm",
                    "text-white/75 hover:text-white/95",
                    "hover:bg-white/5 transition",
                  ].join(" ")}
                  onClick={() => setOpen(false)}
                >
                  {item}
                </a>
              ))}

              <a
                href="#"
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
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
