import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { cashSessions, hospitalizations } from "../src/db/schema";
import { isNull } from "drizzle-orm";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const client = postgres(url, { prepare: false });
  const db = drizzle(client);

  // Open cash sessions count
  const openCash = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cashSessions)
    .where(isNull(cashSessions.closedAt));
  console.log("Open cash sessions:", openCash[0].count);

  // Active hospitalizations per patient (any with > 1?)
  const activePerPatient = await db
    .select({
      patientId: hospitalizations.patientId,
      count: sql<number>`count(*)::int`,
    })
    .from(hospitalizations)
    .where(isNull(hospitalizations.dischargedAt))
    .groupBy(hospitalizations.patientId)
    .having(sql`count(*) > 1`);

  if (activePerPatient.length === 0) {
    console.log("Active hospitalizations: no patient has more than 1 — OK");
  } else {
    console.log(`FAIL — ${activePerPatient.length} patient(s) with >1 active hospitalization:`);
    console.table(activePerPatient);
  }

  await client.end();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
