// Activar notificaciones push en este teléfono (app instalada).
// Admins: reservas nuevas, cancelaciones OTA y pagos personalizados.
// Guías: cuando les asignan un tour.
import { useEffect, useState } from "react";
import { FiBell, FiBellOff, FiCheckCircle } from "react-icons/fi";
import {
  getGuideToken,
  getPushPublicKey,
  savePushSubscription,
  sendPushTest,
} from "../../../services/guide.api";
import { isStandalone } from "../../hooks/useAppShell";

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const isIOS = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export default function NotificationsCard({ isAdmin = false, className = "" }) {
  // checking | unsupported | needs-install | needs-login | denied | off | just-on | on
  const [state, setState] = useState("checking");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getGuideToken()) return alive && setState("needs-login");
      if (!pushSupported()) {
        return alive && setState(isIOS() && !isStandalone() ? "needs-install" : "unsupported");
      }
      if (Notification.permission === "denied") return alive && setState("denied");
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub && Notification.permission === "granted") {
          // Re-sincronizar con el servidor (por si cambió de usuario).
          await savePushSubscription(sub.toJSON()).catch(() => {});
          return alive && setState("on");
        }
      } catch {
        /* sigue como off */
      }
      if (alive) setState("off");
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const { publicKey } = await getPushPublicKey();
      const reg = await getRegistration();
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      await savePushSubscription(sub.toJSON());
      sendPushTest().catch(() => {});
      // Confirmación breve; después la tarjeta desaparece para siempre.
      setState("just-on");
      setTimeout(() => setState("on"), 3500);
    } catch (e) {
      console.error("push enable error:", e);
      setMsg("No se pudieron activar. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking" || state === "unsupported" || state === "on") return null;

  const what = isAdmin
    ? "Te avisamos al instante de cada reserva nueva, cancelación de OTA y pago personalizado."
    : "Te avisamos cuando te asignen un tour.";

  if (state === "just-on") {
    return (
      <div className={className}>
        <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <FiCheckCircle className="h-4 w-4" /> Notificaciones activadas
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700 ${className}`}>
      <p className="flex items-center gap-2 font-bold text-amber-900">
        {state === "denied" ? <FiBellOff className="h-4 w-4" /> : <FiBell className="h-4 w-4" />}
        Notificaciones
      </p>

      {state === "off" && (
        <>
          <p className="mt-1">{what}</p>
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60 cursor-pointer"
          >
            <FiBell className="h-4 w-4" /> {busy ? "Activando…" : "Activar notificaciones"}
          </button>
        </>
      )}

      {state === "needs-install" && (
        <p className="mt-1">
          En iPhone las notificaciones funcionan con la app instalada: agregala a tu pantalla de
          inicio desde Safari y abrila desde el ícono <b>Nature Tours</b>.
        </p>
      )}

      {state === "needs-login" && (
        <p className="mt-1">
          Para recibir notificaciones entrá a la app con tu <b>cédula</b> desde{" "}
          <a href="/asistencia" className="font-semibold text-amber-800 underline">
            Asistencia
          </a>
          .
        </p>
      )}

      {state === "denied" && (
        <p className="mt-1">
          Las notificaciones están bloqueadas. Activalas en los <b>Ajustes</b> del teléfono →
          Notificaciones → <b>Nature Tours</b>, y volvé a abrir la app.
        </p>
      )}

      {msg && <p className="mt-2 text-xs font-medium text-amber-900">{msg}</p>}
    </div>
  );
}
