# Gym CDSA

App web para registrar entrenamiento de gimnasio, natacion y bici. Esta pensada para uso personal, simple y offline, con datos guardados en el navegador.

Sitio publicado: https://docampor.github.io/Gym-en-CDSA/

## Que permite hacer

- Registrar entrenamientos de gimnasio por rutina o como sesion libre.
- Crear, editar y activar rutinas.
- Crear y administrar ejercicios por grupo muscular.
- Importar y exportar rutinas desde Excel.
- Importar ejercicios desde la misma planilla Excel de rutinas.
- Registrar actividad de natacion.
- Registrar actividad de bici.
- Ver resumen semanal por tipo de actividad.
- Ver historial reciente con colores por actividad.
- Registrar datos de salud: peso, presion arterial y sueno.
- Exportar/importar backup completo en JSON desde ajustes.
- Usarla como PWA/offline desde GitHub Pages.

## Actividades soportadas

### Gimnasio

Campos principales:

- Rutina
- Ejercicios
- Series
- Peso
- Repeticiones
- Observaciones por serie
- Notas de la sesion

Metricas:

- Volumen por serie
- Volumen total por entrenamiento
- Evolucion de cargas
- Volumen semanal

### Natacion

Campos principales:

- Fecha
- Distancia en metros
- Duracion en minutos
- Largo de pileta
- Estilo
- Intensidad
- Notas

Metricas:

- Distancia semanal
- Ritmo estimado en min/100 m
- Historial diferenciado por color celeste

### Bici

Campos principales:

- Fecha
- Distancia en kilometros
- Duracion en minutos
- Desnivel acumulado
- Frecuencia cardiaca promedio
- Tipo de salida: ruta, MTB, indoor o urbana
- Intensidad
- Notas

Metricas:

- Kilometros semanales
- Velocidad promedio estimada
- Historial diferenciado por color verde

## Importacion de rutinas desde Excel

La importacion se hace desde la pantalla `Rutinas`.

El archivo Excel puede incluir estas hojas:

- `Rutinas`: define las rutinas y los ejercicios que forman parte de cada una.
- `Ejercicios`, `Ejercicios cargados` o `Ejercicios a cargar primero`: define ejercicios nuevos para crear automaticamente antes de armar las rutinas.

Columnas esperadas en la hoja `Rutinas`:

| Columna | Descripcion |
| --- | --- |
| Rutina | Nombre de la rutina. Repetir en cada fila de la misma rutina. |
| Descripcion | Texto opcional de la rutina. |
| Activa | Usar `Si` para marcar una rutina como activa. |
| Orden | Orden del ejercicio dentro de la rutina. |
| Ejercicio | Nombre exacto del ejercicio. |
| Descanso (seg) | Descanso sugerido en segundos. |

Columnas esperadas en la hoja de ejercicios:

| Columna | Descripcion |
| --- | --- |
| Ejercicio | Nombre del ejercicio. |
| Grupo | Grupo muscular o categoria. |
| Descripcion | Texto opcional. |

Nota importante: una rutina solo puede establecerse si sus ejercicios existen. Si el ejercicio no esta cargado en la app, debe venir en la hoja de ejercicios del mismo Excel.

## Datos y privacidad

La app no requiere cuenta ni servidor propio. Los datos se guardan localmente en el navegador usando IndexedDB/Dexie.

Recomendacion: usar la exportacion de backup en `Ajustes` cada tanto si los datos son importantes.

## Stack tecnico

- React
- TanStack Start / TanStack Router
- Vite
- Tailwind CSS
- Dexie / IndexedDB
- Recharts
- SheetJS `xlsx`
- GitHub Pages

## Desarrollo local

Instalar dependencias:

```bash
npm install
```

Levantar entorno local:

```bash
npm run dev
```

Compilar:

```bash
npm run build
```

## Deploy

El deploy esta configurado con GitHub Actions en `.github/workflows/deploy.yml`.

La app usa el base path:

```ts
base: "/Gym-en-CDSA/"
```

Al hacer push a `main`, GitHub Actions compila y publica `dist/client` en GitHub Pages.

## Uso libre

Si a alguien le sirve, puede usarla, modificarla o tomarla como base para su propio registro de entrenamiento.
