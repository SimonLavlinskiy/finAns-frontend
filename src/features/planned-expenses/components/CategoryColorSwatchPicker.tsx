import { CATEGORY_COLORS } from "@/lib/palette";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export function CategoryColorSwatchPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
            value === color ? "border-foreground scale-110" : "border-transparent",
          )}
          style={{ backgroundColor: color }}
          aria-label={color}
        />
      ))}
    </div>
  );
}
