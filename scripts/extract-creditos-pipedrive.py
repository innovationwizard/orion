"""Aggregate the Pipedrive créditos export into src/lib/creditos/pipedrive-snapshot.json.

Reads creditos_export_YYYY-MM-DD/creditos_snapshot_*.csv (per-deal, contains PII)
and emits ONLY aggregates (no client names) for the HUD CRÉDITOS views, plus a
per-deal file for the /creditos/pipeline board.

Tipo de Crédito exists TWICE as distinct Pipedrive custom fields with crossed
typos. Consolidation rule: prefer #1, fall back to #2; normalize labels
(contado / condado banco / contado banco → Contado). ~55% of deals declare no
type in either field — reported as "Sin dato", never dropped.

Nothing here derives a missing figure. A blank money field stays null and the
board renders "Data no existe"; the identity
`Valor del Bien − Enganche pactado = Monto de préstamo` holds for only ~91% of
the deals that carry all three, so filling gaps with it would invent numbers the
finance team acts on.

The stage catalog and the embudo→proyecto map are emitted as DATA, not hardcoded
in the UI, so a fresh Pipedrive export flows through to the board without a code
edit — Pipedrive restructured the BLV5 funnel on 2026-08-10 (12→16 stages) and a
hardcoded list silently goes stale the moment that lands.

Usage:
    python3 scripts/extract-creditos-pipedrive.py creditos_export_2026-08-07 \
        --boundary 2026-08-05

`--boundary` is the extraction cut-off stated in the export README (data date,
which is NOT the file date). It drives every "días en etapa" figure. Omitted, it
falls back to the CSV's own fecha_export.
"""
import argparse
import csv
import json
import re
import statistics
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("export_dir", nargs="?", default="creditos_export_2026-08-07")
parser.add_argument(
    "--boundary",
    help="Extraction cut-off (YYYY-MM-DD) from the export README. Defaults to the CSV's fecha_export.",
)
args = parser.parse_args()

export_dir = Path(args.export_dir)
snapshot_csv = next(export_dir.glob("creditos_snapshot_*.csv"))
stages_csv = next(export_dir.glob("embudos_y_etapas_*.csv"), None)
OUT = "src/lib/creditos/pipedrive-snapshot.json"
DEALS_OUT = "src/lib/creditos/deals-snapshot.json"

# Pipedrive funnel → the project name the rest of the app uses (see
# src/app/creditos/creditos-client.tsx). An unmapped funnel keeps its own name
# rather than being dropped or guessed at.
EMBUDO_A_PROYECTO = {
    "Créditos BLV5": "Boulevard 5",
    "Créditos Benestare": "Benestare",
    "Créditos Casa Elisa": "Casa Elisa",
    "Créditos BLT": "Bosques Las Tapias",
    "Créditos Santa Elena": "Santa Elena",
    "Créditos TCA": "Torre Cobán",
}

# The board's money is quetzales. A field in any other currency is dropped and
# reported rather than summed into a GTQ total.
MONEDA_TABLERO = "GTQ"
MONEY_RE = re.compile(r"^\s*(-?[\d.,\s]+?)\s*([A-Za-z]{3})?\s*$")

avisos_datos: list[str] = []


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


def _to_number(text: str) -> float:
    """Parse a Pipedrive amount, tolerating either thousands convention.

    Observed values are plain integers ("461300"), but a future export may carry
    separators. Ambiguity is resolved explicitly instead of silently: a lone
    comma with 1–2 trailing digits is a decimal comma, anything else is a
    thousands separator.
    """
    t = text.replace(" ", "").replace(" ", "")
    if "," in t and "." in t:
        t = t.replace(",", "")
    elif t.count(",") == 1 and len(t.split(",")[1]) in (1, 2):
        t = t.replace(",", ".")
    else:
        t = t.replace(",", "")
    if t.count(".") > 1:
        t = t.replace(".", "")
    return float(t)


