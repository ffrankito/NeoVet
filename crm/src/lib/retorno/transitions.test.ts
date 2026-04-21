import { describe, expect, test } from "vitest";
import { validateTransition } from "./transitions";

describe("retorno state machine — allowed transitions", () => {
  test("pending → in_progress is allowed", () => {
    expect(validateTransition("pending", "in_progress")).toEqual({ ok: true });
  });

  test("in_progress → completed is allowed", () => {
    expect(validateTransition("in_progress", "completed")).toEqual({
      ok: true,
    });
  });
});

describe("retorno state machine — forbidden transitions", () => {
  test("pending → completed is rejected (must go through in_progress)", () => {
    const result = validateTransition("pending", "completed");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/in_progress/i);
    }
  });

  test("in_progress → pending is rejected (no backward moves)", () => {
    const result = validateTransition("in_progress", "pending");
    expect(result.ok).toBe(false);
  });

  test("completed → in_progress is rejected (terminal state)", () => {
    const result = validateTransition("completed", "in_progress");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/terminal|completed/i);
    }
  });

  test("completed → pending is rejected (terminal state)", () => {
    const result = validateTransition("completed", "pending");
    expect(result.ok).toBe(false);
  });

  test("pending → pending is rejected (self-transition)", () => {
    const result = validateTransition("pending", "pending");
    expect(result.ok).toBe(false);
  });

  test("in_progress → in_progress is rejected (self-transition)", () => {
    const result = validateTransition("in_progress", "in_progress");
    expect(result.ok).toBe(false);
  });

  test("completed → completed is rejected (self-transition)", () => {
    const result = validateTransition("completed", "completed");
    expect(result.ok).toBe(false);
  });
});
