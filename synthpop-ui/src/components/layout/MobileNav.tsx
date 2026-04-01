"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, MessageSquare, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Activity },
  { href: "/poll", label: "Poll", icon: MessageSquare },
  { href: "/population", label: "Population", icon: Users },
  { href: "/simulate", label: "Simulate", icon: BarChart3 },
];

const MobileNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-border sm:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] transition-colors",
                isActive
                  ? "text-[var(--color-accent-amber)]"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
export { MobileNav };
