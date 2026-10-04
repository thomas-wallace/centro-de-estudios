import { ArrowRight, Check, Flame, RotateCcw, Trophy, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { EtiquetaUnidad, FiltroUnidad, PaginaEncabezado, useUnidadParam } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Progress, Vacio } from '@/components/ui/misc';
import { guardarConfig, registrarActividad } from '@/db';
import { actualizarRacha, generarBloque, oracion, type PreguntaConexion } from '@/lib/conexiones';
import { LETRAS } from '@/lib/texto';
import { cn, pct } from '@/lib/utils';
import { useMateria } from '@/materia';

const TAM_BLOQUE = 10;

interface Respuesta {
  pregunta: PreguntaConexion;
  elegida: number;
  ok: boolean;
}

export default function Conexiones() {
  const { datos, slug, config } = useMateria();
  const [unidad, setUnidad] = useUnidadParam();
  const [bloque, setBloque] = useState<PreguntaConexion[]>(() =>
    generarBloque(datos, { cantidad: TAM_BLOQUE }),
  );
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [racha, setRacha] = useState(0);
  const [mejorLocal, setMejorLocal] = useState(0);
  const [record, setRecord] = useState(false);
  const mejor = Math.max(config.mejorRacha ?? 0, mejorLocal);

  const nuevoBloque = (u = unidad) => {
    setBloque(generarBloque(datos, { unidad: u || undefined, cantidad: TAM_BLOQUE }));
    setIndice(0);
    setRespuestas([]);
  };

  const cambiarUnidad = (u: string) => {
    setUnidad(u);
    nuevoBloque(u);
  };

  const pregunta = bloque[indice] as PreguntaConexion | undefined;
  const respondida = respuestas.length > indice ? respuestas[indice] : undefined;
  const terminado = bloque.length > 0 && respuestas.length === bloque.length && indice >= bloque.length;

  const responder = (i: number) => {
    if (!pregunta || respondida) return;
    const ok = i === pregunta.correcta;
    setRespuestas((rs) => [...rs, { pregunta, elegida: i, ok }]);
    const r = actualizarRacha({ actual: racha, mejor }, ok);
    setRacha(r.actual);
    setRecord(r.nuevoRecord);
    if (r.nuevoRecord) {
      setMejorLocal(r.mejor);
      void guardarConfig(slug, { mejorRacha: r.mejor });
    }
  };

  // Registrar el bloque al terminarlo.
  const registrado = useRef<PreguntaConexion[] | null>(null);
  useEffect(() => {
    if (respuestas.length !== bloque.length || bloque.length === 0 || registrado.current === bloque) return;
    registrado.current = bloque;
    const ok = new Set<string>();
    const mal = new Set<string>();
    for (const r of respuestas) for (const c of r.pregunta.conceptos) (r.ok ? ok : mal).add(c);
    void registrarActividad({
      materia: slug,
      herramienta: 'conexiones',
      aciertos: respuestas.filter((r) => r.ok).length,
      total: respuestas.length,
      unidad: unidad || undefined,
      conceptosOk: [...ok].filter((c) => !mal.has(c)),
      conceptosMal: [...mal],
    });
  }, [respuestas, bloque, slug, unidad]);

  const aciertos = respuestas.filter((r) => r.ok).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PaginaEncabezado
        emoji="🎯"
        titulo="Conexiones"
        descripcion="¿Cómo se relacionan los conceptos? Bloques de 10 preguntas con feedback inmediato."
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FiltroUnidad valor={unidad} onChange={cambiarUnidad} className="w-full sm:w-auto" />
        <div className="flex items-center gap-2" aria-live="polite">
          <Badge variant={racha > 0 ? 'warning' : 'secondary'} className="text-sm" title="Racha actual">
            <Flame className="!size-4" aria-hidden /> Racha: {racha}
          </Badge>
          <Badge variant="secondary" className="text-sm" title="Mejor racha">
            <Trophy className="!size-4" aria-hidden /> Mejor: {mejor}
          </Badge>
        </div>
      </div>

      {bloque.length === 0 ? (
        <Vacio titulo="No hay suficientes relaciones para armar preguntas">
          Probá con otra unidad o con todas.
        </Vacio>
      ) : terminado ? (
        <ResumenBloque respuestas={respuestas} onOtro={() => nuevoBloque()} />
      ) : pregunta ? (
        <>
          <div className="mb-3 flex items-center gap-3">
            <Progress value={pct(respuestas.length, bloque.length)} className="flex-1" />
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {indice + 1}/{bloque.length} · {aciertos} ✓
            </span>
          </div>
          <TarjetaPregunta
            key={pregunta.clave + indice}
            pregunta={pregunta}
            respondida={respondida}
            record={record && !!respondida?.ok}
            onResponder={responder}
            onSiguiente={() => setIndice((i) => i + 1)}
            ultima={indice === bloque.length - 1}
          />
        </>
      ) : null}
    </div>
  );
}

