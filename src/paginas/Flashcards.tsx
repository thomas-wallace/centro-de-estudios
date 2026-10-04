import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcwIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EtiquetaUnidad, FiltroUnidad, PaginaEncabezado, useUnidadParam } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, Progress, Vacio } from '@/components/ui/misc';
import { db, type EstadoTarjeta } from '@/db';
import type { Tarjeta, TipoTarjeta } from '@/lib/flashcards';
import { CALIFICACIONES, calificar, previsualizar, type Grade } from '@/lib/repaso';
import { mezclar } from '@/lib/texto';
import { inicioDelDia, plural } from '@/lib/utils';
import { useMateria } from '@/materia';

const TIPOS: Record<TipoTarjeta, string> = {
  concepto: 'Concepto → definición',
  inversa: 'Definición → concepto',
  'por-que': '¿Por qué importa?',
  relacion: 'Relación',
};

const COLORES_BOTON: Record<number, string> = {
  1: 'border-destructive/40 hover:bg-destructive/10',
  2: 'border-warning/50 hover:bg-warning/15',
  3: 'border-success/40 hover:bg-success/10',
  4: 'border-primary/40 hover:bg-primary/10',
};

/** Las tarjetas que vuelven en menos de este tiempo se repiten en la misma sesión. */
const REPETIR_EN_SESION_MS = 20 * 60_000;

