import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Singleton pattern: reuse the same DB connection across hot reloads in dev
const globalForDb = globalThis as unknown as { db: ReturnType<typeof drizzle> };

const client = postgres(process.env.DATABASE_URL!);

export const db = globalForDb.db ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
