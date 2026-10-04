import { Check, ChevronRight, Eye, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { rutaHijo } from '@/lib/practica';
import { cn } from '@/lib/utils';
import type { NodoTaxonomia } from '@/schema';

export type Autoevaluacion = 'ok' | 'mal';

export interface PracticaArbol {
  /** Ruta del nodo cuyos hijos están ocultos. */
  ruta: string;
  revelados: Set<number>;
  marcas: Record<number, Autoevaluacion>;
  onRevelar: (i: number) => void;
  onMarcar: (i: number, m: Autoevaluacion) => void;
}

interface Props {
  /** Prefijo único para los ids del DOM (por ejemplo, el id de la taxonomía). */
  idBase: string;
  nodo: NodoTaxonomia;
  ruta: string;
  nivel: number;
  color: string;
  expandidos: Set<string>;
  onAlternar: (ruta: string) => void;
  practica?: PracticaArbol;
  /** Si está definido, el nodo está oculto en la práctica (índice entre sus hermanos). */
  ocultoIndice?: number;
}

function NodoOculto({ i, practica, nodo }: { i: number; practica: PracticaArbol; nodo: NodoTaxonomia }) {
  const revelado = practica.revelados.has(i);
  const marca = practica.marcas[i];
  if (!revelado) {
    return (
      <button
        type="button"
        onClick={() => practica.onRevelar(i)}
        className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-dashed px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      >
        <Eye className="size-4" aria-hidden />
        <span>
          ¿Cuál es? <span className="sr-only">Hijo {i + 1}: </span>Pensalo y tocá para revelar
        </span>
      </button>
    );
  }
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span
        className={cn(
          'rounded-md px-1.5 py-0.5 font-medium',
          marca === 'ok' && 'bg-success/15',
          marca === 'mal' && 'bg-destructive/15',
          !marca && 'bg-warning/20',
        )}
      >
        {nodo.nombre}
      </span>
      <span className="inline-flex gap-1" role="group" aria-label={`¿Acertaste "${nodo.nombre}"?`}>
        <button
          type="button"
          onClick={() => practica.onMarcar(i, 'ok')}
          aria-pressed={marca === 'ok'}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-md border transition-colors',
            marca === 'ok' ? 'border-success bg-success text-white' : 'hover:bg-success/10',
          )}
          aria-label="Lo sabía"
          title="Lo sabía"
        >
          <Check className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => practica.onMarcar(i, 'mal')}
          aria-pressed={marca === 'mal'}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-md border transition-colors',
            marca === 'mal' ? 'border-destructive bg-destructive text-white' : 'hover:bg-destructive/10',
          )}
          aria-label="No lo sabía"
          title="No lo sabía"
        >
          <X className="size-4" />
        </button>
      </span>
    </div>
  );
}

/** Nodo de un árbol desplegable, con líneas guía y chevron. */
export function NodoArbol({ idBase, nodo, ruta, nivel, color, expandidos, onAlternar, practica, ocultoIndice }: Props) {
  const reducir = useReducedMotion();
  const tieneHijos = nodo.hijos.length > 0;
  const abierto = tieneHijos && expandidos.has(ruta);
  const oculto = practica !== undefined && ocultoIndice !== undefined;
  const reveladoONo = oculto ? practica.revelados.has(ocultoIndice) : true;
  const idHijos = `${idBase}-hijos-${ruta || 'raiz'}`;
  const esNivelPractica = practica?.ruta === ruta;

  return (
    <li className="relative min-w-0">
      <div
        className={cn(
          'flex min-w-0 items-start gap-1 rounded-lg py-1 pr-1',
          esNivelPractica && 'bg-accent/60 ring-1 ring-primary/30',
        )}
      >
        {tieneHijos ? (
          <button
            type="button"
            onClick={() => onAlternar(ruta)}
            aria-expanded={abierto}
            aria-controls={idHijos}
            aria-label={`${abierto ? 'Colapsar' : 'Expandir'} ${oculto && !reveladoONo ? 'nodo oculto' : nodo.nombre}`}
            className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className={cn('size-4 transition-transform', abierto && 'rotate-90')} />
          </button>
        ) : (
          <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center" aria-hidden>
            <span className="size-1.5 rounded-full" style={{ background: color }} />
          </span>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          {oculto ? (
            <NodoOculto i={ocultoIndice} practica={practica} nodo={nodo} />
          ) : (
            <span className={cn('break-words', nivel === 0 ? 'font-semibold' : 'font-medium', 'text-sm sm:text-base')}>
              {nodo.nombre}
            </span>
          )}
          {nodo.descripcion && reveladoONo && (
            <p className="mt-0.5 text-sm break-words text-muted-foreground">{nodo.descripcion}</p>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.ul
            id={idHijos}
            key="hijos"
            initial={reducir ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reducir ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reducir ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reducir ? 0.1 : 0.2, ease: 'easeOut' }}
            className="ml-3 overflow-hidden border-l-2 pl-2 sm:pl-3"
            style={{ borderColor: `${color}55` }}
          >
            {nodo.hijos.map((h, i) => (
              <NodoArbol
                key={i}
                idBase={idBase}
                nodo={h}
                ruta={rutaHijo(ruta, i)}
                nivel={nivel + 1}
                color={color}
                expandidos={expandidos}
                onAlternar={onAlternar}
                practica={practica}
                ocultoIndice={esNivelPractica ? i : undefined}
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}
