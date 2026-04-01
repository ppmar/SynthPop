export const POPULATION_SIZE_MIN = 10;
export const POPULATION_SIZE_MAX = 2000;
export const POPULATION_SIZE_DEFAULT = 100;

export const SIMULATION_STEPS_MIN = 5;
export const SIMULATION_STEPS_MAX = 500;
export const SIMULATION_STEPS_DEFAULT = 50;

export const OPINION_MODELS = [
  { value: "bounded_confidence", label: "Bounded Confidence" },
  { value: "voter", label: "Voter Model" },
] as const;

export const NETWORK_TOPOLOGIES = [
  { value: "small_world", label: "Small World" },
  { value: "scale_free", label: "Scale Free" },
] as const;

export const DEMOGRAPHIC_PRESETS = {
  france_2024: {
    label: "France 2024",
    demographics: {
      age: { "18-25": 0.15, "26-35": 0.2, "36-50": 0.3, "51-65": 0.2, "66+": 0.15 },
      gender: { male: 0.48, female: 0.49, "non-binary": 0.03 },
      location_type: { urban: 0.45, suburban: 0.35, rural: 0.2 },
      education: { bac: 0.25, licence: 0.3, master: 0.25, doctorat: 0.05, autodidacte: 0.15 },
      income_bracket: { low: 0.3, middle: 0.35, "upper-middle": 0.25, high: 0.1 },
    },
  },
  young_urban: {
    label: "Young Urban",
    demographics: {
      age: { "18-25": 0.4, "26-35": 0.35, "36-50": 0.15, "51-65": 0.07, "66+": 0.03 },
      gender: { male: 0.45, female: 0.48, "non-binary": 0.07 },
      location_type: { urban: 0.8, suburban: 0.15, rural: 0.05 },
      education: { bac: 0.15, licence: 0.35, master: 0.35, doctorat: 0.05, autodidacte: 0.1 },
      income_bracket: { low: 0.35, middle: 0.35, "upper-middle": 0.2, high: 0.1 },
    },
  },
  rural_conservative: {
    label: "Rural Conservative",
    demographics: {
      age: { "18-25": 0.08, "26-35": 0.12, "36-50": 0.25, "51-65": 0.3, "66+": 0.25 },
      gender: { male: 0.52, female: 0.47, "non-binary": 0.01 },
      location_type: { urban: 0.1, suburban: 0.25, rural: 0.65 },
      education: { bac: 0.35, licence: 0.25, master: 0.15, doctorat: 0.02, autodidacte: 0.23 },
      income_bracket: { low: 0.35, middle: 0.4, "upper-middle": 0.18, high: 0.07 },
    },
  },
} as const;

export const POLL_SUGGESTIONS = [
  "Should university education be free?",
  "Is remote work better than office work?",
  "Should AI be regulated by governments?",
  "Is nuclear energy the solution to climate change?",
  "Should social media have age restrictions?",
];
