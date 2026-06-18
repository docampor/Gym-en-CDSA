import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "@/lib/hooks";
import { db, GRUPOS_MUSCULARES, type Ejercicio } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Dumbbell } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BenchPressDemo } from "@/components/ExerciseDemoAnimation";

export const Route = createFileRoute("/ejercicios")({
  head: () => ({
    meta: [{ title: "Ejercicios — Gym Tracker" }],
  }),
  component: EjerciciosPage,
});

function EjerciciosPage() {
  const ejercicios = useLiveQuery(() => db.ejercicios.orderBy("nombre").toArray(), []);
  const [filtro, setFiltro] = useState("");
  const [grupo, setGrupo] = useState<string>("__all");
  const [editar, setEditar] = useState<Ejercicio | null>(null);
  const [abierto, setAbierto] = useState(false);

  const lista = useMemo(() => {
    return (ejercicios ?? []).filter((e) => {
      const okGrupo = grupo === "__all" || e.grupo === grupo;
      const okFiltro = e.nombre.toLowerCase().includes(filtro.toLowerCase());
      return okGrupo && okFiltro;
    });
  }, [ejercicios, filtro, grupo]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ejercicios</h1>
          <p className="text-sm text-muted-foreground">Tu catálogo personal</p>
        </div>
        <Dialog open={abierto} onOpenChange={(v) => { setAbierto(v); if (!v) setEditar(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditar(null)}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo
            </Button>
          </DialogTrigger>
          <EjercicioDialog
            editar={editar}
            onClose={() => {
              setAbierto(false);
              setEditar(null);
            }}
          />
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-2">
        <Input placeholder="Buscar…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        <Select value={grupo} onValueChange={setGrupo}>
          <SelectTrigger>
            <SelectValue placeholder="Grupo muscular" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos los grupos</SelectItem>
            {GRUPOS_MUSCULARES.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <BenchPressDemo />

      {lista.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Dumbbell className="mx-auto h-8 w-8 mb-2 opacity-50" />
          No hay ejercicios. Creá el primero.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lista.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{e.nombre}</div>
                  <div className="text-xs text-primary">{e.grupo}</div>
                  {e.descripcion && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{e.descripcion}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditar(e);
                      setAbierto(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      if (confirm(`¿Eliminar "${e.nombre}"?`)) {
                        await db.ejercicios.delete(e.id!);
                        toast.success("Ejercicio eliminado");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <HistorialEjercicio ejercicioId={e.id!} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function HistorialEjercicio({ ejercicioId }: { ejercicioId: number }) {
  const sesiones = useLiveQuery(async () => {
    const all = await db.entrenamientos.orderBy("fecha").reverse().toArray();
    return all
      .map((e) => {
        const reg = e.registros.find((r) => r.ejercicioId === ejercicioId);
        if (!reg) return null;
        return { fecha: e.fecha, series: reg.series };
      })
      .filter(Boolean) as { fecha: number; series: any[] }[];
  }, [ejercicioId]);

  if (!sesiones || sesiones.length === 0) return null;

  const maxPeso = Math.max(...sesiones.flatMap((s) => s.series.map((x) => x.peso || 0)));
  const maxReps = Math.max(...sesiones.flatMap((s) => s.series.map((x) => x.reps || 0)));
  const mejorVol = Math.max(
    ...sesiones.map((s) => s.series.reduce((a, x) => a + (x.peso || 0) * (x.reps || 0), 0)),
  );

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="metric-value text-base text-primary">{maxPeso}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">PR Peso (kg)</div>
        </div>
        <div>
          <div className="metric-value text-base text-primary">{maxReps}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reps máx</div>
        </div>
        <div>
          <div className="metric-value text-base text-primary">{Math.round(mejorVol)}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Vol. máx</div>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        Última: {format(new Date(sesiones[0].fecha), "d MMM yyyy", { locale: es })} ·{" "}
        {sesiones.length} sesión(es)
      </div>
    </div>
  );
}

function EjercicioDialog({
  editar,
  onClose,
}: {
  editar: Ejercicio | null;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(editar?.nombre ?? "");
  const [grupo, setGrupo] = useState(editar?.grupo ?? "Pecho");
  const [descripcion, setDescripcion] = useState(editar?.descripcion ?? "");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editar ? "Editar ejercicio" : "Nuevo ejercicio"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Press banca" />
        </div>
        <div>
          <Label>Grupo muscular</Label>
          <Select value={grupo} onValueChange={setGrupo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {GRUPOS_MUSCULARES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Descripción (opcional)</Label>
          <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={async () => {
            if (!nombre.trim()) return toast.error("Ingresá un nombre");
            if (editar?.id) {
              await db.ejercicios.update(editar.id, { nombre, grupo, descripcion });
              toast.success("Ejercicio actualizado");
            } else {
              await db.ejercicios.add({ nombre, grupo, descripcion, creadoEn: Date.now() });
              toast.success("Ejercicio creado");
            }
            onClose();
          }}
        >
          Guardar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
