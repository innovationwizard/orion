"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
  id?: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  /** Controlled mode: when provided, the parent owns the open state. */
  open?: boolean;
  onToggle?: (next: boolean) => void;
  children: ReactNode;
};

/**
 * Foldable section card: the header is always rendered, the body mounts lazily
 * on first expand and stays mounted afterward — so a section the user never
 * opens never fetches, and toggling one that is already open does not refetch.
 */
export default function CollapsibleSection({
  id,
  title,
  subtitle,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const [everOpened, setEverOpened] = useState(open);
  // useId, not a random string: the value must match between the server render
  // and hydration or React discards the tree and the page comes up blank.
  const bodyId = useId();

  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);

  function toggle() {
    const next = !open;
    if (!isControlled) setUncontrolledOpen(next);
    onToggle?.(next);
  }

  return (
    <section id={id} className="bg-card rounded-2xl shadow-card border border-border scroll-mt-16">
      {/* Only the chevron toggles. The title and subtitle are plain text, so
          clicking or selecting them never collapses the section underneath. */}
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          {subtitle ? <p className="text-sm text-muted m-0">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={`${open ? "Contraer" : "Expandir"} ${title}`}
          title={open ? "Contraer sección" : "Expandir sección"}
          className="shrink-0 grid place-items-center w-9 h-9 rounded-full border border-border bg-bg text-muted hover:border-primary/50 hover:text-primary transition-colors"
        >
          <span className={`leading-none transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
            ▾
          </span>
        </button>
      </div>
      {everOpened ? (
        <div id={bodyId} className={open ? "grid gap-4 px-4 pb-4" : "hidden"}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
