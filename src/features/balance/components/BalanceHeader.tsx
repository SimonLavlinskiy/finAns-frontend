import { useQuery } from "@tanstack/react-query";
import { fetchBalance } from "@/lib/api";
import { formatRubles } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Компактный баланс для шапки на внутренних страницах */
export function BalanceHeader() {
  const { data, isLoading } = useQuery({
    queryKey: ["balance"],
    queryFn: async () => (await fetchBalance()).data,
  });

  const balance = data?.balance ?? 0;
  const color =
    balance > 0
      ? "text-[hsl(var(--income))]"
      : balance < 0
        ? "text-[hsl(var(--expense))]"
        : "text-foreground";

  return (
    <div className="rounded-xl bg-muted/60 px-3 py-1.5 text-sm">
      <span className="text-muted-foreground mr-2">Баланс</span>
      <span className={cn("font-mono font-semibold", color)}>
        {isLoading ? "…" : `${formatRubles(balance)} ₽`}
      </span>
    </div>
  );
}
