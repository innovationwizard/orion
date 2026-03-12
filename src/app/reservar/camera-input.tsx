"use client";

import { useRef } from "react";
import { RECEIPT_UPLOAD } from "@/lib/reservas/constants";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export default function CameraInput({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        disabled={disabled}
        className="w-full py-4 rounded-xl border-2 border-dashed border-border bg-card text-sm font-medium text-primary hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-40"
        onClick={() => inputRef.current?.click()}
      >
        Subir imagen
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={RECEIPT_UPLOAD.ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
