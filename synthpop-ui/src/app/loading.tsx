import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-amber)]" />
    </div>
  );
};

export default Loading;
