import type { Comparacion, NodoTaxonomia, Proceso } from '@/schema';
import { mezclar, normalizar } from './texto';

// ── Utilidades generales ─────────────────────────────────────────

/** Quita duplicados (comparando texto normalizado), conservando el primero de cada uno. */
export function unicos(xs: readonly string[]): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const k = normalizar(x);
    if (vistos.has(k)) continue;
    vistos.add(k);
    out.push(x);
  }
  return out;
}

/** Compara dos textos ignorando mayúsculas, tildes y espacios sobrantes. */
export function mismoTexto(a: string, b: string): boolean {
  return normalizar(a) === normalizar(b);
}

/**
 * Arma las opciones de una pregunta de elección: la correcta más hasta `cantidad - 1` distractores
 * distintos de ella. Los distractores se toman en orden de preferencia: primero `cercanos`
 * (mezclados), después `lejanos` (mezclados). El resultado final se mezcla.
 */
export function armarOpciones(
  correcta: string,
  cercanos: readonly string[],
  lejanos: readonly string[] = [],
  cantidad = 4,
  rnd: () => number = Math.random,
): string[] {
  const candidatos = unicos([...mezclar(cercanos, rnd), ...mezclar(lejanos, rnd)]).filter(
    (x) => !mismoTexto(x, correcta),
  );
  return mezclar([correcta, ...candidatos.slice(0, Math.max(0, cantidad - 1))], rnd);
}

// ── Flujos: pasos que se van quitando ────────────────────────────

/** Índices de los pasos ocultos en la vuelta `k` (1-based): los últimos k pasos, en orden. */
export function pasosOcultos(totalPasos: number, vuelta: number): number[] {
  const k = Math.max(0, Math.min(totalPasos, vuelta));
  return Array.from({ length: k }, (_, i) => totalPasos - k + i);
}

export interface PreguntaPaso {
  indice: number;
  accionCorrecta: string;
  porQueCorrecto: string;
  opcionesAccion: string[];
  opcionesPorQue: string[];
}

/**
 * Genera las preguntas de una vuelta: para cada paso oculto, opciones de acción y de "¿por qué?".
 * Los distractores salen primero de otros pasos del mismo proceso y luego de otros procesos.
 */
export function preguntasVuelta(
  proceso: Proceso,
  otros: readonly Proceso[],
  vuelta: number,
  rnd: () => number = Math.random,
  cantidad = 4,
): PreguntaPaso[] {
  const ajenos = otros.filter((p) => p.id !== proceso.id);
  const accionesAjenas = ajenos.flatMap((p) => p.pasos.map((s) => s.accion));
  const porQuesAjenos = ajenos.flatMap((p) => p.pasos.map((s) => s.por_que));
  return pasosOcultos(proceso.pasos.length, vuelta).map((i) => {
    const paso = proceso.pasos[i];
    const resto = proceso.pasos.filter((_, j) => j !== i);
    return {
      indice: i,
      accionCorrecta: paso.accion,
      porQueCorrecto: paso.por_que,
      opcionesAccion: armarOpciones(
        paso.accion,
        resto.map((s) => s.accion),
        accionesAjenas,
        cantidad,
        rnd,
      ),
      opcionesPorQue: armarOpciones(
        paso.por_que,
        resto.map((s) => s.por_que),
        porQuesAjenos,
        cantidad,
        rnd,
      ),
    };
  });
}

export interface RespuestaPaso {
  accion?: string;
  porQue?: string;
}

export interface CorreccionPaso {
  indice: number;
  accionOk: boolean;
  porQueOk: boolean;
}

/** Corrige una vuelta: cada paso oculto vale 2 puntos (acción + por qué). */
export function corregirVuelta(
  preguntas: readonly PreguntaPaso[],
  respuestas: Readonly<Record<number, RespuestaPaso>>,
): { aciertos: number; total: number; detalle: CorreccionPaso[] } {
  const detalle = preguntas.map((p) => {
    const r = respuestas[p.indice] ?? {};
    return {
      indice: p.indice,
      accionOk: r.accion !== undefined && mismoTexto(r.accion, p.accionCorrecta),
      porQueOk: r.porQue !== undefined && mismoTexto(r.porQue, p.porQueCorrecto),
    };
  });
  const aciertos = detalle.reduce((n, d) => n + (d.accionOk ? 1 : 0) + (d.porQueOk ? 1 : 0), 0);
  return { aciertos, total: preguntas.length * 2, detalle };
}

