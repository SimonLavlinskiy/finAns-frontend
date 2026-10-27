import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Скелетон карточки фиксированной высоты — без скачков вёрстки при загрузке. */
export function CardSkeleton({ height = 240, className }: { height?: number; className?: string }) {
  return (
    <div className={cn("surface-card p-5", className)} style={{ minHeight: height }} aria-busy="true">
      <div className="h-5 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="mt-5 h-[34px] w-full animate-pulse rounded-[10px] bg-muted" />
      <div className="mt-5 space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function CardError({ onRetry, title }: { onRetry: () => void; title?: ReactNode }) {
  return (
    <div className="surface-card p-5">
      {title}
      <div className="flex flex-col items-start gap-3 py-4">
        <p className="text-sm text-muted-foreground">Не удалось загрузить данные</p>
        <Button variant="outline" size="sm" className="rounded-full" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    </div>
  );
}
