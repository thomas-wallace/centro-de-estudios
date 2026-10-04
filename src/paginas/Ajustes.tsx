import { DownloadIcon, Trash2Icon, UploadIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { PaginaEncabezado } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Segmentado } from '@/components/ui/misc';
import { borrarProgreso, exportarProgreso, guardarConfig, importarProgreso, type Respaldo } from '@/db';
import { aFechaISO } from '@/lib/utils';
import { useMateria } from '@/materia';
import { useApp, type Tema } from '@/store';

export default function Ajustes() {
  const { slug, datos, config } = useMateria();
  const { tema, setTema } = useApp();
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  const guardar = async (cambios: Parameters<typeof guardarConfig>[1]) => {
    try {
      await guardarConfig(slug, cambios);
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar: este navegador bloquea el almacenamiento local.' });
    }
  };

  const exportar = async (todo: boolean) => {
    const r = await exportarProgreso(todo ? null : slug);
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `progreso-${todo ? 'todas' : slug}-${aFechaISO(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMensaje({ tipo: 'ok', texto: `Exportadas ${r.tarjetas.length} tarjetas, ${r.simulacros.length} simulacros y ${r.actividades.length} prácticas.` });
  };

  const importar = async (f: File) => {
    try {
      const r = JSON.parse(await f.text()) as Respaldo;
      const { materias } = await importarProgreso(r);
      setMensaje({ tipo: 'ok', texto: `Progreso importado (${materias.join(', ') || 'sin datos'}).` });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: `No pude importar el archivo: ${(e as Error).message}` });
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PaginaEncabezado emoji="⚙️" titulo="Examen y ajustes" />

      {mensaje && (
        <div
          role="status"
          className={`rounded-lg border p-3 text-sm ${mensaje.tipo === 'ok' ? 'border-success/40 bg-success/10' : 'border-destructive/40 bg-destructive/10'}`}
        >
          {mensaje.texto}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Examen</CardTitle>
          <CardDescription>El plan de estudio se reparte en días hasta esta fecha.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Fecha del examen</span>
            <div className="flex gap-2">
              <Input
                type="date"
                value={config.fechaExamenEfectiva ?? ''}
                min={aFechaISO(new Date())}
                onChange={(e) => guardar({ fechaExamen: e.target.value || undefined })}
                className="max-w-52"
              />
              {config.fechaExamen && (
                <Button variant="ghost" onClick={() => guardar({ fechaExamen: undefined })}>
                  Quitar
                </Button>
              )}
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Formato</span>
            <Input
              defaultValue={config.formatoExamenEfectivo ?? ''}
              placeholder="Ej.: escrito, 3 h, teórico + 2 ejercicios"
              onBlur={(e) => guardar({ formatoExamen: e.target.value.trim() || undefined })}
            />
            {datos.materia.examen.formato && (
              <span className="text-xs text-muted-foreground">Sugerido por el material: {datos.materia.examen.formato}</span>
            )}
          </label>
          {!!datos.materia.temas_clave.length && (
            <div className="text-sm">
              <p className="mb-1 font-medium">Temas clave</p>
              <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                {datos.materia.temas_clave.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estudio</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="font-medium">Flashcards nuevas por día</span>
              <span className="block text-xs text-muted-foreground">Más nuevas = más repasos en los días siguientes.</span>
            </span>
            <Input
              type="number"
              min={0}
              max={200}
              className="w-20"
              value={config.nuevasPorDia}
              onChange={(e) => guardar({ nuevasPorDia: Math.max(0, Math.min(200, Number(e.target.value) || 0)) })}
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">Tema</span>
            <Segmentado<Tema>
              ariaLabel="Tema"
              valor={tema}
              onChange={setTema}
              opciones={[
                { valor: 'claro', etiqueta: 'Claro' },
                { valor: 'oscuro', etiqueta: 'Oscuro' },
                { valor: 'sistema', etiqueta: 'Sistema' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progreso</CardTitle>
          <CardDescription>
            Se guarda en este navegador (IndexedDB). Exportalo para pasarlo a otro dispositivo o como respaldo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportar(false)}>
            <DownloadIcon /> Exportar esta materia
          </Button>
          <Button variant="outline" onClick={() => exportar(true)}>
            <DownloadIcon /> Exportar todo
          </Button>
          <Button variant="outline" onClick={() => archivo.current?.click()}>
            <UploadIcon /> Importar…
          </Button>
          <input
            ref={archivo}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importar(f);
              e.target.value = '';
            }}
          />
          <div className="w-full border-t pt-3">
            {confirmarBorrado ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span>¿Borrar todo el progreso de «{datos.materia.nombre}»? No se puede deshacer.</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    await borrarProgreso(slug);
                    setConfirmarBorrado(false);
                    setMensaje({ tipo: 'ok', texto: 'Progreso borrado.' });
                  }}
                >
                  Sí, borrar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmarBorrado(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button variant="ghost" className="text-destructive" onClick={() => setConfirmarBorrado(true)}>
                <Trash2Icon /> Borrar progreso de esta materia
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
