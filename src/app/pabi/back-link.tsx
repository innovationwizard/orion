"use client";

import { useSearchParams } from "next/navigation";

type BackLinkProps = {
  /** Where to return to. */
  href: string;
  /** Text after the arrow, e.g. "Ventas por Proyecto". */
  label: string;
  /**
   * Only render when the URL carries `?from=<expectedFrom>`. Pages reached both
   * by navigation and as a landing page (the dashboard is where every data
   * viewer lands after login) must not show a back link to somewhere the user
   * never was.
   */
  expectedFrom: string;
};

export default function BackLink({ href, label, expectedFrom }: BackLinkProps) {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== expectedFrom) return null;

  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-text-primary no-underline hover:border-primary/50 hover:text-primary transition-colors"
    >
      <span aria-hidden="true">←</span>
      Volver a {label}
    </a>
  );
}
