import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GenerateRequest } from "@/types/api";

export const useGeneratePopulation = () => {
  return useMutation({
    mutationFn: (data: GenerateRequest) => api.generate(data),
  });
};

export const usePopulation = (id: string | null) => {
  return useQuery({
    queryKey: ["population", id],
    queryFn: () => api.getPopulation(id!),
    enabled: !!id,
  });
};

export const usePopulations = () => {
  return useQuery({
    queryKey: ["populations"],
    queryFn: () => api.getPopulations(),
  });
};
