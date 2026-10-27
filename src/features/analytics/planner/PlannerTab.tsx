import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatMoney, formatPercentOf } from "@/lib/format";
import { plural } from "@/lib/plural";
import { cn } from "@/lib/utils";
import { useMandatoryPayments, useSpendingLimits, type Category } from "../api";
import { computePlanner } from "../lib/calc";
import { daysInMonth, toMonthKey } from "../lib/months";
import { isDueInMonth, nextMonthOf } from "../lib/recurrence";
import { AmountInput } from "../shared/AmountInput";
import { BudgetBar } from "../shared/BudgetBar";
import { CardError, CardSkeleton } from "../shared/CardState";
import { DEFAULT_PLANNER, usePlannerState } from "./usePlannerState";

type Props = { currentMonth: string; categories: Category[] };

/** Вкладка «Планирование» — песочница бюджета следующего месяца. */
export function PlannerTab({ currentMonth, categories }: Props) {
  const { showToast } = useToast();
  const { query, state, update } = usePlannerState();
  const paymentsQ = useMandatoryPayments();
  const limitsQ = useSpendingLimits();

  const next = nextMonthOf(currentMonth);
  const defaultDays = daysInMonth(toMonthKey(next.year, next.month));
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const expenseCats = categories.filter((c) => c.kind === "expense" && !c.deleted_at);

  // Платежи следующего месяца; цвет и «Минимум» — по категории верхнего уровня.
  const payments = (paymentsQ.data ?? [])
    .filter((p) => isDueInMonth(p.next_payment_date, p.recurrence, next.year, next.month))
    .map((p) => {
      const categoryId = p.tag.parent?.id ?? p.tag.id;
      const override = state?.payment_overrides[String(p.id)];
      return {
        id: p.id,
        title: p.title,
        categoryId,
        color: byId.get(categoryId)?.color ?? p.tag.parent?.color ?? p.tag.color,
        amount: override ?? p.amount,
      };
    });

  const plans: Record<number, number | undefined> = {};
  for (const [k, v] of Object.entries(state?.plans ?? {})) plans[Number(k)] = v;
  const days = state?.days ?? defaultDays;
  const result = computePlanner({
    incomes: (state?.incomes ?? []).map((i) => i.amount),
    payments,
    categories: expenseCats,
    plans,
    days,
  });

  // «Минимум» вырос выше «Плана» — план поднимается автоматически.
  const minKey = JSON.stringify(result.minByCategory);
  useEffect(() => {
    if (!state) return;
    const raise = Object.entries(state.plans).filter(([id, v]) => v < (result.minByCategory[Number(id)] ?? 0));
    if (raise.length === 0) return;
    update((s) => {
      const plansNext = { ...s.plans };
      for (const [id] of raise) plansNext[id] = result.minByCategory[Number(id)];
      return { ...s, plans: plansNext };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minKey]);

  if (query.isError) return <CardError onRetry={() => void query.refetch()} />;
  if (!state || paymentsQ.isLoading) {
    return (
      <div className="grid gap-5 min-[960px]:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <CardSkeleton height={520} />
        <CardSkeleton height={420} />
      </div>
    );
  }

  const limitByCategory = new Map((limitsQ.data ?? []).filter((l) => l.period_type === "month").map((l) => [l.category_id ?? l.tag_id, l.amount]));

  function applyLimits() {
    update((s) => {
      const plansNext = { ...s.plans };
      for (const c of expenseCats) {
        const limit = limitByCategory.get(c.id);
        if (limit !== undefined) plansNext[String(c.id)] = Math.max(limit, result.minByCategory[c.id] ?? 0);
      }
      return { ...s, plans: plansNext };
    });
    showToast("Подставлены текущие лимиты");
  }

  return (
    <div className="grid items-start gap-5 min-[960px]:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <div className="order-2 space-y-5 min-[960px]:order-1">
        {/* 7.1 Планируемый доход */}
        <section className="surface-card p-5 sm:p-6" aria-labelledby="pl-income">
          <h2 id="pl-income" className="text-lg font-bold">
            Планируемый доход
          </h2>
          <div className="mt-4 space-y-2">
            {state.incomes.map((inc, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Источник"
                  aria-label="Источник"
                  value={inc.name}
                  className="h-10 min-w-0 flex-1"
                  onChange={(e) =>
                    update((s) => ({ ...s, incomes: s.incomes.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }))
                  }
                />
                <AmountInput
                  placeholder="Сумма"
                  aria-label="Сумма"
                  value={inc.amount}
                  className="h-10 w-32 shrink-0 sm:w-40"
                  onValueChange={(v) =>
                    update((s) => ({ ...s, incomes: s.incomes.map((x, j) => (j === i ? { ...x, amount: v } : x)) }))
                  }
                />
                <button
                  type="button"
                  aria-label="Удалить доход"
                  onClick={() =>
                    update((s) => {
                      const incomes = s.incomes.filter((_, j) => j !== i);
                      return { ...s, incomes: incomes.length ? incomes : DEFAULT_PLANNER.incomes };
                    })
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 rounded-full"
            onClick={() => update((s) => ({ ...s, incomes: [...s.incomes, { name: "", amount: null }] }))}
          >
            <Plus className="mr-1 h-4 w-4" /> Добавить доход
          </Button>
        </section>

        {/* 7.2 Регулярные платежи */}
        <section className="surface-card p-5 sm:p-6" aria-labelledby="pl-payments">
          <h2 id="pl-payments" className="text-lg font-bold">
            Регулярные платежи
          </h2>
          {payments.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Регулярных платежей пока нет.{" "}
              <Link to="/mandatory-payments" className="text-foreground underline underline-offset-2">
                Регулярные платежи
              </Link>
            </p>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-border/60">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: p.color }} />
                    <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
                    <AmountInput
                      aria-label={`Сумма «${p.title}»`}
                      value={p.amount}
                      className="h-9 w-32 shrink-0"
                      onValueChange={(v) =>
                        update((s) => ({ ...s, payment_overrides: { ...s.payment_overrides, [String(p.id)]: v ?? 0 } }))
                      }
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t border-border/60 pt-3 text-sm font-bold">
                <span>Итого регулярных</span>
                <span className="tabular-nums">{formatMoney(result.regular)}</span>
              </div>
            </>
          )}
        </section>

        {/* 7.3 Плановые расходы по категориям */}
        <section className="surface-card p-5 sm:p-6" aria-labelledby="pl-plans">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="pl-plans" className="text-lg font-bold">
              Плановые расходы по категориям
            </h2>
            <Button variant="outline" size="sm" className="rounded-full" onClick={applyLimits}>
              Подставить лимиты
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_6.5rem_8.5rem] gap-3 border-b border-border/60 pb-2 text-xs text-muted-foreground">
            <span>Категория</span>
            <span className="text-right">Минимум</span>
            <span className="text-right">План</span>
          </div>
          <ul className="divide-y divide-border/60">
            {expenseCats.map((c) => (
              <PlanRow
                key={c.id}
                category={c}
                min={result.minByCategory[c.id] ?? 0}
                plan={state.plans[String(c.id)]}
                onChange={(v) =>
                  update((s) => {
                    const plansNext = { ...s.plans };
                    if (v === null) delete plansNext[String(c.id)];
                    else plansNext[String(c.id)] = v;
                    return { ...s, plans: plansNext };
                  })
                }
                onRaised={(min) => showToast(`План не может быть меньше минимума: ${formatMoney(min)}`)}
              />
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-border/60 pt-3 text-sm font-bold">
            <span>Итого по плану</span>
            <span className="tabular-nums">{formatMoney(result.expense)}</span>
          </div>
        </section>

        <Button
          variant="ghost"
          className="rounded-full text-muted-foreground"
          onClick={() => update(() => ({ ...DEFAULT_PLANNER, incomes: [{ name: "", amount: null }] }))}
        >
          Сбросить планирование
        </Button>
      </div>

      {/* 7.4 Что останется */}
      <div className="order-1 min-[960px]:sticky min-[960px]:top-6 min-[960px]:order-2">
        <Leftover
          result={result}
          days={days}
          onDaysChange={(d) => update((s) => ({ ...s, days: d }))}
          categories={expenseCats}
        />
      </div>
    </div>
  );
}

function PlanRow({
  category,
  min,
  plan,
  onChange,
  onRaised,
}: {
  category: Category;
  min: number;
  plan: number | undefined;
  onChange: (v: number | null) => void;
  onRaised: (min: number) => void;
}) {
  // По умолчанию «План» = «Минимум» (если он > 0), иначе пусто.
  const shown = plan !== undefined ? Math.max(plan, min) : min > 0 ? min : null;
  const [draft, setDraft] = useState<number | null | undefined>(undefined);
  const value = draft !== undefined ? draft : shown;
  const tooLow = draft !== undefined && draft !== null && draft < min;

  function commit() {
    if (draft === undefined) return;
    if (draft !== null && draft < min) {
      onChange(min);
      onRaised(min);
    } else {
      onChange(draft);
    }
    setDraft(undefined);
  }

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_6.5rem_8.5rem] items-center gap-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: category.color }} />
        <span className="truncate">{category.name}</span>
      </span>
      <span className={cn("text-right tabular-nums", min === 0 && "text-muted-foreground")}>{min > 0 ? formatMoney(min) : "—"}</span>
      <AmountInput
        aria-label={`План «${category.name}»`}
        value={value}
        invalid={tooLow}
        className="h-9"
        onValueChange={(v) => setDraft(v)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
      />
    </li>
  );
}

function Leftover({
  result,
  days,
  onDaysChange,
  categories,
}: {
  result: ReturnType<typeof computePlanner>;
  days: number;
  onDaysChange: (d: number | null) => void;
  categories: Category[];
}) {
  const enough = result.free >= 0;
  const segments = categories
    .map((c) => ({ id: c.id, label: c.name, color: c.color, amount: result.effectiveByCategory[c.id] ?? 0 }))
    .filter((s) => s.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const [daysText, setDaysText] = useState(String(days));
  useEffect(() => setDaysText(String(days)), [days]);

  return (
    <section className="surface-card p-5 sm:p-6" aria-labelledby="pl-left">
      <h2 id="pl-left" className="text-lg font-bold">
        Что останется
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">{enough ? "Свободно после всех трат" : "Не хватает"}</p>
      <p className={cn("text-3xl font-bold tabular-nums", enough ? "text-income" : "text-over")}>{formatMoney(result.free)}</p>

      <label className="mt-3 flex items-center gap-2 text-sm">
        В месяце
        <Input
          inputMode="numeric"
          aria-label="Дней в месяце"
          className="h-8 w-14 px-2 text-center"
          value={daysText}
          onChange={(e) => {
            setDaysText(e.target.value);
            const n = Number(e.target.value);
            if (Number.isInteger(n) && n >= 1 && n <= 31) onDaysChange(n);
          }}
          onBlur={() => setDaysText(String(days))}
        />
        дн.
      </label>
      <p className="mt-2 text-sm">
        {result.perDay !== null
          ? `≈ ${formatMoney(result.perDay)} в день на незапланированное`
          : "Уменьшите расходы или добавьте доход"}
      </p>

      <BudgetBar income={result.income} categories={segments} className="mt-4" />
      {result.expense === result.income && result.income > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">Расходы равны доходу: свободных денег не останется.</p>
      )}

      <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
        {segments.map((s) => (
          <li key={s.id} className="flex min-w-0 items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: s.color }} />
            <span className="truncate">{s.label}</span>
            <span className="ml-auto shrink-0 tabular-nums">{formatMoney(s.amount)}</span>
            <span className="w-9 shrink-0 text-right text-muted-foreground">{formatPercentOf(s.amount, result.income)}</span>
          </li>
        ))}
        {result.free !== 0 && (
          <li className="flex min-w-0 items-center gap-1.5 font-semibold">
            <span
              className={cn("h-2 w-2 shrink-0 rounded-[2px]", enough ? "border border-border bg-card" : "bg-[var(--over)]")}
            />
            <span>{enough ? "Свободно" : "Перерасход"}</span>
            <span className="ml-auto shrink-0 tabular-nums">{formatMoney(Math.abs(result.free))}</span>
            <span className="w-9 shrink-0 text-right text-muted-foreground">{formatPercentOf(Math.abs(result.free), result.income)}</span>
          </li>
        )}
      </ul>

      <dl className="mt-5 space-y-2 border-t border-border/60 pt-4 text-sm">
        <div className="flex justify-between">
          <dt>Доход</dt>
          <dd className="tabular-nums">{formatMoney(result.income)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Расход</dt>
          <dd className="tabular-nums">{formatMoney(-result.expense)}</dd>
        </div>
        <div className="ml-1 space-y-1 border-l border-border pl-3 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <dt>Регулярные платежи</dt>
            <dd className="tabular-nums">{formatMoney(result.regular)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Плановые расходы</dt>
            <dd className="tabular-nums">{formatMoney(result.planned)}</dd>
          </div>
        </div>
        <div className={cn("flex justify-between font-bold", enough ? "text-income" : "text-over")}>
          <dt>{enough ? "Свободно" : "Не хватает"}</dt>
          <dd className="tabular-nums">{formatMoney(result.free, { sign: "always" })}</dd>
        </div>
      </dl>
      <span className="sr-only">
        {days} {plural(days, ["день", "дня", "дней"])}
      </span>
    </section>
  );
}
