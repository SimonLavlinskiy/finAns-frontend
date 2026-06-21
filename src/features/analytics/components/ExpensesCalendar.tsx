import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDayPopup } from "@/features/analytics/components/CalendarDayPopup";
import { fetchExpensesCalendar } from "@/lib/api";
import { formatKopecks } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarItem, CalendarLevel } from "@/lib/types";

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const MONTH_SHORT = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

function dayLabel(key: string): { num: string; weekday: string } {
  const date = new Date(key + "T00:00:00");
  const num = String(date.getDate());
  const weekday = date
    .toLocaleDateString("ru-RU", { weekday: "short" })
    .replace(".", "");
  return { num, weekday: weekday[0].toUpperCase() + weekday.slice(1) };
}

export function ExpensesCalendar() {
  const now = new Date();
  const [level, setLevel] = useState<CalendarLevel>("day");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
  const chartRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "expenses-calendar", level, year, month],
    queryFn: async () =>
      (await fetchExpensesCalendar(level, year, level === "day" ? month : undefined))
        .data,
  });

  useEffect(() => {
    if (!activeKey) return;
    function onDocPointerDown(e: PointerEvent) {
      if (chartRef.current && !chartRef.current.contains(e.target as Node)) {
        setActiveKey(null);
      }
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [activeKey]);

  if (isLoading || !data) {
    return <div className="surface-card p-5 h-72 animate-pulse" />;
  }

  const items = data.items;
  const maxAmount = Math.max(1, ...items.map((i) => i.amount));

  function openPopup(e: MouseEvent<HTMLElement>, key: string) {
    setActiveKey(key);
    const colRect = e.currentTarget.getBoundingClientRect();
    const containerRect = chartRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const left = colRect.left - containerRect.left + colRect.width / 2;
    const clamped = Math.min(Math.max(left, 128), containerRect.width - 128);
    setPopupStyle({ left: clamped, top: 0 });
  }

  function handleDayClick(e: MouseEvent<HTMLElement>, item: CalendarItem) {
    if (activeKey !== item.key) {
      openPopup(e, item.key);
      return;
    }
    navigate(`/transactions?date_from=${item.key}&date_to=${item.key}`);
  }

  function handleMonthClick(idx: number) {
    setLevel("day");
    setMonth(idx + 1);
    setActiveKey(null);
  }

  function goPrev() {
    setActiveKey(null);
    if (level === "month") {
      setYear((y) => y - 1);
    } else if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNext() {
    setActiveKey(null);
    if (level === "month") {
      setYear((y) => y + 1);
    } else if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const periodLabel =
    level === "month" ? String(year) : `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="surface-card p-5 space-y-4">
      {level === "day" && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          onClick={() => {
            setLevel("month");
            setActiveKey(null);
          }}
        >
          <ChevronLeft className="h-3 w-3" /> К году
        </button>
      )}

      <div ref={chartRef} className="relative flex items-end gap-1 h-56">
        {items.map((item, idx) => {
          const heightPct = item.has_data
            ? Math.max(6, (item.amount / maxAmount) * 100)
            : undefined;
          const isActive = activeKey === item.key;
          const clickable = level === "month" || item.has_data;
          const label =
            level === "month" ? MONTH_SHORT[idx] : dayLabel(item.key).num;
          const sublabel = level === "day" ? dayLabel(item.key).weekday : "";

          return (
            <div
              key={item.key}
              className="relative flex-1 min-w-0 h-full flex flex-col items-center justify-end"
              onMouseEnter={(e) => {
                if (level === "day" && item.has_data) openPopup(e, item.key);
              }}
              onMouseLeave={() =>
                setActiveKey((k) => (k === item.key ? null : k))
              }
            >
              <button
                type="button"
                disabled={!clickable}
                className={cn(
                  "w-full rounded-t-md transition-colors",
                  !item.has_data && "bg-muted-foreground/15 cursor-default",
                  item.has_data && item.is_current && "bg-primary",
                  item.has_data && !item.is_current && "bg-muted-foreground/40 hover:bg-primary/60",
                )}
                style={{ height: item.has_data ? `${heightPct}%` : "4px" }}
                onClick={(e) =>
                  level === "month" ? handleMonthClick(idx) : handleDayClick(e, item)
                }
              />
              <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
                {sublabel}
              </span>
              <span className="text-[11px] font-medium text-foreground truncate w-full text-center">
                {label}
              </span>

              {isActive && level === "day" && item.has_data && (
                <CalendarDayPopup item={item} style={popupStyle} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div>
          <p className="font-semibold text-foreground">{periodLabel}</p>
          <p className="text-sm text-muted-foreground font-mono">
            {formatKopecks(data.total)} ₽
          </p>
        </div>
        <div className="flex gap-2">
          {data.has_previous && (
            <button
              type="button"
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-accent"
              onClick={goPrev}
              title="Назад"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-accent"
            onClick={goNext}
            title="Вперёд"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
