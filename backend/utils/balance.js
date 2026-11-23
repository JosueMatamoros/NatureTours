// Saldo pendiente de una reserva (lo que falta cobrar el día del tour).
// La fila necesita: subtotal, source, manual_paid, paid_override, pay_mode,
// pay_amount y deposit_amount.
//   - manual:         subtotal − manual_paid
//   - paid_override:  subtotal − lo que el admin registró como pagado
//                     (se fija al editar personas o el monto pagado)
//   - deposit (web):  subtotal − lo que REALMENTE se cobró en línea
//                     (pay_amount; no deposit_amount, que el trigger recalcula
//                     al cambiar personas)
//   - full / OTA:     0
const round2 = (n) => Math.round(Number(n) * 100) / 100;

export function computeBalanceDue(row) {
  const subtotal = Number(row.subtotal || 0);
  if (row.source === "manual") {
    return Math.max(round2(subtotal - Number(row.manual_paid || 0)), 0);
  }
  if (row.paid_override != null) {
    return Math.max(round2(subtotal - Number(row.paid_override)), 0);
  }
  if (row.pay_mode === "deposit") {
    const paid = Number(row.pay_amount ?? row.deposit_amount ?? 0);
    return Math.max(round2(subtotal - paid), 0);
  }
  return 0;
}

// Lo ya pagado, en las mismas unidades que el subtotal (sin el fee).
export function computePaid(row) {
  return Math.max(round2(Number(row.subtotal || 0) - computeBalanceDue(row)), 0);
}
