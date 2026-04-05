import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeoVet — Asistente Virtual",
  description: "Consultá horarios, servicios y turnos de NeoVet Centro Veterinario.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
