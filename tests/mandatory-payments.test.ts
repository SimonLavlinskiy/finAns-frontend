import { describe, expect, it } from "vitest";
import { getDateHighlight } from "../src/lib/mandatory-payments";

function dateOffset(days: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
  return d.toISOString().slice(0, 10);
}

describe("getDateHighlight", () => {
  it("сегодня → warn", () => expect(getDateHighlight(dateOffset(0))).toBe("warn"));
  it("через 1 день → warn", () => expect(getDateHighlight(dateOffset(1))).toBe("warn"));
  it("через 3 дня → warn", () => expect(getDateHighlight(dateOffset(3))).toBe("warn"));
  it("через 4 дня → normal", () => expect(getDateHighlight(dateOffset(4))).toBe("normal"));
  it("вчера → normal", () => expect(getDateHighlight(dateOffset(-1))).toBe("normal"));
  it("неделю назад → normal", () => expect(getDateHighlight(dateOffset(-7))).toBe("normal"));
  it("далёкое будущее → normal", () => expect(getDateHighlight(dateOffset(30))).toBe("normal"));
});
