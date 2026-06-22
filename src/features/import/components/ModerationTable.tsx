import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TagFormPicker } from "@/components/TagFilterPicker";
import type { UpdateModerationRowInput } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ModerationRow, Tag } from "@/lib/types";

/** Оборачивает поле в тултип с описанием ошибки, если она есть. */
function FieldTooltip({ message, children }: { message?: string; children: ReactNode }) {
  if (!message) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  );
}

function missingFieldsLabel(row: ModerationRow): string | null {
  if (row.status === "pending") {
    const missing: string[] = [];
    if (!row.tag_id) missing.push("Тег");
    if (!row.category) missing.push("Категория");
    if (!row.specificity) missing.push("Специфика");
    return missing.length ? `Заполните: ${missing.join(", ")}` : null;
  }
  return null;
}

/** Возвращает классы для поля с ошибкой (красный) или незаполненного (жёлтый). */
function fieldBorderClass(row: ModerationRow, field: string, isEmpty: boolean): string {
  if (row.field_errors[field]) return "border-destructive";
  if (isEmpty) return "border-amber-400";
  return "border-transparent";
}

type Props = {
  rows: ModerationRow[];
  tags: Tag[];
  fadingIds: Set<number>;
  selectedIds: Set<number>;
  acceptingIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onPatch: (id: number, patch: UpdateModerationRowInput) => void;
  onAccept: (id: number) => void;
};

