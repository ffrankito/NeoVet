import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const client = postgres(url, { prepare: false });
  const db = drizzle(client);

  const idx = await db.execute(sql`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (
        'clients_phone_unique_idx',
        'appointments_scheduled_at_idx',
        'cash_sessions_one_open_idx',
        'hospitalizations_one_active_per_patient_idx'
      )
    ORDER BY indexname
  `);

  if (idx.length === 4) {
    console.log("OK — all 4 indexes present:");
  } else {
    console.log(`FAIL — expected 4, found ${idx.length}:`);
  }
  for (const row of idx as Array<{ indexname: string; indexdef: string }>) {
    console.log(`  ${row.indexname}`);
    console.log(`    ${row.indexdef}`);
  }

  await client.end();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
