import { useQuery } from "@tanstack/react-query";
import {
  fetchAnalyticsRange,
  fetchMandatoryPayments,
  fetchMonthSummary,
  fetchPlanner,
  fetchSpendingLimits,
  fetchTags,
  fetchYearSummary,
} from "@/lib/api";
import type { Tag, TagKind } from "@/lib/types";

export const analyticsKeys = {
  range: ["analytics", "range"] as const,
  month: (m: string) => ["analytics", "month", m] as const,
  year: (y: number) => ["analytics", "year", y] as const,
  tagsWithDeleted: ["tags", { includeDeleted: true }] as const,
  limits: ["spending-limits"] as const,
  planner: ["planner"] as const,
  payments: ["mandatory-payments"] as const,
};

export function useAnalyticsRange() {
  return useQuery({ queryKey: analyticsKeys.range, queryFn: async () => (await fetchAnalyticsRange()).data });
}

export function useMonthSummary(month: string | null) {
  return useQuery({
    queryKey: analyticsKeys.month(month ?? ""),
    queryFn: async () => (await fetchMonthSummary(month!)).data,
    enabled: !!month,
  });
}

export function useYearSummary(year: number | null) {
  return useQuery({
    queryKey: analyticsKeys.year(year ?? 0),
    queryFn: async () => (await fetchYearSummary(year!)).data,
    enabled: !!year,
  });
}

export function useSpendingLimits() {
  return useQuery({ queryKey: analyticsKeys.limits, queryFn: async () => (await fetchSpendingLimits()).data });
}

export function usePlannerQuery() {
  return useQuery({ queryKey: analyticsKeys.planner, queryFn: async () => (await fetchPlanner()).data });
}

export function useMandatoryPayments() {
  return useQuery({ queryKey: analyticsKeys.payments, queryFn: async () => (await fetchMandatoryPayments()).data });
}

/** Категория верхнего уровня с подкатегориями — из настроек проекта. */
export type Category = {
  id: number;
  name: string;
  color: string;
  kind: TagKind;
  order: number;
  created_at?: string;
  deleted_at?: string | null;
  subcategories: Map<number, string>;
};

function collectSubcategories(tag: Tag, out: Map<number, string>) {
  for (const child of tag.children ?? []) {
    out.set(child.id, child.name);
    collectSubcategories(child, out);
  }
}

export function buildCategories(tags: Tag[]): Category[] {
  return tags.map((t, i) => {
    const subcategories = new Map<number, string>();
    collectSubcategories(t, subcategories);
    return {
      id: t.id,
      name: t.name,
      color: t.color,
      kind: t.kind ?? "expense",
      order: t.order ?? i,
      created_at: t.created_at,
      deleted_at: t.deleted_at ?? null,
      subcategories,
    };
  });
}

/** Все категории проекта, включая мягко удалённые (для прошлых месяцев). */
export function useCategories() {
  const q = useQuery({
    queryKey: analyticsKeys.tagsWithDeleted,
    queryFn: async () => (await fetchTags({ includeDeleted: true })).data,
  });
  const list = q.data ? buildCategories(q.data) : [];
  const byId = new Map(list.map((c) => [c.id, c]));
  return { ...q, list, byId };
}
