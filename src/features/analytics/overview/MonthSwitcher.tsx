import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { addMonths, compareMonths, monthTitle } from "../lib/months";

/** `‹ Октябрь 2026 ›` — от первого месяца с операциями до текущего, края неактивны. */
export function MonthSwitcher({
  month,
  min,
  max,
  onChange,
}: {
  month: string;
  min: string;
  max: string;
  onChange: (m: string) => void;
}) {
  const canPrev = compareMonths(month, min) > 0;
  const canNext = compareMonths(month, max) < 0;
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-card px-1 py-1 soft-shadow">
      <button type="button" className={btn} disabled={!canPrev} onClick={() => onChange(addMonths(month, -1))} aria-label="Предыдущий месяц">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className={cn("min-w-[8.5rem] text-center text-sm font-semibold tabular-nums")} aria-live="polite">
        {monthTitle(month)}
      </span>
      <button type="button" className={btn} disabled={!canNext} onClick={() => onChange(addMonths(month, 1))} aria-label="Следующий месяц">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
