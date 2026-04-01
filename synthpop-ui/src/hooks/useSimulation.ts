import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SimulateStartRequest } from "@/types/api";

export const useStartSimulation = () => {
  return useMutation({
    mutationFn: (data: SimulateStartRequest) => api.simulateStart(data),
  });
};

export const useSimulationStatus = (id: string | null, enabled: boolean) => {
  return useQuery({
    queryKey: ["simulation", "status", id],
    queryFn: () => api.simulateStatus(id!),
    enabled: !!id && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 1000;
    },
  });
};

export const useSimulationResults = (id: string | null) => {
  return useQuery({
    queryKey: ["simulation", "results", id],
    queryFn: () => api.simulateResults(id!),
    enabled: !!id,
  });
};
