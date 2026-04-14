# ANATOMOS — Master Scaffolding

## THE MISSION

**Have every required document complete, correct, and ready BEFORE the estimated delivery date arrives.**

For 298 units in Boulevard 5 (and eventually ~300 in Benestare), across 7 phases of the real estate lifecycle, with 5–7 deliveries per day at peak, involving two coordinadoras (Andrea, Alma), one compliance officer (Isaac), a legal team (Emilia, Julio Aguilar), and dozens of sales reps filling forms by hand.

---

## 1. DOMAIN MODEL — What Exists in Reality

### 1.1 The Unit (the atomic entity everything hangs off)

Every unit in Boulevard 5 has:

- **Identity:** Apartment number (101–1905), level (1–19), tower (única)
- **Property:** Model/type (A4.1, B6.1, E1.1, etc.), area interior m², area jardín m², area total m²
- **Fincas:** Up to 3 registered properties per unit — apartamento + parqueo + bodega, each with its own finca/folio/libro in the Registro de la Propiedad (748 fincas total, currently in a flat unsorted list)
- **Financial:** Precio de venta, enganche %, reserva amount, CPI schedule (cuotas with dates/amounts), monto a financiar, 70/30 split (inmueble vs acciones condominio)
- **Client:** 1–2+ natural persons or juridical entities (S.A.), with possible co-debtors
- **Credit type:** FHA, Contado, Crédito Directo, F&F, Inversionista — each with a DIFFERENT document checklist
- **Delivery month:** Grouped by level — L1 Noviembre, L2–L6 Julio, L5 Agosto, L7–L12 unclear from data, L9 Septiembre, L13 Octubre, L14–L19 unclear
- **Status:** Vendido, Disponible, Reservado, Desistido
- **Coordinadora:** Andrea González or Alma Soto

### 1.2 The Client

- DPI (CUI) number — the unique key for Guatemalan citizens
- Full names, apellidos, apellido de casada
- DOB, birthplace, nationality, marital status, gender
- Address (residential + notification + work)
- NIT, profession, employer, income
- PEP status (4 declarations)
- Fund source (propios, tercero, or both)
- Second applicant (spouse, parent, sibling) — same field set
- Juridical entity (razón social, NIT, actividad, régimen ISR, agente retenedor IVA)

### 1.3 The Document Universe

From the uploaded files, interviews, and process diagram, here is the **complete document inventory** per unit:

#### PHASE 1 — Sale & Reservation (Pati's domain)
| # | Document | Source | Auto-fillable? |
|---|----------|--------|----------------|
| 1 | **DCI** (Documento de Condiciones Iniciales) | Sales rep fills manually in .xls | **YES — THIS IS THE MVP** |
| 2 | **Cotización firmada** | Generated from Cotizador Excel | YES — from DB |
| 3 | **Carta de reserva** | Generated manually | YES — from DB |
| 4 | **Promesa de Compra-Venta (PCV)** | Pati elaborates | PARTIAL — template + data |
| 5 | Declaración lícita de fondos | Compliance annex | PARTIAL |
| 6 | Carta de pago | Compliance annex | PARTIAL |
| 7 | Copia DPI (ambos solicitantes) | Client provides | NO — upload only |
| 8 | Copia RTU | Client provides | NO — upload only |
| 9 | Recibo de servicios | Client provides | NO — upload only |

#### PHASE 2 — Compliance (Isaac's domain)
| # | Document | Source | Auto-fillable? |
|---|----------|--------|----------------|
| 10 | **Consulta OFAC** | ofac.treasury.gov | **YES — automated lookup** |
| 11 | **Consulta ONU** | un.org sanctions list | **YES — automated lookup** |
| 12 | **Consulta Guatecompras** | guatecompras.gt | **YES — automated lookup** |

#### PHASE 3 — Credit Application (Andrea/Alma's domain, THE BIG PAIN)
| # | Document | Source | Auto-fillable? |
|---|----------|--------|----------------|
| 13 | **Solicitud de Resguardo de Asegurabilidad (Formulario Verde)** — RA-RG-01 | FHA form, 2 pages | **YES — from DCI + DB** |
| 14 | **Autorización Consulta Buros de Crédito** — RA-RG-05 | FHA form, 1 page | **YES — name + DPI + municipio** |
| 15 | **Declaración de Consentimiento** — RA-RG-14 | FHA form, 2 pages | **YES — names + DOB + address** |
| 16 | **Declaración de Salud** — RA-RG-13 | FHA form, 2 pages (Sección A + B) | **PARTIAL — header only, health questions are handwritten** |
| 17 | **Formulario Mandatario** | FHA form, 1 page | **YES — if mandatario exists** |
| 18 | Bank-specific forms | Varies per bank (BI, CHN, BAC, etc.) | NO — unknown templates |
| 19 | Constancia laboral | Client's employer provides | NO — upload only |
| 20 | Recibos de sueldo (3 meses) | Client provides | NO — upload only |
| 21 | Estados de cuenta bancarios | Client provides | NO — upload only |

#### PHASE 4 — Guarantee Approval (Developer side)
| # | Document | Source | Auto-fillable? |
|---|----------|--------|----------------|
| 22 | Planos de ubicación | FORMA (construction arm) | NO — exists already |
| 23 | Planos acotados | FORMA | NO — exists already |
| 24 | Certificaciones | Legal | NO — exists already |
| 25 | Régimen de propiedad horizontal | Legal | NO — exists already, it's the fincas file |

