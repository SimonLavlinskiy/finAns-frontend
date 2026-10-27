import { useQueries } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchMonthSummary } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { analyticsKeys } from "../api";
import { averageRoundedTo100Rub } from "../lib/calc";
import { addMonths, compareMonths } from "../lib/months";
import { AmountInput } from "../shared/AmountInput";

/**
 * Встроенная строка редактирования лимита (светло-жёлтый фон). Enter — сохранить, Esc — отмена.
 * Пустое поле или 0 — убрать лимит. Подсказка — среднее за 3 предыдущих завершённых месяца.
 */
export function LimitEditorRow({
  categoryId,
  categoryName,
  currentLimit,
  currentMonth,
  firstMonth,
  saving,
  onSave,
  onRemove,
  onCancel,
}: {
  categoryId: number;
  categoryName: string;
  currentLimit: number | null;
  currentMonth: string;
  firstMonth: string | null;
  saving: boolean;
  onSave: (amount: number | null) => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<number | null>(currentLimit);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const months = [1, 2, 3].map((k) => addMonths(currentMonth, -k)).filter((m) => !firstMonth || compareMonths(m, firstMonth) >= 0);
  const prev = useQueries({
    queries: months.map((m) => ({
      queryKey: analyticsKeys.month(m),
      queryFn: async () => (await fetchMonthSummary(m)).data,
    })),
  });
  const ready = months.length > 0 && prev.every((q) => q.data);
  const avg = ready
    ? averageRoundedTo100Rub(prev.map((q) => q.data!.categories.find((c) => c.category_id === categoryId)?.amount ?? 0))
    : null;

  return (
    <div
      className="bg-planned-soft flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSave(value);
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
    >
      <label className="text-sm font-medium" htmlFor={`limit-${categoryId}`}>
        Лимит на месяц для «{categoryName}»
      </label>
      <AmountInput
        id={`limit-${categoryId}`}
        ref={inputRef}
        value={value}
        onValueChange={setValue}
        placeholder="Сумма"
        className="h-9 w-36"
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="rounded-full" disabled={saving} onClick={() => onSave(value)}>
          Сохранить
        </Button>
        {currentLimit !== null && (
          <Button size="sm" variant="outline" className="rounded-full" disabled={saving} onClick={onRemove}>
            Убрать лимит
          </Button>
        )}
        <Button size="sm" variant="ghost" className="rounded-full" onClick={onCancel}>
          Отмена
        </Button>
      </div>
      {avg !== null && avg > 0 && (
        <button
          type="button"
          className="text-left text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          onClick={() => setValue(avg)}
        >
          В среднем за 3 месяца: {formatMoney(avg)}
        </button>
      )}
    </div>
  );
}
