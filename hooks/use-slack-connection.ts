import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSlackConnection() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["slack-connection"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/slack");
      if (!res.ok) throw new Error("Failed to fetch Slack status");
      return res.json() as Promise<{ connected: boolean; connectedAccountId: string | null }>;
    },
    staleTime: 30_000,
  });

  const connect = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/integrations/slack", { method: "POST" });
      if (!res.ok) throw new Error("Failed to initiate Slack connection");
      return res.json() as Promise<{ redirectUrl: string }>;
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: () => {
      toast.error("Failed to start Slack connection");
    },
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/integrations/slack", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect Slack");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-connection"] });
      toast.success("Slack disconnected");
    },
    onError: () => {
      toast.error("Failed to disconnect Slack");
    },
  });

  return { data, isLoading, connect, disconnect };
}
