import { FiUser, FiPhone, FiMail } from "react-icons/fi";

export default function ContactForm({
  fullName,
  setFullName,
  phone,
  setPhone,
  email,
  setEmail,
  touched,
  setTouched,
  fullNameValid,
  phoneValid,
  emailValid,
  inputClass,
  showError,
}) {
  return (
    <div className="px-8 pb-6 ">
      {/* Full Name */}
      <label className="block text-sm font-semibold text-gray-800">
        Full name <span className="text-red-500">*</span>
      </label>
      <div className={inputClass(fullNameValid, showError("fullName"))}>
        <FiUser className="h-5 w-5 text-gray-400" />
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
          placeholder="Your full name"
          className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
          autoComplete="name"
          inputMode="text"
        />
      </div>
      {showError("fullName") && !fullNameValid ? (
        <p className="mt-2 text-xs text-red-600">
          The name can only contain letters and spaces (no numbers or symbols).
        </p>
      ) : null}

      {/* Phone */}
      <label className="mt-5 block text-sm font-semibold text-gray-800">
        Phone number
      </label>
      <div className={inputClass(phoneValid, showError("phone"))}>
        <FiPhone className="h-5 w-5 text-gray-400" />
        <input
          value={phone}
          onChange={(e) => {
            const next = e.target.value;
            if (/^[0-9+\s-]*$/.test(next)) setPhone(next);
          }}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          placeholder="+1 (415) 555-2671"
          className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
          autoComplete="tel"
          inputMode="tel"
        />
      </div>
      {showError("phone") && !phoneValid ? (
        <p className="mt-2 text-xs text-red-600">
          The phone number cannot contain letters and must be between 8 and 15 digits.
        </p>
      ) : null}

      {/* Email */}
      <label className="mt-5 block text-sm font-semibold text-gray-800">
        Email address <span className="text-red-500">*</span>
      </label>
      <div className={inputClass(emailValid, showError("email"))}>
        <FiMail className="h-5 w-5 text-gray-400" />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="you@email.com"
          className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
          autoComplete="email"
          inputMode="email"
        />
      </div>
      {showError("email") && !emailValid ? (
        <p className="mt-2 text-xs text-red-600">
          Enter a valid email like{" "}
          <span className="font-semibold">name@domain.com</span>.
        </p>
      ) : null}
    </div>
  );
}
