import { describe, expect, it } from "vitest";
import {
  averageRoundedTo100Rub,
  computeBarLayout,
  computePlanner,
  diffTone,
  limitFill,
  pushComparison,
  sortLimitRows,
  spendPerDay,
  summarizeLimits,
  toggleMonthSelection,
  yearTotals,
} from "../src/features/analytics/lib/calc";

const RUB = 100;
const cat = (id: number, rub: number) => ({ id, label: `c${id}`, color: "#000", amount: rub * RUB });

describe("computeBarLayout", () => {
  it("E < I: категории от дохода и белое «Свободно»", () => {
    const l = computeBarLayout(100_000 * RUB, [cat(2, 30_000), cat(1, 40_000)]);
    expect(l.state).toBe("free");
    expect(l.pieces.map((p) => [p.kind, Math.round(p.width)])).toEqual([
      ["category", 40],
      ["category", 30],
      ["free", 30],
    ]);
    expect(l.dividerAt).toBeNull();
  });

  it("E = I: только категории", () => {
    const l = computeBarLayout(70_000 * RUB, [cat(1, 40_000), cat(2, 30_000)]);
    expect(l.state).toBe("equal");
    expect(l.pieces.every((p) => p.kind === "category")).toBe(true);
  });

  it("E > I: граничная категория режется, черта и «Перерасход»", () => {
    const l = computeBarLayout(100_000 * RUB, [cat(1, 60_000), cat(2, 50_000), cat(3, 15_000)]);
    expect(l.state).toBe("over");
    expect(l.pieces.map((p) => [p.kind, Math.round(p.width)])).toEqual([
      ["category", 48],
      ["category", 32],
      ["over", 20],
    ]);
    expect(l.dividerAt).toBe(80);
    const sum = l.pieces.reduce((s, p) => s + p.width, 0);
    expect(sum).toBeCloseTo(100);
  });

  it("I = 0, E > 0: целиком «Перерасход» без черты", () => {
    const l = computeBarLayout(0, [cat(1, 500)]);
    expect(l.pieces).toEqual([{ kind: "over", amount: 500 * RUB, width: 100 }]);
    expect(l.dividerAt).toBeNull();
  });

  it("I > 0, E = 0: целиком «Свободно»; пусто — empty", () => {
    expect(computeBarLayout(1000, []).pieces).toEqual([{ kind: "free", amount: 1000, width: 100 }]);
    expect(computeBarLayout(0, []).state).toBe("empty");
  });
});

describe("spendPerDay", () => {
  it("18.10, I=100 000, E=61 000 → 2 786 ₽ (D=14)", () => {
    expect(Math.round(spendPerDay(100_000 * RUB, 61_000 * RUB, 18, 31) / RUB)).toBe(2786);
  });
  it("не меньше нуля", () => {
    expect(spendPerDay(100, 500, 1, 30)).toBe(0);
  });
  it("последний день месяца: D = 1", () => {
    expect(spendPerDay(5_000 * RUB, 0, 31, 31)).toBe(5_000 * RUB);
  });
});

describe("limits", () => {
  const rows = [
    { categoryId: 1, name: "Еда", spent: 9_000, limit: 10_000 },
    { categoryId: 2, name: "Кафе", spent: 6_000, limit: 5_000 },
    { categoryId: 3, name: "Такси", spent: 3_000, limit: null },
    { categoryId: 4, name: "Подарки", spent: 8_000, limit: null },
  ];

  it("по заполнению лимита: с лимитом по доле, затем без лимита по сумме", () => {
    expect(sortLimitRows(rows, "fill").map((r) => r.name)).toEqual(["Кафе", "Еда", "Подарки", "Такси"]);
  });
  it("по сумме", () => {
    expect(sortLimitRows(rows, "amount").map((r) => r.name)).toEqual(["Еда", "Подарки", "Кафе", "Такси"]);
  });
  it("сводка превышений", () => {
    const s = summarizeLimits([
      { categoryId: 1, spent: 6_000, limit: 5_000 },
      { categoryId: 2, spent: 3_500, limit: 3_000 },
      { categoryId: 3, spent: 100, limit: null },
    ]);
    expect(s).toEqual({ limitsTotal: 8_000, limitedCount: 2, spentInLimits: 9_500, overCount: 2, overSum: 1_500 });
  });
  it("среднее за 3 месяца округляется до 100 ₽", () => {
    expect(averageRoundedTo100Rub([9_120 * RUB, 10_480 * RUB, 11_050 * RUB])).toBe(10_200 * RUB);
  });
  it("заполнение: в пределах и с превышением", () => {
    expect(limitFill(5_000, 10_000)).toEqual({ fill: 50, over: 0 });
    const f = limitFill(6_511, 5_000);
    expect(Math.round(f.fill)).toBe(77);
    expect(f.fill + f.over).toBeCloseTo(100);
  });
});

describe("dynamics", () => {
  it("средние только по завершённым месяцам", () => {
    const months = [
      ...Array.from({ length: 9 }, (_, i) => ({ month: `2026-0${i + 1}`, income: 100_000, expense: 50_000, is_current: false })),
      { month: "2026-10", income: 40_000, expense: 0, is_current: true },
    ];
    const t = yearTotals(months);
    expect(t.income).toBe(940_000);
    expect(t.avgIncome).toBe(100_000);
    expect(t.avgExpense).toBe(50_000);
  });

  it("выделение: максимум 2, третья вытесняет раннюю, повторный клик снимает", () => {
    expect(toggleMonthSelection(["2026-09", "2026-10"], "2026-07")).toEqual(["2026-10", "2026-07"]);
    expect(toggleMonthSelection(["2026-09", "2026-10"], "2026-09")).toEqual(["2026-10"]);
  });

  it("сравнение: новый месяц заменяет выбранный раньше", () => {
    const r = pushComparison(["2026-09", "2026-10"], [0, 1], "2026-07");
    expect(r.pair).toEqual(["2026-07", "2026-10"]);
    const r2 = pushComparison(r.pair, r.order, "2026-03");
    expect(r2.pair).toEqual(["2026-07", "2026-03"]);
  });

  it("цвет разницы", () => {
    expect(diffTone(2_000 * RUB, false)).toBe("negative"); // расход вырос
    expect(diffTone(-5_000 * RUB, true)).toBe("negative"); // доход упал
    expect(diffTone(-1_000 * RUB, false)).toBe("positive");
    expect(diffTone(30, true)).toBe("zero");
  });
});

describe("computePlanner", () => {
  it("свободно, в день и разбивка", () => {
    const r = computePlanner({
      incomes: [150_000 * RUB, null],
      payments: [{ id: 1, categoryId: 10, amount: 50_000 * RUB }],
      categories: [{ id: 10 }, { id: 11 }, { id: 12 }],
      plans: { 10: 50_000 * RUB, 11: 40_000 * RUB },
      days: 30,
    });
    expect(r.free).toBe(60_000 * RUB);
    expect(r.perDay).toBe(2_000 * RUB);
    expect(r.expense).toBe(90_000 * RUB);
    expect(r.regular).toBe(50_000 * RUB);
    expect(r.planned).toBe(40_000 * RUB);
  });

  it("план не ниже минимума; нехватка — без «в день»", () => {
    const r = computePlanner({
      incomes: [10_000],
      payments: [{ id: 1, categoryId: 1, amount: 45_000 }],
      categories: [{ id: 1 }],
      plans: { 1: 30_000 },
      days: 30,
    });
    expect(r.effectiveByCategory[1]).toBe(45_000);
    expect(r.free).toBe(-35_000);
    expect(r.perDay).toBeNull();
  });
});
