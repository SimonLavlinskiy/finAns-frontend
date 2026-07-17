import type {
  AcceptedTransaction,
  Balance,
  BalanceForecast,
  CalendarLevel,
  CalendarResponse,
  CreateMandatoryPaymentInput,
  CreatePlannedExpenseInput,
  CreateSpendingLimitInput,
  CreateTransactionInput,
  FixedCostRatio,
  FreedomIndexPoint,
  ImportBatchWithRows,
  Insight,
  MandatoryPayment,
  ModerationRow,
  MoodDay,
  PaginatedMeta,
  PeriodComparisonEntry,
  PlannedExpense,
  PlannedExpenseCategoryWithItems,
  Project,
  ProjectMember,
  ProjectWithMembers,
  SankeyData,
  SavingsGoal,
  SpendingLimit,
  Tag,
  Transaction,
  TransactionSuggestion,
  UpdatePlannedExpenseInput,
  User,
} from "./types";
import { apiClient, apiUpload } from "./api-client";

type DataResponse<T> = { data: T };
type ListResponse<T> = { data: T; meta: PaginatedMeta };

export type TransactionFilters = {
  search?: string;
  category?: string;
  specificity?: string;
  tag_ids?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: string;
};

function toQuery(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  const q = params.toString();
  return q ? `?${q}` : "";
}

export function fetchTransactions(filters: TransactionFilters = {}) {
  return apiClient<ListResponse<Transaction[]>>(
    `/api/v1/transactions${toQuery(filters)}`,
  );
}

export function fetchTransaction(id: number) {
  return apiClient<DataResponse<Transaction>>(`/api/v1/transactions/${id}`);
}

export function createTransaction(body: CreateTransactionInput) {
  return apiClient<DataResponse<Transaction>>("/api/v1/transactions", {
    method: "POST",
    body,
  });
}

export function updateTransaction(id: number, body: CreateTransactionInput) {
  return apiClient<DataResponse<Transaction>>(`/api/v1/transactions/${id}`, {
    method: "PUT",
    body,
  });
}

export function deleteTransaction(id: number) {
  return apiClient<void>(`/api/v1/transactions/${id}`, { method: "DELETE" });
}

export function duplicateTransaction(id: number) {
  return apiClient<DataResponse<Transaction>>(
    `/api/v1/transactions/${id}/duplicate`,
    { method: "POST" },
  );
}

export function fetchTags() {
  return apiClient<DataResponse<Tag[]>>("/api/v1/tags");
}

export function createTag(body: {
  name: string;
  color: string;
  parent_id?: number | null;
}) {
  return apiClient<DataResponse<Tag>>("/api/v1/tags", { method: "POST", body });
}

export function updateTag(id: number, body: { name: string; color: string }) {
  return apiClient<DataResponse<Tag>>(`/api/v1/tags/${id}`, {
    method: "PUT",
    body,
  });
}

export function deleteTag(id: number, cascade = false) {
  return apiClient<void>(
    `/api/v1/tags/${id}${cascade ? "?cascade=true" : ""}`,
    { method: "DELETE" },
  );
}

export function fetchBalance() {
  return apiClient<DataResponse<Balance>>("/api/v1/balance");
}

export function updateBalance(balance: number) {
  return apiClient<DataResponse<Balance>>("/api/v1/balance", {
    method: "PUT",
    body: { balance },
  });
}

export function fetchSuggestions(q: string) {
  return apiClient<DataResponse<TransactionSuggestion[]>>(
    `/api/v1/transactions/suggestions?q=${encodeURIComponent(q)}`,
  );
}

export function login(payload: { username: string; password: string }) {
  return apiClient<DataResponse<User>>("/api/v1/auth/login", { method: "POST", body: payload });
}

export function fetchUsers() {
  return apiClient<DataResponse<User[]>>("/api/v1/users");
}

export function createUser(payload: { username: string; display_name: string; password: string }) {
  return apiClient<DataResponse<User>>("/api/v1/users", { method: "POST", body: payload });
}

