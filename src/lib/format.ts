export function formatKopecks(kopecks: number): string {
  const rub = kopecks / 100;
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rub);
}

export function formatRubles(kopecks: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(kopecks / 100));
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

export function rublesToKopecks(rubles: number): number {
  return Math.round(rubles * 100);
}

export function parseRublesInput(value: string): number {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return rublesToKopecks(num);
}
