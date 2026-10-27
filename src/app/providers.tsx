import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { invalidateFinanceData } from "@/lib/invalidate";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
      // Любое изменение данных пересчитывает аналитику без перезагрузки страницы.
      mutationCache: new MutationCache({
        onSuccess: (_data, _vars, _ctx, mutation) => {
          if (mutation.meta?.skipFinanceInvalidation) return;
          invalidateFinanceData(client);
        },
      }),
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: 1,
        },
      },
    });
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
