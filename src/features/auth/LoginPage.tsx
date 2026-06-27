import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const { setUser, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await fetchUsers()).data,
    staleTime: 60_000,
  });

  if (!isLoading && user) {
    navigate("/projects", { replace: true });
    return null;
  }

  function handleLogin() {
    const trimmed = username.trim().replace(/^@/, "");
    const found = users?.find((u) => u.username === trimmed);
    if (!found) {
      setError("Пользователь не найден");
      return;
    }
    setUser(found);
    navigate("/projects", { replace: true });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
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
            <p className="text-xs text-muted-foreground">Войдите в аккаунт</p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Логин"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(null); }}
            onKeyDown={handleKey}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            Войти
          </Button>
        </div>
      </div>
    </div>
  );
}
