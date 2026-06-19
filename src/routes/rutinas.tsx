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
import { Plus, Pencil, Trash2, ListChecks, Star, ChevronUp, ChevronDown, X, Play, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/rutinas")({
  head: () => ({
    meta: [{ title: "Gym CDSA" }],
  }),
  component: RutinasPage,
});

function RutinasPage() {
  const rutinas = useLiveQuery(() => db.rutinas.toArray(), []);
  const ejercicios = useLiveQuery(() => db.ejercicios.orderBy("nombre").toArray(), []);
  const [abierto, setAbierto] = useState(false);
  const [editar, setEditar] = useState<Rutina | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const rutinasActuales = rutinas ?? [];
  const ejerciciosActuales = ejercicios ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rutinas</h1>
          <p className="text-sm text-muted-foreground">Organizá tus planes de entrenamiento</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => exportarRutinasExcel(rutinasActuales, ejerciciosActuales)}
          >
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Importar
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) {
                await importarRutinasExcel(file, rutinasActuales, ejerciciosActuales);
              }
            }}
          />
          <Dialog open={abierto} onOpenChange={(v) => { setAbierto(v); if (!v) setEditar(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditar(null)}>
                <Plus className="h-4 w-4 mr-1" /> Nueva
              </Button>
            </DialogTrigger>
            <RutinaDialog
              editar={editar}
              ejercicios={ejerciciosActuales}
              onClose={() => { setAbierto(false); setEditar(null); }}
            />
          </Dialog>
        </div>
      </div>

      <Card className="p-3 text-xs text-muted-foreground">
        Importante: el Excel debe incluir una hoja de ejercicios o usar ejercicios ya cargados. Sin ejercicios, la rutina no se puede establecer.
      </Card>

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

const RUTINAS_HEADERS = [
  "Rutina",
  "Descripcion",
  "Activa",
  "Orden",
  "Ejercicio",
  "Descanso (seg)",
];

const EJERCICIOS_HEADERS = ["Ejercicio", "Grupo", "Descripcion"];

type RutinaExcelRow = Record<string, string | number | boolean | null | undefined>;

function normalizeName(value: unknown) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function textValue(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolValue(value: unknown) {
  const normalized = normalizeName(value);
  return ["si", "s", "true", "1", "x", "activa"].includes(normalized);
}

function pick(row: RutinaExcelRow, keys: string[]) {
  const entries = Object.entries(row);
  for (const key of keys) {
    const found = entries.find(([rowKey]) => normalizeName(rowKey) === normalizeName(key));
    if (found) return found[1];
  }
  return "";
}

function findSheet(workbook: XLSX.WorkBook, names: string[]) {
  const wanted = names.map(normalizeName);
  const sheetName = workbook.SheetNames.find((name) => wanted.includes(normalizeName(name)));
  return sheetName ? workbook.Sheets[sheetName] : undefined;
}

function exportarRutinasExcel(
  rutinas: Rutina[],
  ejercicios: { id?: number; nombre: string; grupo: string; descripcion?: string }[],
) {
  const ejercicioMap = new Map(ejercicios.map((e) => [e.id, e]));
  const rows = rutinas.flatMap((rutina) => {
    const base = {
      Rutina: rutina.nombre,
      Descripcion: rutina.descripcion ?? "",
      Activa: rutina.activa ? "Si" : "",
    };

    if (rutina.ejercicios.length === 0) {
      return [{ ...base, Orden: "", Ejercicio: "", "Descanso (seg)": "" }];
    }

    return [...rutina.ejercicios]
      .sort((a, b) => a.orden - b.orden)
      .map((item, index) => ({
        ...base,
        Orden: index + 1,
        Ejercicio: ejercicioMap.get(item.ejercicioId)?.nombre ?? "",
        "Descanso (seg)": item.descansoSeg ?? 90,
      }));
  });

  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [], { header: RUTINAS_HEADERS });
  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 34 },
    { wch: 10 },
    { wch: 8 },
    { wch: 34 },
    { wch: 14 },
  ];

  const ejerciciosSheet = XLSX.utils.json_to_sheet(
    ejercicios.map((e) => ({
      Ejercicio: e.nombre,
      Grupo: e.grupo,
      Descripcion: e.descripcion ?? "",
    })),
    { header: EJERCICIOS_HEADERS },
  );
  ejerciciosSheet["!cols"] = [{ wch: 34 }, { wch: 18 }, { wch: 40 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rutinas");
  XLSX.utils.book_append_sheet(workbook, ejerciciosSheet, "Ejercicios cargados");
  XLSX.writeFile(workbook, `rutinas-gym-cdsa-${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast.success("Excel de rutinas descargado");
}

async function importarRutinasExcel(
  file: File,
  rutinas: Rutina[],
  ejercicios: { id?: number; nombre: string }[],
) {
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = findSheet(workbook, ["Rutinas"]) ?? workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      toast.error("El archivo no tiene una hoja de rutinas");
      return;
    }

    const rows = XLSX.utils.sheet_to_json<RutinaExcelRow>(sheet, { defval: "" });
    const ejercicioSheet = findSheet(workbook, [
      "Ejercicios",
      "Ejercicios cargados",
      "Ejercicios a cargar primero",
    ]);
    const ejercicioRows = ejercicioSheet
      ? XLSX.utils.sheet_to_json<RutinaExcelRow>(ejercicioSheet, { defval: "" })
      : [];
    const ejerciciosImportados = new Map<string, { nombre: string; grupo: string; descripcion?: string }>();
    const errores: string[] = [];

    ejercicioRows.forEach((row, index) => {
      const fila = index + 2;
      const nombre = textValue(pick(row, ["Ejercicio", "Nombre ejercicio", "Nombre"]));
      const grupoRaw = textValue(pick(row, ["Grupo", "Grupo muscular"]));
      const descripcion = textValue(pick(row, ["Descripcion"]));

      if (!nombre && !grupoRaw && !descripcion) return;
      if (!nombre) {
        errores.push(`Hoja Ejercicios fila ${fila}: falta el nombre del ejercicio`);
        return;
      }

      ejerciciosImportados.set(normalizeName(nombre), { nombre, grupo: grupoRaw || "Otro", descripcion });
    });

    if (ejercicios.length === 0 && ejerciciosImportados.size === 0) {
      toast.error("El Excel debe traer una hoja de ejercicios");
      return;
    }

    const ejerciciosPorNombre = new Map<string, { id?: number; nombre: string }>();
    ejercicios.forEach((e) => ejerciciosPorNombre.set(normalizeName(e.nombre), e));
    ejerciciosImportados.forEach((e, key) => {
      if (!ejerciciosPorNombre.has(key)) {
        ejerciciosPorNombre.set(key, { nombre: e.nombre });
      }
    });
    const rutinasPorNombre = new Map(rutinas.map((r) => [normalizeName(r.nombre), r]));
    const grupos = new Map<
      string,
      {
        nombre: string;
        descripcion?: string;
        activa?: boolean;
        ejercicios: { ejercicioKey: string; ejercicioNombre: string; orden: number; descansoSeg: number }[];
      }
    >();
    rows.forEach((row, index) => {
      const fila = index + 2;
      const nombreRutina = textValue(pick(row, ["Rutina", "Nombre rutina", "Nombre"]));
      const nombreEjercicio = textValue(pick(row, ["Ejercicio", "Nombre ejercicio"]));

      if (!nombreRutina && !nombreEjercicio) return;
      if (!nombreRutina) {
        errores.push(`Fila ${fila}: falta la rutina`);
        return;
      }
      if (!nombreEjercicio) {
        errores.push(`Fila ${fila}: falta el ejercicio`);
        return;
      }

      const ejercicio = ejerciciosPorNombre.get(normalizeName(nombreEjercicio));
      const ejercicioKey = normalizeName(nombreEjercicio);
      if (!ejercicio) {
        errores.push(`Fila ${fila}: "${nombreEjercicio}" no existe en la app ni en la hoja de ejercicios`);
        return;
      }

      const key = normalizeName(nombreRutina);
      const grupo = grupos.get(key) ?? {
        nombre: nombreRutina,
        descripcion: textValue(pick(row, ["Descripcion"])),
        activa: boolValue(pick(row, ["Activa", "Activo"])),
        ejercicios: [],
      };
      const duplicado = grupo.ejercicios.some((item) => item.ejercicioKey === ejercicioKey);
      if (duplicado) {
        errores.push(`Fila ${fila}: "${nombreEjercicio}" esta repetido en "${nombreRutina}"`);
        return;
      }

      const orden = numberValue(pick(row, ["Orden"]), grupo.ejercicios.length + 1);
      const descansoSeg = numberValue(pick(row, ["Descanso (seg)", "Descanso", "Descanso seg"]), 90);
      grupo.descripcion ||= textValue(pick(row, ["Descripcion"]));
      grupo.activa ||= boolValue(pick(row, ["Activa", "Activo"]));
      grupo.ejercicios.push({ ejercicioKey, ejercicioNombre: nombreEjercicio, orden, descansoSeg });
      grupos.set(key, grupo);
    });

    if (errores.length > 0) {
      alert(`No se importo nada. Corregi estos datos:\n\n${errores.slice(0, 12).join("\n")}${errores.length > 12 ? `\n...y ${errores.length - 12} mas` : ""}`);
      toast.error("Excel con ejercicios no cargados o datos incompletos");
      return;
    }

    if (grupos.size === 0) {
      toast.error("No encontre rutinas para importar");
      return;
    }

    const activarAlguna = [...grupos.values()].some((grupo) => grupo.activa);
    const ejerciciosIdsPorNombre = new Map<string, number>();
    ejercicios.forEach((e) => {
      if (e.id) ejerciciosIdsPorNombre.set(normalizeName(e.nombre), e.id);
    });

    await db.transaction("rw", [db.ejercicios, db.rutinas], async () => {
      for (const [key, ejercicio] of ejerciciosImportados) {
        if (!ejerciciosIdsPorNombre.has(key)) {
          const id = await db.ejercicios.add({
            nombre: ejercicio.nombre,
            grupo: ejercicio.grupo,
            descripcion: ejercicio.descripcion,
            creadoEn: Date.now(),
          });
          ejerciciosIdsPorNombre.set(key, id);
        }
      }

      if (activarAlguna) {
        await db.rutinas.toCollection().modify({ activa: false });
      }

      for (const grupo of grupos.values()) {
        const ejerciciosOrdenados = grupo.ejercicios
          .sort((a, b) => a.orden - b.orden)
          .map((item, index) => ({
            ejercicioId: ejerciciosIdsPorNombre.get(item.ejercicioKey)!,
            orden: index,
            descansoSeg: item.descansoSeg,
          }));
        const existente = rutinasPorNombre.get(normalizeName(grupo.nombre));
        const datos = {
          nombre: grupo.nombre,
          descripcion: grupo.descripcion,
          activa: grupo.activa,
          ejercicios: ejerciciosOrdenados,
        };

        if (existente?.id) {
          await db.rutinas.update(existente.id, datos);
        } else {
          await db.rutinas.add({ ...datos, creadaEn: Date.now() });
        }
      }
    });

    toast.success(`${grupos.size} rutina(s) importada(s)`);
  } catch (error) {
    console.error(error);
    toast.error("No pude leer ese archivo Excel");
  }
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
