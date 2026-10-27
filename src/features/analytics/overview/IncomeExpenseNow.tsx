import { formatMoney, formatPercentOf } from "@/lib/format";
import type { MonthSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Category } from "../api";
import { spendPerDay } from "../lib/calc";
import { monthLower } from "../lib/months";
import { BudgetBar } from "../shared/BudgetBar";
import { expenseCategoriesForMonth } from "./model";

type Props = {
  month: string;
  summary: MonthSummary;
  categories: Category[];
  byId: Map<number, Category>;
  onCategoryClick: (id: number) => void;
};

/** Блок 1 «Доходы и расходы сейчас». */
export function IncomeExpenseNow({ month, summary, categories, byId, onCategoryClick }: Props) {
  const I = summary.income;
  const E = summary.expense;
  const rows = expenseCategoriesForMonth(summary, categories, byId, month, false).sort((a, b) => b.amount - a.amount);
  const isEmpty = I === 0 && E === 0 && rows.length === 0;
  const title = summary.is_current ? "Доходы и расходы сейчас" : `Доходы и расходы за ${monthLower(month)}`;

  return (
    <section className="surface-card p-5 sm:p-6" aria-labelledby="block1-title">
      <h2 id="block1-title" className="text-lg font-bold">
        {title}
      </h2>

      <div className="mt-4">
        <BudgetBar
          income={I}
          categories={rows.map((r) => ({ id: r.category.id, label: r.category.name, color: r.category.color, amount: r.amount }))}
          onCategoryClick={onCategoryClick}
        />
        {isEmpty && <p className="mt-3 text-sm text-muted-foreground">В этом месяце пока нет операций</p>}
      </div>

      <div className="mt-5 grid gap-7 min-[960px]:grid-cols-[minmax(0,1fr)_270px]">
        <div className="order-2 min-w-0 min-[960px]:order-1">
          <CategoryList rows={rows} income={I} expense={E} onCategoryClick={onCategoryClick} />
        </div>
        <div className="order-1 min-[960px]:order-2">
          <Figures summary={summary} />
        </div>
      </div>
    </section>
  );
}

function CategoryList({
  rows,
  income,
  expense,
  onCategoryClick,
}: {
  rows: ReturnType<typeof expenseCategoriesForMonth>;
  income: number;
  expense: number;
  onCategoryClick: (id: number) => void;
}) {
  const grid = "grid grid-cols-[minmax(0,1fr)_auto_3.5rem] items-center gap-3";
  return (
    <div>
      <div className={cn(grid, "pb-2 text-xs text-muted-foreground")}>
        <span>Категория</span>
        <span className="text-right">Сумма</span>
        <span className="text-right">% дохода</span>
      </div>
      <ul className="divide-y divide-border/60 border-t border-border/60">
        {rows.map((r) => (
          <li key={r.category.id}>
            <button
              type="button"
              onClick={() => onCategoryClick(r.category.id)}
              className={cn(grid, "w-full py-2.5 text-left text-sm hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring")}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: r.category.color }} />
                <span className="truncate">{r.category.name}</span>
              </span>
              <span className="text-right tabular-nums">{formatMoney(r.amount)}</span>
              <span className="text-right tabular-nums text-muted-foreground">{formatPercentOf(r.amount, income)}</span>
            </button>
          </li>
        ))}
        {expense < income && (
          <li className={cn(grid, "py-2.5 text-sm font-bold")}>
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] border border-border bg-card" />
              Свободно
            </span>
            <span className="text-right tabular-nums">{formatMoney(income - expense)}</span>
            <span className="text-right tabular-nums">{formatPercentOf(income - expense, income)}</span>
          </li>
        )}
        {expense > income && (
          <li className={cn(grid, "py-2.5 text-sm font-bold")}>
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] bg-[var(--over)]" />
              Перерасход
            </span>
            <span className="text-right tabular-nums text-over">{formatMoney(expense - income)}</span>
            <span className="text-right tabular-nums">{formatPercentOf(expense - income, income)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

function Figures({ summary }: { summary: MonthSummary }) {
  const I = summary.income;
  const E = summary.expense;
  const perDay = summary.is_current && summary.today !== null ? spendPerDay(I, E, summary.today, summary.days_in_month) : null;
  const row = "px-4 py-3";
  return (
    <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-muted/50">
      <div className={row}>
        <p className="text-xs text-muted-foreground">Доход</p>
        <p className="text-xl font-bold tabular-nums">{formatMoney(I)}</p>
      </div>
      <div className={row}>
        <p className="text-xs text-muted-foreground">Расход</p>
        <p className="text-xl font-bold tabular-nums">{formatMoney(E)}</p>
        <p className="text-xs text-muted-foreground">{formatPercentOf(E, I)} дохода</p>
      </div>
      {E > I ? (
        <div className={row}>
          <p className="text-xs text-muted-foreground">Перерасход</p>
          <p className="text-xl font-bold tabular-nums text-over">{formatMoney(E - I)}</p>
          <p className="text-xs text-muted-foreground">{formatPercentOf(E - I, I)} сверх дохода</p>
        </div>
      ) : (
        <div className={row}>
          <p className="text-xs text-muted-foreground">Свободно</p>
          <p className="text-xl font-bold tabular-nums">{formatMoney(I - E)}</p>
          <p className="text-xs text-muted-foreground">{formatPercentOf(I - E, I)} дохода</p>
        </div>
      )}
      {perDay !== null && (
        <div className={cn(row, perDay > 0 ? "bg-income-soft" : "bg-over-soft")}>
          <p className="text-xs text-muted-foreground">Можно тратить в день</p>
          <p className={cn("text-xl font-bold tabular-nums", perDay > 0 ? "text-income" : "text-over")}>
            {formatMoney(perDay > 0 ? perDay : 0)}
          </p>
        </div>
      )}
    </div>
  );
}
