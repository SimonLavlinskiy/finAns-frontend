import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlannedExpensesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Планируемые расходы</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        Планируемые траты — в разработке (MVP change).
      </CardContent>
    </Card>
  );
}
