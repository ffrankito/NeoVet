// One-shot: copy the DATABASE_URL line from .env.local into .env so
// drizzle-kit (which reads .env) has the same credentials as the runtime
// (which reads .env.local). Avoids echoing the password anywhere.
import { readFileSync, writeFileSync } from "node:fs";

const local = readFileSync(".env.local", "utf8");
const env = readFileSync(".env", "utf8");

const match = local.match(/^DATABASE_URL=.*$/m);
if (!match) {
  console.error("FAIL — no DATABASE_URL in .env.local");
  process.exit(1);
}

const updated = env.match(/^DATABASE_URL=/m)
  ? env.replace(/^DATABASE_URL=.*$/m, match[0])
  : env + (env.endsWith("\n") ? "" : "\n") + match[0] + "\n";

writeFileSync(".env", updated);
console.log("synced DATABASE_URL from .env.local → .env");
