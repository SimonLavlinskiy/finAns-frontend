import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "../src/components/ui/tooltip";
import type { Category } from "../src/features/analytics/api";
import { DynamicsCard } from "../src/features/analytics/dynamics/DynamicsCard";
import { CategoryLimitsCard } from "../src/features/analytics/overview/CategoryLimitsCard";
import { IncomeExpenseNow } from "../src/features/analytics/overview/IncomeExpenseNow";
import { BudgetBar } from "../src/features/analytics/shared/BudgetBar";
import { Dropdown } from "../src/features/analytics/shared/Dropdown";
import type { MonthSummary } from "../src/lib/types";

vi.mock("../src/lib/api", () => ({
  fetchMonthSummary: vi.fn(async (m: string) => ({
    data: { month: m, is_current: m === "2026-10", today: 18, days_in_month: 31, income: 0, expense: 0, categories: [] },
  })),
  fetchYearSummary: vi.fn(async (y: number) => ({
    data: {
      year: y,
      months: [
        { month: `${y}-08`, income: 10_000_000, expense: 9_000_000, is_current: false },
        { month: `${y}-09`, income: 10_000_000, expense: 11_000_000, is_current: false },
        { month: `${y}-10`, income: 5_000_000, expense: 1_000_000, is_current: true },
      ],
    },
  })),
  upsertCategoryLimit: vi.fn(),
  deleteCategoryLimit: vi.fn(),
}));

// testing-library нормализует пробельные символы (в т.ч. неразрывные) в обычный пробел.
const rub = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>,
  );
}

function cat(id: number, name: string, extra: Partial<Category> = {}): Category {
  return { id, name, color: "#123456", kind: "expense", order: id, subcategories: new Map(), ...extra };
}

const cats = [cat(1, "Еда", { subcategories: new Map([[11, "Кафе"]]) }), cat(2, "Жильё"), cat(3, "Спорт"), cat(9, "Зарплата", { kind: "income" })];
const byId = new Map(cats.map((c) => [c.id, c]));

function summary(over: Partial<MonthSummary> = {}): MonthSummary {
  return {
    month: "2026-10",
    is_current: true,
    today: 18,
    days_in_month: 31,
    income: 10_000_000,
    expense: 6_100_000,
    categories: [
      { category_id: 2, amount: 4_000_000, subcategories: [{ subcategory_id: null, amount: 4_000_000, all_mandatory: true }] },
      {
        category_id: 1,
        amount: 2_100_000,
        subcategories: [
          { subcategory_id: null, amount: 1_400_000, all_mandatory: false },
          { subcategory_id: 11, amount: 700_000, all_mandatory: false },
        ],
      },
    ],
    ...over,
  };
}

describe("BudgetBar", () => {
  it("перерасход: черта внутри полосы перед красным сегментом", () => {
    const { container } = wrap(
      <BudgetBar income={100} categories={[{ id: 1, label: "Еда", color: "#000", amount: 150 }]} />,
    );
    const pieces = container.querySelectorAll('[role="img"] > *');
    expect(pieces).toHaveLength(2);
    const over = pieces[1] as HTMLElement;
    expect(over.style.borderLeft).toContain("3px solid");
    expect(over.style.marginLeft).toBe("0px");
  });

  it("клик по сегменту категории вызывает обработчик", () => {
    const onClick = vi.fn();
    wrap(<BudgetBar income={1000} categories={[{ id: 7, label: "Еда", color: "#000", amount: 100 }]} onCategoryClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: /Еда/ }));
    expect(onClick).toHaveBeenCalledWith(7);
  });
});

describe("IncomeExpenseNow", () => {
  it("текущий месяц: цифры, «Можно тратить в день», без доходной категории", () => {
    wrap(<IncomeExpenseNow month="2026-10" summary={summary()} categories={cats} byId={byId} onCategoryClick={() => {}} />);
    expect(screen.getByText("Доходы и расходы сейчас")).toBeInTheDocument();
    expect(screen.getByText("Можно тратить в день")).toBeInTheDocument();
    expect(screen.getByText(rub(2786))).toBeInTheDocument(); // (100 000 − 61 000) / 14
    expect(screen.queryByText("Зарплата")).not.toBeInTheDocument();
    expect(screen.queryByText("Спорт")).not.toBeInTheDocument(); // без трат — не в списке
  });

  it("прошлый месяц с перерасходом: заголовок «за …», строка «Перерасход», без «в день»", () => {
    wrap(
      <IncomeExpenseNow
        month="2026-09"
        summary={summary({ month: "2026-09", is_current: false, today: null, income: 5_000_000 })}
        categories={cats}
        byId={byId}
        onCategoryClick={() => {}}
      />,
    );
    expect(screen.getByText("Доходы и расходы за сентябрь")).toBeInTheDocument();
    expect(screen.getAllByText("Перерасход").length).toBeGreaterThan(0);
    expect(screen.queryByText("Можно тратить в день")).not.toBeInTheDocument();
  });

  it("пустой месяц", () => {
    wrap(
      <IncomeExpenseNow
        month="2026-10"
        summary={summary({ income: 0, expense: 0, categories: [] })}
        categories={cats}
        byId={byId}
        onCategoryClick={() => {}}
      />,
    );
    expect(screen.getByText("В этом месяце пока нет операций")).toBeInTheDocument();
  });
});

