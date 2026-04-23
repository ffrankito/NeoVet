"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getConsentDocumentDownloadUrl } from "@/app/dashboard/consent-documents/actions";

interface ConsentRow {
  id: string;
  templateName: string | null;
  patientName: string;
  clientName: string | null;
  generatedAt: Date;
  storagePath: string | null;
}

interface ConsentTableProps {
  data: ConsentRow[];
  total: number;
  page: number;
  totalPages: number;
}

function formatDateAR(date: Date): string {
  return new Date(date).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export function ConsentTable({
  data,
  total,
  page,
  totalPages,
}: ConsentTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") ?? "");

  function applySearch() {
    startTransition(() => {
      const params = new URLSearchParams();
      const trimmed = searchTerm.trim();
      if (trimmed) params.set("q", trimmed);
      router.push(`/dashboard/consent-documents?${params.toString()}`);
    });
  }

  function goToPage(p: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      router.push(`/dashboard/consent-documents?${params.toString()}`);
    });
  }

  async function handleDownload(id: string) {
    setDownloadingId(id);
    try {
      const result = await getConsentDocumentDownloadUrl(id);
      if ("url" in result && result.url) {
        window.open(result.url, "_blank");
      } else if ("error" in result) {
        alert(result.error);
      }
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Buscar</label>
          <Input
            type="search"
            placeholder="Mascota, dueño, DNI, teléfono, dirección"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            className="w-60"
          />
        </div>

        <Button variant="outline" onClick={applySearch} disabled={isPending}>
          Buscar
        </Button>

        <span className="ml-auto text-sm text-muted-foreground">
          {total} documento{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Dueño</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Descargar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay documentos de consentimiento generados.
                </TableCell>
              </TableRow>
            ) : (
              data.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    {doc.templateName ?? "—"}
                  </TableCell>
                  <TableCell>{doc.patientName}</TableCell>
                  <TableCell>{doc.clientName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateAR(doc.generatedAt)}
                  </TableCell>
                  <TableCell>
                    {doc.storagePath ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={downloadingId === doc.id}
                        onClick={() => handleDownload(doc.id)}
                      >
                        {downloadingId === doc.id
                          ? "Descargando..."
                          : "Descargar"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Sin archivo
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending}
            onClick={() => goToPage(page - 1)}
          >
            ← Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isPending}
            onClick={() => goToPage(page + 1)}
          >
            Siguiente →
          </Button>
        </div>
      )}
    </div>
  );
}
