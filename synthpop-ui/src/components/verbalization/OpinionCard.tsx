"use client";

import { cn } from "@/lib/utils";
import { AvatarHash } from "@/components/population/AvatarHash";
import { OpinionBadge } from "@/components/shared/OpinionBadge";
import { ConfidenceRing } from "@/components/shared/ConfidenceRing";
import type { VerbalizedOpinion } from "@/types/api";

interface OpinionCardProps {
  opinion: VerbalizedOpinion;
  className?: string;
}

const OpinionCard = ({ opinion, className }: OpinionCardProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-[var(--color-surface)] p-4",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <AvatarHash id={opinion.persona_id} name={opinion.persona_name} size="sm" />
          <span className="text-sm font-medium text-foreground">{opinion.persona_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceRing confidence={opinion.confidence} size={28} />
          <OpinionBadge position={opinion.position} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{opinion.text}</p>
    </div>
  );
};

export default OpinionCard;
export { OpinionCard };
