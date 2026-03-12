-- 021: Buyer Persona — customer demographic profiles
-- 1:1 extension of rv_clients for demographic/CRM data.

CREATE TABLE IF NOT EXISTS rv_client_profiles (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                 uuid NOT NULL UNIQUE REFERENCES rv_clients(id) ON DELETE CASCADE,
  gender                    text CHECK (gender IS NULL OR gender IN ('M','F','Otro')),
  birth_date                date,
  education_level           text,
  purchase_type             text CHECK (purchase_type IS NULL OR purchase_type IN ('uso_propio','inversion')),
  marital_status            text,
  children_count            integer CHECK (children_count IS NULL OR children_count >= 0),
  department                text,
  zone                      text,
  occupation_type           text CHECK (occupation_type IS NULL OR occupation_type IN ('formal','informal','independiente','empresario')),
  industry                  text,
  monthly_income_individual numeric(14,2),
  monthly_income_family     numeric(14,2),
  acquisition_channel       text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rv_client_profiles_client ON rv_client_profiles (client_id);

-- RLS
ALTER TABLE rv_client_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read client profiles"
  ON rv_client_profiles FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY "Service role manages client profiles"
  ON rv_client_profiles FOR ALL USING (auth.role() = 'service_role');

-- updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_rv_client_profiles
    BEFORE UPDATE ON rv_client_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
