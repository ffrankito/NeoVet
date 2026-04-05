import * as React from "react";

type Props = {
  patientName: string;
  clientName: string;
  scheduledAt: Date;
  serviceName?: string | null;
  staffName?: string | null;
  clinicAddress: string;
};

export function BookingConfirmationEmail({
  patientName,
  clientName,
  scheduledAt,
  serviceName,
  staffName,
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
      <h2 style={{ color: "#1a1a1a" }}>Turno confirmado — NeoVet</h2>
      <p>Hola <strong>{clientName}</strong>,</p>
      <p>
        Tu turno para <strong>{patientName}</strong> fue registrado correctamente.
      </p>
      <div style={{ background: "#f4f4f4", borderRadius: 8, padding: 16, margin: "16px 0" }}>
        <p style={{ margin: "4px 0" }}><strong>Fecha:</strong> {dateStr}</p>
        <p style={{ margin: "4px 0" }}><strong>Hora:</strong> {timeStr}</p>
        {serviceName && (
          <p style={{ margin: "4px 0" }}><strong>Servicio:</strong> {serviceName}</p>
        )}
        {staffName && (
          <p style={{ margin: "4px 0" }}><strong>Profesional:</strong> {staffName}</p>
        )}
        <p style={{ margin: "4px 0" }}><strong>Dirección:</strong> {clinicAddress}</p>
      </div>
      <p>Si necesitás cancelar o reprogramar, contactanos por WhatsApp.</p>
      <p style={{ color: "#666", fontSize: 12 }}>NeoVet — Clínica Veterinaria</p>
    </div>
  );
}
