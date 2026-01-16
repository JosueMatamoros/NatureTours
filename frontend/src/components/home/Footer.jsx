import { useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi2";
import FAQModal from "../ui/FAQModal";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Tours", to: "/tours" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Services", to: "/services" },
];

export default function Footer() {
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    <>
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
            {/* Logo & Name */}
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="/logo.webp"
                  alt="Nature Tours"
                  className="h-14 w-14"
                />
                <span className="text-xl font-bold text-gray-900">
                  Nature Tours
                </span>
              </Link>
              <p className="text-sm text-gray-500">
                Eco tours • Wildlife • Adventure
              </p>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => setFaqOpen(true)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                FAQ
              </button>
            </nav>
          </div>

          {/* Divider */}
          <div className="my-8 h-px bg-gray-200" />

          {/* Copyright & Credits */}
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Nature Tours La Fortuna.
            </p>
            <div className="flex flex-col items-center gap-1 sm:items-end">
              <p className="text-sm text-gray-500">
                Designed & developed by{" "}
                <a
                  href="mailto:josuematamoros.dev@gmail.com"
                  className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Josué Matamoros
                </a>
              </p>
              <a
                href="mailto:josuematamoros.dev@gmail.com"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                josuematamoros.dev@gmail.com
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* FAQ Modal */}
      <FAQModal isOpen={faqOpen} onClose={() => setFaqOpen(false)} />
    </>
  );
}
