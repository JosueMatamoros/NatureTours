// Hash/verify de contraseñas sin dependencias externas (scrypt de node:crypto).
// Formato almacenado: "scrypt$<salt_hex>$<hash_hex>".
import crypto from "crypto";

export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(plain), salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(plain, stored) {
  if (!stored || typeof stored !== "string") return false;
  const [alg, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const test = crypto.scryptSync(String(plain), salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(test, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
