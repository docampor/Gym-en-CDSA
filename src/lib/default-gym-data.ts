export type DefaultExercise = {
  nombre: string;
  grupo: string;
  descripcion?: string;
};

export const DEFAULT_EXERCISES: DefaultExercise[] = [
  { nombre: "ABDOMINAL CRUZADO", grupo: "Core", descripcion: "7" },
  { nombre: "ABDOMINAL LATERAL", grupo: "Core", descripcion: "7" },
  { nombre: "ABDOMINAL MAQUINA", grupo: "Otro" },
  { nombre: "ABDOMINAL OBLICUO", grupo: "Otro" },
  { nombre: "ABDOMINAL RECTO", grupo: "Otro" },
  { nombre: "APERTURA PECHO", grupo: "Otro" },
  { nombre: "APERTURA PECHO 45°", grupo: "Otro" },
  { nombre: "BICEPS BARRA", grupo: "Otro" },
  { nombre: "BICEPS MANC.", grupo: "Otro" },
  { nombre: "BICEPS POLEA", grupo: "Otro" },
  { nombre: "BICEPS SCOOT ALTO", grupo: "Otro" },
  { nombre: "BICEPS SCOOT BAJO", grupo: "Otro" },
  { nombre: "BICICLETA", grupo: "Otro" },
  { nombre: "CAMILLA CUADRICEPS", grupo: "Otro" },
  { nombre: "CAMILLA ISQUIOTIBIAL", grupo: "Otro" },
  { nombre: "DORSALERA ADEL AB", grupo: "Otro" },
  { nombre: "ELEV DE CADERA", grupo: "Otro" },
  { nombre: "ELIPTICO", grupo: "Otro" },
  { nombre: "ELONGACIÓN", grupo: "Otro" },
  { nombre: "ESCALADOR", grupo: "Otro" },
  { nombre: "FONDO MÁQUINA", grupo: "Otro" },
  { nombre: "FONDOS EN U", grupo: "Otro" },
  { nombre: "GEMELOS DE PIE", grupo: "Otro" },
  { nombre: "HOMBROS EN BANCO", grupo: "Otro" },
  { nombre: "HOMBROS MÁQUINA", grupo: "Otro" },
  { nombre: "ISQUITO. DE PIE", grupo: "Otro" },
  { nombre: "NAVAJAS ALTER.", grupo: "Otro" },
  { nombre: "PECTORAL MAQUINA", grupo: "Otro" },
  { nombre: "PRENSA 45°", grupo: "Otro" },
  { nombre: "PRENSA PLANA AB", grupo: "Otro" },
  { nombre: "PRESS ARNOLD", grupo: "Otro" },
  { nombre: "PRESS PECHO 45°", grupo: "Otro" },
  { nombre: "PRESS PECHO DECLI.", grupo: "Otro" },
  { nombre: "PRESS PECHO PLANO", grupo: "Otro" },
  { nombre: "PULLOVER", grupo: "Otro" },
  { nombre: "PULLOVER LARGO", grupo: "Otro" },
  { nombre: "REMO C/MANCUERNA", grupo: "Otro" },
  { nombre: "REMO EN MAQUINA", grupo: "Otro" },
  { nombre: "SENTADILLA HACK", grupo: "Otro" },
  { nombre: "TIRON BAJO POLEA", grupo: "Otro" },
  { nombre: "TRICEPS MAQUINA", grupo: "Otro" },
  { nombre: "TRICEPS POLEA", grupo: "Otro" },
  { nombre: "VUELOS EN POLEA", grupo: "Otro" },
  { nombre: "VUELOS FRONTALES", grupo: "Otro" },
  { nombre: "VUELOS LATERALES", grupo: "Otro" },
  { nombre: "VUELOS MAQUINA", grupo: "Otro" },
];

export const DEFAULT_ROUTINE = {
  nombre: "Martes",
  descripcion: "7",
  activa: false,
  ejercicios: DEFAULT_EXERCISES.map((ejercicio, index) => ({
    nombre: ejercicio.nombre,
    descansoSeg: index === 0 ? 7 : 90,
  })),
};
