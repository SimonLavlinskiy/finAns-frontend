import { ChevronLeft, ChevronRight } from "lucide-react";

/** Капсула `‹ 2026 ›` на тёмно-синем фоне; листает только годы с данными. */
export function YearPill({ year, years, onChange }: { year: number; years: number[]; onChange: (y: number) => void }) {
  const idx = years.indexOf(year);
  const prev = idx > 0 ? years[idx - 1] : null;
  const next = idx >= 0 && idx < years.length - 1 ? years[idx + 1] : null;
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-primary px-1 py-1 text-primary-foreground shadow-md">
      <button type="button" className={btn} disabled={prev === null} onClick={() => prev !== null && onChange(prev)} aria-label="Предыдущий год">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[3.5rem] text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {year}
      </span>
      <button type="button" className={btn} disabled={next === null} onClick={() => next !== null && onChange(next)} aria-label="Следующий год">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
