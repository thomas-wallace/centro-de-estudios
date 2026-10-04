import type { Concepto, Relacion } from '@/schema';
import { mezclar, normalizar } from './texto';

/** Lógica pura del mapa conceptual (sin React ni ELK) para poder testearla. */

export interface RelacionId extends Relacion {
  id: string;
}

/** Arista dibujada por el estudiante en el modo "Reconstruir". */
export interface AristaUsuario {
  id: string;
  origen: string;
  destino: string;
  verbo: string;
}

// ── Medidas de los nodos (las usa ELK y el render, así coinciden) ────────────

export function anchoNodo(nombre: string): number {
  return Math.round(Math.min(200, Math.max(116, nombre.length * 7.2 + 32)));
}

export function altoNodo(nombre: string): number {
  // Estimación: ~22 caracteres por línea al ancho máximo.
  return nombre.length > 24 ? 60 : 44;
}

// ── Subgrafos ────────────────────────────────────────────────────────────────

export function relacionesConId(relaciones: readonly Relacion[]): RelacionId[] {
  return relaciones.map((r, i) => ({ ...r, id: `r${i}` }));
}

export interface NodoSub {
  id: string;
  /** Vecino directo de otra unidad (se muestra atenuado). */
  atenuado: boolean;
}

/**
 * Conceptos y relaciones visibles para un filtro de unidad.
 * - `unidad === ''`: todo el mapa.
 * - Si no: los conceptos de la unidad, sus vecinos directos de otras unidades (atenuados)
 *   y solo las relaciones que tocan a la unidad.
 */
export function subgrafo(
  conceptos: readonly Concepto[],
  relaciones: readonly RelacionId[],
  unidad: string,
): { nodos: NodoSub[]; aristas: RelacionId[] } {
  const existe = new Set(conceptos.map((c) => c.id));
  const validas = relaciones.filter((r) => existe.has(r.origen) && existe.has(r.destino));
  if (!unidad) return { nodos: conceptos.map((c) => ({ id: c.id, atenuado: false })), aristas: validas };

  const propios = new Set(conceptos.filter((c) => c.unidad === unidad).map((c) => c.id));
  const aristas = validas.filter((r) => propios.has(r.origen) || propios.has(r.destino));
  const vecinos = new Set<string>();
  for (const r of aristas) {
    if (!propios.has(r.origen)) vecinos.add(r.origen);
    if (!propios.has(r.destino)) vecinos.add(r.destino);
  }
  const nodos: NodoSub[] = conceptos
    .filter((c) => propios.has(c.id) || vecinos.has(c.id))
    .map((c) => ({ id: c.id, atenuado: !propios.has(c.id) }));
  return { nodos, aristas };
}

/** Relaciones cuyos dos extremos pertenecen a la unidad. */
export function relacionesInternas(
  conceptos: readonly Concepto[],
  relaciones: readonly RelacionId[],
  unidad: string,
): RelacionId[] {
  const propios = new Set(conceptos.filter((c) => c.unidad === unidad).map((c) => c.id));
  return relaciones.filter((r) => propios.has(r.origen) && propios.has(r.destino));
}

