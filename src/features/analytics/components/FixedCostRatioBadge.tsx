import type { FixedCostRatio } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  data: FixedCostRatio | undefined;
};

export function FixedCostRatioBadge({ data }: Props) {
  const percent = data?.ratio !== null && data?.ratio !== undefined ? Math.round(data.ratio * 100) : null;

  return (
    <div className="surface-card p-5 space-y-2" data-testid="fixed-cost-ratio">
      <p className="text-sm text-muted-foreground">Жёсткость бюджета</p>
      <p className="text-3xl font-bold">{percent !== null ? `${percent}%` : "неизвестно"}</p>
      <p className="text-xs text-muted-foreground">доля дохода на обязательные платежи</p>
      {percent !== null && (
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              percent > 70 ? "bg-[hsl(var(--expense))]" : "bg-[hsl(var(--primary))]",
            )}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