export default function Flashcards() {
  const { slug, tarjetas, config } = useMateria();
  const [unidad, setUnidad] = useUnidadParam();
  const [cola, setCola] = useState<Tarjeta[] | null>(null);
  const [mostrar, setMostrar] = useState(false);
  const [hechas, setHechas] = useState(0);

  const estados = useLiveQuery(() => db.tarjetas.where('materia').equals(slug).toArray().catch(() => []), [slug]);
  const nuevasHoy = useLiveQuery(
    () =>
      db.revisiones
        .where('[materia+fecha]')
        .between([slug, inicioDelDia().getTime()], [slug, Date.now() + 86_400_000])
        .filter((r) => !!r.nueva)
        .count()
        .catch(() => 0),
    [slug],
  );

  const mapaEstados = useMemo(() => new Map((estados ?? []).map((e) => [e.id, e])), [estados]);
  const filtradas = useMemo(() => tarjetas.filter((t) => !unidad || t.unidad === unidad), [tarjetas, unidad]);
  const ahora = Date.now();
  const pendientes = filtradas.filter((t) => {
    const e = mapaEstados.get(t.id);
    return e && e.due <= ahora;
  });
  const nuevas = filtradas.filter((t) => !mapaEstados.has(t.id));
  const cupoNuevas = Math.max(0, config.nuevasPorDia - (nuevasHoy ?? 0));

  const empezar = () => {
    const vencidas = [...pendientes].sort((a, b) => mapaEstados.get(a.id)!.due - mapaEstados.get(b.id)!.due);
    // Las nuevas se presentan concepto por concepto (definición antes que la inversa) pero mezclando conceptos.
    const nuevasOrden = mezclar(nuevas).sort((a, b) => ordenTipo(a.tipo) - ordenTipo(b.tipo)).slice(0, cupoNuevas);
    setCola([...vencidas, ...mezclar(nuevasOrden)]);
    setHechas(0);
    setMostrar(false);
  };

  const actual = cola?.[0];
  const estadoActual = actual ? mapaEstados.get(actual.id) : undefined;
  const intervalos = useMemo(() => (actual ? previsualizar(estadoActual?.card) : null), [actual, estadoActual]);

  const responder = useCallback(
    async (rating: Grade) => {
      if (!actual || !cola) return;
      const ahora = new Date();
      const card = calificar(estadoActual?.card, rating, ahora);
      const registro: EstadoTarjeta = { materia: slug, id: actual.id, unidad: actual.unidad, card, due: card.due };
      try {
        await db.transaction('rw', db.tarjetas, db.revisiones, async () => {
          await db.tarjetas.put(registro);
          await db.revisiones.add({
            materia: slug,
            tarjeta: actual.id,
            unidad: actual.unidad,
            rating,
            fecha: ahora.getTime(),
            nueva: !estadoActual,
          });
        });
      } catch (e) {
        console.warn('No se pudo guardar la revisión', e);
      }
      const resto = cola.slice(1);
      setCola(card.due - ahora.getTime() < REPETIR_EN_SESION_MS ? [...resto, actual] : resto);
      setHechas((h) => h + 1);
      setMostrar(false);
    },
    [actual, cola, estadoActual, slug],
  );

  useEffect(() => {
    if (!actual) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (!mostrar && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setMostrar(true);
      } else if (mostrar) {
        const c = CALIFICACIONES.find((x) => x.tecla === e.key);
        if (c) responder(c.rating);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actual, mostrar, responder]);

  if (!estados) return null;

  // ── Resumen / inicio de sesión ─────────────────────────────────
  if (!cola || !actual) {
    const sesionTerminada = cola !== null;
    return (
      <div className="mx-auto max-w-2xl">
        <PaginaEncabezado
          emoji="🃏"
          titulo="Flashcards"
          descripcion="Repaso espaciado (FSRS): cada tarjeta vuelve justo antes de que la olvides."
        />
        <div className="mb-4">
          <FiltroUnidad valor={unidad} onChange={setUnidad} />
        </div>
        {sesionTerminada && hechas > 0 && (
          <Card className="mb-4 border-success/40 bg-success/5">
            <CardContent>
              <p className="font-medium">¡Sesión terminada! 🎉</p>
              <p className="text-sm text-muted-foreground">Respondiste {plural(hechas, 'tarjeta')}. Volvé más tarde para los próximos repasos.</p>
            </CardContent>
          </Card>
        )}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Contador valor={pendientes.length} etiqueta="Pendientes hoy" destacado />
          <Contador valor={Math.min(cupoNuevas, nuevas.length)} etiqueta={`Nuevas (límite ${config.nuevasPorDia}/día)`} />
          <Contador valor={filtradas.length - nuevas.length} etiqueta={`Vistas de ${filtradas.length}`} />
        </div>
        {pendientes.length + Math.min(cupoNuevas, nuevas.length) === 0 ? (
          <Vacio titulo="No hay tarjetas para hoy">
            {nuevas.length > 0
              ? 'Llegaste al límite de nuevas por día. Podés subirlo en Examen y ajustes.'
              : 'Ya viste todas las tarjetas de esta selección. ¡Volvé mañana!'}
          </Vacio>
        ) : (
          <Button size="lg" className="w-full" onClick={empezar}>
            Empezar sesión ({pendientes.length + Math.min(cupoNuevas, nuevas.length)} tarjetas)
          </Button>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Las tarjetas salen del contenido: concepto → definición, definición → concepto, «¿por qué importa?» y una por cada relación del mapa.
        </p>
      </div>
    );
  }

  // ── Tarjeta actual ─────────────────────────────────────────────
  const totalSesion = hechas + cola.length;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center gap-3">
        <Progress value={(hechas / totalSesion) * 100} />
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {hechas}/{totalSesion}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setCola(null)}>
          Salir
        </Button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={actual.id + hechas}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.18 }}
        >
          <Card className="min-h-80">
            <CardContent className="flex flex-1 flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <EtiquetaUnidad unidad={actual.unidad} />
                <div className="flex gap-1">
                  {!estadoActual && <Badge variant="warning">Nueva</Badge>}
                  <Badge variant="secondary">{TIPOS[actual.tipo]}</Badge>
                </div>
              </div>
              <p className={actual.tipo === 'inversa' ? 'text-lg leading-relaxed' : 'text-2xl font-semibold leading-snug'}>
                {actual.frente}
              </p>
              {mostrar ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t pt-4">
                  <p className={actual.tipo === 'inversa' ? 'text-2xl font-semibold' : 'text-lg leading-relaxed'}>{actual.dorso}</p>
                  {actual.extra && <p className="mt-3 text-sm text-muted-foreground">{actual.tipo === 'concepto' ? `Ejemplo: ${actual.extra}` : actual.extra}</p>}
                </motion.div>
              ) : (
                <Button size="lg" variant="secondary" className="mt-auto" onClick={() => setMostrar(true)}>
                  Mostrar respuesta <kbd className="hidden text-xs opacity-60 sm:inline">Espacio</kbd>
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
      {mostrar && intervalos && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CALIFICACIONES.map((c) => (
            <Button
              key={c.rating}
              variant="outline"
              className={`h-auto flex-col gap-0.5 py-2 ${COLORES_BOTON[c.rating]}`}
              onClick={() => responder(c.rating)}
            >
              <span className="font-semibold">{c.etiqueta}</span>
              <span className="text-xs text-muted-foreground">
                {intervalos[c.rating]} <span className="hidden sm:inline">· {c.tecla}</span>
              </span>
            </Button>
          ))}
        </div>
      )}
      <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <RotateCcwIcon className="size-3" /> Las tarjetas que marcás «Otra vez» vuelven en esta misma sesión.
      </p>
    </div>
  );
}

function ordenTipo(t: TipoTarjeta) {
  return { concepto: 0, inversa: 1, 'por-que': 2, relacion: 3 }[t];
}

function Contador({ valor, etiqueta, destacado }: { valor: number; etiqueta: string; destacado?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${destacado ? 'border-primary/40 bg-primary/5' : 'bg-card'}`}>
      <div className="text-2xl font-bold tabular-nums">{valor}</div>
      <div className="text-xs text-muted-foreground">{etiqueta}</div>
    </div>
  );
}
