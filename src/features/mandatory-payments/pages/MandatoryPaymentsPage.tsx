import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { TagPills } from "@/components/TagPills";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MandatoryPaymentSheet } from "@/features/mandatory-payments/components/MandatoryPaymentSheet";
import {
  deleteMandatoryPayment,
  duplicateMandatoryPayment,
  fetchMandatoryPayments,
  markMandatoryPaymentPaid,
  unmarkMandatoryPaymentPaid,
} from "@/lib/api";
import { formatDate, formatRubles } from "@/lib/format";
import { getDateHighlight, RECURRENCE_LABELS } from "@/lib/mandatory-payments";
import { cn } from "@/lib/utils";
import type { MandatoryPayment } from "@/lib/types";

export function MandatoryPaymentsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MandatoryPayment | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mandatory-payments"],
    queryFn: async () => (await fetchMandatoryPayments()).data,
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: number) => markMandatoryPaymentPaid(id),
    onSuccess: (res) => {
      qc.setQueryData<MandatoryPayment[]>(["mandatory-payments"], (old) =>
        old?.map((p) => (p.id === res.data.id ? res.data : p)) ?? [],
      );
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
    },
  });

  const unmarkPaidMutation = useMutation({
    mutationFn: (id: number) => unmarkMandatoryPaymentPaid(id),
    onSuccess: (res) => {
      qc.setQueryData<MandatoryPayment[]>(["mandatory-payments"], (old) =>
        old?.map((p) => (p.id === res.data.id ? res.data : p)) ?? [],
      );
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMandatoryPayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mandatory-payments"] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => duplicateMandatoryPayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mandatory-payments"] }),
  });

  const columns: ColumnDef<MandatoryPayment>[] = [
    {
      id: "title",
      header: "Наименование",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      id: "amount",
      header: "Сумма",
      cell: ({ row }) => (
        <span className="font-mono text-[hsl(var(--expense))]">
          − {formatRubles(row.original.amount)} ₽
        </span>
      ),
    },
    {
      id: "tag",
      header: "Категория",
      cell: ({ row }) => <TagPills tag={row.original.tag} />,
    },
    {
      id: "recurrence",
      header: "Периодичность",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {RECURRENCE_LABELS[row.original.recurrence] ?? row.original.recurrence}
        </span>
      ),
    },
    {
      id: "next_payment_date",
      header: "Дата платежа",
      cell: ({ row }) => {
        const highlight = getDateHighlight(row.original.next_payment_date);
        return (
          <span
            className={cn(
              "text-sm",
              highlight === "warn" &&
                "rounded-md px-2 py-0.5 bg-amber-50 text-amber-700 font-medium",
            )}
          >
            {formatDate(row.original.next_payment_date)}
          </span>
        );
      },
    },
    {
      id: "paid",
      header: "",
      cell: ({ row }) => {
        if (row.original.is_paid_current_period) {
          return (
            <Button
              size="sm"
              className="rounded-xl bg-green-500 hover:bg-green-500 text-white cursor-default disabled:opacity-100 disabled:bg-green-500"
              disabled
            >
              ✓ Оплачено
            </Button>
          );
        }
        return (
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={markPaidMutation.isPending}
            onClick={() => markPaidMutation.mutate(row.original.id)}
          >
            Оплатить
          </Button>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditing(row.original);
                setSheetOpen(true);
              }}
            >
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => duplicateMutation.mutate(row.original.id)}
            >
              Дублировать
            </DropdownMenuItem>
            {row.original.is_paid_current_period && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  disabled={unmarkPaidMutation.isPending}
                  onClick={() => unmarkPaidMutation.mutate(row.original.id)}
                >
                  Отменить оплату
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                if (confirm(`Удалить «${row.original.title}»?`))
                  deleteMutation.mutate(row.original.id);
              }}
            >
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const rows = data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Регулярные платежи</h1>
          <p className="page-subtitle">Обязательные платежи и подписки</p>
        </div>
        <Button
          className="rounded-xl"
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          data-testid="btn-add-payment"
        >
          + Добавить
        </Button>
      </div>

      <div className="surface-card p-1 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Загрузка…
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-lg mb-2">Не удалось загрузить платежи</p>
            <p className="text-sm">Проверьте соединение с сервером</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="mb-4 text-lg">Нет платежей</p>
            <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
              Добавить первый платёж
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            getRowClassName={(row) =>
              row.is_paid_current_period ? "opacity-60 bg-green-50/40" : ""
            }
          />
        )}
      </div>

      <MandatoryPaymentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        payment={editing}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["mandatory-payments"] });
        }}
      />
    </div>
  );
}
