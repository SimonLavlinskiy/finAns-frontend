import { ExpensesCalendar } from "@/features/analytics/components/ExpensesCalendar";

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Аналитика</h1>
        <p className="page-subtitle">Календарь расходов по дням и месяцам</p>
      </div>

      <ExpensesCalendar />
    </div>
  );
}
