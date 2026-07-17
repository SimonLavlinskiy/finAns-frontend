import { Link } from "react-router-dom";
import { formatDate, formatRubles } from "@/lib/format";
import type { SavingsGoal } from "@/lib/types";

type Props = {
  goals: SavingsGoal[];
};

export function SavingsGoalsPanel({ goals }: Props) {
  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="surface-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Когда я смогу купить?</p>
        <Link to="/planned-expenses" className="text-xs text-primary hover:underline">
          Хочу купить →
        </Link>
      </div>
      <div className="space-y-2">
        {goals.map((g) => (
          <div key={g.planned_expense_id} className="flex items-center justify-between text-sm">
            <span className="truncate">{g.title}</span>
            <span className="text-right shrink-0 ml-2">
              <span className="font-mono">{formatRubles(g.cost)} ₽</span>
              {g.already_affordable ? (
                <span className="ml-2 text-[hsl(var(--income))]">уже доступно</span>
              ) : g.projected_date ? (
                <span className="ml-2 text-muted-foreground">к {formatDate(g.projected_date)}</span>
              ) : (
                <span className="ml-2 text-muted-foreground">неизвестно</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
