import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useAnalyticsRange, useCategories, useMonthSummary, useSpendingLimits } from "@/features/analytics/api";
import { DynamicsCard } from "@/features/analytics/dynamics/DynamicsCard";
import { compareMonths, monthLower } from "@/features/analytics/lib/months";
import { CategoryLimitsCard } from "@/features/analytics/overview/CategoryLimitsCard";
import { IncomeExpenseNow } from "@/features/analytics/overview/IncomeExpenseNow";
import { MonthSwitcher } from "@/features/analytics/overview/MonthSwitcher";
import { PlannerTab } from "@/features/analytics/planner/PlannerTab";
import { CardError, CardSkeleton } from "@/features/analytics/shared/CardState";
import { Segmented } from "@/features/analytics/shared/Segmented";

type Tab = "overview" | "planner";

function tabStorageKey(userId: number | undefined) {
  return `analytics.tab.${userId ?? "anon"}`;
}

function readStoredTab(userId: number | undefined): Tab | null {
  try {
    const v = localStorage.getItem(tabStorageKey(userId));
    return v === "overview" || v === "planner" ? v : null;
  } catch {
    return null;
  }
}

function storeTab(userId: number | undefined, tab: Tab) {
  try {
    localStorage.setItem(tabStorageKey(userId), tab);
  } catch {
    // хранилище недоступно (приватный режим) — вкладка просто не запомнится
  }
}

/**
 * Раздел «Аналитика»: «Обзор месяца» (блоки 1–3) и «Планирование».
 * Месяц и вкладка — в URL (?month=YYYY-MM&tab=planner); последняя вкладка
 * запоминается для пользователя. Старые виджеты аналитики остаются в коде,
 * но здесь не выводятся.
 */
export function AnalyticsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const range = useAnalyticsRange();
  const categories = useCategories();

  const urlTab = params.get("tab");
  const tab: Tab = urlTab === "planner" || urlTab === "overview" ? urlTab : (readStoredTab(user?.id) ?? "overview");

  // Запоминаем любую открытую вкладку — и по клику, и по ссылке с ?tab=.
  useEffect(() => storeTab(user?.id, tab), [user?.id, tab]);

  function setTab(next: Tab) {
    setParams(
      (p) => {
        p.set("tab", next);
        return p;
      },
      { replace: true },
    );
  }

  const currentMonth = range.data?.current_month ?? null;
  const minMonth = range.data?.first_month ?? currentMonth;
  let month = params.get("month") ?? currentMonth;
  if (month && currentMonth && minMonth) {
    if (!/^\d{4}-\d{2}$/.test(month) || compareMonths(month, currentMonth) > 0) month = currentMonth;
    else if (compareMonths(month, minMonth) < 0) month = minMonth;
  }

  function setMonth(m: string) {
    setParams(
      (p) => {
        if (m === currentMonth) p.delete("month");
        else p.set("month", m);
        return p;
      },
      { replace: true },
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Аналитика</h1>
          <p className="page-subtitle">Куда уходят деньги и на что хватит</p>
        </div>
        {tab === "overview" && month && currentMonth && minMonth && (
          <MonthSwitcher month={month} min={minMonth} max={currentMonth} onChange={setMonth} />
        )}
      </div>

      <Segmented
        ariaLabel="Вкладки аналитики"
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: "Обзор месяца" },
          { value: "planner", label: "Планирование" },
        ]}
      />

      {range.isError || categories.isError ? (
        <CardError
          onRetry={() => {
            void range.refetch();
            void categories.refetch();
          }}
        />
      ) : !range.data || !categories.data || !month ? (
        <div className="space-y-5">
          <CardSkeleton height={320} />
          <CardSkeleton height={420} />
        </div>
      ) : tab === "overview" ? (
        <Overview
          month={month}
          currentMonth={range.data.current_month}
          firstMonth={range.data.first_month}
          years={range.data.years}
          today={Number(range.data.today.slice(8, 10))}
          categories={categories.list}
          byId={categories.byId}
        />
      ) : (
        <PlannerTab currentMonth={range.data.current_month} categories={categories.list} />
      )}
    </div>
  );
}

function Overview({
  month,
  currentMonth,
  firstMonth,
  years,
  today,
  categories,
  byId,
}: {
  month: string;
  currentMonth: string;
  firstMonth: string | null;
  years: number[];
  today: number;
  categories: ReturnType<typeof useCategories>["list"];
  byId: ReturnType<typeof useCategories>["byId"];
}) {
  const summary = useMonthSummary(month);
  const limits = useSpendingLimits();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Клик по категории в блоке 1 — прокрутка к строке блока 2 и раскрытие подкатегорий.
  function focusCategory(id: number) {
    setExpanded((s) => new Set(s).add(id));
    requestAnimationFrame(() =>
      document.getElementById(`limits-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  const block1Title = (
    <h2 className="text-lg font-bold">
      {month === currentMonth ? "Доходы и расходы сейчас" : `Доходы и расходы за ${monthLower(month)}`}
    </h2>
  );

  return (
    <div className="space-y-5">
      {summary.isError ? (
        <CardError title={block1Title} onRetry={() => void summary.refetch()} />
      ) : !summary.data ? (
        <CardSkeleton height={320} />
      ) : (
        <IncomeExpenseNow month={month} summary={summary.data} categories={categories} byId={byId} onCategoryClick={focusCategory} />
      )}

      {summary.isError || limits.isError ? (
        <CardError
          title={<h2 className="text-lg font-bold">Расходы по категориям и лимиты</h2>}
          onRetry={() => {
            void summary.refetch();
            void limits.refetch();
          }}
        />
      ) : !summary.data || !limits.data ? (
        <CardSkeleton height={420} />
      ) : (
        <CategoryLimitsCard
          month={month}
          currentMonth={currentMonth}
          firstMonth={firstMonth}
          summary={summary.data}
          categories={categories}
          byId={byId}
          limits={limits.data}
          expanded={expanded}
          onToggle={toggle}
        />
      )}

      <DynamicsCard years={years} currentMonth={currentMonth} today={today} categories={categories} byId={byId} />
    </div>
  );
}
