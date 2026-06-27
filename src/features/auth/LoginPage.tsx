import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { login } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const { setUser, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!isLoading && user) {
    navigate("/projects", { replace: true });
    return null;
  }

  async function handleLogin() {
    if (!username.trim() || !password) return;
    setPending(true);
    setError(null);
    try {
      const res = await login({ username: username.trim(), password });
      setUser(res.data);
      navigate("/projects", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? "Неверный логин или пароль" : "Ошибка входа");
    } finally {
      setPending(false);
    }
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
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            onKeyDown={handleKey}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleLogin} disabled={pending || isLoading}>
            Войти
          </Button>
        </div>
      </div>
    </div>
  );
}
