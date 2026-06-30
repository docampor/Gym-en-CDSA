import Dexie, { type Table } from "dexie";
import { DEFAULT_EXERCISES, DEFAULT_ROUTINES } from "./default-gym-data";

export type Ejercicio = {
  id?: number;
  nombre: string;
  grupo: string;
  descripcion?: string;
  creadoEn: number;
};

export type RutinaEjercicio = {
  ejercicioId: number;
  orden: number;
  descansoSeg?: number;
};

export type Rutina = {
  id?: number;
  nombre: string;
  descripcion?: string;
  ejercicios: RutinaEjercicio[];
  activa?: boolean;
  creadaEn: number;
};

export type Serie = {
  peso: number;
  reps: number;
  observaciones?: string;
};

export type RegistroEjercicio = {
  ejercicioId: number;
  descansoSeg?: number;
  series: Serie[];
};

export type TipoActividad = "gimnasio" | "natacion" | "bici";

export type ActividadNatacion = {
  distanciaM: number;
  duracionMin: number;
  estilo?: string;
  piletaM?: number;
  intensidad?: string;
};

export type ActividadBici = {
  distanciaKm: number;
  duracionMin: number;
  desnivelM?: number;
  fcPromedio?: number;
  modalidad?: string;
  intensidad?: string;
};

export type Entrenamiento = {
  id?: number;
  fecha: number; // timestamp
  tipo?: TipoActividad;
  rutinaId?: number;
  rutinaNombre?: string;
  registros: RegistroEjercicio[];
  natacion?: ActividadNatacion;
  bici?: ActividadBici;
  notas?: string;
};

export type RegistroPeso = {
  id?: number;
  fecha: number;
  pesoKg: number;
};

export type RegistroPresion = {
  id?: number;
  fecha: number;
  sistolica: number;
  diastolica: number;
  pulso?: number;
};

export type RegistroSueno = {
  id?: number;
  fecha: number;
  horas: number;
};

export type Ajuste = {
  clave: string;
  valor: unknown;
};

type BackupData = Partial<{
  ejercicios: Ejercicio[];
  rutinas: Rutina[];
  entrenamientos: Entrenamiento[];
  pesos: RegistroPeso[];
  presiones: RegistroPresion[];
  suenos: RegistroSueno[];
  ajustes: Ajuste[];
}>;

class GymDB extends Dexie {
  ejercicios!: Table<Ejercicio, number>;
  rutinas!: Table<Rutina, number>;
  entrenamientos!: Table<Entrenamiento, number>;
  pesos!: Table<RegistroPeso, number>;
  presiones!: Table<RegistroPresion, number>;
  suenos!: Table<RegistroSueno, number>;
  ajustes!: Table<Ajuste, string>;

  constructor() {
    super("gymapp_db");
    this.version(1).stores({
      ejercicios: "++id, nombre, grupo",
      rutinas: "++id, nombre, activa",
      entrenamientos: "++id, fecha, rutinaId",
      pesos: "++id, fecha",
      presiones: "++id, fecha",
      suenos: "++id, fecha",
      ajustes: "clave",
    });
  }
}

export const db = new GymDB();

const DEFAULT_DATA_SEED_KEY = "default-gym-data-template-v2";

export async function ensureDefaultGymData() {
  await db.transaction("rw", [db.ejercicios, db.rutinas, db.ajustes], async () => {
    const alreadyChecked = await db.ajustes.get(DEFAULT_DATA_SEED_KEY);
    if (alreadyChecked) return;

    const [exerciseCount, routineCount] = await Promise.all([
      db.ejercicios.count(),
      db.rutinas.count(),
    ]);

    if (exerciseCount === 0 && routineCount === 0) {
      const createdAt = Date.now();
      const exerciseIds = new Map<string, number>();

      for (const exercise of DEFAULT_EXERCISES) {
        const id = await db.ejercicios.add({ ...exercise, creadoEn: createdAt });
        exerciseIds.set(exercise.nombre, id);
      }

      for (const routine of DEFAULT_ROUTINES) {
        await db.rutinas.add({
          nombre: routine.nombre,
          descripcion: routine.descripcion,
          activa: routine.activa,
          creadaEn: createdAt,
          ejercicios: routine.ejercicios.map((exercise, index) => ({
            ejercicioId: exerciseIds.get(exercise.nombre)!,
            orden: index,
            descansoSeg: exercise.descansoSeg,
          })),
        });
      }
    }

    await db.ajustes.put({ clave: DEFAULT_DATA_SEED_KEY, valor: true });
  });
}

