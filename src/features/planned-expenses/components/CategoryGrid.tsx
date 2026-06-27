import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reorderPlannedExpenseCategories } from "@/lib/api";
import type { PlannedExpense, PlannedExpenseCategoryWithItems } from "@/lib/types";
import { CategoryCard } from "./CategoryCard";

function SortableCategoryCard({
  category,
  onEdit,
}: {
  category: PlannedExpenseCategoryWithItems;
  onEdit: (item: PlannedExpense) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
      {...attributes}
      {...listeners}
    >
      <CategoryCard category={category} onEdit={onEdit} />
    </div>
  );
}

type Props = {
  categories: PlannedExpenseCategoryWithItems[];
  onEdit: (item: PlannedExpense) => void;
};

export function CategoryGrid({ categories, onEdit }: Props) {
  const qc = useQueryClient();

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderPlannedExpenseCategories(ids),
    onError: () => {
      qc.invalidateQueries({ queryKey: ["planned-expense-categories"] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    qc.setQueryData<{ data: PlannedExpenseCategoryWithItems[] }>(
      ["planned-expense-categories"],
      (old) => (old ? { ...old, data: reordered } : old),
    );

    reorderMutation.mutate(reordered.map((c) => c.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categories.map((c) => c.id)}
        strategy={rectSortingStrategy}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
            alignItems: "start",
          }}
        >
          {categories.map((cat) => (
            <SortableCategoryCard key={cat.id} category={cat} onEdit={onEdit} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
