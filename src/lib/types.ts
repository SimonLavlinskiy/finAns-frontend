export type User = {
  id: number;
  username: string;
  display_name: string;
  is_admin: boolean;
};

export type ProjectMember = {
  user_id: number;
  username: string;
  display_name: string;
  role: "owner" | "member";
};

export type Project = {
  id: number;
  name: string;
  initial_balance_kopecks: number;
  started_at: string | null;
  created_at: string;
};

export type ProjectWithMembers = Project & {
  members: ProjectMember[];
};

export type PaginatedMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type TagParent = { id: number; name: string; color?: string };

export type Tag = {
  id: number;
  name: string;
  color: string;
  parent_id?: number | null;
  parent?: TagParent;
  children?: Tag[];
};

export type Transaction = {
  id: number;
  title: string;
  amount: number;
  date: string;
  tag: { id: number; name: string; color: string; parent?: TagParent };
  category: "expense" | "income";
  specificity: "required" | "simple";
  comment?: string | null;
  url?: string | null;
  file?: { path: string; name: string; mime_type: string } | null;
  created_at: string;
  updated_at: string;
};

export type Balance = {
  balance: number;
  initial_amount: number;
  total_income: number;
  total_expense: number;
};

export type TransactionSuggestion = {
  title: string;
  amount: number;
  tag_id: number;
  category: "expense" | "income";
  specificity: "required" | "simple";
};

export type CreateTransactionInput = {
  title: string;
  amount: number;
  date: string;
  tag_id: number;
  category: "expense" | "income";
  specificity: "required" | "simple";
  comment?: string | null;
  url?: string | null;
};

export type CalendarLevel = "day" | "month";

export type CalendarTagBreakdown = {
  tag_id: number;
  name: string;
  color: string;
  amount: number;
  percent: number;
};

export type CalendarTransactionBrief = {
  id: number;
  title: string;
  amount: number;
};

export type CalendarItem = {
  key: string;
  amount: number;
  has_data: boolean;
  is_current: boolean;
  breakdown_by_tag?: CalendarTagBreakdown[];
  transactions?: CalendarTransactionBrief[];
};

export type CalendarPeriod = {
  year: number;
  month?: number;
};

export type CalendarResponse = {
  level: CalendarLevel;
  period: CalendarPeriod;
  total: number;
  has_previous: boolean;
  items: CalendarItem[];
};

export type RowStatus = "pending" | "ready" | "error";

export type ModerationRow = {
  id: number;
  batch_id: number;
  row_number: number;
  title: string | null;
  amount: number | null;
  date: string | null;
  tag_id: number | null;
  category: "expense" | "income" | null;
  specificity: "required" | "simple" | null;
  comment: string | null;
  url: string | null;
  status: RowStatus;
  field_errors: Record<string, string>;
};

export type ImportBatch = {
  id: number;
  file_name: string;
  total_rows: number;
  status: "open" | "closed";
  created_at: string;
  closed_at?: string | null;
};

export type ImportBatchWithRows = {
  batch: ImportBatch;
  rows: ModerationRow[];
};

export type AcceptedTransaction = {
  id: number;
  title: string;
  amount: number;
  date: string;
  tag_id: number;
  category: "expense" | "income";
  specificity: "required" | "simple";
  comment?: string | null;
  url?: string | null;
};

export type MandatoryPaymentRecurrence =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "yearly";

export type MandatoryPayment = {
  id: number;
  title: string;
  amount: number;
  tag: { id: number; name: string; color: string; parent?: TagParent };
  recurrence: MandatoryPaymentRecurrence;
  next_payment_date: string;
  last_paid_at: string | null;
  is_paid_current_period: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateMandatoryPaymentInput = {
  title: string;
  amount: number;
  tag_id: number;
  recurrence: MandatoryPaymentRecurrence;
  next_payment_date: string;
};

export type PlannedExpenseCategory = {
  id: number;
  name: string;
  color: string;
  sort_order: number;
};

export type PlannedExpense = {
  id: number;
  category_id: number;
  title: string;
  cost_kopecks: number | null;
  due_date: string | null;
  url: string | null;
  priority: "low" | "medium" | "high";
  effective_priority: "low" | "medium" | "high";
  is_due_soon: boolean;
  status: "active" | "archived";
  created_at: string;
};

export type PlannedExpenseCategoryWithItems = PlannedExpenseCategory & {
  items: PlannedExpense[];
};

export type CreatePlannedExpenseInput = {
  title: string;
  cost_kopecks?: number | null;
  due_date?: string | null;
  url?: string | null;
  priority: "low" | "medium" | "high";
  category_id?: number | null;
  new_category?: { name: string; color: string } | null;
};

export type UpdatePlannedExpenseInput = {
  title?: string;
  cost_kopecks?: number | null;
  due_date?: string | null;
  url?: string | null;
  priority?: "low" | "medium" | "high";
  category_id?: number | null;
};
