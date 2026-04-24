/**
 * Set a user's role in BOTH the auth JWT (app_metadata.role) and the staff table.
 *
 * Usage:
 *   npx tsx scripts/set-user-role.ts <email> <role> [--dry]
 *
 * Roles: admin | owner | vet | groomer
 *
 * The --dry flag prints the intended change without writing.
 *
 * After a successful write the target user MUST log out and log back in so
 * their JWT picks up the new role — middleware reads x-user-role from the
 * JWT, not the DB.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { staff } from "../src/db/schema";

const VALID_ROLES = ["admin", "owner", "vet", "groomer"] as const;
type Role = typeof VALID_ROLES[number];

// ---------------------------------------------------------------------------
// Parse & validate args
// ---------------------------------------------------------------------------
const [email, roleArg, ...rest] = process.argv.slice(2);
const dryRun = rest.includes("--dry");

function usage(code = 1): never {
  console.error("Usage: npx tsx scripts/set-user-role.ts <email> <role> [--dry]");
  console.error(`Roles: ${VALID_ROLES.join(" | ")}`);
  console.error("Example: npx tsx scripts/set-user-role.ts tomaspinolini2003@gmail.com vet --dry");
  process.exit(code);
}

if (!email || !roleArg) usage();
if (!VALID_ROLES.includes(roleArg as Role)) {
  console.error(`Invalid role "${roleArg}". Must be one of: ${VALID_ROLES.join(", ")}\n`);
  usage();
}
const role = roleArg as Role;

// ---------------------------------------------------------------------------
// Env + clients
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_KEY || !DATABASE_URL) {
  console.error("Missing required env vars in .env.local:");
  if (!SUPABASE_URL) console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  if (!SERVICE_KEY) console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  if (!DATABASE_URL) console.error("  - DATABASE_URL");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const pgUrl = new URL(DATABASE_URL);
const pg = postgres({
  host: pgUrl.hostname,
  port: Number(pgUrl.port),
  user: decodeURIComponent(pgUrl.username),
  password: decodeURIComponent(pgUrl.password),
  database: pgUrl.pathname.slice(1),
  ssl: "require",
  max: 1,
});
const db = drizzle(pg, { schema });

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // 1) Find auth user by email
  const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listErr) throw listErr;

  const user = usersData.users.find(
    (u) => (u.email ?? "").toLowerCase() === email.toLowerCase()
  );
  if (!user) {
    console.error(`No auth user found with email: ${email}`);
    process.exit(1);
  }

  const currentAuthRole =
    (user.app_metadata?.role as string | undefined) ?? "(none)";

  // 2) Find linked staff row (if any)
  const [staffRow] = await db
    .select({ id: staff.id, name: staff.name, role: staff.role })
    .from(staff)
    .where(eq(staff.userId, user.id))
    .limit(1);

  // 3) Report current state
  console.log(`User email:        ${user.email}`);
  console.log(`User id:           ${user.id}`);
  console.log(`Current auth role: ${currentAuthRole}`);
  console.log(`Target auth role:  ${role}`);
  if (staffRow) {
    console.log(`Staff record:      ${staffRow.name} (id: ${staffRow.id})`);
    console.log(`Current staff.role: ${staffRow.role}`);
  } else {
    console.log(`Staff record:      NONE (no staff row linked to this user)`);
  }

  const authNeedsUpdate = currentAuthRole !== role;
  const staffNeedsUpdate = staffRow && staffRow.role !== role;

  if (!authNeedsUpdate && !staffNeedsUpdate) {
    console.log(`\nNothing to do — auth and staff already at "${role}".`);
    await pg.end();
    return;
  }

  if (dryRun) {
    console.log("\n[dry-run] Would update:");
    if (authNeedsUpdate) console.log(`  - auth.app_metadata.role: ${currentAuthRole} -> ${role}`);
    if (staffNeedsUpdate) console.log(`  - staff.role: ${staffRow!.role} -> ${role}`);
    console.log("Re-run without --dry to apply.");
    await pg.end();
    return;
  }

  // 4) Apply updates
  if (authNeedsUpdate) {
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      user.id,
      { app_metadata: { ...user.app_metadata, role } }
    );
    if (updateErr) throw updateErr;
    console.log(`\n✓ auth.app_metadata.role: ${currentAuthRole} -> ${role}`);
  }

  if (staffNeedsUpdate) {
    await db
      .update(staff)
      .set({ role })
      .where(eq(staff.id, staffRow!.id));
    console.log(`✓ staff.role: ${staffRow!.role} -> ${role}`);
  }

  console.log(
    "\nDone. The target user must log out and log back in for the new role to take effect."
  );
  await pg.end();
}

main().catch(async (err) => {
  console.error("Error:", err);
  await pg.end().catch(() => {});
  process.exit(1);
});
