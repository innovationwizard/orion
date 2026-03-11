"use client";

type Props = {
  state: "connecting" | "connected" | "disconnected";
};

export default function ConnectionStatus({ state }: Props) {
  const color =
    state === "connected"
      ? "bg-success"
      : state === "connecting"
        ? "bg-warning animate-pulse"
        : "bg-danger";

  const label =
    state === "connected"
      ? "En vivo"
      : state === "connecting"
        ? "Conectando..."
        : "Sin conexión";

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}
