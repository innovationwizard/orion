"use client";

export type SectionNavItem = {
  id: string;
  label: string;
  /** When set, the entry is a link to another page rather than an in-page section. */
  href?: string;
};

type SectionNavProps = {
  items: SectionNavItem[];
  /** Called with the section id the user picked, so the host can open + scroll to it. */
  onSelect: (id: string) => void;
  activeId?: string | null;
};

const PILL_BASE =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium no-underline transition-colors";

/**
 * In-page jump bar for the sections of a consolidated area page. Sits below the
 * global Panel nav and above the page body, so sections that used to be their
 * own sidebar entries stay one click away instead of being buried down the page.
 *
 * Entries carrying an `href` navigate away instead of expanding in place, and
 * are marked with an arrow so the difference is visible before clicking.
 */
export default function SectionNav({ items, onSelect, activeId }: SectionNavProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Secciones de la página"
      className="sticky top-0 z-20 -mx-[clamp(16px,3vw,32px)] px-[clamp(16px,3vw,32px)] py-2 bg-bg/85 backdrop-blur border-b border-border"
    >
      <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
        {items.map((item) => {
          if (item.href) {
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  className={`${PILL_BASE} bg-card text-text-primary border-border hover:border-primary/50 hover:text-primary`}
                >
                  {item.label}
                  <span aria-hidden="true" className="text-muted">
                    ↗
                  </span>
                </a>
              </li>
            );
          }

          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? "true" : undefined}
                className={`${PILL_BASE} ${
                  active
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-text-primary border-border hover:border-primary/50"
                }`}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
