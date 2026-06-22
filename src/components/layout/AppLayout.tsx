import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  CalendarClock,
  LogOut,
  PiggyBank,
  Tags,
  Upload,
} from "lucide-react";
import { HealthStatus } from "@/components/HealthStatus";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { BalanceHeader } from "@/features/balance/components/BalanceHeader";
import { logout } from "@/lib/api";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/transactions", label: "Операции", icon: ArrowLeftRight },
  { to: "/import", label: "Импорт", icon: Upload },
  { to: "/tags", label: "Метки", icon: Tags },
  { to: "/mandatory-payments", label: "Регулярные платежи", icon: CalendarClock },
  { to: "/planned-expenses", label: "Расходы", icon: PiggyBank },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isTransactions = location.pathname.startsWith("/transactions");

  const logoutMut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.setQueryData(["auth", "me"], null);
      navigate("/login", { replace: true });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:flex w-56 shrink-0 flex-col gap-6">
            <div className="surface-card p-5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  fA
                </div>
                <div>
                  <p className="font-bold text-foreground leading-tight">finAnns</p>
                  <p className="text-xs text-muted-foreground">Финансы</p>
                </div>
              </div>
              <nav className="flex flex-col gap-1" data-testid="sidebar-nav">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    data-testid={`nav-${item.to.replace("/", "")}`}
                    className={({ isActive }) =>
                      cn(
                        "nav-item",
                        isActive ? "nav-item-active" : "nav-item-inactive",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="surface-card p-4 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Вы вошли как</p>
                <p className="font-medium text-foreground truncate">{user?.login}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full shrink-0"
                title="Выйти"
                onClick={() => logoutMut.mutate()}
                data-testid="btn-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <HealthStatus />
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Mobile header */}
            <header className="flex items-center justify-between gap-3 md:hidden">
              <p className="font-bold text-lg">finAnns</p>
              <div className="flex items-center gap-2">
                <HealthStatus />
                {!isTransactions && <BalanceHeader />}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  title="Выйти"
                  onClick={() => logoutMut.mutate()}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {/* Desktop top bar */}
            <header className="hidden md:flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Добро пожаловать</p>
                <p className="font-semibold text-foreground">Личные финансы</p>
              </div>
              <div className="flex items-center gap-3">
                {!isTransactions && <BalanceHeader />}
              </div>
            </header>

            <main>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
