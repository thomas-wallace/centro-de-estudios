import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge, Progress } from '@/components/ui/misc';
import { cn } from '@/lib/utils';
import type { PasoProceso, Proceso } from '@/schema';

const MS_POR_PASO = 3800;

function esCampoEditable(t: EventTarget | null) {
  if (!(t instanceof HTMLElement)) return false;
  return t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName);
}

export function BadgeActor({ actor, color }: { actor: string; color: string }) {
  return (
    <Badge
      variant="outline"
      className="max-w-full truncate"
      style={{ borderColor: color, background: `${color}1a` }}
      title={actor}
    >
      {actor}
    </Badge>
  );
}

export function TablaValores({ valores }: { valores: NonNullable<PasoProceso['valores']> }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <caption className="sr-only">Valores de este paso</caption>
        <tbody>
          {valores.map((v) => (
            <tr key={v.nombre} className="border-b last:border-b-0">
              <th scope="row" className="bg-muted/50 px-3 py-1.5 text-left font-medium text-muted-foreground">
                {v.nombre}
              </th>
              <td className="px-3 py-1.5 font-mono break-words">{v.valor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Modo "Ver": animación paso a paso del proceso. */
export function Reproductor({ proceso, color }: { proceso: Proceso; color: string }) {
  const n = proceso.pasos.length;
  const [idx, setIdx] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const reducir = useReducedMotion();
  const actualRef = useRef<HTMLLIElement>(null);

  const ir = useCallback((i: number) => setIdx(Math.max(0, Math.min(n - 1, i))), [n]);

  // Reproducción automática
  useEffect(() => {
    if (!reproduciendo || idx >= n - 1) return;
    const t = setTimeout(() => {
      const sig = Math.min(n - 1, idx + 1);
      setIdx(sig);
      if (sig >= n - 1) setReproduciendo(false);
    }, MS_POR_PASO);
    return () => clearTimeout(t);
  }, [reproduciendo, idx, n]);

  // Teclado: ← →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (esCampoEditable(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setReproduciendo(false);
        setIdx((i) => Math.min(n - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setReproduciendo(false);
        setIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n]);

  useEffect(() => {
    actualRef.current?.scrollIntoView({ block: 'nearest', behavior: reducir ? 'auto' : 'smooth' });
  }, [idx, reducir]);

  const alFinal = idx >= n - 1;
  const alternarReproduccion = () => {
    if (reproduciendo) return setReproduciendo(false);
    if (alFinal) setIdx(0);
    setReproduciendo(true);
  };

  const actual = proceso.pasos[idx];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Paso {idx + 1} de {n}
          </span>
          <span className="hidden sm:inline">Usá ← → para moverte</span>
        </div>
        <Progress value={((idx + 1) / n) * 100} color={color} />
      </div>

      <p className="sr-only" aria-live="polite">
        Paso {idx + 1} de {n}. {actual.actor}: {actual.accion}
      </p>

      <ol className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {proceso.pasos.slice(0, idx + 1).map((p, i) => {
            const esActual = i === idx;
            return (
              <motion.li
                key={i}
                ref={esActual ? actualRef : undefined}
                layout={!reducir}
                initial={reducir ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducir ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: reducir ? 0.1 : 0.35, ease: 'easeOut' }}
                className={cn(
                  'rounded-xl border bg-card',
                  esActual ? 'p-4 shadow-sm' : 'px-3 py-2 opacity-75 hover:opacity-100',
                )}
                style={esActual ? { borderLeft: `4px solid ${color}` } : undefined}
              >
                {esActual ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: color }}
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <BadgeActor actor={p.actor} color={color} />
                    </div>
                    <p className="text-base font-medium leading-snug">{p.accion}</p>
                    <motion.div
                      initial={reducir ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reducir ? 0 : 0.2, duration: 0.3 }}
                      className="rounded-lg bg-muted/60 p-3 text-sm"
                    >
                      <span className="font-semibold">¿Por qué? </span>
                      <span className="text-muted-foreground">{p.por_que}</span>
                    </motion.div>
                    {p.valores && p.valores.length > 0 && (
                      <motion.div
                        initial={reducir ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reducir ? 0 : 0.35, duration: 0.3 }}
                      >
                        <TablaValores valores={p.valores} />
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setReproduciendo(false);
                      ir(i);
                    }}
                    className="flex w-full min-w-0 items-start gap-2 text-left text-sm"
                    aria-label={`Volver al paso ${i + 1}: ${p.accion}`}
                  >
                    <span className="mt-0.5 shrink-0 text-xs font-semibold text-muted-foreground">{i + 1}.</span>
                    <span className="min-w-0">
                      <span className="font-medium">{p.actor}</span>
                      <span className="text-muted-foreground"> — {p.accion}</span>
                    </span>
                  </button>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      <div className="sticky bottom-2 z-10 flex items-center justify-center gap-2 rounded-xl border bg-card/95 p-2 shadow-sm backdrop-blur">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setReproduciendo(false);
            ir(idx - 1);
          }}
          disabled={idx === 0}
          aria-label="Paso anterior"
        >
          <ChevronLeft />
        </Button>
        <Button onClick={alternarReproduccion} className="min-w-32" aria-pressed={reproduciendo}>
          {reproduciendo ? <Pause /> : alFinal ? <RotateCcw /> : <Play />}
          {reproduciendo ? 'Pausar' : alFinal ? 'Desde el inicio' : 'Reproducir'}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setReproduciendo(false);
            ir(idx + 1);
          }}
          disabled={alFinal}
          aria-label="Paso siguiente"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
