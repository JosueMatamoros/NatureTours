// Caballos: asignar caballos a cada tour y llevar herraduras y salud.
// Lo usa sobre todo el encargado de caballos desde el teléfono, así que todo
// es visual: fotos grandes, colores, botones grandes y poco texto.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiArrowLeft, FiCamera, FiCheck, FiChevronLeft, FiChevronRight, FiEdit2, FiPlus, FiClock, FiFileText,
} from "react-icons/fi";
import { GiHorseHead, GiHorseshoe, GiHammerNails, GiStickingPlaster } from "react-icons/gi";
import {
  horsesMe, listHorses, createHorse, updateHorse, addHorseEvent, horseHistory, horsesDay,
} from "../../services/horses.api";
import {
  HERRAR_PRONTO, HERRAR_YA, HOOF_NAME, TONE, clock, dayLabel, photoToDataUrl, shiftYmd, shoeSummary, shortDay, statusOf, toYmd,
} from "../components/horses/horsesUtil";
import { BigButton, Chip, HoofGrid, HorseAvatar, Sheet, Toast, TourCard } from "../components/horses/HorsesUI";
import { useHorseAssign } from "../components/horses/useHorseAssign";

function ToursTab({ date, setDate, today, toast }) {
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      setDay(await horsesDay(d));
    } catch (e) {
      toast(e.message, true);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(date); }, [date, load]);
  const { openPick, picker } = useHorseAssign(day, setDay, () => load(date, true), (m) => toast(m, true));
  const horsesById = Object.fromEntries((day?.horses || []).map((h) => [h.id, h]));

  const tomorrow = shiftYmd(today, 1);
  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => setDate(shiftYmd(date, -1))} aria-label="Día anterior" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-slate-600 ring-1 ring-slate-200 cursor-pointer">
          <FiChevronLeft className="h-6 w-6" />
        </button>
        <button onClick={() => setDate(today)} className={`h-12 flex-1 rounded-2xl text-base font-black cursor-pointer ${date === today ? "bg-emerald-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>Hoy</button>
        <button onClick={() => setDate(tomorrow)} className={`h-12 flex-1 rounded-2xl text-base font-black cursor-pointer ${date === tomorrow ? "bg-orange-500 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>Mañana</button>
        <button onClick={() => setDate(shiftYmd(date, 1))} aria-label="Día siguiente" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-slate-600 ring-1 ring-slate-200 cursor-pointer">
          <FiChevronRight className="h-6 w-6" />
        </button>
      </div>
      <p className="mb-3 px-1 text-lg font-black capitalize text-slate-800">{dayLabel(date)}</p>

      {loading ? (
        <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-56 animate-pulse rounded-3xl bg-slate-200/70" />)}</div>
      ) : !day?.slots.length ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white py-14 text-center">
          <GiHorseHead className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-3 text-lg font-bold text-slate-700">No hay tours a caballo</p>
        </div>
      ) : (
        <div className="space-y-4">
          {day.slots.map((s) => (
            <TourCard key={`${s.tourId}-${s.startTime}`} slot={s} horsesById={horsesById} onPick={openPick} />
          ))}
        </div>
      )}
      {picker}
    </>
  );
}

// ─── Caballos: herraduras y salud ───────────────────────────────────────────
const EVENT_INFO = {
  herrado: { icon: GiHammerNails, color: "bg-emerald-100 text-emerald-700", text: (e) => `Se herró: ${e.hooves.map((k) => HOOF_NAME[k].toLowerCase()).join(", ")}` },
  herradura_caida: { icon: GiHorseshoe, color: "bg-amber-100 text-amber-700", text: (e) => `Se le cayó: ${e.hooves.map((k) => HOOF_NAME[k].toLowerCase()).join(", ")}` },
  lastimado: { icon: GiStickingPlaster, color: "bg-red-100 text-red-700", text: (e) => (e.restDays ? `${e.detail || "Lastimado"} · descansa ${e.restDays} día${e.restDays === 1 ? "" : "s"}` : "Renco o lastimado: no disponible") },
  recuperado: { icon: FiCheck, color: "bg-emerald-100 text-emerald-700", text: () => "Disponible otra vez" },
  nota: { icon: FiFileText, color: "bg-slate-100 text-slate-600", text: (e) => e.detail },
};

