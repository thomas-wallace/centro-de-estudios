import type { Pregunta, Unidad } from '../schema';
import { mezclar } from './texto';

export interface PreguntaArmada {
  pregunta: Pregunta;
  /** orden[i] = índice original de la opción que se muestra en la posición i. */
  orden: number[];
}

/**
 * Reparte `n` preguntas entre unidades según su peso (método del mayor resto),
 * respetando las disponibles en cada unidad y completando con las demás si falta.
 */
export function repartirPorPeso(
  unidades: Pick<Unidad, 'id' | 'peso'>[],
  disponibles: Record<string, number>,
  n: number,
): Record<string, number> {
  const total = Math.min(
    n,
    unidades.reduce((s, u) => s + (disponibles[u.id] ?? 0), 0),
  );
  const pesoTotal = unidades.reduce((s, u) => s + u.peso, 0) || 1;
  const cupo: Record<string, number> = {};
  const restos: { id: string; resto: number }[] = [];
  let asignadas = 0;
  for (const u of unidades) {
    const ideal = (u.peso / pesoTotal) * total;
    const base = Math.min(Math.floor(ideal), disponibles[u.id] ?? 0);
    cupo[u.id] = base;
    asignadas += base;
    restos.push({ id: u.id, resto: ideal - Math.floor(ideal) });
  }
  restos.sort((a, b) => b.resto - a.resto);
  // Primero por mayor resto; después, cualquiera con preguntas disponibles.
  while (asignadas < total) {
    const candidato =
      restos.find((r) => cupo[r.id] < (disponibles[r.id] ?? 0) && r.resto > 0) ??
      restos.find((r) => cupo[r.id] < (disponibles[r.id] ?? 0));
    if (!candidato) break;
    cupo[candidato.id]++;
    candidato.resto = 0;
    asignadas++;
  }
  return cupo;
}

export function armarSimulacro(
  preguntas: Pregunta[],
  unidades: Pick<Unidad, 'id' | 'peso'>[],
  n: number,
  rnd: () => number = Math.random,
): PreguntaArmada[] {
  const porUnidad = new Map<string, Pregunta[]>();
  for (const p of preguntas) {
    if (!porUnidad.has(p.unidad)) porUnidad.set(p.unidad, []);
    porUnidad.get(p.unidad)!.push(p);
  }
  const disponibles = Object.fromEntries([...porUnidad].map(([u, ps]) => [u, ps.length]));
  const cupo = repartirPorPeso(unidades, disponibles, n);
  const elegidas = unidades.flatMap((u) => mezclar(porUnidad.get(u.id) ?? [], rnd).slice(0, cupo[u.id] ?? 0));
  return mezclar(elegidas, rnd).map((pregunta) => ({ pregunta, orden: mezclar([0, 1, 2, 3], rnd) }));
}

/** Arma una ronda con preguntas puntuales (p. ej. reintentar las falladas). */
export function armarConPreguntas(preguntas: Pregunta[], rnd: () => number = Math.random): PreguntaArmada[] {
  return mezclar(preguntas, rnd).map((pregunta) => ({ pregunta, orden: mezclar([0, 1, 2, 3], rnd) }));
}
