import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MandatoryPaymentsPage } from "@/features/mandatory-payments/pages/MandatoryPaymentsPage";
import { PlannedExpensesPage } from "@/features/planned-expenses/pages/PlannedExpensesPage";
import { TagsPage } from "@/features/tags/pages/TagsPage";
import { TransactionsPage } from "@/features/transactions/pages/TransactionsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/transactions" replace /> },
      { path: "transactions", element: <TransactionsPage /> },
      { path: "tags", element: <TagsPage /> },
      { path: "mandatory-payments", element: <MandatoryPaymentsPage /> },
      { path: "planned-expenses", element: <PlannedExpensesPage /> },
    ],
  },
]);
