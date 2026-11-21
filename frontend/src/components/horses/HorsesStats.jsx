// Pestaña "Datos" de Caballos: qué caballos trabajan más y cómo va cada uno.
// Por defecto el mes actual; se puede cambiar a semana, moverse con ◀ ▶ y
// filtrar por horario (8 AM, 12 PM…) o por tipo de día (entre semana / fin de semana).
// Al tocar un caballo: días seguidos trabajando, calendario, horarios y días.
import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiAlertTriangle } from "react-icons/fi";
import { horsesStats } from "../../../services/horses.api";
import { clock, fromYmd, shiftYmd, shortDay, toYmd } from "./horsesUtil";
import { HorseAvatar, Sheet } from "./HorsesUI";

const DOW = ["L", "K", "M", "J", "V", "S", "D"]; // lunes primero
const DOW_LARGO = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const dowOf = (ymd) => (fromYmd(ymd).getDay() + 6) % 7; // 0 = lunes
const RACHA_ALTA = 5; // días seguidos que ya merecen aviso

function rangeOf(mode, anchor) {
  const d = fromYmd(anchor);
  if (mode === "week") {
    const from = shiftYmd(anchor, -dowOf(anchor));
    return { from, to: shiftYmd(from, 6) };
  }
  return { from: toYmd(new Date(d.getFullYear(), d.getMonth(), 1)), to: toYmd(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
}

function rangeLabel(mode, { from, to }) {
  if (mode === "month") {
    const s = fromYmd(from).toLocaleDateString("es-CR", { month: "long", year: "numeric" }).replace(" de ", " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const f = fromYmd(from), t = fromYmd(to);
  const mes = (x) => x.toLocaleDateString("es-CR", { month: "short" }).replace(".", "");
  return f.getMonth() === t.getMonth() ? `${f.getDate()} – ${t.getDate()} ${mes(t)}` : `${f.getDate()} ${mes(f)} – ${t.getDate()} ${mes(t)}`;
}

function daysBetween(from, to) {
  const out = [];
  for (let d = from; d <= to; d = shiftYmd(d, 1)) out.push(d);
  return out;
}

// Racha más larga dentro de una lista de fechas (ordenadas o no).
function longestRun(dates) {
  const s = [...new Set(dates)].sort();
  let best = 0, cur = 0, prev = null;
  for (const d of s) {
    cur = prev && shiftYmd(prev, 1) === d ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = d;
  }
  return best;
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`h-10 flex-1 rounded-xl px-2 text-sm font-black transition cursor-pointer ${value === v ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Pill({ on, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-bold ring-1 transition cursor-pointer ${on ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200"}`}
    >
      {children}
    </button>
  );
}

function Tile({ value, label, tone = "text-slate-900" }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200">
      <div className={`text-3xl font-black leading-none ${tone}`}>{value}</div>
      <div className="mt-1.5 text-xs font-bold leading-tight text-slate-500">{label}</div>
    </div>
  );
}

function StreakBadge({ h }) {
  if (h.streak >= RACHA_ALTA) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-700">{h.streak} días seguidos</span>;
  if (h.streak >= 2) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{h.streak} días seguidos</span>;
  if (h.daysOff != null && h.daysOff >= 2) return <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">descansa hace {h.daysOff} días</span>;
  return null;
}

export default function HorsesStats({ today, toast }) {
  const [mode, setMode] = useState("month");
  const [anchor, setAnchor] = useState(today);
  const [time, setTime] = useState("all");
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);

  const range = useMemo(() => rangeOf(mode, anchor), [mode, anchor]);
  const isCurrent = range.from <= today && today <= range.to;
  const isFuture = range.from > today;

  useEffect(() => {
    let alive = true;
    setData(null);
    horsesStats(range.from, range.to)
      .then((r) => alive && setData(r))
      .catch((e) => { if (alive) { setData({ horses: [] }); toast(e.message, true); } });
    return () => { alive = false; };
  }, [range.from, range.to, toast]);

  const move = (n) => {
    if (mode === "week") setAnchor(shiftYmd(range.from, 7 * n));
    else { const d = fromYmd(range.from); setAnchor(toYmd(new Date(d.getFullYear(), d.getMonth() + n, 1))); }
  };

  // Horarios que aparecen en el período (para los filtros).
  const times = useMemo(() => {
    const s = new Set();
    data?.horses.forEach((h) => h.work.forEach((w) => s.add(w.time)));
    return [...s].sort();
  }, [data]);

  const keep = (w) => time === "all" || w.time === time;

  const rows = useMemo(() => {
    if (!data) return null;
    return data.horses
      .map((h) => {
        const work = h.work.filter(keep);
        return { ...h, fwork: work, tours: work.length, days: new Set(work.map((w) => w.date)).size };
      })
      .filter((h) => h.active || h.tours > 0)
      .sort((a, b) => b.tours - a.tours || b.days - a.days || a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, time]);

  const max = Math.max(1, ...(rows || []).map((h) => h.tours));
  const tired = (rows || []).filter((h) => h.active && h.streak >= RACHA_ALTA).sort((a, b) => b.streak - a.streak);
  const open = rows?.find((h) => h.id === openId);

  return (
    <div className="space-y-4">
      {/* Período */}
      <div className="space-y-2 rounded-3xl bg-white p-2 ring-1 ring-slate-200">
        <Segmented value={mode} onChange={(v) => { setMode(v); setAnchor(today); }} options={[["month", "Mes"], ["week", "Semana"]]} />
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} aria-label="Anterior" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 cursor-pointer active:scale-95">
            <FiChevronLeft className="h-6 w-6" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-lg font-black text-slate-900">{rangeLabel(mode, range)}</div>
            {!isCurrent && (
              <button type="button" onClick={() => setAnchor(today)} className="text-xs font-bold text-emerald-700 cursor-pointer">
                Volver a {mode === "week" ? "esta semana" : "este mes"}
              </button>
            )}
            {isCurrent && <div className="text-xs font-semibold text-slate-400">hasta hoy</div>}
          </div>
          <button type="button" onClick={() => move(1)} disabled={isCurrent} aria-label="Siguiente" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 cursor-pointer active:scale-95 disabled:opacity-30">
            <FiChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Pill on={time === "all"} onClick={() => setTime("all")}>Todo el día</Pill>
          {times.map((t) => <Pill key={t} on={time === t} onClick={() => setTime(t)}>{clock(t)}</Pill>)}
        </div>
      </div>

      {!rows ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200/70" />)}</div>
      ) : isFuture ? (
        <p className="rounded-2xl bg-white p-6 text-center font-bold text-slate-400 ring-1 ring-slate-200">Este período todavía no ha pasado.</p>
      ) : (
        <>
          {tired.length > 0 && (
            <div className="rounded-2xl bg-red-50 p-3 ring-1 ring-red-200">
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-red-700">
                <FiAlertTriangle className="h-4 w-4" /> Muchos días seguidos trabajando
              </div>
              <div className="flex flex-wrap gap-2">
                {tired.map((h) => (
                  <button key={h.id} type="button" onClick={() => setOpenId(h.id)} className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-sm font-bold text-slate-800 ring-1 ring-red-200 cursor-pointer">
                    <HorseAvatar horse={h} size="h-7 w-7" text="text-sm" />
                    {h.name} · <span className="text-red-700">{h.streak} días</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="text-base font-black text-slate-900">Los que más salen</h2>
              <span className="text-xs font-semibold text-slate-400">toque uno para ver más</span>
            </div>
            <div className="space-y-2">
              {rows.map((h, i) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setOpenId(h.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-left ring-1 ring-slate-200 transition active:scale-[0.98] cursor-pointer ${h.tours ? "" : "opacity-60"}`}
                >
                  <span className={`w-6 shrink-0 text-center text-sm font-black ${i < 3 && h.tours ? "text-amber-600" : "text-slate-300"}`}>{i + 1}</span>
                  <HorseAvatar horse={h} size="h-12 w-12" text="text-xl" dim={h.resting} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-black text-slate-900">{h.name}</span>
                      {h.resting && <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">descansando</span>}
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(h.tours / max) * 100}%` }} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs font-semibold text-slate-500">{h.days} {h.days === 1 ? "día" : "días"}</span>
                      <StreakBadge h={h} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-black leading-none text-slate-900">{h.tours}</div>
                    <div className="text-[11px] font-bold text-slate-400">{h.tours === 1 ? "salida" : "salidas"}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {open && (
        <HorseStatsSheet
          horse={open}
          range={range}
          today={today}
          mode={mode}
          label={rangeLabel(mode, range)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function Bars({ items }) {
  const max = Math.max(1, ...items.map((x) => x.n));
  return (
    <div className="space-y-1.5">
      {items.map((x) => (
        <div key={x.label} className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-sm font-bold text-slate-600">{x.label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded-lg bg-slate-100">
            <div className="h-full rounded-lg bg-emerald-500" style={{ width: `${(x.n / max) * 100}%` }} />
          </div>
          <span className="w-7 shrink-0 text-right text-sm font-black text-slate-900">{x.n}</span>
        </div>
      ))}
    </div>
  );
}

function HorseStatsSheet({ horse: h, range, today, mode, label, onClose }) {
  const work = h.fwork;
  const perDay = {};
  work.forEach((w) => { perDay[w.date] = (perDay[w.date] || 0) + 1; });
  const lastDay = range.to < today ? range.to : today;
  const pastDays = daysBetween(range.from, lastDay);
  const rest = pastDays.filter((d) => !perDay[d]).length;
  const best = longestRun(work.map((w) => w.date));

  const byTime = {};
  work.forEach((w) => { byTime[w.time] = (byTime[w.time] || 0) + 1; });
  const byDow = Array(7).fill(0);
  work.forEach((w) => { byDow[dowOf(w.date)] += 1; });

  // Calendario: semanas que empiezan en lunes.
  const cells = [...Array(dowOf(range.from)).fill(null), ...daysBetween(range.from, range.to)];
  const shade = (n) => (n >= 3 ? "bg-emerald-700 text-white" : n === 2 ? "bg-emerald-500 text-white" : n === 1 ? "bg-emerald-200 text-emerald-900" : "bg-slate-100 text-slate-400");

  let estado;
  if (h.resting) estado = { t: "Descansando por lesión", c: "bg-red-50 text-red-700 ring-red-200" };
  else if (h.streak >= RACHA_ALTA) estado = { t: `Lleva ${h.streak} días seguidos trabajando: le toca descanso`, c: "bg-red-50 text-red-700 ring-red-200" };
  else if (h.streak >= 2) estado = { t: `Lleva ${h.streak} días seguidos trabajando`, c: "bg-amber-50 text-amber-800 ring-amber-200" };
  else if (h.streak === 1) estado = { t: h.lastWorked === today ? "Hoy salió (ayer descansó)" : "Ayer salió (antes descansó)", c: "bg-emerald-50 text-emerald-800 ring-emerald-200" };
  else if (h.lastWorked) estado = { t: `Descansando: salió por última vez ${h.daysOff === 1 ? "ayer" : `hace ${h.daysOff} días`}`, c: "bg-sky-50 text-sky-800 ring-sky-200" };
  else estado = { t: "No ha salido en los últimos 6 meses", c: "bg-slate-50 text-slate-600 ring-slate-200" };

  return (
    <Sheet
      title={(
        <span className="flex items-center gap-3">
          <HorseAvatar horse={h} size="h-11 w-11" text="text-lg" />
          <span className="min-w-0">
            <span className="block truncate">{h.name}</span>
            <span className="block text-xs font-semibold text-slate-400">{label}</span>
          </span>
        </span>
      )}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className={`rounded-2xl px-4 py-3 text-center text-base font-black ring-1 ${estado.c}`}>{estado.t}</div>

        <div className="grid grid-cols-2 gap-2">
          <Tile value={work.length} label="salidas" />
          <Tile value={Object.keys(perDay).length} label="días trabajados" />
          <Tile value={rest} label="días de descanso" tone="text-sky-700" />
          <Tile value={best} label="racha más larga" tone={best >= RACHA_ALTA ? "text-red-600" : "text-slate-900"} />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-black text-slate-900">{mode === "week" ? "La semana" : "El mes"}, día por día</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {DOW.map((d) => <div key={d} className="text-center text-[11px] font-black text-slate-400">{d}</div>)}
            {cells.map((d, i) => d ? (
              <div
                key={d}
                className={`grid aspect-square place-items-center rounded-lg text-sm font-black ${d > today ? "bg-white text-slate-200 ring-1 ring-slate-100" : shade(perDay[d] || 0)} ${d === today ? "ring-2 ring-slate-900" : ""}`}
                title={`${shortDay(d)}: ${perDay[d] || 0} salidas`}
              >
                {fromYmd(d).getDate()}
              </div>
            ) : <div key={`e${i}`} />)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-100" /> descanso</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-200" /> 1 salida</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500" /> 2</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-700" /> 3+</span>
          </div>
        </div>

        {work.length > 0 && (
          <>
            <div>
              <h3 className="mb-2 text-sm font-black text-slate-900">¿A qué hora sale?</h3>
              <Bars items={Object.keys(byTime).sort().map((t) => ({ label: clock(t), n: byTime[t] }))} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-black text-slate-900">¿Qué días sale más?</h3>
              <Bars items={DOW_LARGO.map((d, i) => ({ label: d, n: byDow[i] }))} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-black text-slate-900">Últimas salidas</h3>
              <div className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
                {[...work].reverse().slice(0, 8).map((w, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-bold capitalize text-slate-700">{shortDay(w.date)}</span>
                    <span className="font-semibold text-slate-500">{clock(w.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
