import type { Concepto, Relacion } from '../schema';
import { mezclar, normalizar } from './texto';

/**
 * Generación de preguntas del quiz de conexiones (lógica pura, `rnd` inyectable).
 *
 * Dos tipos:
 * - "relacion": ¿qué relación hay entre X e Y? → 4 oraciones "X <verbo> Y".
 * - "comun": ¿qué concepto conecta con todos estos? → 4 conceptos.
 */

export interface DatosConexiones {
  conceptos: readonly Concepto[];
  relaciones: readonly Relacion[];
}

/** Un vecino mostrado como pista en una pregunta "comun". */
export interface PistaVecino {
  concepto: Concepto;
  verbo: string;
  /** "sale": objetivo <verbo> vecino; "entra": vecino <verbo> objetivo. */
  sentido: 'sale' | 'entra';
}

interface PreguntaBase {
  /** Clave estable para React y para evitar repetidas. */
  clave: string;
  opciones: string[];
  correcta: number;
  /** Unidad principal de la pregunta. */
  unidad: string;
  /** Conceptos evaluados (para conceptosOk / conceptosMal). */
  conceptos: string[];
}

export interface PreguntaRelacion extends PreguntaBase {
  tipo: 'relacion';
  a: Concepto;
  b: Concepto;
  /** La relación sobre la que se arma la opción correcta. */
  relacion: Relacion;
  /** Todas las relaciones reales entre a y b (en cualquier sentido), como oraciones. */
  reales: string[];
}

export interface PreguntaComun extends PreguntaBase {
  tipo: 'comun';
  objetivo: Concepto;
  pistas: PistaVecino[];
  /** Concepto de cada opción, en el mismo orden que `opciones`. */
  opcionesConceptos: Concepto[];
}

export type PreguntaConexion = PreguntaRelacion | PreguntaComun;

/** Verbos que, por su significado, valen en ambos sentidos. */
const VERBOS_SIMETRICOS = [
  /^contrasta con$/,
  /^se (diferencia|distingue|compara|relaciona|comunica|conecta|complementa|opone) (de|con|a)$/,
  /^difiere de$/,
  /^(es|son) (similar|similares|parecido|equivalente|equivalentes|opuesto|análogo|comparable|compatible|incompatible) (a|con)$/,
  /^equivale a$/,
  /^se parece a$/,
  /^compite con$/,
  /^coexiste con$/,
  /^convive con$/,
  /^interactúa con$/,
  /^complementa a$/,
  /^es el opuesto de$/,
];

export function oracion(origen: string, verbo: string, destino: string): string {
  return `${origen} ${verbo} ${destino}`;
}

/** Índice auxiliar: verbos por par ordenado y simetría observada en los datos. */
export class GrafoConexiones {
  readonly conceptos: Map<string, Concepto>;
  readonly relaciones: Relacion[];
  /** "origen|destino" → verbos */
  private readonly porPar = new Map<string, Set<string>>();
  /** id → ids de vecinos (sin repetir, ambos sentidos) */
  readonly vecinos = new Map<string, Set<string>>();
  /** id → vecinos con verbo y sentido */
  readonly detalle = new Map<string, PistaVecino[]>();
  readonly verbos: string[];
  private readonly simetricosObservados = new Set<string>();

  constructor(d: DatosConexiones) {
    this.conceptos = new Map(d.conceptos.map((c) => [c.id, c]));
    this.relaciones = d.relaciones.filter(
      (r) => r.origen !== r.destino && this.conceptos.has(r.origen) && this.conceptos.has(r.destino),
    );
    const verbos = new Set<string>();
    for (const r of this.relaciones) {
      const k = `${r.origen}|${r.destino}`;
      if (!this.porPar.has(k)) this.porPar.set(k, new Set());
      this.porPar.get(k)!.add(normalizar(r.verbo));
      verbos.add(r.verbo);
      for (const [x, y, sentido] of [
        [r.origen, r.destino, 'sale'],
        [r.destino, r.origen, 'entra'],
      ] as const) {
        if (!this.vecinos.has(x)) this.vecinos.set(x, new Set());
        this.vecinos.get(x)!.add(y);
        if (!this.detalle.has(x)) this.detalle.set(x, []);
        this.detalle.get(x)!.push({ concepto: this.conceptos.get(y)!, verbo: r.verbo, sentido });
      }
    }
    for (const r of this.relaciones) {
      if (this.porPar.get(`${r.destino}|${r.origen}`)?.has(normalizar(r.verbo))) {
        this.simetricosObservados.add(normalizar(r.verbo));
      }
    }
    // Sin duplicados por normalización (conserva la primera forma escrita).
    const vistos = new Set<string>();
    this.verbos = [...verbos].filter((v) => {
      const n = normalizar(v);
      if (vistos.has(n)) return false;
      vistos.add(n);
      return true;
    });
  }

