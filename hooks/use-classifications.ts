import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { UIClassification } from "@/lib/presenter";

export interface UIClassificationWithSession extends UIClassification {
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

export function useUpdateClassification(sessionId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      classificationId,
      updates,
    }: {
      classificationId: string;
      updates: { notes?: string | null; suggestion_applied?: boolean };
    }) =>
      apiFetch(`/api/classifications/${classificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classifications"] });
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      }
    },
  });
}
