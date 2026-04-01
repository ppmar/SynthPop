import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VerbalizeRequest } from "@/types/api";

export const useVerbalize = () => {
  return useMutation({
    mutationFn: (data: VerbalizeRequest) => api.verbalize(data),
  });
};
