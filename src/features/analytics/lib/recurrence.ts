import type { MandatoryPaymentRecurrence } from "@/lib/types";
import { parseMonth } from "./months";

const STEP_MONTHS: Partial<Record<MandatoryPaymentRecurrence, number>> = {
  monthly: 1,
  quarterly: 3,
  semi_annual: 6,
  yearly: 12,
};

function addMonthsClamped(base: Date, months: number): Date {
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(base.getDate(), lastDay));
  return target;
}

/**
 * Приходится ли регулярный платёж на месяц (year, month): шагаем от
 * next_payment_date по периодичности (как advanceDate на backend) и проверяем,
 * попадает ли хотя бы одна дата в месяц.
 */
export function isDueInMonth(nextPaymentDate: string, recurrence: MandatoryPaymentRecurrence, year: number, month: number): boolean {
  const [y, m, d] = nextPaymentDate.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  if (base > end) return false;
  if (recurrence === "daily" || recurrence === "weekly") return true;

  const step = STEP_MONTHS[recurrence];
  if (!step) return false;
  for (let k = 0; k < 1200; k++) {
    const date = addMonthsClamped(base, k * step);
    if (date > end) return false;
    if (date >= start) return true;
  }
  return false;
}

/** Следующий месяц после текущего, YYYY-MM. */
export function nextMonthOf(currentMonth: string): { year: number; month: number } {
  const { year, month } = parseMonth(currentMonth);
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}
