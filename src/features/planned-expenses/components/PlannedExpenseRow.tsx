import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { TagFormPicker } from "@/components/TagFilterPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  completePlannedExpense,
  createTransaction,
  deletePlannedExpense,
  fetchTags,
} from "@/lib/api";
import { formatDate, formatRubles, parseRublesInput } from "@/lib/format";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tagId, setTagId] = useState("");
  const [amountStr, setAmountStr] = useState("");

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await fetchTags()).data,
    enabled: dialogOpen,
  });

  const completeMutation = useMutation({
    mutationFn: () => completePlannedExpense(item.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planned-expense-categories"] });
      qc.invalidateQueries({ queryKey: ["planned-expenses-archived"] });
      setDialogOpen(false);
    },
  });

  const completeWithTxMutation = useMutation({
    mutationFn: async () => {
      const amount = parseRublesInput(amountStr);
      await createTransaction({
        title: item.title,
        amount,
        date: new Date().toISOString().slice(0, 10),
        tag_id: Number(tagId),
        category: "expense",
        specificity: "simple",
        url: item.url ?? null,
      });
      await completePlannedExpense(item.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planned-expense-categories"] });
      qc.invalidateQueries({ queryKey: ["planned-expenses-archived"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePlannedExpense(item.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planned-expense-categories"] });
    },
  });

  function openCompleteDialog() {
    const initial =
      item.cost_kopecks !== null ? String(item.cost_kopecks / 100) : "";
    setAmountStr(initial);
    setTagId("");
    setDialogOpen(true);
  }

  const parsedAmount = parseRublesInput(amountStr);
  const canCreateTx = !!tagId && parsedAmount > 0;
  const isPending = completeMutation.isPending || completeWithTxMutation.isPending;

  const dotColor = PRIORITY_DOT_COLORS[item.effective_priority] ?? "#888";

  return (
    <>
      <div className="group flex items-start gap-2 py-1.5 px-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors">
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
                {formatRubles(item.cost_kopecks)} ₽
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
                {formatDate(item.due_date)}
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
                <DropdownMenuItem onClick={openCompleteDialog}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Покупка совершена</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm font-medium">{item.title}</p>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Сумма (₽)</label>
              <Input
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                type="number"
                min="0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Метка транзакции</label>
              <TagFormPicker
                tags={tagsData ?? []}
                value={tagId}
                onChange={setTagId}
              />
            </div>

            {completeWithTxMutation.isError && (
              <p className="text-sm text-destructive">Не удалось создать транзакцию</p>
            )}
          </div>

          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => completeMutation.mutate()}
              disabled={isPending}
            >
              В архив
            </Button>
            <Button
              onClick={() => completeWithTxMutation.mutate()}
              disabled={!canCreateTx || isPending}
            >
              Создать транзакцию
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
