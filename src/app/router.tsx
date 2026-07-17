import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/features/auth/LoginPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { AdminUsersPage } from "@/features/admin/pages/AdminUsersPage";
import { ImportPage } from "@/features/import/pages/ImportPage";
import { MandatoryPaymentsPage } from "@/features/mandatory-payments/pages/MandatoryPaymentsPage";
import { PlannedExpensesPage } from "@/features/planned-expenses/pages/PlannedExpensesPage";
import { ProjectsPage } from "@/features/projects/pages/ProjectsPage";
import { ProjectSettingsPage } from "@/features/projects/pages/ProjectSettingsPage";
import { TransactionsPage } from "@/features/transactions/pages/TransactionsPage";

// Ленивая загрузка: recharts заметно увеличивает вес бандла, не должен
// попадать в основной чанк, загружаемый при первом рендере приложения.
const AnalyticsPage = lazy(() =>
  import("@/features/analytics/pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/projects", element: <ProjectsPage /> },
  { path: "/admin/users", element: <AdminUsersPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/transactions" replace /> },
      { path: "transactions", element: <TransactionsPage /> },
      {
        path: "analytics",
        element: (
          <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Загрузка…</div>}>
            <AnalyticsPage />
          </Suspense>
        ),
      },
      { path: "import", element: <ImportPage /> },
      { path: "mandatory-payments", element: <MandatoryPaymentsPage /> },
      { path: "planned-expenses", element: <PlannedExpensesPage /> },
      { path: "projects/settings", element: <ProjectSettingsPage /> },
    ],
  },
]);
