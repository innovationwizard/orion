-- ============================================================================
-- Fix: Recalculate commissions on any relevant row change
-- Run in Supabase SQL Editor.
-- ============================================================================
-- 1) Payments: recalc when a payment is inserted OR updated (amount, type, date).
-- 2) Sales: recalc all commissions for that sale's payments when the sale row
--    changes (e.g. deed_signed_date, referral_applies, sales_rep_id).
-- ============================================================================

-- 1. Payments: fire on INSERT and UPDATE
DROP TRIGGER IF EXISTS auto_calculate_commissions ON payments;

CREATE TRIGGER auto_calculate_commissions
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_commissions();

COMMENT ON TRIGGER auto_calculate_commissions ON payments IS
  'Recalculates commissions for this payment when it is inserted or updated.';

-- 2. Sales: when a sale is updated, recalc commissions for all its payments
CREATE OR REPLACE FUNCTION public.trigger_recalc_commissions_on_sale_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  PERFORM calculate_commissions(p.id)
  FROM payments p
  WHERE p.sale_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_recalc_commissions_on_sale_update ON sales;

CREATE TRIGGER auto_recalc_commissions_on_sale_update
  AFTER UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalc_commissions_on_sale_change();

COMMENT ON TRIGGER auto_recalc_commissions_on_sale_update ON sales IS
  'When a sale is updated (e.g. deed_signed_date, referral_applies, sales_rep_id), recalculates commissions for all payments of that sale.';
