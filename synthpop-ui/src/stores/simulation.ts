import { create } from "zustand";
import type { SimConfig, SimulationStatus, SimulationResults } from "@/types/simulation";

interface SimulationState {
  config: SimConfig;
  simulationId: string | null;
  status: SimulationStatus | null;
  results: SimulationResults | null;
  isRunning: boolean;
  costUsd: number;

  setConfig: (config: Partial<SimConfig>) => void;
  setSimulationId: (id: string | null) => void;
  setStatus: (status: SimulationStatus | null) => void;
  setResults: (results: SimulationResults | null) => void;
  setIsRunning: (v: boolean) => void;
  addCost: (amount: number) => void;
  reset: () => void;
}

const DEFAULT_CONFIG: SimConfig = {
  topic: "",
  steps: 50,
  opinion_model: "bounded_confidence",
  network_topology: "small_world",
};

export const useSimulationStore = create<SimulationState>((set) => ({
  config: DEFAULT_CONFIG,
  simulationId: null,
  status: null,
  results: null,
  isRunning: false,
  costUsd: 0,

  setConfig: (partial) =>
    set((s) => ({ config: { ...s.config, ...partial } })),
  setSimulationId: (id) => set({ simulationId: id }),
  setStatus: (status) => set({ status }),
  setResults: (results) => set({ results }),
  setIsRunning: (v) => set({ isRunning: v }),
  addCost: (amount) => set((s) => ({ costUsd: s.costUsd + amount })),
  reset: () =>
    set({
      config: DEFAULT_CONFIG,
      simulationId: null,
      status: null,
      results: null,
      isRunning: false,
      costUsd: 0,
    }),
}));

export { DEFAULT_CONFIG };
