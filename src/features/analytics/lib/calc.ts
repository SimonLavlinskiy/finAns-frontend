/** Чистые формулы раздела «Аналитика» (раздел 8 ТЗ). Все суммы — в копейках. */

// --- Полоса бюджета ---

export type BarCategory = { id: number; label: string; color: string; amount: number };

export type BarPiece =
  | { kind: "category"; id: number; label: string; color: string; amount: number; width: number }
  | { kind: "free"; amount: number; width: number }
  | { kind: "over"; amount: number; width: number };

export type BarLayout = {
  state: "empty" | "free" | "equal" | "over";
  pieces: BarPiece[];
  /** Позиция черты перерасхода в %, null — черты нет. */
  dividerAt: number | null;
};

/**
 * Геометрия полосы: категории по убыванию суммы, затем «Свободно» или «Перерасход».
 * E < I — 100 % = I; E = I — только категории; E > I — 100 % = E, категория на границе
 * дохода режется, после неё черта и красный «Перерасход» шириной (E − I) / E.
 */
export function computeBarLayout(income: number, categories: BarCategory[]): BarLayout {
  const cats = categories.filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);
  const expense = cats.reduce((s, c) => s + c.amount, 0);

  if (income <= 0 && expense <= 0) return { state: "empty", pieces: [], dividerAt: null };

  if (expense < income) {
    const pieces: BarPiece[] = cats.map((c) => ({ kind: "category", ...c, width: (c.amount / income) * 100 }));
    pieces.push({ kind: "free", amount: income - expense, width: ((income - expense) / income) * 100 });
    return { state: "free", pieces, dividerAt: null };
  }

  if (expense === income) {
    return {
      state: "equal",
      pieces: cats.map((c) => ({ kind: "category", ...c, width: (c.amount / income) * 100 })),
      dividerAt: null,
    };
  }

  const pieces: BarPiece[] = [];
  let acc = 0;
  for (const c of cats) {
    if (acc >= income) break;
    const inside = Math.min(c.amount, income - acc);
    pieces.push({ kind: "category", ...c, width: (inside / expense) * 100 });
    acc += inside;
  }
  pieces.push({ kind: "over", amount: expense - income, width: ((expense - income) / expense) * 100 });
  return { state: "over", pieces, dividerAt: income > 0 ? (income / expense) * 100 : null };
}

// --- Блок 1 ---

/** Можно тратить в день: max(0, (I − E) / D), D = дней до конца месяца включая сегодня. */
export function spendPerDay(income: number, expense: number, today: number, daysInMonth: number): number {
  const days = daysInMonth - today + 1;
  if (days <= 0) return 0;
  return Math.max(0, (income - expense) / days);
}

// --- Блок 2: лимиты ---

export type LimitRow = { categoryId: number; spent: number; limit: number | null };

export type LimitsSummary = {
  limitsTotal: number;
  limitedCount: number;
  spentInLimits: number;
  overCount: number;
  overSum: number;
};

export function summarizeLimits(rows: LimitRow[]): LimitsSummary {
  const s: LimitsSummary = { limitsTotal: 0, limitedCount: 0, spentInLimits: 0, overCount: 0, overSum: 0 };
  for (const r of rows) {
    if (r.limit === null) continue;
    s.limitsTotal += r.limit;
    s.limitedCount++;
    s.spentInLimits += r.spent;
    if (r.spent > r.limit) {
      s.overCount++;
      s.overSum += r.spent - r.limit;
    }
  }
  return s;
}

export type LimitSortMode = "fill" | "amount";

/**
 * «По заполнению лимита»: сначала с лимитом по убыванию потрачено/лимит, затем без лимита
 * по убыванию суммы. «По сумме»: по убыванию расхода.
 */
export function sortLimitRows<T extends LimitRow>(rows: T[], mode: LimitSortMode): T[] {
  const copy = [...rows];
  if (mode === "amount") return copy.sort((a, b) => b.spent - a.spent);
  return copy.sort((a, b) => {
    const al = a.limit !== null && a.limit > 0;
    const bl = b.limit !== null && b.limit > 0;
    if (al && bl) return b.spent / b.limit! - a.spent / a.limit!;
    if (al !== bl) return al ? -1 : 1;
    return b.spent - a.spent;
  });
}

