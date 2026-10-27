import { forwardRef, useEffect, useState, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { parseAmountInput } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  /** Значение в копейках; null — пустое поле. */
  value: number | null;
  onValueChange: (kopecks: number | null) => void;
  invalid?: boolean;
};

function toText(v: number | null): string {
  return v === null ? "" : String(Math.round(v / 100));
}

/** Поле суммы в рублях: пока поле в фокусе, хранит введённый текст, наружу отдаёт копейки. */
export const AmountInput = forwardRef<HTMLInputElement, Props>(function AmountInput(
  { value, onValueChange, invalid, className, onFocus, onBlur, ...rest },
  ref,
) {
  const [text, setText] = useState(toText(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(toText(value));
  }, [value, focused]);

  return (
    <Input
      ref={ref}
      inputMode="decimal"
      autoComplete="off"
      value={text}
      aria-invalid={invalid || undefined}
      className={cn("tabular-nums", invalid && "border-[var(--over)] ring-1 ring-[var(--over)]", className)}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      onChange={(e) => {
        setText(e.target.value);
        const parsed = parseAmountInput(e.target.value);
        if (parsed === null || !Number.isNaN(parsed)) onValueChange(parsed);
      }}
      {...rest}
    />
  );
});
