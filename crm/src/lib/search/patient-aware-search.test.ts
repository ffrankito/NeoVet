import { describe, test, expect } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { buildPatientAwareSearchClause } from "./patient-aware-search";

const dialect = new PgDialect();

function compile(term: string | undefined) {
  const clause = buildPatientAwareSearchClause(term);
  if (!clause) return null;
  return dialect.sqlToQuery(clause);
}

describe("buildPatientAwareSearchClause — empty inputs", () => {
  test("returns undefined when term is empty string", () => {
    expect(buildPatientAwareSearchClause("")).toBeUndefined();
  });

  test("returns undefined when term is whitespace-only", () => {
    expect(buildPatientAwareSearchClause("   ")).toBeUndefined();
  });

  test("returns undefined when term is undefined", () => {
    expect(buildPatientAwareSearchClause(undefined)).toBeUndefined();
  });
});

describe("buildPatientAwareSearchClause — real term", () => {
  test("returns a SQL predicate (not undefined) when given a non-empty term", () => {
    const result = buildPatientAwareSearchClause("Rocky");
    expect(result).toBeDefined();
  });

  test("matches against patients.name column with ILIKE", () => {
    const compiled = compile("Rocky");
    expect(compiled).not.toBeNull();
    expect(compiled!.sql.toLowerCase()).toContain("patients");
    expect(compiled!.sql.toLowerCase()).toContain("name");
    expect(compiled!.sql.toLowerCase()).toContain("ilike");
    expect(compiled!.params).toContain("%Rocky%");
  });

  test("matches against clients.name column (owner name)", () => {
    const compiled = compile("González");
    const lowered = compiled!.sql.toLowerCase();
    // Both tables' name columns should appear; we check the clients table name
    // is referenced in the clause at least once.
    expect(lowered).toContain("clients");
    expect(compiled!.params).toContain("%González%");
  });

  test("matches against clients.dni column (owner DNI)", () => {
    const compiled = compile("30123456");
    expect(compiled!.sql.toLowerCase()).toContain("dni");
    expect(compiled!.params).toContain("%30123456%");
  });

  test("matches against clients.phone column (owner phone)", () => {
    const compiled = compile("3411234567");
    expect(compiled!.sql.toLowerCase()).toContain("phone");
    expect(compiled!.params).toContain("%3411234567%");
  });

  test("matches against clients.address column (owner address)", () => {
    const compiled = compile("Morrow");
    expect(compiled!.sql.toLowerCase()).toContain("address");
    expect(compiled!.params).toContain("%Morrow%");
  });
});
