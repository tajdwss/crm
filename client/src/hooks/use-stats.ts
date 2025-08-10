import { useQuery } from "@tanstack/react-query";
import { Stats } from "@/types";
import { getQueryFn } from "@/lib/queryClient";

export function useStats() {
  return useQuery({
    queryKey: ["/api/stats"],
    queryFn: getQueryFn<Stats>({
      on401: "returnNull",
    }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
