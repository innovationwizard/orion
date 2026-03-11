"use client";

import { useState } from "react";
import type { UnitFull } from "@/lib/reservas/types";
import { UNIT_STATUS_COLORS, UNIT_STATUS_LABELS, formatCurrency } from "@/lib/reservas/constants";

type Props = {
  unit: UnitFull;
};

export default function UnitCell({ unit }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const bg = UNIT_STATUS_COLORS[unit.status];
  const isSold = unit.status === "SOLD";
  const isAvailable = unit.status === "AVAILABLE";

  return (
    <>
      <button
        type="button"
        className="relative min-w-[56px] min-h-[44px] rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:brightness-110 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        style={{ backgroundColor: bg, opacity: isSold ? 0.6 : 1 }}
        title={`${unit.unit_number} — ${UNIT_STATUS_LABELS[unit.status]}`}
        onClick={() => setShowDetail(true)}
      >
        <span className="block leading-tight">{unit.unit_number}</span>
        {unit.area_total ? (
          <span className="block text-[10px] font-normal opacity-80">
            {unit.area_total}m²
          </span>
        ) : null}
      </button>

      {showDetail && (
        <dialog
          open
          className="fixed inset-0 z-50 m-0 flex items-center justify-center bg-transparent"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDetail(false);
          }}
        >
          <div className="fixed inset-0 bg-black/40" />
          <div className="relative bg-card rounded-2xl shadow-card border border-border p-6 w-full max-w-sm mx-4 grid gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary">{unit.unit_number}</h3>
                <span
                  className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: bg }}
                >
                  {UNIT_STATUS_LABELS[unit.status]}
                </span>
              </div>
              <button
                type="button"
                className="text-muted hover:text-text-primary text-xl leading-none"
                onClick={() => setShowDetail(false)}
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Proyecto" value={unit.project_name} />
              <Detail label="Torre" value={unit.tower_name} />
              <Detail label="Piso" value={String(unit.floor_number)} />
              <Detail label="Tipo" value={unit.unit_type} />
              <Detail label="Dormitorios" value={String(unit.bedrooms)} />
              {unit.area_interior ? <Detail label="Interior" value={`${unit.area_interior} m²`} /> : null}
              {unit.area_balcony ? <Detail label="Balcón" value={`${unit.area_balcony} m²`} /> : null}
              {unit.area_terrace ? <Detail label="Terraza" value={`${unit.area_terrace} m²`} /> : null}
              {unit.area_garden ? <Detail label="Jardín" value={`${unit.area_garden} m²`} /> : null}
              {unit.area_total ? <Detail label="Total" value={`${unit.area_total} m²`} /> : null}
              {unit.parking_car > 0 ? <Detail label="Parqueos" value={String(unit.parking_car)} /> : null}
              {unit.bodega_number ? <Detail label="Bodega" value={unit.bodega_number} /> : null}
              <Detail label="Precio" value={formatCurrency(unit.price_list)} />
            </div>

            {isAvailable && (
              <a
                href={`/reservar?unit=${unit.id}`}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors"
              >
                Reservar esta unidad
              </a>
            )}
          </div>
        </dialog>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-muted text-xs">{label}</div>
      <div className="text-text-primary font-medium truncate">{value}</div>
    </div>
  );
}
