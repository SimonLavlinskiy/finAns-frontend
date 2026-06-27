import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/AuthProvider";
import { addProjectMember, fetchProjectMembers, removeProjectMember } from "@/lib/api";
import { ApiError } from "@/lib/api-client";

export function ProjectSettingsPage() {
  const { user, projectId } = useAuth();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => (await fetchProjectMembers(projectId!)).data,
    enabled: !!projectId,
  });

  const currentMember = members?.find((m) => m.user_id === user?.id);
  const isOwner = currentMember?.role === "owner";

  const addMutation = useMutation({
    mutationFn: () => addProjectMember(projectId!, username.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
      setUsername("");
      setAddError(null);
    },
    onError: (err: Error) => {
      setAddError(err instanceof ApiError ? err.message : "Не удалось добавить участника");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => removeProjectMember(projectId!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Настройки проекта</h1>
        <p className="page-subtitle">Участники и доступ</p>
      </div>

      <div className="surface-card p-4 space-y-4">
        <h2 className="font-semibold">Участники</h2>

        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Загрузка…</div>
        ) : (
          <div className="space-y-2">
            {members?.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between py-2 px-1 border-b border-border/40 last:border-0"
              >
                <div>
                  <span className="font-medium">{m.display_name}</span>
                  <span className="text-muted-foreground text-sm ml-2">@{m.username}</span>
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {m.role === "owner" ? "Владелец" : "Участник"}
                  </span>
                </div>
                {isOwner && m.user_id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Удалить @${m.username} из проекта?`))
                        removeMutation.mutate(m.user_id);
                    }}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <div className="pt-2 space-y-2 border-t border-border/40">
            <p className="text-sm font-medium">Добавить участника</p>
            <div className="flex gap-2">
              <Input
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!username.trim() || addMutation.isPending}
              >
                Добавить
              </Button>
            </div>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
