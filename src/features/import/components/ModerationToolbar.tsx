import { Button } from "@/components/ui/button";
import type { ModerationRow } from "@/lib/types";

type Props = {
  totalRows: number;
  currentRows: ModerationRow[];
  selectedCount: number;
  allReadySelected: boolean;
  onToggleSelectAllReady: (checked: boolean) => void;
  onAcceptSelected: () => void;
  accepting: boolean;
};

export function ModerationToolbar({
  totalRows,
  currentRows,
  selectedCount,
  allReadySelected,
  onToggleSelectAllReady,
  onAcceptSelected,
  accepting,
}: Props) {
  const readyCount = currentRows.filter((r) => r.status === "ready").length;
  const errorCount = currentRows.filter((r) => r.status === "error").length;
  const transferredCount = totalRows - currentRows.length;

  return (
    <div className="surface-card p-4 flex items-center justify-between gap-4 flex-wrap">
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={allReadySelected}
          disabled={readyCount === 0}
          onChange={(e) => onToggleSelectAllReady(e.target.checked)}
        />
        Выбрать все готовые
      </label>

      <div className="text-sm text-muted-foreground">
        Всего: {totalRows} · Готово: {readyCount} · Ошибок: {errorCount} · Перенесено:{" "}
        {transferredCount}
      </div>

      <Button
        className="rounded-xl"
        disabled={selectedCount === 0 || accepting}
        onClick={onAcceptSelected}
      >
        Принять выбранные ({selectedCount})
      </Button>
    </div>
  );
}
