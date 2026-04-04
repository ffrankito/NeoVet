import * as React from "react";

type Props = {
  patientName: string;
  clientName: string;
  vaccineName: string;
  dueDate: Date;
  clinicAddress: string;
};

export function VaccineReminderEmail({
  patientName,
  clientName,
  vaccineName,
  dueDate,
  clinicAddress,
}: Props) {
  const dateStr = dueDate.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h2 style={{ color: "#1a1a1a" }}>Vacuna próxima a vencer — NeoVet</h2>
      <p>Hola <strong>{clientName}</strong>,</p>
      <p>
        La vacuna <strong>{vaccineName}</strong> de <strong>{patientName}</strong> vence el{" "}
        <strong>{dateStr}</strong>. Te recomendamos agendar un turno a la brevedad.
      </p>
      <div style={{ background: "#f4f4f4", borderRadius: 8, padding: 16, margin: "16px 0" }}>
        <p style={{ margin: "4px 0" }}><strong>Paciente:</strong> {patientName}</p>
        <p style={{ margin: "4px 0" }}><strong>Vacuna:</strong> {vaccineName}</p>
        <p style={{ margin: "4px 0" }}><strong>Vencimiento:</strong> {dateStr}</p>
        <p style={{ margin: "4px 0" }}><strong>Dirección:</strong> {clinicAddress}</p>
      </div>
      <p>Para agendar un turno, contactanos por WhatsApp.</p>
      <p style={{ color: "#666", fontSize: 12 }}>NeoVet — Clínica Veterinaria</p>
    </div>
  );
}