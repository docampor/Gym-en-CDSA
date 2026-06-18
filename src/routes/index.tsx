import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "@/lib/hooks";
import { db, volumenEntrenamiento } from "@/lib/db";
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
import { format, startOfWeek, startOfMonth, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Play, TrendingUp, Calendar, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio — Gym Tracker" },
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
  const inicioMes = startOfMonth(ahora).getTime();

  const volSemana = entrenamientos
    .filter((e) => e.fecha >= inicioSemana)
    .reduce((a, e) => a + volumenEntrenamiento(e), 0);
  const volMes = entrenamientos
    .filter((e) => e.fecha >= inicioMes)
    .reduce((a, e) => a + volumenEntrenamiento(e), 0);
  const sesionesSemana = entrenamientos.filter((e) => e.fecha >= inicioSemana).length;

  // Volumen últimos 14 días
  const dias = Array.from({ length: 14 }).map((_, i) => {
    const d = subDays(new Date(), 13 - i);
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, "dd/MM", { locale: es });
    const vol = entrenamientos
      .filter((e) => format(new Date(e.fecha), "yyyy-MM-dd") === key)
      .reduce((a, e) => a + volumenEntrenamiento(e), 0);
    return { dia: label, volumen: Math.round(vol) };
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
        <Metric label="Volumen semanal" value={Math.round(volSemana).toLocaleString("es")} unit="kg" icon={<TrendingUp className="h-4 w-4 text-primary" />} />
        <Metric label="Volumen mensual" value={Math.round(volMes).toLocaleString("es")} unit="kg" icon={<Flame className="h-4 w-4 text-warning" />} />
        <Metric label="Sesiones semana" value={sesionesSemana} icon={<Calendar className="h-4 w-4 text-success" />} />
        <Metric label="Total sesiones" value={entrenamientos.length} />
      </div>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Volumen — últimos 14 días</h2>
          <span className="text-xs text-muted-foreground">kg</span>
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
              <Bar dataKey="volumen" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
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
            {entrenamientos.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <div>
                  <div className="font-medium">{e.rutinaNombre || "Sesión libre"}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(e.fecha), "EEE d MMM, HH:mm", { locale: es })} ·{" "}
                    {e.registros.length} ejercicios
                  </div>
                </div>
                <div className="text-right">
                  <div className="metric-value text-lg">
                    {Math.round(volumenEntrenamiento(e)).toLocaleString("es")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">kg vol.</div>
                </div>
              </li>
            ))}
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
  entrenamientos: any[];
  ejMap: Map<number, any>;
}) {
  // Tomar el ejercicio con más historial
  const counts = new Map<number, number>();
  entrenamientos.forEach((e) =>
    e.registros.forEach((r: any) => counts.set(r.ejercicioId, (counts.get(r.ejercicioId) ?? 0) + 1)),
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
      const reg = e.registros.find((r: any) => r.ejercicioId === topId);
      if (!reg) return null;
      const maxPeso = Math.max(...reg.series.map((s: any) => s.peso || 0));
      return {
        fecha: format(new Date(e.fecha), "dd/MM"),
        peso: maxPeso,
      };
    })
    .filter(Boolean) as any[];

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
            <Line type="monotone" dataKey="peso" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
