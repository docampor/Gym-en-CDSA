import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "@/lib/hooks";
import { db, volumenSerie, type Entrenamiento, type RegistroEjercicio, type Serie } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Check, X, Dumbbell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RestTimer } from "@/components/RestTimer";
import { z } from "zod";

const search = z.object({
  rutinaId: z.coerce.number().optional(),
});

export const Route = createFileRoute("/entrenar")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Gym CDSA" }] }),
  component: EntrenarPage,
});

function EntrenarPage() {
  const { rutinaId } = Route.useSearch();
  const navigate = useNavigate();
  const rutinas = useLiveQuery(() => db.rutinas.toArray(), []);
  const ejercicios = useLiveQuery(() => db.ejercicios.orderBy("nombre").toArray(), []);

  const [rutinaSelId, setRutinaSelId] = useState<number | undefined>(rutinaId);
  const [registros, setRegistros] = useState<RegistroEjercicio[]>([]);
  const [notas, setNotas] = useState("");
  const [descansoActual, setDescansoActual] = useState(90);
  const [iniciado, setIniciado] = useState(false);

  const ejMap = useMemo(
    () => new Map((ejercicios ?? []).map((e) => [e.id!, e])),
    [ejercicios],
  );

  // Inicialización desde rutina
  useEffect(() => {
    if (!iniciado && rutinaSelId && rutinas) {
      const r = rutinas.find((x) => x.id === rutinaSelId);
      if (r) {
        setRegistros(r.ejercicios.map((re) => ({ ejercicioId: re.ejercicioId, series: [] })));
      }
    }
  }, [rutinaSelId, rutinas, iniciado]);

  // Si no hay rutina pasada, autodetectar la activa
  useEffect(() => {
    if (!rutinaSelId && rutinas) {
      const activa = rutinas.find((r) => r.activa);
      if (activa) setRutinaSelId(activa.id);
    }
  }, [rutinas, rutinaSelId]);

  function iniciar() {
    if (registros.length === 0) {
      return toast.error("Seleccioná una rutina o agregá ejercicios");
    }
    setIniciado(true);
  }

  function addSerie(idx: number) {
    const r = [...registros];
    const last = r[idx].series[r[idx].series.length - 1];
    r[idx].series.push({ peso: last?.peso ?? 0, reps: last?.reps ?? 0 });
    setRegistros(r);
  }

  function updSerie(ri: number, si: number, patch: Partial<Serie>) {
    const r = [...registros];
    r[ri].series[si] = { ...r[ri].series[si], ...patch };
    setRegistros(r);
  }

  function delSerie(ri: number, si: number) {
    const r = [...registros];
    r[ri].series.splice(si, 1);
    setRegistros(r);
  }

  function addEjercicio(id: number) {
    if (registros.some((r) => r.ejercicioId === id)) return toast.error("Ya está agregado");
    setRegistros([...registros, { ejercicioId: id, series: [] }]);
  }

  function quitarEjercicio(idx: number) {
    setRegistros(registros.filter((_, i) => i !== idx));
  }

  async function guardar() {
    const limpio = registros
      .map((r) => ({ ...r, series: r.series.filter((s) => s.peso > 0 || s.reps > 0) }))
      .filter((r) => r.series.length > 0);
    if (limpio.length === 0) {
      return toast.error("Registrá al menos una serie");
    }
    const rutinaNombre = rutinas?.find((r) => r.id === rutinaSelId)?.nombre;
    const ent: Entrenamiento = {
      fecha: Date.now(),
      rutinaId: rutinaSelId,
      rutinaNombre,
      registros: limpio,
      notas,
    };
    await db.entrenamientos.add(ent);
    toast.success("Entrenamiento guardado");
    navigate({ to: "/" });
  }

  if (!iniciado) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Iniciar entrenamiento</h1>
          <p className="text-sm text-muted-foreground">Elegí una rutina o registrá ejercicios sueltos</p>
        </div>
        <Card className="p-4 space-y-3">
          <div>
            <Label>Rutina</Label>
            <Select
              value={rutinaSelId ? String(rutinaSelId) : "__none"}
              onValueChange={(v) => {
                if (v === "__none") {
                  setRutinaSelId(undefined);
                  setRegistros([]);
                } else {
                  setRutinaSelId(parseInt(v));
                }
              }}
            >
              <SelectTrigger><SelectValue placeholder="Sin rutina" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Sin rutina (libre)</SelectItem>
                {rutinas?.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.nombre} {r.activa ? "★" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descanso por defecto (s)</Label>
            <Input
              type="number"
              value={descansoActual}
              onChange={(e) => setDescansoActual(parseInt(e.target.value) || 0)}
            />
          </div>
          {registros.length > 0 && (
            <div className="rounded-md bg-muted/40 p-2">
              <div className="text-xs text-muted-foreground mb-1">{registros.length} ejercicio(s) cargado(s)</div>
              <ul className="text-sm space-y-1">
                {registros.map((r, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>{ejMap.get(r.ejercicioId)?.nombre ?? "?"}</span>
                    <Button size="icon" variant="ghost" onClick={() => quitarEjercicio(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <AgregarEjercicio ejercicios={ejercicios ?? []} onAdd={addEjercicio} />
          <Button onClick={iniciar} className="w-full" size="lg">
            <Dumbbell className="h-4 w-4 mr-1" /> Comenzar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Entrenando</h1>
          <p className="text-sm text-muted-foreground">
            {rutinas?.find((r) => r.id === rutinaSelId)?.nombre ?? "Sesión libre"}
          </p>
        </div>
        <Button onClick={guardar}>
          <Check className="h-4 w-4 mr-1" /> Finalizar
        </Button>
      </div>

      <RestTimer defaultSeconds={descansoActual} />

      {registros.map((r, ri) => {
        const ej = ejMap.get(r.ejercicioId);
        return (
          <Card key={ri} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold">{ej?.nombre}</div>
                <div className="text-xs text-primary">{ej?.grupo}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => quitarEjercicio(ri)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-[24px_1fr_1fr_1fr_32px] gap-2 items-center text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
              <div>#</div>
              <div>Peso (kg)</div>
              <div>Reps</div>
              <div>Obs.</div>
              <div />
            </div>
            <div className="space-y-1.5">
              {r.series.map((s, si) => (
                <div key={si} className="grid grid-cols-[24px_1fr_1fr_1fr_32px] gap-2 items-center">
                  <div className="metric-value text-sm text-muted-foreground">{si + 1}</div>
                  <Input
                    inputMode="decimal"
                    type="number"
                    value={s.peso}
                    onChange={(e) => updSerie(ri, si, { peso: parseFloat(e.target.value) || 0 })}
                    className="h-9"
                  />
                  <Input
                    inputMode="numeric"
                    type="number"
                    value={s.reps}
                    onChange={(e) => updSerie(ri, si, { reps: parseInt(e.target.value) || 0 })}
                    className="h-9"
                  />
                  <Input
                    value={s.observaciones ?? ""}
                    onChange={(e) => updSerie(ri, si, { observaciones: e.target.value })}
                    className="h-9"
                    placeholder="—"
                  />
                  <Button size="icon" variant="ghost" onClick={() => delSerie(ri, si)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Vol: {Math.round(r.series.reduce((a, s) => a + volumenSerie(s), 0))} kg
              </span>
              <Button size="sm" variant="secondary" onClick={() => addSerie(ri)}>
                <Plus className="h-4 w-4 mr-1" /> Serie
              </Button>
            </div>
          </Card>
        );
      })}

      <Card className="p-4">
        <AgregarEjercicio ejercicios={ejercicios ?? []} onAdd={addEjercicio} />
      </Card>

      <Card className="p-4">
        <Label>Notas de la sesión</Label>
        <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="mt-1" />
      </Card>

      <Button onClick={guardar} className="w-full" size="lg">
        <Check className="h-4 w-4 mr-1" /> Finalizar y guardar
      </Button>
    </div>
  );
}

function AgregarEjercicio({
  ejercicios,
  onAdd,
}: {
  ejercicios: any[];
  onAdd: (id: number) => void;
}) {
  const [sel, setSel] = useState("");
  return (
    <div className="flex gap-2">
      <Select value={sel} onValueChange={setSel}>
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
      <Button
        variant="secondary"
        onClick={() => {
          const id = parseInt(sel);
          if (id) {
            onAdd(id);
            setSel("");
          }
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
