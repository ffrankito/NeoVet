import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

if (connectionString) {
  const parsed = new URL(connectionString);
  console.log("DB protocol:", parsed.protocol);
  console.log("DB username:", parsed.username);
  console.log("DB host:", parsed.host);
  console.log("DB password length:", parsed.password.length);
}

const globalForDb = globalThis as unknown as { db: ReturnType<typeof drizzle> };

const requireSsl = connectionString.includes("sslmode=require");
const client = postgres(connectionString, requireSsl ? { ssl: "require" } : {});

export const db = globalForDb.db ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;