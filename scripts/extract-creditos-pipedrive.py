"""Aggregate the Pipedrive créditos export into src/lib/creditos/pipedrive-snapshot.json.

Reads creditos_export_YYYY-MM-DD/creditos_snapshot_*.csv (per-deal, contains PII)
and emits ONLY aggregates (no client names) for the HUD CRÉDITOS views.

Tipo de Crédito exists TWICE as distinct Pipedrive custom fields with crossed
typos. Consolidation rule: prefer #1, fall back to #2; normalize labels
(contado / condado banco / contado banco → Contado). ~55% of deals declare no
type in either field — reported as "Sin dato", never dropped.

Usage: python3 scripts/extract-creditos-pipedrive.py creditos_export_2026-08-07
"""
import csv
import json
import statistics
import sys
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

export_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "creditos_export_2026-08-07")
snapshot_csv = next(export_dir.glob("creditos_snapshot_*.csv"))
BOUNDARY = date(2026, 8, 5)  # extraction boundary per the export README
OUT = "src/lib/creditos/pipedrive-snapshot.json"


def normalize_tipo(v1: str | None, v2: str | None) -> str:
    raw = (v1 or v2 or "").strip().lower()
    if not raw:
        return "Sin dato"
    if raw == "fha":
        return "FHA"
    if raw.startswith("cr"):
        return "Crédito Directo"
    if "contado" in raw or "condado" in raw:
        return "Contado"
    return (v1 or v2 or "").strip()  # unknown label preserved verbatim, never dropped


rows = list(csv.DictReader(open(snapshot_csv, encoding="utf-8")))

por_etapa: dict[tuple, dict] = {}
aging: dict[tuple, list[int]] = defaultdict(list)
tipo_counts: dict[str, int] = defaultdict(int)
estado_counts: dict[str, int] = defaultdict(int)
banco_counts: dict[str, int] = defaultdict(int)
propietario_counts: dict[str, int] = defaultdict(int)
deals = []

for r in rows:
    key = (r["embudo"], int(r["etapa_orden"]), r["etapa"])
    e = por_etapa.setdefault(key, {"open": 0, "lost": 0, "won": 0})
    e[r["estado"]] += 1
    estado_counts[r["estado"]] += 1
    tipo = normalize_tipo(r.get("Tipo de Crédito #1"), r.get("Tipo de Crédito #2"))
    tipo_counts[tipo] += 1
    if r.get("Banco Seleccionado"):
        banco_counts[r["Banco Seleccionado"].strip()] += 1
    if r["estado"] == "open":
        propietario_counts[(r.get("propietario") or "Sin propietario").strip()] += 1
    dias = None
    if r["estado"] == "open" and r.get("fecha_entrada_etapa"):
        entered = datetime.fromisoformat(r["fecha_entrada_etapa"].replace("Z", "+00:00")).date()
        dias = (BOUNDARY - entered).days
        aging[key].append(dias)
    deals.append({
        "titulo": r["titulo"],
        "embudo": r["embudo"],
        "etapa": r["etapa"],
        "etapaOrden": int(r["etapa_orden"]),
        "estado": r["estado"],
        "apartamento": r.get("# Apartamento") or None,
        "tipoCredito": tipo,
        "banco": (r.get("Banco Seleccionado") or "").strip() or None,
        "propietario": (r.get("propietario") or "").strip() or None,
        "valor": float(r["valor"]) if r.get("valor") else None,
        "moneda": r.get("moneda") or None,
        "creado": (r.get("creado_el") or "")[:10] or None,
        "diasEnEtapa": dias,
        "motivoPerdido": r.get("motivo_perdido") or None,
    })

etapas = []
for (embudo, orden, etapa), counts in sorted(por_etapa.items(), key=lambda kv: (kv[0][0], kv[0][1], kv[0][2])):
    days = aging.get((embudo, orden, etapa), [])
    etapas.append({
        "embudo": embudo,
        "orden": orden,
        "etapa": etapa,
        "open": counts["open"],
        "lost": counts["lost"],
        "won": counts["won"],
        "medianaDiasEnEtapa": round(statistics.median(days)) if days else None,
        "conFechaEtapa": len(days),
    })

# Global roll-up by stage name (BLV5's split técnico stages stay distinct by name)
global_map: dict[str, dict] = {}
order_hint: dict[str, int] = {}
for e in etapas:
    g = global_map.setdefault(e["etapa"], {"open": 0, "lost": 0, "won": 0})
    for k in ("open", "lost", "won"):
        g[k] += e[k]
    order_hint[e["etapa"]] = min(order_hint.get(e["etapa"], 99), e["orden"])
global_etapas = [
    {"etapa": name, "orden": order_hint[name], **counts}
    for name, counts in sorted(global_map.items(), key=lambda kv: order_hint[kv[0]])
]

out = {
    "_source": (
        f"Aggregated from {snapshot_csv.name} (Pipedrive extraction, boundary {BOUNDARY}). "
        "Per-deal file contains client PII and stays OUT of the app; this JSON is aggregates only. "
        "Regenerate with scripts/extract-creditos-pipedrive.py after a fresh export."
    ),
    "boundary": str(BOUNDARY),
    "totalTratos": len(rows),
    "estados": dict(estado_counts),
    "tipoCredito": dict(sorted(tipo_counts.items(), key=lambda kv: -kv[1])),
    "etapasGlobal": global_etapas,
    "etapasPorEmbudo": etapas,
    "bancos": dict(sorted(banco_counts.items(), key=lambda kv: -kv[1])),
    "propietariosAbiertos": dict(sorted(propietario_counts.items(), key=lambda kv: -kv[1])),
    "notas": [
        "Entregable A (historial de cambios de etapa) no disponible — antigüedad calculada solo sobre la etapa actual (fecha_entrada_etapa, 97% poblado).",
        "'Ganado' se marca al armar expediente, NO al desembolsar (46/47 won están en Armado de Expediente).",
        "Ningún trato abierto en Escritura, Desembolso ni Liquidación — el registro operativo se detiene en Resguardo/Resolución.",
        "Tipo de Crédito consolidado de dos campos custom duplicados con erratas; ~55% sin dato.",
        "Embudo Créditos TCA (Torre Cobán) existe con 0 tratos — proyecto no presente en la DB de Orion.",
    ],
}
Path("src/lib/creditos").mkdir(parents=True, exist_ok=True)
json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=2)

# Per-deal file: contains client names (PII) — must ONLY be imported server-side
DEALS_OUT = "src/lib/creditos/deals-snapshot.json"
deals.sort(key=lambda d: (d["embudo"], d["etapaOrden"], -(d["diasEnEtapa"] or -1)))
json.dump(
    {
        "_source": out["_source"] + " CONTAINS PII (client names) — server-side import only.",
        "boundary": str(BOUNDARY),
        "deals": deals,
    },
    open(DEALS_OUT, "w"),
    ensure_ascii=False,
    indent=2,
)
print(f"wrote {OUT}: {len(rows)} tratos, {len(etapas)} embudo×etapa rows")
print(f"wrote {DEALS_OUT}: {len(deals)} deals")
print("tipoCredito:", dict(out["tipoCredito"]))
print("bancos:", dict(out["bancos"]))
