import { describe, it, expect } from "vitest";
import {
  evaluateAmountExpression,
  formatKopecks,
  formatRubles,
  formatDate,
  parseRublesInput,
  rublesToKopecks,
} from "../src/lib/format";

describe("formatKopecks", () => {
  it("formats zero", () => {
    expect(formatKopecks(0)).toBe("0,00");
  });
  it("formats 100 kopecks as 1,00", () => {
    expect(formatKopecks(100)).toBe("1,00");
  });
  it("formats 12345 kopecks as 123,45", () => {
    expect(formatKopecks(12345)).toBe("123,45");
  });
  it("formats negative value", () => {
    expect(formatKopecks(-5050)).toBe("-50,50");
  });
});

describe("formatRubles", () => {
  it("strips kopecks and rounds", () => {
    expect(formatRubles(12345)).toBe("123");
  });
  it("rounds up at 50 kopecks", () => {
    expect(formatRubles(150)).toBe("2");
  });
  it("rounds down at 49 kopecks", () => {
    expect(formatRubles(149)).toBe("1");
  });
  it("large number", () => {
    // 1 000 000 kopecks = 10 000 rubles
    const result = formatRubles(1_000_000_00);
    expect(result.replace(/\s/g, "")).toBe("1000000");
  });
});

describe("formatDate", () => {
  it("converts ISO to DD.MM.YYYY", () => {
    expect(formatDate("2024-03-15")).toBe("15.03.2024");
  });
  it("pads single-digit day/month", () => {
    expect(formatDate("2024-01-05")).toBe("05.01.2024");
  });
});

describe("parseRublesInput", () => {
  it("parses integer", () => {
    expect(parseRublesInput("100")).toBe(10000);
  });
  it("parses decimal with dot", () => {
    expect(parseRublesInput("10.50")).toBe(1050);
  });
  it("parses decimal with comma", () => {
    expect(parseRublesInput("10,50")).toBe(1050);
  });
  it("strips spaces", () => {
    expect(parseRublesInput("1 000")).toBe(100000);
  });
  it("returns 0 for empty", () => {
    expect(parseRublesInput("")).toBe(0);
  });
  it("returns 0 for non-numeric", () => {
    expect(parseRublesInput("abc")).toBe(0);
  });
});

describe("rublesToKopecks", () => {
  it("100 rubles = 10000 kopecks", () => {
    expect(rublesToKopecks(100)).toBe(10000);
  });
  it("handles fractions correctly", () => {
    expect(rublesToKopecks(1.23)).toBe(123);
  });
  it("rounds floating point", () => {
    expect(rublesToKopecks(0.005)).toBe(1);
  });
});

describe("evaluateAmountExpression", () => {
  it("sums multiple numbers", () => {
    expect(evaluateAmountExpression("378+567+844")).toBe(1789);
  });
  it("supports all four operations with precedence", () => {
    expect(evaluateAmountExpression("2+3*4")).toBe(14);
    expect(evaluateAmountExpression("10-2/2")).toBe(9);
  });
  it("supports parentheses", () => {
    expect(evaluateAmountExpression("(100+50)*2")).toBe(300);
  });
  it("supports comma as decimal separator", () => {
    expect(evaluateAmountExpression("10,5+5,5")).toBe(16);
  });
  it("returns null for plain numbers (no operator)", () => {
    expect(evaluateAmountExpression("500")).toBeNull();
  });
  it("returns null for empty input", () => {
    expect(evaluateAmountExpression("")).toBeNull();
  });
  it("returns null for a dangling operator", () => {
    expect(evaluateAmountExpression("100+")).toBeNull();
  });
  it("returns null for division by zero", () => {
    expect(evaluateAmountExpression("10/0")).toBeNull();
  });
  it("returns null for non-arithmetic input", () => {
    expect(evaluateAmountExpression("abc+1")).toBeNull();
  });
});