def parse_money(raw: str | None, campo: str, deal_id: str) -> float | None:
    """Amount in GTQ, or None. Never guesses — an unreadable value is reported."""
    s = (raw or "").strip()
    if not s:
        return None
    m = MONEY_RE.match(s)
    if not m:
        avisos_datos.append(f"{campo}: valor ilegible {s!r} en el trato {deal_id} — omitido.")
        return None
    moneda = (m.group(2) or MONEDA_TABLERO).upper()
    if moneda != MONEDA_TABLERO:
        avisos_datos.append(
            f"{campo}: trato {deal_id} en {moneda}, no {MONEDA_TABLERO} — omitido del total."
        )
        return None
    try:
        return _to_number(m.group(1))
    except ValueError:
        avisos_datos.append(f"{campo}: valor ilegible {s!r} en el trato {deal_id} — omitido.")
        return None


def parse_fecha(raw: str | None) -> str | None:
    """ISO date (YYYY-MM-DD), or None. Accepts both plain dates and timestamps."""
    s = (raw or "").strip()
    if not s:
        return None
    try:
        date.fromisoformat(s[:10])
    except ValueError:
        return None
    return s[:10]


def parse_si(raw: str | None) -> bool | None:
    """Pipedrive's optional yes-flags: True when set, None when never answered."""
    s = (raw or "").strip().lower()
    if not s:
        return None
    return s in ("si", "sí", "yes", "true", "1")


def parse_entero(raw: str | None) -> int | None:
    s = (raw or "").strip()
    if not s:
        return None
    try:
        return int(float(s))
    except ValueError:
        return None


def texto(raw: str | None) -> str | None:
    return (raw or "").strip() or None


rows = list(csv.DictReader(open(snapshot_csv, encoding="utf-8")))
if not rows:
    raise SystemExit(f"{snapshot_csv} no tiene filas — nada que extraer.")

fecha_export = texto(rows[0].get("fecha_export"))
if args.boundary:
    BOUNDARY = date.fromisoformat(args.boundary)
else:
    if not fecha_export:
        raise SystemExit(
            "El CSV no trae fecha_export y no se pasó --boundary. "
            "Indica el corte de extracción del README: --boundary YYYY-MM-DD"
        )
    BOUNDARY = date.fromisoformat(fecha_export)
    avisos_datos.append(
        f"Sin --boundary: se usó fecha_export ({fecha_export}) como corte. "
        "El README del export suele indicar un corte anterior; la antigüedad en etapa "
        "queda corrida si no coinciden."
    )

por_etapa: dict[tuple, dict] = {}
aging: dict[tuple, list[int]] = defaultdict(list)
tipo_counts: dict[str, int] = defaultdict(int)
estado_counts: dict[str, int] = defaultdict(int)
banco_counts: dict[str, int] = defaultdict(int)
propietario_counts: dict[str, int] = defaultdict(int)
embudos_vistos: set[str] = set()
deals = []

for r in rows:
    embudo = r["embudo"]
    embudos_vistos.add(embudo)
    deal_id = r.get("deal_id") or "?"
    key = (embudo, int(r["etapa_orden"]), r["etapa"])
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
        "dealId": deal_id,
        "titulo": r["titulo"],
        "embudo": embudo,
        "proyecto": EMBUDO_A_PROYECTO.get(embudo, embudo),
        "etapa": r["etapa"],
        "etapaOrden": int(r["etapa_orden"]),
        "estado": r["estado"],
        "apartamento": r.get("# Apartamento") or None,
        "torre": texto(r.get("Torre Apartamento")),
        "tipoCredito": tipo,
        "banco": (r.get("Banco Seleccionado") or "").strip() or None,
        "propietario": (r.get("propietario") or "").strip() or None,
        "valor": float(r["valor"]) if r.get("valor") else None,
        "moneda": r.get("moneda") or None,
        # Money the bank puts on the table. Null stays null — see module docstring.
        "montoPrestamo": parse_money(r.get("Monto de préstamo"), "Monto de préstamo", deal_id),
        "valorBien": parse_money(r.get("Valor del Bien"), "Valor del Bien", deal_id),
        "enganchePactado": parse_money(r.get("Enganche pactado"), "Enganche pactado", deal_id),
        "participantes": parse_entero(r.get("Participantes en Crédito")),
        # Credit milestones — where the expediente actually stands.
        "casoFHA": texto(r.get("# Caso FHA")),
        "armadoExpediente": parse_si(r.get("Armado de Expediente")),
        "fechaArmado": parse_fecha(r.get("Fecha de Armado de Expediente")),
        "aprobacionFHA": parse_si(r.get("Aprobación FHA")),
        "fechaAprobacionFHA": parse_fecha(r.get("Fecha Aprobación FHA")),
        "aprobacionBanco": parse_si(r.get("Aprobación Banco")),
        "fechaAprobacionBanco": parse_fecha(r.get("Fecha de Aprobación Banco")),
        "suspendidoFHA": parse_fecha(r.get("Suspendido FHA")),
        "suspendidoBanco": parse_fecha(r.get("Suspendido Banco")),
        "revisionPCVLegal": parse_fecha(r.get("Revisión PCV Legal")),
        "fechaPCVDocumento": parse_fecha(r.get("Fecha de PCV- Dcto")),
        "papeleriaVencida": parse_si(r.get("Actualización Papelería vencida")),
        "creado": (r.get("creado_el") or "")[:10] or None,
        "actualizado": (r.get("actualizado_el") or "")[:10] or None,
        "cierrePrevista": parse_fecha(r.get("fecha_cierre_prevista")),
        "diasEnEtapa": dias,
        "motivoPerdido": r.get("motivo_perdido") or None,
    })

