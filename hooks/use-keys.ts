import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface ApiKeyInfo {
  id: string;
  label: string;
  masked: string;
  created_at: string;
}

export function useApiKeys() {
  return useQuery({
    queryKey: ["keys"],
    queryFn: () => apiFetch<{ keys: ApiKeyInfo[] }>("/api/keys"),
    select: (data) => data.keys,
  });
}
