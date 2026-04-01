import type { Persona } from "./persona";

export interface GenerateRequest {
  size: number;
  config_path?: string;
  demographics?: {
    age?: Record<string, number>;
    gender?: Record<string, number>;
    location_type?: Record<string, number>;
    education?: Record<string, number>;
    income_bracket?: Record<string, number>;
  };
}

export interface GenerateResponse {
  population_id: string;
  agents: Persona[];
  count: number;
  cost_usd: number;
}

export interface PollRequest {
  question: string;
  population_size: number;
  population_id?: string;
}

export interface VerbalizedOpinion {
  persona_id: string;
  persona_name: string;
  position: number;
  confidence: number;
  text: string;
  cluster: number;
}

export interface ClusterSummary {
  cluster_id: number;
  label: string;
  mean_position: number;
  agent_count: number;
  percentage: number;
  representative_quotes: VerbalizedOpinion[];
}

export interface PollResponse {
  question: string;
  total_agents: number;
  for_pct: number;
  against_pct: number;
  neutral_pct: number;
  mean_position: number;
  mean_confidence: number;
  clusters: ClusterSummary[];
  opinions: VerbalizedOpinion[];
  cost_usd: number;
}

export interface SimulateStartRequest {
  population_id: string;
  topic: string;
  steps?: number;
  opinion_model?: string;
  network_topology?: string;
}

export interface SimulateStartResponse {
  simulation_id: string;
  status: string;
  total_steps: number;
}

export interface VerbalizeRequest {
  simulation_id?: string;
  population_id?: string;
  topic?: string;
  clusters?: number;
  samples_per_cluster?: number;
}

export interface VerbalizeResponse {
  question: string;
  clusters: ClusterSummary[];
  opinions: VerbalizedOpinion[];
  cost_usd: number;
}
