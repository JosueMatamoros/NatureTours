// src/hooks/useDateParam.js
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

// Fecha "YYYY-MM-DD" guardada en la URL (?fecha=...), para que al recargar la
// página se mantenga el día que se estaba viendo. Sin parámetro → defaultYmd.
export function useDateParam(defaultYmd) {
  const [params, setParams] = useSearchParams();
  const raw = params.get("fecha");
  const date = raw && YMD_RE.test(raw) ? raw : defaultYmd;

  const setDate = useCallback(
    (next) => {
      setParams(
        (prev) => {
          const current = prev.get("fecha");
          const base = current && YMD_RE.test(current) ? current : defaultYmd;
          const value = typeof next === "function" ? next(base) : next;
          const p = new URLSearchParams(prev);
          if (value === defaultYmd) p.delete("fecha");
          else p.set("fecha", value);
          return p;
        },
        { replace: true },
      );
    },
    [setParams, defaultYmd],
  );

  return [date, setDate];
}
