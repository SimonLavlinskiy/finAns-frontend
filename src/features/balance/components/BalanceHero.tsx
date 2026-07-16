import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Check, Pencil, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchBalance, updateBalance } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { formatRubles, parseRublesInput } from "@/lib/format";

export function BalanceHero() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["balance"],
    queryFn: async () => (await fetchBalance()).data,
  });

  const preview = useMemo(() => {
    if (!data || !amountInput.trim()) return null;
    return parseRublesInput(amountInput);
  }, [amountInput, data]);

  const mutation = useMutation({
    mutationFn: async (kopecks: number) => (await updateBalance(kopecks)).data,
    onSuccess: async (updated) => {
      qc.setQueryData(["balance"], updated);
      await refetch();
      setError(null);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 800);
    },
    onError: (err: Error) => {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить");
    },
  });

  const balance = data?.balance ?? 0;

  function handleSave() {
    if (!amountInput.trim()) {
      setError("Введите сумму");
      return;
    }
    mutation.mutate(parseRublesInput(amountInput));
  }

  function openDialog() {
    setAmountInput(data ? formatInputRubles(data.balance) : "");
    setError(null);
    setSaved(false);
    setOpen(true);
  }

  return (
    <>
      <div className="balance-hero rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
        <div
          className="absolute -right-8 -bottom-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute right-12 top-8 opacity-20 pointer-events-none"
          aria-hidden
        >
          <TrendingUp className="w-24 h-24" strokeWidth={1} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-white/70 text-sm font-medium">Текущий баланс</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl md:text-4xl font-bold font-mono tracking-tight" data-testid="balance-amount">
                {isLoading ? "…" : `${formatRubles(balance)} ₽`}
              </p>
              <button
                type="button"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 transition-colors"
                onClick={openDialog}
                title="Изменить баланс"
                data-testid="btn-edit-balance"
              >
                <Pencil className="h-3.5 w-3.5 text-white/70" />
              </button>
            </div>
            {data && (
              <p className="text-white/50 text-xs mt-2">
                с учётом всех операций
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 min-w-[140px]">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-medium mb-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Доходы
              </div>
              <p className="font-mono font-semibold text-lg">
                {isLoading ? "…" : `+${formatRubles(data?.total_income ?? 0)}`}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 min-w-[140px]">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-medium mb-1">
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Расходы
              </div>
              <p className="font-mono font-semibold text-lg">
                {isLoading ? "…" : `−${formatRubles(data?.total_expense ?? 0)}`}
              </p>
            </div>
          </div>
        </div>

        <svg
          className="absolute bottom-0 left-0 w-full h-12 text-white/10"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0,20 Q100,5 200,18 T400,12 L400,40 L0,40 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md border-0 soft-shadow-lg">
          <DialogHeader>
            <DialogTitle>Баланс</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Баланс = база + доходы − расходы. Задайте желаемый текущий баланс.
          </p>

          {data && (
            <div className="rounded-xl bg-muted/60 px-3 py-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Сейчас</span>
                <span className="font-mono">{formatRubles(data.balance)} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Доходы / расходы</span>
                <span className="font-mono text-xs">
                  +{formatRubles(data.total_income)} / −{formatRubles(data.total_expense)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Новый баланс, ₽</label>
            <Input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="rounded-xl font-mono text-lg border-0 bg-muted/50"
              data-testid="balance-input"
            />
          </div>

          {preview != null && data && preview !== data.balance && (
            <div className="rounded-xl bg-primary/5 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Сохранится: </span>
              <span className="font-mono font-semibold">{formatRubles(preview)} ₽</span>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && (
            <p className="text-sm text-[hsl(var(--income))] flex items-center gap-1">
              <Check className="h-4 w-4" /> Сохранено
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)} data-testid="btn-balance-cancel">
              Отмена
            </Button>
            <Button
              className="rounded-xl min-w-[120px]"
              disabled={mutation.isPending || saved}
              onClick={handleSave}
              data-testid="btn-balance-save"
            >
              {mutation.isPending ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatInputRubles(kopecks: number): string {
  const rub = kopecks / 100;
  return Number.isInteger(rub) ? String(rub) : rub.toFixed(2).replace(".", ",");
}
