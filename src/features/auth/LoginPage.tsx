import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { login } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthProvider";

export function LoginPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");

  const loginMut = useMutation({
    mutationFn: () => login(loginValue, password),
    onSuccess: (res) => {
      qc.setQueryData(["auth", "me"], res.data);
      const redirectTo =
        (location.state as { from?: string } | null)?.from ?? "/transactions";
      navigate(redirectTo, { replace: true });
    },
  });

  if (!isLoading && user) {
    return <Navigate to="/transactions" replace />;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    loginMut.mutate();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="surface-card w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            fA
          </div>
          <div>
            <p className="font-bold text-foreground leading-tight">finAns</p>
            <p className="text-xs text-muted-foreground">Вход в аккаунт</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            placeholder="Логин"
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            autoComplete="username"
            className="rounded-xl"
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="rounded-xl"
          />

          {loginMut.isError && (
            <p className="text-sm text-destructive">
              {loginMut.error instanceof ApiError
                ? loginMut.error.message
                : "Не удалось войти"}
            </p>
          )}

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={!loginValue || !password || loginMut.isPending}
          >
            {loginMut.isPending ? "Входим…" : "Войти"}
          </Button>
        </form>
      </div>
    </div>
  );
}
