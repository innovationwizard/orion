type Props = {
  error: string | null;
};

export default function ErrorBanner({ error }: Props) {
  if (!error) return null;

  const isUnauthorized = error === "No autorizado";

  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm font-medium bg-danger/10 text-danger border border-danger/20${isUnauthorized ? " flex items-center flex-wrap gap-3" : ""}`}
    >
      <span>{error}</span>
      {isUnauthorized ? (
        <a
          href="/login"
          className="border-none bg-primary text-white px-4 py-2.5 rounded-full font-semibold cursor-pointer transition-colors hover:bg-primary-hover no-underline"
        >
          Iniciar sesión
        </a>
      ) : null}
    </div>
  );
}