#### PHASE 5 — Escrituración (Isaac builds the formato, Legal executes)
| # | Document | Source | Auto-fillable? |
|---|----------|--------|----------------|
| 26 | **Formato para Escrituración** | Isaac's Excel — client + unit + fincas + pagos + 70/30 split | **YES — from DB + Odoo + Fincas file** |
| 27 | Minuta (Word) | Legal (Emilia) drafts from formato | PARTIAL — template + data injection |
| 28 | Póliza de seguro de daños | Insurance provider | NO — upload only |
| 29 | Resolución bancaria | Bank provides | NO — upload only |

#### PHASE 6 — Delivery
| # | Document | Source | Auto-fillable? |
|---|----------|--------|----------------|
| 30 | Título de acción | Legal generates | NO |
| 31 | Título de agua | Legal generates | NO |
| 32 | Recibo IUSI al día | Municipalidad | NO |
| 33 | USB con documentos | Compilation of all above | YES — system generates the bundle |

**Total: 33 document types per unit. Of these, ~15 are auto-fillable from existing data.**

---

## 2. DATA SOURCES — Where the Truth Lives

| Source | What it holds | Access method |
|--------|--------------|---------------|
| **PAI APP Supabase** | Unit catalog (project, model, area, price, parqueo, bodega), client identity from DCI ingestion | Direct SQL — same Supabase instance |
| **Odoo (ERP)** | Payment plans, receipts, invoices, estados de cuenta | API or manual CSV export (automated pipeline is a separate project) |
| **Cotizador Excel** | Pricing matrix, enganche %, financing amounts, price history per unit | One-time import → DB seed |
| **Fincas Filiales Excel** | 748 fincas: identification, finca #, folio #, libro, valor inscrito, area | One-time import → DB seed, MUST be mapped (parqueo→apto, bodega→apto) |
| **Entregas Excel** | Master deal list: 298 units, client names, levels, delivery months | One-time import → DB seed |
| **DCI filled .xls** | Per-client identity + financial data from initial sale | Already captured at sale time — lives in physical folders + Odoo |
| **Uploaded photos** | DPI, RTU, Recibo de servicios — variable quality | Claude Vision API extraction |
| **OFAC/ONU/Guatecompras** | Sanctions/PEP screening results | Public web APIs — automated |

### The Finca Mapping Problem (Isaac flagged this explicitly)

The Fincas file has 748 rows: all parqueos first, then all bodegas, then all apartamentos. They are NOT linked. The Cotizador Excel DOES have the mapping (column "No. Bodega" links apto→bodega, column "Parqueo Tandem" or parking number links apto→parqueo, column "Sótano y parqueo" has the parking identifier).

**This mapping must be resolved at import time and stored as a relational link in the DB.** This is a one-time data engineering task but it's critical — every Escrituración formato needs apto + parqueo + bodega fincas aligned.

---

## 3. ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    ANATOMOS                              │
│              Next.js 14 (App Router)                     │
│                   on Vercel                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Dashboard │  │ Unit     │  │ Document │              │
│  │ Delivery  │  │ Detail   │  │ Viewer/  │              │
│  │ Readiness │  │ + Docs   │  │ Generator│              │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘              │
│        │             │             │                     │
│  ┌─────┴─────────────┴─────────────┴────┐               │
│  │       Next.js API Routes (BFF)       │               │
│  │   /api/units, /api/docs, /api/gen    │               │
│  └─────┬──────────┬──────────┬──────────┘               │
│        │          │          │                           │
│  ┌─────┴───┐ ┌────┴────┐ ┌──┴──────────┐               │
│  │Supabase │ │Anthropic│ │  ExcelJS /  │               │
│  │  Auth   │ │   API   │ │  pdf-lib /  │               │
│  │  DB     │ │ (Vision │ │  docx gen   │               │
│  │  Storage│ │  + Chat) │ │             │               │
│  └─────────┘ └─────────┘ └─────────────┘               │
│                                                         │
│  Same Supabase instance as PAI APP                      │
│  Auth: same users, new RLS policies                     │
└─────────────────────────────────────────────────────────┘
```

### Why This Stack

- **Same Supabase instance as PAI APP** — zero data duplication for units/clients, sales reps already have accounts
- **Next.js 14 on Vercel** — consistent with your entire portfolio, SSR for the dashboard, API routes as BFF
- **Anthropic API (Sonnet)** — Claude Vision for document extraction, confidence scoring
- **ExcelJS** — generates .xls/.xlsx matching exact legacy templates (DCI, Formato Escrituración)
- **pdf-lib** — fills the FHA PDF forms programmatically (they're fillable PDFs with form fields)
- **Supabase Storage** — document archive per client, versioned

---

## 4. DATABASE SCHEMA

All tables in the existing PAI APP Supabase instance, prefixed `ana_` to namespace.

```sql
-- ============================================================
-- ANATOMOS SCHEMA
-- ============================================================

