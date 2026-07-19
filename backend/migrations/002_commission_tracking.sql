-- 002_commission_tracking.sql
-- Tracking de comisiones por payment de reseller:
--   commission_amount: snapshot del monto al momento del pago (por si la
--   comision del reseller cambia despues, las deudas viejas no se mueven).
--   commission_status: pending | paid | no_show
--     - paid: ya se le pago al reseller
--     - no_show: era apartado y los clientes no llegaron (no se paga)

BEGIN;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS commission_amount numeric;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS commission_status text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS commission_paid_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_commission_status_check'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_commission_status_check
      CHECK (commission_status IN ('pending', 'paid', 'no_show'));
  END IF;
END $$;

COMMIT;
