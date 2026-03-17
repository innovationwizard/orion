"use client";

import { useCallback, useRef, useState } from "react";
import { RECEIPT_UPLOAD } from "@/lib/reservas/constants";

type Props = {
  label: string;
  onFile: (file: File) => void;
};

export default function DesktopFileInput({ label, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > RECEIPT_UPLOAD.MAX_SIZE_BYTES) {
        alert("El archivo excede el tamaño máximo de 10 MB.");
        return;
      }
      onFile(file);
    },
    [onFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
        dragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-bg/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={RECEIPT_UPLOAD.ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <div className="grid gap-1.5">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-xs text-muted">
          Arrastra un archivo o haz clic para seleccionar
        </span>
        <span className="text-[10px] text-muted">
          JPG, PNG, WebP, HEIC o PDF — máx. 10 MB
        </span>
      </div>
    </div>
  );
}