-- The unit: the atomic entity
CREATE TABLE ana_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_number TEXT NOT NULL UNIQUE,        -- '101', '1905'
  level INTEGER NOT NULL,                       -- 1–19
  model TEXT,                                   -- 'A4.1', 'B6.1', 'E1.1'
  area_interior_m2 NUMERIC(8,2),
  area_balcon_m2 NUMERIC(8,2),
  area_jardin_m2 NUMERIC(8,2),
  area_total_m2 NUMERIC(8,2),
  
  -- Financial
  precio_venta NUMERIC(12,2),
  enganche_pct NUMERIC(5,4),                    -- 0.05, 0.07, 0.10
  reserva_amount NUMERIC(12,2),
  monto_financiar NUMERIC(12,2),
  
  -- Finca references (resolved from mapping)
  finca_apto_id UUID REFERENCES ana_fincas(id),
  finca_parqueo_id UUID REFERENCES ana_fincas(id),
  finca_bodega_id UUID REFERENCES ana_fincas(id),
  
  -- Delivery
  delivery_month TEXT,                          -- 'Julio 2026', 'Noviembre 2026'
  delivery_status TEXT DEFAULT 'pending',       -- pending, in_progress, delivered
  
  -- Assignment
  coordinadora TEXT,                            -- 'Andrea González', 'Alma Soto'
  credit_type TEXT,                             -- 'FHA', 'CONTADO', 'CREDITO_DIRECTO', 'F&F', 'INVERSIONISTA'
  client_profile TEXT,                          -- 'CLIENTE RETAIL', 'INVERSIONISTA', 'F&F'
  unit_status TEXT DEFAULT 'vendido',           -- vendido, disponible, reservado, desistido
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Registered property (finca) — imported from Fincas Filiales Excel
CREATE TABLE ana_fincas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identification TEXT NOT NULL,                 -- 'PARQUEO 229', 'BODEGA 8', 'APARTAMENTO 101'
  finca_type TEXT NOT NULL,                     -- 'parqueo', 'bodega', 'apartamento'
  finca_number INTEGER NOT NULL,                -- 3487
  folio INTEGER NOT NULL,                       -- 487
  libro TEXT NOT NULL,                          -- '627 E de Propiedad Horizontal de Guatemala'
  valor_inscrito NUMERIC(12,2),
  area_m2 NUMERIC(8,2),
  raw_identifier TEXT                           -- 'S-5_328', 'S-2-130' from cotizador
);

-- Client identity — extracted from DPI/RTU/DCI or entered manually
CREATE TABLE ana_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES ana_units(id),
  applicant_order INTEGER NOT NULL DEFAULT 1,   -- 1 = primary, 2 = secondary, 3 = co-debtor
  
  -- Identity (from DPI / Claude Vision)
  nombres TEXT,
  apellidos TEXT,
  apellido_casada TEXT,
  dpi_cui TEXT,                                 -- '1719 81359 0502'
  dpi_municipio TEXT,
  dpi_departamento TEXT,
  nit TEXT,
  
  -- Personal
  fecha_nacimiento DATE,
  lugar_nacimiento TEXT,
  nacionalidad TEXT DEFAULT 'Guatemala',
  estado_civil TEXT,                            -- 'S', 'C', 'U', 'D'
  genero TEXT,                                  -- 'M', 'F'
  escolaridad TEXT,
  profesion TEXT,
  num_hijos TEXT,
  
  -- Contact
  direccion_residencia TEXT,
  zona_residencia TEXT,
  municipio_residencia TEXT,
  telefono_casa TEXT,
  telefono_celular TEXT,
  email TEXT,
  direccion_notificacion TEXT,
  
  -- Housing
  tipo_vivienda TEXT,                           -- 'propia_individual', 'propia_familiar', 'alquilada'
  destino_propiedad TEXT,                       -- 'inversion', 'habitacion'
  
  -- Employment
  lugar_trabajo TEXT,
  direccion_trabajo TEXT,
  zona_trabajo TEXT,
  municipio_trabajo TEXT,
  telefono_trabajo TEXT,
  email_trabajo TEXT,
  puesto TEXT,
  actividad TEXT,
  ingreso_mensual NUMERIC(12,2),
  fecha_ingreso DATE,
  empresa_propia BOOLEAN DEFAULT FALSE,
  
  -- Income breakdown
  ingreso_puesto NUMERIC(12,2),
  ingreso_alquiler NUMERIC(12,2),
  ingreso_servicios_prof NUMERIC(12,2),
  ingreso_inversiones NUMERIC(12,2),
  ingreso_total NUMERIC(12,2),
  
  -- Compliance
  es_pep BOOLEAN DEFAULT FALSE,
  parentesco_pep BOOLEAN DEFAULT FALSE,
  asociado_pep BOOLEAN DEFAULT FALSE,
  es_cpe BOOLEAN DEFAULT FALSE,                 -- Contratista/Proveedor del Estado
  
  -- Purchase method
  forma_compra TEXT,                            -- 'financiamiento', 'contado'
  fondos_propios BOOLEAN,
  fondos_tercero BOOLEAN,
  
  -- Juridical entity (if applicable)
  es_persona_juridica BOOLEAN DEFAULT FALSE,
  razon_social TEXT,
  nombre_comercial TEXT,
  actividad_empresa TEXT,
  regimen_isr TEXT,
  agente_retenedor_iva BOOLEAN,
  
  -- Extraction metadata
  extraction_source TEXT,                       -- 'claude_vision', 'manual', 'dci_import'
  extraction_confidence JSONB,                  -- per-field confidence scores
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CPI schedule — the enganche payment plan
CREATE TABLE ana_cpi_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES ana_units(id),
  cuota_label TEXT NOT NULL,                    -- 'Reserva', 'Cuota 1', 'Cuota 2'
  cuota_order INTEGER NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  fecha_programada DATE,
  fecha_pago DATE,                              -- actual payment date from Odoo
  recibo_numero TEXT,                           -- receipt number from Odoo
  status TEXT DEFAULT 'pendiente',              -- pendiente, pagado, atrasado
  created_at TIMESTAMPTZ DEFAULT now()
);

