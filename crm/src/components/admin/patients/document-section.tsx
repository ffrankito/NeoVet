"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadDocument, getSignedDownloadUrl, deleteDocument } from "@/app/dashboard/patients/document-actions";
import type { Document } from "@/db/schema";

const CATEGORY_LABELS: Record<string, string> = {
  laboratorio: "Laboratorio",
  radiografia: "Radiografía",
  ecografia: "Ecografía",
  foto: "Foto",
  otro: "Otro",
};

const CATEGORY_COLORS: Record<string, string> = {
  laboratorio: "bg-blue-100 text-blue-700",
  radiografia: "bg-yellow-100 text-yellow-700",
  ecografia:   "bg-purple-100 text-purple-700",
  foto:        "bg-green-100 text-green-700",
  otro:        "bg-gray-100 text-gray-700",
};

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
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{doc.fileName}</p>
          {doc.category && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[doc.category] ?? "bg-gray-100 text-gray-700"}`}>
              {CATEGORY_LABELS[doc.category] ?? doc.category}
            </span>
          )}
        </div>
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
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    startUpload(async () => {
      const formData = new FormData();
      formData.set("file", file);
      if (selectedCategory) formData.set("category", selectedCategory);
      const result = await uploadDocument(patientId, formData);
      if (result && "error" in result) {
        setUploadError(result.error ?? null);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedCategory("");
    });
  }

  const filteredDocs = activeFilter
    ? documents.filter((d) => d.category === activeFilter)
    : documents;

  const usedCategories = [...new Set(documents.map((d) => d.category).filter(Boolean))];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isUploading}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Sin categoría</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
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
      </div>

      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}

      {usedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveFilter("")}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${activeFilter === "" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            Todos
          </button>
          {usedCategories.map((cat) => cat && (
            <button
              key={cat}
              onClick={() => setActiveFilter(activeFilter === cat ? "" : cat)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${activeFilter === cat ? CATEGORY_COLORS[cat] : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {filteredDocs.length === 0 ? (
        <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
          {activeFilter ? "No hay documentos en esta categoría." : "No hay documentos adjuntos."}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocs.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} patientId={patientId} />
          ))}
        </div>
      )}
    </div>
  );
}
