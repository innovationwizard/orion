type Props = {
  error: string | null;
};

export default function ErrorBanner({ error }: Props) {
  if (!error) return null;

  const isUnauthorized = error === "No autorizado";

  return (
    <div
      className="banner danger"
      style={isUnauthorized ? { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 } : undefined}
    >
      <span>{error}</span>
      {isUnauthorized ? (
        <a href="/login" className="button">
          Iniciar sesión
        </a>
      ) : null}
    </div>
  );
}