-- The document checklist per unit
CREATE TABLE ana_document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_type TEXT NOT NULL,                    -- 'FHA', 'CONTADO', etc.
  document_code TEXT NOT NULL,                  -- 'DCI', 'FORMULARIO_VERDE', 'OFAC', etc.
  document_name TEXT NOT NULL,                  -- Human-readable Spanish name
  phase TEXT NOT NULL,                          -- 'venta', 'cumplimiento', 'credito', 'escrituracion', 'entrega'
  is_required BOOLEAN DEFAULT TRUE,
  is_autofillable BOOLEAN DEFAULT FALSE,
  sort_order INTEGER,
  UNIQUE(credit_type, document_code)
);

-- Actual document status per unit
CREATE TABLE ana_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES ana_units(id),
  requirement_id UUID NOT NULL REFERENCES ana_document_requirements(id),
  
  status TEXT NOT NULL DEFAULT 'missing',       -- missing, uploaded, extracted, filled, reviewed, approved, signed
  
  -- File reference
  storage_path TEXT,                            -- Supabase Storage path
  file_name TEXT,
  file_type TEXT,                               -- 'pdf', 'xls', 'xlsx', 'jpg', 'png'
  file_size_bytes INTEGER,
  
  -- Generation metadata (for auto-filled docs)
  generated_at TIMESTAMPTZ,
  generated_from JSONB,                         -- which data sources were used
  
  -- Review
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Version tracking
  version INTEGER DEFAULT 1,
  supersedes UUID REFERENCES ana_documents(id), -- previous version
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(unit_id, requirement_id, version)
);

-- Compliance screening results
CREATE TABLE ana_compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES ana_clients(id),
  platform TEXT NOT NULL,                       -- 'OFAC', 'ONU', 'GUATECOMPRAS'
  search_query TEXT NOT NULL,                   -- what was searched
  result TEXT NOT NULL,                         -- 'clean', 'hit', 'error'
  result_detail JSONB,                          -- raw response
  screenshot_path TEXT,                         -- Supabase Storage path for evidence
  checked_at TIMESTAMPTZ DEFAULT now(),
  checked_by TEXT                               -- system or user
);

-- Credit application tracking
CREATE TABLE ana_credit_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES ana_units(id),
  
  -- Prequalification
  precalificacion_status TEXT,                  -- 'APROBADA', 'DENEGADA', 'DIFERIDA', null
  precalificacion_date DATE,
  precalificacion_notes TEXT,                   -- reason for denial, RCI details
  banco TEXT,                                   -- 'BI', 'CHN', 'BAC', 'BI-CHN'
  
  -- FHA specific
  caso_fha TEXT,                                -- FHA case number
  resguardo_status TEXT,                        -- 'solicitado', 'aprobado', 'vencido'
  resguardo_fecha DATE,
  resguardo_vencimiento DATE,                   -- 1 year from approval
  
  -- Bank resolution
  resolucion_status TEXT,                       -- 'pendiente', 'aprobada', 'denegada'
  resolucion_date DATE,
  
  -- Escrituración
  formato_escrituracion_ready BOOLEAN DEFAULT FALSE,
  minuta_status TEXT,                           -- 'borrador', 'revision_banco', 'aprobada', 'firmada'
  fecha_firma DATE,
  
  -- Delivery
  entrega_status TEXT,                          -- 'pendiente', 'programada', 'entregada'
  fecha_entrega DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Escrituración format data (the 70/30 split calculation)
CREATE TABLE ana_escrituracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES ana_units(id),
  
  -- 70/30 split
  pct_inmueble NUMERIC(5,4) DEFAULT 0.70,
  pct_acciones NUMERIC(5,4) DEFAULT 0.30,
  
  -- Inmueble (70%)
  inmueble_sin_iva NUMERIC(12,2),
  inmueble_iva NUMERIC(12,2),
  inmueble_con_iva NUMERIC(12,2),
  
  -- Acciones (30%)
  acciones_sin_iva NUMERIC(12,2),
  acciones_timbres NUMERIC(12,2),
  acciones_con_impuestos NUMERIC(12,2),
  
  -- Per-finca breakdown (from formato escrituración)
  finca_details JSONB,                          -- array of {finca_id, tipo, metraje, precio_sin_iva, iva, con_iva}
  
  -- Payment reconciliation from Odoo
  pagado_a_la_fecha NUMERIC(12,2),
  por_pagar_total NUMERIC(12,2),
  por_pagar_banco NUMERIC(12,2),
  por_pagar_cliente NUMERIC(12,2),
  
  -- Legal entity for invoicing
  facturacion_entity TEXT,                      -- 'Inversiones Inmobiliarias Santa Elisa, S.A.'
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log
CREATE TABLE ana_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,                    -- 'unit', 'client', 'document', 'compliance'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,                         -- 'created', 'updated', 'generated', 'reviewed'
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT now(),
  old_value JSONB,
  new_value JSONB
);

