import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SpendingLimitSheet } from "@/features/analytics/components/SpendingLimitSheet";
import { deleteSpendingLimit, fetchSpendingLimits } from "@/lib/api";
import { formatRubles } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SpendingLimitsPanel() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["spending-limits"],
    queryFn: async () => (await fetchSpendingLimits()).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSpendingLimit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spending-limits"] }),
  });

  const limits = data ?? [];

  return (
    <div className="surface-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Лимиты трат</p>
        <Button size="sm" className="rounded-xl" onClick={() => setSheetOpen(true)} data-testid="btn-add-spending-limit">
          + Лимит
        </Button>
      </div>

      {limits.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет активных лимитов</p>
      ) : (
        <div className="space-y-3">
          {limits.map((l) => {
            const percent = l.amount > 0 ? (l.spent / l.amount) * 100 : 0;
            const exceeded = l.spent > l.amount;
            return (
              <div key={l.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{l.tag.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-mono", exceeded && "text-[hsl(var(--expense))]")}>
                      {formatRubles(l.spent)} / {formatRubles(l.amount)} ₽
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(l.id)}
                      aria-label="Удалить лимит"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", exceeded ? "bg-[hsl(var(--expense))]" : "bg-[hsl(var(--primary))]")}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SpendingLimitSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSaved={() => qc.invalidateQueries({ queryKey: ["spending-limits"] })}
      />
    </div>
  );
}
