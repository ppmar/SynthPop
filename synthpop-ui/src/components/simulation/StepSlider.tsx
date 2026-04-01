"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface StepSliderProps {
  currentStep: number;
  totalSteps: number;
  onChange: (step: number) => void;
  className?: string;
}

const StepSlider = ({ currentStep, totalSteps, onChange, className }: StepSliderProps) => {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="text-xs text-muted-foreground whitespace-nowrap">Step</span>
      <Slider
        value={[currentStep]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        min={0}
        max={totalSteps}
        step={1}
        className="flex-1"
      />
      <span className="text-xs font-[family-name:var(--font-data)] text-[var(--color-accent-amber)] w-16 text-right">
        {currentStep} / {totalSteps}
      </span>
    </div>
  );
};

export default StepSlider;
export { StepSlider };
