import { Check, RotateCcw, SkipForward, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge, Progress } from '@/components/ui/misc';
import { registrarActividad } from '@/db';
import {
  corregirVuelta,
  mismoTexto,
  preguntasVuelta,
  type CorreccionPaso,
  type PreguntaPaso,
  type RespuestaPaso,
} from '@/lib/practica';
import { cn, pct, plural } from '@/lib/utils';
import type { Proceso } from '@/schema';
import { BadgeActor } from './Reproductor';

interface Resultado {
  aciertos: number;
  total: number;
  detalle: CorreccionPaso[];
}

function GrupoOpciones({
  nombre,
  leyenda,
  opciones,
  elegida,
  correcta,
  corregido,
  onElegir,
}: {
  nombre: string;
  leyenda: string;
  opciones: string[];
  elegida?: string;
  correcta: string;
  corregido: boolean;
  onElegir: (v: string) => void;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold">{leyenda}</legend>
      {opciones.map((o) => {
        const sel = elegida !== undefined && mismoTexto(o, elegida);
        const esCorrecta = mismoTexto(o, correcta);
        return (
          <label
            key={o}
            className={cn(
              'flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-sm transition-colors',
              !corregido && (sel ? 'border-primary bg-primary/5' : 'hover:bg-muted'),
              corregido && 'cursor-default',
              corregido && esCorrecta && 'border-success bg-success/10',
              corregido && sel && !esCorrecta && 'border-destructive bg-destructive/10',
            )}
          >
            <input
              type="radio"
              name={nombre}
              value={o}
              checked={sel}
              disabled={corregido}
              onChange={() => onElegir(o)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
            />
            <span className="min-w-0 flex-1 break-words">{o}</span>
            {corregido && esCorrecta && <Check className="size-4 shrink-0 text-success" aria-label="Correcta" />}
            {corregido && sel && !esCorrecta && <X className="size-4 shrink-0 text-destructive" aria-label="Incorrecta" />}
          </label>
        );
      })}
    </fieldset>
  );
}

function TarjetaPregunta({
  pregunta,
  proceso,
  color,
  respuesta,
  correccion,
  onCambiar,
}: {
  pregunta: PreguntaPaso;
  proceso: Proceso;
  color: string;
  respuesta: RespuestaPaso;
  correccion?: CorreccionPaso;
  onCambiar: (r: RespuestaPaso) => void;
}) {
  const paso = proceso.pasos[pregunta.indice];
  const corregido = correccion !== undefined;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-card p-3 sm:p-4" style={{ borderColor: color }}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Paso {pregunta.indice + 1}</span>
        <BadgeActor actor={paso.actor} color={color} />
        {corregido && (
          <Badge
            variant={correccion.accionOk && correccion.porQueOk ? 'success' : correccion.accionOk || correccion.porQueOk ? 'warning' : 'destructive'}
            className="ml-auto"
          >
            {(correccion.accionOk ? 1 : 0) + (correccion.porQueOk ? 1 : 0)}/2
          </Badge>
        )}
      </div>
      <GrupoOpciones
        nombre={`accion-${proceso.id}-${pregunta.indice}`}
        leyenda="¿Qué pasa en este paso?"
        opciones={pregunta.opcionesAccion}
        elegida={respuesta.accion}
        correcta={pregunta.accionCorrecta}
        corregido={corregido}
        onElegir={(accion) => onCambiar({ ...respuesta, accion })}
      />
      <GrupoOpciones
        nombre={`porque-${proceso.id}-${pregunta.indice}`}
        leyenda="¿Por qué ocurre?"
        opciones={pregunta.opcionesPorQue}
        elegida={respuesta.porQue}
        correcta={pregunta.porQueCorrecto}
        corregido={corregido}
        onElegir={(porQue) => onCambiar({ ...respuesta, porQue })}
      />
    </div>
  );
}

