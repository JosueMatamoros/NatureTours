import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineLocationMarker } from "react-icons/hi";

const LINKS = [
  { label: "Home",     to: "/" },
  { label: "Tours",    to: "/tours" },
  { label: "About Us", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Contact",  to: "/contact" },
  { label: "Location", to: "/#location" },
];

export default function Navbar({ variant = "overlay" }) {
  const [open, setOpen]       = useState(false);
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const isOverlay = variant === "overlay";
  const location  = useLocation();

  // Auto-hide: visible at top, hide on scroll down, show on scroll up
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      if (y < 80) {
        setVisible(true);
      } else if (y > lastY.current + 8) {
        setVisible(false);
        setOpen(false);
      } else if (y < lastY.current - 8) {
        setVisible(true);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Anchor scroll
  useEffect(() => {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
  }, [location]);

  // Close on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLinkClick = (e, to) => {
    if (to.includes("#")) {
      const [path, hash] = to.split("#");
      if (location.pathname === (path || "/")) {
        e.preventDefault();
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }
    }
    setOpen(false);
  };

  return (
    <>
    <motion.header
      className="z-50 fixed inset-x-0 top-0"
      animate={{ y: visible ? 0 : "-110%" }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── NAV BAR ─────────────────────────────────── */}
      <div className="mx-auto w-[min(1100px,94%)] pt-3">
        <motion.nav
          className={[
            "flex items-center justify-between gap-4 rounded-2xl border px-4 h-16 backdrop-blur-xl",
            isOverlay
              ? "border-white/8 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
              : "border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.08)]",
          ].join(" ")}
          style={{ backgroundColor: isOverlay ? "rgba(7,16,9,0.82)" : "rgba(255,255,255,0.95)" }}
        >
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/logo.webp"
              alt="Nature Tours La Fortuna"
              className="h-11 w-11"
            />
            <span
              className={["text-base font-600 leading-tight", isOverlay ? "text-white/90" : "text-gray-900"].join(" ")}
              style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: "-0.01em" }}
            >
              Nature Tours
              <span className={["block text-[10px] font-400 tracking-widest uppercase", isOverlay ? "text-emerald-400/80" : "text-emerald-600"].join(" ")}>
                La Fortuna
              </span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
            {LINKS.map((item) => {
              const isLocation = item.to === "/#location";

              if (isLocation) {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={(e) => handleLinkClick(e, item.to)}
                    className={isOverlay
                      ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-sm font-500 text-emerald-300 transition-colors duration-200 hover:bg-emerald-500/20 hover:text-emerald-200"
                      : "inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 px-3.5 py-1.5 text-sm font-500 text-emerald-700 transition-colors duration-200 hover:bg-emerald-100 hover:text-emerald-800"
                    }
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    <HiOutlineLocationMarker className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={(e) => handleLinkClick(e, item.to)}
                  className={({ isActive }) => [
                    "relative px-3.5 py-2 text-sm rounded-xl transition-colors duration-200",
                    isOverlay
                      ? isActive ? "text-white" : "text-white/60 hover:text-white"
                      : isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-900",
                  ].join(" ")}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <motion.span
                          layoutId="navUnderline"
                          className={["absolute bottom-1 left-3 right-3 h-0.5 rounded-full", isOverlay ? "bg-emerald-400" : "bg-emerald-600"].join(" ")}
                          transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* CTA */}
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="hidden md:block">
              <NavLink
                to="/SelecTour"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-2 text-sm font-700 text-black shadow-md shadow-emerald-500/30 hover:bg-emerald-400 transition-colors"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Book Now
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </NavLink>
            </motion.div>

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className={["md:hidden h-10 w-10 rounded-xl border flex items-center justify-center transition-colors",
                isOverlay
                  ? "bg-white/8 hover:bg-white/14 border-white/10 text-white/80"
                  : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600"
              ].join(" ")}
            >
              <motion.div animate={open ? "open" : "closed"} className="flex flex-col gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block h-px w-5 bg-current rounded-full origin-center"
                    variants={{
                      open: {
                        rotate: i === 0 ? 45 : i === 2 ? -45 : 0,
                        y:      i === 0 ? 8  : i === 2 ? -8  : 0,
                        opacity: i === 1 ? 0 : 1,
                      },
                      closed: { rotate: 0, y: 0, opacity: 1 },
                    }}
                    transition={{ duration: 0.25 }}
                  />
                ))}
              </motion.div>
            </button>
          </div>
        </motion.nav>

        {/* ── MOBILE MENU ─────────────────────────────── */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,   scale: 1 }}
              exit={{   opacity: 0, y: -8,   scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={["mt-2 rounded-2xl border backdrop-blur-xl p-3 shadow-xl",
                isOverlay
                  ? "border-white/10 bg-[#0c1a0e]/90 shadow-black/40"
                  : "border-gray-200 bg-white/95 shadow-black/10"
              ].join(" ")}
            >
              <div className="grid gap-1">
                {LINKS.map((item, i) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                  >
                    <NavLink
                      to={item.to}
                      onClick={(e) => handleLinkClick(e, item.to)}
                      className={({ isActive }) => [
                        "flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors",
                        isOverlay
                          ? isActive ? "bg-emerald-500/15 text-emerald-300 font-500" : "text-white/70 hover:bg-white/5 hover:text-white"
                          : isActive ? "bg-emerald-50 text-emerald-700 font-500" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      ].join(" ")}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {item.label}
                      {({ isActive }) => isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      )}
                    </NavLink>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: LINKS.length * 0.05, duration: 0.2 }}
                  className="mt-2"
                >
                  <NavLink
                    to="/SelecTour"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-700 text-black transition-colors hover:bg-emerald-400"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Book Your Ride
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </NavLink>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>

    {/* Spacer for non-overlay pages so content doesn't hide under the fixed navbar */}
    {!isOverlay && <div className="h-20" />}
    </>
  );
}
