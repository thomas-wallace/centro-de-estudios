import { CheckIcon, LocateFixedIcon, RotateCcwIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FiltroUnidad } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import { Badge, Input, Progress, Segmentado, Vacio } from '@/components/ui/misc';
import { registrarActividad } from '@/db';
import { elegirHuecos, esRespuestaCorrecta, opcionesConDistractores, type Punto } from '@/lib/mapa';
import { LETRAS } from '@/lib/texto';
import { cn, pct } from '@/lib/utils';
import { useMateria } from '@/materia';
import { useCentrar } from './centrar';
import { aristaConcepto, nodosDesdeLayout, useGrafo, useRelaciones } from './construir';
import type { EstadoHueco, HuecoVisual } from './elementos';
import { useMovidos } from './Explorar';
import { useEsDesktop, useLayout } from './hooks';
import { ALTO_LIENZO, Lienzo } from './Lienzo';

type TipoHueco = 'conceptos' | 'relaciones';

interface Hueco {
  n: number;
  /** Id del concepto o de la relación oculta. */
  objetivo: string;
  correcta: string;
  opciones: string[];
  /** Conceptos involucrados (para registrar dominio). */
  conceptos: string[];
  /** Descripción para la lista (solo relaciones): "A → ? → B". */
  origen?: string;
  destino?: string;
}

const enfocarHueco = (n: number) => {
  const el = document.getElementById(`hueco-${n}`);
  el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  el?.focus({ preventScroll: true });
};

