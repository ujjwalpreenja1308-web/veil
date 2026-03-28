import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { UIClassification } from "@/lib/presenter";

interface UIClassificationWithSession extends UIClassification {
  session?: { id: string; startedAt: string };
}

export function useClassifications() {
  return useQuery({
    queryKey: ["classifications"],
    queryFn: () =>
      apiFetch<{ classifications: UIClassificationWithSession[] }>("/api/classifications"),
    select: (data) => data.classifications,
  });
}
