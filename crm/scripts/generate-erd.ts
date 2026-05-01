/**
 * Generate per-domain ERDs from the Drizzle schema and write them to the
 * Obsidian vault.
 *
 * Modes:
 *   tsx scripts/generate-erd.ts           Regenerate erd.md
 *   tsx scripts/generate-erd.ts --check   Exit 1 if the current schema hash
 *                                         doesn't match the one stamped in
 *                                         erd.md (drift detector).
 *
 * Output: $OBSIDIAN_VAULT_PATH/wiki/architecture/erd.md
 *         (default: ~/ObsidianVaults/neovet)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import { is, getTableName } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "../src/db/schema";

// ────────────────────────────────────────────────────────────────────────────
// Domain partitioning. Tables not listed here will trigger a warning and be
// dumped into a "Misc" section so we never silently lose one.
// ────────────────────────────────────────────────────────────────────────────

const DOMAINS: Record<string, string[]> = {
  "People & settings": ["clients", "patients", "staff", "settings"],
  Clinical: [
    "appointments",
    "consultations",
    "treatment_items",
    "complementary_methods",
    "vaccinations",
    "deworming_records",
    "documents",
    "grooming_sessions",
    "schedule_blocks",
    "follow_ups",
    "services",
    "hospitalizations",
    "hospitalization_observations",
    "procedures",
    "procedure_staff",
    "procedure_supplies",
    "consent_templates",
    "consent_documents",
    "retorno_queue",
    "email_logs",
  ],
  "Retail & money": [
    "products",
    "providers",
    "stock_entries",
    "sales",
    "sale_items",
    "cash_sessions",
    "cash_movements",
    "charges",
  ],
  Bot: [
    "bot_business_context",
    "bot_contacts",
    "bot_conversations",
    "bot_messages",
    "bot_escalations",
  ],
};

// ────────────────────────────────────────────────────────────────────────────

const SCRIPT_DIR = __dirname;
const SCHEMA_DIR = path.join(SCRIPT_DIR, "..", "src", "db", "schema");
const VAULT_PATH =
  process.env.OBSIDIAN_VAULT_PATH ??
  path.join(os.homedir(), "ObsidianVaults", "neovet");
const OUT_DIR = path.join(VAULT_PATH, "wiki", "architecture");
const OUT_FILE = path.join(OUT_DIR, "erd.md");

// ────────────────────────────────────────────────────────────────────────────
// Schema hash — sha256 of every schema file's bytes (sorted, excluding index.ts).
// ────────────────────────────────────────────────────────────────────────────

function computeSchemaHash(): string {
  const files = fs
    .readdirSync(SCHEMA_DIR)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    .sort();
  const h = crypto.createHash("sha256");
  for (const f of files) {
    const content = fs.readFileSync(path.join(SCHEMA_DIR, f), "utf8");
    h.update(`${f}\0${content}\0`);
  }
  return h.digest("hex");
}

// ────────────────────────────────────────────────────────────────────────────
// Schema introspection
// ────────────────────────────────────────────────────────────────────────────

interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  isPK: boolean;
  isFK: boolean;
}

interface FKInfo {
  fromColumn: string;
  toTable: string;
  toColumn: string;
  notNull: boolean;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  fks: FKInfo[];
}

function collectTables(): Map<string, TableInfo> {
  const tables = new Map<string, TableInfo>();

  for (const value of Object.values(schema)) {
    if (!is(value, PgTable)) continue;
    const cfg = getTableConfig(value as PgTable);
    const tableName = cfg.name;

    // Build FKs first so we can mark FK columns.
    const fks: FKInfo[] = [];
    const fkColumnNames = new Set<string>();

    for (const fk of cfg.foreignKeys) {
      const ref = fk.reference();
      const localCols = ref.columns;
      const foreignCols = ref.foreignColumns;
      for (let i = 0; i < localCols.length; i++) {
        const local = localCols[i];
        const foreign = foreignCols[i];
        const targetTable = getTableName(foreign.table);
        fks.push({
          fromColumn: local.name,
          toTable: targetTable,
          toColumn: foreign.name,
          notNull: local.notNull,
        });
        fkColumnNames.add(local.name);
      }
    }

    // Some FKs in our schema are inline column-level (.references(...)) and
    // surface in getTableConfig().foreignKeys. Belt-and-suspenders: also walk
    // each column for an inline reference, in case a Drizzle version exposes
    // it differently.
    for (const col of cfg.columns) {
      const inline = (col as unknown as {
        references?: () => { table: PgTable; column: { name: string } } | null;
      }).references;
      if (typeof inline === "function") {
        const r = inline();
        if (r && !fkColumnNames.has(col.name)) {
          fks.push({
            fromColumn: col.name,
            toTable: getTableName(r.table),
            toColumn: r.column.name,
            notNull: col.notNull,
          });
          fkColumnNames.add(col.name);
        }
      }
    }

    const pkColumnNames = new Set(
      cfg.columns.filter((c) => c.primary).map((c) => c.name),
    );

    const columns: ColumnInfo[] = cfg.columns.map((col) => ({
      name: col.name,
      type: col.getSQLType(),
      notNull: col.notNull,
      isPK: pkColumnNames.has(col.name),
      isFK: fkColumnNames.has(col.name),
    }));

    tables.set(tableName, { name: tableName, columns, fks });
  }

  return tables;
}

// ────────────────────────────────────────────────────────────────────────────
// Mermaid emission
// ────────────────────────────────────────────────────────────────────────────

/**
 * Mermaid erDiagram needs identifier-safe names. Table names are already
 * snake_case and SQL types may contain spaces / parens — strip those.
 */
