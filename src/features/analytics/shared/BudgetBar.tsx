import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatMoney, formatPercentOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { computeBarLayout, type BarCategory, type BarPiece } from "../lib/calc";

type Props = {
  income: number;
  categories: BarCategory[];
  onCategoryClick?: (id: number) => void;
  className?: string;
};

/**
 * Полоса «доход → категории → свободно/перерасход» (блок 1 и «Что останется»).
 * Длина всегда 100 %, меняется только масштаб. Между сегментами зазор 2 px;
 * перед «Перерасходом» — сплошная тёмная черта 3 px внутри полосы, без зазора.
 */
export function BudgetBar({ income, categories, onCategoryClick, className }: Props) {
  const layout = computeBarLayout(income, categories);

  return (
    <div
      className={cn(
        "flex h-[34px] w-full overflow-hidden rounded-[10px] border border-border bg-muted/60",
        className,
      )}
      role="img"
      aria-label={layout.state === "empty" ? "Нет операций" : undefined}
    >
      {layout.pieces.map((piece, i) => (
        <Segment
          key={piece.kind === "category" ? `c${piece.id}` : piece.kind}
          piece={piece}
          first={i === 0}
          income={income}
          onCategoryClick={onCategoryClick}
          afterDivider={piece.kind === "over" && layout.dividerAt !== null}
        />
      ))}
    </div>
  );
}

function Segment({
  piece,
  first,
  income,
  afterDivider,
  onCategoryClick,
}: {
  piece: BarPiece;
  first: boolean;
  income: number;
  afterDivider: boolean;
  onCategoryClick?: (id: number) => void;
}) {
  const style: React.CSSProperties = {
    flexGrow: piece.width,
    flexBasis: 0,
    minWidth: piece.width > 0 ? 2 : 0,
    marginLeft: first || afterDivider ? 0 : 2,
  };

  let tooltip: React.ReactNode;
  let className = "h-full transition-opacity";
  if (piece.kind === "category") {
    style.backgroundColor = piece.color;
    tooltip = (
      <>
        <div>
          {piece.label}: {formatMoney(piece.amount)}
        </div>
        <div className="opacity-75">{formatPercentOf(piece.amount, income)} дохода</div>
      </>
    );
    className += " hover:opacity-85";
  } else if (piece.kind === "free") {
    className += " bg-card shadow-[inset_0_0_0_1px_hsl(var(--border))]";
    tooltip = (
      <>
        <div>Свободно: {formatMoney(piece.amount)}</div>
        <div className="opacity-75">{formatPercentOf(piece.amount, income)} дохода</div>
      </>
    );
  } else {
    style.backgroundColor = "var(--over)";
    if (afterDivider) style.borderLeft = "3px solid hsl(var(--primary))";
    tooltip = <div>Перерасход: {formatMoney(piece.amount)}</div>;
  }

  const clickable = piece.kind === "category" && !!onCategoryClick;
  const node = clickable ? (
    <button
      type="button"
      style={style}
      className={cn(className, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring")}
      aria-label={`${piece.label}: ${formatMoney(piece.amount)}`}
      onClick={() => onCategoryClick!(piece.id)}
    />
  ) : (
    <div style={style} className={className} />
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
