/**
 * GVet Web Scraper — One-time data extraction
 *
 * Extracts: internaciones, procedimientos, deudores from GVet web app.
 * Opens a visible browser for manual login, then scrapes automatically.
 *
 * Usage:
 *   npx tsx scripts/scrape-gvet.ts
 *   npx tsx scripts/scrape-gvet.ts --pages internaciones,procedimientos,deudores
 *   npx tsx scripts/scrape-gvet.ts --pages deudores
 *
 * Output: JSON files in scripts/gvet-data/
 */

import { chromium, type Page } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "https://server8.gvetsoft.com";
const OUTPUT_DIR = path.resolve(process.cwd(), "scripts/gvet-data");
const SESSION_FILE = path.resolve(process.cwd(), "scripts/.gvet-session.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface Deudor {
  clienteNombre: string;
  clienteGvetId: string;
  total: string;
  ventas: string;
  deudasVisitas: string;
  deudasEstetica: string;
  deudaGuarderia: string;
  cuentaActual: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(): { pages: string[] } {
  const args = process.argv.slice(2);
  const pagesIdx = args.indexOf("--pages");
  if (pagesIdx !== -1 && args[pagesIdx + 1]) {
    return { pages: args[pagesIdx + 1].split(",").map((p) => p.trim()) };
  }
  return { pages: ["internaciones", "procedimientos", "deudores"] };
}

function extractGvetId(href: string | null): string {
  if (!href) return "";
  const match = href.match(/\/(\d+)\/(show|edit|profile|debtors-show)/);
  return match ? match[1] : "";
}

function cleanText(text: string | null): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

async function login(page: Page): Promise<void> {
  // Check for saved session
  if (fs.existsSync(SESSION_FILE)) {
    console.log("📂 Cargando sesión guardada...");
    const cookies = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
    await page.context().addCookies(cookies);
    await page.goto(`${BASE_URL}/es/main-dashboard`, { waitUntil: "networkidle" });

    // Check if we're logged in (look for sidebar menu)
    const isLoggedIn = await page.locator(".aside-menu").count();
    if (isLoggedIn > 0) {
      console.log("✅ Sesión válida, continuando...");
      return;
    }
    console.log("⚠️  Sesión expirada, login manual necesario...");
  }

  // Navigate to login
  await page.goto(`${BASE_URL}/es/login`, { waitUntil: "networkidle" });

  console.log("\n🔐 POR FAVOR, INICIA SESIÓN EN EL NAVEGADOR QUE SE ABRIÓ.");
  console.log("   Cuando estés en el dashboard, presioná ENTER aquí.\n");

  // Wait for user to log in — check every 2s if we're past login
  await new Promise<void>((resolve) => {
    const interval = setInterval(async () => {
      const url = page.url();
      if (url.includes("main-dashboard") || url.includes("hospitalization") || url.includes("procedure")) {
        clearInterval(interval);
        resolve();
      }
    }, 2000);

    // Also listen for stdin
    process.stdin.once("data", () => {
      clearInterval(interval);
      resolve();
    });
  });

  // Save session
  const cookies = await page.context().cookies();
  fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies, null, 2));
  console.log("💾 Sesión guardada para futuras ejecuciones.\n");
}

// ---------------------------------------------------------------------------
// Scrapers
// ---------------------------------------------------------------------------

