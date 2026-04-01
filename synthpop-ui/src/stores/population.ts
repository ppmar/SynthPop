import { create } from "zustand";
import type { Persona, DemographicDistributions } from "@/types/persona";

interface PopulationState {
  populationId: string | null;
  agents: Persona[];
  demographics: DemographicDistributions;
  size: number;
  isGenerating: boolean;
  costUsd: number;

  setPopulationId: (id: string | null) => void;
  setAgents: (agents: Persona[]) => void;
  setDemographics: (demographics: DemographicDistributions) => void;
  setSize: (size: number) => void;
  setIsGenerating: (v: boolean) => void;
  addCost: (amount: number) => void;
  reset: () => void;
}

const DEFAULT_DEMOGRAPHICS: DemographicDistributions = {
  age: {
    "18-25": 0.15,
    "26-35": 0.2,
    "36-50": 0.3,
    "51-65": 0.2,
    "66+": 0.15,
  },
  gender: {
    male: 0.48,
    female: 0.49,
    "non-binary": 0.03,
  },
  location_type: {
    urban: 0.45,
    suburban: 0.35,
    rural: 0.2,
  },
  education: {
    bac: 0.25,
    licence: 0.3,
    master: 0.25,
    doctorat: 0.05,
    autodidacte: 0.15,
  },
  income_bracket: {
    low: 0.3,
    middle: 0.35,
    "upper-middle": 0.25,
    high: 0.1,
  },
};

export const usePopulationStore = create<PopulationState>((set) => ({
  populationId: null,
  agents: [],
  demographics: DEFAULT_DEMOGRAPHICS,
  size: 100,
  isGenerating: false,
  costUsd: 0,

  setPopulationId: (id) => set({ populationId: id }),
  setAgents: (agents) => set({ agents }),
  setDemographics: (demographics) => set({ demographics }),
  setSize: (size) => set({ size }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  addCost: (amount) => set((s) => ({ costUsd: s.costUsd + amount })),
  reset: () =>
    set({
      populationId: null,
      agents: [],
      size: 100,
      demographics: DEFAULT_DEMOGRAPHICS,
      isGenerating: false,
      costUsd: 0,
    }),
}));

export { DEFAULT_DEMOGRAPHICS };
