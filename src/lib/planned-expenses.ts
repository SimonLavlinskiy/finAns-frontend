import type { PlannedExpense } from "./types";

export const PRIORITY_DOT_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#ef4444",
};

export const PRIORITY_SORT_WEIGHT: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export function getEffectivePriority(
  item: Pick<PlannedExpense, "priority" | "due_date">,
): "low" | "medium" | "high" {
  if (!item.due_date) return item.priority;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(item.due_date + "T00:00:00");
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diffDays >= 0 && diffDays <= 3) return "high";
  return item.priority;
}

export function sortItemsByPriority(items: PlannedExpense[]): PlannedExpense[] {
  return [...items].sort((a, b) => {
    const wa = PRIORITY_SORT_WEIGHT[a.effective_priority] ?? 0;
    const wb = PRIORITY_SORT_WEIGHT[b.effective_priority] ?? 0;
    return wb - wa;
  });
}
