import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Building2,
  CalendarClock,
  LogOut,
  PiggyBank,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import { HealthStatus } from "@/components/HealthStatus";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/AuthProvider";
import { BalanceHeader } from "@/features/balance/components/BalanceHeader";
import { fetchProjects } from "@/lib/api";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/transactions", label: "Операции", icon: ArrowLeftRight },
  { to: "/import", label: "Импорт", icon: Upload },
  { to: "/mandatory-payments", label: "Регулярные платежи", icon: CalendarClock },
  { to: "/planned-expenses", label: "Хочу купить", icon: PiggyBank },
  { to: "/admin/users", label: "Пользователи", icon: Users, adminOnly: true },
  { to: "/projects/settings", label: "Настройки проекта", icon: Settings },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { user, projectId, setProjectId, logout } = useAuth();

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await fetchProjects()).data,
    enabled: !!user,
    staleTime: 60_000,
  });

  const currentProject = projects?.find((p) => p.id === projectId);
  const showSwitcher = (projects?.length ?? 0) > 1;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:flex w-56 shrink-0 flex-col gap-4">
            <div className="surface-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  fA
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground leading-tight">finAnns</p>
                  {currentProject && (
                    <p className="text-xs text-muted-foreground truncate">{currentProject.name}</p>
                  )}
                </div>
              </div>

              {showSwitcher && projects && (
                <div className="mb-4">
                  <Select
                    value={String(projectId)}
                    onValueChange={(v) => setProjectId(Number(v))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <Building2 className="h-3 w-3 mr-1 shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <nav className="flex flex-col gap-1" data-testid="sidebar-nav">
                {navItems.filter((item) => !item.adminOnly || user?.is_admin).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    data-testid={`nav-${item.to.replace(/\//g, "-").replace(/^-/, "")}`}
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
                <p className="font-medium text-foreground truncate">
                  {user ? `@${user.username}` : "—"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full shrink-0"
                title="Выйти"
                onClick={handleLogout}
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
                <BalanceHeader />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  title="Выйти"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {/* Desktop top bar */}
            <header className="hidden md:flex items-center justify-end">
              <div className="flex items-center gap-3">
                <BalanceHeader />
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
