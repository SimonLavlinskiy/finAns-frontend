import { parseMonth } from "./months";

type CategoryLifetime = { created_at?: string; deleted_at?: string | null };

/**
 * Категория видна в месяце M, если существовала в нём хотя бы один день:
 * createdAt ≤ конец M и (deletedAt пусто или deletedAt ≥ начало M).
 *
 * Уточнение: категория с тратами в M видна, даже если создана позже
 * (исторические операции, импорт) — иначе суммы категорий не сходились бы с расходом.
 */
export function isCategoryVisibleInMonth(cat: CategoryLifetime, month: string, hasSpend = false): boolean {
  const { year, month: m } = parseMonth(month);
  const start = new Date(year, m - 1, 1).getTime();
  const end = new Date(year, m, 1).getTime() - 1;

  if (cat.deleted_at && new Date(cat.deleted_at).getTime() < start) return false;
  if (hasSpend) return true;
  if (cat.created_at && new Date(cat.created_at).getTime() > end) return false;
  return true;
}
