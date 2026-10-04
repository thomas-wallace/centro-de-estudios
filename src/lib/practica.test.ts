import { describe, expect, it } from 'vitest';
import type { Comparacion, NodoTaxonomia, Proceso } from '@/schema';
import {
  ancestros,
  armarOpciones,
  claveCelda,
  contarNodos,
  corregirTabla,
  corregirVuelta,
  elegirNivel,
  nodoEnRuta,
  opcionesTabla,
  pasosOcultos,
  preguntasVuelta,
  rutasConHijos,
  sortearCeldas,
  unicos,
  valorCelda,
} from './practica';
import { semilla } from './texto';

const fuente = { archivo: 'x.md', seccion: '1' };

const proc = (id: string, n: number): Proceso => ({
  id,
  nombre: id,
  unidad: 'u1',
  descripcion: 'd',
  pasos: Array.from({ length: n }, (_, i) => ({
    actor: `A${i}`,
    accion: `${id} acción ${i}`,
    por_que: `${id} motivo ${i}`,
  })),
  fuente,
});

describe('armarOpciones', () => {
  it('incluye la correcta, sin duplicados y respeta la cantidad', () => {
    const o = armarOpciones('Hola', ['hola', 'b', 'c', 'B'], ['d', 'e'], 4, semilla(1));
    expect(o).toHaveLength(4);
    expect(o).toContain('Hola');
    expect(unicos(o)).toHaveLength(4);
    expect(o.filter((x) => x.toLowerCase() === 'hola')).toHaveLength(1);
  });
  it('prefiere los cercanos antes que los lejanos', () => {
    const o = armarOpciones('x', ['a', 'b', 'c'], ['z1', 'z2'], 4, semilla(2));
    expect(o.sort()).toEqual(['a', 'b', 'c', 'x']);
  });
  it('si no hay suficientes distractores devuelve menos opciones', () => {
    expect(armarOpciones('x', ['a'], [], 4, semilla(3)).sort()).toEqual(['a', 'x']);
  });
});

describe('flujos', () => {
  it('pasosOcultos oculta los últimos k pasos', () => {
    expect(pasosOcultos(5, 1)).toEqual([4]);
    expect(pasosOcultos(5, 3)).toEqual([2, 3, 4]);
    expect(pasosOcultos(5, 9)).toEqual([0, 1, 2, 3, 4]);
    expect(pasosOcultos(5, 0)).toEqual([]);
  });

  it('preguntasVuelta arma opciones válidas para cada paso oculto', () => {
    const p = proc('p', 3);
    const otros = [p, proc('q', 4)];
    const qs = preguntasVuelta(p, otros, 2, semilla(7));
    expect(qs.map((q) => q.indice)).toEqual([1, 2]);
    for (const q of qs) {
      expect(q.opcionesAccion).toContain(q.accionCorrecta);
      expect(q.opcionesPorQue).toContain(q.porQueCorrecto);
      expect(q.opcionesAccion).toHaveLength(4);
      expect(unicos(q.opcionesAccion)).toHaveLength(4);
      // Los 2 otros pasos del mismo proceso aparecen como distractores
      expect(q.opcionesAccion.filter((o) => o.startsWith('p ')).length).toBe(3);
    }
  });

  it('corregirVuelta cuenta acción y por qué por separado', () => {
    const p = proc('p', 3);
    const qs = preguntasVuelta(p, [p], 2, semilla(1));
    const r = corregirVuelta(qs, {
      1: { accion: 'p acción 1', porQue: 'p motivo 2' },
      2: { accion: 'P ACCIÓN 2', porQue: 'p motivo 2' },
    });
    expect(r.total).toBe(4);
    expect(r.aciertos).toBe(3);
    expect(r.detalle).toEqual([
      { indice: 1, accionOk: true, porQueOk: false },
      { indice: 2, accionOk: true, porQueOk: true },
    ]);
    expect(corregirVuelta(qs, {}).aciertos).toBe(0);
  });
});

const comp: Comparacion = {
  id: 'c',
  nombre: 'c',
  unidad: 'u1',
  columnas: ['A', 'B', 'C'],
  filas: [
    { criterio: 'f1', celdas: ['x', 'y', 'x'] },
    { criterio: 'f2', celdas: ['1', '2', '3'] },
    { criterio: 'f3', celdas: ['p', 'q', 'r'] },
  ],
  fuente,
};

describe('tablas', () => {
  it('sortearCeldas oculta ~35 % sin repetir', () => {
    const o = sortearCeldas(comp, 0.35, semilla(4));
    expect(o).toHaveLength(3); // round(9 * 0.35)
    expect(new Set(o).size).toBe(3);
    for (const k of o) expect(valorCelda(comp, k)).not.toBe('');
  });
  it('siempre oculta al menos 1 y nunca todas', () => {
    expect(sortearCeldas(comp, 0, semilla(1))).toHaveLength(1);
    expect(sortearCeldas(comp, 1, semilla(1))).toHaveLength(8);
  });
  it('opcionesTabla no repite valores', () => {
    const ocultas = [claveCelda(0, 0), claveCelda(0, 2), claveCelda(1, 1)];
    expect(opcionesTabla(comp, ocultas)).toEqual(['2', 'x']);
  });
  it('corregirTabla acepta valores iguales en celdas distintas', () => {
    const ocultas = [claveCelda(0, 0), claveCelda(0, 2), claveCelda(1, 1)];
    const r = corregirTabla(comp, ocultas, { '0:0': 'x', '0:2': 'X', '1:1': 'x' });
    expect(r.aciertos).toBe(2);
    expect(r.total).toBe(3);
    expect(r.bien.has('1:1')).toBe(false);
  });
});

const arbol: NodoTaxonomia = {
  nombre: 'raíz',
  hijos: [
    { nombre: 'a', hijos: [] },
    {
      nombre: 'b',
      hijos: [
        { nombre: 'b1', hijos: [] },
        { nombre: 'b2', hijos: [{ nombre: 'b2x', hijos: [] }] },
      ],
    },
  ],
};

describe('submapas', () => {
  it('navega rutas y cuenta nodos', () => {
    expect(nodoEnRuta(arbol, '')?.nombre).toBe('raíz');
    expect(nodoEnRuta(arbol, '1.1.0')?.nombre).toBe('b2x');
    expect(nodoEnRuta(arbol, '3')).toBeUndefined();
    expect(contarNodos(arbol)).toBe(6);
    expect(rutasConHijos(arbol)).toEqual(['', '1', '1.1']);
    expect(ancestros('1.1.0')).toEqual(['', '1', '1.1']);
    expect(ancestros('')).toEqual([]);
  });
  it('elegirNivel prefiere niveles con 2+ hijos y evita repetir', () => {
    for (let s = 0; s < 20; s++) {
      const r = elegirNivel(arbol, semilla(s));
      expect(['', '1']).toContain(r);
      expect(elegirNivel(arbol, semilla(s), '1')).toBe('');
    }
    expect(elegirNivel({ nombre: 'solo', hijos: [] })).toBeNull();
  });
});
