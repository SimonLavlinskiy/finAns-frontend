import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { diffTone } from "../lib/calc";

/**
 * Плашка суммы со знаком, без стрелок. higherIsBetter: для дохода и итога «+» — зелёный,
 * для расхода и категорий «+» — красный. Ноль — серый `0 ₽`.
 */
export function SignedPill({ value, higherIsBetter = true }: { value: number; higherIsBetter?: boolean }) {
  const tone = diffTone(value, higherIsBetter);
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums",
        tone === "positive" && "bg-income-soft text-income",
        tone === "negative" && "bg-over-soft text-over",
        tone === "zero" && "bg-muted text-muted-foreground",
      )}
    >
      {formatMoney(value, { sign: "always" })}
    </span>
  );
}
