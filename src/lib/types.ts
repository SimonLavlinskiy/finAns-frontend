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
