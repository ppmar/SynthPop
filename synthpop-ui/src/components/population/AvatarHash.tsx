"use client";

import { cn } from "@/lib/utils";
import { hashGradient } from "@/lib/colors";

interface AvatarHashProps {
  id: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-16 w-16 text-lg",
};

const AvatarHash = ({ id, name, size = "md", className }: AvatarHashProps) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white shrink-0",
        SIZES[size],
        className
      )}
      style={{ background: hashGradient(id) }}
    >
      {initials}
    </div>
  );
};

export default AvatarHash;
export { AvatarHash };
