import type {
  AcceptedTransaction,
  Balance,
  CalendarLevel,
  CalendarResponse,
  CreateTransactionInput,
  ImportBatchWithRows,
  ModerationRow,
  PaginatedMeta,
  Tag,
  Transaction,
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
  return apiClient<DataResponse<string[]>>(
    `/api/v1/transactions/suggestions?q=${encodeURIComponent(q)}`,
  );
}

export type AuthUser = { login: string };

export function login(login: string, password: string) {
  return apiClient<DataResponse<AuthUser>>("/api/v1/auth/login", {
    method: "POST",
    body: { login, password },
  });
}

export function logout() {
  return apiClient<void>("/api/v1/auth/logout", { method: "POST" });
}

export function fetchMe() {
  return apiClient<DataResponse<AuthUser>>("/api/v1/auth/me");
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
