import type { QueryClient } from "@tanstack/react-query";

/** Ключи, которые пересчитываются после любого изменения данных проекта. */
export const FINANCE_QUERY_KEYS = [["analytics"], ["tags"], ["spending-limits"], ["planner"], ["mandatory-payments"]] as const;

/**
 * Сбрасывает кэш раздела «Аналитика» и связанных данных. Вызывается глобально
 * из MutationCache после каждой успешной мутации (операции, категории, лимиты,
 * регулярные платежи, импорт), чтобы аналитика пересчитывалась без перезагрузки.
 * Мутация может отказаться через `meta: { skipFinanceInvalidation: true }`.
 */
export function invalidateFinanceData(qc: QueryClient) {
  for (const queryKey of FINANCE_QUERY_KEYS) {
    void qc.invalidateQueries({ queryKey: [...queryKey] });
  }
}
