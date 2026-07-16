import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createPlannedExpense, updatePlannedExpense } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { parseRublesInput } from "@/lib/format";
import { CATEGORY_COLORS } from "@/lib/palette";
import { PRIORITY_LABELS } from "@/lib/planned-expenses";
import type {
  CreatePlannedExpenseInput,
  PlannedExpense,
  PlannedExpenseCategoryWithItems,
} from "@/lib/types";
import { CategoryColorSwatchPicker } from "./CategoryColorSwatchPicker";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PlannedExpense | null;
  categories: PlannedExpenseCategoryWithItems[];
  onSaved: () => void;
};

const NEW_CAT = "__new__";

function emptyForm() {
  return {
    title: "",
    cost: "",
    dueDate: "",
    url: "",
    priority: "medium" as "low" | "medium" | "high",
    categoryId: "",
    newCatName: "",
    newCatColor: CATEGORY_COLORS[0],
  };
}

export function PlannedExpenseSheet({
  open,
  onOpenChange,
  item,
  categories,
  onSaved,
}: Props) {
  const qc = useQueryClient();
  const isEditing = item !== null;

  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (item) {
      setForm({
        title: item.title,
        cost: item.cost_kopecks !== null ? String(item.cost_kopecks / 100) : "",
        dueDate: item.due_date ?? "",
        url: item.url ?? "",
        priority: item.priority,
        categoryId: String(item.category_id),
        newCatName: "",
        newCatColor: CATEGORY_COLORS[0],
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, item]);

  const saveMutation = useMutation({
    mutationFn: (payload: CreatePlannedExpenseInput) =>
      isEditing
        ? updatePlannedExpense(item.id, payload)
        : createPlannedExpense(payload),
  });

  function buildPayload(): CreatePlannedExpenseInput | null {
    if (!form.title.trim()) {
      setFormError("Укажите наименование");
      return null;
    }

    const isNewCat = form.categoryId === NEW_CAT;

    if (isNewCat && !form.newCatName.trim()) {
      setFormError("Укажите название новой категории");
      return null;
    }
    if (!isNewCat && !form.categoryId) {
      setFormError("Выберите категорию");
      return null;
    }

    const costKopecks = form.cost.trim()
      ? parseRublesInput(form.cost)
      : null;

    const payload: CreatePlannedExpenseInput = {
      title: form.title.trim(),
      cost_kopecks: costKopecks,
      due_date: form.dueDate || null,
      url: form.url.trim() || null,
      priority: form.priority,
    };

    if (isNewCat) {
      payload.new_category = { name: form.newCatName.trim(), color: form.newCatColor };
    } else {
      payload.category_id = Number(form.categoryId);
    }

    return payload;
  }

  function doSave(andMore: boolean) {
    const payload = buildPayload();
    if (!payload) return;
    setFormError(null);
    saveMutation.mutate(payload, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["planned-expense-categories"] });
        onSaved();
        if (andMore) {
          setForm(emptyForm());
        } else {
          onOpenChange(false);
        }
      },
      onError: (err) => {
        if (err instanceof ApiError && err.fields) {
          const msgs = Object.entries(err.fields)
            .map(([f, m]) => `${f}: ${m}`)
            .join("; ");
          setFormError(msgs);
        } else {
          setFormError(err instanceof Error ? err.message : "Ошибка сохранения");
        }
      },
    });
  }

  const f = form;
  const set = (k: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Редактировать расход" : "Новый расход"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Наименование</label>
            <Input
              placeholder="Название товара или расхода"
              value={f.title}
              onChange={(e) => set("title")(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Стоимость</label>
            <Input
              placeholder="Необязательно"
              value={f.cost}
              onChange={(e) => set("cost")(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Срок</label>
            <DatePicker value={f.dueDate} onChange={set("dueDate")} clearable />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ссылка</label>
            <Input
              placeholder="https://..."
              value={f.url}
              onChange={(e) => set("url")(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Приоритет</label>
            <Select
              value={f.priority}
              onValueChange={(v) =>
                set("priority")(v as "low" | "medium" | "high")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Категория</label>
            <Select value={f.categoryId} onValueChange={set("categoryId")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value={NEW_CAT}>+ Новая категория</SelectItem>
              </SelectContent>
            </Select>

            {f.categoryId === NEW_CAT && (
              <div className="space-y-2 pt-1">
                <Input
                  placeholder="Название категории"
                  value={f.newCatName}
                  onChange={(e) => set("newCatName")(e.target.value)}
                />
                <CategoryColorSwatchPicker
                  value={f.newCatColor}
                  onChange={set("newCatColor")}
                />
              </div>
            )}
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            className="flex-1 rounded-xl"
            onClick={() => doSave(false)}
            disabled={saveMutation.isPending}
          >
            Сохранить
          </Button>
          {!isEditing && (
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => doSave(true)}
              disabled={saveMutation.isPending}
            >
              Сохранить и ещё
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
