/**
 * GVet HTML Parser — Extracts data from saved GVet HTML pages
 *
 * Usage:
 *   npx tsx scripts/parse-gvet-html.ts
 *   npx tsx scripts/parse-gvet-html.ts --sections deudores
 *   npx tsx scripts/parse-gvet-html.ts --sections internaciones,procedimientos,deudores
 *
 * Input: HTML files in scripts/gvet-data/ (saved from Firefox with Ctrl+S → "Webpage, HTML Only")
 * Output: JSON files in scripts/gvet-data/
 *
 * File naming: files are matched by name containing "Deudores", "Internaciones", or "Procedimiento"
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "scripts/gvet-data");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Deudor {
  clienteNombre: string;
  clienteGvetId: string;
  total: number;
  ventas: number;
  deudasVisitas: number;
  deudasEstetica: number;
  deudaGuarderia: number;
  cuentaActual: number;
}

interface Internacion {
  gvetId: string;
  entrada: string;
  paciente: string;
  pacienteGvetId: string;
  clienteNombre: string;
  clienteGvetId: string;
  altaParametros: string;
  usuario: string;
}

interface Procedimiento {
  gvetId: string;
  fecha: string;
  paciente: string;
  pacienteGvetId: string;
  cirujano: string;
  anestesiologo: string;
  procedimiento: string;
  recordatorios: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanText(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

function extractGvetId(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match ? match[1] : "";
}

function parseAmount(s: string): number {
  // "$129,000" → 129000, "$0" → 0, "$1,234,567" → 1234567
  const cleaned = s.replace(/[$\s]/g, "").replace(/,/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

function getFilesMatching(dir: string, keyword: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().includes(keyword.toLowerCase()) && f.endsWith(".htm"))
    .sort()
    .map((f) => path.join(dir, f));
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseDeudores(files: string[]): Deudor[] {
  const all: Deudor[] = [];

  for (const file of files) {
    const html = fs.readFileSync(file, "utf-8");

    // Find the main data table (first table with class table-striped)
    const tableMatch = html.match(/<table[^>]*class="table table-striped[^"]*"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
    if (!tableMatch) {
      console.warn(`  ⚠️  No se encontró tabla en ${path.basename(file)}`);
      continue;
    }

    const tbody = tableMatch[1];
    const rows = tbody.split(/<tr[^>]*>/).slice(1); // Skip the split before first <tr>

    for (const row of rows) {
      const cells = row.split(/<td[^>]*>/).slice(1).map((c) => c.split("</td>")[0]);
      if (cells.length < 7) continue;

      // Extract client name and GVet ID from first cell's link
      const nameMatch = cells[0].match(/<a[^>]*href="[^"]*\/client\/(\d+)\/profile"[^>]*>\s*([\s\S]*?)\s*<\/a>/);
      const clienteNombre = nameMatch ? cleanText(nameMatch[2]) : cleanText(cells[0]);
      const clienteGvetId = nameMatch ? nameMatch[1] : "";

      const total = parseAmount(cleanText(cells[1]));
      const ventas = parseAmount(cleanText(cells[2]));
      const deudasVisitas = parseAmount(cleanText(cells[3]));
      const deudasEstetica = parseAmount(cleanText(cells[4]));
      const deudaGuarderia = parseAmount(cleanText(cells[5]));
      const cuentaActual = parseAmount(cleanText(cells[6]));

      // Skip zero-balance debtors
      if (total === 0 && cuentaActual === 0) continue;

      all.push({
        clienteNombre,
        clienteGvetId,
        total,
        ventas,
        deudasVisitas,
        deudasEstetica,
        deudaGuarderia,
        cuentaActual,
      });
    }

    console.log(`   ${path.basename(file)}: ${rows.length} filas leídas`);
  }

  return all;
}

function parseInternaciones(files: string[]): Internacion[] {
  const all: Internacion[] = [];

  for (const file of files) {
    const html = fs.readFileSync(file, "utf-8");

    const tableMatch = html.match(/<table[^>]*class="table table-striped table-sm[^"]*"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
    if (!tableMatch) {
      console.warn(`  ⚠️  No se encontró tabla en ${path.basename(file)}`);
      continue;
    }

    const tbody = tableMatch[1];
    const rows = tbody.split(/<tr[^>]*>/).slice(1);

    for (const row of rows) {
      const cells = row.split(/<td[^>]*>/).slice(1).map((c) => c.split("</td>")[0]);
      if (cells.length < 5) continue;

      const entrada = cleanText(cells[0]);

      // Patient: <a href="/es/patient/{id}/show">Name</a>
      const pacienteMatch = cells[1].match(/<a[^>]*href="[^"]*\/patient\/(\d+)\/show"[^>]*>([\s\S]*?)<\/a>/);
      const paciente = pacienteMatch ? cleanText(pacienteMatch[2]) : cleanText(cells[1]);
      const pacienteGvetId = pacienteMatch ? pacienteMatch[1] : "";

      // Client: <a href="/es/client/{id}/profile">Name</a>
      const clienteMatch = cells[2].match(/<a[^>]*href="[^"]*\/client\/(\d+)\/profile"[^>]*>([\s\S]*?)<\/a>/);
      const clienteNombre = clienteMatch ? cleanText(clienteMatch[2]) : cleanText(cells[2]);
      const clienteGvetId = clienteMatch ? clienteMatch[1] : "";

      const altaParametros = cleanText(cells[3]);
      const usuario = cleanText(cells[4]);

      // GVet hospitalization ID from show link
      const showMatch = cells[5]?.match(/\/hospitalization\/(\d+)\/show/);
      const gvetId = showMatch ? showMatch[1] : "";

      all.push({
        gvetId,
        entrada,
        paciente,
        pacienteGvetId,
        clienteNombre,
        clienteGvetId,
        altaParametros,
        usuario,
      });
    }

    console.log(`   ${path.basename(file)}: ${rows.length} filas leídas`);
  }

  return all;
}

function parseProcedimientos(files: string[]): Procedimiento[] {
  const all: Procedimiento[] = [];

  for (const file of files) {
    const html = fs.readFileSync(file, "utf-8");

    const tableMatch = html.match(/<table[^>]*class="table table-striped[^"]*"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
    if (!tableMatch) {
      console.warn(`  ⚠️  No se encontró tabla en ${path.basename(file)}`);
      continue;
    }

    const tbody = tableMatch[1];
    const rows = tbody.split(/<tr[^>]*>/).slice(1);

    for (const row of rows) {
      const cells = row.split(/<td[^>]*>/).slice(1).map((c) => c.split("</td>")[0]);
      if (cells.length < 6) continue;

      const fecha = cleanText(cells[0]);

      const pacienteMatch = cells[1].match(/<a[^>]*href="[^"]*\/patient\/(\d+)\/show"[^>]*>([\s\S]*?)<\/a>/);
      const paciente = pacienteMatch ? cleanText(pacienteMatch[2]) : cleanText(cells[1]);
      const pacienteGvetId = pacienteMatch ? pacienteMatch[1] : "";

      const cirujano = cleanText(cells[2]);
      const anestesiologo = cleanText(cells[3]);
      const procedimiento = cleanText(cells[4]);
      const recordatorios = cleanText(cells[5]);

      // GVet procedure ID from edit/show link
      const idMatch = cells[6]?.match(/\/procedure\/(\d+)\/(edit|show)/);
      const gvetId = idMatch ? idMatch[1] : "";

      all.push({
        gvetId,
        fecha,
        paciente,
        pacienteGvetId,
        cirujano,
        anestesiologo,
        procedimiento,
        recordatorios,
      });
    }

    console.log(`   ${path.basename(file)}: ${rows.length} filas leídas`);
  }

  return all;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const sectionsIdx = args.indexOf("--sections");
  const sections = sectionsIdx !== -1 && args[sectionsIdx + 1]
    ? args[sectionsIdx + 1].split(",").map((s) => s.trim())
    : ["deudores", "internaciones", "procedimientos"];

  console.log("📄 GVet HTML Parser");
  console.log(`   Secciones: ${sections.join(", ")}\n`);

  if (sections.includes("deudores")) {
    const files = getFilesMatching(DATA_DIR, "deudor");
    console.log(`💳 Deudores — ${files.length} archivos encontrados`);
    if (files.length > 0) {
      const data = parseDeudores(files);
      const filtered = data.filter((d) => d.total !== 0 || d.cuentaActual !== 0);
      const outPath = path.join(DATA_DIR, "deudores.json");
      fs.writeFileSync(outPath, JSON.stringify(filtered, null, 2), "utf-8");
      console.log(`   ✅ ${filtered.length} deudores con saldo (de ${data.length} total) → ${outPath}\n`);
    }
  }

  if (sections.includes("internaciones")) {
    const files = getFilesMatching(DATA_DIR, "internacion");
    console.log(`🏥 Internaciones — ${files.length} archivos encontrados`);
    if (files.length > 0) {
      const data = parseInternaciones(files);
      const outPath = path.join(DATA_DIR, "internaciones.json");
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`   ✅ ${data.length} internaciones → ${outPath}\n`);
    }
  }

  if (sections.includes("procedimientos")) {
    const files = getFilesMatching(DATA_DIR, "procedimiento");
    console.log(`🔬 Procedimientos — ${files.length} archivos encontrados`);
    if (files.length > 0) {
      const data = parseProcedimientos(files);
      const outPath = path.join(DATA_DIR, "procedimientos.json");
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`   ✅ ${data.length} procedimientos → ${outPath}\n`);
    }
  }

  console.log("✅ Parsing completo.");
}

main();
