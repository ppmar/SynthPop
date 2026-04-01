"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AvatarHash } from "./AvatarHash";
import type { Persona } from "@/types/persona";

interface AgentCardProps {
  agent: Persona;
  className?: string;
}

const AgentCard = ({ agent, className }: AgentCardProps) => {
  return (
    <Link
      href={`/population/${agent.id}`}
      className={cn(
        "block rounded-xl border border-border bg-[var(--color-surface)] p-4 transition-all hover:bg-[var(--color-elevated)] hover:border-[var(--color-accent-amber)]/20",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <AvatarHash id={agent.id} name={agent.name} size="md" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {agent.age} &middot; {agent.occupation}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
        {agent.backstory}
      </p>

      <div className="flex flex-wrap gap-1">
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
          {agent.location_type}
        </span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
          {agent.education}
        </span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
          {agent.income_bracket}
        </span>
      </div>
    </Link>
  );
};

export default AgentCard;
export { AgentCard };
