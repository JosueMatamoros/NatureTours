import { useState } from "react";
import ContactForm from "../components/contact/ContactForm";
import ContactInfoPanel from "../components/contact/ContactInfoPanel";
import Navbar from "../components/home/Navbar";

export default function ContactPage() {
  const [showInfoMobile, setShowInfoMobile] = useState(false);

  return (
    <div>
      <Navbar variant="solid" />
      <main className="mx-auto w-[min(1100px,92%)] py-10">
        <div className="mb-4 lg:hidden">
          <button
            type="button"
            onClick={() => setShowInfoMobile((v) => !v)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            {showInfoMobile ? "Ocultar información" : "Mostrar información"}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div
            className={`${showInfoMobile ? "block" : "hidden"} lg:block h-full`}
          >
            <ContactInfoPanel
              phoneDisplay="+506 8989 3333"
              phoneE164="50689893333"
              servicesHref="/services"
              policiesHref="/policies"
              whatsappMessage="Hello, I would like more information about the tour."
            />
          </div>

          {/* Right: form */}
          <div className="h-full">
            <ContactForm
              onSubmit={(data) => {
                console.log("submit contact:", data);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
