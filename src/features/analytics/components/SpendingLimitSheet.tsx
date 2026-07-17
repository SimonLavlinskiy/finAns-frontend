import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TagFormPicker } from "@/components/TagFilterPicker";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { createSpendingLimit, fetchTags } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { parseRublesInput } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function SpendingLimitSheet({ open, onOpenChange, onSaved }: Props) {
  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await fetchTags()).data,
  });

  const [tagId, setTagId] = useState("");
  const [amount, setAmount] = useState("");
  const [periodType, setPeriodType] = useState<"month" | "week" | "custom">("month");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTagId("");
    setAmount("");
    setPeriodType("month");
    setPeriodStart("");
    setPeriodEnd("");
    setFormError(null);
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      createSpendingLimit({
        tag_id: Number(tagId),
        amount: parseRublesInput(amount),
        period_type: periodType,
        period_start: periodType === "custom" ? periodStart || null : null,
        period_end: periodType === "custom" ? periodEnd || null : null,
      }),
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      setFormError(err instanceof ApiError ? err.message : "Не удалось сохранить");
    },
  });

  function handleSave() {
    if (!tagId) { setFormError("Выберите категорию"); return; }
    if (!amount.trim() || parseRublesInput(amount) <= 0) { setFormError("Укажите сумму"); return; }
    if (periodType === "custom" && (!periodStart || !periodEnd)) {
      setFormError("Укажите даты начала и окончания периода");
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>Новый лимит трат</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <TagFormPicker tags={tagsData ?? []} value={tagId} onChange={setTagId} />
          <Input placeholder="Сумма лимита" value={amount} onChange={(e) => setAmount(e.target.value)} />

          <Select value={periodType} onValueChange={(v) => setPeriodType(v as typeof periodType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Месяц</SelectItem>
              <SelectItem value="week">Неделя</SelectItem>
              <SelectItem value="custom">Произвольный период</SelectItem>
            </SelectContent>
          </Select>

          {periodType === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <DatePicker value={periodStart} onChange={setPeriodStart} placeholder="С" />
              <DatePicker value={periodEnd} onChange={setPeriodEnd} placeholder="По" />
            </div>
          )}

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <Button className="w-full" disabled={mutation.isPending} onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
