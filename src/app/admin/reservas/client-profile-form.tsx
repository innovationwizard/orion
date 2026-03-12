"use client";

import { useEffect, useState } from "react";
import { BUYER_PERSONA_OPTIONS } from "@/lib/reservas/constants";

type Props = {
  clientId: string;
};

type ProfileData = Record<string, unknown>;

export default function ClientProfileForm({ clientId }: Props) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form fields
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [purchaseType, setPurchaseType] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [childrenCount, setChildrenCount] = useState("");
  const [department, setDepartment] = useState("");
  const [zone, setZone] = useState("");
  const [occupationType, setOccupationType] = useState("");
  const [industry, setIndustry] = useState("");
  const [incomeIndividual, setIncomeIndividual] = useState("");
  const [incomeFamily, setIncomeFamily] = useState("");
  const [channel, setChannel] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reservas/buyer-persona/${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setProfile(data);
          setGender(data.gender ?? "");
          setBirthDate(data.birth_date ?? "");
          setEducationLevel(data.education_level ?? "");
          setPurchaseType(data.purchase_type ?? "");
          setMaritalStatus(data.marital_status ?? "");
          setChildrenCount(data.children_count != null ? String(data.children_count) : "");
          setDepartment(data.department ?? "");
          setZone(data.zone ?? "");
          setOccupationType(data.occupation_type ?? "");
          setIndustry(data.industry ?? "");
          setIncomeIndividual(data.monthly_income_individual != null ? String(data.monthly_income_individual) : "");
          setIncomeFamily(data.monthly_income_family != null ? String(data.monthly_income_family) : "");
          setChannel(data.acquisition_channel ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/reservas/buyer-persona/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: gender || null,
          birth_date: birthDate || null,
          education_level: educationLevel || null,
          purchase_type: purchaseType || null,
          marital_status: maritalStatus || null,
          children_count: childrenCount ? Number(childrenCount) : null,
          department: department || null,
          zone: zone || null,
          occupation_type: occupationType || null,
          industry: industry || null,
          monthly_income_individual: incomeIndividual ? Number(incomeIndividual) : null,
          monthly_income_family: incomeFamily ? Number(incomeFamily) : null,
          acquisition_channel: channel || null,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Error al guardar");
      setProfile(payload);
      setMessage("Perfil guardado");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Perfil Buyer Persona</h4>
        <div className="h-4 rounded bg-border animate-pulse w-1/2" />
      </div>
    );
  }

  const selectCls = "px-2 py-1.5 rounded-lg border border-border bg-card text-text-primary text-xs w-full";
  const inputCls = selectCls;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Perfil Buyer Persona</h4>
        <button
          type="button"
          className="text-xs text-primary hover:underline font-medium"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Guardando..." : profile ? "Actualizar" : "Crear perfil"}
        </button>
      </div>

      {message && (
        <span className="text-xs text-success">{message}</span>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Genero</span>
          <select className={selectCls} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">—</option>
            {BUYER_PERSONA_OPTIONS.gender.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>

        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Tipo compra</span>
          <select className={selectCls} value={purchaseType} onChange={(e) => setPurchaseType(e.target.value)}>
            <option value="">—</option>
            {BUYER_PERSONA_OPTIONS.purchase_type.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>

        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Estado civil</span>
          <select className={selectCls} value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)}>
            <option value="">—</option>
            {BUYER_PERSONA_OPTIONS.marital_status.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>

        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Hijos</span>
          <input className={inputCls} type="number" min="0" value={childrenCount} onChange={(e) => setChildrenCount(e.target.value)} placeholder="0" />
        </label>

        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Fecha nac.</span>
          <input className={inputCls} type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </label>

        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Educacion</span>
          <select className={selectCls} value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
            <option value="">—</option>
            {BUYER_PERSONA_OPTIONS.education.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>

        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Ocupacion</span>
          <select className={selectCls} value={occupationType} onChange={(e) => setOccupationType(e.target.value)}>
            <option value="">—</option>
            {BUYER_PERSONA_OPTIONS.occupation.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>

        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Industria</span>
          <input className={inputCls} type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Sector..." />
        </label>

        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Departamento</span>
          <select className={selectCls} value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">—</option>
            {BUYER_PERSONA_OPTIONS.departments.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>

        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Zona</span>
          <input className={inputCls} type="text" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zona..." />
        </label>

        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Ingreso individual</span>
          <input className={inputCls} type="number" step="0.01" value={incomeIndividual} onChange={(e) => setIncomeIndividual(e.target.value)} placeholder="Q" />
        </label>

        <label className="grid gap-0.5">
          <span className="text-xs text-muted">Ingreso familiar</span>
          <input className={inputCls} type="number" step="0.01" value={incomeFamily} onChange={(e) => setIncomeFamily(e.target.value)} placeholder="Q" />
        </label>

        <label className="grid gap-0.5 col-span-2">
          <span className="text-xs text-muted">Canal adquisicion</span>
          <select className={selectCls} value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">—</option>
            {BUYER_PERSONA_OPTIONS.channels.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