/** Среднее за 3 месяца, округлённое до 100 ₽ (10 000 коп.). */
export function averageRoundedTo100Rub(amounts: number[]): number {
  if (amounts.length === 0) return 0;
  const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  return Math.round(avg / 10_000) * 10_000;
}

/** Ширины полосы заполнения лимита: заливка, черта и красный хвост, всё в пределах 100 %. */
export function limitFill(spent: number, limit: number): { fill: number; over: number } {
  if (limit <= 0) return { fill: 0, over: 0 };
  if (spent <= limit) return { fill: (spent / limit) * 100, over: 0 };
  const fill = (limit / spent) * 100;
  return { fill, over: 100 - fill };
}

// --- Блок 3: динамика ---

export type MonthTotals = { month: string; income: number; expense: number; is_current: boolean };

export function yearTotals(months: MonthTotals[]) {
  const income = months.reduce((s, m) => s + m.income, 0);
  const expense = months.reduce((s, m) => s + m.expense, 0);
  const done = months.filter((m) => !m.is_current);
  const avgIncome = done.length ? done.reduce((s, m) => s + m.income, 0) / done.length : null;
  const avgExpense = done.length ? done.reduce((s, m) => s + m.expense, 0) / done.length : null;
  const net = income - expense;
  return {
    income,
    expense,
    net,
    savedPercent: income > 0 ? Math.round((net / income) * 100) : null,
    avgIncome,
    avgExpense,
    avgNet: avgIncome !== null && avgExpense !== null ? avgIncome - avgExpense : null,
  };
}

/**
 * Выделение строк месяцев: максимум две, третья вытесняет более раннюю,
 * повторный клик снимает выделение. Возвращает новое выделение (в порядке выбора).
 */
export function toggleMonthSelection(selected: string[], month: string): string[] {
  if (selected.includes(month)) return selected.filter((m) => m !== month);
  return [...selected, month].slice(-2);
}

/**
 * Сравнение: новый выделенный месяц заменяет из двух сравниваемых тот, что выбран раньше.
 * pair — [первый, второй], order — порядок выбора (индексы pair от старого к новому).
 */
export function pushComparison(pair: [string, string], order: [0 | 1, 0 | 1], month: string): { pair: [string, string]; order: [0 | 1, 0 | 1] } {
  if (pair.includes(month)) return { pair, order };
  const older = order[0];
  const next: [string, string] = [...pair] as [string, string];
  next[older] = month;
  return { pair: next, order: [order[1], older] };
}

export type DiffTone = "positive" | "negative" | "zero";

/** Цвет разницы: для дохода и итога плюс — хорошо; для расхода и категорий плюс — плохо. */
export function diffTone(diff: number, higherIsBetter: boolean): DiffTone {
  const rub = Math.round(diff / 100);
  if (rub === 0) return "zero";
  return (rub > 0) === higherIsBetter ? "positive" : "negative";
}

// --- Планирование ---

export type PlannerPayment = { id: number; categoryId: number; amount: number };
export type PlannerCategory = { id: number };

export type PlannerResult = {
  income: number;
  minByCategory: Record<number, number>;
  effectiveByCategory: Record<number, number>;
  expense: number;
  regular: number;
  planned: number;
  free: number;
  perDay: number | null;
};

export function computePlanner(input: {
  incomes: (number | null)[];
  payments: PlannerPayment[];
  categories: PlannerCategory[];
  plans: Record<number, number | undefined>;
  days: number;
}): PlannerResult {
  const income = input.incomes.reduce<number>((s, a) => s + (a ?? 0), 0);
  const regular = input.payments.reduce((s, p) => s + p.amount, 0);

  const minByCategory: Record<number, number> = {};
  for (const p of input.payments) minByCategory[p.categoryId] = (minByCategory[p.categoryId] ?? 0) + p.amount;

  const effectiveByCategory: Record<number, number> = {};
  let expense = 0;
  for (const c of input.categories) {
    const eff = Math.max(input.plans[c.id] ?? 0, minByCategory[c.id] ?? 0);
    effectiveByCategory[c.id] = eff;
    expense += eff;
  }

  const free = income - expense;
  return {
    income,
    minByCategory,
    effectiveByCategory,
    expense,
    regular,
    planned: expense - regular,
    free,
    perDay: free > 0 && input.days > 0 ? free / input.days : null,
  };
}