etapas = []
for (embudo, orden, etapa), counts in sorted(por_etapa.items(), key=lambda kv: (kv[0][0], kv[0][1], kv[0][2])):
    days = aging.get((embudo, orden, etapa), [])
    etapas.append({
        "embudo": embudo,
        "proyecto": EMBUDO_A_PROYECTO.get(embudo, embudo),
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

# ---------------------------------------------------------------------------
# Stage catalog — every credit stage Pipedrive defines, including the ones with
# zero deals. Emitted as data so the board stops hardcoding the list.
# ---------------------------------------------------------------------------
etapas_catalogo: list[dict] = []
etapas_catalogo_global: list[str] = []
if stages_csv is not None:
    stage_rows = [
        r
        for r in csv.DictReader(open(stages_csv, encoding="utf-8"))
        if (r.get("es_credito") or "").strip().lower() in ("true", "si", "sí", "1")
    ]
    # `orden` is NOT a reliable sort key: after Pipedrive inserted a stage into
    # the BLV5 funnel, its last four stages all report orden 9. CSV row order
    # within a funnel is the true sequence, so keep it and carry the position.
    por_embudo_secuencia: dict[str, list[str]] = defaultdict(list)
    for pos, r in enumerate(stage_rows):
        nombre = r["etapa"].strip()  # trailing spaces are load-bearing upstream, not in labels
        etapas_catalogo.append({
            "embudo": r["embudo"],
            "proyecto": EMBUDO_A_PROYECTO.get(r["embudo"], r["embudo"]),
            "stageId": int(r["stage_id"]),
            "orden": int(r["orden"]),
            "posicion": len(por_embudo_secuencia[r["embudo"]]) + 1,
            "etapa": nombre,
        })
        por_embudo_secuencia[r["embudo"]].append(nombre)

    # Ordered union across funnels, by topological merge of each funnel's own
    # chain. A plain sort cannot do this: the funnels disagree on numbering
    # (BLV5 splits Expediente Técnico into two stages, shifting everything
    # after it), and the merge is what places both variants correctly.
    orden_minimo: dict[str, int] = {}
    for c in etapas_catalogo:
        n = c["etapa"]
        orden_minimo[n] = min(orden_minimo.get(n, c["orden"]), c["orden"])

    sucesores: dict[str, set[str]] = defaultdict(set)
    grado_entrada: dict[str, int] = {n: 0 for n in orden_minimo}
    for secuencia in por_embudo_secuencia.values():
        for antes, despues in zip(secuencia, secuencia[1:]):
            if antes != despues and despues not in sucesores[antes]:
                sucesores[antes].add(despues)
                grado_entrada[despues] += 1

    # Deterministic tie-break so two stages that are genuinely parallel always
    # land in the same order: earliest declared orden, then name.
    disponibles = sorted(
        (n for n, g in grado_entrada.items() if g == 0),
        key=lambda n: (orden_minimo[n], n),
    )
    while disponibles:
        nombre = disponibles.pop(0)
        etapas_catalogo_global.append(nombre)
        for siguiente in sorted(sucesores[nombre]):
            grado_entrada[siguiente] -= 1
            if grado_entrada[siguiente] == 0:
                disponibles.append(siguiente)
        disponibles.sort(key=lambda n: (orden_minimo[n], n))

    if len(etapas_catalogo_global) != len(orden_minimo):
        # Two funnels order the same pair of stages differently — no single
        # sequence satisfies both. Fall back to numbering and say so.
        faltantes = sorted(set(orden_minimo) - set(etapas_catalogo_global))
        avisos_datos.append(
            "Los embudos no coinciden en el orden de las etapas "
            f"({', '.join(faltantes)}) — el catálogo global se ordenó por número de etapa."
        )
        etapas_catalogo_global = [k for k, _ in sorted(orden_minimo.items(), key=lambda kv: (kv[1], kv[0]))]
else:
    avisos_datos.append(
        "No se encontró embudos_y_etapas_*.csv en el export — el catálogo de etapas "
        "se derivó solo de las etapas con tratos, así que las etapas sin uso no aparecen."
    )
    etapas_catalogo_global = [e["etapa"] for e in global_etapas]

for embudo in sorted(embudos_vistos):
    if embudo not in EMBUDO_A_PROYECTO:
        avisos_datos.append(
            f"Embudo '{embudo}' sin proyecto mapeado en extract-creditos-pipedrive.py — "
            "se muestra con su nombre de embudo."
        )

proyectos = sorted({EMBUDO_A_PROYECTO.get(e, e) for e in embudos_vistos})

out = {
    "_source": (
        f"Aggregated from {snapshot_csv.name} (Pipedrive extraction, boundary {BOUNDARY}). "
        "Per-deal file contains client PII and stays OUT of the app; this JSON is aggregates only. "
        "Regenerate with scripts/extract-creditos-pipedrive.py after a fresh export."
    ),
    "boundary": str(BOUNDARY),
    "fechaExport": fecha_export,
    "totalTratos": len(rows),
    "proyectos": proyectos,
    "embudoAProyecto": {e: EMBUDO_A_PROYECTO.get(e, e) for e in sorted(embudos_vistos)},
    "estados": dict(estado_counts),
    "tipoCredito": dict(sorted(tipo_counts.items(), key=lambda kv: -kv[1])),
    "etapasGlobal": global_etapas,
    "etapasPorEmbudo": etapas,
    "etapasCatalogo": etapas_catalogo,
    "etapasCatalogoGlobal": etapas_catalogo_global,
    "bancos": dict(sorted(banco_counts.items(), key=lambda kv: -kv[1])),
    "propietariosAbiertos": dict(sorted(propietario_counts.items(), key=lambda kv: -kv[1])),
    "notas": [
        "Entregable A (historial de cambios de etapa) no disponible — antigüedad calculada solo sobre la etapa actual (fecha_entrada_etapa, 97% poblado).",
        "'Ganado' se marca al armar expediente, NO al desembolsar (46/47 won están en Armado de Expediente).",
        "Ningún trato abierto en Escritura, Desembolso ni Liquidación — el registro operativo se detiene en Resguardo/Resolución.",
        "Tipo de Crédito consolidado de dos campos custom duplicados con erratas; ~55% sin dato.",
        "Embudo Créditos TCA (Torre Cobán) existe con 0 tratos — proyecto no presente en la DB de Orion.",
        "Los montos son los declarados en Pipedrive. Nada se deriva: si el campo está vacío el tablero muestra 'Data no existe'.",
    ] + avisos_datos,
}
Path("src/lib/creditos").mkdir(parents=True, exist_ok=True)
json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=2)

# Per-deal file: contains client names (PII) — must ONLY be imported server-side
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

con_monto = sum(1 for d in deals if d["montoPrestamo"] is not None)
suma_monto = sum(d["montoPrestamo"] or 0 for d in deals)
print(f"wrote {OUT}: {len(rows)} tratos, {len(etapas)} embudo×etapa rows, boundary {BOUNDARY}")
print(f"wrote {DEALS_OUT}: {len(deals)} deals")
print(f"proyectos: {proyectos}")
print(f"catálogo de etapas: {len(etapas_catalogo)} etapa×embudo, {len(etapas_catalogo_global)} nombres")
print(f"Monto de préstamo: {con_monto}/{len(deals)} tratos, suma Q{suma_monto:,.0f}")
print("tipoCredito:", dict(out["tipoCredito"]))
print("bancos:", dict(out["bancos"]))
if avisos_datos:
    print(f"avisos de datos: {len(avisos_datos)}")
    for a in avisos_datos:
        print("  -", a)
