import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db, exportarTodo, importarTodo } from "@/lib/db";
import { Download, Upload, Trash2, Database } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";
import { useLiveQuery } from "@/lib/hooks";

export const Route = createFileRoute("/ajustes")({
  head: () => ({ meta: [{ title: "Ajustes — Gym Tracker" }] }),
  component: AjustesPage,
});

function AjustesPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const counts = useLiveQuery(async () => ({
    ej: await db.ejercicios.count(),
    ru: await db.rutinas.count(),
    en: await db.entrenamientos.count(),
    pe: await db.pesos.count(),
    pr: await db.presiones.count(),
    su: await db.suenos.count(),
  }), []);

  async function exportar() {
    const data = await exportarTodo();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gymtracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado");
  }

  async function importar(file: File) {
    if (!confirm("Esto sobreescribirá TODOS tus datos actuales. ¿Continuar?")) return;
    try {
      const txt = await file.text();
      const data = JSON.parse(txt);
      await importarTodo(data);
      toast.success("Datos importados");
    } catch (e: any) {
      toast.error("Archivo inválido");
    }
  }

  async function borrarTodo() {
    if (!confirm("¿Eliminar TODOS los datos? Esta acción no se puede deshacer.")) return;
    if (!confirm("¿Estás seguro? Última confirmación.")) return;
    await Promise.all([
      db.ejercicios.clear(),
      db.rutinas.clear(),
      db.entrenamientos.clear(),
      db.pesos.clear(),
      db.presiones.clear(),
      db.suenos.clear(),
      db.ajustes.clear(),
    ]);
    toast.success("Datos eliminados");
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-sm text-muted-foreground">Backup y datos</p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Resumen</h2>
        </div>
        {counts && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Ejercicios" v={counts.ej} />
            <Stat label="Rutinas" v={counts.ru} />
            <Stat label="Sesiones" v={counts.en} />
            <Stat label="Pesos" v={counts.pe} />
            <Stat label="Presión" v={counts.pr} />
            <Stat label="Sueño" v={counts.su} />
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Backup</h2>
        <p className="text-sm text-muted-foreground">
          Exportá un archivo JSON con todos tus datos. Importá para restaurar (sobrescribe lo actual).
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportar}>
            <Download className="h-4 w-4 mr-1" /> Exportar JSON
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Importar JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importar(f);
              e.target.value = "";
            }}
          />
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-destructive">Zona peligrosa</h2>
        <Button variant="destructive" onClick={borrarTodo}>
          <Trash2 className="h-4 w-4 mr-1" /> Borrar todos los datos
        </Button>
      </Card>

      <Card className="p-4 text-sm text-muted-foreground">
        <p>
          App offline · Datos guardados localmente en tu dispositivo (IndexedDB).
          Instalable como app desde el menú del navegador.
        </p>
      </Card>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-md bg-muted/40 py-2">
      <div className="metric-value text-xl text-primary">{v}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
