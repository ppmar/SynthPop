"use client";

import { Textarea } from "@/components/ui/textarea";
import { POLL_SUGGESTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const QuestionInput = ({ value, onChange, disabled, className }: QuestionInputProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What do you want to ask?"
        disabled={disabled}
        className="min-h-[100px] bg-[var(--color-surface)] border-border text-base resize-none placeholder:text-muted-foreground/50"
      />
      <div className="flex flex-wrap gap-2">
        {POLL_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onChange(suggestion)}
            disabled={disabled}
            className="rounded-full border border-border bg-[var(--color-surface)] px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-[var(--color-accent-amber)]/30 transition-colors disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionInput;
export { QuestionInput };
