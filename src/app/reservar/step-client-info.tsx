"use client";

import { useState } from "react";
import { LEAD_SOURCES } from "@/lib/reservas/constants";

type ClientInfo = {
  clientNames: string[];
  clientPhone: string;
  leadSource: string;
};

type Props = {
  initial: ClientInfo;
  onNext: (info: ClientInfo) => void;
  onBack: () => void;
};

export default function StepClientInfo({ initial, onNext, onBack }: Props) {
  const [names, setNames] = useState<string[]>(
    initial.clientNames.length > 0 ? initial.clientNames : [""],
  );
  const [phone, setPhone] = useState(initial.clientPhone);
  const [leadSource, setLeadSource] = useState(initial.leadSource);
  const [errors, setErrors] = useState<string[]>([]);

  function addName() {
    setNames((prev) => [...prev, ""]);
  }

  function removeName(index: number) {
    if (names.length <= 1) return;
    setNames((prev) => prev.filter((_, i) => i !== index));
  }

  function updateName(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function handleNext() {
    const trimmed = names.map((n) => n.trim()).filter(Boolean);
    const errs: string[] = [];
    if (trimmed.length === 0) errs.push("Ingrese al menos un nombre de cliente.");
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    onNext({ clientNames: trimmed, clientPhone: phone.trim(), leadSource });
  }

  return (
    <div className="grid gap-5">
      <h2 className="text-lg font-bold text-text-primary">Datos del cliente</h2>

      {errors.length > 0 && (
        <div className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm">
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      {/* Client names */}
      <div className="grid gap-3">
        <label className="text-sm font-medium text-text-primary">Nombre(s) del cliente</label>
        {names.map((name, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={`Cliente ${i + 1}`}
              value={name}
              onChange={(e) => updateName(i, e.target.value)}
            />
            {names.length > 1 && (
              <button
                type="button"
                className="px-3 py-2 rounded-lg border border-border text-muted hover:text-danger hover:border-danger text-sm transition-colors"
                onClick={() => removeName(i)}
              >
                &times;
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-primary font-medium hover:underline text-left"
          onClick={addName}
        >
          + Agregar otro nombre
        </button>
      </div>

      {/* Phone */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-text-primary">Teléfono (opcional)</label>
        <input
          type="tel"
          inputMode="numeric"
          className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="5555-1234"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {/* Lead source */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-text-primary">Fuente del lead (opcional)</label>
        <select
          className="px-3 py-2.5 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={leadSource}
          onChange={(e) => setLeadSource(e.target.value)}
        >
          <option value="">Seleccionar fuente</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          className="flex-1 py-3 rounded-lg border border-border text-muted font-medium text-sm hover:bg-bg transition-colors"
          onClick={onBack}
        >
          Atrás
        </button>
        <button
          type="button"
          className="flex-1 py-3 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors"
          onClick={handleNext}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
