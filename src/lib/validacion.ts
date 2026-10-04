import { DatosSchema, type Datos } from '../schema';
import { derivarTarjetas } from './flashcards';
import { respuestaCorrecta } from './respuestas';
import { LETRAS } from './texto';

export interface FilaCobertura {
  unidad: string;
  nombre: string;
  peso: number;
  conceptos: number;
  preguntas: number;
  tarjetas: number;
  pctConceptos: number;
  pctPreguntas: number;
  pctTarjetas: number;
}

export interface ResultadoValidacion {
  ok: boolean;
  errores: string[];
  advertencias: string[];
  cobertura: FilaCobertura[];
  distribucionLetras: Record<string, number>;
  pctCorrectaMasLarga: number;
  datos?: Datos;
}

export interface OpcionesValidacion {
  /**
   * Modo parcial: valida un fragmento de una materia (por ejemplo, una unidad).
   * Omite los controles globales de cobertura por peso.
   */
  parcial?: boolean;
  /** Ids de conceptos que existen fuera del fragmento (para relaciones entre unidades). */
  conceptosExternos?: Set<string>;
}

const LIMITE_LETRA = 0.35;
const LIMITE_MAS_LARGA = 0.4;
/** Una unidad debe tener al menos esta fracción de su peso esperado en cada tipo de elemento. */
const MIN_PROPORCION = 0.5;

