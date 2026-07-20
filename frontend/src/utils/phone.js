// src/utils/phone.js
export const COMPANY_WHATSAPP_E164 = "50661824352";

// Convierte un teléfono guardado en BD (8 dígitos de Costa Rica, sin código
// de país) a formato E.164 para wa.me. Si no hay teléfono, cae al de la
// empresa.
export function toWhatsAppE164(phone, fallback = COMPANY_WHATSAPP_E164) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length === 8) return `506${digits}`;
  return digits || fallback;
}
