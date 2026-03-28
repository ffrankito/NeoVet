import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
    <html lang="es" className={geist.variable}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}