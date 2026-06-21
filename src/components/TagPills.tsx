import { cn } from "@/lib/utils";
import { contrastText, resolveTagDisplayColors } from "@/lib/palette";

type TagLike = {
  id: number;
  name: string;
  color: string;
  parent?: { id: number; name: string; color?: string } | null;
};

type Props = {
  tag: TagLike;
  onClick?: (tagId: number) => void;
  size?: "sm" | "md";
  /** Показывать родительскую метку рядом (только в таблице операций) */
  showParent?: boolean;
  /** Цвет родительской категории (для подметок в списке меток) */
  parentColor?: string;
};

function Pill({
  label,
  color,
  className,
  onClick,
  tagId,
}: {
  label: string;
  color: string;
  className: string;
  onClick?: (id: number) => void;
  tagId: number;
}) {
  const style = { backgroundColor: color, color: contrastText(color) };
  if (onClick) {
    return (
      <button type="button" className={className} style={style} onClick={() => onClick(tagId)}>
        {label}
      </button>
    );
  }
  return (
    <span className={className} style={style}>
      {label}
    </span>
  );
}

export function TagPills({
  tag,
  onClick,
  size = "sm",
  showParent = false,
  parentColor,
}: Props) {
  const colors = resolveTagDisplayColors(tag, parentColor);
  const pillClass = cn(
    "inline-flex items-center rounded-full font-medium border-0 shadow-sm",
    size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
    onClick && "cursor-pointer hover:opacity-90 transition-opacity",
  );

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {showParent && tag.parent && colors.category && (
        <Pill
          label={tag.parent.name}
          color={colors.category}
          className={pillClass}
          onClick={onClick}
          tagId={tag.parent.id}
        />
      )}
      <Pill
        label={tag.name}
        color={colors.self}
        className={pillClass}
        onClick={onClick}
        tagId={tag.id}
      />
    </div>
  );
}
