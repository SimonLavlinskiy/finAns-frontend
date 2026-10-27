import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

/** Сегмент-переключатель в стиле сайта (капсулы pill-filter). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  ariaLabel,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "pill-filter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            size === "sm" && "px-3 py-1.5 text-xs",
            o.value === value ? "pill-filter-active" : "pill-filter-inactive",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
