import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, formatRubles } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BalanceForecast } from "@/lib/types";

type Props = {
  data: BalanceForecast | undefined;
  days: 30 | 60 | 90;
  onDaysChange: (days: 30 | 60 | 90) => void;
};

export function BalanceForecastChart({ data, days, onDaysChange }: Props) {
  const chartData = [
    ...(data?.history.map((p) => ({ date: p.date, fact: p.balance, forecast: null as number | null })) ?? []),
    ...(data?.forecast.map((p, i) => ({
      date: p.date,
      fact: i === 0 ? data.history[data.history.length - 1]?.balance ?? null : null,
      forecast: p.balance,
    })) ?? []),
  ];

  return (
    <div className="surface-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Прогноз баланса</p>
        <div className="flex gap-1">
          {([30, 60, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={cn("pill-filter text-xs", d === days ? "pill-filter-active" : "pill-filter-inactive")}
              onClick={() => onDaysChange(d)}
              data-testid={`balance-forecast-days-${d}`}
            >
              {d} дн.
            </button>
          ))}
        </div>
      </div>

      {data?.zero_crossing_date && (
        <p className="text-sm rounded-xl bg-[hsl(var(--expense))]/10 text-[hsl(var(--expense))] px-3 py-2">
          При таком темпе баланс уйдёт в минус около {formatDate(data.zero_crossing_date)}
        </p>
      )}

      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={20} />
            <YAxis
              tick={{ fontSize: 11 }}
              width={70}
              tickFormatter={(v: number) => formatRubles(v)}
            />
            <Tooltip formatter={(v) => [`${formatRubles(Number(v))} ₽`, ""]} />
            <Line type="monotone" dataKey="fact" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
