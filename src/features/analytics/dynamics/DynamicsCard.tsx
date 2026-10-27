import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useYearSummary, type Category } from "../api";
import { pushComparison, toggleMonthSelection, yearTotals } from "../lib/calc";
import { addMonths, monthName, parseMonth } from "../lib/months";
import { CardError, CardSkeleton } from "../shared/CardState";
import { SignedPill } from "../shared/SignedPill";
import { MonthComparison } from "./MonthComparison";
import { YearPill } from "./YearPill";

type Props = {
  years: number[];
  currentMonth: string;
  today: number;
  categories: Category[];
  byId: Map<number, Category>;
};

/** Блок 3 «Динамика доходов и расходов» — не зависит от переключателя месяца. */
export function DynamicsCard({ years, currentMonth, today, categories, byId }: Props) {
  const currentYear = parseMonth(currentMonth).year;
  const yearOptions = useMemo(() => (years.length ? years : [currentYear]), [years, currentYear]);
  const [year, setYear] = useState(yearOptions.includes(currentYear) ? currentYear : yearOptions[yearOptions.length - 1]);
  const q = useYearSummary(year);

  // По умолчанию сравниваются прошлый и текущий месяц, они же подсвечены.
  const prev = addMonths(currentMonth, -1);
  const [pair, setPair] = useState<[string, string]>([prev, currentMonth]);
  const [order, setOrder] = useState<[0 | 1, 0 | 1]>([0, 1]);
  const [selected, setSelected] = useState<string[]>([prev, currentMonth]);

  useEffect(() => {
    if (!yearOptions.includes(year)) setYear(yearOptions[yearOptions.length - 1]);
  }, [yearOptions, year]);

  function select(month: string) {
    const wasSelected = selected.includes(month);
    setSelected((s) => toggleMonthSelection(s, month));
    // Снятие выделения не меняет сравнение.
    if (!wasSelected) {
      const next = pushComparison(pair, order, month);
      setPair(next.pair);
      setOrder(next.order);
    }
  }

  function pick(index: 0 | 1, month: string) {
    const nextPair: [string, string] = [...pair] as [string, string];
    nextPair[index] = month;
    setPair(nextPair);
    setOrder(index === 0 ? [1, 0] : [0, 1]);
  }

  const title = (
    <h2 id="block3-title" className="text-lg font-bold">
      Динамика доходов и расходов
    </h2>
  );

  if (q.isError) return <CardError title={title} onRetry={() => void q.refetch()} />;
  if (!q.data) return <CardSkeleton height={420} />;

  const months = q.data.months;
  const t = yearTotals(months);

  return (
    <section className="surface-card p-5 sm:p-6" aria-labelledby="block3-title">
      {title}
      <div className="mt-3">
        <YearPill year={year} years={yearOptions} onChange={setYear} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 min-[960px]:grid-cols-4">
        <Tile label="Доход" value={formatMoney(t.income)} hint={t.avgIncome !== null ? `в среднем ${formatMoney(t.avgIncome)} в месяц` : undefined} />
        <Tile label="Расход" value={formatMoney(t.expense)} hint={t.avgExpense !== null ? `в среднем ${formatMoney(t.avgExpense)} в месяц` : undefined} />
        <Tile
          label="Итог"
          value={formatMoney(t.net, { sign: "always" })}
          valueClass={t.net >= 0 ? "text-income" : "text-over"}
          hint={t.net >= 0 ? "осталось от дохода" : "расходы больше дохода"}
        />
        <Tile label="Отложено" value={t.savedPercent !== null ? `${t.savedPercent}%` : "—"} hint="от дохода" />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[26rem] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs text-muted-foreground">
              <th className="py-2 pl-3 text-left font-normal">Месяц</th>
              <th className="py-2 text-right font-normal">Доход</th>
              <th className="py-2 text-right font-normal">Расход</th>
              <th className="py-2 pr-1 text-right font-normal">Итог</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => {
              const isSel = selected.includes(m.month);
              const onKey = (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  select(m.month);
                }
              };
              return (
                <tr
                  key={m.month}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  onClick={() => select(m.month)}
                  onKeyDown={onKey}
                  className={cn(
                    "cursor-pointer border-b border-border/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    isSel ? "bg-planned-soft" : "hover:bg-accent/60",
                  )}
                  style={isSel ? { boxShadow: "inset 3px 0 0 var(--bar-planned-border)" } : undefined}
                >
                  <td className="py-2.5 pl-3">
                    {monthName(m.month)}
                    {m.is_current && <span className="ml-1.5 text-xs text-muted-foreground">идёт</span>}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(m.income)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(m.expense)}</td>
                  <td className="py-2.5 pr-1 text-right">
                    <SignedPill value={m.income - m.expense} />
                  </td>
                </tr>
              );
            })}
            {t.avgIncome !== null && t.avgExpense !== null && t.avgNet !== null && (
              <tr className="bg-muted/50 font-bold">
                <td className="py-2.5 pl-3">В среднем за месяц</td>
                <td className="py-2.5 text-right tabular-nums">{formatMoney(t.avgIncome)}</td>
                <td className="py-2.5 text-right tabular-nums">{formatMoney(t.avgExpense)}</td>
                <td className="py-2.5 pr-1 text-right">
                  <SignedPill value={t.avgNet} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <MonthComparison pair={pair} onPick={pick} years={yearOptions} currentMonth={currentMonth} today={today} categories={categories} byId={byId} />
    </section>
  );
}

function Tile({ label, value, hint, valueClass }: { label: string; value: string; hint?: string; valueClass?: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted/50 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold tabular-nums", valueClass)}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
