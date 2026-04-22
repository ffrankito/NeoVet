"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateConsentDocument } from "@/app/dashboard/consent-documents/actions";
import { SearchableSelect } from "@/components/ui/searchable-select";

type ActionResult =
  | {
      errors?: Record<string, string | string[] | undefined>;
      error?: string;
    }
  | undefined;

interface PatientOption {
  id: string;
  name: string;
  species: string;
  clientId: string;
  clientName: string;
}

interface ClientOption {
  id: string;
  name: string;
}

interface ConsentFormProps {
  templates: Array<{ id: string; name: string }>;
  clients?: ClientOption[];
  patients?: PatientOption[];
  patientId?: string;
  patientName?: string;
  procedureId?: string;
  hospitalizationId?: string;
  staffName?: string;
  staffLicenseNumber?: string;
}

function getTemplateType(templateName: string): string {
  const lower = templateName.toLowerCase();
  if (lower.includes("cirugía") || lower.includes("cirugia")) return "surgery_consent";
  if (lower.includes("eutanasia")) return "euthanasia_consent";
  if (lower.includes("reproductiva")) return "reproductive_agreement";
  return "surgery_consent";
}

export function ConsentForm({
  templates,
  clients = [],
  patients = [],
  patientId,
  patientName,
  procedureId,
  hospitalizationId,
  staffName,
  staffLicenseNumber,
}: ConsentFormProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customDiagnosis, setCustomDiagnosis] = useState("");
  const [customProcedureDesc, setCustomProcedureDesc] = useState("");
  const [customPedigree, setCustomPedigree] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(patientId ?? "");

  const filteredPatients = patients.filter((p) => p.clientId === selectedClient);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const templateType = selectedTemplate ? getTemplateType(selectedTemplate.name) : null;

  const action = async (_prev: ActionResult, formData: FormData) => {
    formData.set("patientId", selectedPatient || patientId || "");

    const customFields: Record<string, string> = {};
    if (templateType === "surgery_consent" && customProcedureDesc.trim()) {
      customFields.procedureDescription = customProcedureDesc.trim();
    }
    if (templateType === "euthanasia_consent") {
      if (staffName) customFields.vetName = staffName;
      if (staffLicenseNumber) customFields.vetLicenseNumber = staffLicenseNumber;
      if (customDiagnosis.trim()) customFields.diagnosis = customDiagnosis.trim();
    }
    if (templateType === "reproductive_agreement" && customPedigree.trim()) {
      customFields.patientPedigree = customPedigree.trim();
    }
    if (Object.keys(customFields).length > 0) {
      formData.set("customFields", JSON.stringify(customFields));
    }

    return generateConsentDocument(formData);
  };

  const [result, dispatch, isPending] = useActionState(action, undefined);
  const error = result && "error" in result ? result.error : null;
  const errors =
    result && "errors" in result
      ? (result.errors ?? {})
      : ({} as Record<string, string | string[] | undefined>);

  return (
    <form action={dispatch} className="max-w-xl space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {patientId ? (
        <input type="hidden" name="patientId" value={patientId} />
      ) : (
        <>
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <SearchableSelect
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
              value={selectedClient}
              onChange={(v) => { setSelectedClient(v); setSelectedPatient(""); }}
              placeholder="Seleccioná un cliente"
              searchPlaceholder="Buscar cliente..."
              emptyMessage="No se encontró ningún cliente."
            />
          </div>

          {selectedClient && (
            <div className="space-y-2">
              <Label>Paciente *</Label>
              {filteredPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este cliente no tiene pacientes.</p>
              ) : (
                <SearchableSelect
                  options={filteredPatients.map((p) => ({
                    value: p.id,
                    label: p.name,
                    sublabel: p.clientName,
                  }))}
                  value={selectedPatient}
                  onChange={setSelectedPatient}
                  placeholder="Seleccioná un paciente"
                  searchPlaceholder="Buscar paciente..."
                  emptyMessage="No se encontró ningún paciente."
                />
              )}
            </div>
          )}
        </>
      )}

      {procedureId && <input type="hidden" name="procedureId" value={procedureId} />}
      {hospitalizationId && <input type="hidden" name="hospitalizationId" value={hospitalizationId} />}

      <div className="space-y-2">
        <Label htmlFor="templateId">Plantilla *</Label>
        <Select
          name="templateId"
          required
          value={selectedTemplateId}
          onValueChange={(val) => setSelectedTemplateId(val ?? "")}
        >
          <SelectTrigger id="templateId" aria-invalid={!!errors?.templateId}>
            <SelectValue placeholder="Seleccionar plantilla..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.templateId && (
          <p className="text-xs text-destructive">{errors.templateId}</p>
        )}
      </div>

      {templateType === "surgery_consent" && (
        <div className="space-y-2">
          <Label htmlFor="procedureDescription">Descripción del procedimiento</Label>
          <Textarea
            id="procedureDescription"
            value={customProcedureDesc}
            onChange={(e) => setCustomProcedureDesc(e.target.value)}
            placeholder="Descripción de la cirugía o procedimiento..."
            rows={3}
          />
        </div>
      )}

      {templateType === "euthanasia_consent" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Veterinario/a</Label>
              <Input value={staffName ?? ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Matrícula</Label>
              <Input value={staffLicenseNumber ?? "—"} disabled className="bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico *</Label>
            <Textarea
              id="diagnosis"
              value={customDiagnosis}
              onChange={(e) => setCustomDiagnosis(e.target.value)}
              placeholder="Diagnóstico del paciente..."
              rows={3}
              required
            />
          </div>
        </>
      )}

      {templateType === "reproductive_agreement" && (
        <div className="space-y-2">
          <Label htmlFor="patientPedigree">Pedigree del paciente</Label>
          <Input
            id="patientPedigree"
            value={customPedigree}
            onChange={(e) => setCustomPedigree(e.target.value)}
            placeholder="Número de pedigree..."
          />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending || !selectedTemplateId || (!patientId && !selectedPatient)}>
          {isPending ? "Generando..." : "Generar documento"}
        </Button>
      </div>
    </form>
  );
}