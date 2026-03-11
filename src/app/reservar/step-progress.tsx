"use client";

const STEPS = ["Unidad", "Cliente", "Comprobante", "Confirmar"];

type Props = {
  current: number;
};

export default function StepProgress({ current }: Props) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                  done
                    ? "bg-success text-white"
                    : active
                      ? "bg-primary text-white"
                      : "bg-border text-muted"
                }`}
              >
                {done ? "\u2713" : i + 1}
              </span>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  active ? "text-text-primary" : "text-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 h-0.5 rounded ${done ? "bg-success" : "bg-border"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
