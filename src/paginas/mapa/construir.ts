import { useMemo } from 'react';
import { altoNodo, anchoNodo, desviosParalelos, relacionesConId, subgrafo, type RelacionId } from '@/lib/mapa';
import { useMateria } from '@/materia';
import type { Concepto } from '@/schema';
import type { AristaConceptoT, DatosArista, DatosNodo, NodoConceptoT, NodoGrupoT, NodoMapa } from './elementos';
import { marcadorArista } from './elementos';
import type { Layout } from './layout';

/** Relaciones con id estable (índice en datos.relaciones). */
export function useRelaciones(): RelacionId[] {
  const { datos } = useMateria();
  return useMemo(() => relacionesConId(datos.relaciones), [datos.relaciones]);
}

/** Subgrafo visible + entrada para ELK, para un filtro de unidad. */
export function useGrafo(unidad: string) {
  const { datos, conceptos } = useMateria();
  const relaciones = useRelaciones();
  return useMemo(() => {
    const sub = subgrafo(datos.conceptos, relaciones, unidad);
    const nodosLayout = sub.nodos.map((n) => {
      const c = conceptos.get(n.id)!;
      return { id: n.id, unidad: c.unidad, ancho: anchoNodo(c.nombre), alto: altoNodo(c.nombre) };
    });
    return { sub, nodosLayout, desvios: desviosParalelos(sub.aristas) };
  }, [datos.conceptos, relaciones, conceptos, unidad]);
}

export function nodoConcepto(c: Concepto, color: string, x: number, y: number, extra: Partial<DatosNodo> = {}): NodoConceptoT {
  return {
    id: c.id,
    type: 'concepto',
    position: { x, y },
    data: { nombre: c.nombre, color, ancho: anchoNodo(c.nombre), ...extra },
    ariaLabel: c.nombre,
  };
}

export function nodosDesdeLayout(
  layout: Layout,
  ids: { id: string; atenuado: boolean }[],
  conceptos: Map<string, Concepto>,
  color: (u: string) => string,
  nombreUnidad: (u: string) => string,
  extra: (id: string) => Partial<DatosNodo> = () => ({}),
): NodoMapa[] {
  const grupos: NodoGrupoT[] = layout.grupos.map((g) => ({
    id: `grupo:${g.unidad}`,
    type: 'grupo',
    position: { x: g.x, y: g.y },
    data: { nombre: nombreUnidad(g.unidad), color: color(g.unidad), ancho: g.ancho, alto: g.alto },
    selectable: false,
    draggable: false,
    focusable: false,
    zIndex: -1,
    style: { pointerEvents: 'none' },
  }));
  const nodos: NodoConceptoT[] = ids.map((n) => {
    const c = conceptos.get(n.id)!;
    const p = layout.posiciones.get(n.id) ?? { x: 0, y: 0 };
    return nodoConcepto(c, color(c.unidad), p.x, p.y, { atenuado: n.atenuado, ...extra(n.id) });
  });
  return [...grupos, ...nodos];
}

export function aristaConcepto(
  id: string,
  origen: string,
  destino: string,
  data: DatosArista,
  extra: Partial<AristaConceptoT> = {},
): AristaConceptoT {
  return {
    id,
    source: origen,
    target: destino,
    sourceHandle: 'out',
    targetHandle: 'in',
    type: 'concepto',
    data,
    markerEnd: marcadorArista(data.estado),
    ariaLabel: data.verbo,
    ...extra,
  };
}