export function fetchProjects() {
  return apiClient<DataResponse<Project[]>>("/api/v1/projects");
}

export function createProject(payload: {
  name: string;
  initial_balance_kopecks?: number;
  started_at?: string | null;
}) {
  return apiClient<DataResponse<Project>>("/api/v1/projects", { method: "POST", body: payload });
}

export function fetchProject(id: number) {
  return apiClient<DataResponse<ProjectWithMembers>>(`/api/v1/projects/${id}`);
}

export function fetchProjectMembers(id: number) {
  return apiClient<DataResponse<ProjectMember[]>>(`/api/v1/projects/${id}/members`);
}

export function addProjectMember(projectId: number, username: string) {
  return apiClient<void>(`/api/v1/projects/${projectId}/members`, {
    method: "POST",
    body: { username },
  });
}

export function removeProjectMember(projectId: number, userId: number) {
  return apiClient<void>(`/api/v1/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}

export type UpdateModerationRowInput = Partial<{
  title: string;
  amount: string;
  date: string;
  tag_id: number;
  category: string;
  specificity: string;
  comment: string;
  url: string;
}>;

export function uploadImportBatch(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<DataResponse<ImportBatchWithRows>>(
    "/api/v1/import/batches",
    formData,
  );
}

export async function fetchActiveImportBatch() {
  const res = await apiClient<DataResponse<ImportBatchWithRows> | undefined>(
    "/api/v1/import/batches/active",
  );
  return res ?? null;
}

export function updateModerationRow(id: number, patch: UpdateModerationRowInput) {
  return apiClient<DataResponse<ModerationRow>>(`/api/v1/import/rows/${id}`, {
    method: "PATCH",
    body: patch,
  });
}

export function acceptModerationRow(id: number) {
  return apiClient<DataResponse<AcceptedTransaction>>(
    `/api/v1/import/rows/${id}/accept`,
    { method: "POST" },
  );
}

export function acceptModerationBatch(batchId: number, rowIds: number[]) {
  return apiClient<DataResponse<AcceptedTransaction[]>>(
    `/api/v1/import/batches/${batchId}/accept`,
    { method: "POST", body: { row_ids: rowIds } },
  );
}

export function closeImportBatch(batchId: number) {
  return apiClient<void>(`/api/v1/import/batches/${batchId}/close`, {
    method: "POST",
  });
}

export function fetchMandatoryPayments() {
  return apiClient<DataResponse<MandatoryPayment[]>>("/api/v1/mandatory-payments");
}

export function createMandatoryPayment(body: CreateMandatoryPaymentInput) {
  return apiClient<DataResponse<MandatoryPayment>>("/api/v1/mandatory-payments", {
    method: "POST",
    body,
  });
}

export function updateMandatoryPayment(id: number, body: CreateMandatoryPaymentInput) {
  return apiClient<DataResponse<MandatoryPayment>>(`/api/v1/mandatory-payments/${id}`, {
    method: "PUT",
    body,
  });
}

export function deleteMandatoryPayment(id: number) {
  return apiClient<void>(`/api/v1/mandatory-payments/${id}`, { method: "DELETE" });
}

export function duplicateMandatoryPayment(id: number) {
  return apiClient<DataResponse<MandatoryPayment>>(
    `/api/v1/mandatory-payments/${id}/duplicate`,
    { method: "POST" },
  );
}

export function markMandatoryPaymentPaid(id: number) {
  return apiClient<DataResponse<MandatoryPayment>>(
    `/api/v1/mandatory-payments/${id}/mark-paid`,
    { method: "POST" },
  );
}

export function unmarkMandatoryPaymentPaid(id: number) {
  return apiClient<DataResponse<MandatoryPayment>>(
    `/api/v1/mandatory-payments/${id}/unmark-paid`,
    { method: "POST" },
  );
}

export function fetchExpensesCalendar(
  level: CalendarLevel,
  year: number,
  month?: number,
) {
  const params = new URLSearchParams({ level, year: String(year) });
  if (level === "day" && month !== undefined) {
    params.set("month", String(month));
  }
  return apiClient<DataResponse<CalendarResponse>>(
    `/api/v1/analytics/expenses-calendar?${params.toString()}`,
  );
}

export function fetchFreedomIndex(months = 12) {
  return apiClient<DataResponse<FreedomIndexPoint[]>>(
    `/api/v1/analytics/freedom-index?months=${months}`,
  );
}

export function fetchFixedCostRatio(year: number, month: number) {
  return apiClient<DataResponse<FixedCostRatio>>(
    `/api/v1/analytics/fixed-cost-ratio?year=${year}&month=${month}`,
  );
}

export function fetchIncomeExpenseSankey(
  level: CalendarLevel,
  year: number,
  month?: number,
) {
  const params = new URLSearchParams({ level, year: String(year) });
  if (month !== undefined) {
    params.set("month", String(month));
  }
  return apiClient<DataResponse<SankeyData>>(
    `/api/v1/analytics/income-expense-sankey?${params.toString()}`,
  );
}

export function fetchBalanceForecast(days: 30 | 60 | 90) {
  return apiClient<DataResponse<BalanceForecast>>(
    `/api/v1/analytics/balance-forecast?days=${days}`,
  );
}

export function fetchSavingsGoals() {
  return apiClient<DataResponse<SavingsGoal[]>>("/api/v1/analytics/savings-goals");
}

export function fetchSpendingMoodCalendar(year: number, month: number) {
  return apiClient<DataResponse<MoodDay[]>>(
    `/api/v1/analytics/spending-mood-calendar?year=${year}&month=${month}`,
  );
}

export function fetchInsights() {
  return apiClient<DataResponse<Insight[]>>("/api/v1/analytics/insights");
}

export function fetchPeriodComparison(mode: "prev_month" | "prev_year") {
  return apiClient<DataResponse<PeriodComparisonEntry[]>>(
    `/api/v1/analytics/period-comparison?mode=${mode}`,
  );
}

export function fetchSpendingLimits() {
  return apiClient<DataResponse<SpendingLimit[]>>("/api/v1/spending-limits");
}

export function createSpendingLimit(payload: CreateSpendingLimitInput) {
  return apiClient<DataResponse<SpendingLimit>>("/api/v1/spending-limits", {
    method: "POST",
    body: payload,
  });
}

export function updateSpendingLimit(id: number, payload: CreateSpendingLimitInput) {
  return apiClient<DataResponse<SpendingLimit>>(`/api/v1/spending-limits/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteSpendingLimit(id: number) {
  return apiClient<void>(`/api/v1/spending-limits/${id}`, { method: "DELETE" });
}

export function fetchPlannedExpenseCategories() {
  return apiClient<DataResponse<PlannedExpenseCategoryWithItems[]>>(
    "/api/v1/planned-expenses",
  );
}

export function reorderPlannedExpenseCategories(ids: number[]) {
  return apiClient<void>("/api/v1/planned-expense-categories/reorder", {
    method: "PATCH",
    body: { ids },
  });
}

export function createPlannedExpense(payload: CreatePlannedExpenseInput) {
  return apiClient<DataResponse<PlannedExpense>>("/api/v1/planned-expenses", {
    method: "POST",
    body: payload,
  });
}

export function updatePlannedExpense(id: number, payload: UpdatePlannedExpenseInput) {
  return apiClient<DataResponse<PlannedExpense>>(
    `/api/v1/planned-expenses/${id}`,
    { method: "PATCH", body: payload },
  );
}

export function deletePlannedExpense(id: number) {
  return apiClient<void>(`/api/v1/planned-expenses/${id}`, { method: "DELETE" });
}

export function completePlannedExpense(id: number) {
  return apiClient<DataResponse<PlannedExpense>>(
    `/api/v1/planned-expenses/${id}/complete`,
    { method: "POST" },
  );
}

export function fetchArchivedPlannedExpenses() {
  return apiClient<DataResponse<PlannedExpense[]>>(
    "/api/v1/planned-expenses?status=archived",
  );
}
