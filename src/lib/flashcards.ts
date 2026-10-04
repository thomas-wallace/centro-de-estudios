import type { Datos } from '../schema';

export type TipoTarjeta = 'concepto' | 'inversa' | 'por-que' | 'relacion';

export interface Tarjeta {
  id: string;
  tipo: TipoTarjeta;
  unidad: string;
  frente: string;
  dorso: string;
  /** Texto de apoyo opcional que se muestra debajo del dorso. */
  extra?: string;
}

/**
 * Deriva las flashcards a partir del contenido:
 * concepto → definición, definición → concepto, "¿por qué importa…?" y una por relación.
 */
export function derivarTarjetas(datos: Pick<Datos, 'conceptos' | 'relaciones'>): Tarjeta[] {
  const porId = new Map(datos.conceptos.map((c) => [c.id, c]));
  const tarjetas: Tarjeta[] = [];

  for (const c of datos.conceptos) {
    tarjetas.push({
      id: `c:${c.id}:def`,
      tipo: 'concepto',
      unidad: c.unidad,
      frente: c.nombre,
      dorso: c.definicion,
      extra: c.ejemplo,
    });
    tarjetas.push({
      id: `c:${c.id}:inv`,
      tipo: 'inversa',
      unidad: c.unidad,
      frente: c.definicion,
      dorso: c.nombre,
    });
    tarjetas.push({
      id: `c:${c.id}:pq`,
      tipo: 'por-que',
      unidad: c.unidad,
      frente: `¿Por qué importa ${c.nombre}?`,
      dorso: c.por_que_importa,
    });
  }

  for (const r of datos.relaciones) {
    const o = porId.get(r.origen);
    const d = porId.get(r.destino);
    if (!o || !d) continue;
    tarjetas.push({
      id: `r:${r.origen}:${r.destino}`,
      tipo: 'relacion',
      unidad: o.unidad,
      frente: `¿Qué relación hay entre «${o.nombre}» y «${d.nombre}»?`,
      dorso: `${o.nombre} ${r.verbo} ${d.nombre}.`,
      extra: d.definicion,
    });
  }

  return tarjetas;
}
