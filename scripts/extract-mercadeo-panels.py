"""Regenerate src/lib/mercadeo/panels-snapshot.json from the Power BI export.

Reads the `window.__PA_DATA__` payload already embedded in
public/mercadeo/performance.html (produced by ARTIFACT/build_data.py from the
PBIX model) and reshapes the grains the native /mercadeo page needs:

  daily (fecha, cuenta)        -> alcance, impresiones, leads/día, gasto diario
  camp  (mes, cuenta, campaña) -> efectividad de campañas
  pres  (row level)            -> presupuesto de mercadeo por mes/proyecto

Nothing here touches the database, the API routes or the existing snapshots —
it only reads a static file and writes one new JSON next to
leads-snapshot.json / spend-snapshot.json.

CURRENCY (important): the payload's `spd` column comes from the Meta Ads column
labelled "Importe gastado (USD)", but that label is wrong — each ad account
bills in its own currency (see the Divisa column, preserved in
spend-snapshot.json). The Power BI mixes GTQ and USD as if both were USD. This
script does NOT convert; it carries spend per account so the UI can apply the
real per-account currency from spend-snapshot.json, and records which accounts
those are so the mistake is not silently repeated.

Usage: python3 scripts/extract-mercadeo-panels.py
"""
import json
import re
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "mercadeo" / "performance.html"
SPEND = ROOT / "src" / "lib" / "mercadeo" / "spend-snapshot.json"
OUT = ROOT / "src" / "lib" / "mercadeo" / "panels-snapshot.json"

# Column order of `daily`, set by ARTIFACT/build_data.py
D_DAY, D_ACC, D_ALC, D_IMP, D_LED, D_CLK, D_SPD = 0, 1, 2, 3, 4, 5, 6
# Column order of `camp`
C_MONTH, C_ACC, C_CMP, C_IMP, C_LED, C_CLK, C_SPD = 0, 1, 2, 3, 4, 5, 6
# Column order of `pres`
P_FECHA, P_MES, P_PROYECTO, P_CONCEPTO, P_PROVEEDOR, P_INVERSION = 0, 1, 2, 3, 4, 5


def load_payload() -> dict:
    html = SRC.read_text(encoding="utf-8", errors="replace")
    marker = "window.__PA_DATA__ = "
    i = html.find(marker)
    if i < 0:
        raise SystemExit(f"Could not find `{marker}` in {SRC}")
    start = i + len(marker)
    decoder = json.JSONDecoder()
    payload, _ = decoder.raw_decode(html[start:])
    return payload


def main() -> None:
    p = load_payload()
    accounts = p["acc"]
    campaigns = p["cmp"]
    epoch = date.fromisoformat(p["meta"]["epoch"])

    spend_meta = json.loads(SPEND.read_text(encoding="utf-8"))["accounts"]
    currency_by_account = {a: spend_meta.get(a, {}).get("currency") for a in accounts}

    # ---- daily: per-day totals and per-day/account detail -------------------
    by_day = defaultdict(lambda: {"alcance": 0, "impresiones": 0, "leads": 0, "clics": 0})
    by_account = defaultdict(lambda: {"alcance": 0, "impresiones": 0, "leads": 0, "clics": 0, "spend": 0.0})
    by_month_account = defaultdict(lambda: {"leads": 0, "spend": 0.0})

    for r in p["daily"]:
        day = (epoch + timedelta(days=int(r[D_DAY]))).isoformat()
        acc = accounts[int(r[D_ACC])]
        month = day[:7]

        d = by_day[day]
        d["alcance"] += int(r[D_ALC])
        d["impresiones"] += int(r[D_IMP])
        d["leads"] += int(r[D_LED])
        d["clics"] += int(r[D_CLK])

        a = by_account[acc]
        a["alcance"] += int(r[D_ALC])
        a["impresiones"] += int(r[D_IMP])
        a["leads"] += int(r[D_LED])
        a["clics"] += int(r[D_CLK])
        a["spend"] += float(r[D_SPD])

        ma = by_month_account[(month, acc)]
        ma["leads"] += int(r[D_LED])
        ma["spend"] += float(r[D_SPD])

    daily_rows = [
        {"date": day, **{k: v for k, v in vals.items()}}
        for day, vals in sorted(by_day.items())
    ]

    account_rows = [
        {
            "account": acc,
            "currency": currency_by_account.get(acc),
            "alcance": v["alcance"],
            "impresiones": v["impresiones"],
            "leads": v["leads"],
            "clics": v["clics"],
            "spendNative": round(v["spend"], 2),
        }
        for acc, v in sorted(by_account.items())
    ]

    month_account_rows = [
        {
            "month": month,
            "account": acc,
            "currency": currency_by_account.get(acc),
            "leads": v["leads"],
            "spendNative": round(v["spend"], 2),
        }
        for (month, acc), v in sorted(by_month_account.items())
    ]

    # ---- camp: campaign effectiveness --------------------------------------
    by_campaign = defaultdict(lambda: {"impresiones": 0, "leads": 0, "clics": 0, "spend": 0.0, "months": set()})
    for r in p["camp"]:
        acc = accounts[int(r[C_ACC])]
        cmp_name = campaigns[int(r[C_CMP])]
        c = by_campaign[(acc, cmp_name)]
        c["impresiones"] += int(r[C_IMP])
        c["leads"] += int(r[C_LED])
        c["clics"] += int(r[C_CLK])
        c["spend"] += float(r[C_SPD])
        c["months"].add(str(r[C_MONTH]))

    campaign_rows = sorted(
        (
            {
                "account": acc,
                "campaign": name,
                "currency": currency_by_account.get(acc),
                "impresiones": v["impresiones"],
                "leads": v["leads"],
                "clics": v["clics"],
                "spendNative": round(v["spend"], 2),
                "months": len(v["months"]),
            }
            for (acc, name), v in by_campaign.items()
        ),
        key=lambda r: r["leads"],
        reverse=True,
    )

    # ---- pres: marketing budget -------------------------------------------
    budget_rows = [
        {
            "fecha": r[P_FECHA],
            "mes": r[P_MES],
            "proyecto": r[P_PROYECTO],
            "concepto": r[P_CONCEPTO],
            "proveedor": r[P_PROVEEDOR],
            "inversion": r[P_INVERSION],
        }
        for r in p["pres"]
    ]

    out = {
        "_source": (
            "Extracted from the window.__PA_DATA__ payload embedded in "
            "public/mercadeo/performance.html (Power BI pbixray reconstruction). "
            "Regenerate with scripts/extract-mercadeo-panels.py after replacing the export. "
            "spendNative is in each account's own currency (see `currency`) — the Meta Ads "
            "column is mislabelled USD and the Power BI mixes GTQ/USD; do not sum across "
            "accounts without converting."
        ),
        "epoch": p["meta"]["epoch"],
        "refreshed": p["meta"]["refreshed"],
        "excludedCampaign": p.get("exclCmp"),
        "accounts": account_rows,
        "daily": daily_rows,
        "monthAccount": month_account_rows,
        "campaigns": campaign_rows,
        "budget": budget_rows,
    }

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"wrote {OUT.relative_to(ROOT)} | days {len(daily_rows)} "
        f"| accounts {len(account_rows)} | month×account {len(month_account_rows)} "
        f"| campaigns {len(campaign_rows)} | budget {len(budget_rows)}"
    )


if __name__ == "__main__":
    main()