describe("CategoryLimitsCard", () => {
  function Harness() {
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    return (
      <CategoryLimitsCard
        month="2026-10"
        currentMonth="2026-10"
        firstMonth="2026-01"
        summary={summary()}
        categories={cats}
        byId={byId}
        limits={[
          { id: 1, tag_id: 1, category_id: 1, tag: { id: 1, name: "Еда", color: "#000" }, amount: 1_500_000, spent: 0, period_type: "month", period_start: null, period_end: null },
        ]}
        expanded={expanded}
        onToggle={(id) => setExpanded((s) => new Set(s).add(id))}
      />
    );
  }

  it("все расходные категории, превышение красным, сортировка по заполнению", () => {
    wrap(<Harness />);
    const desktopRows = document.querySelectorAll("li[id^='limits-row-']");
    expect([...desktopRows].map((r) => r.id)).toEqual(["limits-row-1", "limits-row-2", "limits-row-3"]);
    expect(screen.getAllByText(`\u2212${rub(6000)}`).length).toBeGreaterThan(0); // 15 000 − 21 000
    expect(screen.getByText("Лимит превышен")).toBeInTheDocument();
    expect(screen.getByText("1 категория")).toBeInTheDocument();
    expect(screen.queryByText("Зарплата")).not.toBeInTheDocument();
  });

  it("раскрытие подкатегорий и пустая категория", () => {
    wrap(<Harness />);
    const row = document.getElementById("limits-row-1")!;
    fireEvent.click(within(row).getAllByRole("button", { expanded: false })[0]);
    expect(within(row).getByText("Кафе")).toBeInTheDocument();
    expect(within(row).getByText("Без подкатегории")).toBeInTheDocument();

    const sport = document.getElementById("limits-row-3")!;
    fireEvent.click(within(sport).getAllByRole("button", { expanded: false })[0]);
    expect(within(sport).getByText("В октябре трат не было")).toBeInTheDocument();
  });
});

describe("Dropdown", () => {
  it("клавиатура: ↓ ↓ Enter выбирает пункт и закрывает список; Esc закрывает", () => {
    const onChange = vi.fn();
    wrap(
      <Dropdown
        ariaLabel="Месяц"
        value="a"
        onChange={onChange}
        options={[
          { value: "a", label: "Январь" },
          { value: "b", label: "Февраль" },
          { value: "c", label: "Март" },
        ]}
      />,
    );
    const button = screen.getByRole("button", { name: /Месяц/ });
    expect(button).toHaveAttribute("aria-haspopup", "listbox");
    fireEvent.click(button);
    const list = screen.getByRole("listbox");
    expect(screen.getByRole("option", { name: "Январь" })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(list, { key: "ArrowDown" });
    fireEvent.keyDown(list, { key: "ArrowDown" });
    fireEvent.keyDown(list, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("c");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.click(button);
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("DynamicsCard", () => {
  it("выделение: по умолчанию прошлый и текущий; повторный клик снимает, сравнение не меняется", async () => {
    wrap(<DynamicsCard years={[2026]} currentMonth="2026-10" today={18} categories={cats} byId={byId} />);
    const sep = await screen.findByRole("button", { name: /^Сентябрь/ });
    const oct = screen.getByRole("button", { name: /^Октябрь/ });
    expect(sep).toHaveAttribute("aria-pressed", "true");
    expect(oct).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("идёт")).toBeInTheDocument();
    expect(await screen.findByText(/октябрь ещё идёт: данные за 1–18 октября/)).toBeInTheDocument();

    fireEvent.click(sep);
    fireEvent.keyDown(oct, { key: " " });
    expect(sep).toHaveAttribute("aria-pressed", "false");
    expect(oct).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Сентябрь 2026")).toBeInTheDocument(); // сравнение осталось
  });
});
