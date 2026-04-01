/** Map opinion position (-1..1) to a CSS color */
export const opinionColor = (position: number): string => {
  if (position > 0.15) return "var(--color-opinion-for)";
  if (position < -0.15) return "var(--color-opinion-against)";
  return "var(--color-opinion-neutral)";
};

/** Map opinion position to a Tailwind class */
export const opinionTextClass = (position: number): string => {
  if (position > 0.15) return "text-[var(--color-opinion-for)]";
  if (position < -0.15) return "text-[var(--color-opinion-against)]";
  return "text-[var(--color-opinion-neutral)]";
};

/** Map opinion position to a label */
export const opinionLabel = (position: number): string => {
  if (position > 0.15) return "For";
  if (position < -0.15) return "Against";
  return "Neutral";
};

/** Generate a deterministic gradient from an ID hash */
export const hashGradient = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40 + Math.abs((hash >> 8) % 60)) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 70%, 45%), hsl(${h2}, 60%, 55%))`;
};

/** Confidence level label */
export const confidenceLabel = (confidence: number): string => {
  if (confidence >= 0.8) return "Very confident";
  if (confidence >= 0.6) return "Confident";
  if (confidence >= 0.4) return "Somewhat confident";
  if (confidence >= 0.2) return "Uncertain";
  return "Very uncertain";
};
