export interface SimConfig {
  topic: string;
  steps: number;
  opinion_model: "bounded_confidence" | "voter";
  network_topology: "small_world" | "scale_free";
}

export interface StepSnapshot {
  step: number;
  mean_opinion: number;
  opinion_variance: number;
  mean_confidence: number;
}

export interface SimulationStats {
  topic: string;
  total_agents: number;
  total_steps: number;
  final_mean_opinion: number;
  final_variance: number;
  final_mean_confidence: number;
  polarization_index: number;
  convergence_step: number | null;
  for_pct: number;
  against_pct: number;
  neutral_pct: number;
}

export interface SimulationStatus {
  simulation_id: string;
  status: "pending" | "running" | "completed" | "failed";
  current_step: number;
  total_steps: number;
  snapshots: StepSnapshot[];
}

export interface SimulationResults {
  simulation_id: string;
  stats: SimulationStats;
  timeseries: StepSnapshot[];
  final_opinions: AgentOpinion[];
}

export interface AgentOpinion {
  persona: Record<string, unknown>;
  opinion: {
    topic: string;
    position: number;
    confidence: number;
    reasoning_tags: string[];
    last_updated: number;
  };
}