/** Verbos distintos usados en la materia, ordenados alfabéticamente. */
export function verbosDeLaMateria(relaciones: readonly Relacion[]): string[] {
  const vistos = new Map<string, string>();
  for (const r of relaciones) {
    const k = normalizar(r.verbo);
    if (!vistos.has(k)) vistos.set(k, r.verbo.trim());
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

// ── Huecos ───────────────────────────────────────────────────────────────────

/** Cuántos huecos poner sobre `n` elementos: entre 20 % y 40 % (al menos 1 si hay elementos). */
export function cantidadHuecos(n: number, rnd: () => number = Math.random, min = 0.2, max = 0.4): number {
  if (n <= 0) return 0;
  const lo = Math.max(1, Math.ceil(n * min));
  const hi = Math.max(lo, Math.floor(n * max));
  return Math.min(n, lo + Math.floor(rnd() * (hi - lo + 1)));
}

/** Elige al azar entre el 20 % y el 40 % de los elementos. */
export function elegirHuecos<T>(items: readonly T[], rnd: () => number = Math.random, min = 0.2, max = 0.4): T[] {
  return mezclar(items, rnd).slice(0, cantidadHuecos(items.length, rnd, min, max));
}

/**
 * Opciones de respuesta: la correcta más distractores, primero de `primarios`
 * (p. ej. misma unidad) y si no alcanzan, de `secundarios`. Sin repetidos (normalizados).
 */
export function opcionesConDistractores(
  correcta: string,
  primarios: readonly string[],
  secundarios: readonly string[] = [],
  rnd: () => number = Math.random,
  n = 4,
): string[] {
  const usados = new Set([normalizar(correcta)]);
  const elegidos: string[] = [];
  for (const grupo of [mezclar(primarios, rnd), mezclar(secundarios, rnd)]) {
    for (const o of grupo) {
      if (elegidos.length >= n - 1) break;
      const k = normalizar(o);
      if (!k || usados.has(k)) continue;
      usados.add(k);
      elegidos.push(o);
    }
  }
  return mezclar([correcta, ...elegidos], rnd);
}

/** Formas aceptadas de un nombre: completo, sin el paréntesis y el contenido del paréntesis (sigla). */
export function variantesNombre(nombre: string): string[] {
  const v = new Set([normalizar(nombre)]);
  const m = nombre.match(/^(.*?)\s*\(([^)]+)\)\s*(.*)$/);
  if (m) {
    v.add(normalizar(`${m[1]} ${m[3]}`));
    v.add(normalizar(m[2]));
  }
  v.delete('');
  return [...v];
}

export function esRespuestaCorrecta(respuesta: string, correcta: string, tipo: 'concepto' | 'relacion'): boolean {
  const r = normalizar(respuesta);
  if (!r) return false;
  if (tipo === 'relacion') return r === normalizar(correcta);
  return variantesNombre(correcta).includes(r);
}

// ── Reconstrucción ───────────────────────────────────────────────────────────

export interface AciertoReconstruccion {
  usuario: AristaUsuario;
  real: RelacionId;
  /** Mismo sentido y mismo verbo (normalizado). */
  verboOk: boolean;
  sentidoOk: boolean;
}

export interface ResultadoReconstruccion {
  aciertos: AciertoReconstruccion[];
  faltantes: RelacionId[];
  deMas: AristaUsuario[];
  /** 1 punto por par correcto + 1 extra si el verbo (y el sentido) es correcto. */
  puntos: number;
  maximo: number;
}

const clavePar = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/**
 * Compara las aristas del estudiante con las relaciones reales.
 * Un par de conceptos es correcto sin importar el sentido; el punto extra exige
 * mismo sentido y mismo verbo. Cada relación real se empareja con una sola arista.
 */
export function compararReconstruccion(
  usuario: readonly AristaUsuario[],
  reales: readonly RelacionId[],
): ResultadoReconstruccion {
  const libres = new Map<string, RelacionId[]>();
  for (const r of reales) {
    const k = clavePar(r.origen, r.destino);
    if (!libres.has(k)) libres.set(k, []);
    libres.get(k)!.push(r);
  }
  const emparejada = new Map<string, AciertoReconstruccion>();
  const tomar = (u: AristaUsuario, criterio: (r: RelacionId) => boolean) => {
    const lista = libres.get(clavePar(u.origen, u.destino));
    const i = lista?.findIndex(criterio) ?? -1;
    if (!lista || i < 0) return false;
    const [real] = lista.splice(i, 1);
    const sentidoOk = real.origen === u.origen && real.destino === u.destino;
    emparejada.set(u.id, { usuario: u, real, sentidoOk, verboOk: sentidoOk && normalizar(real.verbo) === normalizar(u.verbo) });
    return true;
  };
  // 1) coincidencias exactas, 2) mismo sentido, 3) cualquier relación del par.
  const pasadas: ((u: AristaUsuario) => (r: RelacionId) => boolean)[] = [
    (u) => (r) => r.origen === u.origen && r.destino === u.destino && normalizar(r.verbo) === normalizar(u.verbo),
    (u) => (r) => r.origen === u.origen && r.destino === u.destino,
    () => () => true,
  ];
  for (const p of pasadas) {
    for (const u of usuario) if (!emparejada.has(u.id)) tomar(u, p(u));
  }
  const aciertos = usuario.filter((u) => emparejada.has(u.id)).map((u) => emparejada.get(u.id)!);
  const deMas = usuario.filter((u) => !emparejada.has(u.id));
  const faltantes = [...libres.values()].flat();
  const puntos = aciertos.length + aciertos.filter((a) => a.verboOk).length;
  return { aciertos, faltantes, deMas, puntos, maximo: reales.length * 2 };
}

// ── Geometría ────────────────────────────────────────────────────────────────

export interface Punto {
  x: number;
  y: number;
}

/** Posiciones en una grilla con orden aleatorio y un poco de desorden. */
export function grillaAleatoria(
  ids: readonly string[],
  rnd: () => number = Math.random,
  { ancho = 240, alto = 120, jitter = 24, columnas }: { ancho?: number; alto?: number; jitter?: number; columnas?: number } = {},
): Map<string, Punto> {
  const orden = mezclar(ids, rnd);
  const cols = columnas ?? Math.max(2, Math.ceil(Math.sqrt(orden.length * 1.4)));
  const pos = new Map<string, Punto>();
  orden.forEach((id, i) => {
    pos.set(id, {
      x: (i % cols) * ancho + Math.round((rnd() - 0.5) * jitter),
      y: Math.floor(i / cols) * alto + Math.round((rnd() - 0.5) * jitter),
    });
  });
  return pos;
}

export interface Rect {
  id: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** Separa rectángulos superpuestos (con un margen) empujándolos por el eje de menor solapamiento. */
export function despegar(rects: Rect[], margen = 24, iteraciones = 120): Rect[] {
  const r = rects.map((x) => ({ ...x }));
  for (let it = 0; it < iteraciones; it++) {
    let movio = false;
    for (let i = 0; i < r.length; i++) {
      for (let j = i + 1; j < r.length; j++) {
        const a = r[i];
        const b = r[j];
        const dx = a.x + a.ancho / 2 - (b.x + b.ancho / 2);
        const dy = a.y + a.alto / 2 - (b.y + b.alto / 2);
        const ox = (a.ancho + b.ancho) / 2 + margen - Math.abs(dx);
        const oy = (a.alto + b.alto) / 2 + margen - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        movio = true;
        if (ox < oy) {
          const s = ((dx >= 0 ? 1 : -1) * ox) / 2;
          a.x += s;
          b.x -= s;
        } else {
          const s = ((dy >= 0 ? 1 : -1) * oy) / 2;
          a.y += s;
          b.y -= s;
        }
      }
    }
    if (!movio) break;
  }
  return r;
}

/**
 * Desvío para aristas paralelas entre el mismo par de conceptos (0 = recta).
 * El signo es relativo al sentido de cada arista, así dos aristas opuestas no se pisan.
 */
export function desviosParalelos(aristas: readonly { id: string; origen: string; destino: string }[]): Map<string, number> {
  const grupos = new Map<string, { id: string; invertida: boolean }[]>();
  for (const a of aristas) {
    const k = clavePar(a.origen, a.destino);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push({ id: a.id, invertida: a.origen > a.destino });
  }
  const res = new Map<string, number>();
  for (const g of grupos.values()) {
    g.forEach((a, i) => {
      const d = i - (g.length - 1) / 2;
      res.set(a.id, a.invertida ? -d : d);
    });
  }
  return res;
}
