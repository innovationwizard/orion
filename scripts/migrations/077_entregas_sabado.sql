-- ============================================================================
-- Migration 077: Entregas — sábado es día hábil, domingo no
-- ============================================================================
-- El tablero pasa de lunes–viernes a lunes–sábado. `entrega_citas.fecha` ya
-- era un date sin restricción de día: un sábado se podía guardar y el
-- tablero lo omitía. Este CHECK cierra el domingo. El sábado (ISODOW 6)
-- queda permitido.
--
-- El cupo de 4 visitas por día sigue siendo una guía de la interfaz.
-- No se reescriben filas. Las citas existentes son lunes–viernes.
--
-- Correr este archivo completo en el SQL editor de Supabase.
-- Puede correr antes o después del código que muestra el sábado.
-- Idempotente.
-- ============================================================================

DO $$
DECLARE
  domingos integer;
BEGIN
  SELECT count(*) INTO domingos
  FROM entrega_citas
  WHERE EXTRACT(ISODOW FROM fecha) = 7;

  IF domingos > 0 THEN
    RAISE EXCEPTION
      'Hay % cita(s) en domingo. Muévalas antes de agregar entrega_citas_fecha_habil.',
      domingos;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'entrega_citas_fecha_habil'
      AND conrelid = 'public.entrega_citas'::regclass
  ) THEN
    ALTER TABLE entrega_citas
      ADD CONSTRAINT entrega_citas_fecha_habil
      CHECK (EXTRACT(ISODOW FROM fecha) BETWEEN 1 AND 6);
  END IF;
END $$;

COMMENT ON COLUMN entrega_citas.fecha IS
  'Día de la cita. Lunes a sábado (ISODOW 1–6). El domingo lo rechaza entrega_citas_fecha_habil. El cupo de 4 visitas por día es una guía de la interfaz, no una restricción.';
