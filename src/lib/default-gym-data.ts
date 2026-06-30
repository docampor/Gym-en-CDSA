export type DefaultExercise = {
  nombre: string;
  grupo: string;
  descripcion: string;
};

export const DEFAULT_EXERCISES: DefaultExercise[] = [
  {
    nombre: "Bíceps con mancuernas",
    grupo: "Bíceps",
    descripcion: "Flexiona los codos elevando las mancuernas sin mover los hombros.",
  },
  {
    nombre: "Bíceps con barra",
    grupo: "Bíceps",
    descripcion: "Flexiona los codos elevando la barra de forma controlada.",
  },
  {
    nombre: "Bicicleta",
    grupo: "Cardio",
    descripcion: "Pedalea a ritmo constante manteniendo una postura cómoda.",
  },
  {
    nombre: "Plancha",
    grupo: "Core",
    descripcion: "Mantén el cuerpo alineado contrayendo abdomen y glúteos.",
  },
  {
    nombre: "Abdominal recto",
    grupo: "Core",
    descripcion:
      "Acostado boca arriba, eleva el tronco contrayendo el abdomen y baja de forma controlada, sin tirar del cuello.",
  },
  {
    nombre: "Abdominal cruzado",
    grupo: "Core",
    descripcion:
      "Acostado boca arriba, lleva el codo hacia la rodilla contraria alternando lados, manteniendo el abdomen contraído y sin tirar del cuello.",
  },
  {
    nombre: "Abdominal lateral",
    grupo: "Core",
    descripcion:
      "Acostado de lado, eleva el tronco contrayendo los oblicuos y desciende de forma controlada, sin impulsarte.",
  },
  {
    nombre: "Elev. de cadera",
    grupo: "Core",
    descripcion: "Eleva la cadera contrayendo glúteos y abdomen, luego baja lentamente.",
  },
  {
    nombre: "Sentadilla",
    grupo: "Piernas",
    descripcion: "Flexiona rodillas y caderas manteniendo la espalda recta y vuelve a subir.",
  },
  {
    nombre: "Remo con barra",
    grupo: "Espalda",
    descripcion: "Lleva la barra hacia el abdomen manteniendo la espalda firme.",
  },
  {
    nombre: "Jalón al pecho",
    grupo: "Espalda",
    descripcion: "Baja la barra al pecho contrayendo la espalda y controla el regreso.",
  },
  {
    nombre: "Tirón bajo polea",
    grupo: "Espalda",
    descripcion: "Lleva el agarre al abdomen juntando los omóplatos.",
  },
  {
    nombre: "Dorsalera adelante agarre abierto",
    grupo: "Espalda",
    descripcion: "Baja la barra al pecho con agarre amplio, contrayendo los dorsales.",
  },
  {
    nombre: "Remo en máquina",
    grupo: "Espalda",
    descripcion: "Lleva las empuñaduras al torso apretando la espalda.",
  },
  {
    nombre: "Remo con mancuerna",
    grupo: "Espalda",
    descripcion: "Lleva la mancuerna hacia la cintura sin girar el tronco.",
  },
  {
    nombre: "Press militar",
    grupo: "Hombros",
    descripcion: "Empuja el peso sobre la cabeza y baja de forma controlada.",
  },
  {
    nombre: "Hombros máquina",
    grupo: "Hombros",
    descripcion: "Empuja las empuñaduras hacia arriba sin bloquear los codos.",
  },
  {
    nombre: "Vuelos laterales",
    grupo: "Hombros",
    descripcion: "Eleva los brazos hasta la altura de los hombros con ligera flexión de codos.",
  },
  {
    nombre: "Press Arnold",
    grupo: "Hombros",
    descripcion: "Gira las mancuernas mientras las elevas por encima de la cabeza.",
  },
  {
    nombre: "Vuelos máquina",
    grupo: "Hombros",
    descripcion: "Eleva los brazos hasta la altura de los hombros y vuelve lentamente.",
  },
  {
    nombre: "Press de banca",
    grupo: "Pecho",
    descripcion: "Empuja la barra desde el pecho hasta extender los brazos.",
  },
  {
    nombre: "Pectoral máquina",
    grupo: "Pecho",
    descripcion: "Empuja las empuñaduras al frente contrayendo el pecho.",
  },
  {
    nombre: "Press pecho plano",
    grupo: "Pecho",
    descripcion: "Empuja el peso desde el pecho y controla el descenso.",
  },
  {
    nombre: "Apertura pecho 45°",
    grupo: "Pecho",
    descripcion: "Junta los brazos en arco manteniendo una leve flexión de codos.",
  },
  {
    nombre: "Pullover",
    grupo: "Espalda",
    descripcion: "Lleva el peso desde detrás de la cabeza hasta el pecho con brazos semirrígidos.",
  },
  {
    nombre: "Camilla cuádriceps",
    grupo: "Piernas",
    descripcion: "Extiende las piernas contrayendo los cuádriceps y baja lentamente.",
  },
  {
    nombre: "Sentadilla hack",
    grupo: "Piernas",
    descripcion: "Flexiona las piernas en la máquina y empuja hasta volver a la posición inicial.",
  },
  {
    nombre: "Isquiotibiales de pie",
    grupo: "Piernas",
    descripcion: "Flexiona la rodilla llevando el talón hacia el glúteo.",
  },
  {
    nombre: "Prensa plana agarre bajo",
    grupo: "Piernas",
    descripcion: "Empuja la plataforma con los pies y controla el regreso.",
  },
  {
    nombre: "Camilla isquiotibial",
    grupo: "Piernas",
    descripcion: "Flexiona las piernas llevando los talones hacia los glúteos.",
  },
  {
    nombre: "Extensión de tríceps",
    grupo: "Tríceps",
    descripcion: "Extiende los codos contrayendo los tríceps sin mover los hombros.",
  },
  {
    nombre: "Tríceps máquina",
    grupo: "Tríceps",
    descripcion: "Empuja las empuñaduras extendiendo los codos de forma controlada.",
  },
];

export const DEFAULT_ROUTINES = [
  {
    nombre: "Dia A - Empuje + Piernas",
    descripcion: "Rutina modelo para probar importacion",
    activa: true,
    ejercicios: [
      { nombre: "Press de banca", series: 3, repeticiones: 10, pesoKg: 0, descansoSeg: 120 },
      { nombre: "Sentadilla", series: 3, repeticiones: 10, pesoKg: 0, descansoSeg: 150 },
      { nombre: "Press militar", series: 3, repeticiones: 10, pesoKg: 0, descansoSeg: 120 },
      { nombre: "Extensión de tríceps", series: 3, repeticiones: 12, pesoKg: 0, descansoSeg: 75 },
    ],
  },
  {
    nombre: "Dia B - Tirón + Core",
    descripcion: "Segunda rutina de ejemplo",
    activa: false,
    ejercicios: [
      { nombre: "Remo con barra", series: 3, repeticiones: 10, pesoKg: 0, descansoSeg: 120 },
      { nombre: "Jalón al pecho", series: 3, repeticiones: 10, pesoKg: 0, descansoSeg: 90 },
      { nombre: "Plancha", series: 3, repeticiones: 1, pesoKg: 0, descansoSeg: 60 },
    ],
  },
  {
    nombre: "Dia C - Hombros y Biceps",
    descripcion: "",
    activa: false,
    ejercicios: [],
  },
];