function safeType(sqlType: string): string {
  // "timestamp with time zone" → "timestamptz"; "numeric(5, 2)" → "numeric"
  return sqlType
    .replace(/\s+with time zone/i, "tz")
    .replace(/\s+without time zone/i, "")
    .replace(/\(.*\)/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

function emitTable(t: TableInfo): string {
  const lines = [`    ${t.name} {`];
  for (const col of t.columns) {
    const markers: string[] = [];
    if (col.isPK) markers.push("PK");
    if (col.isFK) markers.push("FK");
    const tail = markers.length ? ` ${markers.join(",")}` : "";
    lines.push(`        ${safeType(col.type)} ${col.name}${tail}`);
  }
  lines.push("    }");
  return lines.join("\n");
}

function emitStubTable(name: string): string {
  // External-domain table: just show its existence so the FK arrow has a target.
  return `    ${name} {\n        text id PK\n    }`;
}

function emitRelationship(from: TableInfo, fk: FKInfo): string {
  // Cardinality: parent has many children. Mandatory side depends on FK NOT NULL.
  const cardinality = fk.notNull ? "||--o{" : "|o--o{";
  return `    ${fk.toTable} ${cardinality} ${from.name} : "${fk.fromColumn}"`;
}

function emitDomainDiagram(
  domain: string,
  tableNames: string[],
  allTables: Map<string, TableInfo>,
): string {
  const inDomain = new Set(tableNames);
  const ownTables = tableNames
    .map((n) => allTables.get(n))
    .filter((t): t is TableInfo => Boolean(t));

  const externalRefs = new Set<string>();
  const relationships: string[] = [];

  for (const t of ownTables) {
    for (const fk of t.fks) {
      relationships.push(emitRelationship(t, fk));
      if (!inDomain.has(fk.toTable)) {
        externalRefs.add(fk.toTable);
      }
    }
  }

  const out: string[] = [];
  out.push(`### ${domain}`);
  out.push("");
  out.push("```mermaid");
  out.push("erDiagram");
  for (const t of ownTables) out.push(emitTable(t));
  for (const ext of externalRefs) {
    if (allTables.has(ext)) {
      out.push(emitStubTable(ext));
    }
  }
  for (const rel of relationships) out.push(rel);
  out.push("```");
  out.push("");

  if (externalRefs.size > 0) {
    out.push(
      `*External references:* ${Array.from(externalRefs)
        .sort()
        .map((t) => `\`${t}\``)
        .join(", ")} (full definition in another section).`,
    );
    out.push("");
  }

  return out.join("\n");
}

// ────────────────────────────────────────────────────────────────────────────
// Entry point
// ────────────────────────────────────────────────────────────────────────────

function readExistingHash(): string | null {
  if (!fs.existsSync(OUT_FILE)) return null;
  const content = fs.readFileSync(OUT_FILE, "utf8");
  const m = content.match(/<!-- schema-hash:\s*([0-9a-f]{64})\s*-->/);
  return m ? m[1] : null;
}

function runCheck(): never {
  // The ERD lives in a personal Obsidian vault. On machines without that vault
  // (Franco's clone, CI, Vercel build) the check has nothing to compare
  // against — skip cleanly instead of failing.
  if (!fs.existsSync(VAULT_PATH)) {
    console.log(
      `[db:erd:check] Skipping — vault not found at ${VAULT_PATH}. ` +
        `Set OBSIDIAN_VAULT_PATH or ignore on machines without the vault.`,
    );
    process.exit(0);
  }

  const current = computeSchemaHash();
  const stamped = readExistingHash();
  if (stamped === null) {
    console.error(
      `\n[db:erd:check] erd.md not found or has no schema-hash stamp.`,
    );
    console.error(`  Expected at: ${OUT_FILE}`);
    console.error(`  Run \`npm run db:erd\` to generate it.\n`);
    process.exit(1);
  }
  if (stamped !== current) {
    console.error(`\n[db:erd:check] Schema has drifted from erd.md.`);
    console.error(`  stamped:  ${stamped}`);
    console.error(`  current:  ${current}`);
    console.error(`  Run \`npm run db:erd\` to regenerate.\n`);
    process.exit(1);
  }
  console.log(`[db:erd:check] OK — schema-hash matches (${current.slice(0, 12)}…).`);
  process.exit(0);
}

