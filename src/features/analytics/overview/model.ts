import type { MonthSummary } from "@/lib/types";
import type { Category } from "../api";
import { isCategoryVisibleInMonth } from "../lib/visibility";

export type CategorySpend = {
  category: Category;
  amount: number;
  subcategories: MonthSummary["categories"][number]["subcategories"];
};

const UNKNOWN_COLOR = "hsl(var(--muted-foreground))";

/**
 * Расходные категории месяца: из настроек (включая удалённые, если существовали в месяце)
 * + суммы из сводки. includeEmpty — категории без трат тоже (таблица лимитов).
 */
export function expenseCategoriesForMonth(
  summary: MonthSummary | undefined,
  categories: Category[],
  byId: Map<number, Category>,
  month: string,
  includeEmpty: boolean,
): CategorySpend[] {
  const spend = new Map((summary?.categories ?? []).map((c) => [c.category_id, c]));
  const result: CategorySpend[] = [];

  for (const cat of categories) {
    if (cat.kind === "income") continue;
    const s = spend.get(cat.id);
    const amount = s?.amount ?? 0;
    if (!isCategoryVisibleInMonth(cat, month, amount > 0)) continue;
    if (!includeEmpty && amount <= 0) continue;
    result.push({ category: cat, amount, subcategories: s?.subcategories ?? [] });
  }

  // Траты по тегам, которых нет в настройках (на всякий случай) — отдельной строкой.
  for (const s of summary?.categories ?? []) {
    if (byId.has(s.category_id) || s.amount <= 0) continue;
    result.push({
      category: {
        id: s.category_id,
        name: "Без категории",
        color: UNKNOWN_COLOR,
        kind: "expense",
        order: Number.MAX_SAFE_INTEGER,
        subcategories: new Map(),
      },
      amount: s.amount,
      subcategories: s.subcategories,
    });
  }
  return result;
}
