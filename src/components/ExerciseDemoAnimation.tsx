import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function BenchPressDemo() {
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Demo tecnica</Badge>
            <span className="text-sm font-medium text-foreground">Press de banca</span>
          </div>
          <div className="exercise-demo" aria-label="Animacion de press de banca">
            <svg viewBox="0 0 420 220" role="img">
              <defs>
                <linearGradient id="benchGlow" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.12" />
                  <stop offset="55%" stopColor="var(--color-primary)" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0.12" />
                </linearGradient>
              </defs>

              <rect className="demo-mat" x="24" y="172" width="372" height="12" rx="6" />
              <path className="demo-bench" d="M82 152h176a14 14 0 0 1 14 14v6H68v-6a14 14 0 0 1 14-14Z" />
              <path className="demo-bench-leg" d="M102 172l-18 32M246 172l22 32" />

              <g className="demo-body">
                <path className="demo-limb" d="M132 137c28 11 70 12 104 0" />
                <circle className="demo-joint" cx="118" cy="132" r="13" />
                <path className="demo-torso" d="M132 139c35-33 78-34 111-1" />
                <path className="demo-limb" d="M204 150l42 38M152 150l-40 38" />
                <path className="demo-limb" d="M245 188h40M112 188H76" />
              </g>

              <g className="demo-press">
                <path className="demo-arm demo-arm-left" d="M140 132 166 86" />
                <path className="demo-arm demo-arm-right" d="M230 132 204 86" />
                <circle className="demo-joint demo-hand-left" cx="166" cy="86" r="5" />
                <circle className="demo-joint demo-hand-right" cx="204" cy="86" r="5" />
                <path className="demo-bar" d="M102 78h166" />
                <circle className="demo-plate" cx="90" cy="78" r="15" />
                <circle className="demo-plate" cx="280" cy="78" r="15" />
                <path className="demo-guide" d="M185 77v47" />
              </g>
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
          <Phase label="Bajada" value="Control" />
          <Phase label="Pausa" value="Pecho" />
          <Phase label="Empuje" value="Arriba" />
        </div>
      </div>
    </Card>
  );
}

function Phase({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
