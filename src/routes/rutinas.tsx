import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "@/lib/hooks";
import { db, type Rutina } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ListChecks, Star, ChevronUp, ChevronDown, X, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/rutinas")({
  head: () => ({
    meta: [{ title: "Rutinas — Gym Tracker" }],
  }),
  component: RutinasPage,
});

function RutinasPage() {
  const rutinas = useLiveQuery(() => db.rutinas.toArray(), []);
  const ejercicios = useLiveQuery(() => db.ejercicios.orderBy("nombre").toArray(), []);
  const [abierto, setAbierto] = useState(false);
  const [editar, setEditar] = useState<Rutina | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rutinas</h1>
          <p className="text-sm text-muted-foreground">Organizá tus planes de entrenamiento</p>
        </div>
        <Dialog open={abierto} onOpenChange={(v) => { setAbierto(v); if (!v) setEditar(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditar(null)}>
              <Plus className="h-4 w-4 mr-1" /> Nueva
            </Button>
          </DialogTrigger>
          <RutinaDialog
            editar={editar}
            ejercicios={ejercicios ?? []}
            onClose={() => { setAbierto(false); setEditar(null); }}
          />
        </Dialog>
      </div>

      {!rutinas || rutinas.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <ListChecks className="mx-auto h-8 w-8 mb-2 opacity-50" />
          No hay rutinas. Creá la primera.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rutinas.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{r.nombre}</span>
                    {r.activa && (
                      <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase">
                        Activa
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.ejercicios.length} ejercicio(s)
                  </div>
                  {r.descripcion && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.descripcion}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    title={r.activa ? "Quitar activa" : "Marcar activa"}
                    onClick={async () => {
                      if (!r.activa) {
                        await db.rutinas.toCollection().modify({ activa: false });
                      }
                      await db.rutinas.update(r.id!, { activa: !r.activa });
                    }}
                  >
                    <Star className={r.activa ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { setEditar(r); setAbierto(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      if (confirm(`¿Eliminar "${r.nombre}"?`)) {
                        await db.rutinas.delete(r.id!);
                        toast.success("Rutina eliminada");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button asChild size="sm" className="mt-3 w-full" variant="secondary">
                <Link to="/entrenar" search={{ rutinaId: r.id! }}>
                  <Play className="h-4 w-4 mr-1" /> Entrenar esta rutina
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RutinaDialog({
  editar,
  ejercicios,
  onClose,
}: {
  editar: Rutina | null;
  ejercicios: any[];
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(editar?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(editar?.descripcion ?? "");
  const [lista, setLista] = useState(editar?.ejercicios ?? []);
  const [seleccionado, setSeleccionado] = useState<string>("");

  const ejMap = new Map(ejercicios.map((e) => [e.id, e]));

  function add() {
    const id = parseInt(seleccionado);
    if (!id) return;
    if (lista.some((e) => e.ejercicioId === id)) return toast.error("Ya está agregado");
    setLista([...lista, { ejercicioId: id, orden: lista.length, descansoSeg: 90 }]);
    setSeleccionado("");
  }

  function mover(idx: number, dir: -1 | 1) {
    const nuevo = [...lista];
    const swap = idx + dir;
    if (swap < 0 || swap >= nuevo.length) return;
    [nuevo[idx], nuevo[swap]] = [nuevo[swap], nuevo[idx]];
    setLista(nuevo.map((e, i) => ({ ...e, orden: i })));
  }

  function quitar(idx: number) {
    setLista(lista.filter((_, i) => i !== idx).map((e, i) => ({ ...e, orden: i })));
  }

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editar ? "Editar rutina" : "Nueva rutina"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Día A — Empuje" />
        </div>
        <div>
          <Label>Descripción (opcional)</Label>
          <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        <div>
          <Label>Ejercicios</Label>
          <div className="space-y-2 mt-1">
            {lista.map((it, idx) => {
              const ej = ejMap.get(it.ejercicioId);
              return (
                <div key={idx} className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
                  <span className="metric-value text-sm w-5 text-muted-foreground">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{ej?.nombre ?? "?"}</div>
                    <div className="text-[11px] text-muted-foreground">{ej?.grupo}</div>
                  </div>
                  <Input
                    type="number"
                    className="w-20 h-8"
                    value={it.descansoSeg ?? 90}
                    onChange={(e) =>
                      setLista(lista.map((x, i) => i === idx ? { ...x, descansoSeg: parseInt(e.target.value) || 0 } : x))
                    }
                  />
                  <span className="text-[11px] text-muted-foreground">s</span>
                  <Button size="icon" variant="ghost" onClick={() => mover(idx, -1)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => mover(idx, 1)}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => quitar(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <Select value={seleccionado} onValueChange={setSeleccionado}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Agregar ejercicio…" />
              </SelectTrigger>
              <SelectContent>
                {ejercicios.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.nombre} — {e.grupo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={add} variant="secondary">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={async () => {
            if (!nombre.trim()) return toast.error("Ingresá un nombre");
            const datos = { nombre, descripcion, ejercicios: lista };
            if (editar?.id) {
              await db.rutinas.update(editar.id, datos);
              toast.success("Rutina actualizada");
            } else {
              await db.rutinas.add({ ...datos, creadaEn: Date.now() });
              toast.success("Rutina creada");
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
