-- 001_resellers.sql
-- Sistema de resellers: tabla resellers, reseller_id en bookings/payments,
-- y trigger de montos con descuento (30 - commission)%.

BEGIN;

-- Tabla de resellers. El id es un UUID (dificil de adivinar) que se usa
-- como link publico: /reseller/<id>
CREATE TABLE IF NOT EXISTS resellers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text,
  phone       text,
  -- Porcentaje de comision que el reseller quiere ganar (0-30).
  -- El descuento al cliente es (30 - commission)%.
  commission  integer NOT NULL CHECK (commission >= 0 AND commission <= 30),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Venta hecha por un reseller. NULL = venta propia.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reseller_id uuid REFERENCES resellers(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reseller_id uuid REFERENCES resellers(id);

-- Trigger de montos: igual que antes, pero si el booking tiene reseller_id
-- aplica el descuento (30 - commission)% a los precios de adulto y nino.
CREATE OR REPLACE FUNCTION public.bookings_calculate_amounts()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  adult_price  numeric(10,2);
  kid_price    numeric(10,2);
  discount_pct numeric(5,2) := 0;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.tour_id = OLD.tour_id
     AND COALESCE(NEW.adults, 0)   = COALESCE(OLD.adults, 0)
     AND COALESCE(NEW.children, 0) = COALESCE(OLD.children, 0)
     AND COALESCE(NEW.babies, 0)   = COALESCE(OLD.babies, 0)
     AND NEW.reseller_id IS NOT DISTINCT FROM OLD.reseller_id
  THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  SELECT price, COALESCE(child_price, price)
    INTO adult_price, kid_price
    FROM tours WHERE id = NEW.tour_id;

  IF adult_price IS NULL THEN
    RAISE EXCEPTION 'Invalid tour_id: %', NEW.tour_id;
  END IF;

  -- Descuento del reseller: (30 - commission)%
  IF NEW.reseller_id IS NOT NULL THEN
    SELECT GREATEST(30 - commission, 0)
      INTO discount_pct
      FROM resellers WHERE id = NEW.reseller_id;

    IF discount_pct IS NULL THEN
      RAISE EXCEPTION 'Invalid reseller_id: %', NEW.reseller_id;
    END IF;

    adult_price := round(adult_price * (100 - discount_pct) / 100, 2);
    kid_price   := round(kid_price   * (100 - discount_pct) / 100, 2);
  END IF;

  NEW.adults   := GREATEST(COALESCE(NEW.adults, 1), 1);
  NEW.children := GREATEST(COALESCE(NEW.children, 0), 0);
  NEW.babies   := GREATEST(COALESCE(NEW.babies, 0), 0);

  -- guests = espacios ocupados (capacidad)
  NEW.guests := NEW.adults + NEW.children;

  -- subtotal = adultos + ninos (bebes gratis)
  NEW.subtotal := round(adult_price * NEW.adults + kid_price * NEW.children, 2);

  -- fee fijo 5.4%
  NEW.paypal_fee := round(NEW.subtotal * 0.054, 2);

  -- total = subtotal + fee
  NEW.total := round(NEW.subtotal + NEW.paypal_fee, 2);

  -- deposit 20% del subtotal
  NEW.deposit_amount := round(NEW.subtotal * 0.2, 2);

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

COMMIT;