export function ModerationTable({
  rows,
  tags,
  fadingIds,
  selectedIds,
  acceptingIds,
  onToggleSelect,
  onPatch,
  onAccept,
}: Props) {
  return (
    <div className="surface-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead className="min-w-[260px]">Название</TableHead>
            <TableHead className="min-w-[120px]">Сумма</TableHead>
            <TableHead className="min-w-[140px]">Дата</TableHead>
            <TableHead className="min-w-[180px]">Тег</TableHead>
            <TableHead className="min-w-[130px]">Категория</TableHead>
            <TableHead className="min-w-[130px]">Специфика</TableHead>
            <TableHead className="min-w-[140px]">Комментарий</TableHead>
            <TableHead className="min-w-[140px]">Ссылка</TableHead>
            <TableHead className="min-w-[90px]">Статус</TableHead>
            <TableHead className="text-right min-w-[110px]">Действие</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <ModerationRowView
              key={row.id}
              row={row}
              tags={tags}
              fading={fadingIds.has(row.id)}
              selected={selectedIds.has(row.id)}
              accepting={acceptingIds.has(row.id)}
              onToggleSelect={onToggleSelect}
              onPatch={onPatch}
              onAccept={onAccept}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ModerationRowView({
  row,
  tags,
  fading,
  selected,
  accepting,
  onToggleSelect,
  onPatch,
  onAccept,
}: {
  row: ModerationRow;
  tags: Tag[];
  fading: boolean;
  selected: boolean;
  accepting: boolean;
  onToggleSelect: (id: number) => void;
  onPatch: (id: number, patch: UpdateModerationRowInput) => void;
  onAccept: (id: number) => void;
}) {
  const amountStr = row.amount != null ? (row.amount / 100).toFixed(2) : "";
  const missing = missingFieldsLabel(row);

  return (
    <TableRow className={cn("transition-opacity duration-700", fading && "opacity-0")}>
      {/* Чекбокс выбора */}
      <TableCell>
        <input
          type="checkbox"
          checked={selected}
          disabled={row.status !== "ready"}
          onChange={() => onToggleSelect(row.id)}
        />
      </TableCell>

      {/* Название — широкое поле, не обрезать */}
      <TableCell>
        <FieldTooltip message={row.field_errors.title}>
          <Input
            key={`title-${row.title}`}
            defaultValue={row.title ?? ""}
            className={cn("h-9 min-w-[240px] border-2", fieldBorderClass(row, "title", !row.title))}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== row.title) onPatch(row.id, { title: v });
            }}
          />
        </FieldTooltip>
      </TableCell>

      {/* Сумма */}
      <TableCell>
        <FieldTooltip message={row.field_errors.amount}>
          <Input
            key={`amount-${amountStr}`}
            defaultValue={amountStr}
            className={cn("h-9 w-28 border-2 font-mono", fieldBorderClass(row, "amount", row.amount == null))}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== amountStr) onPatch(row.id, { amount: v });
            }}
          />
        </FieldTooltip>
      </TableCell>

      {/* Дата */}
      <TableCell>
        <FieldTooltip message={row.field_errors.date}>
          <input
            type="date"
            value={row.date ?? ""}
            className={cn(
              "h-9 rounded-xl border-2 bg-card px-2 text-sm",
              fieldBorderClass(row, "date", !row.date),
            )}
            onChange={(e) => {
              if (e.target.value) onPatch(row.id, { date: e.target.value });
            }}
          />
        </FieldTooltip>
      </TableCell>

      {/* Тег — обводка прямо на кнопке, не на wrapper-div */}
      <TableCell className="min-w-44">
        <TagFormPicker
          tags={tags}
          value={row.tag_id ? String(row.tag_id) : ""}
          onChange={(v) => {
            if (v) onPatch(row.id, { tag_id: Number(v) });
          }}
          className={cn("border-2", fieldBorderClass(row, "tag", !row.tag_id))}
          title={row.field_errors.tag}
        />
      </TableCell>

      {/* Категория — portal через Radix, не уходит за экран */}
      <TableCell>
        <FieldTooltip message={row.field_errors.category}>
          <Select
            value={row.category ?? ""}
            onValueChange={(v) => onPatch(row.id, { category: v })}
          >
            <SelectTrigger
              className={cn("h-9 w-32 border-2", fieldBorderClass(row, "category", !row.category))}
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} avoidCollisions>
              <SelectItem value="expense">Расход</SelectItem>
              <SelectItem value="income">Доход</SelectItem>
            </SelectContent>
          </Select>
        </FieldTooltip>
      </TableCell>

      {/* Специфика */}
      <TableCell>
        <FieldTooltip message={row.field_errors.specificity}>
          <Select
            value={row.specificity ?? ""}
            onValueChange={(v) => onPatch(row.id, { specificity: v })}
          >
            <SelectTrigger
              className={cn("h-9 w-32 border-2", fieldBorderClass(row, "specificity", !row.specificity))}
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} avoidCollisions>
              <SelectItem value="required">Обязательный</SelectItem>
              <SelectItem value="simple">Простой</SelectItem>
            </SelectContent>
          </Select>
        </FieldTooltip>
      </TableCell>

      {/* Комментарий */}
      <TableCell>
        <Input
          key={`comment-${row.comment}`}
          defaultValue={row.comment ?? ""}
          className="h-9 w-36"
          onBlur={(e) => {
            const v = e.target.value;
            if (v !== (row.comment ?? "")) onPatch(row.id, { comment: v });
          }}
        />
      </TableCell>

      {/* Ссылка */}
      <TableCell>
        <Input
          key={`url-${row.url}`}
          defaultValue={row.url ?? ""}
          className="h-9 w-36"
          onBlur={(e) => {
            const v = e.target.value;
            if (v !== (row.url ?? "")) onPatch(row.id, { url: v });
          }}
        />
      </TableCell>

      {/* Статус */}
      <TableCell>
        <Badge
          variant={
            row.status === "ready"
              ? "default"
              : row.status === "error"
                ? "destructive"
                : "secondary"
          }
          className="rounded-full"
        >
          {row.status === "ready" ? "Готово" : row.status === "error" ? "Ошибка" : "Ожидает"}
        </Badge>
      </TableCell>

      {/* Принять */}
      <TableCell className="text-right">
        <Button
          size="sm"
          className="rounded-xl"
          disabled={row.status !== "ready" || accepting}
          title={missing ?? undefined}
          onClick={() => onAccept(row.id)}
        >
          <Check className="h-4 w-4" />
          Принять
        </Button>
      </TableCell>
    </TableRow>
  );
}
