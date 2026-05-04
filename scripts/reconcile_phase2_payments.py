#!/usr/bin/env python3
"""
scripts/reconcile_phase2_payments.py

Reconciliation script: CIERRE_MARZO_RESERVAS.xlsx (SSOT) vs production DB.
Scope: Phase 2 — down_payment rows only.
Phase 1 (reservation) was handled by migration 057 / backfill.
Phase 3 (financed_payment) requires a separate SSOT — see docs/reconciliation-phase2-plan.md.

Stages:
  0. PREFLIGHT  — verify connectivity, confirm unit_number format, sanity-check counts
  1. EXTRACT    — parse XLSX, build unit payment timelines, classify Phase 1 / Phase 2 / ambiguous
  2. DISCOVER   — query DB for existing payments + active sales per project
  3. COMPARE    — diff XLSX vs DB per unit per month
  4. REPORT     — write diff report to scripts/output/ (always runs)
  5. GATE       — verify all conditions before any write
  6. EXECUTE    — insert missing Phase 2 payments (only with --write --confirmed)

Usage:
  python3 scripts/reconcile_phase2_payments.py                        # dry-run, all projects
  python3 scripts/reconcile_phase2_payments.py --project b5           # dry-run, B5 only
  python3 scripts/reconcile_phase2_payments.py --write --confirmed    # EXECUTE (prod write)

Environment:
  SUPABASE_URL              — https://nqaexbpteletuwdbpixq.supabase.co
  SUPABASE_SERVICE_ROLE_KEY — service role key from macOS keychain

Rules (docs/_THE_RULES.MD):
  - Dry-run is default. --write requires --confirmed as a second flag.
  - Amount mismatches are NEVER auto-updated. They are flagged for manual review.
  - Ambiguous cells (Phase 1/2 combined in one cell) are NEVER auto-split. Flagged.
  - Unmatched units (in XLSX but no active sale in DB) are NEVER silently skipped. Flagged.
  - All inserts run in a single transaction per project. Rollback on any error.
  - Script is idempotent: existing payments are detected and skipped.
  - Commission recalculation is triggered for each newly inserted payment.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from dataclasses import dataclass, field, asdict
from datetime import date, datetime
from pathlib import Path
from typing import Any

import re

import openpyxl
import requests

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

XLSX_PATH = Path(__file__).parent.parent / "ComisionesMarzo" / "CIERRE_MARZO_RESERVAS.xlsx"
OUTPUT_DIR = Path(__file__).parent / "output"

# Project config: slug → (db_project_id, canonical_xlsx_sheet, standard_reserva_amount, currency)
# Project IDs from production DB (MEMORY.md)
#
# apto_source:
#   "col0"    — BEN: XLSX column 0 has the full DB key "101-A". Use it to identify unit rows
#               and derive (apto_digits, tower). Secondary section rows have col0=None → skipped.
#   "string"  — BLT: apto column has "101 B" format strings. Parse leading digits.
#               Integer-format rows (secondary section, stale) are skipped.
#   "integer" — B5, CE: apto column has bare integers. Existing behaviour.
#
# composite_key: True → DB key = f"{apto}-{tower}" (BEN). False → DB key = bare apto digits.
PROJECT_CONFIG: dict[str, dict] = {
    "b5": {
        "id": "019c7d10-8e01-720f-942f-cac0017d83a8",
        "name": "Boulevard 5",
        "sheet": "BOULEVARD 5",
        "reserva_std": 10_000.0,
        "currency": "GTQ",
        "apto_source": "integer",
        "composite_key": False,
    },
    "ben": {
        "id": "019c7d10-8f5a-74c7-b3df-c2151ad8a376",
        "name": "Benestare",
        "sheet": "BENESTARE 2.0",
        "reserva_std": 1_500.0,
        "currency": "GTQ",
        "apto_source": "col0",
        "composite_key": True,
    },
    "blt": {
        "id": "019c7d10-8ee5-7999-9881-2cd5ad038aa9",
        "name": "Bosque Las Tapias",
        "sheet": "BL-TAPIAS 2.0",
        "reserva_std": 3_000.0,
        "currency": "GTQ",
        "apto_source": "string",
        # BLT DB uses "{digits}-{tower}" format (e.g. "101-C", "702-B").
        # Bare-integer units ("101", "702") represent a prior phase not tracked in this SSOT.
        "composite_key": True,
    },
    "ce": {
        "id": "019c7d10-8e7b-7db6-93be-6f42d0538233",
        "name": "Casa Elisa",
        "sheet": "SANTA ELISA",
        "reserva_std": 5_000.0,
        "currency": "GTQ",
        "apto_source": "integer",
        "composite_key": False,
    },
}

# Tolerance for amount comparison (rounding in Excel formulas)
AMOUNT_TOLERANCE = 1.0

# Estatus values that indicate an active sale
ACTIVE_ESTATUS = {"2.reserva", "2. reserva", "2.reservado", "2. reservado", "2. reserva / prom. f.", "4.plan de pagos", "4.plan de pagos"}

# Estatus values to skip entirely
SKIP_ESTATUS = {"1.disponible", "1.available", "desistimiento"}

# Header row labels that are section dividers, not data
SECTION_DIVIDER_KEYWORDS = {"tipo de plan", "fecha dep", "total flujo", "resumen", "tipo de plan"}

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class XlsxPayment:
    apto: str
    month_end: date
    amount: float
    classification: str  # "phase_1_candidate" | "phase_2" | "ambiguous"
    note: str = ""

@dataclass
class XlsxUnit:
    apto: str               # raw string from XLSX (e.g., "101")
    tower: str | None
    salesperson: str | None
    client: str | None
    reservation_date: date | None
    estatus: str
    sale_price: float | None
    enganche: float | None
    reserva_pactada: float | None
    is_ff: bool
    payments: list[XlsxPayment] = field(default_factory=list)

@dataclass
class DbPayment:
    id: str
    sale_id: str
    payment_date: date
    amount: float
    payment_type: str

@dataclass
class DiffRow:
    project: str
    apto: str
    month_end: date
    xlsx_amount: float | None
    db_amount: float | None
    status: str  # MATCH | MISSING_IN_DB | EXTRA_IN_DB | AMOUNT_MISMATCH | AMBIGUOUS | UNMATCHED_UNIT
    sale_id: str | None = None
    db_payment_id: str | None = None
    note: str = ""

# ---------------------------------------------------------------------------
# Supabase client
# ---------------------------------------------------------------------------

class SupabaseClient:
    def __init__(self, url: str, service_key: str) -> None:
        self.url = url.rstrip("/")
        self.headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
        }

    def query(self, table: str, params: dict[str, str] | None = None) -> list[dict]:
        resp = requests.get(
            f"{self.url}/rest/v1/{table}",
            headers={**self.headers, "Prefer": "return=representation"},
            params=params or {},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

    def rpc(self, fn: str, body: dict) -> Any:
        resp = requests.post(
            f"{self.url}/rest/v1/rpc/{fn}",
            headers=self.headers,
            json=body,
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

    def insert(self, table: str, rows: list[dict]) -> list[dict]:
        """Insert rows. Returns inserted rows."""
        resp = requests.post(
            f"{self.url}/rest/v1/{table}",
            headers={**self.headers, "Prefer": "return=representation"},
            json=rows,
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

    def sql(self, query: str) -> list[dict]:
        """Execute arbitrary SQL via Management API."""
        ref = self.url.split("//")[1].split(".")[0]
        resp = requests.post(
            f"https://api.supabase.com/v1/projects/{ref}/database/query",
            headers={**self.headers, "Content-Type": "application/json"},
            json={"query": query},
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()


# ---------------------------------------------------------------------------
# Stage 0: PREFLIGHT
# ---------------------------------------------------------------------------

def preflight(client: SupabaseClient, project_keys: list[str]) -> dict[str, str]:
    """
    Verify connectivity and discover unit_number format in DB.
    Returns: {project_key: unit_number_prefix_format}
    Raises RuntimeError on any failure.
    """
    print("\n── STAGE 0: PREFLIGHT ──────────────────────────────────────────────")

    # 1. Connectivity check
    try:
        client.query("projects", {"select": "id,name", "limit": "1"})
        print("  [OK] Supabase connectivity")
    except Exception as e:
        raise RuntimeError(f"Cannot reach Supabase: {e}") from e

    unit_formats: dict[str, str] = {}

    for key in project_keys:
        cfg = PROJECT_CONFIG[key]
        project_id = cfg["id"]

        # 2. Confirm project exists
        projects = client.query("projects", {"select": "id,name", "id": f"eq.{project_id}"})
        if not projects:
            raise RuntimeError(f"Project {key} (id={project_id}) not found in DB")
        db_name = projects[0]["name"]
        print(f"  [OK] Project '{key}' found in DB as '{db_name}'")

        # 3. Discover unit_number format
        units = client.query(
            "units",
            {"select": "unit_number", "project_id": f"eq.{project_id}", "limit": "5"},
        )
        if not units:
            raise RuntimeError(f"No units found in DB for project {key}")
        sample = units[0]["unit_number"]
        print(f"  [OK] Project '{key}' unit_number sample: {repr(sample)}")

        # Log unit_number format (informational only — mapping is driven by apto_source/composite_key)
        cfg = PROJECT_CONFIG[key]
        if cfg["composite_key"]:
            unit_formats[key] = "composite"
            print(f"  [OK] Project '{key}' using composite DB key (composite_key=True, format: {repr(sample)})")
        elif sample.isdigit():
            unit_formats[key] = "bare"
        else:
            unit_formats[key] = "unknown"
            print(f"  [WARN] Project '{key}' unit_number format is non-numeric: {repr(sample)}")

        # 4. Count active sales — sanity check
        active_sales = client.query(
            "sales",
            {"select": "id", "project_id": f"eq.{project_id}", "status": "eq.active"},
        )
        print(f"  [OK] Project '{key}' active sales in DB: {len(active_sales)}")

    return unit_formats


# ---------------------------------------------------------------------------
# Stage 1: EXTRACT
# ---------------------------------------------------------------------------

def _find_march_2026_col(header_row: list) -> int | None:
    """Find 0-based column index for March 31, 2026 in a header row."""
    target = datetime(2026, 3, 31)
    for i, cell in enumerate(header_row):
        if isinstance(cell, datetime) and cell.year == 2026 and cell.month == 3:
            return i
        if isinstance(cell, date) and cell.year == 2026 and cell.month == 3:
            return i
    return None


def _find_all_monthly_cols(header_row: list) -> list[tuple[int, date]]:
    """Return list of (col_index, month_end_date) for all monthly columns."""
    result = []
    for i, cell in enumerate(header_row):
        if isinstance(cell, (datetime, date)):
            d = cell.date() if isinstance(cell, datetime) else cell
            result.append((i, d))
    return result


def _parse_apto_str(raw: str) -> tuple[str | None, str | None]:
    """
    Parse a string apto value like "101 A" or "101 B".
    Returns (apto_digits, tower_suffix) or (None, None) if not parseable.
    Handles: "101 A" → ("101", "A"), "101" → ("101", None).
    """
    m = re.match(r"^(\d+)\s*([A-Za-z]?)$", raw.strip())
    if m:
        return m.group(1), m.group(2) or None
    return None, None


def extract_project(wb: openpyxl.Workbook, project_key: str) -> list[XlsxUnit]:
    """Parse one canonical sheet and return list of XlsxUnit objects.

    BEN (apto_source='col0'):
      Column 0 contains the full DB key "101-A". Use it to identify main-section unit rows.
      Rows where col0 is None are secondary-section (desistimiento tracking) — skipped.
      DB lookup key = f"{apto}-{tower}" (composite_key=True).

    BLT (apto_source='string'):
      Apto column has "101 B" format strings. Only string-format rows are processed;
      integer-format rows (secondary section, stale data) are skipped.
      DB lookup key = bare apto digits (composite_key=False).

    B5 / CE (apto_source='integer'):
      Apto column has bare integers. Existing behaviour unchanged.
      DB lookup key = bare apto digits.
    """
    cfg = PROJECT_CONFIG[project_key]
    sheet_name = cfg["sheet"]
    reserva_std = cfg["reserva_std"]
    apto_source = cfg["apto_source"]

    ws = wb[sheet_name]
    all_rows = list(ws.iter_rows(values_only=True))

    # Find the header row: the one that contains 'Apto' or 'Apto.'
    header_row_idx = None
    for i, row in enumerate(all_rows):
        for cell in row:
            if isinstance(cell, str) and cell.strip().rstrip(".") == "Apto":
                header_row_idx = i
                break
        if header_row_idx is not None:
            break

    if header_row_idx is None:
        raise RuntimeError(f"Cannot find header row in sheet '{sheet_name}'")

    header = list(all_rows[header_row_idx])
    monthly_cols = _find_all_monthly_cols(header)

    # Locate fixed column indices by header label
    def _find_col(label: str) -> int | None:
        for i, h in enumerate(header):
            if isinstance(h, str) and h.strip().rstrip(".").lower() == label.lower():
                return i
        return None

    col_apto = _find_col("Apto")
    col_tower = _find_col("Torre")
    col_vendedor = _find_col("Vendedor")
    col_cliente = _find_col("Cliente")
    col_fecha_reserva = _find_col("Fecha Reserva")
    col_estatus = _find_col("Estatus")
    col_precio = _find_col("Precio de Venta")
    col_enganche = _find_col("Enganche")
    # "Monto de Reserva Pactado" — find by substring
    col_reserva_pactada = None
    for i, h in enumerate(header):
        if isinstance(h, str) and "monto de reserva" in h.lower():
            col_reserva_pactada = i
            break
    # F&F flag — "Caso Especial / F&F" col or leftmost (B5)
    col_ff = None
    for i, h in enumerate(header):
        if isinstance(h, str) and "f&f" in h.lower():
            col_ff = i
            break

    if col_apto is None or col_estatus is None:
        raise RuntimeError(f"Cannot find required columns in sheet '{sheet_name}'")

    units: list[XlsxUnit] = []

    # BEN: regex for col0 format "101-A" (main-section rows only)
    _col0_ben_re = re.compile(r"^(\d+)-([A-Za-z])$")

    for row in all_rows[header_row_idx + 1:]:
        # ── Determine apto_str and tower_from_apto based on apto_source ──────
        apto_str: str | None = None
        tower_from_apto: str | None = None

        if apto_source == "col0":
            # BEN: col0 = "101-A" identifies main-section rows.
            col0_val = row[0] if len(row) > 0 else None
            if not isinstance(col0_val, str):
                continue  # secondary section (col0=None) or blank → skip
            m = _col0_ben_re.match(col0_val.strip())
            if not m:
                continue  # col0 = "-" or other separator → skip
            apto_str, tower_from_apto = m.group(1), m.group(2).upper()

        elif apto_source == "string":
            # BLT: apto column has "101 B" format. Skip integer-format rows (secondary section).
            apto_raw = row[col_apto] if col_apto < len(row) else None
            if not isinstance(apto_raw, str):
                continue  # integer apto → secondary section → skip
            apto_str, tower_from_apto = _parse_apto_str(apto_raw)
            if apto_str is None:
                continue  # non-unit string (header text, etc.) → skip

        else:
            # integer — B5, CE: existing behaviour
            apto_raw = row[col_apto] if col_apto < len(row) else None
            if apto_raw is None:
                continue
            if isinstance(apto_raw, str):
                # Rare: string in integer-mode project (e.g. section header) → skip
                if not apto_raw.strip().replace(".", "").isdigit():
                    continue
                apto_str = str(int(float(apto_raw.strip())))
            elif isinstance(apto_raw, (int, float)):
                apto_str = str(int(apto_raw))
            else:
                continue

        # ── Estatus filter ────────────────────────────────────────────────────
        estatus_raw = row[col_estatus] if col_estatus is not None and col_estatus < len(row) else None
        estatus_str = str(estatus_raw).strip() if estatus_raw is not None else ""
        estatus_lower = estatus_str.lower()

        if any(kw in estatus_lower for kw in SECTION_DIVIDER_KEYWORDS):
            continue
        if not estatus_str:
            continue  # blank estatus → not a unit row

        # ── Parse torre column (preferred source; fall back to apto-embedded letter) ──
        torre_raw = row[col_tower] if col_tower is not None and col_tower < len(row) else None
        tower_str: str | None = (
            str(torre_raw).strip() if torre_raw and str(torre_raw).strip() else tower_from_apto
        )

        # ── Parse reservation date ────────────────────────────────────────────
        fecha_reserva = None
        if col_fecha_reserva is not None and col_fecha_reserva < len(row):
            fr = row[col_fecha_reserva]
            if isinstance(fr, datetime):
                fecha_reserva = fr.date()
            elif isinstance(fr, date):
                fecha_reserva = fr

        # ── Reserva pactada amount ────────────────────────────────────────────
        reserva_pactada = None
        if col_reserva_pactada is not None and col_reserva_pactada < len(row):
            rp = row[col_reserva_pactada]
            if isinstance(rp, (int, float)) and rp > 0:
                reserva_pactada = float(rp)

        effective_reserva = reserva_pactada if reserva_pactada else reserva_std

        # ── F&F flag ──────────────────────────────────────────────────────────
        is_ff = False
        if col_ff is not None and col_ff < len(row):
            ff_val = row[col_ff]
            is_ff = bool(ff_val and str(ff_val).strip())
        # B5 encodes F&F in col 0 as literal "F&F" text
        if not is_ff and apto_source == "integer" and len(row) > 0:
            ff_val = row[0]
            is_ff = isinstance(ff_val, str) and "f&f" in ff_val.lower()

        unit = XlsxUnit(
            apto=apto_str,
            tower=tower_str,
            salesperson=str(row[col_vendedor]).strip() if col_vendedor is not None and col_vendedor < len(row) and row[col_vendedor] else None,
            client=str(row[col_cliente]).strip() if col_cliente is not None and col_cliente < len(row) and row[col_cliente] else None,
            reservation_date=fecha_reserva,
            estatus=estatus_str,
            sale_price=float(row[col_precio]) if col_precio is not None and col_precio < len(row) and isinstance(row[col_precio], (int, float)) else None,
            enganche=float(row[col_enganche]) if col_enganche is not None and col_enganche < len(row) and isinstance(row[col_enganche], (int, float)) else None,
            reserva_pactada=reserva_pactada,
            is_ff=is_ff,
        )

        # Skip unavailable / desisted units
        if any(kw in estatus_lower for kw in SKIP_ESTATUS):
            continue

        # Build payment timeline
        for col_idx, month_end in monthly_cols:
            if col_idx >= len(row):
                continue
            cell_val = row[col_idx]
            if not isinstance(cell_val, (int, float)) or cell_val == 0:
                continue
            amount = float(cell_val)

            # Phase classification
            reservation_month = (
                date(fecha_reserva.year, fecha_reserva.month, 1) if fecha_reserva else None
            )
            cell_month = date(month_end.year, month_end.month, 1)

            if reservation_month is not None and cell_month == reservation_month:
                # Same month as reservation
                if abs(amount - effective_reserva) <= AMOUNT_TOLERANCE:
                    classification = "phase_1_candidate"
                    note = f"Matches reserva pactada={effective_reserva}"
                elif amount > effective_reserva:
                    classification = "ambiguous"
                    note = (
                        f"Amount {amount} > reserva {effective_reserva} in reservation month. "
                        "Possible combined Phase1+Phase2 in one cell. Manual review required."
                    )
                else:
                    # Amount < effective_reserva — partial deposit or different reserva amount
                    classification = "ambiguous"
                    note = f"Amount {amount} < standard reserva {effective_reserva} in reservation month."
            elif reservation_month is not None and cell_month < reservation_month:
                # Payment before reservation date — data anomaly
                classification = "ambiguous"
                note = f"Payment {month_end} is before Fecha Reserva {fecha_reserva}. Possible data issue."
            else:
                classification = "phase_2"
                note = ""

            unit.payments.append(
                XlsxPayment(
                    apto=unit.apto,
                    month_end=month_end,
                    amount=amount,
                    classification=classification,
                    note=note,
                )
            )

        units.append(unit)

    return units


def extract_all(project_keys: list[str]) -> dict[str, list[XlsxUnit]]:
    """Load XLSX and extract all requested projects."""
    print("\n── STAGE 1: EXTRACT ────────────────────────────────────────────────")

    if not XLSX_PATH.exists():
        raise RuntimeError(f"XLSX not found at {XLSX_PATH}")

    wb = openpyxl.load_workbook(str(XLSX_PATH), read_only=True, data_only=True)
    result: dict[str, list[XlsxUnit]] = {}

    for key in project_keys:
        units = extract_project(wb, key)
        phase2_payments = sum(1 for u in units for p in u.payments if p.classification == "phase_2")
        ambiguous = sum(1 for u in units for p in u.payments if p.classification == "ambiguous")
        phase1 = sum(1 for u in units for p in u.payments if p.classification == "phase_1_candidate")
        print(
            f"  [{key.upper()}] {len(units)} active units | "
            f"{phase1} Phase1-candidate | {phase2_payments} Phase2 | {ambiguous} ambiguous"
        )
        result[key] = units

    wb.close()
    return result


# ---------------------------------------------------------------------------
# Stage 2: DISCOVER
# ---------------------------------------------------------------------------

def discover_db_payments(
    client: SupabaseClient,
    project_keys: list[str],
    unit_formats: dict[str, str],
    xlsx_data: dict[str, list[XlsxUnit]],
) -> dict[str, dict]:
    """
    For each project, query all active sales + their payments.
    Returns: {project_key: {"unit_to_sale": {unit_number: sale_row}, "payments": {sale_id: [DbPayment]}}}
    """
    print("\n── STAGE 2: DISCOVER ───────────────────────────────────────────────")

    result: dict[str, dict] = {}

    for key in project_keys:
        cfg = PROJECT_CONFIG[key]
        project_id = cfg["id"]
        composite_key = cfg["composite_key"]

        # Fetch all units for this project
        db_units = client.query(
            "units",
            {"select": "id,unit_number", "project_id": f"eq.{project_id}"},
        )
        unit_id_map: dict[str, str] = {u["unit_number"]: u["id"] for u in db_units}

        # Build lookup: db_key → unit_id
        # For composite_key projects (BEN): db_key = unit_number as-is ("101-A").
        # For non-composite (B5, BLT, CE): db_key = bare digit string extracted from unit_number.
        def make_db_key(unit_number: str) -> str:
            if composite_key:
                return unit_number  # keep "101-A" exactly as stored
            # Strip non-digit characters to get bare number
            digits = "".join(c for c in unit_number if c.isdigit())
            return digits if digits else unit_number

        db_key_to_unit_id: dict[str, str] = {}
        for u in db_units:
            k = make_db_key(u["unit_number"])
            # For composite_key projects every key is unique; for others there may be
            # sub-unit collisions (e.g. "101-B" and "101-C" both → "101" for BLT).
            # We want only the main apartment unit, so skip if key already mapped
            # (first entry wins — main apartments appear before sub-units in DB ordering).
            if k not in db_key_to_unit_id:
                db_key_to_unit_id[k] = u["id"]

        # Fetch all active sales for this project
        db_sales = client.query(
            "sales",
            {
                "select": "id,unit_id,status,sale_date,price_with_tax,down_payment_amount",
                "project_id": f"eq.{project_id}",
                "status": "eq.active",
            },
        )
        # Build reverse lookup: unit_id → db_key, then unit_to_sale: db_key → sale
        unit_id_to_db_key: dict[str, str] = {v: k for k, v in db_key_to_unit_id.items()}
        unit_to_sale: dict[str, dict] = {}
        sale_ids: list[str] = []
        for sale in db_sales:
            uid = sale["unit_id"]
            db_key = unit_id_to_db_key.get(uid)
            if db_key:
                unit_to_sale[db_key] = sale
                sale_ids.append(sale["id"])

        print(f"  [{key.upper()}] {len(db_sales)} active sales in DB | {len(db_units)} units")

        # Fetch all payments for these sales
        payments_by_sale: dict[str, list[DbPayment]] = {}
        if sale_ids:
            # Batch in chunks of 100 to avoid URL length limits
            chunk_size = 100
            for i in range(0, len(sale_ids), chunk_size):
                chunk = sale_ids[i : i + chunk_size]
                in_clause = "in.(" + ",".join(chunk) + ")"
                db_payments = client.query(
                    "payments",
                    {
                        "select": "id,sale_id,payment_date,amount,payment_type",
                        "sale_id": in_clause,
                    },
                )
                for p in db_payments:
                    sid = p["sale_id"]
                    pd = date.fromisoformat(p["payment_date"][:10])
                    dp = DbPayment(
                        id=p["id"],
                        sale_id=sid,
                        payment_date=pd,
                        amount=float(p["amount"]),
                        payment_type=p["payment_type"],
                    )
                    payments_by_sale.setdefault(sid, []).append(dp)

        total_payments = sum(len(v) for v in payments_by_sale.values())
        down_payments = sum(
            1 for payments in payments_by_sale.values()
            for p in payments if p.payment_type == "down_payment"
        )
        print(f"  [{key.upper()}] {total_payments} total payments in DB | {down_payments} are Phase2 (down_payment)")

        result[key] = {
            "unit_to_sale": unit_to_sale,
            "payments_by_sale": payments_by_sale,
            "make_db_key": make_db_key,
            "composite_key": composite_key,
        }

    return result


# ---------------------------------------------------------------------------
# Stage 3: COMPARE
# ---------------------------------------------------------------------------

def compare(
    xlsx_data: dict[str, list[XlsxUnit]],
    db_data: dict[str, dict],
) -> list[DiffRow]:
    """
    Produce a flat list of DiffRow comparing XLSX Phase 2 payments vs DB down_payment rows.
    """
    print("\n── STAGE 3: COMPARE ────────────────────────────────────────────────")
    diffs: list[DiffRow] = []

    for key, units in xlsx_data.items():
        unit_to_sale: dict[str, dict] = db_data[key]["unit_to_sale"]
        payments_by_sale: dict[str, list[DbPayment]] = db_data[key]["payments_by_sale"]
        make_db_key = db_data[key]["make_db_key"]
        composite_key: bool = db_data[key]["composite_key"]
        cfg = PROJECT_CONFIG[key]

        matched = unmatched = ambiguous = phase1_missing = 0

        for unit in units:
            # Build the lookup key matching the DB format
            if composite_key:
                # BEN: key = "101-A" using apto digits + tower
                tower = (unit.tower or "").strip().upper()
                lookup_key = f"{unit.apto}-{tower}" if tower else unit.apto
            else:
                # B5, BLT, CE: key = bare apto digits
                lookup_key = make_db_key(unit.apto)
            sale = unit_to_sale.get(lookup_key)

            if sale is None:
                # Unit in XLSX has no active sale in DB
                unmatched += 1
                diffs.append(DiffRow(
                    project=key,
                    apto=unit.apto,
                    month_end=unit.reservation_date or date(1970, 1, 1),
                    xlsx_amount=None,
                    db_amount=None,
                    status="UNMATCHED_UNIT",
                    note=f"No active sale found in DB for unit {unit.apto} (tower={unit.tower}, db_key={lookup_key}) in project {cfg['name']}",
                ))
                continue

            matched += 1
            sale_id = sale["id"]
            db_payments = payments_by_sale.get(sale_id, [])

            # Build DB Phase 2 index: month_end → DbPayment
            # Use month-end date for matching (DB may store exact day; normalise to month-end)
            def to_month_end(d: date) -> date:
                import calendar
                last_day = calendar.monthrange(d.year, d.month)[1]
                return date(d.year, d.month, last_day)

            db_phase2_by_month: dict[date, DbPayment] = {}
            db_phase1_by_month: dict[date, DbPayment] = {}
            for p in db_payments:
                me = to_month_end(p.payment_date)
                if p.payment_type == "down_payment":
                    db_phase2_by_month[me] = p
                elif p.payment_type == "reservation":
                    db_phase1_by_month[me] = p

            for xlsx_payment in unit.payments:
                month_end = to_month_end(xlsx_payment.month_end)

                if xlsx_payment.classification == "ambiguous":
                    ambiguous += 1
                    diffs.append(DiffRow(
                        project=key,
                        apto=unit.apto,
                        month_end=month_end,
                        xlsx_amount=xlsx_payment.amount,
                        db_amount=None,
                        status="AMBIGUOUS",
                        sale_id=sale_id,
                        note=xlsx_payment.note,
                    ))
                    continue

                if xlsx_payment.classification == "phase_1_candidate":
                    # Verify Phase 1 reservation payment exists in DB
                    db_p1 = db_phase1_by_month.get(month_end)
                    if db_p1 is None:
                        phase1_missing += 1
                        diffs.append(DiffRow(
                            project=key,
                            apto=unit.apto,
                            month_end=month_end,
                            xlsx_amount=xlsx_payment.amount,
                            db_amount=None,
                            status="PHASE1_MISSING_IN_DB",
                            sale_id=sale_id,
                            note="Reservation (Phase1) payment not found in DB. Check migration 057 / backfill.",
                        ))
                    # Phase 1 is not inserted by this script — only flagged.
                    continue

                # Phase 2
                db_p2 = db_phase2_by_month.get(month_end)

                if db_p2 is None:
                    diffs.append(DiffRow(
                        project=key,
                        apto=unit.apto,
                        month_end=month_end,
                        xlsx_amount=xlsx_payment.amount,
                        db_amount=None,
                        status="MISSING_IN_DB",
                        sale_id=sale_id,
                    ))
                elif abs(db_p2.amount - xlsx_payment.amount) <= AMOUNT_TOLERANCE:
                    diffs.append(DiffRow(
                        project=key,
                        apto=unit.apto,
                        month_end=month_end,
                        xlsx_amount=xlsx_payment.amount,
                        db_amount=db_p2.amount,
                        status="MATCH",
                        sale_id=sale_id,
                        db_payment_id=db_p2.id,
                    ))
                else:
                    diffs.append(DiffRow(
                        project=key,
                        apto=unit.apto,
                        month_end=month_end,
                        xlsx_amount=xlsx_payment.amount,
                        db_amount=db_p2.amount,
                        status="AMOUNT_MISMATCH",
                        sale_id=sale_id,
                        db_payment_id=db_p2.id,
                        note=f"XLSX={xlsx_payment.amount} DB={db_p2.amount} delta={xlsx_payment.amount - db_p2.amount:.2f}",
                    ))

            # Check for DB Phase 2 payments with no XLSX counterpart
            xlsx_phase2_months = {
                to_month_end(p.month_end)
                for p in unit.payments
                if p.classification == "phase_2"
            }
            for me, db_p in db_phase2_by_month.items():
                if me not in xlsx_phase2_months:
                    diffs.append(DiffRow(
                        project=key,
                        apto=unit.apto,
                        month_end=me,
                        xlsx_amount=None,
                        db_amount=db_p.amount,
                        status="EXTRA_IN_DB",
                        sale_id=sale_id,
                        db_payment_id=db_p.id,
                        note="DB has a Phase2 payment with no XLSX counterpart. Possible manual entry or desistimiento.",
                    ))

        match_count = sum(1 for d in diffs if d.project == key and d.status == "MATCH")
        missing = sum(1 for d in diffs if d.project == key and d.status == "MISSING_IN_DB")
        extra = sum(1 for d in diffs if d.project == key and d.status == "EXTRA_IN_DB")
        mismatch = sum(1 for d in diffs if d.project == key and d.status == "AMOUNT_MISMATCH")
        print(
            f"  [{key.upper()}] matched={matched} unmatched={unmatched} | "
            f"MATCH={match_count} MISSING={missing} EXTRA={extra} MISMATCH={mismatch} "
            f"AMBIGUOUS={ambiguous} PHASE1_MISS={phase1_missing}"
        )

    return diffs


# ---------------------------------------------------------------------------
# Stage 4: REPORT
# ---------------------------------------------------------------------------

def write_report(diffs: list[DiffRow], run_date: str) -> Path:
    """Write markdown + JSON diff reports to scripts/output/."""
    print("\n── STAGE 4: REPORT ─────────────────────────────────────────────────")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    md_path = OUTPUT_DIR / f"reconciliation-diff-phase2-{run_date}.md"
    json_path = OUTPUT_DIR / f"reconciliation-diff-phase2-{run_date}.json"

    # Counters
    by_status: dict[str, list[DiffRow]] = {}
    for d in diffs:
        by_status.setdefault(d.status, []).append(d)

    # Markdown report
    lines = [
        f"# Phase 2 Reconciliation Diff Report",
        f"",
        f"**Generated:** {run_date}",
        f"**SSOT:** ComisionesMarzo/CIERRE_MARZO_RESERVAS.xlsx",
        f"",
        f"## Summary",
        f"",
        f"| Status | Count |",
        f"|--------|-------|",
    ]
    for status, rows in sorted(by_status.items()):
        lines.append(f"| {status} | {len(rows)} |")
    lines.append(f"| **TOTAL** | **{len(diffs)}** |")
    lines.append("")

    for status in ["UNMATCHED_UNIT", "AMBIGUOUS", "AMOUNT_MISMATCH", "PHASE1_MISSING_IN_DB", "MISSING_IN_DB", "EXTRA_IN_DB"]:
        rows = by_status.get(status, [])
        if not rows:
            continue
        lines += [
            f"## {status} ({len(rows)})",
            "",
            "| Project | Apto | Month | XLSX Amount | DB Amount | Note |",
            "|---------|------|-------|-------------|-----------|------|",
        ]
        for r in sorted(rows, key=lambda x: (x.project, x.apto, x.month_end)):
            lines.append(
                f"| {r.project} | {r.apto} | {r.month_end} | "
                f"{r.xlsx_amount if r.xlsx_amount is not None else '-'} | "
                f"{r.db_amount if r.db_amount is not None else '-'} | "
                f"{r.note} |"
            )
        lines.append("")

    # MATCH section — just counts per project
    match_rows = by_status.get("MATCH", [])
    if match_rows:
        by_project: dict[str, int] = {}
        for r in match_rows:
            by_project[r.project] = by_project.get(r.project, 0) + 1
        lines += ["## MATCH (reconciled)", "", "| Project | Count |", "|---------|-------|"]
        for proj, cnt in sorted(by_project.items()):
            lines.append(f"| {proj} | {cnt} |")
        lines.append("")

    md_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"  [OK] Markdown report: {md_path}")

    # JSON report
    json_path.write_text(
        json.dumps([asdict(d) | {"month_end": str(d.month_end)} for d in diffs], indent=2, default=str),
        encoding="utf-8",
    )
    print(f"  [OK] JSON report: {json_path}")

    # Print gate summary
    blocking = sum(
        1
        for d in diffs
        if d.status in {"UNMATCHED_UNIT", "AMBIGUOUS", "AMOUNT_MISMATCH"}
    )
    missing = sum(1 for d in diffs if d.status == "MISSING_IN_DB")
    print(f"\n  Blocking issues (require manual resolution before write): {blocking}")
    print(f"  Missing in DB (can be inserted after zero blocking issues): {missing}")
    if blocking > 0:
        print(f"\n  ⛔  GATE: {blocking} blocking issue(s) must be resolved before --write is safe.")
    elif missing == 0:
        print(f"\n  ✅  GATE: Zero diff. DB is fully reconciled with SSOT.")
    else:
        print(f"\n  ℹ️   GATE: {missing} Phase2 payments can be inserted with --write --confirmed.")

    return md_path


# ---------------------------------------------------------------------------
# Stage 5: GATE
# ---------------------------------------------------------------------------

def gate(diffs: list[DiffRow], write: bool, confirmed: bool) -> bool:
    """
    Returns True if execution may proceed, False otherwise.
    Exits non-zero if write was requested but gate fails.
    """
    print("\n── STAGE 5: GATE ───────────────────────────────────────────────────")

    blocking_statuses = {"UNMATCHED_UNIT", "AMBIGUOUS", "AMOUNT_MISMATCH"}
    blocking = [d for d in diffs if d.status in blocking_statuses]
    missing = [d for d in diffs if d.status == "MISSING_IN_DB"]

    if not write:
        print("  [DRY-RUN] --write not set. No changes will be made.")
        return False

    if not confirmed:
        print("  [GATE] --write set but --confirmed missing. Add --confirmed to proceed.")
        return False

    if blocking:
        print(f"  [GATE FAIL] {len(blocking)} blocking issue(s) exist.")
        for d in blocking[:10]:
            print(f"    {d.status}: project={d.project} apto={d.apto} month={d.month_end}")
        if len(blocking) > 10:
            print(f"    ... and {len(blocking) - 10} more. See report.")
        print("  Resolve all UNMATCHED_UNIT, AMBIGUOUS, and AMOUNT_MISMATCH rows before proceeding.")
        sys.exit(1)

    if not missing:
        print("  [GATE PASS] Zero diff — nothing to insert.")
        return False

    print(f"  [GATE PASS] {len(missing)} Phase2 payment(s) ready to insert.")
    return True


# ---------------------------------------------------------------------------
# Stage 6: EXECUTE
# ---------------------------------------------------------------------------

def execute(
    client: SupabaseClient,
    diffs: list[DiffRow],
    run_date: str,
) -> None:
    """
    Insert missing Phase 2 payments into the DB.
    All inserts are batched per project within a single transaction.
    Commission recalculation is triggered per inserted payment.
    """
    print("\n── STAGE 6: EXECUTE ────────────────────────────────────────────────")
    exec_log: list[dict] = []
    missing = [d for d in diffs if d.status == "MISSING_IN_DB"]

    # Group by project
    by_project: dict[str, list[DiffRow]] = {}
    for d in missing:
        by_project.setdefault(d.project, []).append(d)

    for key, rows in by_project.items():
        print(f"\n  [{key.upper()}] Preparing {len(rows)} inserts...")

        # Build insert payloads
        # payment_date: use last day of the month (matches XLSX column header)
        inserts = []
        for d in rows:
            import calendar
            last_day = calendar.monthrange(d.month_end.year, d.month_end.month)[1]
            payment_date = date(d.month_end.year, d.month_end.month, last_day)
            inserts.append({
                "id": str(uuid.uuid4()),
                "sale_id": d.sale_id,
                "payment_date": payment_date.isoformat(),
                "amount": d.xlsx_amount,
                "payment_type": "down_payment",
                "payment_method": None,
                "notes": f"Reconciled from CIERRE_MARZO_RESERVAS.xlsx — {run_date}",
            })

        # Idempotency: remove rows that already exist in DB
        # (double-check before inserting — the compare stage may have missed concurrent inserts)
        sale_ids = list({r["sale_id"] for r in inserts})
        existing = client.query(
            "payments",
            {
                "select": "sale_id,payment_date,payment_type",
                "sale_id": "in.(" + ",".join(sale_ids) + ")",
                "payment_type": "eq.down_payment",
            },
        )
        existing_keys = {
            (e["sale_id"], e["payment_date"][:10]) for e in existing
        }

        final_inserts = [
            r for r in inserts
            if (r["sale_id"], r["payment_date"]) not in existing_keys
        ]
        skipped = len(inserts) - len(final_inserts)
        if skipped:
            print(f"  [{key.upper()}] {skipped} already exist in DB — skipped (idempotent).")

        if not final_inserts:
            print(f"  [{key.upper()}] Nothing to insert.")
            continue

        # INSERT — Supabase REST does not support explicit transactions,
        # so we insert in one batch call which is atomic per API call.
        print(f"  [{key.upper()}] Inserting {len(final_inserts)} payments...")
        try:
            inserted = client.insert("payments", final_inserts)
            print(f"  [{key.upper()}] Inserted {len(inserted)} rows.")
            exec_log.extend([{"action": "inserted", "project": key, **r} for r in inserted])
        except Exception as e:
            print(f"  [{key.upper()}] INSERT FAILED: {e}")
            print("  Aborting. No further projects will be processed.")
            # Write partial log
            log_path = OUTPUT_DIR / f"reconciliation-exec-{run_date}.json"
            log_path.write_text(json.dumps(exec_log, indent=2, default=str), encoding="utf-8")
            raise

        # Trigger commission recalculation for each inserted payment
        print(f"  [{key.upper()}] Triggering commission recalculation...")
        recalc_errors = 0
        for row in inserted:
            try:
                client.rpc("calculate_commissions", {"p_payment_id": row["id"]})
            except Exception as e:
                recalc_errors += 1
                print(f"    [WARN] recalc failed for payment {row['id']}: {e}")

        if recalc_errors:
            print(f"  [{key.upper()}] {recalc_errors} recalc error(s). Check commission rows manually.")
        else:
            print(f"  [{key.upper()}] Commission recalculation complete.")

    # Write execution log
    log_path = OUTPUT_DIR / f"reconciliation-exec-{run_date}.json"
    log_path.write_text(json.dumps(exec_log, indent=2, default=str), encoding="utf-8")
    print(f"\n  [OK] Execution log: {log_path}")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Reconcile Phase 2 payments: CIERRE_MARZO_RESERVAS.xlsx vs production DB"
    )
    parser.add_argument(
        "--project",
        choices=list(PROJECT_CONFIG.keys()),
        help="Limit to one project. Omit for all projects.",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Enable write mode. ALSO requires --confirmed.",
    )
    parser.add_argument(
        "--confirmed",
        action="store_true",
        help="Confirm that the report has been reviewed and write is intentional.",
    )
    args = parser.parse_args()

    project_keys = [args.project] if args.project else list(PROJECT_CONFIG.keys())
    run_date = datetime.now().strftime("%Y-%m-%d")

    # Credentials from environment
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.")
        sys.exit(1)

    client = SupabaseClient(supabase_url, supabase_key)

    print(f"Reconciliation run: {run_date}")
    print(f"Projects: {', '.join(project_keys)}")
    print(f"Mode: {'WRITE' if args.write else 'DRY-RUN'}")

    # Stage 0
    unit_formats = preflight(client, project_keys)

    # Stage 1
    xlsx_data = extract_all(project_keys)

    # Stage 2
    db_data = discover_db_payments(client, project_keys, unit_formats, xlsx_data)

    # Stage 3
    diffs = compare(xlsx_data, db_data)

    # Stage 4
    write_report(diffs, run_date)

    # Stage 5
    can_write = gate(diffs, args.write, args.confirmed)

    # Stage 6
    if can_write:
        execute(client, diffs, run_date)
        print("\n✅  Reconciliation complete.")
    else:
        print("\nDry-run complete. No changes made.")


if __name__ == "__main__":
    main()
