"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUnits } from "@/hooks/use-units";
import { useSalespeople } from "@/hooks/use-salespeople";
import { useOfflineQueue } from "./use-offline-queue";
import StepProgress from "./step-progress";
import StepUnitSelect from "./step-unit-select";
import StepClientInfo from "./step-client-info";
import StepReceiptUpload, { type ReceiptData } from "./step-receipt-upload";
import StepReviewSubmit from "./step-review-submit";

const EMPTY_RECEIPT: ReceiptData = {
  imageUrl: null,
  receiptFile: null,
  extraction: null,
  depositAmount: "",
  depositDate: "",
  depositBank: "",
  receiptType: "",
  depositorName: "",
};

export default function ReservarClient() {
  const searchParams = useSearchParams();
  const initialUnitId = searchParams.get("unit") ?? undefined;
  const { online, queueSize, enqueue } = useOfflineQueue();

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const [step, setStep] = useState(0);
  const [unitId, setUnitId] = useState(initialUnitId ?? "");
  const [salespersonId, setSalespersonId] = useState("");
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [clientPhone, setClientPhone] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData>(EMPTY_RECEIPT);
  const [submitted, setSubmitted] = useState(false);

  // Fetch unit info for the review step
  const { data: allUnits } = useUnits({ status: "AVAILABLE" });
  const { data: salespeople } = useSalespeople();

  const selectedUnit = useMemo(
    () => allUnits.find((u) => u.id === unitId) ?? null,
    [allUnits, unitId],
  );

  const salespersonName = useMemo(
    () => salespeople.find((s) => s.id === salespersonId)?.display_name ?? "—",
    [salespeople, salespersonId],
  );

  const handleReset = useCallback(() => {
    setStep(0);
    setUnitId("");
    setSalespersonId("");
    setClientNames([]);
    setClientPhone("");
    setLeadSource("");
    setReceipt(EMPTY_RECEIPT);
    setSubmitted(false);
  }, []);

  if (submitted) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] max-w-lg mx-auto grid gap-6">
        <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center grid gap-4">
          <div className="text-5xl">&#10003;</div>
          <h2 className="text-xl font-bold text-text-primary">Reserva enviada</h2>
          <p className="text-sm text-muted">
            La reserva fue registrada exitosamente y está pendiente de revisión por el administrador.
          </p>
          <button
            type="button"
            className="mx-auto px-6 py-3 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors"
            onClick={handleReset}
          >
            Reservar otra unidad
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-[clamp(16px,3vw,32px)] max-w-lg mx-auto grid gap-6">
      {/* Sticky progress + offline banner */}
      <div className="sticky top-0 z-10 bg-bg py-3 -mx-[clamp(16px,3vw,32px)] px-[clamp(16px,3vw,32px)] grid gap-2">
        <StepProgress current={step} />
        {!online && (
          <div className="px-3 py-2 rounded-lg bg-warning/15 text-warning text-xs font-medium flex items-center gap-2" role="status" aria-live="polite">
            <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse" />
            Sin conexion{queueSize > 0 ? ` · ${queueSize} pendiente${queueSize > 1 ? "s" : ""}` : ""}
          </div>
        )}
      </div>

      {/* Steps */}
      {step === 0 && (
        <StepUnitSelect
          initialUnitId={initialUnitId}
          onNext={(uid, sid) => {
            setUnitId(uid);
            setSalespersonId(sid);
            setStep(1);
          }}
        />
      )}

      {step === 1 && (
        <StepClientInfo
          initial={{ clientNames, clientPhone, leadSource }}
          onNext={(info) => {
            setClientNames(info.clientNames);
            setClientPhone(info.clientPhone);
            setLeadSource(info.leadSource);
            setStep(2);
          }}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && (
        <StepReceiptUpload
          initial={receipt}
          onNext={(data) => {
            setReceipt(data);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <StepReviewSubmit
          unit={selectedUnit}
          salespersonName={salespersonName}
          clientNames={clientNames}
          clientPhone={clientPhone}
          leadSource={leadSource}
          receipt={receipt}
          unitId={unitId}
          salespersonId={salespersonId}
          enqueue={enqueue}
          onBack={() => setStep(2)}
          onSuccess={() => setSubmitted(true)}
        />
      )}
    </div>
  );
}