// ── Tablas comparativas ──────────────────────────────────────────

/** Clave de una celda: "fila:columna". */
export const claveCelda = (fila: number, columna: number) => `${fila}:${columna}`;

/**
 * Elige al azar ~`proporcion` de las celdas de la tabla para ocultar (al menos 1 y, si la
 * tabla tiene más de una celda, nunca todas). Devuelve las claves "fila:columna".
 */
export function sortearCeldas(comp: Comparacion, proporcion = 0.35, rnd: () => number = Math.random): string[] {
  const todas: string[] = [];
  comp.filas.forEach((f, i) => f.celdas.forEach((_, j) => todas.push(claveCelda(i, j))));
  if (todas.length === 0) return [];
  const max = todas.length > 1 ? todas.length - 1 : 1;
  const n = Math.min(max, Math.max(1, Math.round(todas.length * proporcion)));
  return mezclar(todas, rnd).slice(0, n);
}

/** Valor de una celda a partir de su clave. */
export function valorCelda(comp: Comparacion, clave: string): string {
  const [f, c] = clave.split(':').map(Number);
  return comp.filas[f]?.celdas[c] ?? '';
}

/** Opciones del emparejamiento: los valores de todas las celdas ocultas, sin repetir, ordenados. */
export function opcionesTabla(comp: Comparacion, ocultas: readonly string[]): string[] {
  return unicos(ocultas.map((k) => valorCelda(comp, k))).sort((a, b) => a.localeCompare(b, 'es'));
}

/** Corrige el emparejamiento: devuelve qué celdas están bien y el puntaje. */
export function corregirTabla(
  comp: Comparacion,
  ocultas: readonly string[],
  respuestas: Readonly<Record<string, string>>,
): { aciertos: number; total: number; bien: Set<string> } {
  const bien = new Set<string>();
  for (const k of ocultas) {
    const r = respuestas[k];
    if (r !== undefined && r !== '' && mismoTexto(r, valorCelda(comp, k))) bien.add(k);
  }
  return { aciertos: bien.size, total: ocultas.length, bien };
}

// ── Sub-mapas (taxonomías) ───────────────────────────────────────

/** Ruta de un nodo como índices de hijos separados por "." ("" = raíz). */
export const rutaHijo = (ruta: string, i: number) => (ruta === '' ? String(i) : `${ruta}.${i}`);

export function nodoEnRuta(raiz: NodoTaxonomia, ruta: string): NodoTaxonomia | undefined {
  if (ruta === '') return raiz;
  let n: NodoTaxonomia | undefined = raiz;
  for (const i of ruta.split('.').map(Number)) {
    n = n?.hijos[i];
    if (!n) return undefined;
  }
  return n;
}

/** Rutas de todos los nodos que tienen hijos (los que se pueden desplegar). */
export function rutasConHijos(raiz: NodoTaxonomia): string[] {
  const out: string[] = [];
  const visitar = (n: NodoTaxonomia, ruta: string) => {
    if (n.hijos.length === 0) return;
    out.push(ruta);
    n.hijos.forEach((h, i) => visitar(h, rutaHijo(ruta, i)));
  };
  visitar(raiz, '');
  return out;
}

/** Todas las rutas que hay que expandir para que `ruta` quede visible (sus ancestros). */
export function ancestros(ruta: string): string[] {
  if (ruta === '') return [];
  const partes = ruta.split('.');
  return partes.map((_, i) => partes.slice(0, i).join('.'));
}

/** Cantidad total de nodos del árbol (incluida la raíz). */
export function contarNodos(n: NodoTaxonomia): number {
  return 1 + n.hijos.reduce((s, h) => s + contarNodos(h), 0);
}

/**
 * Elige al azar un nivel para practicar: un nodo cuyos hijos se ocultan. Prefiere nodos con
 * al menos 2 hijos; si no hay, cualquiera con hijos. Evita repetir `anterior` si hay otra opción.
 */
export function elegirNivel(raiz: NodoTaxonomia, rnd: () => number = Math.random, anterior?: string): string | null {
  const conHijos = rutasConHijos(raiz);
  if (conHijos.length === 0) return null;
  const varios = conHijos.filter((r) => (nodoEnRuta(raiz, r)?.hijos.length ?? 0) >= 2);
  let pool = varios.length > 0 ? varios : conHijos;
  if (anterior !== undefined && pool.length > 1) pool = pool.filter((r) => r !== anterior);
  return pool[Math.floor(rnd() * pool.length)] ?? pool[0];
}
