import Dexie, { type Table } from "dexie";

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
  series: Serie[];
};

export type Entrenamiento = {
  id?: number;
  fecha: number; // timestamp
  rutinaId?: number;
  rutinaNombre?: string;
  registros: RegistroEjercicio[];
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
  valor: any;
};

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

export async function getAjuste<T = any>(clave: string, def: T): Promise<T> {
  const a = await db.ajustes.get(clave);
  return (a?.valor as T) ?? def;
}
export async function setAjuste(clave: string, valor: any) {
  await db.ajustes.put({ clave, valor });
}

export async function exportarTodo() {
  const [ejercicios, rutinas, entrenamientos, pesos, presiones, suenos, ajustes] = await Promise.all([
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

export async function importarTodo(data: any) {
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
  return e.registros.reduce(
    (acc, r) => acc + r.series.reduce((a, s) => a + volumenSerie(s), 0),
    0,
  );
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
  "Otro",
];
