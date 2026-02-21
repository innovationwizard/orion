-- ============================================================================
-- RPC: count_by_project — used by ETL verify step
-- ============================================================================
-- Returns row count for a table filtered by project_id.
-- For sales: direct project_id. For payments: via sale → project_id.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.count_by_project(
  p_table_name text,
  p_proj_id uuid
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count bigint;
BEGIN
  IF p_table_name = 'sales' THEN
    SELECT COUNT(*) INTO v_count FROM sales WHERE project_id = p_proj_id;
  ELSIF p_table_name = 'payments' THEN
    SELECT COUNT(*) INTO v_count
    FROM payments p
    JOIN sales s ON p.sale_id = s.id
    WHERE s.project_id = p_proj_id;
  ELSE
    RAISE EXCEPTION 'count_by_project: unsupported table %', p_table_name;
  END IF;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.count_by_project(text, uuid) IS
  'Returns row count for sales or payments filtered by project_id. Used by ETL verify.';
