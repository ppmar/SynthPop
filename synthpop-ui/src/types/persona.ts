export interface Persona {
  id: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  education: string;
  location_type: string;
  country: string;
  income_bracket: string;
  personality_traits: string[];
  values: string[];
  political_leaning: number;
  tech_savviness: number;
  risk_tolerance: number;
  influenceability: number;
  backstory: string;
}

export interface OpinionState {
  topic: string;
  position: number;
  confidence: number;
  reasoning_tags: string[];
  last_updated: number;
}

export interface DemographicDistributions {
  age: Record<string, number>;
  gender: Record<string, number>;
  location_type: Record<string, number>;
  education: Record<string, number>;
  income_bracket: Record<string, number>;
}
