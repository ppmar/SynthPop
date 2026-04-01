import Link from "next/link";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-border">
        <AlertCircle className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-foreground mb-2">
        404
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        This page doesn&apos;t exist in the simulation
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-[var(--color-accent-amber)] text-[var(--color-void)] hover:bg-[var(--color-accent-warm)] px-4 py-2 text-sm font-medium transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
