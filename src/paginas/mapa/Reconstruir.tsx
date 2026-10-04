import { ConnectionMode, type Connection, type EdgeChange } from '@xyflow/react';
import { CheckIcon, MinusIcon, RotateCcwIcon, Trash2Icon, XIcon } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { FiltroUnidad } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import { Progress, Vacio } from '@/components/ui/misc';
import { registrarActividad } from '@/db';
import {
  compararReconstruccion,
  desviosParalelos,
  grillaAleatoria,
  relacionesInternas,
  verbosDeLaMateria,
  type AristaUsuario,
  type ResultadoReconstruccion,
} from '@/lib/mapa';
import { cn, pct, plural } from '@/lib/utils';
import { useMateria } from '@/materia';
import { aristaConcepto, nodoConcepto, useRelaciones } from './construir';
import { DialogoVerbo, type ConexionPendiente } from './DialogoVerbo';
import type { AristaConceptoT, DatosArista } from './elementos';
import { useMovidos } from './Explorar';
import { useEsDesktop } from './hooks';
import { ALTO_LIENZO, Lienzo } from './Lienzo';

export function Reconstruir({ unidadInicial }: { unidadInicial: string }) {
  const { datos } = useMateria();
  const [unidad, setUnidad] = useState(unidadInicial || datos.unidades[0]?.id || '');
  const [intento, setIntento] = useState(0);
  return (
    <Juego
      key={`${unidad}|${intento}`}
      unidad={unidad}
      setUnidad={setUnidad}
      reiniciar={() => setIntento((i) => i + 1)}
      clave={`${unidad}|${intento}`}
    />
  );
}