-- RLS policies
ALTER TABLE ana_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE ana_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ana_documents ENABLE ROW LEVEL SECURITY;
-- (all tables get RLS — policies defined per role: admin, coordinadora, asesor, legal, viewer)
```

---

## 5. DOCUMENT REQUIREMENTS MATRIX

Seed data for `ana_document_requirements`. This defines WHAT is needed per credit type.

```
CREDIT TYPE  │ PHASE         │ DOCUMENT                              │ AUTO-FILL?
─────────────┼───────────────┼───────────────────────────────────────┼──────────
ALL          │ venta         │ DCI                                   │ YES
ALL          │ venta         │ Cotización firmada                    │ YES
ALL          │ venta         │ Carta de reserva                      │ YES
ALL          │ venta         │ Promesa de Compra-Venta               │ PARTIAL
ALL          │ venta         │ Declaración lícita de fondos          │ PARTIAL
ALL          │ venta         │ Carta de pago                         │ PARTIAL
ALL          │ venta         │ Copia DPI (solicitante 1)             │ NO
ALL          │ venta         │ Copia DPI (solicitante 2, si aplica)  │ NO
ALL          │ cumplimiento  │ Consulta OFAC                         │ YES
ALL          │ cumplimiento  │ Consulta ONU                          │ YES
ALL          │ cumplimiento  │ Consulta Guatecompras                 │ YES
─────────────┼───────────────┼───────────────────────────────────────┼──────────
FHA          │ credito       │ Solicitud Resguardo (Verde) RA-RG-01  │ YES
FHA          │ credito       │ Autorización Buros RA-RG-05           │ YES
FHA          │ credito       │ Declaración Consentimiento RA-RG-14   │ YES
FHA          │ credito       │ Declaración Salud RA-RG-13            │ PARTIAL
FHA          │ credito       │ Formulario Mandatario (si aplica)     │ YES
FHA          │ credito       │ Constancia laboral                    │ NO
FHA          │ credito       │ Recibos de sueldo (3 meses)           │ NO
FHA          │ credito       │ Estados de cuenta bancarios            │ NO
FHA          │ credito       │ Copia RTU                             │ NO
FHA          │ credito       │ Recibo de servicios                   │ NO
─────────────┼───────────────┼───────────────────────────────────────┼──────────
CONTADO      │ credito       │ Promesa/Adenda de pago                │ PARTIAL
CONTADO      │ credito       │ Papelería compra de contado           │ NO
─────────────┼───────────────┼───────────────────────────────────────┼──────────
ALL          │ escrituracion │ Formato para Escrituración            │ YES
ALL          │ escrituracion │ Minuta                                │ PARTIAL
ALL          │ escrituracion │ Póliza seguro de daños                │ NO
FHA          │ escrituracion │ Resolución bancaria                   │ NO
─────────────┼───────────────┼───────────────────────────────────────┼──────────
ALL          │ entrega       │ Recibo IUSI al día                    │ NO
ALL          │ entrega       │ USB con documentos compilados         │ YES
```

---

## 6. CORE FEATURES — Build Order

### Phase 1: Week 1 — Foundation + DCI Auto-fill (Original MVP)

**Day 1: Scaffold + Data Import**
- `npx create-next-app@14 anatomos --app --typescript --tailwind`
- Supabase schema migration (all `ana_` tables)
- Import scripts:
  - `import-entregas.ts` — parse Entregas.xlsx → `ana_units` (298 rows)
  - `import-fincas.ts` — parse Fincas Filiales → `ana_fincas` (748 rows)
  - `import-cotizador.ts` — parse Cotizador → update `ana_units` with pricing + finca mapping
- Auth: reuse PAI APP Supabase Auth, add `anatomos_role` claim

**Day 2: Claude Vision Extraction Pipeline**
- `/api/extract/dpi` — DPI photo → structured JSON (nombres, apellidos, DPI number, municipio, departamento, DOB, gender)
- `/api/extract/rtu` — RTU photo → structured JSON (NIT, dirección fiscal, régimen, actividad)
- `/api/extract/recibo` — Recibo de servicios → structured JSON (dirección, zona, municipio)
- Each returns `{ fields: Record<string, { value: string, confidence: number }> }`
- Store in `ana_clients` with `extraction_confidence` JSONB

**Day 3: Unit Selector + Financial Engine**
- Unit dropdown reads from `ana_units` (project, level, apartment, model, price)
- Financial rules engine:
  - Enganche calculation from `enganche_pct × precio_venta`
  - CPI schedule generation (reserva + N cuotas)
  - 70/30 split calculation for escrituración
  - Saldo a financiar
- Reads finca mapping from `ana_fincas` via `ana_units` FK

**Day 4: DCI Form Review Screen**
- All fields pre-filled from Vision extraction (identity) + DB (unit/financial)
- Low-confidence fields (< 0.8) highlighted in yellow
- Manual-only fields: marital status, employer, income, PEP declarations, fund source
- Toggle for second applicant
- Toggle for juridical entity
- Save to `ana_clients` on submit

**Day 5: .xls Generation**
- Map every field to exact cell coordinates in the DCI template (Hoja 1 + Hoja 2)
- ExcelJS generates .xls matching the uploaded `DCI_Example.xls` structure
- Store generated file in Supabase Storage
- Create `ana_documents` record with status `'filled'`
- Download link for the sales rep

**Day 6: Real Document Testing**
- Get actual DPI/RTU/recibo photos from Andrea/Alma
- Tune Vision prompts for Guatemalan DPI format (CUI layout, municipality encoding)
- Test bad quality photos — adjust confidence thresholds
- End-to-end: upload → extract → select unit → review → generate → verify

**Day 7: Deploy + Handoff**
- Vercel deployment, environment variables, Supabase connection
- Brief Andrea and Alma on usage
- Document the manual steps that remain

### Phase 2: Weeks 2–3 — Delivery Readiness Dashboard + FHA Forms

**Document Checklist Engine**
- Seed `ana_document_requirements` with the matrix above
- When a unit is loaded, compute its full checklist based on `credit_type`
- Show status per document: missing (red), uploaded (yellow), filled (blue), reviewed (green), approved (✓)
- Completion percentage per unit
- Sort/filter by delivery month, coordinadora, status

**FHA Form Auto-fill**
- **Solicitud de Resguardo (Formulario Verde)** — pdf-lib fills the PDF form fields directly from `ana_clients` + `ana_units`
  - Page 1: Información General (project, address, entidad aprobada, constructor, pricing, enganche, tasa), Generales solicitante 1 (all identity fields), Fuente de Ingresos
  - Page 2: Generales solicitante 2, Núcleo Familiar, Presupuesto ingresos/gastos, Estado Patrimonial, Referencias
- **Autorización Buros** — 3 fields: Nombre, DPI No., Extendido en
- **Declaración de Consentimiento** — names, DOB, sex, address, DPI
- **Declaración de Salud** — header fields only (name, DOB, caso), health questions remain handwritten
- **Formulario Mandatario** — if applicable, mandate info + mandatario identity

**Delivery Readiness Dashboard**
- Top-level view: units grouped by delivery month
- Per-month summary: total units, % docs complete, # FHA approved, # DENEGADA, # Contado ready
- Heat map: red (< 50%), yellow (50–80%), green (> 80%)
- Click into unit → full document checklist with upload/download per doc
- Alert panel: units with delivery in < 60 days and < 70% docs complete

### Phase 3: Week 4 — Compliance Automation + Escrituración

**Compliance Checks**
- OFAC: `https://sanctionssearch.ofac.treas.gov/` — search by client name, store screenshot + result
- ONU: UN consolidated sanctions list — search by name
- Guatecompras: `https://www.guatecompras.gt/` — search by NIT or name
- Batch run: select multiple clients, run all 3 checks, store results in `ana_compliance_checks`
- Flag any hits for Isaac's manual review

