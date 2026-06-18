import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Dumbbell,
  ListChecks,
  Play,
  HeartPulse,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/entrenar", label: "Entrenar", icon: Play },
  { to: "/rutinas", label: "Rutinas", icon: ListChecks },
  { to: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { to: "/salud", label: "Salud", icon: HeartPulse },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
];

const logoSrc = `${import.meta.env.BASE_URL}cdsa-logo.svg`;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-border bg-sidebar">
        <div className="px-6 py-6">
          <Link to="/" className="inline-flex items-center">
            <img
              src={logoSrc}
              alt="CDSA"
              className="h-24 w-auto rounded-md object-contain"
            />
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <n.icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-xs text-muted-foreground">
          v1 · Offline
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 backdrop-blur px-4 py-3">
        <Link to="/" className="inline-flex items-center">
          <img
            src={logoSrc}
            alt="CDSA"
            className="h-12 w-auto rounded object-contain"
          />
        </Link>
      </header>

      {/* Main */}
      <main className="lg:pl-60 pb-24 lg:pb-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-sidebar/95 backdrop-blur">
        <div className="grid grid-cols-6">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <n.icon className="h-5 w-5" />
                <span className="truncate">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
