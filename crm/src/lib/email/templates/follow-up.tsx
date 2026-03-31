import * as React from "react";

type Props = {
  patientName: string;
  clientName: string;
  reason: string;
  clinicAddress: string;
};

export function FollowUpEmail({
  patientName,
  clientName,
  reason,
  clinicAddress,
}: Props) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h2 style={{ color: "#1a1a1a" }}>Control programado — NeoVet</h2>
      <p>Hola <strong>{clientName}</strong>,</p>
      <p>
        Tu veterinario programó un control para <strong>{patientName}</strong>:
      </p>
      <div style={{ background: "#f4f4f4", borderRadius: 8, padding: 16, margin: "16px 0" }}>
        <p style={{ margin: "4px 0" }}><strong>Motivo:</strong> {reason}</p>
        <p style={{ margin: "4px 0" }}><strong>Dirección:</strong> {clinicAddress}</p>
      </div>
      <p>Para agendar el turno de control, contactanos por WhatsApp.</p>
      <p style={{ color: "#666", fontSize: 12 }}>NeoVet — Clínica Veterinaria</p>
    </div>
  );
}
