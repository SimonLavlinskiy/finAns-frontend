import { Sankey, Tooltip } from "recharts";
import type { SankeyNodeProps } from "recharts";
import { formatRubles } from "@/lib/format";
import type { SankeyData } from "@/lib/types";

type Props = {
  data: SankeyData | undefined;
};

// Recharts не рисует подписи узлов по умолчанию — нужен собственный node-рендер.
// Узлы без исходящих потоков (терминальные, например листовые подкатегории)
// подписываются слева, чтобы не обрезаться правым краем графика.
function SankeyNodeWithLabel({ x, y, width, height, payload }: SankeyNodeProps) {
  const isSink = payload.sourceLinks.length === 0;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="hsl(var(--primary))" rx={2} />
      <text
        x={isSink ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isSink ? "end" : "start"}
        dominantBaseline="middle"
        fontSize={12}
        fill="hsl(var(--foreground))"
      >
        {payload.name}
      </text>
    </g>
  );
}

export function IncomeExpenseSankey({ data }: Props) {
  if (!data || data.nodes.length === 0) {
    return (
      <div className="surface-card p-5">
        <p className="text-sm text-muted-foreground">Нет данных за выбранный период</p>
      </div>
    );
  }

  // Recharts Sankey ссылается на узлы по индексу, а не по строковому id —
  // конвертируем ответ бэкенда в ожидаемый формат.
  const idToIndex = new Map(data.nodes.map((n, i) => [n.id, i]));
  const chartData = {
    nodes: data.nodes.map((n) => ({ name: n.label })),
    links: data.flows.map((f) => ({
      source: idToIndex.get(f.from) ?? 0,
      target: idToIndex.get(f.to) ?? 0,
      value: f.amount,
    })),
  };

  return (
    <div className="surface-card p-5 space-y-3">
      <p className="text-sm text-muted-foreground">Доход → категории → подкатегории</p>
      {data.deficit_amount !== null && (
        <p className="text-sm rounded-xl bg-[hsl(var(--expense))]/10 text-[hsl(var(--expense))] px-3 py-2">
          Расходы превысили доходы на {formatRubles(data.deficit_amount)} ₽
        </p>
      )}
      <div style={{ width: "100%", height: 360 }}>
        <Sankey
          width={800}
          height={360}
          data={chartData}
          nodePadding={24}
          margin={{ left: 90, right: 110, top: 8, bottom: 8 }}
          link={{ stroke: "hsl(var(--muted-foreground))", strokeOpacity: 0.3 }}
          node={SankeyNodeWithLabel}
        >
          <Tooltip formatter={(v) => `${formatRubles(Number(v))} ₽`} />
        </Sankey>
      </div>
    </div>
  );
}
