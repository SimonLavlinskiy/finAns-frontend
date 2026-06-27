import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUser, fetchUsers } from "@/lib/api";
import { ApiError } from "@/lib/api-client";

export function AdminUsersPage() {
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await fetchUsers()).data,
  });

  const createMut = useMutation({
    mutationFn: () => createUser({ username: username.trim(), display_name: displayName.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setUsername("");
      setDisplayName("");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err instanceof ApiError ? err.message : "Не удалось создать пользователя");
    },
  });

  function handleCreate() {
    if (!username.trim()) { setError("Укажите логин"); return; }
    if (!displayName.trim()) { setError("Укажите имя"); return; }
    setError(null);
    createMut.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Пользователи</h1>
        <p className="page-subtitle">Управление аккаунтами</p>
      </div>

      <div className="surface-card p-4 space-y-3">
        <h2 className="font-semibold">Создать пользователя</h2>
        <Input
          placeholder="Логин (@username)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          placeholder="Имя (отображаемое)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleCreate} disabled={createMut.isPending}>
          Создать
        </Button>
      </div>

      <div className="surface-card p-1 overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Загрузка…</div>
        ) : !users?.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Нет пользователей</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">Логин</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">Имя</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/40 hover:bg-accent/30">
                  <td className="px-4 py-3 text-muted-foreground">{u.id}</td>
                  <td className="px-4 py-3 font-medium">@{u.username}</td>
                  <td className="px-4 py-3">{u.display_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
