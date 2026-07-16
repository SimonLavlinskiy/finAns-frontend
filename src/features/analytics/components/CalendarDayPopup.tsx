import { useState } from "react";
import type { CSSProperties } from "react";
import { formatDate, formatRubles } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/lib/types";

type Mode = "transactions" | "tags";

export function CalendarDayPopup({
  item,
  style,
  arrowLeft,
  onMouseEnter,
  onMouseLeave,
}: {
  item: CalendarItem;
  style: CSSProperties;
  arrowLeft?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("tags");
  const breakdown = item.breakdown_by_tag ?? [];
  const transactions = item.transactions ?? [];

  return (
    <div
      className="absolute z-20 w-64 -translate-x-1/2 rounded-2xl border bg-card p-4 soft-shadow-lg"
      style={style}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {arrowLeft !== undefined && (
        <span
          className="absolute -top-1.5 h-3 w-3 rotate-45 border-l border-t bg-card"
          style={{ left: arrowLeft, marginLeft: -6 }}
        />
      )}
      <p className="text-lg font-semibold font-mono">
        {formatRubles(item.amount)} ₽
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        {formatDate(item.key)}
      </p>

      <div className="flex gap-1 mb-3">
        <button
          type="button"
          className={cn(
            "pill-filter !px-2.5 !py-1 !text-xs flex-1 text-center",
            mode === "transactions" ? "pill-filter-active" : "pill-filter-inactive",
          )}
          onClick={() => setMode("transactions")}
        >
          По Расходам
        </button>
        <button
          type="button"
          className={cn(
            "pill-filter !px-2.5 !py-1 !text-xs flex-1 text-center",
            mode === "tags" ? "pill-filter-active" : "pill-filter-inactive",
          )}
          onClick={() => setMode("tags")}
        >
          По Статьям
        </button>
      </div>

      {mode === "tags" ? (
        <div className="space-y-2">
          {breakdown.length > 0 && (
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              {breakdown.map((b) => (
                <div
                  key={b.tag_id}
                  style={{ width: `${b.percent}%`, backgroundColor: b.color }}
                />
              ))}
            </div>
          )}
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {breakdown.map((b) => (
              <li
                key={b.tag_id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="truncate">{b.name}</span>
                </span>
                <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                  {formatRubles(b.amount)} ₽ · {b.percent.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
          {transactions.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate">{t.title}</span>
              <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                {formatRubles(t.amount)} ₽
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
