import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TagsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Теги</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        Управление иерархией тегов — в разработке (MVP change).
      </CardContent>
    </Card>
  );
}
