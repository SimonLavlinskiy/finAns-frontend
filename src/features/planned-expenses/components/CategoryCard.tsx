import { contrastText } from "@/lib/palette";
import { sortItemsByPriority } from "@/lib/planned-expenses";
import type { PlannedExpense, PlannedExpenseCategoryWithItems } from "@/lib/types";
import { PlannedExpenseRow } from "./PlannedExpenseRow";

type Props = {
  category: PlannedExpenseCategoryWithItems;
  onEdit: (item: PlannedExpense) => void;
};

export function CategoryCard({ category, onEdit }: Props) {
  const textColor = contrastText(category.color);
  const items = sortItemsByPriority(category.items);

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2 min-h-[120px] soft-shadow"
      style={{ backgroundColor: category.color }}
    >
      <h3 className="text-sm font-semibold tracking-wide" style={{ color: textColor }}>
        {category.name}
      </h3>

      {items.length === 0 ? (
        <p className="text-xs opacity-60 mt-1" style={{ color: textColor }}>
          Нет позиций
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <PlannedExpenseRow
              key={item.id}
              item={item}
              textColor={textColor}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