function Juego({
  unidad,
  setUnidad,
  reiniciar,
  clave,
}: {
  unidad: string;
  setUnidad: (u: string) => void;
  reiniciar: () => void;
  clave: string;
}) {
  const { slug, datos, conceptos, color } = useMateria();
  const relaciones = useRelaciones();
  const desktop = useEsDesktop();
  const verbos = useMemo(() => verbosDeLaMateria(datos.relaciones), [datos.relaciones]);
  const propios = useMemo(() => datos.conceptos.filter((c) => c.unidad === unidad), [datos.conceptos, unidad]);
  const reales = useMemo(() => relacionesInternas(datos.conceptos, relaciones, unidad), [datos.conceptos, relaciones, unidad]);
  // En móvil, menos columnas para que el texto se lea sin tanto zoom.
  const [grilla] = useState(() =>
    grillaAleatoria(propios.map((c) => c.id), Math.random, { ancho: 250, alto: 130, columnas: desktop ? undefined : 3 }),
  );
  const { pos: movidos, onNodesChange } = useMovidos(clave);

  const [aristas, setAristas] = useState<AristaUsuario[]>([]);
  const [pendiente, setPendiente] = useState<ConexionPendiente | null>(null);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoReconstruccion | null>(null);
  const contador = useRef(0);

  const borrar = (id: string) => {
    setAristas((as) => as.filter((a) => a.id !== id));
    setSeleccionada((s) => (s === id ? null : s));
  };

  const nodes = useMemo(
    () =>
      propios.map((c) => {
        const p = movidos?.get(c.id) ?? grilla.get(c.id) ?? { x: 0, y: 0 };
        return nodoConcepto(c, color(c.unidad), p.x, p.y, { conectable: !resultado });
      }),
    [propios, movidos, grilla, color, resultado],
  );

  const edges = useMemo<AristaConceptoT[]>(() => {
    if (!resultado) {
      const desvios = desviosParalelos(aristas);
      return aristas.map((a) =>
        aristaConcepto(
          a.id,
          a.origen,
          a.destino,
          { verbo: a.verbo, desvio: desvios.get(a.id) ?? 0, onBorrar: () => borrar(a.id) },
          { selected: a.id === seleccionada },
        ),
      );
    }
    const todas: { id: string; origen: string; destino: string; data: Omit<DatosArista, 'desvio'> }[] = [
      ...resultado.aciertos.map((a) => ({
        id: a.usuario.id,
        origen: a.usuario.origen,
        destino: a.usuario.destino,
        data: {
          verbo: a.usuario.verbo,
          estado: a.verboOk ? ('ok' as const) : ('parcial' as const),
          nota: a.verboOk ? undefined : `correcto: ${a.real.verbo}${a.sentidoOk ? '' : ' (al revés)'}`,
        },
      })),
      ...resultado.deMas.map((a) => ({
        id: a.id,
        origen: a.origen,
        destino: a.destino,
        data: { verbo: a.verbo, estado: 'mal' as const, nota: 'no está en el mapa' },
      })),
      ...resultado.faltantes.map((r) => ({
        id: `faltante-${r.id}`,
        origen: r.origen,
        destino: r.destino,
        data: { verbo: r.verbo, estado: 'faltante' as const, nota: 'te faltó' },
      })),
    ];
    const desvios = desviosParalelos(todas);
    return todas.map((t) => aristaConcepto(t.id, t.origen, t.destino, { ...t.data, desvio: desvios.get(t.id) ?? 0 }));
  }, [aristas, resultado, seleccionada]);

  const onConnect = (c: Connection) => {
    if (!c.source || !c.target || c.source === c.target || resultado) return;
    setPendiente({ origen: c.source, destino: c.target });
  };

  const onEdgesChange = (changes: EdgeChange<AristaConceptoT>[]) => {
    if (resultado) return;
    for (const ch of changes) {
      if (ch.type === 'remove') borrar(ch.id);
      if (ch.type === 'select') setSeleccionada((s) => (ch.selected ? ch.id : s === ch.id ? null : s));
    }
  };

  const terminar = () => {
    const r = compararReconstruccion(aristas, reales);
    setResultado(r);
    setPendiente(null);
    const verbosOk = r.aciertos.filter((a) => a.verboOk).length;
    const mal = new Set([...r.faltantes, ...r.deMas].flatMap((x) => [x.origen, x.destino]));
    const ok = new Set(r.aciertos.flatMap((a) => [a.real.origen, a.real.destino]).filter((c) => !mal.has(c)));
    void registrarActividad({
      materia: slug,
      herramienta: 'mapa-reconstruir',
      aciertos: r.aciertos.length,
      total: reales.length,
      unidad,
      conceptosOk: [...ok],
      conceptosMal: [...mal],
      detalle: `verbos correctos: ${verbosOk} · de más: ${r.deMas.length} · puntos: ${r.puntos}/${r.maximo}`,
    });
  };

  const nombre = (id: string) => conceptos.get(id)?.nombre ?? id;
  const frase = (o: string, v: string, d: string) => (
    <>
      <strong className="font-medium">{nombre(o)}</strong> <em className="text-muted-foreground">{v}</em>{' '}
      <strong className="font-medium">{nombre(d)}</strong>
    </>
  );

  const controles = (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <FiltroUnidad valor={unidad} onChange={setUnidad} todas={false} />
      <Button variant="outline" size="sm" onClick={reiniciar}>
        <RotateCcwIcon /> {resultado ? 'Otro intento' : 'Empezar de nuevo'}
      </Button>
      {!resultado && (
        <Button size="sm" onClick={terminar} disabled={reales.length === 0}>
          <CheckIcon /> Terminar
        </Button>
      )}
    </div>
  );

  if (propios.length < 2 || reales.length === 0) {
    return (
      <div>
        {controles}
        <Vacio titulo="Esta unidad no tiene relaciones internas para reconstruir">Elegí otra unidad.</Vacio>
      </div>
    );
  }

  const panel = (
    <aside
      aria-label={resultado ? 'Resultado de la reconstrucción' : 'Tus relaciones'}
      className={cn('flex flex-col overflow-hidden rounded-xl border bg-card', desktop ? 'w-80 shrink-0 lg:w-96' : 'mt-3')}
      style={desktop ? { height: ALTO_LIENZO } : undefined}
    >
      <div className="flex-1 space-y-4 overflow-y-auto p-3 text-sm">
        {resultado ? (
          <>
            <div className="space-y-2">
              <p className="text-lg font-bold">
                {resultado.puntos} de {resultado.maximo} puntos{' '}
                <span className="text-muted-foreground">({pct(resultado.puntos, resultado.maximo)} %)</span>
              </p>
              <Progress value={pct(resultado.puntos, resultado.maximo)} color="var(--success)" />
              <p className="text-xs text-muted-foreground">1 punto por cada par de conceptos bien conectado y 1 extra si además el verbo y el sentido son correctos.</p>
            </div>
            <Lista titulo={`Aciertos (${resultado.aciertos.length})`} icono={<CheckIcon className="size-4 text-success" />}>
              {resultado.aciertos.map((a) => (
                <li key={a.usuario.id}>
                  {frase(a.usuario.origen, a.usuario.verbo, a.usuario.destino)}
                  {!a.verboOk && (
                    <span className="block text-xs text-warning">
                      Par correcto; la relación real es: {nombre(a.real.origen)} <em>{a.real.verbo}</em> {nombre(a.real.destino)}
                    </span>
                  )}
                </li>
              ))}
            </Lista>
            <Lista titulo={`Te faltaron (${resultado.faltantes.length})`} icono={<MinusIcon className="size-4 text-muted-foreground" />}>
              {resultado.faltantes.map((r) => (
                <li key={r.id}>{frase(r.origen, r.verbo, r.destino)}</li>
              ))}
            </Lista>
            <Lista titulo={`De más (${resultado.deMas.length})`} icono={<XIcon className="size-4 text-destructive" />}>
              {resultado.deMas.map((a) => (
                <li key={a.id}>{frase(a.origen, a.verbo, a.destino)}</li>
              ))}
            </Lista>
            <ul className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
              <li><span className="mr-1 inline-block h-0.5 w-5 bg-success align-middle" /> par y verbo correctos</li>
              <li><span className="mr-1 inline-block h-0.5 w-5 bg-warning align-middle" /> par correcto, verbo o sentido distinto</li>
              <li><span className="mr-1 inline-block h-0.5 w-5 bg-destructive align-middle" /> relación que no está en el mapa</li>
              <li><span className="mr-1 inline-block w-5 border-t-2 border-dashed border-muted-foreground align-middle" /> relación que te faltó</li>
            </ul>
          </>
        ) : (
          <>
            <div className="space-y-1 text-muted-foreground">
              <p>
                Conectá los conceptos arrastrando desde un punto de un concepto hasta otro (o tocá un punto y después otro). Arrastrá desde el
                <strong className="text-foreground"> origen</strong> hacia el <strong className="text-foreground">destino</strong>: se lee
                “origen → verbo → destino”.
              </p>
              <p>
                La unidad tiene <strong className="text-foreground">{plural(reales.length, 'relación', 'relaciones')}</strong> entre sus
                conceptos. Llevás {aristas.length}.
              </p>
            </div>
            {aristas.length > 0 && (
              <ul className="space-y-1">
                {aristas.map((a) => (
                  <li key={a.id} className={cn('flex items-start gap-2 rounded-md px-1.5 py-1', a.id === seleccionada && 'bg-muted')}>
                    <span className="min-w-0 flex-1">{frase(a.origen, a.verbo, a.destino)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => borrar(a.id)}
                      aria-label={`Borrar: ${nombre(a.origen)} ${a.verbo} ${nombre(a.destino)}`}
                    >
                      <Trash2Icon />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      {!resultado && (
        <div className="border-t p-3">
          <Button className="w-full" onClick={terminar}>
            <CheckIcon /> Terminar y comparar
          </Button>
        </div>
      )}
    </aside>
  );

  return (
    <div>
      {controles}
      <div className={cn(desktop && 'flex gap-3')}>
        <Lienzo
          key={clave}
          className="flex-1"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodesConnectable={!resultado}
          connectionRadius={36}
          connectionMode={ConnectionMode.Loose}
          deleteKeyCode={['Backspace', 'Delete']}
          fitViewOptions={{ padding: 0.08 }}
        />
        {panel}
      </div>
      <DialogoVerbo
        pendiente={pendiente}
        verbos={verbos}
        onCancelar={() => setPendiente(null)}
        onConfirmar={(c) => {
          setAristas((as) => [...as, { id: `u${++contador.current}`, ...c }]);
          setPendiente(null);
        }}
      />
    </div>
  );
}

function Lista({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode[] }) {
  return (
    <section>
      <h3 className="mb-1.5 flex items-center gap-1.5 font-semibold">
        {icono}
        {titulo}
      </h3>
      {children.length === 0 ? <p className="text-muted-foreground">Ninguna.</p> : <ul className="space-y-1.5">{children}</ul>}
    </section>
  );
}
