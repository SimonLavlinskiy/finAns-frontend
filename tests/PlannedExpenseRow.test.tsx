import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlannedExpenseRow } from "../src/features/planned-expenses/components/PlannedExpenseRow";
import type { PlannedExpense } from "../src/lib/types";

vi.mock("../src/lib/api", () => ({
  completePlannedExpense: vi.fn(),
  deletePlannedExpense: vi.fn(),
}));

function makeItem(overrides: Partial<PlannedExpense> = {}): PlannedExpense {
  return {
    id: 1,
    category_id: 1,
    title: "Тестовый расход",
    cost_kopecks: null,
    due_date: null,
    url: null,
    priority: "medium",
    effective_priority: "medium",
    is_due_soon: false,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("PlannedExpenseRow", () => {
  it("рендерит название", () => {
    render(
      <Wrapper>
        <PlannedExpenseRow
          item={makeItem()}
          textColor="#ffffff"
          onEdit={() => {}}
        />
      </Wrapper>,
    );
    expect(screen.getByText("Тестовый расход")).toBeInTheDocument();
  });

  it("без стоимости — нет текста с ₽", () => {
    render(
      <Wrapper>
        <PlannedExpenseRow
          item={makeItem({ cost_kopecks: null })}
          textColor="#ffffff"
          onEdit={() => {}}
        />
      </Wrapper>,
    );
    expect(screen.queryByText(/₽/)).toBeNull();
  });

  it("без даты — нет элемента с датой", () => {
    render(
      <Wrapper>
        <PlannedExpenseRow
          item={makeItem({ due_date: null })}
          textColor="#ffffff"
          onEdit={() => {}}
        />
      </Wrapper>,
    );
    expect(screen.queryByText(/\d{4}-\d{2}-\d{2}/)).toBeNull();
  });

  it("со стоимостью — показывает сумму", () => {
    render(
      <Wrapper>
        <PlannedExpenseRow
          item={makeItem({ cost_kopecks: 150000 })}
          textColor="#ffffff"
          onEdit={() => {}}
        />
      </Wrapper>,
    );
    expect(screen.getByText(/1\s*500/)).toBeInTheDocument();
  });

  it("с url — название в теге <a> с target=_blank", () => {
    render(
      <Wrapper>
        <PlannedExpenseRow
          item={makeItem({ url: "https://example.com" })}
          textColor="#ffffff"
          onEdit={() => {}}
        />
      </Wrapper>,
    );
    const link = screen.getByRole("link", { name: "Тестовый расход" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("без url — название не является ссылкой", () => {
    render(
      <Wrapper>
        <PlannedExpenseRow
          item={makeItem({ url: null })}
          textColor="#ffffff"
          onEdit={() => {}}
        />
      </Wrapper>,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Тестовый расход")).toBeInTheDocument();
  });
});
