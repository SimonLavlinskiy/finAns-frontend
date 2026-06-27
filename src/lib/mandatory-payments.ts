export type DateHighlight = "warn" | "normal";

export function isPaidThisPeriod(nextPaymentDate: string): boolean {
  const now = new Date();
  const todayStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10);
  return nextPaymentDate > todayStr;
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
