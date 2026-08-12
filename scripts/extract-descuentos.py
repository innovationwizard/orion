#!/usr/bin/env python3
"""Build src/lib/descuentos/descuentos-snapshot.json from DESCUENTOS/*.csv.

Source: line-level OCR extraction of "descuento" hits from the scanned B5
expediente PDFs (see DESCUENTOS/MANIFEST.md for column semantics and quality
findings). Regenerate by replacing the CSVs and re-running this script.

The snapshot contains client-identifying folder/document names — it must only
ever be imported SERVER-SIDE (API route), never in a client component.
"""

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "DESCUENTOS"
OUT = ROOT / "src" / "lib" / "descuentos" / "descuentos-snapshot.json"

# Flags that mark a detail row as noise rather than a plausible discount.
NOISE_FLAGS = ("eegsa_bill", "implausible_vs_total", "no_amount_found")


def parse_client(folder: str, partner_id: str) -> str:
    """Best-effort client name from the folder slug. Names are dash-mangled in
    the source ('GONZ-LEZ'); we only swap dashes for spaces, never invent."""
    name = folder
    if name.startswith(f"{partner_id}__"):
        name = name[len(partner_id) + 2 :]
    # strip leading unit-code segment like "02-0106-B2.1" plus optional "-05"
    name = re.sub(r"^02-\d{4}-[A-Za-z0-9.]+-?(\d{2})?-*", "", name)
    return re.sub(r"-+", " ", name).strip() or folder


def is_noise(flags: str) -> bool:
    return any(f.startswith(n) for n in NOISE_FLAGS for f in flags.split(";") if f)


def main() -> None:
    detail = list(csv.DictReader(open(SRC_DIR / "descuentos_b5.csv", encoding="utf-8")))
    rollup = list(csv.DictReader(open(SRC_DIR / "descuentos_por_folder.csv", encoding="utf-8")))

    rollup_folders = {f["partner_folder"] for f in rollup}
    detail_folders = {r["partner_folder"] for r in detail}
    discarded_folders = detail_folders - rollup_folders
    discarded_rows = [r for r in detail if r["partner_folder"] in discarded_folders]

    noise_flag_counts: dict[str, int] = {}
    for r in detail:
        for f in r["flags"].split(";"):
            if not f:
                continue
            key = f.split(":")[0]
            noise_flag_counts[key] = noise_flag_counts.get(key, 0) + 1

    tipo_counts: dict[str, int] = {}
    folders = []
    for f in rollup:
        types = [t for t in f["types"].split(";") if t]
        for t in types:
            tipo_counts[t] = tipo_counts.get(t, 0) + 1
        evidencia = [
            {
                "pdf": r["pdf"],
                "page": int(r["page"]),
                "label": r["label_line"],
                "conf": float(r["line_conf"]) if r["line_conf"] else None,
                "amountGtq": float(r["amount_gtq"]) if r["amount_gtq"] else None,
                "tipo": r["descuento_type"],
                "flags": r["flags"],
            }
            for r in detail
            if r["partner_folder"] == f["partner_folder"] and not is_noise(r["flags"])
        ]
        folders.append(
            {
                "partnerId": f["partner_id"],
                "unidad": f["taxon"],
                "cliente": parse_client(f["partner_folder"], f["partner_id"]),
                "folder": f["partner_folder"],
                "types": types,
                "instances": int(f["instances"]),
                "maxAmountGtq": float(f["max_amount_gtq"]),
                "percents": f["percents"],
                "reviewFlags": f["review_flags"],
                "evidencia": evidencia,
            }
        )
    folders.sort(key=lambda x: -x["maxAmountGtq"])

    payload = {
        "scope": "Boulevard 5 únicamente — extracción OCR de los expedientes escaneados (PDF)",
        "extractedAt": "2026-08-12",
        "sources": [
            f"descuentos_b5.csv ({len(detail)} hits de línea, {len(detail_folders)} expedientes)",
            f"descuentos_por_folder.csv ({len(rollup)} expedientes con descuento plausible)",
        ],
        "totals": {
            "expedientes": len(rollup),
            "exposicionMaxGtq": round(sum(x["maxAmountGtq"] for x in folders), 2),
            "expedientesDescartados": len(discarded_folders),
            "hitsTotales": len(detail),
            "hitsDescartados": len(discarded_rows),
        },
        "tipos": dict(sorted(tipo_counts.items(), key=lambda kv: -kv[1])),
        "flagCounts": dict(sorted(noise_flag_counts.items(), key=lambda kv: -kv[1])),
        "folders": folders,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(folders)} folders, "
          f"Q{payload['totals']['exposicionMaxGtq']:,.2f} exposición, "
          f"{len(discarded_folders)} folders descartados")


if __name__ == "__main__":
    main()
