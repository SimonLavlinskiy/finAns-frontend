import { formatRubles } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MoodDay } from "@/lib/types";

type Props = {
  days: MoodDay[];
};

// Совпадает с --income/--expense в src/index.css (h, s%, l%) — конечные точки
// интерполяции цвета дня по доле impulse-трат.
const INCOME_HSL: [number, number, number] = [152, 55, 42];
const EXPENSE_HSL: [number, number, number] = [0, 72, 58];

export function moodColor(share: number): string {
  const [h1, s1, l1] = INCOME_HSL;
  const [h2, s2, l2] = EXPENSE_HSL;
  const h = h1 + (h2 - h1) * share;
  const s = s1 + (s2 - s1) * share;
  const l = l1 + (l2 - l1) * share;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function SpendingMoodCalendar({ days }: Props) {
  return (
    <div className="surface-card p-5 space-y-3">
      <p className="text-sm text-muted-foreground">
        Календарь по «настроению» трат — зелёный: по необходимости, красный: по желанию
      </p>
      <div className="flex flex-wrap gap-1.5">
        {days.map((d) => (
          <div
            key={d.day}
            title={
              d.share !== null
                ? `${d.day}: ${formatRubles(d.total_expense)} ₽, ${Math.round(d.share * 100)}% по желанию`
                : `${d.day}: нет расходов`
            }
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-medium",
              d.share === null && "bg-muted text-muted-foreground",
            )}
            style={d.share !== null ? { backgroundColor: moodColor(d.share), color: "white" } : undefined}
          >
            {d.day}
          </div>
        ))}
      </div>
    </div>
  );
}
