import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "@/lib/hooks";
import {
  db,
  volumenSerie,
  type Ejercicio,
  type Entrenamiento,
  type RegistroEjercicio,
  type Serie,
  type TipoActividad,
} from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Check, X, Dumbbell, Bike, Waves, ArrowLeft, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

const todayInput = () => new Date().toISOString().slice(0, 10);

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

  const [tipo, setTipo] = useState<TipoActividad>("gimnasio");
  const [rutinaSelId, setRutinaSelId] = useState<number | undefined>(rutinaId);
  const [registros, setRegistros] = useState<RegistroEjercicio[]>([]);
  const [notas, setNotas] = useState("");
  const [descansoActual, setDescansoActual] = useState(90);
  const [iniciado, setIniciado] = useState(false);
  const [fechaActividad, setFechaActividad] = useState(todayInput());
  const [natacion, setNatacion] = useState({
    distanciaM: "",
    duracionMin: "",
    piletaM: "25",
    estilo: "Libre",
    intensidad: "Media",
  });
  const [bici, setBici] = useState({
    distanciaKm: "",
    duracionMin: "",
    desnivelM: "",
    fcPromedio: "",
    modalidad: "Ruta",
    intensidad: "Media",
  });

  const ejMap = useMemo(() => new Map((ejercicios ?? []).map((e) => [e.id!, e])), [ejercicios]);

  // Inicialización desde rutina
  useEffect(() => {
    if (!iniciado && rutinaSelId && rutinas) {
      const r = rutinas.find((x) => x.id === rutinaSelId);
      if (r) {
        setRegistros(
          r.ejercicios.map((re) => ({
            ejercicioId: re.ejercicioId,
            descansoSeg: re.descansoSeg ?? 90,
            series: [],
          })),
        );
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
    setRegistros((actuales) =>
      actuales.map((registro) => ({
        ...registro,
        descansoSeg: registro.descansoSeg ?? descansoActual,
        series: registro.series.length > 0 ? registro.series : [{ peso: 0, reps: 0 }],
      })),
    );
    setIniciado(true);
  }

  function cerrarEntrenamiento() {
    const tieneDatos = registros.some((registro) =>
      registro.series.some(
        (serie) => serie.peso > 0 || serie.reps > 0 || Boolean(serie.observaciones?.trim()),
      ),
    );
    if (iniciado && tieneDatos && !confirm("¿Cerrar sin guardar este entrenamiento?")) return;
    navigate({ to: "/" });
  }

  async function guardarNatacion() {
    const distanciaM = parseInt(natacion.distanciaM);
    const duracionMin = parseFloat(natacion.duracionMin);
    if (!distanciaM || !duracionMin) {
      return toast.error("Ingresa distancia y duracion");
    }
    await db.entrenamientos.add({
      fecha: new Date(fechaActividad).getTime(),
      tipo: "natacion",
      registros: [],
      natacion: {
        distanciaM,
        duracionMin,
        piletaM: natacion.piletaM ? parseInt(natacion.piletaM) : undefined,
        estilo: natacion.estilo,
        intensidad: natacion.intensidad,
      },
      notas,
    });
    toast.success("Natacion guardada");
    navigate({ to: "/" });
  }

  async function guardarBici() {
    const distanciaKm = parseFloat(bici.distanciaKm);
    const duracionMin = parseFloat(bici.duracionMin);
    if (!distanciaKm || !duracionMin) {
      return toast.error("Ingresa distancia y duracion");
    }
    await db.entrenamientos.add({
      fecha: new Date(fechaActividad).getTime(),
      tipo: "bici",
      registros: [],
      bici: {
        distanciaKm,
        duracionMin,
        desnivelM: bici.desnivelM ? parseInt(bici.desnivelM) : undefined,
        fcPromedio: bici.fcPromedio ? parseInt(bici.fcPromedio) : undefined,
        modalidad: bici.modalidad,
        intensidad: bici.intensidad,
      },
      notas,
    });
    toast.success("Bici guardada");
    navigate({ to: "/" });
  }

  function addSerie(idx: number) {
    const r = [...registros];
    const last = r[idx].series[r[idx].series.length - 1];
    r[idx].series.push({ peso: last?.peso ?? 0, reps: last?.reps ?? 0 });
    setDescansoActual(r[idx].descansoSeg ?? descansoActual);
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
    setRegistros([
      ...registros,
      {
        ejercicioId: id,
        descansoSeg: descansoActual,
        series: iniciado ? [{ peso: 0, reps: 0 }] : [],
      },
    ]);
  }

  function actualizarDescanso(idx: number, descansoSeg: number) {
    setRegistros(
      registros.map((registro, index) => (index === idx ? { ...registro, descansoSeg } : registro)),
    );
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              {tipo === "gimnasio" ? "Iniciar entrenamiento" : "Registrar actividad"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Elegí una rutina o registrá ejercicios sueltos
            </p>
          </div>
          <Button type="button" variant="outline" onClick={cerrarEntrenamiento}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Cerrar
          </Button>
        </div>
        <ActivityTypeSelector value={tipo} onChange={setTipo} />
        {tipo === "gimnasio" ? (
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
                <SelectTrigger>
                  <SelectValue placeholder="Sin rutina" />
                </SelectTrigger>
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
                <div className="text-xs text-muted-foreground mb-1">
                  {registros.length} ejercicio(s) cargado(s)
                </div>
                <ul className="text-sm space-y-1">
                  {registros.map((r, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span>
                        {ejMap.get(r.ejercicioId)?.nombre ?? "?"}
                        <small className="ml-2 text-muted-foreground">
                          Descanso: {r.descansoSeg ?? descansoActual} s
                        </small>
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => quitarEjercicio(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <AgregarEjercicio ejercicios={ejercicios ?? []} onAdd={addEjercicio} />
            <p className="text-xs text-muted-foreground">
              Al comenzar se muestra una serie por ejercicio para cargar peso, repeticiones,
              descanso y observaciones.
            </p>
            <Button onClick={iniciar} className="w-full" size="lg">
              <Dumbbell className="h-4 w-4 mr-1" /> Comenzar
            </Button>
          </Card>
        ) : tipo === "natacion" ? (
          <Card className="p-4 space-y-3 border-cyan-400/30">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={fechaActividad}
                  onChange={(e) => setFechaActividad(e.target.value)}
                />
              </div>
              <div>
                <Label>Distancia (m)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={natacion.distanciaM}
                  onChange={(e) => setNatacion({ ...natacion, distanciaM: e.target.value })}
                  placeholder="1500"
                />
              </div>
              <div>
                <Label>Duracion (min)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={natacion.duracionMin}
                  onChange={(e) => setNatacion({ ...natacion, duracionMin: e.target.value })}
                  placeholder="45"
                />
              </div>
              <div>
                <Label>Largo pileta (m)</Label>
                <Input
                  type="number"
                  value={natacion.piletaM}
                  onChange={(e) => setNatacion({ ...natacion, piletaM: e.target.value })}
                />
              </div>
              <div>
                <Label>Estilo</Label>
                <Select
                  value={natacion.estilo}
                  onValueChange={(v) => setNatacion({ ...natacion, estilo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Libre", "Pecho", "Espalda", "Mariposa", "Combinado", "Tecnica"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Intensidad</Label>
                <Select
                  value={natacion.intensidad}
                  onValueChange={(v) => setNatacion({ ...natacion, intensidad: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Suave", "Media", "Fuerte", "Regenerativo"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Notas</Label>
                <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
              </div>
            </div>
            <Button
              onClick={guardarNatacion}
              className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              size="lg"
            >
              <Waves className="h-4 w-4 mr-1" /> Guardar natacion
            </Button>
          </Card>
        ) : (
          <Card className="p-4 space-y-3 border-emerald-400/30">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={fechaActividad}
                  onChange={(e) => setFechaActividad(e.target.value)}
                />
              </div>
              <div>
                <Label>Distancia (km)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={bici.distanciaKm}
                  onChange={(e) => setBici({ ...bici, distanciaKm: e.target.value })}
                  placeholder="32.5"
                />
              </div>
              <div>
                <Label>Duracion (min)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={bici.duracionMin}
                  onChange={(e) => setBici({ ...bici, duracionMin: e.target.value })}
                  placeholder="90"
                />
              </div>
              <div>
                <Label>Desnivel (m)</Label>
                <Input
                  type="number"
                  value={bici.desnivelM}
                  onChange={(e) => setBici({ ...bici, desnivelM: e.target.value })}
                  placeholder="250"
                />
              </div>
              <div>
                <Label>FC prom. (opcional)</Label>
                <Input
                  type="number"
                  value={bici.fcPromedio}
                  onChange={(e) => setBici({ ...bici, fcPromedio: e.target.value })}
                  placeholder="135"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={bici.modalidad}
                  onValueChange={(v) => setBici({ ...bici, modalidad: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Ruta", "MTB", "Indoor", "Urbana"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Intensidad</Label>
                <Select
                  value={bici.intensidad}
                  onValueChange={(v) => setBici({ ...bici, intensidad: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Suave", "Media", "Fuerte", "Fondo", "Intervalos"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Notas</Label>
                <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
              </div>
            </div>
            <Button
              onClick={guardarBici}
              className="w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              size="lg"
            >
              <Bike className="h-4 w-4 mr-1" /> Guardar bici
            </Button>
          </Card>
        )}
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
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={cerrarEntrenamiento}>
            <X className="mr-1 h-4 w-4" /> Cerrar
          </Button>
          <Button onClick={guardar}>
            <Check className="h-4 w-4 mr-1" /> Finalizar
          </Button>
        </div>
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
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
              <Timer className="h-4 w-4 text-primary" />
              <Label className="text-xs">Descanso entre series</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={r.descansoSeg ?? descansoActual}
                onChange={(e) => actualizarDescanso(ri, Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 w-24"
                aria-label={`Descanso para ${ej?.nombre ?? "ejercicio"}`}
              />
              <span className="text-xs text-muted-foreground">segundos</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="ml-auto"
                onClick={() => setDescansoActual(r.descansoSeg ?? 90)}
              >
                Usar en temporizador
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

function ActivityTypeSelector({
  value,
  onChange,
}: {
  value: TipoActividad;
  onChange: (value: TipoActividad) => void;
}) {
  const options: { value: TipoActividad; label: string; icon: React.ReactNode; active: string }[] =
    [
      {
        value: "gimnasio",
        label: "Gimnasio",
        icon: <Dumbbell className="h-4 w-4" />,
        active: "border-primary bg-primary/15 text-primary",
      },
      {
        value: "natacion",
        label: "Natacion",
        icon: <Waves className="h-4 w-4" />,
        active: "border-cyan-400 bg-cyan-400/15 text-cyan-300",
      },
      {
        value: "bici",
        label: "Bici",
        icon: <Bike className="h-4 w-4" />,
        active: "border-emerald-400 bg-emerald-400/15 text-emerald-300",
      },
    ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center justify-center gap-1 rounded-md border border-border bg-card px-2 py-2 text-sm font-medium text-muted-foreground transition",
            value === option.value && option.active,
          )}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function AgregarEjercicio({
  ejercicios,
  onAdd,
}: {
  ejercicios: Ejercicio[];
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
