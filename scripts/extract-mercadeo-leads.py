"""Regenerate src/lib/mercadeo/leads-snapshot.json from the mercadeo artifact.

Run after replacing public/mercadeo/performance.html with a fresh Power BI
reconstruction. Excludes the campaign the artifact's own audit flags as a
mis-mapped Meta export column (site events counted as leads).

Usage: python3 scripts/extract-mercadeo-leads.py
"""
import json
from collections import defaultdict
from datetime import date, timedelta

HTML_PATH = "public/mercadeo/performance.html"
OUT_PATH = "src/lib/mercadeo/leads-snapshot.json"

html = open(HTML_PATH).read()
start = html.find('{"meta":')
if start < 0:
    raise SystemExit(f"No embedded payload found in {HTML_PATH}")
payload, _ = json.JSONDecoder().raw_decode(html[start:])

# daily row format: [d, acc, alc, imp, led, clk, spd, cplS, cplN, frqS, frqN]
LED = 4
led_total = sum(r[LED] for r in payload["daily"])
led_excl = sum(r[LED] for r in payload["exclDaily"])

epoch = date.fromisoformat(payload["meta"]["epoch"])
accounts = payload["acc"]
monthly: dict[str, int] = defaultdict(int)
monthly_account: dict[str, dict[str, int]] = {a: defaultdict(int) for a in accounts}
for r in payload["daily"]:
    month = (epoch + timedelta(days=r[0])).strftime("%Y-%m")
    monthly[month] += r[LED]
    monthly_account[accounts[r[1]]][month] += r[LED]
for r in payload["exclDaily"]:
    month = (epoch + timedelta(days=r[0])).strftime("%Y-%m")
    monthly[month] -= r[LED]
    monthly_account[accounts[r[1]]][month] -= r[LED]

out = {
    "_source": (
        "Extracted from public/mercadeo/performance.html embedded payload (Power BI "
        "pbixray reconstruction). Regenerate with scripts/extract-mercadeo-leads.py "
        "after replacing the artifact."
    ),
    "epoch": payload["meta"]["epoch"],
    "refreshed": payload["meta"]["refreshed"],
    "excludedCampaign": payload["exclCmp"],
    "leadsTotalRaw": led_total,
    "leadsExcludedCampaign": led_excl,
    "leadsNet": led_total - led_excl,
    "leadsByMonth": dict(sorted(monthly.items())),
    "leadsByMonthAccount": {a: dict(sorted(m.items())) for a, m in monthly_account.items()},
}
json.dump(out, open(OUT_PATH, "w"), ensure_ascii=False, indent=2)
print(f"wrote {OUT_PATH}: leadsNet={out['leadsNet']} ({out['epoch']} → {out['refreshed']})")
