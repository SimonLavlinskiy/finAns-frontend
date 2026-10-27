import { cn } from "@/lib/utils";
import { limitFill } from "../lib/calc";

/**
 * Полоса заполнения лимита (лимит = 100 %). При превышении — заливка цветом
 * категории до доли лимит/потрачено, тёмная черта 3 px и красный хвост; всё
 * внутри дорожки. Подсказок нет.
 */
export function LimitFillBar({
  spent,
  limit,
  color,
  className,
}: {
  spent: number;
  limit: number;
  color: string;
  className?: string;
}) {
  const { fill, over } = limitFill(spent, limit);
  return (
    <div className={cn("flex h-3 w-full overflow-hidden rounded-full bg-muted", className)} aria-hidden>
      <div className="h-full" style={{ width: `${fill}%`, backgroundColor: color }} />
      {over > 0 && (
        <div
          className="h-full"
          style={{ width: `${over}%`, backgroundColor: "var(--over)", borderLeft: "3px solid hsl(var(--primary))" }}
        />
      )}
    </div>
  );
}
