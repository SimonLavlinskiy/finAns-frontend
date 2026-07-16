import { format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  /** ISO "yyyy-MM-dd" или пустая строка */
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  /** Показывать кнопку очистки выбранной даты (для необязательных полей) */
  clearable?: boolean;
  "data-testid"?: string;
};

/**
 * Единый календарь-пикер даты. Наружу сохраняет контракт `value`/`onChange`
 * в формате "yyyy-MM-dd" — drop-in замена для `<input type="date">`.
 */
export function DatePicker({
  value,
  onChange,
  className,
  placeholder = "Выберите дату",
  clearable = false,
  "data-testid": testId,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-testid={testId}
          className={cn("w-full justify-start font-normal", !value && "text-muted-foreground", className)}
        >
          <CalendarIcon className="h-4 w-4 mr-2 shrink-0 opacity-60" />
          <span className="flex-1 text-left">
            {selected ? format(selected, "dd.MM.yyyy", { locale: ru }) : placeholder}
          </span>
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              className="ml-2 shrink-0 opacity-60 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            >
              <X className="h-4 w-4" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
