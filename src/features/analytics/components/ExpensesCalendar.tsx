import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDayPopup } from "@/features/analytics/components/CalendarDayPopup";
import { fetchExpensesCalendar } from "@/lib/api";
import { formatKopecks } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarLevel } from "@/lib/types";

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const MONTH_SHORT = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

const POPUP_HALF_WIDTH = 128;
const VIEWPORT_MARGIN = 8;

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["analytics", "expenses-calendar", level, year, month],
    queryFn: async () =>
      (await fetchExpensesCalendar(level, year, level === "day" ? month : undefined))
        .data,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!activeKey && !pickerOpen) return;
    function onDocPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (chartRef.current && !chartRef.current.contains(target)) {
        setActiveKey(null);
      }
      if (pickerRef.current && !pickerRef.current.contains(target)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [activeKey, pickerOpen]);

  if (isLoading || !data) {
    return <div className="surface-card p-5 h-72 animate-pulse" />;
  }

  const items = data.items;
  const maxAmount = Math.max(1, ...items.map((i) => i.amount));
  const activeItem = items.find((i) => i.key === activeKey);

  function openPopup(e: MouseEvent<HTMLElement>, key: string) {
    setActiveKey(key);
    const colRect = e.currentTarget.getBoundingClientRect();
    const containerRect = chartRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const centerXViewport = colRect.left + colRect.width / 2;
    const clampedViewport = Math.min(
      Math.max(centerXViewport, POPUP_HALF_WIDTH + VIEWPORT_MARGIN),
      window.innerWidth - POPUP_HALF_WIDTH - VIEWPORT_MARGIN,
    );
    setPopupStyle({ left: clampedViewport - containerRect.left, top: 0 });
  }

  function handleDayClick(e: MouseEvent<HTMLElement>, item: { key: string; has_data: boolean }) {
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

  function goToday() {
    setActiveKey(null);
    setPickerOpen(false);
    setLevel("day");
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  }

  const isToday = level === "day" && year === now.getFullYear() && month === now.getMonth() + 1;
  const periodLabel =
    level === "month" ? String(year) : `${MONTH_NAMES[month - 1]} ${year}`;
  const yearOptions = Array.from({ length: 8 }, (_, i) => now.getFullYear() - 6 + i);

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
          const clickable = level === "month" || item.has_data;
          const label =
            level === "month" ? MONTH_SHORT[idx] : dayLabel(item.key).num;
          const sublabel = level === "day" ? dayLabel(item.key).weekday : "";

          return (
            <div
              key={item.key}
              className="flex-1 min-w-0 h-full flex flex-col items-center justify-end"
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
            </div>
          );
        })}

        {activeItem && level === "day" && activeItem.has_data && (
          <CalendarDayPopup item={activeItem} style={popupStyle} />
        )}
      </div>

      <div
        className={cn(
          "flex items-center justify-between pt-2 border-t transition-opacity",
          isFetching && "opacity-60",
        )}
      >
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            className="flex items-center gap-1 font-semibold text-foreground hover:text-primary"
            onClick={() => setPickerOpen((o) => !o)}
          >
            {periodLabel}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <p className="text-sm text-muted-foreground font-mono">
            {formatKopecks(data.total)} ₽
          </p>

          {pickerOpen && (
            <div className="absolute bottom-full left-0 mb-2 z-30 w-56 rounded-2xl border bg-card p-3 soft-shadow-lg space-y-2">
              {!isToday && (
                <button
                  type="button"
                  className="pill-filter pill-filter-active w-full text-center"
                  onClick={goToday}
                >
                  Сегодня
                </button>
              )}
              {level === "day" && (
                <div className="grid grid-cols-3 gap-1">
                  {MONTH_SHORT.map((m, idx) => (
                    <button
                      key={m}
                      type="button"
                      className={cn(
                        "pill-filter text-center text-xs",
                        month === idx + 1 ? "pill-filter-active" : "pill-filter-inactive",
                      )}
                      onClick={() => {
                        setMonth(idx + 1);
                        setPickerOpen(false);
                        setActiveKey(null);
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
              <select
                className="w-full rounded-xl border bg-background px-2 py-1.5 text-sm"
                value={year}
                onChange={(e) => {
                  setYear(Number(e.target.value));
                  setPickerOpen(false);
                  setActiveKey(null);
                }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {data.has_previous && (
            <button
              type="button"
              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent"
              onClick={goPrev}
              title="Назад"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent"
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