export function validarDatos(json: unknown, opciones: OpcionesValidacion = {}): ResultadoValidacion {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const vacio: ResultadoValidacion = {
    ok: false,
    errores,
    advertencias,
    cobertura: [],
    distribucionLetras: {},
    pctCorrectaMasLarga: 0,
  };

  const parsed = DatosSchema.safeParse(json);
  if (!parsed.success) {
    for (const issue of parsed.error.issues.slice(0, 50)) {
      errores.push(`Esquema: ${issue.path.join('.') || '(raíz)'} → ${issue.message}`);
    }
    if (parsed.error.issues.length > 50) {
      errores.push(`… y ${parsed.error.issues.length - 50} errores de esquema más`);
    }
    return vacio;
  }
  const d = parsed.data;

  // ── Ids duplicados ──────────────────────────────────────────────
  const revisarDuplicados = (nombre: string, ids: string[]) => {
    const vistos = new Set<string>();
    for (const i of ids) {
      if (vistos.has(i)) errores.push(`Id duplicado en ${nombre}: "${i}"`);
      vistos.add(i);
    }
  };
  revisarDuplicados('unidades', d.unidades.map((u) => u.id));
  revisarDuplicados('conceptos', d.conceptos.map((c) => c.id));
  revisarDuplicados('taxonomias', d.taxonomias.map((t) => t.id));
  revisarDuplicados('procesos', d.procesos.map((p) => p.id));
  revisarDuplicados('comparaciones', d.comparaciones.map((c) => c.id));
  revisarDuplicados('ejercicios', d.ejercicios.map((e) => e.id));
  revisarDuplicados('preguntas', d.preguntas.map((p) => p.id));
  revisarDuplicados('glosario', d.glosario.map((g) => g.termino.toLowerCase()));

  // ── Referencias a unidades ─────────────────────────────────────
  const unidades = new Set(d.unidades.map((u) => u.id));
  const revisarUnidad = (donde: string, u: string) => {
    if (!unidades.has(u)) errores.push(`${donde} apunta a la unidad inexistente "${u}"`);
  };
  d.conceptos.forEach((c) => revisarUnidad(`Concepto "${c.id}"`, c.unidad));
  d.taxonomias.forEach((t) => revisarUnidad(`Taxonomía "${t.id}"`, t.unidad));
  d.procesos.forEach((p) => revisarUnidad(`Proceso "${p.id}"`, p.unidad));
  d.comparaciones.forEach((c) => revisarUnidad(`Comparación "${c.id}"`, c.unidad));
  d.ejercicios.forEach((e) => revisarUnidad(`Ejercicio "${e.id}"`, e.unidad));
  d.preguntas.forEach((p) => revisarUnidad(`Pregunta "${p.id}"`, p.unidad));
  d.glosario.forEach((g) => revisarUnidad(`Glosario "${g.termino}"`, g.unidad));

  if (!opciones.parcial) {
    const suma = d.unidades.reduce((s, u) => s + u.peso, 0);
    if (Math.abs(suma - 100) > 0.5) errores.push(`Los pesos de las unidades suman ${suma}, deberían sumar 100`);
  }

  // ── Relaciones ─────────────────────────────────────────────────
  const conceptos = new Set(d.conceptos.map((c) => c.id));
  const existe = (i: string) => conceptos.has(i) || (opciones.conceptosExternos?.has(i) ?? false);
  const conectados = new Set<string>();
  const paresVistos = new Set<string>();
  for (const r of d.relaciones) {
    if (!existe(r.origen)) errores.push(`Relación con origen inexistente: "${r.origen}" (${r.verbo} → ${r.destino})`);
    if (!existe(r.destino)) errores.push(`Relación con destino inexistente: "${r.destino}" (${r.origen} ${r.verbo} →)`);
    if (r.origen === r.destino) errores.push(`Relación de un concepto consigo mismo: "${r.origen}"`);
    const par = [r.origen, r.destino].sort().join('|');
    if (paresVistos.has(par)) advertencias.push(`Hay más de una relación entre "${r.origen}" y "${r.destino}"`);
    paresVistos.add(par);
    conectados.add(r.origen);
    conectados.add(r.destino);
  }
  for (const c of d.conceptos) {
    if (!conectados.has(c.id)) errores.push(`Concepto aislado (sin relaciones): "${c.id}"`);
  }
  if (!opciones.parcial) {
    const unidadDe = new Map(d.conceptos.map((c) => [c.id, c.unidad]));
    const entreUnidades = d.relaciones.filter((r) => unidadDe.get(r.origen) !== unidadDe.get(r.destino)).length;
    if (d.unidades.length > 1 && entreUnidades === 0) {
      errores.push('No hay relaciones entre unidades distintas');
    }
  }

  // ── Ejercicios ─────────────────────────────────────────────────
  for (const e of d.ejercicios) {
    e.pasos.forEach((p, i) => {
      if (p.tipo_respuesta === 'opcion') {
        if (!p.opciones || p.opciones.length < 2) {
          errores.push(`Ejercicio "${e.id}", paso ${i + 1}: tipo "opcion" sin opciones`);
        } else if (!p.opciones.includes(p.respuesta)) {
          errores.push(`Ejercicio "${e.id}", paso ${i + 1}: la respuesta no está entre las opciones`);
        }
      }
      if (!respuestaCorrecta(p, p.respuesta)) {
        errores.push(`Ejercicio "${e.id}", paso ${i + 1}: la respuesta canónica no pasa su propio validador ("${p.respuesta}")`);
      }
    });
  }

  // ── Preguntas: reparto de letras y largo de la correcta ─────────
  const distribucionLetras: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let masLarga = 0;
  for (const p of d.preguntas) {
    distribucionLetras[LETRAS[p.correcta]]++;
    const largos = p.opciones.map((o) => o.length);
    const max = Math.max(...largos);
    const correctaEsLaMasLarga = largos[p.correcta] === max && largos.filter((l) => l === max).length === 1;
    if (correctaEsLaMasLarga) masLarga++;
  }
  const n = d.preguntas.length;
  if (n > 0) {
    for (const l of LETRAS) {
      const pct = distribucionLetras[l] / n;
      if (pct > LIMITE_LETRA) {
        errores.push(`La letra ${l} es la correcta en el ${(pct * 100).toFixed(1)} % de las preguntas (máx. 35 %)`);
      }
    }
    if (masLarga / n > LIMITE_MAS_LARGA) {
      errores.push(
        `La opción correcta es la más larga en el ${((masLarga / n) * 100).toFixed(1)} % de las preguntas (máx. 40 %)`,
      );
    }
  }

  // ── Cobertura por unidad ───────────────────────────────────────
  const tarjetas = derivarTarjetas(d);
  const totC = d.conceptos.length || 1;
  const totP = d.preguntas.length || 1;
  const totT = tarjetas.length || 1;
  const cobertura: FilaCobertura[] = d.unidades.map((u) => {
    const conceptosU = d.conceptos.filter((c) => c.unidad === u.id).length;
    const preguntasU = d.preguntas.filter((p) => p.unidad === u.id).length;
    const tarjetasU = tarjetas.filter((t) => t.unidad === u.id).length;
    return {
      unidad: u.id,
      nombre: u.nombre,
      peso: u.peso,
      conceptos: conceptosU,
      preguntas: preguntasU,
      tarjetas: tarjetasU,
      pctConceptos: (conceptosU / totC) * 100,
      pctPreguntas: (preguntasU / totP) * 100,
      pctTarjetas: (tarjetasU / totT) * 100,
    };
  });

  if (!opciones.parcial) {
    for (const f of cobertura) {
      if (f.conceptos === 0) errores.push(`La unidad "${f.unidad}" no tiene conceptos`);
      if (f.preguntas === 0) errores.push(`La unidad "${f.unidad}" no tiene preguntas`);
      if (f.tarjetas === 0) errores.push(`La unidad "${f.unidad}" no tiene flashcards`);
      const chequear = (tipo: string, pct: number) => {
        if (f.peso > 0 && pct < f.peso * MIN_PROPORCION) {
          errores.push(
            `La unidad "${f.unidad}" tiene ${pct.toFixed(1)} % de los ${tipo} y pesa ${f.peso} % (mínimo ${(f.peso * MIN_PROPORCION).toFixed(1)} %)`,
          );
        } else if (f.peso > 0 && pct > f.peso * 2) {
          advertencias.push(`La unidad "${f.unidad}" tiene ${pct.toFixed(1)} % de los ${tipo} y pesa ${f.peso} % (sobrerrepresentada)`);
        }
      };
      chequear('conceptos', f.pctConceptos);
      chequear('preguntas', f.pctPreguntas);
      chequear('flashcards', f.pctTarjetas);
    }
  }

  return {
    ok: errores.length === 0,
    errores,
    advertencias,
    cobertura,
    distribucionLetras,
    pctCorrectaMasLarga: n ? (masLarga / n) * 100 : 0,
    datos: d,
  };
}
