import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { completePlannedExpense, deletePlannedExpense } from "@/lib/api";
import { formatKopecks } from "@/lib/format";
import { PRIORITY_DOT_COLORS } from "@/lib/planned-expenses";
import { cn } from "@/lib/utils";
import type { PlannedExpense } from "@/lib/types";

type Props = {
  item: PlannedExpense;
  textColor: string;
  onEdit: (item: PlannedExpense) => void;
  showActions?: boolean;
};

export function PlannedExpenseRow({
  item,
  textColor,
  onEdit,
  showActions = true,
}: Props) {
  const qc = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: () => completePlannedExpense(item.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planned-expense-categories"] });
      qc.invalidateQueries({ queryKey: ["planned-expenses-archived"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePlannedExpense(item.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planned-expense-categories"] });
    },
  });

  const dotColor = PRIORITY_DOT_COLORS[item.effective_priority] ?? "#888";

  return (
    <div className="group flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-black/10 transition-colors">
      <span
        className="mt-1.5 shrink-0 w-2 h-2 rounded-full"
        style={{ backgroundColor: dotColor }}
      />

      <div className="flex-1 min-w-0">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium underline-offset-2 hover:underline cursor-pointer"
            style={{ color: textColor }}
          >
            {item.title}
          </a>
        ) : (
          <span className="text-sm font-medium" style={{ color: textColor }}>
            {item.title}
          </span>
        )}

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {item.cost_kopecks !== null && (
            <span className="text-xs opacity-80" style={{ color: textColor }}>
              {formatKopecks(item.cost_kopecks)} ₽
            </span>
          )}
          {item.due_date && (
            <span
              className={cn(
                "text-xs rounded px-1",
                item.is_due_soon
                  ? "bg-amber-100/80 text-amber-800 font-medium"
                  : "opacity-70",
              )}
              style={item.is_due_soon ? {} : { color: textColor }}
            >
              {item.due_date}
            </span>
          )}
        </div>
      </div>

      {showActions && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-black/20"
              >
                <MoreHorizontal className="h-3.5 w-3.5" style={{ color: textColor }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
              >
                Выполнено
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(item)}>
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (confirm(`Удалить «${item.title}»?`))
                    deleteMutation.mutate();
                }}
                disabled={deleteMutation.isPending}
              >
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