function PhotoButton({ photo, onPhoto, horse }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} className="relative mx-auto block cursor-pointer">
        {photo ? (
          <img src={photo} alt="" className="h-32 w-32 rounded-3xl object-cover" />
        ) : (
          <span className="grid h-32 w-32 place-items-center rounded-3xl border-4 border-dashed border-amber-300 bg-amber-50 text-amber-500">
            {horse ? <span className="text-5xl font-black">{horse.name.slice(0, 1)}</span> : <FiCamera className="h-12 w-12" />}
          </span>
        )}
        <span className="absolute -bottom-2 -right-2 grid h-11 w-11 place-items-center rounded-full bg-slate-900 text-white ring-4 ring-white">
          {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <FiCamera className="h-5 w-5" />}
        </span>
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try { onPhoto(await photoToDataUrl(f)); } finally { setBusy(false); }
        }}
      />
    </>
  );
}

function HorseForm({ horse, onClose, onSaved, toast }) {
  const [name, setName] = useState(horse?.name || "");
  const [photo, setPhoto] = useState(horse?.photo || null);
  const [color, setColor] = useState(horse?.color || "");
  const [notes, setNotes] = useState(horse?.notes || "");
  const [shoes, setShoes] = useState(horse?.shoes || { mi: false, md: false, pi: false, pd: false });
  const [shodAt, setShodAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return toast("Falta el nombre", true);
    setSaving(true);
    try {
      let h;
      if (horse) {
        h = (await updateHorse(horse.id, { name: name.trim(), photo, color, notes })).horse;
      } else {
        const hooves = Object.keys(shoes).filter((k) => shoes[k]);
        h = (await createHorse({ name: name.trim(), photo, color, notes, shoes })).horse;
        if (hooves.length && shodAt) h = (await addHorseEvent(h.id, { kind: "herrado", hooves, date: shodAt })).horse;
      }
      onSaved(h);
    } catch (e) {
      toast(e.message, true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      title={horse ? "Editar caballo" : "Nuevo caballo"}
      onClose={onClose}
      footer={<BigButton icon={FiCheck} onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</BigButton>}
    >
      <div className="space-y-5">
        <PhotoButton photo={photo} onPhoto={setPhoto} horse={horse} />
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-14 w-full rounded-2xl border-2 border-slate-200 px-4 text-xl font-bold outline-none focus:border-emerald-500" placeholder="Ej: Canela" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">Color <span className="font-normal text-slate-400">(opcional)</span></span>
          <input value={color} onChange={(e) => setColor(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-slate-200 px-4 text-base outline-none focus:border-emerald-500" placeholder="Ej: alazán, blanco con manchas" />
        </label>
        {!horse && (
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="mb-2 text-base font-black text-slate-700">¿Qué cascos tienen herradura?</p>
            <HoofGrid shoes={shoes} big onTap={(k) => setShoes((s) => ({ ...s, [k]: !s[k] }))} />
            {Object.values(shoes).some(Boolean) && (
              <label className="mt-3 block text-left">
                <span className="mb-1 block text-sm font-bold text-slate-600">¿Cuándo se herró? <span className="font-normal text-slate-400">(si se sabe)</span></span>
                <input type="date" value={shodAt} max={toYmd(new Date())} onChange={(e) => setShodAt(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-base" />
              </label>
            )}
          </div>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">Notas <span className="font-normal text-slate-400">(opcional)</span></span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-base outline-none focus:border-emerald-500" placeholder="Ej: manso, bueno para niños" />
        </label>
        {horse && (
          <button
            type="button"
            onClick={async () => {
              try { onSaved((await updateHorse(horse.id, { active: !horse.active })).horse); } catch (e) { toast(e.message, true); }
            }}
            className="w-full rounded-2xl py-3 text-sm font-bold text-slate-500 ring-1 ring-slate-200 cursor-pointer"
          >
            {horse.active ? "Ya no trabaja (ocultar de los tours)" : "Volver a ponerlo a trabajar"}
          </button>
        )}
      </div>
    </Sheet>
  );
}

// Acción guiada: herrar / se cayó / lastimado / nota.
function ActionSheet({ horse, kind, onClose, onDone, toast, today }) {
  const [hooves, setHooves] = useState(kind === "herrado" ? ["mi", "md", "pi", "pd"] : []);
  const [when, setWhen] = useState(today);
  const [days, setDays] = useState(null);
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const toggle = (k) => setHooves((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]));

  const ok = kind === "herrado" || kind === "herradura_caida" ? hooves.length > 0 : kind === "lastimado" ? !!days : kind === "nota" ? note.trim().length > 0 : true;

  async function save() {
    setSaving(true);
    try {
      const body = { kind };
      if (kind === "herrado") Object.assign(body, { hooves, date: when });
      if (kind === "herradura_caida") Object.assign(body, { hooves });
      if (kind === "lastimado") Object.assign(body, { restDays: days, detail: [reason, note.trim()].filter(Boolean).join(" · ") || undefined });
      if (kind === "nota") body.detail = note.trim();
      onDone((await addHorseEvent(horse.id, body)).horse);
    } catch (e) {
      toast(e.message, true);
    } finally {
      setSaving(false);
    }
  }

  const title = { herrado: "Se herró", herradura_caida: "Se le cayó una herradura", lastimado: "Renco o lastimado", nota: "Nota" }[kind];
  const shod = ["mi", "md", "pi", "pd"].filter((k) => horse.shoes[k]);

  return (
    <Sheet
      title={<span>{horse.name} · <span className="text-slate-500">{title}</span></span>}
      onClose={onClose}
      footer={<BigButton icon={FiCheck} onClick={save} disabled={!ok || saving}>{saving ? "Guardando…" : "Listo"}</BigButton>}
    >
      {kind === "herrado" && (
        <div className="space-y-5 text-center">
          <div className="grid grid-cols-3 gap-2">
            {[["Las 4", ["mi", "md", "pi", "pd"]], ["Manos", ["mi", "md"]], ["Patas", ["pi", "pd"]]].map(([l, v]) => {
              const on = v.length === hooves.length && v.every((k) => hooves.includes(k));
              return (
                <button key={l} type="button" onClick={() => setHooves(v)} className={`h-14 rounded-2xl text-base font-black cursor-pointer ${on ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>{l}</button>
              );
            })}
          </div>
          <p className="text-sm font-semibold text-slate-500">o tocá cada casco</p>
          <HoofGrid shoes={{ mi: hooves.includes("mi"), md: hooves.includes("md"), pi: hooves.includes("pi"), pd: hooves.includes("pd") }} big onTap={toggle} />
          <div>
            <p className="mb-2 text-base font-black text-slate-700">¿Cuándo?</p>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setWhen(today)} className={`h-14 rounded-2xl text-base font-black cursor-pointer ${when === today ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`}>Hoy</button>
              <button type="button" onClick={() => setWhen(shiftYmd(today, -1))} className={`h-14 rounded-2xl text-base font-black cursor-pointer ${when === shiftYmd(today, -1) ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`}>Ayer</button>
              <input type="date" value={when} max={today} onChange={(e) => e.target.value && setWhen(e.target.value)} className={`h-14 rounded-2xl px-2 text-sm font-bold ${when < shiftYmd(today, -1) ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`} />
            </div>
          </div>
        </div>
      )}

      {kind === "herradura_caida" && (
        <div className="space-y-4 text-center">
          <p className="text-lg font-black text-slate-700">Tocá el casco que perdió la herradura</p>
          {shod.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-slate-500">Este caballo no tiene herraduras puestas.</p>
          ) : (
            <HoofGrid shoes={horse.shoes} big enabled={shod} selected={hooves} onTap={toggle} />
          )}
        </div>
      )}

      {kind === "lastimado" && (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-base font-black text-slate-700">¿Qué le pasó?</p>
            <div className="grid grid-cols-2 gap-2">
              {["Renco", "Golpe o herida", "Cansado", "Otra cosa"].map((r) => (
                <button key={r} type="button" onClick={() => setReason(reason === r ? null : r)} className={`h-14 rounded-2xl text-base font-black cursor-pointer ${reason === r ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"}`}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-base font-black text-slate-700">¿Cuántos días descansa?</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 5, 7, 15].map((d) => (
                <button key={d} type="button" onClick={() => setDays(d)} className={`flex h-16 flex-col items-center justify-center rounded-2xl cursor-pointer ${days === d ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                  <span className="text-2xl font-black leading-none">{d}</span>
                  <span className="text-[11px] font-bold">hasta {shortDay(shiftYmd(today, d))}</span>
                </button>
              ))}
            </div>
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalle (opcional)" className="h-12 w-full rounded-2xl border-2 border-slate-200 px-4 text-base outline-none focus:border-red-400" />
        </div>
      )}

      {kind === "nota" && (
        <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Escribí lo que pasó" className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-lg outline-none focus:border-emerald-500" />
      )}
    </Sheet>
  );
}

function HorseDetail({ horse, onClose, onChanged, toast, today }) {
  const [action, setAction] = useState(null);
  const [editing, setEditing] = useState(false);
  const [hist, setHist] = useState(null);

  useEffect(() => {
    let alive = true;
    horseHistory(horse.id).then((r) => alive && setHist(r)).catch(() => alive && setHist({ events: [], tours: [] }));
    return () => { alive = false; };
  }, [horse.id, horse.shoes, horse.restUntil]);

  const st = statusOf(horse);
  const ago = (d) => (d == null ? "sin fecha" : d === 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`);

  // Un toque: queda no disponible hasta que lo marquen disponible otra vez.
  async function markHurt() {
    try { onChanged((await addHorseEvent(horse.id, { kind: "lastimado" })).horse); toast("Marcado como no disponible"); } catch (e) { toast(e.message, true); }
  }

  async function recovered() {
    try { onChanged((await addHorseEvent(horse.id, { kind: "recuperado" })).horse); } catch (e) { toast(e.message, true); }
  }

  return (
    <>
      <Sheet
        title={
          <span className="flex items-center gap-2">
            {horse.name}
            <button type="button" onClick={() => setEditing(true)} aria-label="Editar" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 cursor-pointer">
              <FiEdit2 className="h-4 w-4" />
            </button>
          </span>
        }
        onClose={onClose}
      >
        <div className="space-y-5">
          {(horse.color || horse.notes || (st.label && !horse.resting)) && (
            <div className="space-y-1">
              {st.label && !horse.resting && <Chip tone={st.tone} className="text-sm">{st.label}</Chip>}
              {horse.color && <p className="text-sm text-slate-500">{horse.color}</p>}
              {horse.notes && <p className="text-sm text-slate-600">{horse.notes}</p>}
            </div>
          )}

          {horse.resting && (
            <div className="rounded-2xl bg-red-50 p-4 ring-2 ring-red-300">
              <p className="text-center text-lg font-black text-red-700">
                {horse.restUntil >= "2999" ? "No disponible (renco o lastimado)" : `Descansando hasta ${dayLabel(horse.restUntil)}`}
              </p>
              <BigButton color="emerald" icon={FiCheck} onClick={recovered} className="mt-3">Ya está disponible</BigButton>
            </div>
          )}

          <div className="rounded-3xl bg-slate-50 p-4 text-center">
            <p className="mb-2 text-base font-black text-slate-800">{shoeSummary(horse.shoes)}</p>
            <HoofGrid shoes={horse.shoes} big />
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className={`rounded-xl p-2 ${horse.daysFront >= HERRAR_YA ? "bg-red-100 text-red-700" : horse.daysFront >= HERRAR_PRONTO ? "bg-amber-100 text-amber-800" : "bg-white text-slate-600"}`}>
                <p className="font-black">Manos</p><p>{ago(horse.daysFront)}</p>
              </div>
              <div className={`rounded-xl p-2 ${horse.daysBack >= HERRAR_YA ? "bg-red-100 text-red-700" : horse.daysBack >= HERRAR_PRONTO ? "bg-amber-100 text-amber-800" : "bg-white text-slate-600"}`}>
                <p className="font-black">Patas</p><p>{ago(horse.daysBack)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <BigButton color="emerald" icon={GiHammerNails} onClick={() => setAction("herrado")}>Se herró</BigButton>
            <BigButton color="amber" icon={GiHorseshoe} onClick={() => setAction("herradura_caida")}>Se le cayó una herradura</BigButton>
            {!horse.resting && (
              <BigButton color="red" icon={GiStickingPlaster} onClick={markHurt}>Está renco o lastimado</BigButton>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-black uppercase tracking-wider text-slate-400">Historial</p>
            {!hist ? (
              <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ) : hist.events.length === 0 ? (
              <p className="text-sm text-slate-400">Todavía no hay nada reportado.</p>
            ) : (
              <ul className="space-y-2">
                {hist.events.map((e) => {
                  const info = EVENT_INFO[e.kind] || EVENT_INFO.nota;
                  return (
                    <li key={e.id} className="flex items-start gap-3 rounded-2xl bg-white p-2 ring-1 ring-slate-100">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${info.color}`}><info.icon className="h-5 w-5" /></span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">{info.text(e)}</p>
                        <p className="text-xs text-slate-400">{shortDay(e.date)}{e.by ? ` · ${e.by}` : ""}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {hist?.tours?.length > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                Últimos tours: {hist.tours.slice(0, 5).map((t) => `${shortDay(t.date)} ${clock(t.startTime)}`).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </Sheet>

      {action && (
        <ActionSheet
          horse={horse}
          kind={action}
          today={today}
          toast={toast}
          onClose={() => setAction(null)}
          onDone={(h) => { setAction(null); onChanged(h); toast("Guardado ✓"); }}
        />
      )}
      {editing && (
        <HorseForm horse={horse} toast={toast} onClose={() => setEditing(false)} onSaved={(h) => { setEditing(false); onChanged(h); toast("Guardado ✓"); }} />
      )}
    </>
  );
}

function HorsesTab({ today, toast, isAdmin }) {
  const [horses, setHorses] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    listHorses().then((r) => setHorses(r.horses)).catch((e) => { setHorses([]); toast(e.message, true); });
  }, [toast]);

  const upsert = (h) => setHorses((list) => (list.some((x) => x.id === h.id) ? list.map((x) => (x.id === h.id ? h : x)) : [...list, h].sort((a, b) => a.name.localeCompare(b.name))));

  if (!horses) return <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-3xl bg-slate-200/70" />)}</div>;
  const open = horses.find((h) => h.id === openId);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {horses.map((h) => {
          const st = statusOf(h);
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => setOpenId(h.id)}
              className={`flex flex-col items-center gap-2 rounded-3xl p-3 text-center transition active:scale-95 cursor-pointer ${
                h.resting ? "bg-slate-100 ring-2 ring-red-500" : st.tone === "red" ? "bg-red-50 ring-2 ring-red-300" : st.tone === "amber" ? "bg-amber-50 ring-2 ring-amber-300" : "bg-white ring-1 ring-slate-200"
              } ${h.active ? "" : "opacity-50"}`}
            >
              <HorseAvatar horse={h} size="h-24 w-24" text="text-4xl" dim={h.resting} />
              <span className={`w-full truncate text-lg font-black ${h.resting ? "text-slate-400" : "text-slate-900"}`}>{h.name}</span>
              <HoofGrid shoes={h.shoes} />
              {st.label && <span className={`w-full truncate rounded-full px-2 py-1 text-xs font-bold ring-1 ${TONE[st.tone]}`}>{st.label}</span>}
            </button>
          );
        })}
      </div>

      {isAdmin && (
        <button type="button" onClick={() => setAdding(true)} className="mx-auto mt-8 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-400 ring-1 ring-slate-200 cursor-pointer hover:bg-white">
          <FiPlus className="h-4 w-4" /> Agregar caballo
        </button>
      )}

      {open && <HorseDetail horse={open} today={today} toast={toast} onClose={() => setOpenId(null)} onChanged={upsert} />}
      {adding && <HorseForm toast={toast} onClose={() => setAdding(false)} onSaved={(h) => { setAdding(false); upsert(h); toast(`${h.name} agregado ✓`); }} />}
    </>
  );
}

// ─── Página ─────────────────────────────────────────────────────────────────
export default function CaballosPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [params] = useSearchParams();
  // Desde Ajustes (?tab=caballos) abre directo el control de caballos.
  const [tab, setTab] = useState(() => {
    if (params.get("tab") === "caballos") return "horses";
    try { return sessionStorage.getItem("nt_caballos_tab") || "tours"; } catch { return "tours"; }
  });
  const [date, setDate] = useState(null);
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  const toast = useCallback((text, bad = false) => {
    setMsg({ text, bad });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);

  useEffect(() => {
    horsesMe()
      .then((r) => { setMe(r); setDate(r.today); })
      .catch(() => navigate("/asistencia", { replace: true }));
  }, [navigate]);

  useEffect(() => { try { sessionStorage.setItem("nt_caballos_tab", tab); } catch { /* nada */ } }, [tab]);

  if (!me) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  const tabBtn = (id, Icon, label) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl text-lg font-black transition cursor-pointer ${tab === id ? "bg-slate-900 text-white shadow-lg" : "text-slate-500"}`}
    >
      <Icon className="h-7 w-7" /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto max-w-2xl px-4 pt-5">
        <div className="mb-4 flex items-center gap-3">
          {me.user.isAdmin && (
          <button
            onClick={() => navigate("/matamoros")}
            aria-label="Volver"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-slate-600 ring-1 ring-slate-200 cursor-pointer"
          >
            <FiArrowLeft className="h-6 w-6" />
          </button>
          )}
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-600 text-white shadow-sm shadow-amber-600/30">
            <GiHorseHead className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight text-slate-900">Caballos</h1>
            <p className="truncate text-xs font-semibold text-slate-400">{me.user.name}</p>
          </div>
        </div>

        <div className="mb-5 flex gap-1 rounded-3xl bg-white p-1.5 ring-1 ring-slate-200">
          {tabBtn("tours", FiClock, "Tours")}
          {tabBtn("horses", GiHorseshoe, "Caballos")}
        </div>

        {tab === "tours" ? (
          <ToursTab date={date} setDate={setDate} today={me.today} toast={toast} />
        ) : (
          <HorsesTab today={me.today} toast={toast} isAdmin={me.user.isAdmin} />
        )}
      </div>
      <Toast msg={msg} />
    </div>
  );
}
