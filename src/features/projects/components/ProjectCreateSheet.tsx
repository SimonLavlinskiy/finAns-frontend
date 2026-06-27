import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createProject } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { parseRublesInput } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: number) => void;
};

export function ProjectCreateSheet({ open, onOpenChange, onCreated }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createProject({
        name: name.trim(),
        initial_balance_kopecks: balance ? parseRublesInput(balance) : undefined,
        started_at: startedAt || null,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      onCreated(res.data.id);
      onOpenChange(false);
      setName("");
      setBalance("");
      setStartedAt("");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err instanceof ApiError ? err.message : "Не удалось создать проект");
    },
  });

  function handleSave() {
    if (!name.trim()) { setError("Укажите название проекта"); return; }
    setError(null);
    mutation.mutate();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>Новый проект</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Input
            placeholder="Название проекта"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Начальный баланс (₽), необязательно"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            type="number"
          />
          <Input
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            placeholder="Дата начала учёта"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            Создать
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
