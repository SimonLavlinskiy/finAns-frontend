export type DateHighlight = "warn" | "normal";

export function isCurrentlyPaid(lastPaidAt: string | null): boolean {
  return lastPaidAt != null;
}

/**
 * Подсвечивает дату платежа тёплым жёлтым, если до неё ≤3 дней (включая сегодня).
 * Прошедшие даты — обычный цвет.
 */
export function getDateHighlight(dateStr: string): DateHighlight {
  const now = new Date();
  // Работаем в UTC чтобы избежать timezone-артефактов при сравнении дат
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const due = new Date(dateStr + "T00:00:00Z").getTime();
  const diffDays = Math.floor((due - today) / 86400000);
  if (diffDays >= 0 && diffDays <= 3) return "warn";
  return "normal";
}

export const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Ежедневно",
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
  quarterly: "Ежеквартально",
  semi_annual: "Раз в полгода",
  yearly: "Ежегодно",
};
