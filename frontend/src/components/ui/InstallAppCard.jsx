// Tarjeta "Instalar app" del portal: instrucciones para iPhone (Safari →
// Compartir → Agregar a inicio) y botón directo en Android/Chrome.
// No se muestra si ya está abierta como app instalada.
import { useEffect, useState } from "react";
import { FiSmartphone, FiShare, FiPlusSquare, FiDownload, FiX } from "react-icons/fi";
import { isStandalone } from "../../hooks/useAppShell";

function platform() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIOS) return /CriOS|FxiOS|EdgiOS|GSA/i.test(ua) ? "ios-other" : "ios-safari";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function Step({ n, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

export default function InstallAppCard() {
  const [hidden, setHidden] = useState(
    () => isStandalone() || sessionStorage.getItem("nt_install_hidden") === "1"
  );
  const [prompt, setPrompt] = useState(() => window.__ntInstallPrompt ?? null);
  const plat = platform();

  useEffect(() => {
    const onReady = () => setPrompt(window.__ntInstallPrompt ?? null);
    const onInstalled = () => setHidden(true);
    window.addEventListener("nt-install-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("nt-install-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || plat === "desktop") return null;

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setHidden(true);
    window.__ntInstallPrompt = null;
    setPrompt(null);
  }

  function dismiss() {
    sessionStorage.setItem("nt_install_hidden", "1");
    setHidden(true);
  }

  return (
    <div className="relative mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-slate-700">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-600"
      >
        <FiX className="h-4 w-4" />
      </button>
      <p className="mb-3 flex items-center gap-2 font-bold text-emerald-800">
        <FiSmartphone className="h-4 w-4" /> Instalá la app en tu teléfono
      </p>

      {plat === "ios-safari" && (
        <ol className="space-y-2">
          <Step n={1}>
            Tocá <FiShare className="inline h-4 w-4 align-[-2px] text-sky-600" />{" "}
            <b>Compartir</b> en la barra de Safari.
          </Step>
          <Step n={2}>
            Elegí <FiPlusSquare className="inline h-4 w-4 align-[-2px]" />{" "}
            <b>Agregar a pantalla de inicio</b>.
          </Step>
          <Step n={3}>
            Tocá <b>Agregar</b>. La app queda en tu inicio como <b>Nature Tours</b>.
          </Step>
        </ol>
      )}

      {plat === "ios-other" && (
        <p>
          En iPhone la app se instala desde <b>Safari</b>. Copiá este link, abrilo en Safari
          y vas a ver los pasos aquí mismo.
        </p>
      )}

      {plat === "android" &&
        (prompt ? (
          <button
            type="button"
            onClick={install}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700"
          >
            <FiDownload className="h-4 w-4" /> Instalar app
          </button>
        ) : (
          <ol className="space-y-2">
            <Step n={1}>
              Abrí el menú <b>⋮</b> de Chrome (arriba a la derecha).
            </Step>
            <Step n={2}>
              Tocá <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.
            </Step>
          </ol>
        ))}
    </div>
  );
}
