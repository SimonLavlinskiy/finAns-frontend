import { Sparkles } from "lucide-react";
import type { Insight } from "@/lib/types";

type Props = {
  insights: Insight[];
};

export function InsightsFeed({ insights }: Props) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3" data-testid="insights-feed">
      {insights.map((insight) => (
        <div key={insight.type} className="surface-card p-4 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm">{insight.text}</p>
        </div>
      ))}
    </div>
  );
}