**Formato Escrituración Generator**
- Pull all data from: `ana_units` + `ana_clients` + `ana_fincas` + `ana_cpi_schedule` + `ana_escrituracion`
- Calculate 70/30 split per unit
- Map finca details (apartamento + parqueo + bodega) with finca/folio/libro
- Reconcile enganche payments from Odoo (receipt numbers, dates, amounts)
- Generate .xlsx matching Isaac's exact template structure
- Store + create document record

### Phase 4: Ongoing — Integrations + Scale

- Automated Odoo data pipeline (payment status sync)
- Bank-specific form templates (when known)
- Benestare project onboarding (same schema, new unit data)
- Resolution workflow for DENEGADA cases
- Notification system: email/WhatsApp alerts for approaching deadlines

---

## 7. OPEN QUESTIONS — Must Be Resolved

### Critical (blocks Phase 1)

1. **CPI schedule rules** — Is the cuota structure deterministic (i.e., formula from enganche, # months, delivery date)? Or does each deal have a custom schedule? The DCI example shows: Reserva Q10,000 + Cuota 1 Q5,000 + Cuotas 2–7 at Q9,200 + Cuota 8 at Q10,300. The Cotizador shows "Meses: 1" with Q35,300 for a different unit. I need the rule set OR confirmation that each CPI is custom-entered.

2. **Delivery month completeness** — The Entregas workbook only shows delivery months for the first unit of each batch (Noviembre for L1, Julio for L2, etc.). Are these level-wide? Confirm: Level 1 = Nov 2026, Level 2–6 = Jul 2026, Level 5 = Aug 2026 (?? overlaps with L2–6), Level 7–12 = Jul–Aug 2026 per KPI sheet, Level 9 = Sep 2026, Level 13 = Oct 2026. The KPI sheet says "Mayo–Junio (Nivel 2–6): 86 cases, Julio–Agosto (Nivel 7–12): 114, Septiembre–Octubre (Nivel 1, 13–19): 82." Need exact month per level.

3. **Which .xls format does downstream accept?** — DCI template is legacy `.xls`. FHA forms are PDF. Escrituración is `.xlsx`. Confirm: can the DCI be `.xlsx` or must it remain `.xls`?

4. **Odoo access** — For CPI payment reconciliation (receipt numbers, dates, amounts), what's the current method? Direct API? Manual export? Database read access?

### Important (blocks Phase 2)

5. **FHA PDF form fields** — Are the uploaded FHA PDFs actual fillable forms (with form fields), or are they flat PDFs? If flat, generation requires coordinate-based text placement instead of field filling. I need to inspect the actual PDF structure programmatically. **This directly affects implementation complexity.**

6. **Document flow sequence** — Cotización firmada + Carta de reserva: are these inputs TO the DCI (data source), outputs FROM the DCI (generated after), or independent? The org doc says they're "currently generated manually in Excel/Word (not by PAI APP)." Clarify the sequence: does the sales rep fill DCI first, then generate cotización? Or is cotización generated first and DCI references it?

7. **Bank-specific forms** — Isaac mentioned banks have their own forms. Which banks are most common for Boulevard 5 (BI, CHN, BAC appear in the data)? Can we get blank templates for the top 2–3 banks?

8. **DENEGADA resolution workflow** — 26 units have denied FHA prequalifications. What's the current process? Is there a standard set of actions (add co-debtor, pay off debts, switch to contado)? Should ANATOMOS track this or is it purely manual negotiation?

### Nice to Have (Phase 3+)

9. **Facturación entity** — The Escrituración format references "Inversiones Inmobiliarias Santa Elisa, S.A." for Casa Elisa. What's the entity for Boulevard 5? Is it always the same? This is needed for the 70/30 split invoicing section.

10. **Parqueo assignment logic** — Isaac mentioned FORMA (construction arm) decides which parqueo corresponds to which apartment. Is this already decided for all 298 units? Or is it assigned at delivery time? The Cotizador has parqueo numbers per unit, but are those final?

11. **Benestare timeline** — Isaac mentioned first deliveries Q1 2027, 5 towers, similar volume to Boulevard 5. When should ANATOMOS be ready for Benestare onboarding? This affects whether we build multi-project support now or later.

---

## 8. POSSIBLE MISSING WORKFLOWS

Based on the interview transcript and process diagram, these workflows exist in reality but have no system support:

### 8.1 Resguardo Expiration Tracking
FHA Resguardo de Asegurabilidad has a **1-year validity**. If escrituración doesn't happen within that year, a new resguardo must be obtained. With 282 FHA cases and delivery dates spanning July–November 2026, some resguardos obtained in 2024–2025 may already be expired or expiring soon. **No one is tracking this.** ANATOMOS should compute `resguardo_vencimiento` and alert when units are within 60 days of expiration.

### 8.2 Enganche Reconciliation Before Delivery
Isaac was explicit: "if the client hasn't finished paying the enganche, we can't deliver." The Contado sheet shows `Pendiente de Pago` per unit. For FHA cases, this lives in Odoo. **There's no unified view of "is this client paid up?"** ANATOMOS should pull payment status and block delivery workflow for units with outstanding enganche.

### 8.3 PCV (Promesa de Compra-Venta) Block Tracking
The "Gráfica - Riesgo" sheet shows 26 promesas in Bloque 1–2 (NOT protected by penalty if client doesn't qualify for credit) vs Bloque 3–4 (protected). This means 25 units have financial exposure if the client can't get credit. **This risk is invisible in the current workflow.** ANATOMOS should surface PCV block status and flag unprotected units.

### 8.4 Dual-Expediente Problem
Isaac described that data exists in the "first expediente" (DCI from sale time) and then gets **manually re-entered** into FHA forms 1–3 years later when delivery approaches. Data changes in that gap (new job, new address, new debts). ANATOMOS solves this by maintaining a living client record that's updated at each touchpoint, and auto-generating forms from the latest data.

### 8.5 Batch Processing for Scale
Isaac's team currently fills forms client by client. At peak delivery (5–7 units/day), this becomes impossible. ANATOMOS should support: select 10 units → batch-generate all FHA forms → batch-run compliance checks → download zip. "200 solicitudes, 200 veces se llena estos formularios a mano" — Isaac's exact words.

### 8.6 Legal Handoff (Formato Escrituración → Minuta)
The Formato Escrituración is built by Isaac, then sent to Emilia (legal) who uses it to draft the Minuta (Word). The bank then reviews the minuta. This back-and-forth has no tracking. ANATOMOS should track: formato_ready → minuta_draft → bank_review → bank_approved → firma_scheduled → firmado.

### 8.7 Finca Error Prevention
Isaac admitted he once forgot to include a bodega in the escrituración format, causing an invoice error that required a factura correction. The finca mapping (apto → parqueo → bodega) must be enforced at the data level. ANATOMOS should make it impossible to generate a formato without all assigned fincas included.

---

## 9. FILE STRUCTURE

```
anatomos/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                              # Dashboard: delivery readiness
│   │   ├── units/
│   │   │   ├── page.tsx                          # Unit list with filters
│   │   │   └── [id]/
│   │   │       ├── page.tsx                      # Unit detail + document checklist
│   │   │       ├── dci/page.tsx                  # DCI form fill flow
│   │   │       ├── fha/page.tsx                  # FHA forms generation
│   │   │       └── escrituracion/page.tsx        # Escrituración format generation
│   │   ├── clients/
│   │   │   └── [id]/page.tsx                     # Client detail + document archive
│   │   ├── compliance/
│   │   │   └── page.tsx                          # Batch compliance checks
│   │   └── api/
│   │       ├── extract/
│   │       │   ├── dpi/route.ts                  # Claude Vision: DPI → JSON
│   │       │   ├── rtu/route.ts                  # Claude Vision: RTU → JSON
│   │       │   └── recibo/route.ts               # Claude Vision: Recibo → JSON
│   │       ├── generate/
│   │       │   ├── dci/route.ts                  # Generate DCI .xls
│   │       │   ├── fha-verde/route.ts            # Generate Solicitud Resguardo PDF
│   │       │   ├── fha-buros/route.ts            # Generate Autorización Buros PDF
│   │       │   ├── fha-consentimiento/route.ts   # Generate Declaración Consentimiento PDF
│   │       │   ├── fha-salud/route.ts            # Generate Declaración Salud PDF
│   │       │   ├── fha-mandatario/route.ts       # Generate Formulario Mandatario PDF
│   │       │   └── escrituracion/route.ts        # Generate Formato Escrituración .xlsx
│   │       ├── compliance/
│   │       │   ├── ofac/route.ts
│   │       │   ├── onu/route.ts
│   │       │   └── guatecompras/route.ts
│   │       └── units/
│   │           └── route.ts                      # CRUD + filters
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                         # Browser client
│   │   │   ├── server.ts                         # Server client (SSR cookies)
│   │   │   └── admin.ts                          # Service role client (migrations)
│   │   ├── anthropic/
│   │   │   ├── client.ts                         # Anthropic API client
│   │   │   └── prompts/
│   │   │       ├── extract-dpi.ts                # DPI extraction prompt
│   │   │       ├── extract-rtu.ts                # RTU extraction prompt
│   │   │       └── extract-recibo.ts             # Recibo extraction prompt
│   │   ├── generators/
│   │   │   ├── dci-generator.ts                  # ExcelJS: DCI .xls from data
│   │   │   ├── escrituracion-generator.ts        # ExcelJS: Formato Escrituración
│   │   │   ├── fha-verde-generator.ts            # pdf-lib: Solicitud Resguardo
│   │   │   ├── fha-buros-generator.ts            # pdf-lib: Autorización Buros
│   │   │   ├── fha-consentimiento-generator.ts   # pdf-lib: Declaración Consentimiento
│   │   │   ├── fha-salud-generator.ts            # pdf-lib: Declaración Salud
│   │   │   └── fha-mandatario-generator.ts       # pdf-lib: Formulario Mandatario
│   │   ├── financial/
│   │   │   ├── cpi-calculator.ts                 # CPI schedule generation
│   │   │   ├── split-70-30.ts                    # 70/30 inmueble/acciones split
│   │   │   └── enganche-calculator.ts            # Enganche + fraccionado logic
│   │   └── types/
│   │       ├── unit.ts
│   │       ├── client.ts
│   │       ├── document.ts
│   │       └── finca.ts
│   └── scripts/
│       ├── import-entregas.ts                    # One-time: Entregas.xlsx → ana_units
│       ├── import-fincas.ts                      # One-time: Fincas Filiales → ana_fincas
│       ├── import-cotizador.ts                   # One-time: Cotizador → ana_units (pricing + finca mapping)
│       ├── seed-requirements.ts                  # Seed ana_document_requirements
│       └── map-fincas-to-units.ts                # Resolve parqueo/bodega → apartment mapping
├── supabase/
│   └── migrations/
│       └── 001_anatomos_schema.sql
├── templates/
│   ├── DCI_Example.xls                           # Original DCI template
│   ├── Formato_Escrituracion.xlsx                # Original escrituración template
│   └── fha/
│       ├── RA-RG-01_Solicitud_Resguardo.pdf
│       ├── RA-RG-05_Autorizacion_Buros.pdf
│       ├── RA-RG-13_Declaracion_Salud.pdf
│       ├── RA-RG-14_Declaracion_Consentimiento.pdf
│       └── Formulario_Mandatario.pdf
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.local
```

---

## 10. WHAT THIS SCAFFOLDING DOES NOT COVER

These are explicitly out of scope and should NOT be built until the above is solid:

1. **Automated Odoo pipeline** — separate ODOO project in Plane.so
2. **PipeDrive ↔ Odoo webhook sync** — ecosystem integration, not ANATOMOS
3. **Microsoft SSO** — ORION-MONO project
4. **Multi-project support** (Benestare, Casa Elisa) — architecture supports it (add `project` column to `ana_units`), but data import and testing are deferred
5. **Mobile wrapper** — responsive web first, Capacitor later if needed
6. **AI-powered risk scoring** — future feature, not MVP
7. **Client-facing portal** — ANATOMOS is internal tooling only

---

*This scaffolding is derived from: the DCI_Example.xls template, Entregas.xlsx deal list, Cotizador pricing matrix, Fincas Filiales registry, Formato Escrituración template, 5 FHA PDF forms (RA-RG-01, RA-RG-05, RA-RG-13, RA-RG-14, Mandatario), Isaac's interview transcript (MegaEstrategiaCREDITOS.txt), the 7-phase process diagram (proceso_inmobiliario.mmd), and the organization day live document.*
