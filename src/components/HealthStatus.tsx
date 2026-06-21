import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function HealthStatus() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        API…
      </div>
    );
  }

  const ok = !isError && data?.db === "up";

  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2 text-xs font-medium",
        ok
          ? "bg-[hsl(var(--income))]/10 text-[hsl(var(--income))]"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {ok ? "● Система OK" : "● API недоступен"}
    </div>
  );
}