function TarjetaPregunta({
  pregunta,
  respondida,
  record,
  onResponder,
  onSiguiente,
  ultima,
}: {
  pregunta: PreguntaConexion;
  respondida?: Respuesta;
  record: boolean;
  onResponder: (i: number) => void;
  onSiguiente: () => void;
  ultima: boolean;
}) {
  const { conceptos } = useMateria();
  const reducir = useReducedMotion();
  const siguienteRef = useRef<HTMLButtonElement>(null);
  const idTitulo = `preg-${pregunta.clave}`;

  useEffect(() => {
    if (respondida) siguienteRef.current?.focus();
  }, [respondida]);

  return (
    <motion.div initial={reducir ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline">{pregunta.tipo === 'relacion' ? 'Relación' : 'Concepto en común'}</Badge>
            <EtiquetaUnidad unidad={pregunta.unidad} />
          </div>
          {pregunta.tipo === 'relacion' ? (
            <CardTitle id={idTitulo} className="text-base leading-snug sm:text-lg">
              ¿Qué relación hay entre <span className="text-primary">{pregunta.a.nombre}</span> y{' '}
              <span className="text-primary">{pregunta.b.nombre}</span>?
            </CardTitle>
          ) : (
            <>
              <CardTitle id={idTitulo} className="text-base leading-snug sm:text-lg">
                ¿Qué concepto conecta con todos estos?
              </CardTitle>
              <ul className="mt-2 space-y-1.5">
                {pregunta.pistas.map((p) => (
                  <li key={p.concepto.id} className="rounded-md bg-muted px-3 py-2 text-sm">
                    <span className="font-semibold">{p.concepto.nombre}</span>
                    <span className="block text-xs text-muted-foreground">
                      {p.sentido === 'sale'
                        ? oracion('___', p.verbo, p.concepto.nombre)
                        : oracion(p.concepto.nombre, p.verbo, '___')}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div role="group" aria-labelledby={idTitulo} className="grid gap-2">
            {pregunta.opciones.map((o, i) => {
              const esCorrecta = i === pregunta.correcta;
              const elegida = respondida?.elegida === i;
              return (
                <button
                  key={o}
                  type="button"
                  disabled={!!respondida}
                  onClick={() => onResponder(i)}
                  aria-pressed={elegida}
                  className={cn(
                    'flex min-h-11 items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    !respondida && 'hover:border-primary/50 hover:bg-muted',
                    respondida && esCorrecta && 'border-success bg-success/10',
                    respondida && elegida && !esCorrecta && 'border-destructive bg-destructive/10',
                    respondida && !esCorrecta && !elegida && 'opacity-60',
                  )}
                >
                  <span
                    aria-hidden
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
                  >
                    {respondida && esCorrecta ? (
                      <Check className="size-3.5 text-success" />
                    ) : respondida && elegida ? (
                      <X className="size-3.5 text-destructive" />
                    ) : (
                      LETRAS[i]
                    )}
                  </span>
                  <span className="pt-0.5">{o}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {respondida && (
              <motion.div
                initial={reducir ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div
                  role="status"
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-sm',
                    respondida.ok ? 'bg-success/10' : 'bg-destructive/10',
                  )}
                >
                  <p className="mb-1 font-semibold">
                    {respondida.ok ? '✓ ¡Bien!' : '✗ No era esa.'}
                    {record && ' 🏆 ¡Nueva mejor racha!'}
                  </p>
                  {pregunta.tipo === 'relacion' ? (
                    <>
                      <p className="text-muted-foreground">
                        {pregunta.reales.length > 1 ? 'Las relaciones reales son:' : 'La relación real es:'}
                      </p>
                      <ul className="mt-1 list-disc pl-5 font-medium">
                        {pregunta.reales.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        Era <span className="font-semibold text-foreground">{pregunta.objetivo.nombre}</span>:
                      </p>
                      <ul className="mt-1 list-disc pl-5 font-medium">
                        {pregunta.pistas.map((p) => (
                          <li key={p.concepto.id}>
                            {p.sentido === 'sale'
                              ? oracion(pregunta.objetivo.nombre, p.verbo, p.concepto.nombre)
                              : oracion(p.concepto.nombre, p.verbo, pregunta.objetivo.nombre)}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <dl className="space-y-2 text-sm">
                  {(pregunta.tipo === 'relacion'
                    ? [pregunta.a, pregunta.b]
                    : [
                        pregunta.objetivo,
                        ...(respondida.ok ? [] : [pregunta.opcionesConceptos[respondida.elegida]]),
                      ]
                  )
                    .map((c) => conceptos.get(c.id) ?? c)
                    .map((c) => (
                      <div key={c.id}>
                        <dt className="font-semibold">{c.nombre}</dt>
                        <dd className="text-muted-foreground">{c.definicion}</dd>
                      </div>
                    ))}
                </dl>
                <Button ref={siguienteRef} onClick={onSiguiente} className="w-full sm:w-auto">
                  {ultima ? 'Ver resultado' : 'Siguiente'} <ArrowRight />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResumenBloque({ respuestas, onOtro }: { respuestas: Respuesta[]; onOtro: () => void }) {
  const aciertos = respuestas.filter((r) => r.ok).length;
  const p = pct(aciertos, respuestas.length);
  const falladas = respuestas.filter((r) => !r.ok);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg" role="status">
          {p >= 80 ? '🎉' : p >= 50 ? '👍' : '💪'} {aciertos} de {respuestas.length} correctas ({p} %)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={p} />
        {falladas.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold">Para repasar</h2>
            <ul className="space-y-1.5 text-sm">
              {falladas.map((r) => (
                <li key={r.pregunta.clave} className="rounded-md bg-muted px-3 py-2">
                  {r.pregunta.tipo === 'relacion'
                    ? r.pregunta.opciones[r.pregunta.correcta]
                    : `${r.pregunta.objetivo.nombre} conecta con ${r.pregunta.pistas.map((x) => x.concepto.nombre).join(', ')}`}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button onClick={onOtro}>
          <RotateCcw /> Otro bloque
        </Button>
      </CardContent>
    </Card>
  );
}
