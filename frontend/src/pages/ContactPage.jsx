import { useState } from "react";
import { useLocation } from "react-router-dom";
import ContactForm from "../components/contact/ContactForm";
import ContactInfoPanel from "../components/contact/ContactInfoPanel";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";

export default function ContactPage() {
  const location = useLocation();
  const initialMessage = location.state?.message || "";

  return (
    <div>
      <Navbar variant="solid" />
      <main className="mx-auto w-[min(1100px,92%)] py-10">
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="h-full">
            <ContactInfoPanel
              phoneDisplay="+506 8989 3335"
              phoneE164="50689893335"
              servicesHref="/services"
              policiesHref="/policies"
              whatsappMessage="Hello, I would like more information about the tour."
            />
          </div>

          <div className="h-full">
            <ContactForm
              initialMessage={initialMessage}
              onSubmit={(data) => {
                console.log("submit contact:", data);
              }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
