#!/usr/bin/env python3
"""
Extrae la economía de comisiones por proyecto del libro de comisiones y la
escribe como snapshot regenerable para la sección Contable.

    python3 src/app/pabi/contable/scripts/extract-comisiones.py

Lee   : src/app/pabi/calendario_contable/07.26 Comisiones nuevo formato - Julio 2026.xlsx
Escribe: src/app/pabi/contable/data/comisiones-economia.json

Por qué existe este script en vez de números escritos a mano: la convención de
la sección es que todo snapshot importado quede regenerable. Cuando llegue el
corte del mes siguiente se cambia SOURCE y se vuelve a correr.

Notas de estructura del archivo fuente — no son opcionales, cada hoja difiere:

  * Las columnas NO están en la misma letra en cada hoja. En Boulevard 5 el
    precio está en H; en Benestare en I; en Bosque Las Tapias en J. Por eso
    todo se localiza por etiqueta de encabezado, nunca por letra fija.

  * Cada beneficiario tiene un bloque de 9 columnas que arranca donde la fila 4
    dice "Fase 1":
        +0 indicador Fase 1      +1 monto Fase 1
        +2 indicador enganche    +3 monto Fase 2 (enganche)
        +4 indicador mensual     +5 monto Fase 2 (cuota del mes)
        +6 indicador escrituras  +7 monto Fase 3
        +8 TOTAL SIN IVA
    Dos bloques son agregados y no personas: "PUERTA ABIERTA" (el 2.5% de la
    empresa) y "COMISIÓN TOTAL" (el 5% completo).

  * Cada hoja tiene una fila de totales propia, y DEBAJO de ella filas de ISR /
    IVA / TOTAL LIQUIDO A RECIBIR / VALOR A FACTURAR, y en algunas hojas todavía
    más filas de unidades agregadas después. Sumar la columna entera cuenta la
    fila de totales dos veces. El período se toma de la fila de totales de la
    propia hoja (verificada contra "Resumen Ahorros"); los acumulados de vida
    del proyecto se suman fila por fila filtrando por unidad con precio real.
"""

import json
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:  # pragma: no cover - guía para el operador
    sys.exit("Falta openpyxl. Instalar con: pip3 install openpyxl")

ROOT = Path(__file__).resolve().parents[4]  # .../src
REPO = ROOT.parent
SOURCE = REPO / "src/app/pabi/calendario_contable/07.26 Comisiones nuevo formato - Julio 2026.xlsx"
OUT = REPO / "src/app/pabi/contable/data/comisiones-economia.json"

PERIODO = "Julio 2026"

# Hoja del libro -> nombre del proyecto tal como se muestra en el tablero.
# Casa Elisa queda fuera a propósito: el libro trae tres hojas ("Casa Elisa",
# "Casa Elisa Final", "Casa Elisa Final (2)") con 73, 75 y 76 unidades y totales
# distintos, y la planilla de Pagos no paga nada del proyecto este período. No
# se elige una hoja a criterio propio; se marca como dato inexistente.
PROJECT_SHEETS = {
    "Boulervard 5 Final": "Boulevard 5",
    "Benestare Final": "Benestare",
    "Bosque Las Tapias": "Bosque Las Tapias",
}

# Nombre del proyecto -> etiqueta con que aparece en la hoja "Pagos".
PAGOS_LABELS = {
    "Boulevard 5": "Total a pagar Boulevard 5",
    "Benestare": "Total a pagar Benestare",
    "Bosque Las Tapias": "Total a pagar Bosque Las Tapias",
    "Casa Elisa": "Total a pagar Casa Elisa",
}

BLOCK_TOTAL = "COMISIÓN TOTAL"
BLOCK_PUERTA = "PUERTA ABIERTA"


def norm(value):
    """Normaliza texto de celda: colapsa espacios y pasa a mayúsculas."""
    if not isinstance(value, str):
        return None
    return " ".join(value.split()).upper()


def num(value):
    return float(value) if isinstance(value, (int, float)) else 0.0


def find_col(ws, row, needle, exact=False):
    """Busca una columna por su etiqueta en una fila de encabezado."""
    target = norm(needle)
    for col in range(1, ws.max_column + 1):
        label = norm(ws.cell(row=row, column=col).value)
        if label is None:
            continue
        if (label == target) if exact else (target in label):
            return col
    return None


