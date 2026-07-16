import { ru } from "react-day-picker/locale";
import { DayPicker } from "react-day-picker";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type CalendarProps = ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={ru}
      showOutsideDays
      className={cn("p-1", className)}
      classNames={{
        months: "flex flex-col gap-2",
        month: "space-y-2",
        nav: "flex items-center justify-between px-1 pb-1",
        button_previous:
          "h-7 w-7 rounded-full flex items-center justify-center hover:bg-accent",
        button_next:
          "h-7 w-7 rounded-full flex items-center justify-center hover:bg-accent",
        month_caption: "flex items-center justify-center h-7 font-medium text-sm capitalize",
        weekdays: "flex",
        weekday: "text-muted-foreground text-xs w-8 font-normal text-center",
        week: "flex w-full",
        day: "h-8 w-8 text-center text-sm p-0 relative",
        day_button:
          "h-8 w-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors",
        today: "font-semibold text-primary",
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/30 pointer-events-none",
        ...classNames,
      }}
      {...props}
    />
  );
}
