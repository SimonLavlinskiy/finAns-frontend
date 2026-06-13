import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type TransactionRow = {
  id: number;
  title: string;
  amount: number;
  date: string;
  category: string;
};

const mockData: TransactionRow[] = [
  { id: 1, title: "Продукты", amount: 3500, date: "2026-06-01", category: "Расход" },
  { id: 2, title: "Зарплата", amount: 120000, date: "2026-06-05", category: "Доход" },
  { id: 3, title: "Такси", amount: 450, date: "2026-06-10", category: "Расход" },
];

const columns: ColumnDef<TransactionRow>[] = [
  { accessorKey: "title", header: "Наименование" },
  {
    accessorKey: "amount",
    header: "Сумма",
    cell: ({ row }) => `${row.original.amount.toLocaleString("ru-RU")} ₽`,
  },
  { accessorKey: "date", header: "Дата" },
  { accessorKey: "category", header: "Категория" },
];

export function TransactionsPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Транзакции</CardTitle>
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Новая транзакция</SheetTitle>
            </SheetHeader>
            <p className="text-sm text-muted-foreground mt-4">
              Форма будет реализована в следующем change.
            </p>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={mockData} />
      </CardContent>
    </Card>
  );
}