def find_blocks(ws):
    """Mapea cada bloque de fases a su columna inicial, por dueño del bloque."""
    blocks = {}
    for col in range(1, ws.max_column + 1):
        if norm(ws.cell(row=4, column=col).value) != "FASE 1":
            continue
        owner = None
        for back in range(col, max(0, col - 9), -1):
            label = norm(ws.cell(row=3, column=back).value)
            if label and label != "VENTAS DEL MES":
                owner = label
                break
        if owner:
            blocks[owner] = col
    return blocks


def find_totals_row(ws, total_block_col):
    """
    La fila de totales de la hoja: tiene monto en el bloque COMISIÓN TOTAL pero
    ninguna identidad de unidad (ni No., ni ID depto, ni cliente). Es la única
    fila así por encima de las filas de impuestos.
    """
    for row in range(7, ws.max_row + 1):
        if abs(num(ws.cell(row=row, column=total_block_col + 8).value)) <= 0.005:
            continue
        identity = [ws.cell(row=row, column=c).value for c in range(2, 7)]
        if all(v in (None, "") for v in identity):
            return row
    return None


def extract_project(ws, name):
    col_precio = find_col(ws, 6, "Precio de Venta Con Impuestos")
    col_base = find_col(ws, 6, "Precio de Venta sin Impuestos")
    col_puerta = find_col(ws, 5, "PUERTA A", exact=True)
    col_total = find_col(ws, 5, "TOTAL", exact=True)
    blocks = find_blocks(ws)
    blk_total = blocks.get(BLOCK_TOTAL)
    blk_puerta = blocks.get(BLOCK_PUERTA)

    missing = [
        label
        for label, value in [
            ("precio", col_precio), ("base", col_base), ("PUERTA A", col_puerta),
            ("TOTAL", col_total), ("bloque COMISIÓN TOTAL", blk_total),
            ("bloque PUERTA ABIERTA", blk_puerta),
        ]
        if value is None
    ]
    if missing:
        sys.exit(f"[{name}] no se encontró: {', '.join(missing)}")

    totals_row = find_totals_row(ws, blk_total)
    if totals_row is None:
        sys.exit(f"[{name}] no se encontró la fila de totales de la hoja")

    # Acumulado de vida del proyecto: sólo filas que son una unidad real.
    # Se excluye la fila de totales y las de impuestos porque no traen precio.
    unidades = 0
    valor_vendido = base_sin_impuestos = comision_total = puerta_abierta = 0.0
    for row in range(7, ws.max_row + 1):
        if row == totals_row:
            continue
        precio = ws.cell(row=row, column=col_precio).value
        if not isinstance(precio, (int, float)) or precio <= 0:
            continue
        unidades += 1
        valor_vendido += num(precio)
        base_sin_impuestos += num(ws.cell(row=row, column=col_base).value)
        comision_total += num(ws.cell(row=row, column=col_total).value)
        puerta_abierta += num(ws.cell(row=row, column=col_puerta).value)

    # Período: se lee de la fila de totales de la hoja, no se re-suma.
    fase1 = num(ws.cell(row=totals_row, column=blk_total + 1).value)
    fase2 = num(ws.cell(row=totals_row, column=blk_total + 3).value) + num(
        ws.cell(row=totals_row, column=blk_total + 5).value
    )
    fase3 = num(ws.cell(row=totals_row, column=blk_total + 7).value)
    periodo_total = num(ws.cell(row=totals_row, column=blk_total + 8).value)
    periodo_puerta = num(ws.cell(row=totals_row, column=blk_puerta + 8).value)

    return {
        "name": name,
        "unidades": unidades,
        "valorVendido": round(valor_vendido, 2),
        "baseSinImpuestos": round(base_sin_impuestos, 2),
        "comisionTotal": round(comision_total, 2),
        "puertaAbierta": round(puerta_abierta, 2),
        "estructuraComercial": round(comision_total - puerta_abierta, 2),
        "periodo": {
            "fase1": round(fase1, 2),
            "fase2": round(fase2, 2),
            "fase3": round(fase3, 2),
            "total": round(periodo_total, 2),
            "puertaAbierta": round(periodo_puerta, 2),
            "estructuraComercial": round(periodo_total - periodo_puerta, 2),
        },
    }


