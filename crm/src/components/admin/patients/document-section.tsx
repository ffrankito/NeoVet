"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadDocument, getSignedDownloadUrl, deleteDocument } from "@/app/dashboard/patients/document-actions";
import type { Document } from "@/db/schema";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentRow({ doc, patientId }: { doc: Document; patientId: string }) {
  const [isDownloading, startDownload] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleDownload() {
    startDownload(async () => {
      const result = await getSignedDownloadUrl(doc.id);
      if ("error" in result) {
        alert(result.error);
        return;
      }
      // Open in new tab — browser handles PDF preview or file download
      window.open(result.url, "_blank");
    });
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar "${doc.fileName}"? Esta acción no se puede deshacer.`)) return;
    startDelete(async () => {
      await deleteDocument(doc.id, patientId);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium">{doc.fileName}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(doc.sizeBytes)} ·{" "}
          {new Date(doc.createdAt).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          size="sm"
          variant="outline"
          disabled={isDownloading}
          onClick={handleDownload}
        >
          {isDownloading ? "Generando..." : "Descargar"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isDeleting}
          onClick={handleDelete}
          className="text-destructive hover:text-destructive"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

interface DocumentSectionProps {
  patientId: string;
  documents: Document[];
}

export function DocumentSection({ patientId, documents }: DocumentSectionProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    startUpload(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadDocument(patientId, formData);
      if (result && "error" in result) {
        setUploadError(result.error ?? null);
      }
      // Reset input so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={handleUpload}
            disabled={isUploading}
          />
          <span className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
            {isUploading ? "Subiendo..." : "+ Subir documento"}
          </span>
        </label>
      </div>

      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}

      {documents.length === 0 ? (
        <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
          No hay documentos adjuntos.
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} patientId={patientId} />
          ))}
        </div>
      )}
    </div>
  );
}
