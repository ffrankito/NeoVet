/**
 * NeoVet — Staff User Seed Script
 *
 * Creates a Supabase auth user and a matching staff row in one shot.
 * Uses the service role key so it can bypass email confirmation.
 *
 * Usage:
 *   npx tsx scripts/seed-user.ts --email tomas@neovet.com --password secret123 --name "Tomás" --role admin
 *   npx tsx scripts/seed-user.ts --email vet@neovet.com --password secret456 --name "Laura" --role vet
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// ID helper (mirrors src/lib/ids.ts — kept inline to avoid tsconfig path issues)
// ---------------------------------------------------------------------------
function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Load .env.local (no external dotenv dep — same pattern as import-gvet.ts)
// ---------------------------------------------------------------------------
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (!fs.existsSync(envPath)) continue;

    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
    break;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  loadEnv();

  const args = parseArgs(process.argv.slice(2));

  const email = args["email"];
  const password = args["password"];
  const name = args["name"];
  const role = (args["role"] ?? "admin") as "admin" | "vet" | "groomer";
  const existingUserId = args["user-id"]; // skip auth creation, link existing Supabase user

  // Validate required flags
  if (existingUserId) {
    if (!name) {
      console.error(
        "Error: se requiere --name cuando se usa --user-id.\n" +
          "Uso: npx tsx scripts/seed-user.ts --user-id <uuid> --name \"Nombre\" --role admin"
      );
      process.exit(1);
    }
  } else if (!email || !password || !name) {
    console.error(
      "Error: se requieren --email, --password y --name.\n" +
        "Uso: npx tsx scripts/seed-user.ts --email x@x.com --password secret --name \"Nombre\" --role admin\n" +
        "     npx tsx scripts/seed-user.ts --user-id <uuid> --name \"Nombre\" --role admin"
    );
    process.exit(1);
  }

  if (role !== "admin" && role !== "vet" && role !== "groomer") {
    console.error(`Error: --role debe ser "admin", "vet" o "groomer". Recibido: "${role}"`);
    process.exit(1);
  }

  // Validate env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
    console.error(
      "Error: faltan variables de entorno.\n" +
        "Asegurate de que NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y DATABASE_URL estén en .env.local"
    );
    process.exit(1);
  }

  // Dynamic imports (after env is loaded)
  const { createClient } = await import("@supabase/supabase-js");
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { staff } = await import("../src/db/schema/index.js");

  // Use service role client — this can create users without email confirmation
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Step 1: Create the auth user (skipped if --user-id is provided)
  let authUserId: string;

  if (existingUserId) {
    authUserId = existingUserId;
    console.log(`→ Usando usuario existente: ${authUserId}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        console.error(`Error: el email "${email}" ya está registrado en Supabase Auth.`);
      } else {
        console.error(`Error al crear el usuario en Supabase Auth: ${error.message}`);
      }
      process.exit(1);
    }

    const authUser = data.user;
    if (!authUser) {
      console.error("Error: Supabase devolvió una respuesta vacía al crear el usuario.");
      process.exit(1);
    }
    authUserId = authUser.id;
  }

  // Step 2: Insert the staff row
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema: { staff } });

  try {
    await db.insert(staff).values({
      id: createId("stf"),
      userId: authUserId,
      name,
      role,
    });
  } catch (dbError: unknown) {
    // Auth user was already created — log the orphaned ID so it can be cleaned up manually
    console.error(
      `Error al insertar en la tabla staff: ${dbError instanceof Error ? dbError.message : dbError}\n` +
        `AVISO: el usuario fue creado en Supabase Auth (id: ${authUserId}) pero NO tiene fila en staff. Eliminalo manualmente desde el dashboard de Supabase.`
    );
    await client.end();
    process.exit(1);
  }

  console.log(`✓ Usuario creado: ${name} (${email}) — rol: ${role}`);

  await client.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
