import { Eye, ListX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EtiquetaUnidad, FiltroUnidad, Fuente, PaginaEncabezado, useUnidadParam } from '@/components/comunes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PuntoUnidad, Segmentado, Select, Vacio } from '@/components/ui/misc';
import { cn, plural } from '@/lib/utils';
import { useMateria } from '@/materia';
import { PasosQuitados } from './flujos/PasosQuitados';
import { Reproductor } from './flujos/Reproductor';

type Modo = 'ver' | 'quitar';

export default function Flujos() {
  const { datos, slug, color } = useMateria();
  const [unidad, setUnidad] = useUnidadParam();
  const [elegido, setElegido] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>('ver');

  const procesos = useMemo(
    () => datos.procesos.filter((p) => !unidad || p.unidad === unidad),
    [datos.procesos, unidad],
  );
  const proceso = procesos.find((p) => p.id === elegido) ?? procesos[0];

  if (datos.procesos.length === 0) {
    return (
      <>
        <PaginaEncabezado emoji="🔁" titulo="Flujos" />
        <Vacio titulo="Esta materia no tiene procesos cargados" />
      </>
    );
  }

  return (
    <>
      <PaginaEncabezado
        emoji="🔁"
        titulo="Flujos"
        descripcion="Mirá cada proceso paso a paso y después reconstruilo a medida que se van quitando pasos."
        acciones={<FiltroUnidad valor={unidad} onChange={setUnidad} />}
      />

      {procesos.length === 0 ? (
        <Vacio titulo="No hay procesos en esta unidad">Probá con otra unidad o elegí “Todas las unidades”.</Vacio>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
          {/* Lista (escritorio) */}
          <nav aria-label="Procesos" className="hidden lg:block">
            <ul className="sticky top-4 flex max-h-[calc(100vh-6rem)] flex-col gap-1 overflow-y-auto rounded-xl border bg-card p-2">
              {procesos.map((p) => {
                const activo = p.id === proceso?.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setElegido(p.id)}
                      aria-current={activo ? 'true' : undefined}
                      className={cn(
                        'flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                        activo ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                      )}
                    >
                      <PuntoUnidad color={color(p.unidad)} className="mt-1.5" />
                      <span className="min-w-0">
                        <span className="block font-medium leading-snug">{p.nombre}</span>
                        <span className="text-xs text-muted-foreground">{plural(p.pasos.length, 'paso')}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex min-w-0 flex-col gap-4">
            {/* Selector (móvil) */}
            <Select
              aria-label="Elegí un proceso"
              value={proceso?.id ?? ''}
              onChange={(e) => setElegido(e.target.value)}
              className="w-full lg:hidden"
            >
              {procesos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({plural(p.pasos.length, 'paso')})
                </option>
              ))}
            </Select>

            {proceso && (
              <Card className="min-w-0" style={{ borderTop: `4px solid ${color(proceso.unidad)}` }}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-lg">{proceso.nombre}</CardTitle>
                      <EtiquetaUnidad unidad={proceso.unidad} className="mt-1" />
                    </div>
                    <Segmentado<Modo>
                      ariaLabel="Modo"
                      valor={modo}
                      onChange={setModo}
                      opciones={[
                        {
                          valor: 'ver',
                          etiqueta: (
                            <span className="inline-flex items-center gap-1.5">
                              <Eye className="size-4" /> Ver
                            </span>
                          ),
                        },
                        {
                          valor: 'quitar',
                          etiqueta: (
                            <span className="inline-flex items-center gap-1.5">
                              <ListX className="size-4" /> Quitar pasos
                            </span>
                          ),
                        },
                      ]}
                    />
                  </div>
                  <CardDescription className="mt-1">{proceso.descripcion}</CardDescription>
                  {modo === 'quitar' && (
                    <p className="mt-1 rounded-lg bg-muted/60 p-2.5 text-sm">
                      En cada vuelta se oculta un paso más, empezando por el último. Elegí qué pasa en cada paso
                      oculto y por qué.
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {modo === 'ver' ? (
                    <Reproductor key={proceso.id} proceso={proceso} color={color(proceso.unidad)} />
                  ) : (
                    <PasosQuitados
                      key={proceso.id}
                      proceso={proceso}
                      procesos={datos.procesos}
                      slug={slug}
                      color={color(proceso.unidad)}
                    />
                  )}
                </CardContent>
                <CardContent>
                  <Fuente {...proceso.fuente} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}
