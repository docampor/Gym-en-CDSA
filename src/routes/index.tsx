import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "@/lib/hooks";
import {
  db,
  resumenEntrenamiento,
  tipoEntrenamiento,
  tituloEntrenamiento,
  volumenEntrenamiento,
  type Ejercicio,
  type Entrenamiento,
  type RegistroEjercicio,
  type Serie,
  type TipoActividad,
} from "@/lib/db";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { format, startOfWeek, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Play, Calendar, Bike, Waves, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gym CDSA" },
      { name: "description", content: "Resumen de entrenamientos, volumen y progreso." },
    ],
  }),
  component: Dashboard,
});

function Metric({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="metric-value text-3xl text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </Card>
  );
}

const activityLabel: Record<TipoActividad, string> = {
  gimnasio: "Gimnasio",
  natacion: "Natacion",
  bici: "Bici",
};

const activityBadge: Record<TipoActividad, string> = {
  gimnasio: "border-primary/30 bg-primary/15 text-primary",
  natacion: "border-cyan-400/30 bg-cyan-400/15 text-cyan-300",
  bici: "border-emerald-400/30 bg-emerald-400/15 text-emerald-300",
};

function Dashboard() {
  const entrenamientos = useLiveQuery(
    () => db.entrenamientos.orderBy("fecha").reverse().toArray(),
    [],
  );
  const ejercicios = useLiveQuery(() => db.ejercicios.toArray(), []);

  if (!entrenamientos || !ejercicios) {
    return <div className="text-muted-foreground">Cargando…</div>;
  }

  const ahora = Date.now();
  const inicioSemana = startOfWeek(ahora, { weekStartsOn: 1 }).getTime();
  const entrenamientosSemana = entrenamientos.filter((e) => e.fecha >= inicioSemana);
  const volSemana = entrenamientosSemana
    .filter((e) => tipoEntrenamiento(e) === "gimnasio")
    .reduce((a, e) => a + volumenEntrenamiento(e), 0);
  const sesionesSemana = entrenamientosSemana.length;
  const natacionSemana = entrenamientosSemana
    .filter((e) => tipoEntrenamiento(e) === "natacion")
    .reduce((a, e) => a + (e.natacion?.distanciaM ?? 0), 0);
  const biciSemana = entrenamientosSemana
    .filter((e) => tipoEntrenamiento(e) === "bici")
    .reduce((a, e) => a + (e.bici?.distanciaKm ?? 0), 0);

  // Volumen últimos 14 días
  const dias = Array.from({ length: 14 }).map((_, i) => {
    const d = subDays(new Date(), 13 - i);
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, "dd/MM", { locale: es });
    const delDia = entrenamientos.filter((e) => format(new Date(e.fecha), "yyyy-MM-dd") === key);
    return {
      dia: label,
      gimnasio: delDia.filter((e) => tipoEntrenamiento(e) === "gimnasio").length,
      natacion: delDia.filter((e) => tipoEntrenamiento(e) === "natacion").length,
      bici: delDia.filter((e) => tipoEntrenamiento(e) === "bici").length,
    };
  });

  const ejMap = new Map(ejercicios.map((e) => [e.id!, e]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hola 👋</h1>
          <p className="text-sm text-muted-foreground">Tu progreso esta semana</p>
        </div>
        <Button asChild>
          <Link to="/entrenar">
            <Play className="h-4 w-4 mr-1" /> Entrenar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric
          label="Gimnasio semana"
          value={Math.round(volSemana).toLocaleString("es")}
          unit="kg"
          icon={<Dumbbell className="h-4 w-4 text-primary" />}
        />
        <Metric
          label="Natacion semana"
          value={Math.round(natacionSemana).toLocaleString("es")}
          unit="m"
          icon={<Waves className="h-4 w-4 text-cyan-300" />}
        />
        <Metric
          label="Bici semana"
          value={biciSemana.toFixed(1)}
          unit="km"
          icon={<Bike className="h-4 w-4 text-emerald-300" />}
        />
        <Metric
          label="Sesiones semana"
          value={sesionesSemana}
          icon={<Calendar className="h-4 w-4 text-success" />}
        />
      </div>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Actividades — ultimos 14 dias</h2>
          <span className="text-xs text-muted-foreground">sesiones</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dias}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="dia" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                }}
              />
              <Bar
                dataKey="gimnasio"
                stackId="a"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="natacion" stackId="a" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bici" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Últimos entrenamientos</h2>
        {entrenamientos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no registraste entrenamientos.</p>
        ) : (
          <ul className="space-y-2">
            {entrenamientos.slice(0, 5).map((e) => {
              const tipo = tipoEntrenamiento(e);
              return (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{tituloEntrenamiento(e)}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${activityBadge[tipo]}`}
                      >
                        {activityLabel[tipo]}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(e.fecha), "EEE d MMM, HH:mm", { locale: es })} ·{" "}
                      {resumenEntrenamiento(e)}
                    </div>
                  </div>
                  {tipo === "gimnasio" && (
                    <div className="text-right">
                      <div className="metric-value text-lg">
                        {Math.round(volumenEntrenamiento(e)).toLocaleString("es")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">kg vol.</div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <EvolucionCargas entrenamientos={entrenamientos} ejMap={ejMap} />
    </div>
  );
}

function EvolucionCargas({
  entrenamientos,
  ejMap,
}: {
  entrenamientos: Entrenamiento[];
  ejMap: Map<number, Ejercicio>;
}) {
  // Tomar el ejercicio con más historial
  const counts = new Map<number, number>();
  entrenamientos.forEach((e) =>
    (e.registros ?? []).forEach((r: RegistroEjercicio) =>
      counts.set(r.ejercicioId, (counts.get(r.ejercicioId) ?? 0) + 1),
    ),
  );
  let topId: number | undefined;
  let max = 0;
  counts.forEach((v, k) => {
    if (v > max) {
      max = v;
      topId = k;
    }
  });
  if (!topId) return null;
  const ej = ejMap.get(topId);
  const datos = entrenamientos
    .slice()
    .reverse()
    .map((e) => {
      const reg = e.registros?.find((r: RegistroEjercicio) => r.ejercicioId === topId);
      if (!reg) return null;
      const maxPeso = Math.max(...reg.series.map((s: Serie) => s.peso || 0));
      return {
        fecha: format(new Date(e.fecha), "dd/MM"),
        peso: maxPeso,
      };
    })
    .filter((item): item is { fecha: string; peso: number } => item !== null);

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">Evolución — {ej?.nombre ?? "ejercicio"}</h2>
        <span className="text-xs text-muted-foreground">kg máx.</span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="fecha" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
              }}
            />
            <Line
              type="monotone"
              dataKey="peso"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
