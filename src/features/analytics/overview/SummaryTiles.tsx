import { formatMoney, formatPercentOf } from "@/lib/format";
import { plural } from "@/lib/plural";
import { cn } from "@/lib/utils";
import type { LimitsSummary } from "../lib/calc";
import { LimitFillBar } from "../shared/LimitFillBar";
import type { CategorySpend } from "./model";

const CATEGORY_FORMS: [string, string, string] = ["категория", "категории", "категорий"];
const CATEGORY_ACC_FORMS: [string, string, string] = ["категорию", "категории", "категорий"];

/** Четыре сводные плашки блока 2 (до 960 px — по две в ряд). */
export function SummaryTiles({
  summary,
  top,
  totalExpense,
}: {
  summary: LimitsSummary;
  top: CategorySpend | null;
  totalExpense: number;
}) {
  const tile = "rounded-2xl bg-muted/50 px-4 py-3 min-w-0";
  const hasOver = summary.overCount > 0;
  return (
    <div className="grid grid-cols-2 gap-3 min-[960px]:grid-cols-4">
      <div className={tile}>
        <p className="text-xs text-muted-foreground">Лимиты на месяц</p>
        <p className="text-lg font-bold tabular-nums">{formatMoney(summary.limitsTotal)}</p>
        <p className="text-xs text-muted-foreground">
          на {summary.limitedCount} {plural(summary.limitedCount, CATEGORY_ACC_FORMS)}
        </p>
      </div>
      <div className={tile}>
        <p className="text-xs text-muted-foreground">Потрачено из лимитов</p>
        <p className="text-lg font-bold tabular-nums">{formatMoney(summary.spentInLimits)}</p>
        {summary.limitsTotal > 0 && (
          <LimitFillBar spent={summary.spentInLimits} limit={summary.limitsTotal} color="hsl(var(--primary))" className="mt-1.5 h-1.5" />
        )}
        <p className="mt-1 text-xs text-muted-foreground">{formatPercentOf(summary.spentInLimits, summary.limitsTotal)} от всех лимитов</p>
      </div>
      <div className={tile}>
        <p className="text-xs text-muted-foreground">Больше всего потрачено</p>
        {top ? (
          <>
            <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: top.category.color }} />
              <span className="truncate">{top.category.name}</span>
            </p>
            <p className="text-lg font-bold leading-tight tabular-nums">{formatMoney(top.amount)}</p>
            <p className="text-xs text-muted-foreground">{formatPercentOf(top.amount, totalExpense)} всех расходов</p>
          </>
        ) : (
          <p className="text-lg font-bold">—</p>
        )}
      </div>
      <div className={cn(tile, hasOver ? "bg-over-soft" : "bg-income-soft")}>
        {hasOver ? (
          <>
            <p className="text-xs text-over">Лимит превышен</p>
            <p className="text-lg font-bold text-over">
              {summary.overCount} {plural(summary.overCount, CATEGORY_FORMS)}
            </p>
            <p className="text-xs text-muted-foreground">сверх лимитов {formatMoney(summary.overSum)}</p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold text-income">Превышений нет</p>
            <p className="text-xs text-muted-foreground">Все категории в пределах лимитов</p>
          </>
        )}
      </div>
    </div>
  );
}
