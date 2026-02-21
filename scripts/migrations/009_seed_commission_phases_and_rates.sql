-- ============================================================================
-- Seed: commission_phases + commission_rates (fallback)
-- ============================================================================
-- Required for calculate_commissions. Run when preflight checks 5 and 10 fail.
-- ============================================================================

-- 1. Commission phases (30% + 30% + 40% = 100%)
INSERT INTO public.commission_phases (phase, name, percentage, description)
SELECT 1, 'Promise Signed', 0.30, '30% upon reservation + signed promise'
WHERE NOT EXISTS (SELECT 1 FROM commission_phases WHERE phase = 1);
INSERT INTO public.commission_phases (phase, name, percentage, description)
SELECT 2, 'Down Payment Installment', 0.30, '30% on monthly collections'
WHERE NOT EXISTS (SELECT 1 FROM commission_phases WHERE phase = 2);
INSERT INTO public.commission_phases (phase, name, percentage, description)
SELECT 3, 'Deed Signed', 0.40, '40% upon delivery + bank disbursement'
WHERE NOT EXISTS (SELECT 1 FROM commission_phases WHERE phase = 3);

-- 2. Commission rates (fallback for walk-in, referral, management when no policy)
INSERT INTO public.commission_rates (recipient_id, recipient_name, recipient_type, rate, description, always_paid, active)
SELECT 'walk_in', 'Puerta Abierta', 'special', 0.025, 'Walk-in / Unknown sales', false, true
WHERE NOT EXISTS (SELECT 1 FROM commission_rates WHERE recipient_id = 'walk_in' AND recipient_type = 'special');

INSERT INTO public.commission_rates (recipient_id, recipient_name, recipient_type, rate, description, always_paid, active)
SELECT 'referral', 'Referral Bonus', 'special', 0.01, 'Referral commission (fallback)', false, true
WHERE NOT EXISTS (SELECT 1 FROM commission_rates WHERE recipient_id = 'referral' AND recipient_type = 'special');

INSERT INTO public.commission_rates (recipient_id, recipient_name, recipient_type, rate, description, always_paid, active)
SELECT 'ahorro', 'Ahorro', 'special', 0.0035, 'Savings pool (fallback)', true, true
WHERE NOT EXISTS (SELECT 1 FROM commission_rates WHERE recipient_id = 'ahorro' AND recipient_type = 'special');

INSERT INTO public.commission_rates (recipient_id, recipient_name, recipient_type, rate, description, always_paid, active)
SELECT 'ahorro_por_retiro', 'Ahorro por Retiro', 'special', 0, 'Redirects rep commission when payment_date > contract end', false, true
WHERE NOT EXISTS (SELECT 1 FROM commission_rates WHERE recipient_id = 'ahorro_por_retiro');

INSERT INTO public.commission_rates (recipient_id, recipient_name, recipient_type, rate, description, always_paid, active)
SELECT 'otto_herrera', 'Otto Herrera', 'management', 0.006, 'Dirección General', true, true
WHERE NOT EXISTS (SELECT 1 FROM commission_rates WHERE recipient_id = 'otto_herrera');
INSERT INTO public.commission_rates (recipient_id, recipient_name, recipient_type, rate, description, always_paid, active)
SELECT 'alek_hernandez', 'Alek Hernández', 'management', 0.003, 'Gerencia Comercial', true, true
WHERE NOT EXISTS (SELECT 1 FROM commission_rates WHERE recipient_id = 'alek_hernandez');
INSERT INTO public.commission_rates (recipient_id, recipient_name, recipient_type, rate, description, always_paid, active)
SELECT 'ahorro_comercial', 'Ahorro G. Comercial', 'management', 0.002, 'Ahorro G. Comercial', true, true
WHERE NOT EXISTS (SELECT 1 FROM commission_rates WHERE recipient_id = 'ahorro_comercial');
INSERT INTO public.commission_rates (recipient_id, recipient_name, recipient_type, rate, description, always_paid, active)
SELECT 'antonio_rada', 'Supervisor / Antonio R.', 'management', 0.0025, 'Supervisor Comercial', true, true
WHERE NOT EXISTS (SELECT 1 FROM commission_rates WHERE recipient_id = 'antonio_rada');
