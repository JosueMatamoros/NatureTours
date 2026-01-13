import React from "react";
import CancellationTermsModal from "../ui/CancellationTermsModal";
import WhatsAppButton from "../ui/WhatsAppButton";

export default function ContactInfoPanel({
  phoneDisplay = "+506 8989 3333",
  phoneE164 = "50689893333",
  whatsappMessage = "Hello, I would like more information about the tour.",
  servicesHref = "/services",
}) {
  const whatsappUrl = `https://wa.me/${phoneE164}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const [showCancellation, setShowCancellation] = React.useState(false);

  return (
    <aside className="h-full space-y-4">
      <WhatsAppButton />
      <div className="rounded-2xl bg-neutral-900 text-white p-6 shadow-lg">
        <div className="text-xs tracking-widest uppercase text-white/60">
          Línea directa
        </div>

        <h3 className="mt-1 text-xl font-extrabold">
          ¿No encontraste disponibilidad?
        </h3>

        <p className=" text-sm text-white/70 leading-relaxed">
          Llámanos y podemos ayudarte a liberar espacios
        </p>

        <div className="mt-2 space-y-3">
          <a
            href={`tel:+${phoneE164}`}
            className="block text-3xl font-extrabold tracking-tight hover:text-white/90"
          >
            {phoneDisplay}
          </a>

          <div className="flex flex-wrap gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
            >
              WhatsApp
            </a>

            <a
              href={`tel:+${phoneE164}`}
              className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Llamar
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h4 className="text-base font-extrabold text-gray-900">
          Información importante
        </h4>

        <div className="mt-4 grid gap-4 text-sm text-gray-600">
          <div className="rounded-xl p-4 border border-gray-100">
            <div className="font-semibold text-gray-900">
              Servicios adicionales
            </div>
            <p className="mt-1">
              Si necesita agregar algún servicio extra, indíquelo en el
              comentario.{" "}
              <a href={servicesHref} className="underline text-gray-900">
                Ver todos los servicios
              </a>
            </p>
          </div>

          <div className="rounded-xl p-4 border border-gray-100">
            <div className="font-semibold text-gray-900">
              ¿Ya tiene una reserva?
            </div>
            <p className="mt-1">
              Mencione el número o detalles para ayudarle más rápido.
            </p>
          </div>

          <div className="rounded-xl p-4 border border-gray-100">
            <div className="font-semibold text-gray-900">
              Políticas de cancelación
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                En caso de no presentarse, <b>no se realizará devolución</b>.
              </li>
              <li>
                <b>No se aceptan cancelaciones</b> por motivos climáticos.
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setShowCancellation(true)}
              className="mt-2 ml-2 inline-block underline text-gray-900 hover:text-gray-700"
            >
              Ver políticas de cancelación
            </button>
          </div>
          <div className=" rounded-2xl bg-emerald-50 p-4">
            <h4 className="text-sm font-extrabold text-emerald-900">
              Precios finales · impuestos incluidos
            </h4>

            <p className="mt-1 text-xs text-emerald-900/80 leading-relaxed">
              Todos nuestros precios son finales, sin cargos ocultos. Somos una
              familia local, no una empresa comercial, y ofrecemos un trato
              justo y honesto a cada visitante.
            </p>
          </div>
        </div>
      </div>

      <CancellationTermsModal
        open={showCancellation}
        onClose={() => setShowCancellation(false)}
      />
    </aside>
  );
}
