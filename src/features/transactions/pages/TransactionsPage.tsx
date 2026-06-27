import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  Link2,
  MoreHorizontal,
  Paperclip,
  Plus,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { TagFilterPicker } from "@/components/TagFilterPicker";
import { TagPills } from "@/components/TagPills";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionFormSheet } from "@/features/transactions/components/TransactionFormSheet";
import { BalanceHero } from "@/features/balance/components/BalanceHero";
import { ExpensesCalendar } from "@/features/analytics/components/ExpensesCalendar";
import {
  deleteTransaction,
  duplicateTransaction,
  fetchTags,
  fetchTransactions,
} from "@/lib/api";
import { formatDate, formatKopecks, relativeDateLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? "",
  );
  const qc = useQueryClient();

  const page = Number(searchParams.get("page") ?? 1);
  const perPage = Number(searchParams.get("per_page") ?? 10);
  const category = searchParams.get("category") ?? "";
  const specificity = searchParams.get("specificity") ?? "";
  const tagIds = searchParams.get("tag_ids") ?? "";
  const dateFrom = searchParams.get("date_from") ?? "";
  const dateTo = searchParams.get("date_to") ?? "";

  const filters = {
    search: searchParams.get("search") ?? undefined,
    category: category || undefined,
    specificity: specificity || undefined,
    tag_ids: tagIds || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    per_page: perPage,
    sort_by: searchParams.get("sort_by") ?? "date",
    sort_order: searchParams.get("sort_order") ?? "desc",
  };

  const { data: tagsDataRaw } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await fetchTags()).data,
  });
  const tagsData = tagsDataRaw ?? [];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactions(filters),
  });

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.set("page", "1");
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const setPage = useCallback(
    (p: number) => {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(p));
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const removeMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const dupMutation = useMutation({
    mutationFn: duplicateTransaction,
    onSuccess: (res) => {
      setEditing(res.data);
      setSheetOpen(true);
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Наименование",
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left font-medium hover:text-primary"
            onClick={() => {
              setEditing(row.original);
              setSheetOpen(true);
            }}
          >
            {row.original.title}
          </button>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <span className="block text-right w-full">Сумма</span>,
        cell: ({ row }) => {
          const isExpense = row.original.category === "expense";
          return (
            <span
              className={cn(
                "block text-right font-mono font-medium whitespace-nowrap",
                isExpense ? "text-[hsl(var(--expense))]" : "text-[hsl(var(--income))]",
              )}
            >
              {isExpense ? "−" : "+"} {formatKopecks(row.original.amount)} ₽
            </span>
          );
        },
      },
      {
        accessorKey: "date",
        header: "Дата",
        cell: ({ row }) => (
          <span className="text-muted-foreground" title={formatDate(row.original.date)}>
            {relativeDateLabel(row.original.date)}
          </span>
        ),
      },
      {
        id: "tag",
        header: "Метка",
        cell: ({ row }) => {
          const t = row.original.tag;
          return (
            <TagPills
              tag={t}
              showParent
              onClick={(id) => updateFilter("tag_ids", String(id))}
            />
          );
        },
      },
      {
        accessorKey: "category",
        header: "Категория",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full border-0",
              row.original.category === "income"
                ? "bg-[hsl(var(--income))]/12 text-[hsl(var(--income))]"
                : "bg-[hsl(var(--expense))]/12 text-[hsl(var(--expense))]",
            )}
          >
            {row.original.category === "income" ? "Доход" : "Расход"}
          </Badge>
        ),
      },
      {
        accessorKey: "specificity",
        header: "Специфика",
        cell: ({ row }) => (
          <Badge variant="outline" className="rounded-full">
            {row.original.specificity === "required" ? "Обязательный" : "Простой"}
          </Badge>
        ),
      },
      {
        id: "attachment",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-1 text-primary">
            {row.original.file && <Paperclip className="h-4 w-4" />}
            {row.original.url && (
              <a href={row.original.url} target="_blank" rel="noreferrer">
                <Link2 className="h-4 w-4" />
              </a>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem
                onClick={() => {
                  setEditing(row.original);
                  setSheetOpen(true);
                }}
              >
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => dupMutation.mutate(row.original.id)}>
                Дублировать
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (confirm("Удалить транзакцию?")) {
                    removeMutation.mutate(row.original.id);
                  }
                }}
              >
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [dupMutation, removeMutation, updateFilter],
  );

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const activeFilters =
    Number(!!category) +
    Number(!!specificity) +
    Number(!!tagIds) +
    Number(!!filters.search) +
    Number(!!dateFrom || !!dateTo);

  return (
    <div className="space-y-6">
      <BalanceHero />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Операции</h1>
          <p className="page-subtitle">История доходов и расходов</p>
        </div>
        <Button
          className="rounded-xl"
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          data-testid="btn-add-transaction"
        >
          <Plus className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </div>

      <ExpensesCalendar />

      <div className="surface-card p-4 space-y-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          {[
            { key: "category", value: "", label: "Все" },
            { key: "category", value: "expense", label: "Расходы" },
            { key: "category", value: "income", label: "Доходы" },
          ].map((pill) => (
            <button
              key={pill.label}
              type="button"
              className={cn(
                "pill-filter",
                (pill.value === "" ? !category : category === pill.value)
                  ? "pill-filter-active"
                  : "pill-filter-inactive",
              )}
              onClick={() => updateFilter("category", pill.value)}
            >
              {pill.label}
            </button>
          ))}

          <span className="w-px h-5 bg-border mx-1" />

          {[
            { value: "", label: "Все" },
            { value: "required", label: "Обязательные" },
            { value: "simple", label: "Простые" },
          ].map((pill) => (
            <button
              key={pill.label}
              type="button"
              className={cn(
                "pill-filter",
                (pill.value === "" ? !specificity : specificity === pill.value)
                  ? "pill-filter-active"
                  : "pill-filter-inactive",
              )}
              onClick={() => updateFilter("specificity", pill.value)}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Поиск по названию…"
            className="max-w-xs rounded-xl border-0 bg-muted/50"
            value={searchInput}
            data-testid="tx-search-input"
            onChange={(e) => {
              setSearchInput(e.target.value);
              window.clearTimeout((window as unknown as { _s?: number })._s);
              (window as unknown as { _s?: number })._s = window.setTimeout(
                () => updateFilter("search", e.target.value),
                300,
              );
            }}
          />
          <TagFilterPicker
            tags={tagsData}
            value={tagIds}
            onChange={(v) => updateFilter("tag_ids", v)}
            className="w-52"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              className="pill-filter pill-filter-active flex items-center gap-1"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete("date_from");
                next.delete("date_to");
                setSearchParams(next);
              }}
              title="Сбросить период"
            >
              {formatDate(dateFrom || dateTo)}
              {dateFrom && dateTo && dateFrom !== dateTo
                ? ` – ${formatDate(dateTo)}`
                : ""}
              {" ×"}
            </button>
          )}
          <Select
            value={String(perPage)}
            onValueChange={(v) => updateFilter("per_page", v)}
          >
            <SelectTrigger className="w-36 rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / стр.</SelectItem>
              <SelectItem value="25">25 / стр.</SelectItem>
              <SelectItem value="50">50 / стр.</SelectItem>
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-primary"
              onClick={() => {
                setSearchInput("");
                setSearchParams({});
              }}
            >
              Сбросить всё
            </Button>
          )}
        </div>
      </div>

      <div className="surface-card p-1 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="mb-2 text-lg">Не удалось загрузить операции</p>
            <p className="text-sm">Проверьте соединение с сервером</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="mb-4 text-lg">Нет записей</p>
            <Button className="rounded-xl" onClick={() => { setEditing(null); setSheetOpen(true); }}>
              Добавить первую транзакцию
            </Button>
          </div>
        ) : (
          <DataTable columns={columns} data={rows} />
        )}
      </div>

      {meta && meta.total_pages > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Всего {meta.total} · стр. {meta.page} из {meta.total_pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={page >= meta.total_pages}
              onClick={() => setPage(page + 1)}
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}

      <TransactionFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        transaction={editing}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["transactions"] });
          qc.invalidateQueries({ queryKey: ["balance"] });
          qc.invalidateQueries({ queryKey: ["analytics"] });
          setEditing(null);
        }}
      />
    </div>
  );
}
