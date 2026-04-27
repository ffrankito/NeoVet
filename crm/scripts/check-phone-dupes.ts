import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { clients } from "../src/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const client = postgres(url, { prepare: false });
  const db = drizzle(client);

  const dupes = await db
    .select({
      phone: clients.phone,
      count: sql<number>`count(*)::int`,
    })
    .from(clients)
    .groupBy(clients.phone)
    .having(sql`count(*) > 1`);

  if (dupes.length === 0) {
    console.log("OK — no duplicate phones");
  } else {
    console.log(`FAIL — ${dupes.length} duplicate phone(s):`);
    console.table(dupes);
  }

  await client.end();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
