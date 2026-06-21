import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TagFormPicker } from "@/components/TagFilterPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createMandatoryPayment,
  fetchTags,
  updateMandatoryPayment,
} from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { parseRublesInput } from "@/lib/format";
import { RECURRENCE_LABELS } from "@/lib/mandatory-payments";
import type {
  CreateMandatoryPaymentInput,
  MandatoryPayment,
  MandatoryPaymentRecurrence,
} from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: MandatoryPayment | null;
  onSaved: () => void;
};

const isEditing = (p: MandatoryPayment | null): p is MandatoryPayment => p !== null;

export function MandatoryPaymentSheet({ open, onOpenChange, payment, onSaved }: Props) {
  const qc = useQueryClient();
  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await fetchTags()).data,
  });

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [tagId, setTagId] = useState("");
  const [recurrence, setRecurrence] = useState<MandatoryPaymentRecurrence>("monthly");
  const [nextPaymentDate, setNextPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);

    if (isEditing(payment)) {
      setTitle(payment.title);
      setAmount(String(payment.amount / 100));
      setTagId(String(payment.tag.id));
      setRecurrence(payment.recurrence);
      setNextPaymentDate(payment.next_payment_date);
    } else {
      setTitle("");
      setAmount("");
      setTagId("");
      setRecurrence("monthly");
      setNextPaymentDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, payment]);

  const tags = tagsData ?? [];

  const saveMutation = useMutation({
    mutationFn: (body: CreateMandatoryPaymentInput) =>
      isEditing(payment)
        ? updateMandatoryPayment(payment.id, body)
        : createMandatoryPayment(body),
  });

  function buildPayload(): CreateMandatoryPaymentInput | null {
    if (!title.trim()) {
      setFormError("Укажите наименование");
      return null;
    }
    const amountKopecks = parseRublesInput(amount);
    if (!amountKopecks || amountKopecks <= 0) {
      setFormError("Укажите корректную сумму");
      return null;
    }
    if (!tagId) {
      setFormError("Выберите категорию");
      return null;
    }
    if (!nextPaymentDate) {
      setFormError("Укажите дату платежа");
      return null;
    }
    return {
      title: title.trim(),
      amount: amountKopecks,
      tag_id: Number(tagId),
      recurrence,
      next_payment_date: nextPaymentDate,
    };
  }

  function handleSave() {
    const payload = buildPayload();
    if (!payload) return;
    setFormError(null);
    saveMutation.mutate(payload, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["mandatory-payments"] });
        onSaved();
        onOpenChange(false);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.fields) {
          const msgs = Object.entries(err.fields)
            .map(([f, m]) => `${f}: ${m}`)
            .join("; ");
          setFormError(msgs);
        } else {
          setFormError(err instanceof Error ? err.message : "Ошибка сохранения");
        }
      },
    });
  }

  function handleSaveAndMore() {
    if (isEditing(payment)) return;
    const payload = buildPayload();
    if (!payload) return;
    setFormError(null);
    saveMutation.mutate(payload, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["mandatory-payments"] });
        onSaved();
        setTitle("");
        setAmount("");
        setTagId("");
        setRecurrence("monthly");
        setNextPaymentDate(new Date().toISOString().slice(0, 10));
      },
      onError: (err) => {
        setFormError(err instanceof Error ? err.message : "Ошибка сохранения");
      },
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {isEditing(payment) ? "Редактировать платёж" : "Новый платёж"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Наименование</label>
            <Input
              placeholder="Наименование"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Сумма</label>
            <Input
              placeholder="Сумма (например 1 500)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Категория</label>
            <TagFormPicker
              tags={tags}
              value={tagId}
              onChange={setTagId}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Периодичность</label>
            <Select
              value={recurrence}
              onValueChange={(v) => setRecurrence(v as MandatoryPaymentRecurrence)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Дата платежа</label>
            <Input
              type="date"
              value={nextPaymentDate}
              onChange={(e) => setNextPaymentDate(e.target.value)}
            />
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            className="flex-1 rounded-xl"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            Сохранить
          </Button>
          {!isEditing(payment) && (
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={handleSaveAndMore}
              disabled={saveMutation.isPending}
            >
              Сохранить и ещё
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
