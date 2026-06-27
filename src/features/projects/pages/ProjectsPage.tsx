import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCreateSheet } from "@/features/projects/components/ProjectCreateSheet";
import { useAuth } from "@/features/auth/AuthProvider";
import { fetchProjects } from "@/lib/api";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { user, setProjectId } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await fetchProjects()).data,
    enabled: !!user,
  });

  function handleSelect(id: number) {
    setProjectId(id);
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="surface-card w-full max-w-md p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            fA
          </div>
          <div>
            <p className="font-bold text-foreground leading-tight">finAnns</p>
            <p className="text-xs text-muted-foreground">
              {user ? `@${user.username}` : "Выберите проект"}
            </p>
          </div>
        </div>

        <h2 className="text-lg font-semibold">Ваши проекты</h2>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Загрузка…</div>
        ) : !projects?.length ? (
          <div className="py-8 text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">У вас нет проектов</p>
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Создать проект
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent hover:border-primary transition-colors text-left"
              >
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{p.name}</p>
                  {p.started_at && (
                    <p className="text-xs text-muted-foreground">С {p.started_at}</p>
                  )}
                </div>
              </button>
            ))}

            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setSheetOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Новый проект
            </Button>
          </div>
        )}
      </div>

      <ProjectCreateSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCreated={(id) => handleSelect(id)}
      />
    </div>
  );
}
