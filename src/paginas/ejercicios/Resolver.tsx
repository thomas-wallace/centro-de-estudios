import { ArrowLeft, Check, CircleHelp, Eye, Lightbulb, RotateCcw, TriangleAlert, X } from 'lucide-react';
import { motion, useAnimate, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type FormEvent, type HTMLAttributes } from 'react';
import { EtiquetaUnidad, Fuente } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Input, Progress } from '@/components/ui/misc';
import { registrarActividad } from '@/db';
import { respuestaCorrecta } from '@/lib/respuestas';
import { cn, pct, plural } from '@/lib/utils';
import { useMateria } from '@/materia';
import type { Ejercicio, PasoEjercicio } from '@/schema';
import { TextoConFormato } from './Enunciado';

type Resultado = 'pendiente' | 'ok' | 'solucion';

interface EstadoPaso {
  resultado: Resultado;
  intentos: number;
  /** Pistas reveladas mientras se resolvía este paso. */
  pistas: number;
  entrada: string;
  /** Respuestas incorrectas ya probadas (para opciones). */
  probadas: string[];
}

const inicial = (): EstadoPaso => ({ resultado: 'pendiente', intentos: 0, pistas: 0, entrada: '', probadas: [] });

const TECLADO: Record<PasoEjercicio['tipo_respuesta'], HTMLAttributes<HTMLInputElement>['inputMode']> = {
  numero: 'decimal',
  ip: 'text',
  binario: 'text',
  texto: 'text',
  opcion: 'text',
};

const PLACEHOLDER: Record<PasoEjercicio['tipo_respuesta'], string> = {
  numero: 'Un número (coma o punto)',
  ip: 'Ej.: 192.168.1.0 o /24',
  binario: 'Ej.: 0000 1011',
  texto: 'Tu respuesta',
  opcion: '',
};

