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
import { createTransaction, fetchTags, updateTransaction } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { parseRublesInput } from "@/lib/format";
import type { CreateTransactionInput, Transaction } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSaved: () => void;
};

const DRAFT_KEY = "finans:transaction-draft";

const isEditing = (t: Transaction | null): t is Transaction => t !== null;

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

export function TransactionFormSheet({
  open,
  onOpenChange,
  transaction,
  onSaved,
}: Props) {
  const qc = useQueryClient();
  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await fetchTags()).data,
  });

  const [category, setCategory] = useState<"expense" | "income">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tagId, setTagId] = useState("");
  const [specificity, setSpecificity] = useState<"simple" | "required">("simple");
  const [comment, setComment] = useState("");
  const [url, setUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);

    if (isEditing(transaction)) {
      // Режим редактирования — черновик не трогаем
      setCategory(transaction.category);
      setTitle(transaction.title);
      setAmount(String(transaction.amount / 100));
      setDate(transaction.date);
      setTagId(String(transaction.tag.id));
      setSpecificity(transaction.specificity);
      setComment(transaction.comment ?? "");
      setUrl(transaction.url ?? "");
    } else {
      // Режим создания — предлагаем черновик
      const draft = loadDraft();
      if (draft && confirm("Восстановить черновик?")) {
        setCategory(draft.category ?? "expense");
        setTitle(draft.title ?? "");
        setAmount(draft.amount ?? "");
        setDate(draft.date ?? new Date().toISOString().slice(0, 10));
        setTagId(draft.tagId ?? "");
        setSpecificity(draft.specificity ?? "simple");
        setComment(draft.comment ?? "");
        setUrl(draft.url ?? "");
      } else {
        resetForm();
      }
    }
  }, [open, transaction]);

  function resetForm() {
    setCategory("expense");
    setTitle("");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setTagId("");
    setSpecificity("simple");
    setComment("");
    setUrl("");
  }

  const saveMutation = useMutation({
    mutationFn: async (body: CreateTransactionInput) => {
      if (isEditing(transaction)) return updateTransaction(transaction.id, body);
      return createTransaction(body);
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.fields) {
        const msg = Object.entries(err.fields)
          .map(([k, v]) => fieldLabel(k, v))
          .join("; ");
        setFormError(msg);
        return;
      }
      setFormError(err instanceof ApiError ? err.message : "Не удалось сохранить");
    },
  });

  function validate(): string | null {
    if (!title.trim()) return "Укажите наименование";
    if (!amount.trim() || parseRublesInput(amount) <= 0) return "Укажите сумму";
    if (!tagId) return "Выберите метку";
    if (!date) return "Укажите дату";
    return null;
  }

  function buildBody(): CreateTransactionInput {
    return {
      title,
      amount: parseRublesInput(amount),
      date,
      tag_id: Number(tagId),
      category,
      specificity,
      comment: comment || null,
      url: url || null,
    };
  }

  function handleSave() {
    const err = validate();
    if (err) { setFormError(err); return; }
    setFormError(null);
    saveMutation.mutate(buildBody(), {
      onSuccess: () => {
        localStorage.removeItem(DRAFT_KEY);
        onSaved();
        onOpenChange(false);
      },
    });
  }

  function handleSaveAndMore() {
    const err = validate();
    if (err) { setFormError(err); return; }
    setFormError(null);
    saveMutation.mutate(buildBody(), {
      onSuccess: () => {
        localStorage.removeItem(DRAFT_KEY);
        onSaved();
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["balance"] });
        // Сбрасываем форму, но не закрываем sheet
        resetForm();
        setFormError(null);
      },
    });
  }

  function handleClose(next: boolean) {
    if (!next && !isEditing(transaction) && (title || amount)) {
      if (!confirm("Отменить без сохранения?")) return;
      // Черновик только при создании
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ category, title, amount, date, tagId, specificity, comment, url }),
      );
    }
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing(transaction) ? "Редактировать" : "Новая транзакция"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={category === "expense" ? "destructive" : "outline"}
              className="flex-1"
              onClick={() => setCategory("expense")}
            >
              Расход
            </Button>
            <Button
              type="button"
              variant={category === "income" ? "default" : "outline"}
              className={`flex-1 ${category === "income" ? "bg-[hsl(var(--income))] hover:bg-[hsl(var(--income))]/90 text-white" : ""}`}
              onClick={() => setCategory("income")}
            >
              Доход
            </Button>
          </div>

          <Input placeholder="Наименование" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Сумма" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

          <TagFormPicker
            tags={tagsData ?? []}
            value={tagId}
            onChange={setTagId}
          />

          <Select value={specificity} onValueChange={(v) => setSpecificity(v as "simple" | "required")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Простой</SelectItem>
              <SelectItem value="required">Обязательный</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Комментарий" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Input placeholder="Ссылка (URL)" value={url} onChange={(e) => setUrl(e.target.value)} />

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <div className="flex gap-2 pt-4">
            <Button className="flex-1" disabled={saveMutation.isPending} onClick={handleSave}>
              Сохранить
            </Button>
            {!isEditing(transaction) && (
              <Button
                variant="outline"
                disabled={saveMutation.isPending}
                onClick={handleSaveAndMore}
              >
                Сохранить и ещё
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function fieldLabel(key: string, value: string): string {
  const labels: Record<string, string> = {
    title: "Наименование",
    amount: "Сумма",
    tag_id: "Метка",
    date: "Дата",
    category: "Категория",
    url: "Ссылка",
  };
  const hints: Record<string, string> = {
    required: "обязательно",
    "not found": "не найдена",
    "must be positive": "должна быть больше 0",
    "invalid format, use YYYY-MM-DD": "неверный формат",
    "invalid URL": "неверный URL",
  };
  return `${labels[key] ?? key}: ${hints[value] ?? value}`;
}