  esSimetrico(verbo: string): boolean {
    const n = normalizar(verbo);
    if (this.simetricosObservados.has(n)) return true;
    const conTildes = verbo.trim().toLowerCase();
    return VERBOS_SIMETRICOS.some((re) => re.test(conTildes) || re.test(n));
  }

  verbosEntre(origen: string, destino: string): Set<string> {
    return this.porPar.get(`${origen}|${destino}`) ?? new Set();
  }

  /** ¿La oración "origen verbo destino" es verdadera según los datos? */
  esVerdadera(origen: string, verbo: string, destino: string): boolean {
    const n = normalizar(verbo);
    if (this.verbosEntre(origen, destino).has(n)) return true;
    return this.esSimetrico(verbo) && this.verbosEntre(destino, origen).has(n);
  }

  /** Verbos reales entre a y b en cualquier sentido. */
  esVerboReal(a: string, b: string, verbo: string): boolean {
    const n = normalizar(verbo);
    return this.verbosEntre(a, b).has(n) || this.verbosEntre(b, a).has(n);
  }

  relacionesEntre(a: string, b: string): Relacion[] {
    return this.relaciones.filter(
      (r) => (r.origen === a && r.destino === b) || (r.origen === b && r.destino === a),
    );
  }
}

function elegir<T>(xs: readonly T[], rnd: () => number): T {
  return xs[Math.floor(rnd() * xs.length)];
}

/** Arma una pregunta "¿qué relación hay entre X e Y?" a partir de una relación. */
export function preguntaRelacion(
  g: GrafoConexiones,
  r: Relacion,
  rnd: () => number = Math.random,
): PreguntaRelacion | null {
  const a = g.conceptos.get(r.origen);
  const b = g.conceptos.get(r.destino);
  if (!a || !b) return null;
  const correcta = oracion(a.nombre, r.verbo, b.nombre);
  const usadas = new Set([normalizar(correcta)]);
  const distractores: string[] = [];
  const agregar = (texto: string) => {
    const n = normalizar(texto);
    if (usadas.has(n)) return false;
    usadas.add(n);
    distractores.push(texto);
    return true;
  };

  // (1) Invertir el sentido, si el verbo no es simétrico y la inversa no es cierta.
  if (!g.esSimetrico(r.verbo) && !g.esVerdadera(b.id, r.verbo, a.id) && rnd() < 0.7) {
    agregar(oracion(b.nombre, r.verbo, a.nombre));
  }

  // (2) Otros verbos de la materia que no sean el verbo de ninguna relación entre X e Y.
  const otros = mezclar(
    g.verbos.filter((v) => !g.esVerboReal(a.id, b.id, v)),
    rnd,
  );
  for (const v of otros) {
    if (distractores.length >= 3) break;
    agregar(oracion(a.nombre, v, b.nombre));
  }

  // (3) Si faltan, inversiones de otros verbos (nunca verdaderas).
  if (distractores.length < 3) {
    for (const v of otros) {
      if (distractores.length >= 3) break;
      if (g.esSimetrico(v)) continue;
      agregar(oracion(b.nombre, v, a.nombre));
    }
  }
  if (distractores.length < 3) return null;

  const opciones = mezclar([correcta, ...distractores.slice(0, 3)], rnd);
  const reales = g.relacionesEntre(a.id, b.id).map((x) => {
    const o = g.conceptos.get(x.origen)!;
    const d = g.conceptos.get(x.destino)!;
    return oracion(o.nombre, x.verbo, d.nombre);
  });
  return {
    tipo: 'relacion',
    clave: `rel:${a.id}|${normalizar(r.verbo)}|${b.id}`,
    a,
    b,
    relacion: r,
    reales: [...new Set(reales)],
    opciones,
    correcta: opciones.indexOf(correcta),
    unidad: a.unidad,
    conceptos: [a.id, b.id],
  };
}

/** Conceptos con al menos `min` vecinos distintos. */
export function conceptosConectados(g: GrafoConexiones, min = 3): Concepto[] {
  return [...g.conceptos.values()].filter((c) => (g.vecinos.get(c.id)?.size ?? 0) >= min);
}

