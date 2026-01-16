import React from "react";
import CancellationTermsModal from "../ui/CancellationTermsModal";
import WhatsAppButton from "../ui/WhatsAppButton";

export default function ContactInfoPanel({
  phoneDisplay = "+506 8989 3335",
  phoneE164 = "50689893335",
  whatsappMessage = "Hello, I would like more information about the tour.",
  servicesHref = "/services",
  policiesHref = "/policies", // optional, in case you use it later
}) {
  const whatsappUrl = `https://wa.me/${phoneE164}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const [showCancellation, setShowCancellation] = React.useState(false);

  // Mobile-only toggle for the white info card
  const [showImportantMobile, setShowImportantMobile] = React.useState(false);

  return (
    <aside className="h-full space-y-4">
      <WhatsAppButton />
      <div className="rounded-2xl border border-emerald-50 bg-emerald-50   p-6 shadow-lg">
        <div className="text-xs tracking-widest uppercase ">
          Direct line
        </div>

        <h3 className="mt-1 text-xl font-extrabold">
          Couldn&apos;t find availability?
        </h3>

        <p className="text-sm  leading-relaxed">
          Call us and we can help you open up spots
        </p>

        <div className="mt-2 space-y-3">
          <a
            href={`tel:+${phoneE164}`}
            className="block text-3xl font-extrabold tracking-tight "
          >
            {phoneDisplay}
          </a>

          <div className="flex flex-wrap gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-2xl bg-emerald-700 px-6 py-3 text-white text-sm font-semibold  transition-all duration-300 hover:scale-105 hover:bg-emerald-800"
            >
              WhatsApp
            </a>

            <a
              href={`tel:+${phoneE164}`}
              className="inline-flex items-center justify-center rounded-xl  px-4 py-2 text-sm font-semibold text-emerald-900/80 border transition-all duration-300 hover:bg-emerald-50 hover:text-emerald-900 hover:scale-105"
            >
              Call
            </a>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setShowImportantMobile((v) => !v)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          {showImportantMobile ? "Hide information" : "Show information"}
        </button>
      </div>

      <div className={`${showImportantMobile ? "block" : "hidden"} lg:block`}>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h4 className="text-base font-extrabold text-gray-900">
            Important information
          </h4>

          <div className="mt-4 grid gap-4 text-sm text-gray-600">
            <div className="rounded-xl p-4 border border-gray-100">
              <div className="font-semibold text-gray-900">
                Additional services
              </div>
              <p className="mt-1">
                If you need to add any extra service, mention it in the comment.{" "}
                <a href={servicesHref} className="underline text-gray-900">
                  View all services
                </a>
              </p>
            </div>

            <div className="rounded-xl p-4 border border-gray-100">
              <div className="font-semibold text-gray-900">
                Already have a booking?
              </div>
              <p className="mt-1">
                Mention the booking number or details so we can help you faster.
              </p>
            </div>

            <div className="rounded-xl p-4 border border-gray-100">
              <div className="font-semibold text-gray-900">
                Cancellation policies
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  In case of no-show, <b>no refund will be issued</b>.
                </li>
                <li>
                  <b>No cancellations are accepted</b> due to weather
                  conditions.
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setShowCancellation(true)}
                className="mt-2 ml-2 inline-block underline text-gray-900 hover:text-gray-700"
              >
                View cancellation policies
              </button>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <h4 className="text-sm font-extrabold text-emerald-900">
                Final prices · taxes included
              </h4>

              <p className="mt-1 text-xs text-emerald-900/80 leading-relaxed">
                All our prices are final, with no hidden fees. We&apos;re a
                local family, not a commercial company, and we offer fair and
                honest treatment to every visitor.
              </p>
            </div>
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
