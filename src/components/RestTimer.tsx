import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Timer as TimerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function beep() {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start();
    o.stop(ctx.currentTime + 0.65);
  } catch {}
}

export function RestTimer({
  defaultSeconds = 90,
  compact = false,
}: {
  defaultSeconds?: number;
  compact?: boolean;
}) {
  const [duration, setDuration] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const [flash, setFlash] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    setDuration(defaultSeconds);
    setRemaining(defaultSeconds);
    setRunning(false);
  }, [defaultSeconds]);

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          beep();
          setFlash(true);
          setTimeout(() => setFlash(false), 1500);
          if ("vibrate" in navigator) navigator.vibrate?.([200, 100, 200]);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [running]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = duration > 0 ? (remaining / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition",
        flash && "ring-2 ring-primary glow-primary",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TimerIcon className="h-4 w-4" />
          Descanso
        </div>
        {!compact && (
          <div className="flex items-center gap-1 text-xs">
            {[30, 60, 90, 120, 180].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setDuration(s);
                  setRunning(false);
                }}
                className={cn(
                  "rounded-md px-2 py-1",
                  duration === s
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {s}s
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="metric-value text-4xl">
          {mm}:{ss}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setRunning((v) => !v)}>
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setRunning(false);
              setRemaining(duration);
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
