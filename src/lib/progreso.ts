import type { Actividad, EstadoTarjeta, Simulacro } from '../db';
import type { Tarjeta } from './flashcards';
import { estaAprendida } from './repaso';

export interface ProgresoUnidad {
  unidad: string;
  conceptos: number;
  dominados: number;
  tarjetas: number;
  tarjetasVistas: number;
  /** % de acierto en simulacros (últimas 30 respuestas de la unidad), o null si no hay datos. */
  aciertoSimulacro: number | null;
  /** % de acierto en prácticas (mapa, ejercicios, tablas…), o null si no hay datos. */
  aciertoPracticas: number | null;
  /** Puntaje 0–100 que combina lo anterior. */
  puntaje: number;
  debil: boolean;
}

export interface Progreso {
  porUnidad: ProgresoUnidad[];
  conceptosDominados: number;
  conceptosTotal: number;
  pendientesHoy: number;
  nuevasDisponibles: number;
  ultimoSimulacro?: Simulacro;
}

/** Un concepto está dominado cuando sus tarjetas concepto→definición y definición→concepto están aprendidas. */
export function conceptosDominados(estados: Map<string, EstadoTarjeta>, conceptoIds: string[]): Set<string> {
  const out = new Set<string>();
  for (const id of conceptoIds) {
    if (estaAprendida(estados.get(`c:${id}:def`)?.card) && estaAprendida(estados.get(`c:${id}:inv`)?.card)) {
      out.add(id);
    }
  }
  return out;
}

export function calcularProgreso(opts: {
  unidades: { id: string }[];
  conceptos: { id: string; unidad: string }[];
  tarjetas: Tarjeta[];
  estados: EstadoTarjeta[];
  simulacros: Simulacro[];
  actividades: Actividad[];
  ahora?: number;
}): Progreso {
  const ahora = opts.ahora ?? Date.now();
  const estados = new Map(opts.estados.map((e) => [e.id, e]));
  const dominados = conceptosDominados(
    estados,
    opts.conceptos.map((c) => c.id),
  );
  const simsOrdenados = [...opts.simulacros].sort((a, b) => b.fecha - a.fecha);

  const porUnidad = opts.unidades.map((u): ProgresoUnidad => {
    const conceptosU = opts.conceptos.filter((c) => c.unidad === u.id);
    const tarjetasU = opts.tarjetas.filter((t) => t.unidad === u.id);
    const vistas = tarjetasU.filter((t) => estados.has(t.id)).length;
    const respuestas = simsOrdenados.flatMap((s) => s.respuestas.filter((r) => r.unidad === u.id)).slice(0, 30);
    const aciertoSimulacro = respuestas.length
      ? (respuestas.filter((r) => r.correcta).length / respuestas.length) * 100
      : null;
    const acts = opts.actividades.filter((a) => a.unidad === u.id && a.total > 0);
    const tot = acts.reduce((s, a) => s + a.total, 0);
    const aciertoPracticas = tot ? (acts.reduce((s, a) => s + a.aciertos, 0) / tot) * 100 : null;
    const dom = conceptosU.length ? (conceptosU.filter((c) => dominados.has(c.id)).length / conceptosU.length) * 100 : 0;

    // Promedio ponderado de los componentes con datos; el dominio de flashcards siempre cuenta.
    const partes: [number, number][] = [[dom, 0.3]];
    if (aciertoSimulacro !== null) partes.push([aciertoSimulacro, 0.45]);
    if (aciertoPracticas !== null) partes.push([aciertoPracticas, 0.25]);
    const peso = partes.reduce((s, [, w]) => s + w, 0);
    const puntaje = partes.reduce((s, [v, w]) => s + v * w, 0) / peso;
    const hayDatos = vistas > 0 || aciertoSimulacro !== null || aciertoPracticas !== null;

    return {
      unidad: u.id,
      conceptos: conceptosU.length,
      dominados: conceptosU.filter((c) => dominados.has(c.id)).length,
      tarjetas: tarjetasU.length,
      tarjetasVistas: vistas,
      aciertoSimulacro,
      aciertoPracticas,
      puntaje: Math.round(puntaje),
      debil: hayDatos && puntaje < 60,
    };
  });

  return {
    porUnidad,
    conceptosDominados: dominados.size,
    conceptosTotal: opts.conceptos.length,
    pendientesHoy: opts.estados.filter((e) => e.due <= ahora).length,
    nuevasDisponibles: opts.tarjetas.filter((t) => !estados.has(t.id)).length,
    ultimoSimulacro: simsOrdenados[0],
  };
}

export interface Recomendacion {
  titulo: string;
  detalle: string;
  herramienta: string;
  unidad?: string;
}

/** Elige qué conviene estudiar ahora a partir del progreso y del plan del día. */
export function recomendar(p: Progreso, opts: { faseHoy?: string; unidadesHoy?: string[]; nombreUnidad: (u: string) => string; diasDesdeSimulacro: number | null }): Recomendacion {
  const debiles = [...p.porUnidad].filter((u) => u.debil).sort((a, b) => a.puntaje - b.puntaje);
  if (p.pendientesHoy >= 10) {
    return {
      titulo: `Repasá ${p.pendientesHoy} flashcards pendientes`,
      detalle: 'El repaso espaciado rinde más si no se acumula. Te lleva unos minutos.',
      herramienta: 'flashcards',
    };
  }
  if (opts.faseHoy === 'medirse' || (opts.diasDesdeSimulacro !== null && opts.diasDesdeSimulacro >= 4 && p.conceptosDominados > 0)) {
    return {
      titulo: 'Hacé un simulacro',
      detalle: 'Medite con un simulacro y marcá tu seguridad en cada respuesta para detectar errores con confianza.',
      herramienta: 'simulacro',
    };
  }
  if (debiles.length) {
    const u = debiles[0];
    return {
      titulo: `Reforzá «${opts.nombreUnidad(u.unidad)}»`,
      detalle: `Es tu unidad más floja (${u.puntaje} %). Probá el mapa con huecos y después sus ejercicios.`,
      herramienta: 'mapa',
      unidad: u.unidad,
    };
  }
  const sinEmpezar = p.porUnidad.find((u) => u.tarjetasVistas === 0 && (opts.unidadesHoy ?? []).includes(u.unidad))
    ?? p.porUnidad.find((u) => u.tarjetasVistas === 0);
  if (sinEmpezar) {
    return {
      titulo: `Empezá con «${opts.nombreUnidad(sinEmpezar.unidad)}»`,
      detalle: 'Explorá su mapa conceptual y después hacé las primeras flashcards.',
      herramienta: 'mapa',
      unidad: sinEmpezar.unidad,
    };
  }
  if (p.pendientesHoy > 0) {
    return { titulo: `Repasá ${p.pendientesHoy} flashcards pendientes`, detalle: 'Mantené el ritmo del repaso espaciado.', herramienta: 'flashcards' };
  }
  return {
    titulo: 'Sumá flashcards nuevas',
    detalle: `Te quedan ${p.nuevasDisponibles} tarjetas sin ver.`,
    herramienta: 'flashcards',
  };
}
