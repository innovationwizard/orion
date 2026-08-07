"""Reshape the Puerta Abierta PBIX model into a compact JSON payload.

Grain is chosen from what the report's visuals actually consume, so no number is
approximated:

  daily (fecha, cuenta)          3361 rows  -> KPI cards, trends, per-project charts
  camp  (mes, cuenta, campana)    458 rows  -> campaign treemap + campaign table
  res   row-level                 379 rows
  inv   row-level                 814 rows
  pres  row-level                  29 rows

Row-level AVERAGE measures (Frecuencia, Costo por cliente potencial) are carried as
(sum, n) pairs so AVERAGE is reproduced exactly rather than silently becoming a
weighted mean.
"""
import json
import pandas as pd
from pbixray import PBIXRay

SRC = '/mnt/user-data/uploads/Performance_Dashboard_-_Puerta_Abierta.pbix'
m = PBIXRay(SRC)

perf = m.get_table('Performance - Data Base PA')
perf['Fecha'] = pd.to_datetime(perf['Fecha'])
EPOCH = perf['Fecha'].min()

accs = sorted(perf['Nombre de la cuenta'].dropna().unique().tolist())
cmps = sorted(perf['Nombre de la campaña'].dropna().unique().tolist())
ai = {a: i for i, a in enumerate(accs)}
ci = {c: i for i, c in enumerate(cmps)}

AGG = dict(
    alc=('Alcance', 'sum'), imp=('Impresiones', 'sum'),
    led=('Clientes potenciales', 'sum'), clk=('Clics (todos)', 'sum'),
    spd=('Importe gastado (USD)', 'sum'),
    cplS=('Costo por cliente potencial', 'sum'),
    cplN=('Costo por cliente potencial', 'count'),
    frqS=('Frecuencia', 'sum'), frqN=('Frecuencia', 'count'),
)

d = perf.groupby([perf['Fecha'], 'Nombre de la cuenta']).agg(**AGG).reset_index()
d.columns = ['d', 'acc'] + list(AGG)
daily = [[int((r.d - EPOCH).days), ai[r.acc],
          int(r.alc or 0), int(r.imp or 0), int(r.led or 0), int(r.clk or 0),
          round(float(r.spd or 0), 2),
          round(float(r.cplS or 0), 2), int(r.cplN),
          round(float(r.frqS or 0), 3), int(r.frqN)] for r in d.itertuples()]

EXCLUDED_CMP = 'cons_guat__kpa_LeadsWebsiteBoulevard_fb_lds_cpa_11noval20nov'
ex = perf[perf['Nombre de la campaña'] == EXCLUDED_CMP]
xd = ex.groupby([ex['Fecha'], 'Nombre de la cuenta']).agg(**AGG).reset_index()
xd.columns = ['d', 'acc'] + list(AGG)
exclDaily = [[int((r.d - EPOCH).days), ai[r.acc],
              int(r.alc or 0), int(r.imp or 0), int(r.led or 0), int(r.clk or 0),
              round(float(r.spd or 0), 2),
              round(float(r.cplS or 0), 2), int(r.cplN),
              round(float(r.frqS or 0), 3), int(r.frqN)] for r in xd.itertuples()]
print('excluded-campaign daily rows:', len(exclDaily))

c = perf.groupby([perf['Fecha'].dt.to_period('M').astype(str),
                  'Nombre de la cuenta', 'Nombre de la campaña']).agg(
    imp=('Impresiones', 'sum'), led=('Clientes potenciales', 'sum'),
    clk=('Clics (todos)', 'sum'), spd=('Importe gastado (USD)', 'sum'),
).reset_index()
c.columns = ['m', 'acc', 'cmp', 'imp', 'led', 'clk', 'spd']
camp = [[r.m, ai[r.acc], ci[r.cmp], int(r.imp or 0), int(r.led or 0),
         int(r.clk or 0), round(float(r.spd or 0), 2)] for r in c.itertuples()]

res = m.get_table('insights list')
res['Fecha de añadición'] = pd.to_datetime(res['Fecha de añadición'])
S = lambda v: None if pd.isna(v) else str(v)

DICTS = {}
def enc(kind, v):
    """Dictionary-encode a string column; returns a stable integer index (or None)."""
    if v is None:
        return None
    d = DICTS.setdefault(kind, {})
    return d.setdefault(v, len(d))

res_rows = [[None if pd.isna(r['Fecha de añadición']) else int((r['Fecha de añadición'].normalize() - EPOCH).days),
             enc('proy', S(r['Proyecto'])), enc('fte', S(r['Fuente - Persona'])),
             enc('fteT', S(r['Fuente - Trato'])), (0 if pd.isna(r['Trato']) else 1),
             enc('user', S(r['Asignado al usuario'])), enc('etapa', S(r['Etapa'])),
             enc('estado', S(r['Estado']))] for _, r in res.iterrows()]

inv = m.get_table('Inventarios')
inv['Fecha de reserva'] = pd.to_datetime(inv['Fecha de reserva'])
I = lambda v: None if pd.isna(v) else int(v)
N = lambda v: None if pd.isna(v) else round(float(v), 2)
inv_rows = [[enc('iproy', S(r['Proyecto'])), enc('niv', S(r['Nivel'])), I(r['Número ']),
             enc('tipo', S(r['Tipo'])), N(r['M² ']), I(r['Habitaciones']),
             I(r['Precio de Venta']), enc('est', S(r['Estatus'])),
             None if pd.isna(r['Fecha de reserva']) else int((r['Fecha de reserva'] - EPOCH).days)]
            for _, r in inv.iterrows()]

pre = m.get_table('Presupuesto').dropna(how='all')
pre_rows = [[S(r['Fecha']), S(r['Mes']), S(r['Proyecto']), S(r['Concepto']),
             S(r['Proveedor']), N(r['Inversión'])] for _, r in pre.iterrows()]

payload = {
    'meta': {'epoch': EPOCH.strftime('%Y-%m-%d'), 'refreshed': '2026-08-04',
             'perfSourceRows': int(len(perf))},
    'acc': accs, 'cmp': cmps,
    'dict': {k: list(v.keys()) for k, v in DICTS.items()},
    'daily': daily, 'camp': camp, 'exclDaily': exclDaily,
    'exclCmp': EXCLUDED_CMP,
    'res': res_rows, 'inv': inv_rows, 'pres': pre_rows,
}
out = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
open('data.json', 'w').write(out)
print('bytes:', len(out), '| daily', len(daily), '| camp', len(camp),
      '| res', len(res_rows), '| inv', len(inv_rows), '| pres', len(pre_rows))
print('epoch', EPOCH.date(), 'max', perf['Fecha'].max().date())