/** Modo "Pasos que se van quitando": en la vuelta k se ocultan los últimos k pasos. */
export function PasosQuitados({
  proceso,
  procesos,
  slug,
  color,
}: {
  proceso: Proceso;
  procesos: Proceso[];
  slug: string;
  color: string;
}) {
  const n = proceso.pasos.length;
  const [vuelta, setVuelta] = useState(1);
  const [preguntas, setPreguntas] = useState(() => preguntasVuelta(proceso, procesos, 1));
  const [respuestas, setRespuestas] = useState<Record<number, RespuestaPaso>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [historial, setHistorial] = useState<{ vuelta: number; aciertos: number; total: number }[]>([]);
  const reducir = useReducedMotion();
  const arribaRef = useRef<HTMLDivElement>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);

  const porIndice = new Map(preguntas.map((p) => [p.indice, p]));
  const faltan = preguntas.filter((p) => !respuestas[p.indice]?.accion || !respuestas[p.indice]?.porQue).length;

  const irAVuelta = (v: number) => {
    setVuelta(v);
    setPreguntas(preguntasVuelta(proceso, procesos, v));
    setRespuestas({});
    setResultado(null);
    requestAnimationFrame(() => arribaRef.current?.scrollIntoView({ block: 'start', behavior: reducir ? 'auto' : 'smooth' }));
  };

  const validar = () => {
    const r = corregirVuelta(preguntas, respuestas);
    setResultado(r);
    setHistorial((h) => [...h, { vuelta, aciertos: r.aciertos, total: r.total }]);
    void registrarActividad({
      materia: slug,
      herramienta: 'flujos',
      aciertos: r.aciertos,
      total: r.total,
      unidad: proceso.unidad,
      detalle: proceso.id,
    });
    requestAnimationFrame(() => resultadoRef.current?.scrollIntoView({ block: 'nearest', behavior: reducir ? 'auto' : 'smooth' }));
  };

  const correccionDe = (i: number) => resultado?.detalle.find((d) => d.indice === i);

  return (
    <div ref={arribaRef} className="flex scroll-mt-20 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            Vuelta {vuelta} de {n}
          </span>
          <span className="text-muted-foreground">
            {plural(vuelta, 'paso oculto', 'pasos ocultos')} · {plural(n - vuelta, 'visible', 'visibles')}
          </span>
        </div>
        <Progress value={(vuelta / n) * 100} color={color} />
        {historial.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Resultados de vueltas anteriores">
            {historial.map((h, i) => (
              <Badge key={i} variant={h.aciertos === h.total ? 'success' : 'secondary'}>
                V{h.vuelta}: {h.aciertos}/{h.total}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <ol className="flex flex-col gap-2">
        {proceso.pasos.map((p, i) => {
          const pregunta = porIndice.get(i);
          return (
            <motion.li
              key={`${vuelta}-${i}`}
              initial={reducir ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: reducir ? 0 : Math.min(i, 8) * 0.03 }}
            >
              {pregunta ? (
                <TarjetaPregunta
                  pregunta={pregunta}
                  proceso={proceso}
                  color={color}
                  respuesta={respuestas[i] ?? {}}
                  correccion={correccionDe(i)}
                  onCambiar={(r) => setRespuestas((prev) => ({ ...prev, [i]: r }))}
                />
              ) : (
                <div className="flex min-w-0 items-start gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm">
                  <span className="mt-0.5 shrink-0 text-xs font-semibold text-muted-foreground">{i + 1}.</span>
                  <span className="min-w-0">
                    <span className="font-medium">{p.actor}</span>
                    <span className="text-muted-foreground"> — {p.accion}</span>
                  </span>
                </div>
              )}
            </motion.li>
          );
        })}
      </ol>

      <div ref={resultadoRef} className="scroll-mb-4">
        <AnimatePresence mode="wait" initial={false}>
          {resultado ? (
            <motion.div
              key="resultado"
              initial={reducir ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4"
              role="status"
            >
              <p className="text-base font-semibold">
                {resultado.aciertos}/{resultado.total} ({pct(resultado.aciertos, resultado.total)} %){' '}
                {resultado.aciertos === resultado.total ? '🎉 ¡Perfecto!' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                {vuelta < n
                  ? 'Revisá las correcciones marcadas arriba. En la próxima vuelta se oculta un paso más.'
                  : '¡Llegaste a la última vuelta: reconstruiste el proceso completo!'}
              </p>
              <div className="flex flex-wrap gap-2">
                {vuelta < n ? (
                  <Button onClick={() => irAVuelta(vuelta + 1)}>
                    <SkipForward /> Siguiente vuelta
                  </Button>
                ) : (
                  <Button onClick={() => {
                    setHistorial([]);
                    irAVuelta(1);
                  }}>
                    <RotateCcw /> Empezar de nuevo
                  </Button>
                )}
                <Button variant="outline" onClick={() => irAVuelta(vuelta)}>
                  <RotateCcw /> Repetir esta vuelta
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="validar" className="flex flex-wrap items-center gap-3" exit={{ opacity: 0 }}>
              <Button onClick={validar}>
                <Check /> Validar vuelta
              </Button>
              {faltan > 0 && (
                <span className="text-sm text-muted-foreground">
                  Te {faltan === 1 ? 'falta completar 1 paso' : `faltan completar ${faltan} pasos`}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
