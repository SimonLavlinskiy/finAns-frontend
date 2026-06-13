import { NavLink, Outlet } from "react-router-dom";
import { HealthStatus } from "@/components/HealthStatus";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/transactions", label: "Транзакции" },
  { to: "/tags", label: "Теги" },
  { to: "/mandatory-payments", label: "Обязательные платежи" },
  { to: "/planned-expenses", label: "Планируемые расходы" },
];

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between gap-4">
        <div className="font-semibold text-lg">finAns</div>
        <div className="flex items-center gap-4">
          <HealthStatus />
          <div className="text-sm text-muted-foreground">Баланс: —</div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-56 border-r p-4 shrink-0">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