/** Arma una pregunta "¿qué concepto conecta con todos estos?" para `objetivo`. */
export function preguntaComun(
  g: GrafoConexiones,
  objetivo: Concepto,
  rnd: () => number = Math.random,
): PreguntaComun | null {
  const vecinosIds = [...(g.vecinos.get(objetivo.id) ?? [])];
  if (vecinosIds.length < 3) return null;
  const cantidad = rnd() < 0.5 ? 2 : 3;
  const elegidos = mezclar(vecinosIds, rnd).slice(0, cantidad);
  const elegidosSet = new Set(elegidos);

  const conectaConTodos = (c: string) => elegidos.every((v) => g.vecinos.get(c)?.has(v));
  const candidatos = [...g.conceptos.values()].filter(
    (c) => c.id !== objetivo.id && !elegidosSet.has(c.id) && !conectaConTodos(c.id),
  );
  const mismaUnidad = mezclar(
    candidatos.filter((c) => c.unidad === objetivo.unidad),
    rnd,
  );
  const otraUnidad = mezclar(
    candidatos.filter((c) => c.unidad !== objetivo.unidad),
    rnd,
  );
  const distractores: Concepto[] = [];
  const nombres = new Set([normalizar(objetivo.nombre)]);
  for (const c of [...mismaUnidad, ...otraUnidad]) {
    if (distractores.length >= 3) break;
    const n = normalizar(c.nombre);
    if (nombres.has(n)) continue;
    nombres.add(n);
    distractores.push(c);
  }
  if (distractores.length < 3) return null;

  const detalle = g.detalle.get(objetivo.id) ?? [];
  const pistas: PistaVecino[] = elegidos.map((id) => {
    const delVecino = detalle.filter((p) => p.concepto.id === id);
    return elegir(delVecino, rnd);
  });
  const opcionesConceptos = mezclar([objetivo, ...distractores], rnd);
  return {
    tipo: 'comun',
    clave: `com:${objetivo.id}|${[...elegidos].sort().join(',')}`,
    objetivo,
    pistas,
    opcionesConceptos,
    opciones: opcionesConceptos.map((c) => c.nombre),
    correcta: opcionesConceptos.indexOf(objetivo),
    unidad: objetivo.unidad,
    conceptos: [objetivo.id],
  };
}

export interface OpcionesGeneracion {
  /** "" o undefined = todas las unidades. */
  unidad?: string;
  cantidad?: number;
  rnd?: () => number;
}

/**
 * Genera un bloque de preguntas mezclando ambos tipos, sin repetir pares ni objetivos.
 * Con filtro de unidad: relaciones con al menos un extremo en la unidad y objetivos de esa unidad.
 */
export function generarBloque(d: DatosConexiones, op: OpcionesGeneracion = {}): PreguntaConexion[] {
  const { unidad, cantidad = 10, rnd = Math.random } = op;
  const g = new GrafoConexiones(d);
  const enUnidad = (id: string) => !unidad || g.conceptos.get(id)?.unidad === unidad;

  const relaciones = mezclar(
    g.relaciones.filter((r) => enUnidad(r.origen) || enUnidad(r.destino)),
    rnd,
  );
  const objetivos = mezclar(
    conceptosConectados(g).filter((c) => enUnidad(c.id)),
    rnd,
  );

  const res: PreguntaConexion[] = [];
  const pares = new Set<string>();
  const objetivosUsados = new Set<string>();
  let iRel = 0;
  let iObj = 0;

  const siguienteRelacion = (): PreguntaRelacion | null => {
    while (iRel < relaciones.length) {
      const r = relaciones[iRel++];
      const par = [r.origen, r.destino].sort().join('|');
      if (pares.has(par)) continue;
      const p = preguntaRelacion(g, r, rnd);
      if (p) {
        pares.add(par);
        return p;
      }
    }
    return null;
  };
  const siguienteComun = (): PreguntaComun | null => {
    while (iObj < objetivos.length) {
      const c = objetivos[iObj++];
      if (objetivosUsados.has(c.id)) continue;
      const p = preguntaComun(g, c, rnd);
      if (p) {
        objetivosUsados.add(c.id);
        return p;
      }
    }
    return null;
  };

  while (res.length < cantidad) {
    // Aproximadamente 60 % relación / 40 % concepto común.
    const primero = rnd() < 0.6 ? siguienteRelacion : siguienteComun;
    const segundo = primero === siguienteRelacion ? siguienteComun : siguienteRelacion;
    const p = primero() ?? segundo();
    if (!p) break;
    res.push(p);
  }
  return res;
}

/** Actualiza racha actual y mejor racha tras una respuesta. */
export function actualizarRacha(
  estado: { actual: number; mejor: number },
  acierto: boolean,
): { actual: number; mejor: number; nuevoRecord: boolean } {
  const actual = acierto ? estado.actual + 1 : 0;
  const nuevoRecord = actual > estado.mejor;
  return { actual, mejor: Math.max(estado.mejor, actual), nuevoRecord };
}
