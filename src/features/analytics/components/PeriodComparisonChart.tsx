import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRubles } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PeriodComparisonEntry } from "@/lib/types";

type Props = {
  entries: PeriodComparisonEntry[];
  mode: "prev_month" | "prev_year";
  onModeChange: (mode: "prev_month" | "prev_year") => void;
};

export function PeriodComparisonChart({ entries, mode, onModeChange }: Props) {
  // Значения остаются в копейках (как приходят с бэкенда) и форматируются
  // только при отображении — formatRubles/tickFormatter ожидают копейки.
  const chartData = entries.map((e) => ({
    name: e.name,
    Текущий: e.current_amount,
    Сравнение: e.comparison_amount,
  }));

  return (
    <div className="surface-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Сравнение периодов</p>
        <div className="flex gap-1">
          <button
            type="button"
            className={cn("pill-filter text-xs", mode === "prev_month" ? "pill-filter-active" : "pill-filter-inactive")}
            onClick={() => onModeChange("prev_month")}
          >
            vs прошлый месяц
          </button>
          <button
            type="button"
            className={cn("pill-filter text-xs", mode === "prev_year" ? "pill-filter-active" : "pill-filter-inactive")}
            onClick={() => onModeChange("prev_year")}
          >
            vs год назад
          </button>
        </div>
      </div>

      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v: number) => formatRubles(v)} />
            <Tooltip formatter={(v) => [`${formatRubles(Number(v))} ₽`, ""]} />
            <Bar dataKey="Текущий" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Сравнение" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
