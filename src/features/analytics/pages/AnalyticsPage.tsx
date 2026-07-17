import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BalanceForecastChart } from "@/features/analytics/components/BalanceForecastChart";
import { FixedCostRatioBadge } from "@/features/analytics/components/FixedCostRatioBadge";
import { FreedomIndexChart } from "@/features/analytics/components/FreedomIndexChart";
import { IncomeExpenseSankey } from "@/features/analytics/components/IncomeExpenseSankey";
import { InsightsFeed } from "@/features/analytics/components/InsightsFeed";
import { PeriodComparisonChart } from "@/features/analytics/components/PeriodComparisonChart";
import { SavingsGoalsPanel } from "@/features/analytics/components/SavingsGoalsPanel";
import { SpendingLimitsPanel } from "@/features/analytics/components/SpendingLimitsPanel";
import { SpendingMoodCalendar } from "@/features/analytics/components/SpendingMoodCalendar";
import {
  fetchBalanceForecast,
  fetchFixedCostRatio,
  fetchFreedomIndex,
  fetchIncomeExpenseSankey,
  fetchInsights,
  fetchPeriodComparison,
  fetchSavingsGoals,
  fetchSpendingMoodCalendar,
} from "@/lib/api";

export function AnalyticsPage() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [forecastDays, setForecastDays] = useState<30 | 60 | 90>(30);
  const [comparisonMode, setComparisonMode] = useState<"prev_month" | "prev_year">("prev_month");

  const insights = useQuery({
    queryKey: ["analytics", "insights"],
    queryFn: async () => (await fetchInsights()).data,
  });
  const freedomIndex = useQuery({
    queryKey: ["analytics", "freedom-index"],
    queryFn: async () => (await fetchFreedomIndex(12)).data,
  });
  const fixedCostRatio = useQuery({
    queryKey: ["analytics", "fixed-cost-ratio", year, month],
    queryFn: async () => (await fetchFixedCostRatio(year, month)).data,
  });
  const sankey = useQuery({
    queryKey: ["analytics", "sankey", year, month],
    queryFn: async () => (await fetchIncomeExpenseSankey("day", year, month)).data,
  });
  const balanceForecast = useQuery({
    queryKey: ["analytics", "balance-forecast", forecastDays],
    queryFn: async () => (await fetchBalanceForecast(forecastDays)).data,
  });
  const savingsGoals = useQuery({
    queryKey: ["analytics", "savings-goals"],
    queryFn: async () => (await fetchSavingsGoals()).data,
  });
  const moodCalendar = useQuery({
    queryKey: ["analytics", "mood-calendar", year, month],
    queryFn: async () => (await fetchSpendingMoodCalendar(year, month)).data,
  });
  const periodComparison = useQuery({
    queryKey: ["analytics", "period-comparison", comparisonMode],
    queryFn: async () => (await fetchPeriodComparison(comparisonMode)).data,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Аналитика</h1>
        <p className="page-subtitle">Куда уходят деньги и на что хватит</p>
      </div>

      {insights.data && <InsightsFeed insights={insights.data} />}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-5">
          <FreedomIndexChart points={freedomIndex.data ?? []} />
          <FixedCostRatioBadge data={fixedCostRatio.data} />
        </div>
        <BalanceForecastChart data={balanceForecast.data} days={forecastDays} onDaysChange={setForecastDays} />
      </div>

      <IncomeExpenseSankey data={sankey.data} />

      {savingsGoals.data && savingsGoals.data.length > 0 && <SavingsGoalsPanel goals={savingsGoals.data} />}

      <div className="grid gap-5 md:grid-cols-2">
        <SpendingMoodCalendar days={moodCalendar.data ?? []} />
        <PeriodComparisonChart
          entries={periodComparison.data ?? []}
          mode={comparisonMode}
          onModeChange={setComparisonMode}
        />
      </div>

      <SpendingLimitsPanel />
    </div>
  );
}