export function Resolver({ ejercicio, onVolver }: { ejercicio: Ejercicio; onVolver: () => void }) {
  const { slug } = useMateria();
  const [pasos, setPasos] = useState<EstadoPaso[]>(() => ejercicio.pasos.map(inicial));
  const [pistasVistas, setPistasVistas] = useState(0);
  const [intento, setIntento] = useState(0); // para reiniciar
  const registrado = useRef(false);

  const actual = pasos.findIndex((p) => p.resultado === 'pendiente');
  const terminado = actual === -1;

  useEffect(() => {
    if (!terminado || registrado.current) return;
    registrado.current = true;
    void registrarActividad({
      materia: slug,
      herramienta: 'ejercicios',
      aciertos: pasos.filter((p) => p.resultado === 'ok').length,
      total: pasos.length,
      unidad: ejercicio.unidad,
      detalle: ejercicio.id,
    });
  }, [terminado, pasos, slug, ejercicio]);

  const actualizar = (i: number, cambios: Partial<EstadoPaso>) =>
    setPasos((ps) => ps.map((p, j) => (j === i ? { ...p, ...cambios } : p)));

  const reiniciar = () => {
    setPasos(ejercicio.pasos.map(inicial));
    setPistasVistas(0);
    registrado.current = false;
    setIntento((n) => n + 1);
  };

  const quedanPistas = pistasVistas < ejercicio.pistas.length;
  const pedirAyuda = () => {
    if (terminado) return;
    if (quedanPistas) {
      setPistasVistas((n) => n + 1);
      actualizar(actual, { pistas: pasos[actual].pistas + 1 });
    } else {
      actualizar(actual, { resultado: 'solucion' });
    }
  };

  const hechos = pasos.filter((p) => p.resultado !== 'pendiente').length;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onVolver}>
          <ArrowLeft /> Ejercicios
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{ejercicio.tipo}</Badge>
          <EtiquetaUnidad unidad={ejercicio.unidad} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-lg font-bold tracking-tight sm:text-xl">{ejercicio.titulo}</h1>
        </CardHeader>
        <CardContent className="space-y-3">
          <TextoConFormato texto={ejercicio.enunciado} className="text-sm sm:text-base" />
          <Fuente {...ejercicio.fuente} />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Progress value={pct(hechos, pasos.length)} className="flex-1" />
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {hechos}/{pasos.length} pasos
        </span>
      </div>

      <ol className="space-y-3" aria-label="Pasos del ejercicio">
        {ejercicio.pasos.map((paso, i) => {
          if (i > actual && !terminado) return null;
          return (
            <li key={`${intento}-${i}`}>
              <Paso
                numero={i + 1}
                total={ejercicio.pasos.length}
                paso={paso}
                estado={pasos[i]}
                activo={i === actual}
                enfocar={i === actual && i > 0}
                onEntrada={(entrada) => actualizar(i, { entrada })}
                onValidar={(entrada) => {
                  if (respuestaCorrecta(paso, entrada)) {
                    actualizar(i, { resultado: 'ok', entrada });
                    return true;
                  }
                  const probadas = pasos[i].probadas.includes(entrada) ? pasos[i].probadas : [...pasos[i].probadas, entrada];
                  actualizar(i, { intentos: pasos[i].intentos + 1, probadas });
                  return false;
                }}
              />
            </li>
          );
        })}
        {!terminado && actual < ejercicio.pasos.length - 1 && (
          <li className="px-1 text-xs text-muted-foreground">
            Faltan {plural(ejercicio.pasos.length - actual - 1, 'paso')} más después de este.
          </li>
        )}
      </ol>

      {!terminado && (
        <Card className="gap-3 py-4">
          <CardContent className="space-y-3">
            {pistasVistas > 0 && (
              <ol className="space-y-2" aria-label="Pistas">
                {ejercicio.pistas.slice(0, pistasVistas).map((p, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm"
                  >
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                    <span>
                      <span className="font-medium">Pista {i + 1}:</span> {p}
                    </span>
                  </motion.li>
                ))}
              </ol>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {quedanPistas
                  ? `¿Trabado? Tenés ${plural(ejercicio.pistas.length - pistasVistas, 'pista')} disponible${ejercicio.pistas.length - pistasVistas === 1 ? '' : 's'}.`
                  : 'Ya viste todas las pistas.'}
              </p>
              <Button variant="outline" size="sm" onClick={pedirAyuda}>
                {quedanPistas ? (
                  <>
                    <Lightbulb /> Pista {pistasVistas + 1}
                  </>
                ) : (
                  <>
                    <Eye /> Ver solución del paso {actual + 1}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {terminado && <Resumen ejercicio={ejercicio} pasos={pasos} onReiniciar={reiniciar} onVolver={onVolver} />}
    </div>
  );
}

function Paso({
  numero,
  total,
  paso,
  estado,
  activo,
  enfocar,
  onEntrada,
  onValidar,
}: {
  numero: number;
  total: number;
  paso: PasoEjercicio;
  estado: EstadoPaso;
  activo: boolean;
  enfocar: boolean;
  onEntrada: (s: string) => void;
  onValidar: (s: string) => boolean;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reducir = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);
  const mono = paso.tipo_respuesta === 'ip' || paso.tipo_respuesta === 'binario';
  const idConsigna = `consigna-${numero}`;

  useEffect(() => {
    if (enfocar && paso.tipo_respuesta !== 'opcion') inputRef.current?.focus();
  }, [enfocar, paso.tipo_respuesta]);

  const validar = (e?: FormEvent) => {
    e?.preventDefault();
    if (!estado.entrada.trim()) return;
    const ok = onValidar(estado.entrada);
    setError(!ok);
    if (!ok && scope.current && !reducir) {
      void animate(scope.current, { x: [0, -7, 7, -4, 4, 0] }, { duration: 0.35 });
    }
  };

  const resuelto = estado.resultado !== 'pendiente';

  return (
    <div
      ref={scope}
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm',
        estado.resultado === 'ok' && 'border-success/50',
        estado.resultado === 'solucion' && 'border-warning/60',
        activo && error && 'border-destructive/60',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Paso {numero} de {total}
        </p>
        {estado.resultado === 'ok' && (
          <Badge variant="success">
            <Check /> {estado.intentos === 0 ? 'Correcto' : `Correcto (${plural(estado.intentos + 1, 'intento')})`}
          </Badge>
        )}
        {estado.resultado === 'solucion' && (
          <Badge variant="warning">
            <Eye /> Con solución
          </Badge>
        )}
      </div>
      <p id={idConsigna} className="mb-3 font-medium whitespace-pre-wrap">
        {paso.consigna}
      </p>

      {activo && (
        <form onSubmit={validar} className="space-y-2" aria-describedby={idConsigna}>
          {paso.tipo_respuesta === 'opcion' ? (
            <div role="radiogroup" aria-labelledby={idConsigna} className="grid gap-2 sm:grid-cols-2">
              {(paso.opciones ?? []).map((o) => {
                const elegida = estado.entrada === o;
                const fallida = estado.probadas.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={elegida}
                    disabled={fallida}
                    onClick={() => {
                      onEntrada(o);
                      setError(false);
                    }}
                    className={cn(
                      'min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                      elegida ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted',
                      fallida && 'border-destructive/40 text-muted-foreground line-through opacity-70',
                    )}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          ) : (
            <Input
              ref={inputRef}
              value={estado.entrada}
              onChange={(e) => {
                onEntrada(e.target.value);
                setError(false);
              }}
              inputMode={TECLADO[paso.tipo_respuesta]}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={PLACEHOLDER[paso.tipo_respuesta]}
              aria-labelledby={idConsigna}
              aria-invalid={error || undefined}
              className={cn('h-11', mono && 'font-mono')}
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!estado.entrada.trim()}>
              Validar
            </Button>
            <p aria-live="polite" className="text-sm">
              {error && (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <X className="size-4" aria-hidden /> No es correcto. Intentos: {estado.intentos}
                </span>
              )}
            </p>
          </div>
        </form>
      )}

      {resuelto && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2 overflow-hidden"
          aria-live="polite"
        >
          <p className="text-sm">
            <span className="text-muted-foreground">
              {estado.resultado === 'ok' ? 'Tu respuesta: ' : 'Respuesta: '}
            </span>
            <span className={cn('font-semibold', (mono || paso.tipo_respuesta === 'numero') && 'font-mono')}>
              {estado.resultado === 'ok' ? estado.entrada : paso.respuesta}
            </span>
            {estado.resultado === 'ok' && estado.entrada.trim() !== paso.respuesta && (
              <span className="text-muted-foreground"> (esperada: {paso.respuesta})</span>
            )}
          </p>
          <div
            className={cn(
              'rounded-md px-3 py-2 text-sm',
              estado.resultado === 'ok' ? 'bg-success/10' : 'bg-warning/10',
            )}
          >
            <TextoConFormato texto={paso.explicacion} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Resumen({
  ejercicio,
  pasos,
  onReiniciar,
  onVolver,
}: {
  ejercicio: Ejercicio;
  pasos: EstadoPaso[];
  onReiniciar: () => void;
  onVolver: () => void;
}) {
  const sinAyuda = pasos.filter((p) => p.resultado === 'ok' && p.pistas === 0).length;
  const conPistas = pasos.filter((p) => p.resultado === 'ok' && p.pistas > 0).length;
  const conSolucion = pasos.filter((p) => p.resultado === 'solucion').length;
  const errores = pasos.reduce((s, p) => s + p.intentos, 0);
  const perfecto = sinAyuda === pasos.length && errores === 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg" role="status">
            {perfecto ? '🎉 ¡Impecable! Lo resolviste sin ayuda.' : '✅ Ejercicio terminado'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid grid-cols-3 gap-2 text-center">
            <Dato valor={sinAyuda} etiqueta="sin ayuda" clase="text-success" />
            <Dato valor={conPistas} etiqueta="con pistas" clase="text-warning" />
            <Dato valor={conSolucion} etiqueta="con solución" clase="text-destructive" />
          </dl>
          {errores > 0 && (
            <p className="text-sm text-muted-foreground">
              <CircleHelp className="mr-1 inline size-4 align-text-bottom" aria-hidden />
              Tuviste {plural(errores, 'intento fallido', 'intentos fallidos')} en total.
            </p>
          )}
          <div>
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
              <TriangleAlert className="size-4 text-warning" aria-hidden /> Errores comunes
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {ejercicio.errores_comunes.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onReiniciar} variant="outline">
              <RotateCcw /> Resolver de nuevo
            </Button>
            <Button onClick={onVolver}>Elegir otro ejercicio</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Dato({ valor, etiqueta, clase }: { valor: number; etiqueta: string; clase: string }) {
  return (
    <div className="flex flex-col-reverse rounded-lg bg-muted px-2 py-3">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className={cn('text-2xl font-bold tabular-nums', clase)}>{valor}</dd>
    </div>
  );
}
