/**
 * One-shot diagnostic: how many email_logs rows exist, and what kinds?
 *
 * Used to verify whether the cron-driven email pipeline has ever fired
 * in this DB. Empty + zero recent activity = crons never ran.
 *
 * Run from crm/:
 *   npx tsx scripts/check-email-logs.ts
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { desc } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { emailLogs } from "../src/db/schema";

const url = new URL(process.env.DATABASE_URL!);
const client = postgres({
  host: url.hostname,
  port: Number(url.port),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: "require",
  max: 1,
});
const db = drizzle(client, { schema });

async function main() {
  const total = await db.select().from(emailLogs);
  console.log(`email_logs total rows: ${total.length}`);

  if (total.length === 0) {
    console.log("\nDB has zero email_logs entries. Either:");
    console.log("  1) No cron has ever fired against this DB, OR");
    console.log("  2) Crons fired but every send failed before logging");
    return;
  }

  const byType: Record<string, number> = {};
  for (const r of total) {
    const t = r.type ?? "(unknown)";
    byType[t] = (byType[t] ?? 0) + 1;
  }
  console.log("\nBreakdown by type:");
  for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(28)} ${n}`);
  }

  const recent = await db
    .select()
    .from(emailLogs)
    .orderBy(desc(emailLogs.sentAt))
    .limit(5);

  console.log("\nMost recent 5 (by sentAt):");
  for (const r of recent) {
    console.log(
      `  ${r.sentAt?.toISOString() ?? "(no timestamp)"}  ${r.type ?? "(no type)"}  ref=${r.referenceId ?? "—"}  to=${r.sentTo ?? "—"}`,
    );
  }
}

main()
  .then(() => client.end())
  .catch(async (err) => {
    console.error(err);
    await client.end();
    process.exit(1);
  });
