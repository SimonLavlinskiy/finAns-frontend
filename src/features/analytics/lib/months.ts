/** Месяцы в формате YYYY-MM и их русские названия. */

const NOMINATIVE = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const PREPOSITIONAL = [
  "январе", "феврале", "марте", "апреле", "мае", "июне",
  "июле", "августе", "сентябре", "октябре", "ноябре", "декабре",
];

export function parseMonth(m: string): { year: number; month: number } {
  const [y, mm] = m.split("-").map(Number);
  return { year: y, month: mm };
}

export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function addMonths(m: string, delta: number): string {
  const { year, month } = parseMonth(m);
  const idx = year * 12 + (month - 1) + delta;
  return toMonthKey(Math.floor(idx / 12), (idx % 12) + 1);
}

export function compareMonths(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** «Октябрь» */
export function monthName(m: string): string {
  return NOMINATIVE[parseMonth(m).month - 1];
}

/** «Октябрь 2026» */
export function monthTitle(m: string): string {
  const { year } = parseMonth(m);
  return `${monthName(m)} ${year}`;
}

/** «октября» — для «1–18 октября» */
export function monthGenitive(m: string): string {
  return GENITIVE[parseMonth(m).month - 1];
}

/** «сентябре» — для «В сентябре трат не было» */
export function monthPrepositional(m: string): string {
  return PREPOSITIONAL[parseMonth(m).month - 1];
}

/** «сентябрь» — для «за сентябрь» */
export function monthLower(m: string): string {
  return monthName(m).toLowerCase();
}

export function daysInMonth(m: string): number {
  const { year, month } = parseMonth(m);
  return new Date(year, month, 0).getDate();
}
