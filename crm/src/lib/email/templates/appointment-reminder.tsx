import * as React from "react";

type Props = {
  patientName: string;
  clientName: string;
  scheduledAt: Date;
  serviceName?: string | null;
  clinicAddress: string;
  hoursBeforeLabel: string; // "48 horas" | "24 horas"
};

export function AppointmentReminderEmail({
  patientName,
  clientName,
  scheduledAt,
  serviceName,
  clinicAddress,
  hoursBeforeLabel,
}: Props) {
  const dateStr = scheduledAt.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = scheduledAt.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h2 style={{ color: "#1a1a1a" }}>Recordatorio de turno — NeoVet</h2>
      <p>Hola <strong>{clientName}</strong>,</p>
      <p>
        Te recordamos que en <strong>{hoursBeforeLabel}</strong> tenés turno para{" "}
        <strong>{patientName}</strong>.
      </p>
      <div style={{ background: "#f4f4f4", borderRadius: 8, padding: 16, margin: "16px 0" }}>
        <p style={{ margin: "4px 0" }}><strong>Fecha:</strong> {dateStr}</p>
        <p style={{ margin: "4px 0" }}><strong>Hora:</strong> {timeStr}</p>
        {serviceName && (
          <p style={{ margin: "4px 0" }}><strong>Servicio:</strong> {serviceName}</p>
        )}
        <p style={{ margin: "4px 0" }}><strong>Dirección:</strong> {clinicAddress}</p>
      </div>
      <p>Si necesitás cancelar o reprogramar, contactanos por WhatsApp.</p>
      <p style={{ color: "#666", fontSize: 12 }}>NeoVet — Clínica Veterinaria</p>
    </div>
  );
}