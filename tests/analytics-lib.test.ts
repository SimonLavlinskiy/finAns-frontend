import { describe, expect, it } from "vitest";
import { addMonths, daysInMonth, monthGenitive, monthPrepositional, monthTitle } from "../src/features/analytics/lib/months";
import { isDueInMonth, nextMonthOf } from "../src/features/analytics/lib/recurrence";
import { isCategoryVisibleInMonth } from "../src/features/analytics/lib/visibility";
import { formatMoney, formatPercentOf, parseAmountInput } from "../src/lib/format";
import { plural } from "../src/lib/plural";

const NBSP = " ";

describe("formatMoney", () => {
  it("минус U+2212, неразрывные пробелы, без копеек", () => {
    expect(formatMoney(-151_100)).toBe(`−1${NBSP}511${NBSP}₽`);
    expect(formatMoney(123_456_789)).toBe(`1${NBSP}234${NBSP}568${NBSP}₽`);
    expect(formatMoney(0)).toBe(`0${NBSP}₽`);
  });
  it("знак always и none", () => {
    expect(formatMoney(993_000, { sign: "always" })).toBe(`+9${NBSP}930${NBSP}₽`);
    expect(formatMoney(0, { sign: "always" })).toBe(`0${NBSP}₽`);
    expect(formatMoney(-500, { sign: "none" })).toBe(`5${NBSP}₽`);
  });
  it("процент и «—» при нулевом доходе", () => {
    expect(formatPercentOf(25, 100)).toBe("25%");
    expect(formatPercentOf(25, 0)).toBe("—");
  });
  it("ввод суммы", () => {
    expect(parseAmountInput("12000")).toBe(1_200_000);
    expect(parseAmountInput("1 000,5")).toBe(100_050);
    expect(parseAmountInput("100+200")).toBe(30_000);
    expect(parseAmountInput("  ")).toBeNull();
    expect(parseAmountInput("abc")).toBeNaN();
    expect(parseAmountInput("-5")).toBeNaN();
  });
});

describe("plural", () => {
  const forms: [string, string, string] = ["категория", "категории", "категорий"];
  it.each([
    [1, "категория"],
    [3, "категории"],
    [5, "категорий"],
    [11, "категорий"],
    [21, "категория"],
    [22, "категории"],
    [111, "категорий"],
  ])("%i → %s", (n, expected) => expect(plural(n, forms)).toBe(expected));
});

describe("months", () => {
  it("названия и арифметика", () => {
    expect(monthTitle("2026-10")).toBe("Октябрь 2026");
    expect(monthGenitive("2026-10")).toBe("октября");
    expect(monthPrepositional("2026-09")).toBe("сентябре");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(daysInMonth("2026-11")).toBe(30);
  });
});

describe("isDueInMonth", () => {
  it("полугодовой KinoPub (апрель/октябрь) не попадает в ноябрь", () => {
    expect(isDueInMonth("2026-10-05", "semi_annual", 2026, 11)).toBe(false);
    expect(isDueInMonth("2026-10-05", "semi_annual", 2027, 4)).toBe(true);
  });
  it("ежемесячный, в т.ч. просроченный", () => {
    expect(isDueInMonth("2026-10-31", "monthly", 2026, 11)).toBe(true);
    expect(isDueInMonth("2026-08-15", "monthly", 2026, 11)).toBe(true);
  });
  it("следующая дата позже месяца — нет", () => {
    expect(isDueInMonth("2026-12-01", "monthly", 2026, 11)).toBe(false);
  });
  it("квартальный и годовой", () => {
    expect(isDueInMonth("2026-08-10", "quarterly", 2026, 11)).toBe(true);
    expect(isDueInMonth("2026-09-10", "quarterly", 2026, 11)).toBe(false);
    expect(isDueInMonth("2026-03-01", "yearly", 2026, 11)).toBe(false);
  });
  it("ежедневный и еженедельный", () => {
    expect(isDueInMonth("2026-10-20", "weekly", 2026, 11)).toBe(true);
    expect(isDueInMonth("2026-10-20", "daily", 2026, 11)).toBe(true);
  });
  it("следующий месяц", () => {
    expect(nextMonthOf("2026-12")).toEqual({ year: 2027, month: 1 });
  });
});

describe("isCategoryVisibleInMonth", () => {
  const sport = { created_at: "2026-01-10T10:00:00Z", deleted_at: "2026-04-20T10:00:00Z" };
  it("видна в месяцах существования", () => {
    expect(isCategoryVisibleInMonth(sport, "2026-04")).toBe(true);
    expect(isCategoryVisibleInMonth(sport, "2026-02")).toBe(true);
  });
  it("не видна после удаления и до создания", () => {
    expect(isCategoryVisibleInMonth(sport, "2026-05")).toBe(false);
    expect(isCategoryVisibleInMonth(sport, "2025-12")).toBe(false);
  });
  it("с тратами видна и до даты создания (исторические операции)", () => {
    expect(isCategoryVisibleInMonth(sport, "2025-12", true)).toBe(true);
    expect(isCategoryVisibleInMonth(sport, "2026-05", true)).toBe(false);
  });
});
