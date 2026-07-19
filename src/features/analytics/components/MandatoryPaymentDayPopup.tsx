import type { CSSProperties } from "react";
import { formatDate, formatRubles } from "@/lib/format";
import type { MandatoryPayment } from "@/lib/types";

/**
 * Упрощённый попап для будущего дня, на который приходится дата регулярного
 * платежа, но за который ещё нет фактических транзакций — в отличие от
 * CalendarDayPopup, не показывает разбивку по тегам/операциям, т.к. их для
 * будущего дня физически ещё нет.
 */
export function MandatoryPaymentDayPopup({
  payments,
  dateKey,
  style,
  arrowLeft,
  onMouseEnter,
  onMouseLeave,
}: {
  payments: MandatoryPayment[];
  dateKey: string;
  style: CSSProperties;
  arrowLeft?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
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
      <p className="text-xs text-muted-foreground mb-2">
        Регулярный платёж · {formatDate(dateKey)}
      </p>
      <ul className="space-y-1.5">
        {payments.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">{p.title}</span>
            <span className="font-mono text-xs whitespace-nowrap text-[hsl(var(--expense))]">
              − {formatRubles(p.amount)} ₽
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
