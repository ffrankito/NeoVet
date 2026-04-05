import * as React from "react";

type Props = {
  patientName: string;
  clientName: string;
  scheduledAt: Date;
  serviceName?: string | null;
  cancellationReason?: string | null;
  clinicAddress: string;
};

export function CancellationNotificationEmail({
  patientName,
  clientName,
  scheduledAt,
  serviceName,
  cancellationReason,
  clinicAddress,
}: Props) {
  const tz = "America/Argentina/Buenos_Aires";
  const dateStr = scheduledAt.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  });
  const timeStr = scheduledAt.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h2 style={{ color: "#1a1a1a" }}>Turno cancelado — NeoVet</h2>
      <p>Hola <strong>{clientName}</strong>,</p>
      <p>
        Te informamos que el turno de <strong>{patientName}</strong> fue cancelado.
      </p>
      <div style={{ background: "#f4f4f4", borderRadius: 8, padding: 16, margin: "16px 0" }}>
        <p style={{ margin: "4px 0" }}><strong>Fecha:</strong> {dateStr}</p>
        <p style={{ margin: "4px 0" }}><strong>Hora:</strong> {timeStr}</p>
        {serviceName && (
          <p style={{ margin: "4px 0" }}><strong>Servicio:</strong> {serviceName}</p>
        )}
        {cancellationReason && (
          <p style={{ margin: "4px 0" }}><strong>Motivo:</strong> {cancellationReason}</p>
        )}
        <p style={{ margin: "4px 0" }}><strong>Dirección:</strong> {clinicAddress}</p>
      </div>
      <p>Para reprogramar, contactanos por WhatsApp.</p>
      <p style={{ color: "#666", fontSize: 12 }}>NeoVet — Clínica Veterinaria</p>
    </div>
  );
}
