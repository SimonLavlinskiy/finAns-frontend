import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRubles } from "@/lib/format";
import type { FreedomIndexPoint } from "@/lib/types";

type Props = {
  points: FreedomIndexPoint[];
};

export function FreedomIndexChart({ points }: Props) {
  const chartData = points.map((p) => ({
    month: p.month,
    percent: p.share !== null ? Math.round(p.share * 1000) / 10 : null,
  }));

  const lastWithData = [...points].reverse().find((p) => p.total_expense > 0);
  const [targetPercent, setTargetPercent] = useState<number | null>(null);

  const currentPercent = lastWithData?.share !== undefined && lastWithData?.share !== null
    ? Math.round(lastWithData.share * 1000) / 10
    : null;

  const projectedSavings = useMemo(() => {
    if (!lastWithData || targetPercent === null || currentPercent === null) return null;
    const targetSimpleAmount = (targetPercent / 100) * lastWithData.total_expense;
    return (lastWithData.simple_amount - targetSimpleAmount) * 12;
  }, [lastWithData, targetPercent, currentPercent]);

  return (
    <div className="surface-card p-5 space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Индекс свободы</p>
        <p className="text-3xl font-bold" data-testid="freedom-index-current">
          {currentPercent !== null ? `${currentPercent}%` : "—"}
        </p>
        <p className="text-xs text-muted-foreground">доля трат «по желанию» от общих расходов</p>
      </div>

      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" width={40} />
            <Tooltip formatter={(v) => [`${v}%`, "Доля по желанию"]} />
            <Line
              type="monotone"
              dataKey="percent"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {currentPercent !== null && (
        <div className="pt-2 border-t space-y-2">
          <label className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Что если снизить долю до {targetPercent ?? currentPercent}%?</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={targetPercent ?? currentPercent}
            onChange={(e) => setTargetPercent(Number(e.target.value))}
            className="w-full"
            data-testid="freedom-index-simulator-slider"
          />
          {targetPercent !== null && projectedSavings !== null && (
            <p className="text-sm" data-testid="freedom-index-simulator-result">
              {projectedSavings >= 0 ? (
                <>
                  Экономия за год: <span className="font-semibold text-[hsl(var(--income))]">{formatRubles(projectedSavings)} ₽</span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  Целевая доля выше текущей — это не экономия, а перерасход
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
