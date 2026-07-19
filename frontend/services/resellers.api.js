// src/services/resellers.api.js
import { api } from "./api";

export function getResellerById(resellerId) {
  if (!resellerId) throw new Error("resellerId requerido");
  return api.get(`/api/resellers/${resellerId}`);
}
