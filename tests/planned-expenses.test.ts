import { describe, expect, it } from "vitest";
import {
  getEffectivePriority,
  sortItemsByPriority,
} from "../src/lib/planned-expenses";
import type { PlannedExpense } from "../src/lib/types";

function dateOffset(days: number): string {
  const now = new Date();
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days),
  );
  return d.toISOString().slice(0, 10);
}

function makeItem(
  overrides: Partial<PlannedExpense> & { id: number },
): PlannedExpense {
  return {
    category_id: 1,
    title: "test",
    cost_kopecks: null,
    due_date: null,
    url: null,
    priority: "medium",
    effective_priority: "medium",
    is_due_soon: false,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getEffectivePriority", () => {
  it("без даты → возвращает исходный приоритет", () => {
    expect(getEffectivePriority({ priority: "low", due_date: null })).toBe("low");
    expect(getEffectivePriority({ priority: "medium", due_date: null })).toBe("medium");
    expect(getEffectivePriority({ priority: "high", due_date: null })).toBe("high");
  });

  it("дата сегодня → high", () => {
    expect(getEffectivePriority({ priority: "low", due_date: dateOffset(0) })).toBe("high");
  });

  it("дата через 1 день → high", () => {
    expect(getEffectivePriority({ priority: "low", due_date: dateOffset(1) })).toBe("high");
  });

  it("дата через 3 дня → high", () => {
    expect(getEffectivePriority({ priority: "low", due_date: dateOffset(3) })).toBe("high");
  });

  it("дата через 4 дня → не эскалирует", () => {
    expect(getEffectivePriority({ priority: "low", due_date: dateOffset(4) })).toBe("low");
    expect(getEffectivePriority({ priority: "medium", due_date: dateOffset(4) })).toBe("medium");
  });

  it("дата в прошлом → не эскалирует", () => {
    expect(getEffectivePriority({ priority: "low", due_date: dateOffset(-1) })).toBe("low");
    expect(getEffectivePriority({ priority: "medium", due_date: dateOffset(-7) })).toBe("medium");
  });

  it("приоритет уже high с датой через 3 дня → high", () => {
    expect(getEffectivePriority({ priority: "high", due_date: dateOffset(3) })).toBe("high");
  });
});

describe("sortItemsByPriority", () => {
  it("сортирует high > medium > low", () => {
    const items = [
      makeItem({ id: 1, effective_priority: "low" }),
      makeItem({ id: 2, effective_priority: "high" }),
      makeItem({ id: 3, effective_priority: "medium" }),
    ];
    const sorted = sortItemsByPriority(items);
    expect(sorted.map((i) => i.effective_priority)).toEqual(["high", "medium", "low"]);
  });

  it("сохраняет порядок внутри одной группы приоритета", () => {
    const items = [
      makeItem({ id: 1, effective_priority: "medium" }),
      makeItem({ id: 2, effective_priority: "medium" }),
      makeItem({ id: 3, effective_priority: "medium" }),
    ];
    const sorted = sortItemsByPriority(items);
    expect(sorted.map((i) => i.id)).toEqual([1, 2, 3]);
  });

  it("не мутирует исходный массив", () => {
    const items = [
      makeItem({ id: 1, effective_priority: "low" }),
      makeItem({ id: 2, effective_priority: "high" }),
    ];
    const original = [...items];
    sortItemsByPriority(items);
    expect(items[0].id).toBe(original[0].id);
  });

  it("пустой массив → пустой массив", () => {
    expect(sortItemsByPriority([])).toEqual([]);
  });

  it("undefined → пустой массив, не падает", () => {
    expect(() => sortItemsByPriority(undefined)).not.toThrow();
    expect(sortItemsByPriority(undefined)).toEqual([]);
  });

  it("null → пустой массив, не падает", () => {
    expect(() => sortItemsByPriority(null)).not.toThrow();
    expect(sortItemsByPriority(null)).toEqual([]);
  });
});
