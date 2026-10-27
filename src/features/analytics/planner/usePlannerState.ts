import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { savePlanner } from "@/lib/api";
import type { Planner } from "@/lib/types";
import { analyticsKeys, usePlannerQuery } from "../api";

export type PlannerState = Omit<Planner, "updated_at">;

export const DEFAULT_PLANNER: PlannerState = {
  days: null,
  incomes: [{ name: "", amount: null }],
  payment_overrides: {},
  plans: {},
};

const SAVE_DEBOUNCE_MS = 600;

/**
 * Состояние «Планирования»: локальная копия с мгновенными пересчётами,
 * сохранение на сервер с debounce 600 мс (последняя запись побеждает).
 * При возврате на вкладку свежие данные подтягиваются, если нет несохранённых правок.
 */
export function usePlannerState() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const query = usePlannerQuery();
  const [state, setState] = useState<PlannerState | null>(null);
  const dirty = useRef(false);
  const timer = useRef<number | null>(null);

  const mutation = useMutation({
    mutationFn: (body: PlannerState) => savePlanner(body),
    meta: { skipFinanceInvalidation: true },
    onSuccess: (res) => {
      qc.setQueryData(analyticsKeys.planner, res.data);
    },
    onError: () => showToast("Не удалось сохранить планирование", "error"),
  });

  // Серверные данные → локальное состояние, если пользователь сейчас ничего не правит.
  useEffect(() => {
    if (!query.data || dirty.current) return;
    const { days, incomes, payment_overrides, plans } = query.data;
    setState({ days, incomes: incomes.length ? incomes : DEFAULT_PLANNER.incomes, payment_overrides, plans });
  }, [query.data]);

  const flush = useCallback(
    (next: PlannerState) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        mutation.mutate(next, {
          onSettled: () => {
            if (!timer.current) dirty.current = false;
          },
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [mutation],
  );

  const update = useCallback(
    (fn: (s: PlannerState) => PlannerState) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        dirty.current = true;
        flush(next);
        return next;
      });
    },
    [flush],
  );

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return { query, state, update };
}