function runGenerate(): void {
  const tables = collectTables();
  const all = new Set(tables.keys());
  const partitioned = new Set(Object.values(DOMAINS).flat());

  const orphans = [...all].filter((t) => !partitioned.has(t));
  if (orphans.length > 0) {
    console.warn(
      `[db:erd] Tables not assigned to any domain (will go in "Misc"): ${orphans.join(", ")}`,
    );
  }

  const domains: Array<[string, string[]]> = Object.entries(DOMAINS);
  if (orphans.length > 0) domains.push(["Misc", orphans]);

  const hash = computeSchemaHash();
  const generatedAt = new Date().toISOString();

  const sections: string[] = [];
  sections.push(`---`);
  sections.push(`title: NeoVet Schema ERD`);
  sections.push(
    `description: Auto-generated entity-relationship diagrams partitioned by domain.`,
  );
  sections.push(`generated: ${generatedAt}`);
  sections.push(`generator: crm/scripts/generate-erd.ts`);
  sections.push(`---`);
  sections.push(`<!-- schema-hash: ${hash} -->`);
  sections.push(`<!-- DO NOT EDIT — regenerate with \`npm run db:erd\` from crm/ -->`);
  sections.push(``);
  sections.push(`# NeoVet Schema ERD`);
  sections.push(``);
  sections.push(
    `Auto-generated from \`crm/src/db/schema/\`. **Do not edit by hand** — changes will be overwritten on next regeneration.`,
  );
  sections.push(``);
  sections.push(`> [!info] Maintenance`);
  sections.push(`> - **Regenerate:** \`cd crm && npm run db:erd\``);
  sections.push(`> - **Check drift:** \`cd crm && npm run db:erd:check\` (exits 1 if schema and ERD are out of sync)`);
  sections.push(`> - **Last generated:** ${generatedAt}`);
  sections.push(`> - **Tables:** ${tables.size}`);
  sections.push(``);
  sections.push(
    `Tables are partitioned by domain. Foreign keys that cross a domain are drawn against a stub of the target table — see the relevant domain section for the full definition.`,
  );
  sections.push(``);
  sections.push(`## Diagrams`);
  sections.push(``);

  for (const [domain, tableNames] of domains) {
    const present = tableNames.filter((n) => tables.has(n));
    if (present.length === 0) continue;
    sections.push(emitDomainDiagram(domain, present, tables));
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, sections.join("\n"), "utf8");

  console.log(`[db:erd] Wrote ${tables.size} tables to ${OUT_FILE}`);
  console.log(`[db:erd] schema-hash: ${hash.slice(0, 12)}…`);
}

// ────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.includes("--check")) {
  runCheck();
} else {
  runGenerate();
}
