/**
 * Product CSV Import Script — NeoVet Pet Shop
 *
 * Imports products from the GVet price list CSV.
 *
 * Usage:
 *   npx tsx scripts/import-products.ts scripts/data/"lista_precios 2026-04-01-00-21-51.csv"
 *   npx tsx scripts/import-products.ts scripts/data/"lista_precios 2026-04-01-00-21-51.csv" --dry-run
 *
 * CSV columns:
 *   Nombre, Cantidad, Impuesto, Precio de venta, Precio de venta + impuestos, ...
 *
 * Category auto-detection by keywords in the product name.
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { products } from "../src/db/schema/products";
import dotenv from "dotenv";

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set in .env.local");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// ID helper (mirrors src/lib/ids.ts)
// ---------------------------------------------------------------------------
function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// ---------------------------------------------------------------------------
// CSV parser (inline, no external deps)
// ---------------------------------------------------------------------------
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Category auto-detection
// ---------------------------------------------------------------------------
type ProductCategory =
  | "medicamento" | "vacuna" | "insumo_clinico" | "higiene"
  | "accesorio" | "juguete" | "alimento" | "transporte" | "otro";

const CATEGORY_RULES: { keywords: string[]; category: ProductCategory }[] = [
  { keywords: ["vacuna", "nobivac", "puppy", "quintuple", "sextuple", "octuple", "antirrabica"], category: "vacuna" },
  { keywords: ["shampoo", "cepillo", "jabon", "acondicionador", "colonia", "perfume", "toallita"], category: "higiene" },
  { keywords: ["collar", "correa", "arnes", "pretal", "pechera", "chapita", "placa"], category: "accesorio" },
  { keywords: ["pelota", "raton", "rascador", "juguete", "hueso de cuero", "mordedor"], category: "juguete" },
  { keywords: ["pouch", "lata", "bombon", "alimento", "royal", "proplan", "purina", "eukanuba", "excellent", "old prince", "sieger", "vitalcan", "balanced"], category: "alimento" },
  { keywords: ["transportadora", "cucha", "bolso", "kennel", "canil", "jaula"], category: "transporte" },
  { keywords: ["aguja", "cateter", "jeringa", "gasa", "suero", "guante", "barbijo", "venda", "algodon", "bisturi", "sonda", "equipo de venoclisis", "descartador", "tubuladura", "llave de tres vias"], category: "insumo_clinico" },
];

function detectCategory(name: string): ProductCategory {
  const lower = name.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.category;
    }
  }
  // Default: if it doesn't match any pattern, assume medicamento
  return "medicamento";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPath = args.find((a) => !a.startsWith("--"));

  if (!csvPath) {
    console.error("Usage: npx tsx scripts/import-products.ts <csv-path> [--dry-run]");
    process.exit(1);
  }

  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const rows = parseCSV(content);

  console.log(`Parsed ${rows.length} rows from CSV`);

  const productsToInsert = rows
    .filter((row) => row["Nombre"]?.length > 0)
    .map((row) => {
      const name = row["Nombre"];
      const quantity = Number(row["Cantidad"]) || 0;
      const taxRate = Number(row["Impuesto"]) || 0;
      const sellPrice = Number(row["Precio de venta"]) || 0;
      const category = detectCategory(name);

      return {
        id: createId("prd"),
        name,
        category,
        currentStock: String(quantity),
        minStock: "0",
        costPrice: null as string | null,
        sellPrice: String(sellPrice),
        taxRate: taxRate === 21 ? 21 : 0,
        isActive: true,
      };
    });

  // Category stats
  const categoryStats: Record<string, number> = {};
  for (const p of productsToInsert) {
    categoryStats[p.category] = (categoryStats[p.category] ?? 0) + 1;
  }

  console.log("\nCategory distribution:");
  for (const [cat, count] of Object.entries(categoryStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  console.log(`\nTotal products to import: ${productsToInsert.length}`);

  if (dryRun) {
    console.log("\n[DRY RUN] No changes written to DB.");
    console.log("\nSample (first 10):");
    for (const p of productsToInsert.slice(0, 10)) {
      console.log(`  ${p.name} | ${p.category} | stock: ${p.currentStock} | $${p.sellPrice} | IVA: ${p.taxRate}%`);
    }
    process.exit(0);
  }

  // Insert
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
    const batch = productsToInsert.slice(i, i + BATCH_SIZE);
    await db.insert(products).values(batch);
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${productsToInsert.length}`);
  }

  console.log(`\nDone! ${inserted} products imported.`);
  await client.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
