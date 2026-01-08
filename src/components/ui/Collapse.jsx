import { useEffect, useState } from "react";

export default function Collapse({ show, duration = 300, children, className = "" }) {
  const [render, setRender] = useState(show);

  useEffect(() => {
    if (show) setRender(true);
  }, [show]);

  useEffect(() => {
    if (!show) {
      const t = setTimeout(() => setRender(false), duration);
      return () => clearTimeout(t);
    }
  }, [show, duration]);

  if (!render) return null;

  const base =
    "overflow-hidden transition-all ease-out will-change-[max-height,opacity,transform]";
  const open = "max-h-full  opacity-100 translate-y-0 scale-100 ";
  const closed = "max-h-0 opacity-0 -translate-y-1 scale-[0.99]";

  return (
    <div
      className={[base, show ? open : closed, className].join(" ")}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
