import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  fetchArchivedPlannedExpenses,
  fetchPlannedExpenseCategories,
} from "@/lib/api";
import { contrastText } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { PlannedExpense, PlannedExpenseCategoryWithItems } from "@/lib/types";
import { CategoryGrid } from "../components/CategoryGrid";
import { PlannedExpenseRow } from "../components/PlannedExpenseRow";
import { PlannedExpenseSheet } from "../components/PlannedExpenseSheet";

type Tab = "active" | "archived";

export function PlannedExpensesPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PlannedExpense | null>(null);
  const qc = useQueryClient();

  const {
    data: categoriesData,
    isLoading: catsLoading,
    isError: catsError,
  } = useQuery({
    queryKey: ["planned-expense-categories"],
    queryFn: async () => (await fetchPlannedExpenseCategories()).data,
  });

  const {
    data: archivedData,
    isLoading: archLoading,
    isError: archError,
  } = useQuery({
    queryKey: ["planned-expenses-archived"],
    queryFn: async () => (await fetchArchivedPlannedExpenses()).data,
    enabled: tab === "archived",
  });

  const categories: PlannedExpenseCategoryWithItems[] = categoriesData ?? [];
  const archived = archivedData ?? [];

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(item: PlannedExpense) {
    setEditing(item);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Хочу купить</h1>
          <p className="page-subtitle">Планируемые покупки</p>
        </div>
        <Button
          className="rounded-xl gap-1"
          onClick={openAdd}
          data-testid="btn-add-planned-expense"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      <div className="flex gap-1 border-b">
        {(["active", "archived"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "active" ? "Активные" : "Архив"}
          </button>
        ))}
      </div>

      {tab === "active" && (
        <>
          {catsLoading && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Загрузка…
            </div>
          )}
          {catsError && (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-lg mb-2">Не удалось загрузить список</p>
              <p className="text-sm">Проверьте соединение с сервером</p>
            </div>
          )}
          {!catsLoading && !catsError && categories.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="mb-4 text-lg">Нет категорий</p>
              <Button onClick={openAdd}>Добавить желание</Button>
            </div>
          )}
          {!catsLoading && !catsError && categories.length > 0 && (
            <CategoryGrid categories={categories} onEdit={openEdit} />
          )}
        </>
      )}

      {tab === "archived" && (
        <div className="surface-card p-4">
          {archLoading && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Загрузка…
            </div>
          )}
          {archError && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Не удалось загрузить архив
            </div>
          )}
          {!archLoading && !archError && archived.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Архив пуст
            </div>
          )}
          {!archLoading && !archError && archived.length > 0 && (
            <div className="flex flex-col gap-1">
              {archived.map((item) => (
                <PlannedExpenseRow
                  key={item.id}
                  item={item}
                  textColor={contrastText("#ffffff")}
                  onEdit={openEdit}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <PlannedExpenseSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        item={editing}
        categories={categories}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["planned-expense-categories"] });
        }}
      />
    </div>
  );
}