export async function getAjuste<T = unknown>(clave: string, def: T): Promise<T> {
  const a = await db.ajustes.get(clave);
  return (a?.valor as T) ?? def;
}
export async function setAjuste(clave: string, valor: unknown) {
  await db.ajustes.put({ clave, valor });
}

export async function exportarTodo() {
  const [ejercicios, rutinas, entrenamientos, pesos, presiones, suenos, ajustes] =
    await Promise.all([
      db.ejercicios.toArray(),
      db.rutinas.toArray(),
      db.entrenamientos.toArray(),
      db.pesos.toArray(),
      db.presiones.toArray(),
      db.suenos.toArray(),
      db.ajustes.toArray(),
    ]);
  return {
    version: 1,
    exportadoEn: Date.now(),
    ejercicios,
    rutinas,
    entrenamientos,
    pesos,
    presiones,
    suenos,
    ajustes,
  };
}

export async function importarTodo(data: BackupData) {
  await db.transaction(
    "rw",
    [db.ejercicios, db.rutinas, db.entrenamientos, db.pesos, db.presiones, db.suenos, db.ajustes],
    async () => {
      await Promise.all([
        db.ejercicios.clear(),
        db.rutinas.clear(),
        db.entrenamientos.clear(),
        db.pesos.clear(),
        db.presiones.clear(),
        db.suenos.clear(),
        db.ajustes.clear(),
      ]);
      if (data.ejercicios?.length) await db.ejercicios.bulkAdd(data.ejercicios);
      if (data.rutinas?.length) await db.rutinas.bulkAdd(data.rutinas);
      if (data.entrenamientos?.length) await db.entrenamientos.bulkAdd(data.entrenamientos);
      if (data.pesos?.length) await db.pesos.bulkAdd(data.pesos);
      if (data.presiones?.length) await db.presiones.bulkAdd(data.presiones);
      if (data.suenos?.length) await db.suenos.bulkAdd(data.suenos);
      if (data.ajustes?.length) await db.ajustes.bulkAdd(data.ajustes);
    },
  );
}

export function volumenSerie(s: Serie) {
  return (s.peso || 0) * (s.reps || 0);
}

export function volumenEntrenamiento(e: Entrenamiento) {
  return (e.registros ?? []).reduce(
    (acc, r) => acc + r.series.reduce((a, s) => a + volumenSerie(s), 0),
    0,
  );
}

export function tipoEntrenamiento(e: Entrenamiento): TipoActividad {
  return e.tipo ?? "gimnasio";
}

export function tituloEntrenamiento(e: Entrenamiento) {
  const tipo = tipoEntrenamiento(e);
  if (tipo === "natacion") return "Natacion";
  if (tipo === "bici") return "Bici";
  return e.rutinaNombre || "Sesion libre";
}

export function resumenEntrenamiento(e: Entrenamiento) {
  const tipo = tipoEntrenamiento(e);
  if (tipo === "natacion") {
    const n = e.natacion;
    if (!n) return "Natacion";
    const ritmo =
      n.distanciaM > 0 && n.duracionMin > 0
        ? ` · ${((n.duracionMin * 100) / n.distanciaM).toFixed(1)} min/100m`
        : "";
    return `${n.distanciaM} m · ${n.duracionMin} min${ritmo}`;
  }
  if (tipo === "bici") {
    const b = e.bici;
    if (!b) return "Bici";
    const velocidad =
      b.distanciaKm > 0 && b.duracionMin > 0
        ? ` · ${((b.distanciaKm / b.duracionMin) * 60).toFixed(1)} km/h`
        : "";
    return `${b.distanciaKm} km · ${b.duracionMin} min${velocidad}`;
  }
  return `${e.registros?.length ?? 0} ejercicios`;
}

export const GRUPOS_MUSCULARES = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Antebrazo",
  "Cuádriceps",
  "Isquios",
  "Glúteos",
  "Pantorrilla",
  "Core",
  "Cardio",
  "Piernas",
  "Otro",
];
