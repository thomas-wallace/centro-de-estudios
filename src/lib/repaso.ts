import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs';

/** Estado FSRS serializable (fechas como timestamps) para guardar y exportar en JSON. */
export interface CardSerializada {
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: number;
}

const planificador = fsrs(generatorParameters({ enable_fuzz: true, request_retention: 0.9 }));

export const CALIFICACIONES: { rating: Grade; etiqueta: string; tecla: string }[] = [
  { rating: Rating.Again, etiqueta: 'Otra vez', tecla: '1' },
  { rating: Rating.Hard, etiqueta: 'Difícil', tecla: '2' },
  { rating: Rating.Good, etiqueta: 'Bien', tecla: '3' },
  { rating: Rating.Easy, etiqueta: 'Fácil', tecla: '4' },
];

export function serializar(c: Card): CardSerializada {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review?.getTime(),
  };
}

export function deserializar(c: CardSerializada): Card {
  return {
    ...c,
    due: new Date(c.due),
    last_review: c.last_review !== undefined ? new Date(c.last_review) : undefined,
  };
}

export function tarjetaNueva(ahora = new Date()): CardSerializada {
  return serializar(createEmptyCard(ahora));
}

export function calificar(c: CardSerializada | undefined, rating: Grade, ahora = new Date()): CardSerializada {
  const base = c ? deserializar(c) : createEmptyCard(ahora);
  return serializar(planificador.next(base, ahora, rating).card);
}

/** Intervalo resultante para cada calificación, para mostrar en los botones ("10 min", "3 d"…). */
export function previsualizar(c: CardSerializada | undefined, ahora = new Date()): Record<Grade, string> {
  const base = c ? deserializar(c) : createEmptyCard(ahora);
  const r = planificador.repeat(base, ahora);
  const out = {} as Record<Grade, string>;
  for (const { rating } of CALIFICACIONES) {
    out[rating] = formatearIntervalo(r[rating].card.due.getTime() - ahora.getTime());
  }
  return out;
}

export function formatearIntervalo(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} d`;
  const m = Math.round(d / 30);
  if (m < 12) return `${m} mes${m === 1 ? '' : 'es'}`;
  return `${(d / 365).toFixed(1)} años`;
}

/** Una tarjeta se considera aprendida cuando está en repaso con estabilidad de al menos 3 días. */
export function estaAprendida(c: CardSerializada | undefined): boolean {
  return !!c && c.state === State.Review && c.stability >= 3;
}

export function vence(c: CardSerializada, ahora = Date.now()): boolean {
  return c.due <= ahora;
}

export { Rating, State };
export type { Grade };
