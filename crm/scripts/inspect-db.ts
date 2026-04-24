/**
 * Read-only snapshot of key DB counts. Used for smoke-test verification.
 * Safe to run against any environment.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql, isNull, inArray, eq, and } from "drizzle-orm";
import * as schema from "../src/db/schema";
import {
  clients,
  patients,
  appointments,
  staff,
  charges,
  products,
  cashSessions,
} from "../src/db/schema";

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
  const [
    [{ c: clientCount }],
    [{ c: patientCount }],
    [{ c: staffCount }],
    [{ c: aptCount }],
    [{ c: openCash }],
    [{ c: unpaidCharges }],
    [{ c: unpaidClientsDistinct }],
    [{ c: activeProducts }],
    [{ c: lowStock }],
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(clients),
    db.select({ c: sql<number>`count(*)` }).from(patients),
    db.select({ c: sql<number>`count(*)` }).from(staff),
    db.select({ c: sql<number>`count(*)` }).from(appointments),
    db.select({ c: sql<number>`count(*)` }).from(cashSessions).where(isNull(cashSessions.closedAt)),
    db.select({ c: sql<number>`count(*)` }).from(charges).where(inArray(charges.status, ["pending", "partial"])),
    db.select({ c: sql<number>`count(distinct ${charges.clientId})` }).from(charges).where(inArray(charges.status, ["pending", "partial"])),
    db.select({ c: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true)),
    db.select({ c: sql<number>`count(*)` }).from(products).where(
      and(
        eq(products.isActive, true),
        sql`${products.minStock}::numeric > 0`,
        sql`${products.currentStock}::numeric <= ${products.minStock}::numeric`
      )
    ),
  ]);

  console.log("=== NeoVet DB snapshot ===");
  console.log(`clients:               ${clientCount}`);
  console.log(`patients:              ${patientCount}`);
  console.log(`appointments:          ${aptCount}`);
  console.log(`staff:                 ${staffCount}`);
  console.log(`open cash session:     ${openCash}`);
  console.log(`unpaid charges:        ${unpaidCharges}`);
  console.log(`unpaid clients (deudores alert): ${unpaidClientsDistinct}`);
  console.log(`active products:       ${activeProducts}`);
  console.log(`low-stock products (alert):      ${lowStock}`);

  await client.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await client.end();
  process.exit(1);
});
