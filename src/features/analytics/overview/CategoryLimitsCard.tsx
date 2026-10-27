import { useMutation } from "@tanstack/react-query";
import { ChevronRight, Pencil, Plus } from "lucide-react";
import { Fragment, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { deleteCategoryLimit, upsertCategoryLimit } from "@/lib/api";
import { formatMoney, formatPercentOf } from "@/lib/format";
import type { MonthSummary, SpendingLimit } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Category } from "../api";
import { sortLimitRows, summarizeLimits, type LimitSortMode } from "../lib/calc";
import { monthPrepositional } from "../lib/months";
import { LimitFillBar } from "../shared/LimitFillBar";
import { Segmented } from "../shared/Segmented";
import { LimitEditorRow } from "./LimitEditorRow";
import { expenseCategoriesForMonth, type CategorySpend } from "./model";
import { SummaryTiles } from "./SummaryTiles";

type Row = CategorySpend & { categoryId: number; spent: number; limit: number | null };

type Props = {
  month: string;
  currentMonth: string;
  firstMonth: string | null;
  summary: MonthSummary;
  categories: Category[];
  byId: Map<number, Category>;
  limits: SpendingLimit[];
  expanded: Set<number>;
  onToggle: (id: number) => void;
};

/** Блок 2 «Расходы по категориям и лимиты». */
export function CategoryLimitsCard({ month, currentMonth, firstMonth, summary, categories, byId, limits, expanded, onToggle }: Props) {
  const { showToast } = useToast();
  const [sort, setSort] = useState<LimitSortMode>("fill");
  const [editing, setEditing] = useState<number | null>(null);

  const limitByCategory = new Map(limits.filter((l) => l.period_type === "month").map((l) => [l.category_id ?? l.tag_id, l.amount]));
  const rows: Row[] = expenseCategoriesForMonth(summary, categories, byId, month, true)
    // Удалённые без трат и категории вне месяца отфильтрованы в expenseCategoriesForMonth.
    .map((r) => ({ ...r, categoryId: r.category.id, spent: r.amount, limit: limitByCategory.get(r.category.id) ?? null }));
  const sorted = sortLimitRows(rows, sort);
  const limitsSummary = summarizeLimits(rows);
  const totalExpense = summary.expense;
  const top = rows.reduce<Row | null>((best, r) => (r.amount > 0 && (!best || r.amount > best.amount) ? r : best), null);

  const save = useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number | null; name: string }) => {
      if (amount === null || amount <= 0) await deleteCategoryLimit(id);
      else await upsertCategoryLimit(id, amount);
    },
    onSuccess: (_d, { amount, name }) => {
      setEditing(null);
      showToast(amount && amount > 0 ? `Лимит сохранён: ${name} — ${formatMoney(amount)}` : `Лимит убран: ${name}`);
    },
    onError: () => showToast("Не удалось сохранить лимит", "error"),
  });

  return (
    <section className="surface-card p-5 sm:p-6" aria-labelledby="block2-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="block2-title" className="text-lg font-bold">
          Расходы по категориям и лимиты
        </h2>
        <Segmented
          size="sm"
          ariaLabel="Сортировка"
          value={sort}
          onChange={setSort}
          options={[
            { value: "fill", label: "По заполнению лимита" },
            { value: "amount", label: "По сумме" },
          ]}
        />
      </div>

      <div className="mt-4">
        <SummaryTiles summary={limitsSummary} top={top} totalExpense={totalExpense} />
      </div>

      <div className="mt-5 min-w-0">
        <div className="hidden grid-cols-[minmax(10rem,1.3fr)_minmax(8rem,1.2fr)_7rem_7rem_7rem_2.25rem] gap-3 border-b border-border/60 pb-2 text-xs text-muted-foreground sm:grid">
          <span>Категория</span>
          <span>Заполнение лимита</span>
          <span className="text-right">Потрачено</span>
          <span className="text-right">Лимит</span>
          <span className="text-right">Остаток</span>
          <span />
        </div>
        <ul className="divide-y divide-border/60">
          {sorted.map((r) => {
            const isOpen = expanded.has(r.categoryId);
            return (
              <li key={r.categoryId} id={`limits-row-${r.categoryId}`} className="scroll-mt-24">
                <CategoryRow
                  row={r}
                  totalExpense={totalExpense}
                  open={isOpen}
                  onToggle={() => onToggle(r.categoryId)}
                  onEdit={() => setEditing(editing === r.categoryId ? null : r.categoryId)}
                />
                {editing === r.categoryId && (
                  <div className="pb-3">
                    <LimitEditorRow
                      categoryId={r.categoryId}
                      categoryName={r.category.name}
                      currentLimit={r.limit}
                      currentMonth={currentMonth}
                      firstMonth={firstMonth}
                      saving={save.isPending}
                      onSave={(amount) => save.mutate({ id: r.categoryId, amount, name: r.category.name })}
                      onRemove={() => save.mutate({ id: r.categoryId, amount: null, name: r.category.name })}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                )}
                {isOpen && <Subcategories row={r} month={month} />}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function CategoryRow({
  row,
  totalExpense,
  open,
  onToggle,
  onEdit,
}: {
  row: Row;
  totalExpense: number;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { category, spent, limit } = row;
  const remainder = limit !== null ? limit - spent : null;
  const name = (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex min-w-0 items-center gap-2 rounded-lg text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
      <span className="truncate whitespace-nowrap">{category.name}</span>
    </button>
  );
  const fill =
    limit !== null ? (
      <LimitFillBar spent={spent} limit={limit} color={category.color} />
    ) : (
      <span className="truncate text-xs text-muted-foreground">
        {spent > 0 ? `лимит не задан · ${formatPercentOf(spent, totalExpense)} всех расходов` : "лимит не задан"}
      </span>
    );
  const spentCell = <span className={cn("tabular-nums", spent === 0 && "text-muted-foreground")}>{formatMoney(spent)}</span>;
  const remainderCell =
    remainder === null ? (
      <span className="text-muted-foreground">—</span>
    ) : (
      <span className={cn("tabular-nums", remainder < 0 && "font-semibold text-over")}>{formatMoney(remainder)}</span>
    );
  const editBtn = (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Редактировать лимит «${category.name}»`}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
  const limitCell =
    limit !== null ? (
      <span className="tabular-nums">{formatMoney(limit)}</span>
    ) : (
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="h-3 w-3" /> Лимит
      </button>
    );

  return (
    <>
      {/* ≥ 640 px: строка таблицы */}
      <div className="hidden grid-cols-[minmax(10rem,1.3fr)_minmax(8rem,1.2fr)_7rem_7rem_7rem_2.25rem] items-center gap-3 py-2.5 text-sm sm:grid">
        {name}
        <div className="min-w-0">{fill}</div>
        <div className="text-right">{spentCell}</div>
        <div className="text-right">{limitCell}</div>
        <div className="text-right">{remainderCell}</div>
        {editBtn}
      </div>
      {/* < 640 px: название · остаток · карандаш / полоса / потрачено и «из лимита» */}
      <div className="space-y-2 py-3 text-sm sm:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{name}</div>
          {remainderCell}
          {editBtn}
        </div>
        <div>{fill}</div>
        <div className="flex items-center justify-between text-xs">
          {spentCell}
          {limit !== null ? <span className="text-muted-foreground">из {formatMoney(limit)}</span> : limitCell}
        </div>
      </div>
    </>
  );
}

function Subcategories({ row, month }: { row: Row; month: string }) {
  if (row.amount <= 0 || row.subcategories.length === 0) {
    return <p className="pb-3 pl-8 text-sm text-muted-foreground">В {monthPrepositional(month)} трат не было</p>;
  }
  return (
    <ul className="space-y-1.5 pb-3 pl-8">
      {row.subcategories.map((s) => {
        const name = s.subcategory_id === null ? "Без подкатегории" : row.category.subcategories.get(s.subcategory_id) ?? "Подкатегория";
        const share = (s.amount / row.amount) * 100;
        return (
          <Fragment key={s.subcategory_id ?? "none"}>
            <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(8rem,1fr)_minmax(4rem,1fr)_7rem_6rem]">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{name}</span>
                {s.all_mandatory && (
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">обяз.</span>
                )}
              </span>
              <span className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-muted sm:order-none sm:col-span-1">
                <span className="block h-full rounded-full" style={{ width: `${share}%`, backgroundColor: row.category.color }} />
              </span>
              <span className="text-right tabular-nums">{formatMoney(s.amount)}</span>
              <span className="hidden text-right text-xs text-muted-foreground sm:block">{Math.round(share)}% категории</span>
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
}
