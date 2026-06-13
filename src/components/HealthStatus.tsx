import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { fetchHealth } from "@/lib/api-client";

export function HealthStatus() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <Badge variant="secondary">API: …</Badge>;
  }

  if (isError || !data) {
    return <Badge variant="destructive">API: down</Badge>;
  }

  const variant = data.db === "up" ? "default" : "secondary";

  return (
    <Badge variant={variant}>
      API: {data.status} / DB: {data.db}
    </Badge>
  );
}