export function Huecos({ unidad, setUnidad }: { unidad: string; setUnidad: (u: string) => void }) {
  const { slug, datos, conceptos, color, nombreUnidad } = useMateria();
  const relaciones = useRelaciones();
  const { sub, nodosLayout, desvios } = useGrafo(unidad);
  // Mismo layout que Explorar (la posición de los conceptos no cambia entre modos).
  const clave = `${slug}|${unidad || '*'}|explorar`;
  const { layout, error } = useLayout(clave, nodosLayout, sub.aristas);
  const { pos: movidos, onNodesChange } = useMovidos(clave);
  const centrar = useCentrar();
  const desktop = useEsDesktop();

  const [tipo, setTipo] = useState<TipoHueco>('conceptos');
  const [conOpciones, setConOpciones] = useState(false);
  const [intento, setIntento] = useState(0);

  // ── Generar huecos (cuando hay layout, para numerarlos de arriba hacia abajo) ──
  const huecos = useMemo<Hueco[]>(() => {
    if (!layout) return [];
    const posDe = (id: string): Punto => layout.posiciones.get(id) ?? { x: 0, y: 0 };
    const orden = (p: Punto) => Math.round(p.y / 80) * 100000 + p.x;
    const nombres = (filtro: (u: string) => boolean) => datos.conceptos.filter((c) => filtro(c.unidad)).map((c) => c.nombre);
    if (tipo === 'conceptos') {
      const candidatos = sub.nodos.filter((n) => !n.atenuado).map((n) => n.id);
      return elegirHuecos(candidatos)
        .sort((a, b) => orden(posDe(a)) - orden(posDe(b)))
        .map((id, i) => {
          const c = conceptos.get(id)!;
          return {
            n: i + 1,
            objetivo: id,
            correcta: c.nombre,
            opciones: opcionesConDistractores(c.nombre, nombres((u) => u === c.unidad), nombres((u) => u !== c.unidad)),
            conceptos: [id],
          };
        });
    }
    const verbosDe = (filtro: (u: string) => boolean) =>
      relaciones.filter((r) => filtro(conceptos.get(r.origen)?.unidad ?? '')).map((r) => r.verbo);
    const medio = (o: string, d: string) => ({ x: (posDe(o).x + posDe(d).x) / 2, y: (posDe(o).y + posDe(d).y) / 2 });
    return elegirHuecos(sub.aristas)
      .sort((a, b) => orden(medio(a.origen, a.destino)) - orden(medio(b.origen, b.destino)))
      .map((r, i) => {
        const u = conceptos.get(r.origen)?.unidad ?? '';
        return {
          n: i + 1,
          objetivo: r.id,
          correcta: r.verbo,
          opciones: opcionesConDistractores(r.verbo, verbosDe((x) => x === u), verbosDe((x) => x !== u)),
          conceptos: [r.origen, r.destino],
          origen: r.origen,
          destino: r.destino,
        };
      });
    // `intento` fuerza un sorteo nuevo.
  }, [layout, tipo, sub, conceptos, datos.conceptos, relaciones, intento]);

  const claveIntento = `${clave}|${tipo}|${intento}|${huecos.map((h) => h.objetivo).join(',')}`;
  const [estado, setEstado] = useState<{ clave: string; respuestas: Record<number, string>; terminado: boolean }>({
    clave: '',
    respuestas: {},
    terminado: false,
  });
  const respuestas = estado.clave === claveIntento ? estado.respuestas : {};
  const terminado = estado.clave === claveIntento && estado.terminado;
  const responder = (n: number, v: string) =>
    setEstado({ clave: claveIntento, respuestas: { ...respuestas, [n]: v }, terminado: false });

  const evaluados = useMemo(
    () =>
      huecos.map((h) => ({
        ...h,
        respuesta: respuestas[h.n] ?? '',
        ok: esRespuestaCorrecta(respuestas[h.n] ?? '', h.correcta, tipo === 'conceptos' ? 'concepto' : 'relacion'),
      })),
    [huecos, respuestas, tipo],
  );
  const porObjetivo = useMemo(() => new Map(evaluados.map((h) => [h.objetivo, h])), [evaluados]);
  const aciertos = evaluados.filter((h) => h.ok).length;
  const respondidos = evaluados.filter((h) => h.respuesta.trim()).length;

  const visual = (h: (typeof evaluados)[number]): HuecoVisual => {
    const e: EstadoHueco = !terminado ? 'pendiente' : h.ok ? 'ok' : 'mal';
    return { n: h.n, estado: e, texto: terminado ? (h.ok ? h.respuesta : h.correcta) : h.respuesta };
  };

  const nodes = useMemo(() => {
    if (!layout) return [];
    return nodosDesdeLayout(layout, sub.nodos, conceptos, color, nombreUnidad, (id) => {
      const h = tipo === 'conceptos' ? porObjetivo.get(id) : undefined;
      return h ? { hueco: visual(h) } : {};
    }).map((n) => {
      const h = n.type === 'concepto' ? n.data.hueco : undefined;
      return { ...n, position: movidos?.get(n.id) ?? n.position, ...(h && !terminado ? { ariaLabel: `Hueco ${h.n}` } : {}) };
    });
  }, [layout, sub.nodos, conceptos, color, nombreUnidad, tipo, porObjetivo, terminado, movidos]);

  const edges = useMemo(
    () =>
      sub.aristas.map((r) => {
        const h = tipo === 'relaciones' ? porObjetivo.get(r.id) : undefined;
        return aristaConcepto(r.id, r.origen, r.destino, {
          verbo: r.verbo,
          desvio: desvios.get(r.id) ?? 0,
          hueco: h ? visual(h) : undefined,
          estado: h && terminado ? (h.ok ? 'ok' : 'mal') : 'normal',
          onClickEtiqueta: h ? () => enfocarHueco(h.n) : undefined,
        });
      }),
    [sub.aristas, desvios, tipo, porObjetivo, terminado],
  );

  const terminar = () => {
    setEstado({ clave: claveIntento, respuestas, terminado: true });
    const mal = new Set(evaluados.filter((h) => !h.ok).flatMap((h) => h.conceptos));
    const ok = new Set(evaluados.filter((h) => h.ok).flatMap((h) => h.conceptos).filter((c) => !mal.has(c)));
    void registrarActividad({
      materia: slug,
      herramienta: 'mapa-huecos',
      aciertos,
      total: evaluados.length,
      unidad: unidad || undefined,
      conceptosOk: [...ok],
      conceptosMal: [...mal],
      detalle: tipo === 'conceptos' ? 'conceptos ocultos' : 'relaciones ocultas',
    });
  };

  const verEnMapa = (h: Hueco) => centrar(h.origen && h.destino ? [h.origen, h.destino] : h.objetivo);

  const lista = (
    <aside
      aria-label="Huecos para completar"
      className={cn('flex flex-col rounded-xl border bg-card', desktop ? 'w-80 shrink-0 lg:w-96' : 'mt-3')}
      style={desktop ? { height: ALTO_LIENZO } : undefined}
    >
      <div className="border-b p-3">
        {terminado ? (
          <div className="space-y-2">
            <p className="text-lg font-bold">
              Acertaste {aciertos} de {evaluados.length}{' '}
              <span className="text-muted-foreground">({pct(aciertos, evaluados.length)} %)</span>
            </p>
            <Progress value={pct(aciertos, evaluados.length)} color="var(--success)" />
            <Button size="sm" onClick={() => setIntento((i) => i + 1)}>
              <RotateCcwIcon /> Otro intento
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              {respondidos} de {evaluados.length} completados
            </span>
            <Button size="sm" onClick={terminar} disabled={!evaluados.length}>
              <CheckIcon /> Terminar
            </Button>
          </div>
        )}
      </div>
      <ol className="flex-1 space-y-3 overflow-y-auto p-3">
        {evaluados.map((h) => (
          <li
            key={h.n}
            className={cn(
              'rounded-lg border p-2.5',
              terminado && (h.ok ? 'border-success/50 bg-success/5' : 'border-destructive/50 bg-destructive/5'),
            )}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm">
                <Badge variant={terminado ? (h.ok ? 'success' : 'destructive') : 'default'} className="mr-1.5">
                  {h.n}
                </Badge>
                {h.origen && h.destino ? (
                  <>
                    <span className="font-medium">{conceptos.get(h.origen)?.nombre}</span>
                    <span className="text-muted-foreground"> → ¿…? → </span>
                    <span className="font-medium">{conceptos.get(h.destino)?.nombre}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">¿Qué concepto va acá?</span>
                )}
              </p>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => verEnMapa(h)} aria-label={`Ver el hueco ${h.n} en el mapa`}>
                <LocateFixedIcon />
              </Button>
            </div>
            {terminado ? (
              <div className="space-y-0.5 text-sm">
                {h.ok ? (
                  <p className="flex items-center gap-1 text-success">
                    <CheckIcon className="size-4" /> {h.correcta}
                  </p>
                ) : (
                  <>
                    <p className="flex items-center gap-1 text-destructive">
                      <XIcon className="size-4" /> {h.respuesta.trim() ? <s>{h.respuesta}</s> : 'Sin responder'}
                    </p>
                    <p>
                      Correcta: <strong>{h.correcta}</strong>
                    </p>
                  </>
                )}
              </div>
            ) : conOpciones ? (
              <div role="radiogroup" aria-label={`Opciones para el hueco ${h.n}`} className="grid gap-1.5">
                {h.opciones.map((o, i) => (
                  <button
                    key={o}
                    id={i === 0 ? `hueco-${h.n}` : undefined}
                    type="button"
                    role="radio"
                    aria-checked={h.respuesta === o}
                    onClick={() => responder(h.n, o)}
                    className={cn(
                      'flex items-start gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                      h.respuesta === o && 'border-primary bg-primary/10',
                    )}
                  >
                    <span className="font-semibold text-muted-foreground">{LETRAS[i]}</span>
                    {o}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                id={`hueco-${h.n}`}
                aria-label={`Respuesta del hueco ${h.n}`}
                placeholder={tipo === 'conceptos' ? 'Nombre del concepto' : 'Verbo de la relación'}
                value={h.respuesta}
                onChange={(e) => responder(h.n, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') enfocarHueco(h.n + 1);
                }}
                autoComplete="off"
              />
            )}
          </li>
        ))}
      </ol>
      {terminado && evaluados.some((h) => !h.ok) && (
        <p className="border-t p-3 text-xs text-muted-foreground">
          Los fallos quedan marcados en rojo en el mapa con la respuesta correcta.
        </p>
      )}
    </aside>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmentado<TipoHueco>
          ariaLabel="Qué ocultar"
          valor={tipo}
          onChange={setTipo}
          opciones={[
            { valor: 'conceptos', etiqueta: 'Ocultar conceptos' },
            { valor: 'relaciones', etiqueta: 'Ocultar relaciones' },
          ]}
        />
        <FiltroUnidad valor={unidad} onChange={setUnidad} />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[var(--primary)]"
            checked={conOpciones}
            onChange={(e) => setConOpciones(e.target.checked)}
          />
          Con opciones
        </label>
        <Button variant="outline" size="sm" onClick={() => setIntento((i) => i + 1)}>
          <RotateCcwIcon /> Sortear de nuevo
        </Button>
      </div>
      {error && <p className="mb-2 text-sm text-destructive">No pude ordenar el mapa: {error}</p>}
      {layout && huecos.length === 0 ? (
        <Vacio titulo="No hay suficientes elementos para ocultar">Probá con otra unidad o con todo el mapa.</Vacio>
      ) : (
        <div className={cn(desktop && 'flex gap-3')}>
          <Lienzo
            key={clave}
            className="flex-1"
            cargando={!layout}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onNodeClick={(_, n) => {
              const h = tipo === 'conceptos' ? porObjetivo.get(n.id) : undefined;
              if (h && !terminado) enfocarHueco(h.n);
            }}
            nodesConnectable={false}
          />
          {layout && lista}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {tipo === 'conceptos'
          ? 'Se ocultó entre el 20 % y el 40 % de los conceptos. Tocá un hueco del mapa para ir a su respuesta.'
          : 'Se ocultó entre el 20 % y el 40 % de los verbos de relación. Tocá un hueco del mapa para ir a su respuesta.'}{' '}
        Las respuestas escritas no distinguen mayúsculas ni tildes.
      </p>
    </div>
  );
}
