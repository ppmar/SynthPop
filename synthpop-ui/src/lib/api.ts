import type { GenerateRequest, GenerateResponse, PollRequest, PollResponse, SimulateStartRequest, SimulateStartResponse, VerbalizeRequest, VerbalizeResponse } from "@/types/api";
import type { SimulationStatus, SimulationResults } from "@/types/simulation";
import type { Persona } from "@/types/persona";

const API_BASE = "/api";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "Unknown error");
    throw new ApiError(body, res.status);
  }
  return res.json() as Promise<T>;
};

export const api = {
  generate: (data: GenerateRequest) =>
    request<GenerateResponse>("/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  poll: (data: PollRequest) =>
    request<PollResponse>("/poll", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  simulateStart: (data: SimulateStartRequest) =>
    request<SimulateStartResponse>("/simulate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  simulateStatus: (id: string) =>
    request<SimulationStatus>(`/simulate?id=${id}&action=status`),

  simulateResults: (id: string) =>
    request<SimulationResults>(`/simulate?id=${id}&action=results`),

  verbalize: (data: VerbalizeRequest) =>
    request<VerbalizeResponse>("/verbalize", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPopulations: () =>
    request<Record<string, { agents: Persona[]; count: number }>>("/generate?action=list"),

  getPopulation: (id: string) =>
    request<{ population_id: string; agents: Persona[]; count: number }>(`/generate?id=${id}`),
};

export { ApiError };
