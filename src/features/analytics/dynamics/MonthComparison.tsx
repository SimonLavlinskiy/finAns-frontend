import { useQueryClient } from "@tanstack/react-query";
import { fetchYearSummary } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { MonthSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { analyticsKeys, useMonthSummary, useYearSummary, type Category } from "../api";
import { expenseCategoriesForMonth } from "../overview/model";
import { monthGenitive, monthLower, monthName, monthTitle, parseMonth, toMonthKey } from "../lib/months";
import { Dropdown } from "../shared/Dropdown";
import { SignedPill } from "../shared/SignedPill";

type Props = {
  pair: [string, string];
  onPick: (index: 0 | 1, month: string) => void;
  years: number[];
  currentMonth: string;
  today: number;
  categories: Category[];
  byId: Map<number, Category>;
};

/** «Сравнение месяцев»: два блока [Год][Месяц] и таблица разницы (второй − первый). */
export function MonthComparison({ pair, onPick, years, currentMonth, today, categories, byId }: Props) {
  const a = useMonthSummary(pair[0]);
  const b = useMonthSummary(pair[1]);
  const hasCurrent = pair.includes(currentMonth);

  return (
    <div className="mt-8 border-t border-border/70 pt-6">
      <h3 className="text-base font-bold">Сравнение месяцев</h3>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <MonthPicker month={pair[0]} years={years} onChange={(m) => onPick(0, m)} label="Первый месяц" />
        <span className="text-sm text-muted-foreground">и</span>
        <MonthPicker month={pair[1]} years={years} onChange={(m) => onPick(1, m)} label="Второй месяц" />
      </div>

      {a.isError || b.isError ? (
        <p className="mt-4 text-sm text-muted-foreground">Не удалось загрузить данные</p>
      ) : a.data && b.data ? (
        <>
          <ComparisonTable a={a.data} b={b.data} currentMonth={currentMonth} categories={categories} byId={byId} />
          {hasCurrent && (
            <p className="mt-3 text-xs text-muted-foreground">
              * {monthLower(currentMonth)} ещё идёт: данные за 1–{today} {monthGenitive(currentMonth)}.
            </p>
          )}
        </>
      ) : (
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-muted" />
      )}
    </div>
  );
}

function MonthPicker({ month, years, onChange, label }: { month: string; years: number[]; onChange: (m: string) => void; label: string }) {
  const qc = useQueryClient();
  const { year, month: m } = parseMonth(month);
  const yearData = useYearSummary(year);

  async function changeYear(y: number) {
    const data = await qc.fetchQuery({
      queryKey: analyticsKeys.year(y),
      queryFn: async () => (await fetchYearSummary(y)).data,
    });
    const months = data.months.map((x) => x.month);
    const same = toMonthKey(y, m);
    // Месяц сохраняется, если он есть в новом году, иначе — последний доступный.
    onChange(months.includes(same) || months.length === 0 ? same : months[months.length - 1]);
  }
  const available = (yearData.data?.months ?? []).map((x) => x.month);
  const monthOptions = (available.length ? available : [month]).map((x) => ({ value: x, label: monthName(x) }));

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-muted/70 p-2" role="group" aria-label={label}>
      <Dropdown
        ariaLabel="Год"
        value={year}
        options={years.map((y) => ({ value: y, label: String(y) }))}
        onChange={(y) => void changeYear(y)}
        className="min-w-[5.5rem]"
      />
      <Dropdown ariaLabel="Месяц" value={month} options={monthOptions} onChange={onChange} className="min-w-[8.5rem]" />
    </div>
  );
}

function ComparisonTable({
  a,
  b,
  currentMonth,
  categories,
  byId,
}: {
  a: MonthSummary;
  b: MonthSummary;
  currentMonth: string;
  categories: Category[];
  byId: Map<number, Category>;
}) {
  const catsA = new Map(expenseCategoriesForMonth(a, categories, byId, a.month, false).map((r) => [r.category.id, r]));
  const catsB = new Map(expenseCategoriesForMonth(b, categories, byId, b.month, false).map((r) => [r.category.id, r]));
  const ids = new Set([...catsA.keys(), ...catsB.keys()]);
  const catRows = [...ids]
    .map((id) => {
      const cat = catsA.get(id)?.category ?? catsB.get(id)!.category;
      const va = catsA.get(id)?.amount ?? 0;
      const vb = catsB.get(id)?.amount ?? 0;
      return { cat, va, vb, diff: vb - va };
    })
    .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));

  const head = (s: MonthSummary) => `${monthTitle(s.month)}${s.month === currentMonth ? "*" : ""}`;
  const grid = "grid grid-cols-[minmax(8rem,1.4fr)_minmax(6rem,1fr)_minmax(6rem,1fr)_minmax(7rem,1fr)] items-center gap-3";

  const line = (label: React.ReactNode, va: number, vb: number, higherIsBetter: boolean, bold = false, key?: string) => (
    <div key={key} className={cn(grid, "py-2 text-sm", bold && "font-bold")}>
      <span className="flex min-w-0 items-center gap-2">{label}</span>
      <span className="text-right tabular-nums">{formatMoney(va)}</span>
      <span className="text-right tabular-nums">{formatMoney(vb)}</span>
      <span className="text-right">
        <SignedPill value={vb - va} higherIsBetter={higherIsBetter} />
      </span>
    </div>
  );

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[34rem]">
        <div className={cn(grid, "border-b border-border/60 pb-2 text-xs text-muted-foreground")}>
          <span>Показатель</span>
          <span className="text-right">{head(a)}</span>
          <span className="text-right">{head(b)}</span>
          <span className="text-right">Разница</span>
        </div>
        {line("Доход", a.income, b.income, true)}
        {line("Расход", a.expense, b.expense, false)}
        <div className="border-b border-border">{line("Итог", a.income - a.expense, b.income - b.expense, true, true)}</div>
        {catRows.map((r) =>
          line(
            <>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: r.cat.color }} />
              <span className="truncate">{r.cat.name}</span>
            </>,
            r.va,
            r.vb,
            false,
            false,
            String(r.cat.id),
          ),
        )}
      </div>
    </div>
  );
}