async function scrapeInternaciones(page: Page): Promise<Internacion[]> {
  console.log("\n🏥 Scrapeando internaciones...");
  const all: Internacion[] = [];
  let pageNum = 1;

  while (true) {
    const url = `${BASE_URL}/es/hospitalization/?page=${pageNum}`;
    await page.goto(url, { waitUntil: "networkidle" });

    const rows = await page.locator("table.table-striped.table-sm tbody tr").all();
    if (rows.length === 0) break;

    for (const row of rows) {
      const cells = await row.locator("td").all();
      if (cells.length < 5) continue;

      const entrada = cleanText(await cells[0].textContent());
      const pacienteLink = cells[1].locator("a").first();
      const paciente = cleanText(await pacienteLink.textContent());
      const pacienteHref = await pacienteLink.getAttribute("href");
      const pacienteGvetId = extractGvetId(pacienteHref);

      const clienteLink = cells[2].locator("a").first();
      const clienteNombre = cleanText(await clienteLink.textContent().catch(() => ""));
      const clienteHref = await clienteLink.getAttribute("href").catch(() => null);
      const clienteGvetId = extractGvetId(clienteHref);

      const altaParametros = cleanText(await cells[3].textContent());
      const usuario = cleanText(await cells[4].textContent());

      // Extract hospitalization GVet ID from the "show" link
      const showLink = cells[5]?.locator("a[href*='/hospitalization/']").first();
      const showHref = await showLink?.getAttribute("href").catch(() => null);
      const gvetId = extractGvetId(showHref ?? "");

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

    console.log(`   Página ${pageNum}: ${rows.length} filas (total: ${all.length})`);

    // Check if there's a next page
    const nextBtn = page.locator('a[rel="next"]');
    if ((await nextBtn.count()) === 0) break;
    pageNum++;
  }

  console.log(`✅ ${all.length} internaciones extraídas.`);
  return all;
}

async function scrapeProcedimientos(page: Page): Promise<Procedimiento[]> {
  console.log("\n🔬 Scrapeando procedimientos...");
  const all: Procedimiento[] = [];
  let pageNum = 1;

  while (true) {
    const url = `${BASE_URL}/es/procedure/?page=${pageNum}`;
    await page.goto(url, { waitUntil: "networkidle" });

    const rows = await page.locator("table.table-striped tbody tr").all();
    if (rows.length === 0) break;

    for (const row of rows) {
      const cells = await row.locator("td").all();
      if (cells.length < 6) continue;

      const fecha = cleanText(await cells[0].textContent());

      const pacienteLink = cells[1].locator("a").first();
      const paciente = cleanText(await pacienteLink.textContent());
      const pacienteHref = await pacienteLink.getAttribute("href");
      const pacienteGvetId = extractGvetId(pacienteHref);

      const cirujano = cleanText(await cells[2].textContent());
      const anestesiologo = cleanText(await cells[3].textContent());
      const procedimiento = cleanText(await cells[4].textContent());
      const recordatorios = cleanText(await cells[5].textContent());

      // Extract procedure GVet ID from edit/show links
      const editLink = cells[6]?.locator("a[href*='/procedure/']").first();
      const editHref = await editLink?.getAttribute("href").catch(() => null);
      const gvetId = extractGvetId(editHref ?? "");

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

    console.log(`   Página ${pageNum}: ${rows.length} filas (total: ${all.length})`);

    const nextBtn = page.locator('a[rel="next"]');
    if ((await nextBtn.count()) === 0) break;
    pageNum++;
  }

  console.log(`✅ ${all.length} procedimientos extraídos.`);
  return all;
}

async function scrapeDeudores(page: Page): Promise<Deudor[]> {
  console.log("\n💳 Scrapeando deudores...");
  const all: Deudor[] = [];
  let pageNum = 1;

  while (true) {
    const url = `${BASE_URL}/es/client/debtors?page=${pageNum}`;
    await page.goto(url, { waitUntil: "networkidle" });

    const rows = await page.locator("table.table-striped tbody tr").all();
    if (rows.length === 0) break;

    for (const row of rows) {
      const cells = await row.locator("td").all();
      if (cells.length < 7) continue;

      const clienteLink = cells[0].locator("a").first();
      const clienteNombre = cleanText(await clienteLink.textContent());
      const clienteHref = await clienteLink.getAttribute("href");
      const clienteGvetId = extractGvetId(clienteHref);

      const total = cleanText(await cells[1].textContent());
      const ventas = cleanText(await cells[2].textContent());
      const deudasVisitas = cleanText(await cells[3].textContent());
      const deudasEstetica = cleanText(await cells[4].textContent());
      const deudaGuarderia = cleanText(await cells[5].textContent());
      const cuentaActual = cleanText(await cells[6].textContent());

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

    console.log(`   Página ${pageNum}: ${rows.length} filas (total: ${all.length})`);

    const nextBtn = page.locator('a[rel="next"]');
    if ((await nextBtn.count()) === 0) break;
    pageNum++;
  }

  console.log(`✅ ${all.length} deudores extraídos.`);
  return all;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { pages } = parseArgs();
  console.log("🚀 GVet Scraper — Extracción de datos");
  console.log(`   Páginas a scrapear: ${pages.join(", ")}\n`);

  ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch({
    headless: false, // Visible browser for manual login
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    await login(page);

    if (pages.includes("internaciones")) {
      const data = await scrapeInternaciones(page);
      const outPath = path.join(OUTPUT_DIR, "internaciones.json");
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`   → ${outPath}`);
    }

    if (pages.includes("procedimientos")) {
      const data = await scrapeProcedimientos(page);
      const outPath = path.join(OUTPUT_DIR, "procedimientos.json");
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`   → ${outPath}`);
    }

    if (pages.includes("deudores")) {
      const data = await scrapeDeudores(page);
      const outPath = path.join(OUTPUT_DIR, "deudores.json");
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`   → ${outPath}`);
    }

    console.log("\n✅ Extracción completa. Archivos en scripts/gvet-data/");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
