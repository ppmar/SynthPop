"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Users, BarChart3, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/poll", label: "Quick Poll", icon: MessageSquare },
  { href: "/population", label: "Population", icon: Users },
  { href: "/simulate", label: "Simulate", icon: BarChart3 },
];

const Navbar = () => {
  const pathname = usePathname();
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/generate?action=list", { signal: AbortSignal.timeout(3000) });
        setApiStatus(res.ok ? "connected" : "disconnected");
      } catch {
        setApiStatus("disconnected");
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColor =
    apiStatus === "connected"
      ? "bg-[var(--color-opinion-for)]"
      : apiStatus === "disconnected"
        ? "bg-[var(--color-opinion-against)]"
        : "bg-[var(--color-opinion-neutral)] animate-pulse";

  const statusLabel =
    apiStatus === "connected" ? "API Connected" : apiStatus === "disconnected" ? "API Offline" : "Checking...";

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-[var(--color-accent-amber)] flex items-center justify-center">
                <span className="font-[family-name:var(--font-display)] text-xs font-bold text-[var(--color-void)]">
                  SP
                </span>
              </div>
              <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-wide text-foreground">
                SynthPop
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "text-[var(--color-accent-amber)] bg-[var(--color-accent-glow)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-[family-name:var(--font-data)]">
              <div className={cn("h-1.5 w-1.5 rounded-full", statusColor)} />
              {statusLabel}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
export { Navbar };
