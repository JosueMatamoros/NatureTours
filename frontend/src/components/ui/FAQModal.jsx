import { useState, useEffect } from "react";
import { HiXMark, HiPlus, HiMinus } from "react-icons/hi2";

const FAQS = [
  {
    question: "Is prior horseback riding experience required?",
    answer:
      "No prior experience is required. Before the tour begins, the guide will explain how to handle the horse, which is very simple and easy to learn. The tour is suitable for beginners, including people with no previous riding experience and children.",
  },
  {
    question: "Is the horseback riding tour suitable for kids?",
    answer:
      "Yes, the tour is fully suitable for children. We recommend an age of 12 years old for kids to ride on their own horse. However, the final decision is always up to the parents, and children may ride independently or together with an adult.",
  },
  {
    question: "Do children pay a different price for the tour?",
    answer:
      "Yes. Children who ride on their own horse pay the full tour price. If a child rides together with a parent, there is no additional cost for the child.",
  },
  {
    question: "Is the horseback riding tour safe?",
    answer:
      "The tour is very safe. All horses are well trained, calm, and gentle. Most of the trails are easy and relaxed, which makes the risk of accidents very low. Guests are accompanied by a guide at all times during the experience.",
  },
  {
    question: "What will we see during the horseback riding tour?",
    answer:
      "During the tour, you will enjoy beautiful landscapes including forests, rivers, and open countryside. You may see domestic animals and, with some luck, local wildlife. The tour includes stops at locations chosen by the guests, and we highly recommend stopping near the rivers to relax and enjoy the scenery.",
  },
  {
    question: "How long does the horseback riding tour last?",
    answer:
      "The horseback riding tour is planned to last approximately 2 hours, including safety instructions and the route itself, always at a relaxed pace. However, guests control the rhythm of the tour. Depending on how many breaks or photo stops you choose to take, the tour can be extended and last longer.",
  },
  {
    question: "What should I wear for the horseback riding tour?",
    answer:
      "We recommend wearing comfortable clothing, long pants, and closed-toe shoes such as hiking shoes or boots. Sunscreen and insect repellent are highly recommended. We also suggest bringing extra clothing, especially if you plan to stop near the river.",
  },
  {
    question: "What happens if it rains?",
    answer:
      "The tour operates normally in rainy conditions. In fact, we consider riding through the forest while it is raining to be a unique and special experience. The environment becomes more peaceful, and the landscape looks completely different, making the tour even more relaxing.",
  },
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 py-4 text-left transition-colors"
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
            open ? "bg-emerald-600 text-white" : "bg-emerald-600 text-white"
          }`}
        >
          {open ? (
            <HiMinus className="h-4 w-4" />
          ) : (
            <HiPlus className="h-4 w-4" />
          )}
        </span>
        <span className="text-sm font-semibold text-gray-900">{question}</span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-4 pl-11 text-sm leading-relaxed text-gray-600">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQModal({ isOpen, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <HiXMark className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(85vh - 73px)" }}>
          <div className="grid gap-0 md:grid-cols-1">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { FAQS };
