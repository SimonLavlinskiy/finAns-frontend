import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MandatoryPaymentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Обязательные платежи</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        Матрица статусов по месяцам — в разработке (MVP change).
      </CardContent>
    </Card>
  );
}