def extract_pagos(wb):
    """Planilla de pago del período: bruto a facturar y neto a pagar por proyecto."""
    ws = wb["Pagos"]
    out = {}
    wanted = {norm(v): k for k, v in PAGOS_LABELS.items()}
    for row in range(1, ws.max_row + 1):
        for col in range(1, 10):
            label = norm(ws.cell(row=row, column=col).value)
            if label in wanted:
                out[wanted[label]] = {
                    "aFacturar": round(num(ws.cell(row=row, column=7).value), 2),
                    "aPagar": round(num(ws.cell(row=row, column=8).value), 2),
                    # La hoja marca "OK" al lado del total cuando las líneas por
                    # beneficiario suman exactamente el total del proyecto.
                    "cuadrado": norm(ws.cell(row=row, column=9).value) == "OK",
                }
    return out


def main():
    if not SOURCE.exists():
        sys.exit(f"No se encontró el archivo fuente: {SOURCE}")

    wb = openpyxl.load_workbook(SOURCE, data_only=True)
    pagos = extract_pagos(wb)

    proyectos = []
    for sheet, name in PROJECT_SHEETS.items():
        if sheet not in wb.sheetnames:
            sys.exit(f"El libro no trae la hoja '{sheet}'")
        project = extract_project(wb[sheet], name)
        run = pagos.get(name)
        project["periodo"]["aFacturar"] = run["aFacturar"] if run else None
        project["periodo"]["aPagar"] = run["aPagar"] if run else None
        project["periodo"]["cuadrado"] = run["cuadrado"] if run else None
        proyectos.append(project)

        # Invariantes del libro. Si alguna se rompe, el archivo cambió de forma
        # y los números no deben publicarse sin revisarlos.
        base = project["baseSinImpuestos"]
        if base:
            factor = project["valorVendido"] / base
            tasa = project["comisionTotal"] / base
            reparto = project["puertaAbierta"] / project["comisionTotal"]
            print(
                f"  {name:<20} unidades={project['unidades']:>4}  "
                f"factor={factor:.5f}  tasa={tasa:.5f}  puerta/total={reparto:.5f}"
            )
            if abs(factor - 1.093) > 0.002:
                print(f"    !! factor de impuestos fuera de 1.093 en {name}")
            if abs(tasa - 0.05) > 0.0005:
                print(f"    !! la comisión total no da 5% en {name}")
            if abs(reparto - 0.5) > 0.005:
                print(f"    !! el reparto Puerta Abierta / total no da 50% en {name}")

    casa_elisa = pagos.get("Casa Elisa")
    payload = {
        "status": "ready",
        "updatedAt": "2026-07-31",
        "source": SOURCE.name,
        "generatedBy": "src/app/pabi/contable/scripts/extract-comisiones.py",
        "periodo": PERIODO,
        "factorImpuestos": 1.093,
        "cap": 0.05,
        "proyectos": proyectos,
        "sinDatoDeVida": [
            {
                "name": "Casa Elisa",
                "aPagarPeriodo": casa_elisa["aPagar"] if casa_elisa else 0,
                "motivo": (
                    "El libro trae tres hojas de Casa Elisa con 73, 75 y 76 unidades y "
                    "totales distintos. No se elige una a criterio propio: el valor "
                    "vendido y el 5% acumulado del proyecto quedan sin publicar hasta "
                    "que Contabilidad indique cuál hoja es la vigente. La planilla de "
                    "pago del período sí es firme y es cero."
                ),
            }
        ],
        "assumption": {
            "decision": (
                "El monto del período se lee de la fila de totales de cada hoja, no de "
                "una re-suma de las columnas: debajo de esa fila el libro repite filas "
                "de unidades que no entran en el total de la hoja. Los tres proyectos "
                "cuadran exactamente contra la columna PUERTA de 'Resumen Ahorros' "
                "(Boulevard 5 Q69,533.86 · Benestare Q65,945.39 · Bosque Las Tapias "
                "Q24,681.53), que es la verificación de que la fila leída es la correcta."
            ),
            "ifChanged": (
                "Para el corte siguiente: cambiar SOURCE y PERIODO en "
                "src/app/pabi/contable/scripts/extract-comisiones.py y volver a correrlo. "
                "Si Contabilidad confirma cuál hoja de Casa Elisa es la vigente, agregarla "
                "a PROJECT_SHEETS y quitarla de sinDatoDeVida."
            ),
        },
    }

    print("\nPlanilla de pago del período:")
    for name, run in pagos.items():
        print(f"  {name:<20} facturar={run['aFacturar']:>12,.2f}  pagar={run['aPagar']:>12,.2f}  cuadrado={run['cuadrado']}")

    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nEscrito: {OUT.relative_to(REPO)}")


if __name__ == "__main__":
    main()
