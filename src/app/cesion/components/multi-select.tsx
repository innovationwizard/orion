"use client";

import { useState, useRef, useEffect } from "react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  formatOption?: (val: string) => string;
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  formatOption,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allSelected = selected.length === 0;
  const display = allSelected
    ? `${label}: Todos`
    : selected.length === 1
      ? `${label}: ${formatOption ? formatOption(selected[0]) : selected[0]}`
      : `${label}: ${selected.length} sel.`;

  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
    else onChange([...selected, val]);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`rounded-md border px-3 py-1.5 text-[13px] cursor-pointer select-none whitespace-nowrap transition-colors ${
          allSelected
            ? "border-border bg-white text-muted hover:border-gray-300"
            : "border-primary bg-blue-50 text-primary"
        }`}
      >
        {display}{" "}
        <span className="ml-1 text-[10px]">{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-border rounded-lg shadow-lg min-w-full max-h-[220px] overflow-y-auto">
          <div
            className={`px-3 py-1.5 text-xs cursor-pointer border-b border-border hover:bg-gray-50 ${
              allSelected ? "text-primary font-semibold" : "text-muted"
            }`}
            onClick={() => {
              onChange([]);
              setOpen(false);
            }}
          >
            Todos
          </div>
          {options.map((opt) => {
            const checked = selected.includes(opt);
            const displayLabel = formatOption ? formatOption(opt) : opt;
            return (
              <div
                key={opt}
                className={`px-3 py-1.5 text-xs cursor-pointer flex items-center gap-2 hover:bg-gray-50 ${
                  checked ? "text-text-primary" : "text-muted"
                }`}
                onClick={() => toggle(opt)}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[10px] shrink-0 ${
                    checked
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {checked ? "\u2713" : ""}
                </span>
                {displayLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
