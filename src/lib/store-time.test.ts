import { describe, expect, it } from "vitest";
import { greetingFor } from "@/lib/store-time";

describe("greetingFor", () => {
  it("usa o relógio da loja (São Paulo), não o UTC do servidor", () => {
    // 14h UTC = 11h em São Paulo.
    expect(greetingFor(new Date("2026-10-06T14:00:00Z"))).toBe("Bom dia");
    expect(greetingFor(new Date("2026-10-06T15:00:00Z"))).toBe("Boa tarde");
    expect(greetingFor(new Date("2026-10-06T21:00:00Z"))).toBe("Boa noite");
    // 01h UTC do dia 7 ainda é 22h do dia 6 na loja.
    expect(greetingFor(new Date("2026-10-07T01:00:00Z"))).toBe("Boa noite");
  });
});
