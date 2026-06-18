import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "@/lib/hooks";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Scale, HeartPulse, Moon } from "lucide-react";

export const Route = createFileRoute("/salud")({
  head: () => ({ meta: [{ title: "Gym CDSA" }] }),
  component: SaludPage,
});

function SaludPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Salud</h1>
        <p className="text-sm text-muted-foreground">Peso, presión y sueño</p>
      </div>
      <Tabs defaultValue="peso">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="peso"><Scale className="h-4 w-4 mr-1" />Peso</TabsTrigger>
          <TabsTrigger value="presion"><HeartPulse className="h-4 w-4 mr-1" />Presión</TabsTrigger>
          <TabsTrigger value="sueno"><Moon className="h-4 w-4 mr-1" />Sueño</TabsTrigger>
        </TabsList>
        <TabsContent value="peso"><PesoTab /></TabsContent>
        <TabsContent value="presion"><PresionTab /></TabsContent>
        <TabsContent value="sueno"><SuenoTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function chartProps() {
  return {
    grid: <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />,
    tooltipStyle: {
      background: "var(--color-card)",
      border: "1px solid var(--color-border)",
      borderRadius: 8,
    },
  };
}

function PesoTab() {
  const datos = useLiveQuery(() => db.pesos.orderBy("fecha").toArray(), []);
  const [peso, setPeso] = useState("");
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const cp = chartProps();
  const chart = (datos ?? []).map((d) => ({ fecha: format(d.fecha, "dd/MM"), peso: d.pesoKg }));

  return (
    <div className="space-y-3 mt-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <Label>Peso (kg)</Label>
            <Input type="number" inputMode="decimal" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} />
          </div>
          <Button
            onClick={async () => {
              const v = parseFloat(peso);
              if (!v) return toast.error("Ingresá un peso");
              await db.pesos.add({ fecha: new Date(fecha).getTime(), pesoKg: v });
              setPeso("");
              toast.success("Registrado");
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Registrar
          </Button>
        </div>
      </Card>
      {chart.length > 0 && (
        <Card className="p-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                {cp.grid}
                <XAxis dataKey="fecha" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} domain={["auto", "auto"]} />
                <Tooltip contentStyle={cp.tooltipStyle} />
                <Line type="monotone" dataKey="peso" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      <Lista
        items={(datos ?? []).slice().reverse().map((d) => ({
          id: d.id!,
          principal: `${d.pesoKg} kg`,
          fecha: d.fecha,
          onDel: () => db.pesos.delete(d.id!),
        }))}
      />
    </div>
  );
}

function PresionTab() {
  const datos = useLiveQuery(() => db.presiones.orderBy("fecha").toArray(), []);
  const [sis, setSis] = useState("");
  const [dia, setDia] = useState("");
  const [pul, setPul] = useState("");
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const cp = chartProps();
  const chart = (datos ?? []).map((d) => ({
    fecha: format(d.fecha, "dd/MM"),
    sistolica: d.sistolica,
    diastolica: d.diastolica,
  }));

  return (
    <div className="space-y-3 mt-4">
      <Card className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
          <div className="col-span-2 sm:col-span-1">
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <Label>Sistólica</Label>
            <Input type="number" value={sis} onChange={(e) => setSis(e.target.value)} />
          </div>
          <div>
            <Label>Diastólica</Label>
            <Input type="number" value={dia} onChange={(e) => setDia(e.target.value)} />
          </div>
          <div>
            <Label>Pulso (opc.)</Label>
            <Input type="number" value={pul} onChange={(e) => setPul(e.target.value)} />
          </div>
        </div>
        <Button
          className="mt-3"
          onClick={async () => {
            const s = parseInt(sis), d = parseInt(dia);
            if (!s || !d) return toast.error("Ingresá sistólica y diastólica");
            await db.presiones.add({
              fecha: new Date(fecha).getTime(),
              sistolica: s,
              diastolica: d,
              pulso: pul ? parseInt(pul) : undefined,
            });
            setSis(""); setDia(""); setPul("");
            toast.success("Registrado");
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Registrar
        </Button>
      </Card>
      {chart.length > 0 && (
        <Card className="p-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                {cp.grid}
                <XAxis dataKey="fecha" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={cp.tooltipStyle} />
                <Line type="monotone" dataKey="sistolica" stroke="var(--color-chart-4)" strokeWidth={2} />
                <Line type="monotone" dataKey="diastolica" stroke="var(--color-primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      <Lista
        items={(datos ?? []).slice().reverse().map((d) => ({
          id: d.id!,
          principal: `${d.sistolica}/${d.diastolica}${d.pulso ? ` · ${d.pulso} bpm` : ""}`,
          fecha: d.fecha,
          onDel: () => db.presiones.delete(d.id!),
        }))}
      />
    </div>
  );
}

function SuenoTab() {
  const datos = useLiveQuery(() => db.suenos.orderBy("fecha").toArray(), []);
  const [horas, setHoras] = useState("");
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const cp = chartProps();
  const chart = (datos ?? []).map((d) => ({ fecha: format(d.fecha, "dd/MM"), horas: d.horas }));

  return (
    <div className="space-y-3 mt-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <Label>Horas dormidas</Label>
            <Input type="number" step="0.1" value={horas} onChange={(e) => setHoras(e.target.value)} />
          </div>
          <Button
            onClick={async () => {
              const h = parseFloat(horas);
              if (!h) return toast.error("Ingresá las horas");
              await db.suenos.add({ fecha: new Date(fecha).getTime(), horas: h });
              setHoras("");
              toast.success("Registrado");
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Registrar
          </Button>
        </div>
      </Card>
      {chart.length > 0 && (
        <Card className="p-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                {cp.grid}
                <XAxis dataKey="fecha" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={cp.tooltipStyle} />
                <Line type="monotone" dataKey="horas" stroke="var(--color-chart-5)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      <Lista
        items={(datos ?? []).slice().reverse().map((d) => ({
          id: d.id!,
          principal: `${d.horas} h`,
          fecha: d.fecha,
          onDel: () => db.suenos.delete(d.id!),
        }))}
      />
    </div>
  );
}

function Lista({
  items,
}: {
  items: { id: number; principal: string; fecha: number; onDel: () => Promise<any> }[];
}) {
  if (items.length === 0) return null;
  return (
    <Card className="p-2">
      <ul className="divide-y divide-border">
        {items.slice(0, 30).map((it) => (
          <li key={it.id} className="flex items-center justify-between px-2 py-2">
            <div>
              <div className="metric-value text-base">{it.principal}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(it.fecha), "EEE d MMM yyyy", { locale: es })}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={async () => {
                await it.onDel();
                toast.success("Eliminado");
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
