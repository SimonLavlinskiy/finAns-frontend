import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "@/lib/api";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const { setUser, user, isLoading } = useAuth();
  const navigate = useNavigate();

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await fetchUsers()).data,
    staleTime: 60_000,
  });

  if (!isLoading && user) {
    navigate("/projects", { replace: true });
    return null;
  }

  function handleSelect(u: User) {
    setUser(u);
    navigate("/projects", { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="surface-card w-full max-w-sm p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            fA
          </div>
          <div>
            <p className="font-bold text-foreground leading-tight">finAnns</p>
            <p className="text-xs text-muted-foreground">Выберите аккаунт</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Загрузка…</div>
        ) : !users?.length ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Нет пользователей. Перейдите в{" "}
            <a href="/admin/users" className="underline">Администрирование</a> и создайте аккаунт.
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelect(u)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border border-border",
                  "hover:bg-accent hover:border-primary transition-colors text-left",
                )}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {u.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{u.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <a href="/admin/users" className="hover:underline">
            + Добавить пользователя
          </a>
        </p>
      </div>
    </div>
  );
}
