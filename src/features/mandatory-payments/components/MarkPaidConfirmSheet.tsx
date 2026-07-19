import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TagPills } from "@/components/TagPills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { markMandatoryPaymentPaid } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { parseRublesInput } from "@/lib/format";
import type { MandatoryPayment } from "@/lib/types";

type Props = {
  payment: MandatoryPayment | null;
  onOpenChange: (open: boolean) => void;
};

export function MarkPaidConfirmSheet({ payment, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (payment) {
      setAmount(String(payment.amount / 100));
      setFormError(null);
    }
  }, [payment]);

  const mutation = useMutation({
    mutationFn: (id: number) =>
      markMandatoryPaymentPaid(id, { amount: parseRublesInput(amount) }),
    onSuccess: (res) => {
      qc.setQueryData<MandatoryPayment[]>(["mandatory-payments"], (old) =>
        old?.map((p) => (p.id === res.data.id ? res.data : p)) ?? [],
      );
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      setFormError(err instanceof ApiError ? err.message : "Не удалось сохранить");
    },
  });

  function handleConfirm() {
    if (!payment) return;
    if (!amount.trim() || parseRublesInput(amount) <= 0) {
      setFormError("Укажите сумму");
      return;
    }
    setFormError(null);
    mutation.mutate(payment.id);
  }

  return (
    <Sheet open={payment !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>Подтвердить оплату</SheetTitle>
        </SheetHeader>
        {payment && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{payment.title}</span>
              <TagPills tag={payment.tag} size="sm" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Сумма, ₽</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-testid="mark-paid-amount-input"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Транзакция будет создана сегодняшним днём. Дата следующего платежа не
              изменится.
            </p>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                disabled={mutation.isPending}
                onClick={handleConfirm}
                data-testid="btn-confirm-mark-paid"
              >
                Оплатить
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
