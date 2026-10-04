import Fuse, { type FuseResultMatch } from 'fuse.js';
import { MapPin, Search, X } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EtiquetaUnidad, FiltroUnidad, PaginaEncabezado, useUnidadParam } from '@/components/comunes';
import { Input, Vacio } from '@/components/ui/misc';
import { normalizar } from '@/lib/texto';
import { cn, plural } from '@/lib/utils';
import { useMateria } from '@/materia';
import type { EntradaGlosario } from '@/schema';
import { Resaltado } from './glosario/Resaltado';

const ABECEDARIO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const INDICE = ['#', ...ABECEDARIO];

function letraDe(termino: string): string {
  const l = normalizar(termino).charAt(0).toUpperCase();
  return /[A-Z]/.test(l) ? l : '#';
}

interface Fila {
  entrada: EntradaGlosario;
  matches?: readonly FuseResultMatch[];
}

export default function Glosario() {
  const { datos, slug } = useMateria();
  const reducir = useReducedMotion();
  const [unidad, setUnidad] = useUnidadParam();
  const [consulta, setConsulta] = useState('');
  const q = useDeferredValue(consulta.trim());

  const entradas = useMemo(
    () =>
      datos.glosario
        .filter((g) => !unidad || g.unidad === unidad)
        .sort((a, b) => a.termino.localeCompare(b.termino, 'es', { sensitivity: 'base' })),
    [datos.glosario, unidad],
  );

  const fuse = useMemo(
    () =>
      new Fuse(entradas, {
        keys: [
          { name: 'termino', weight: 3 },
          { name: 'sigla', weight: 2 },
          { name: 'definicion', weight: 1 },
        ],
        includeMatches: true,
        ignoreLocation: true,
        ignoreDiacritics: true,
        threshold: 0.35,
        minMatchCharLength: 2,
      }),
    [entradas],
  );

  /** Nombre normalizado de concepto → id (incluye variantes sin paréntesis). */
  const conceptoPorNombre = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of datos.conceptos) {
      const n = normalizar(c.nombre);
      m.set(n, c.id);
      const sinParentesis = normalizar(c.nombre.replace(/\s*\([^)]*\)\s*/g, ' '));
      if (sinParentesis && !m.has(sinParentesis)) m.set(sinParentesis, c.id);
      const dentro = /\(([^)]+)\)/.exec(c.nombre)?.[1];
      if (dentro && !m.has(normalizar(dentro))) m.set(normalizar(dentro), c.id);
    }
    return m;
  }, [datos.conceptos]);

  const conceptoDe = (g: EntradaGlosario): string | undefined => {
    const candidatos = [g.termino, g.sigla, g.sigla ? `${g.termino} (${g.sigla})` : undefined];
    for (const c of candidatos) {
      const id = c ? conceptoPorNombre.get(normalizar(c)) : undefined;
      if (id) return id;
    }
    return undefined;
  };

  const filas: Fila[] = useMemo(
    () => (q ? fuse.search(q).map((r) => ({ entrada: r.item, matches: r.matches })) : entradas.map((entrada) => ({ entrada }))),
    [q, fuse, entradas],
  );

  const letrasPresentes = useMemo(() => new Set(entradas.map((e) => letraDe(e.termino))), [entradas]);
  const minimoResaltado = Math.max(1, Math.min(3, q.length - 1));

  const saltar = (letra: string) => {
    document.getElementById(`glosario-${letra}`)?.scrollIntoView({
      behavior: reducir ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  let letraAnterior = '';

  return (
    <div className="mx-auto max-w-3xl">
      <PaginaEncabezado
        emoji="📖"
        titulo="Glosario"
        descripcion={`${plural(datos.glosario.length, 'término')} de la materia, con búsqueda tolerante a errores de tipeo.`}
      />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <label htmlFor="buscar-glosario" className="sr-only">
            Buscar en el glosario
          </label>
          <Input
            id="buscar-glosario"
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Buscá un término, sigla o definición…"
            autoComplete="off"
            className="h-10 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
          />
          {consulta && (
            <button
              type="button"
              onClick={() => setConsulta('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">Borrar búsqueda</span>
            </button>
          )}
        </div>
        <FiltroUnidad valor={unidad} onChange={setUnidad} className="h-10 w-full sm:w-auto" />
      </div>

      {!q && entradas.length > 0 && (
        <nav aria-label="Índice alfabético" className="mb-4 flex flex-wrap gap-1">
          {INDICE.filter((l) => l !== '#' || letrasPresentes.has('#')).map((l) => {
            const hay = letrasPresentes.has(l);
            return (
              <button
                key={l}
                type="button"
                disabled={!hay}
                onClick={() => saltar(l)}
                aria-label={l === '#' ? 'Ir a símbolos y números' : `Ir a la letra ${l}`}
                className={cn(
                  'flex size-8 items-center justify-center rounded-md text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  hay ? 'bg-muted hover:bg-primary hover:text-primary-foreground' : 'text-muted-foreground/40',
                )}
              >
                {l}
              </button>
            );
          })}
        </nav>
      )}

      <p className="sr-only" aria-live="polite">
        {q ? `${plural(filas.length, 'resultado')} para ${q}` : ''}
      </p>

      {filas.length === 0 ? (
        <Vacio titulo={q ? `No encontré nada para “${q}”` : 'No hay términos en esta unidad'}>
          {q ? 'Probá con otra palabra o quitá el filtro de unidad.' : 'Elegí otra unidad.'}
        </Vacio>
      ) : (
        <div className="space-y-2">
          {filas.map(({ entrada: g, matches }) => {
            const rango = (key: string) => matches?.find((m) => m.key === key)?.indices;
            const letra = letraDe(g.termino);
            const encabezado = !q && letra !== letraAnterior;
            letraAnterior = letra;
            const concepto = conceptoDe(g);
            return (
              <div key={`${g.unidad}-${g.termino}`}>
                {encabezado && (
                  <h2
                    id={`glosario-${letra}`}
                    className="scroll-mt-20 px-1 pt-3 pb-1 text-sm font-bold text-primary"
                  >
                    {letra}
                  </h2>
                )}
                <dl className="rounded-xl border bg-card p-4 shadow-sm">
                  <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-semibold">
                      <Resaltado texto={g.termino} rangos={rango('termino')} minimo={minimoResaltado} />
                    </span>
                    {g.sigla && (
                      <span className="text-sm text-muted-foreground italic">
                        <Resaltado texto={g.sigla} rangos={rango('sigla')} minimo={minimoResaltado} />
                      </span>
                    )}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed">
                    <Resaltado texto={g.definicion} rangos={rango('definicion')} minimo={minimoResaltado} />
                  </dd>
                  <dd className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <EtiquetaUnidad unidad={g.unidad} />
                    {concepto && (
                      <Link
                        to={`/${slug}/mapa?c=${encodeURIComponent(concepto)}`}
                        className="inline-flex items-center gap-1 rounded text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        <MapPin className="size-3.5" aria-hidden /> Ver en el mapa
                        <span className="sr-only"> ({g.termino})</span>
                      </Link>
                    )}
                  </dd>
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
