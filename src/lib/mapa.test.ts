import { describe, expect, it } from 'vitest';
import type { Concepto } from '@/schema';
import {
  cantidadHuecos,
  compararReconstruccion,
  despegar,
  desviosParalelos,
  elegirHuecos,
  esRespuestaCorrecta,
  grillaAleatoria,
  opcionesConDistractores,
  relacionesConId,
  relacionesInternas,
  subgrafo,
  variantesNombre,
  verbosDeLaMateria,
  type AristaUsuario,
} from './mapa';
import { normalizar, semilla } from './texto';

const fuente = { archivo: 'a.md', seccion: 's' };
const concepto = (id: string, unidad: string, nombre = id): Concepto => ({
  id,
  nombre,
  unidad,
  definicion: 'd',
  definicion_extendida: 'de',
  ejemplo: 'e',
  por_que_importa: 'p',
  fuente,
});

const conceptos = [concepto('a', 'u1'), concepto('b', 'u1'), concepto('c', 'u1'), concepto('x', 'u2'), concepto('y', 'u2')];
const relaciones = relacionesConId([
  { origen: 'a', destino: 'b', verbo: 'es un tipo de', fuente },
  { origen: 'b', destino: 'c', verbo: 'usa', fuente },
  { origen: 'c', destino: 'x', verbo: 'contrasta con', fuente },
  { origen: 'x', destino: 'y', verbo: 'Usa', fuente },
]);

describe('subgrafo', () => {
  it('sin unidad devuelve todo', () => {
    const s = subgrafo(conceptos, relaciones, '');
    expect(s.nodos).toHaveLength(5);
    expect(s.aristas).toHaveLength(4);
    expect(s.nodos.every((n) => !n.atenuado)).toBe(true);
  });

  it('con unidad incluye vecinos directos atenuados y solo aristas que tocan la unidad', () => {
    const s = subgrafo(conceptos, relaciones, 'u1');
    expect(s.nodos.map((n) => n.id).sort()).toEqual(['a', 'b', 'c', 'x']);
    expect(s.nodos.find((n) => n.id === 'x')?.atenuado).toBe(true);
    expect(s.aristas.map((r) => r.id)).toEqual(['r0', 'r1', 'r2']);
  });

  it('relaciones internas excluye las que cruzan de unidad', () => {
    expect(relacionesInternas(conceptos, relaciones, 'u1').map((r) => r.id)).toEqual(['r0', 'r1']);
  });

  it('verbos sin repetidos (normalizados) y ordenados', () => {
    expect(verbosDeLaMateria(relaciones)).toEqual(['contrasta con', 'es un tipo de', 'usa']);
  });
});

describe('selección de huecos', () => {
  it('siempre queda entre 20 % y 40 % (mínimo 1)', () => {
    for (const n of [1, 2, 3, 5, 10, 15, 24, 140]) {
      for (let s = 0; s < 50; s++) {
        const k = cantidadHuecos(n, semilla(s));
        expect(k).toBeGreaterThanOrEqual(1);
        expect(k).toBeLessThanOrEqual(n);
        if (n >= 5) {
          expect(k).toBeGreaterThanOrEqual(Math.ceil(n * 0.2));
          expect(k).toBeLessThanOrEqual(Math.floor(n * 0.4));
        }
      }
    }
    expect(cantidadHuecos(0)).toBe(0);
  });

  it('elige elementos distintos del conjunto y es determinístico con semilla', () => {
    const items = Array.from({ length: 20 }, (_, i) => `c${i}`);
    const h1 = elegirHuecos(items, semilla(7));
    const h2 = elegirHuecos(items, semilla(7));
    expect(h1).toEqual(h2);
    expect(new Set(h1).size).toBe(h1.length);
    expect(h1.every((h) => items.includes(h))).toBe(true);
    expect(h1.length).toBeGreaterThanOrEqual(4);
    expect(h1.length).toBeLessThanOrEqual(8);
  });

  it('opciones: 4, sin repetidos, incluye la correcta y prioriza la misma unidad', () => {
    const ops = opcionesConDistractores('Switch', ['switch', 'Hub', 'Router', 'Bridge', 'Hub'], ['Otro'], semilla(1));
    expect(ops).toHaveLength(4);
    expect(ops).toContain('Switch');
    expect(new Set(ops.map(normalizar)).size).toBe(4);
    expect(ops).not.toContain('Otro');
  });

  it('opciones: completa con secundarios si faltan', () => {
    const ops = opcionesConDistractores('A', ['B'], ['C', 'D', 'E'], semilla(3));
    expect(ops).toHaveLength(4);
    expect(ops).toContain('B');
  });

  it('acepta respuestas sin tildes, mayúsculas ni el paréntesis', () => {
    expect(variantesNombre('Unidad astronómica (UA)')).toEqual(['unidad astronomica (ua)', 'unidad astronomica', 'ua']);
    expect(esRespuestaCorrecta('  unidad ASTRONOMICA ', 'Unidad astronómica (UA)', 'concepto')).toBe(true);
    expect(esRespuestaCorrecta('ua', 'Unidad astronómica (UA)', 'concepto')).toBe(true);
    expect(esRespuestaCorrecta('unidad', 'Unidad astronómica (UA)', 'concepto')).toBe(false);
    expect(esRespuestaCorrecta('Es un tipo de', 'es un tipo de', 'relacion')).toBe(true);
    expect(esRespuestaCorrecta('', 'usa', 'relacion')).toBe(false);
  });
});

describe('compararReconstruccion', () => {
  const reales = relacionesInternas(conceptos, relaciones, 'u1'); // a→b "es un tipo de", b→c "usa"
  const u = (id: string, origen: string, destino: string, verbo: string): AristaUsuario => ({ id, origen, destino, verbo });

  it('todo correcto da el máximo', () => {
    const r = compararReconstruccion([u('1', 'a', 'b', 'Es un tipo de'), u('2', 'b', 'c', 'usa')], reales);
    expect(r.aciertos).toHaveLength(2);
    expect(r.aciertos.every((a) => a.verboOk)).toBe(true);
    expect(r.faltantes).toHaveLength(0);
    expect(r.deMas).toHaveLength(0);
    expect(r.puntos).toBe(4);
    expect(r.maximo).toBe(4);
  });

  it('par correcto con verbo incorrecto o sentido invertido suma solo el par', () => {
    const r = compararReconstruccion([u('1', 'a', 'b', 'usa'), u('2', 'c', 'b', 'usa')], reales);
    expect(r.aciertos).toHaveLength(2);
    expect(r.aciertos.filter((a) => a.verboOk)).toHaveLength(0);
    expect(r.aciertos.find((a) => a.usuario.id === '2')?.sentidoOk).toBe(false);
    expect(r.puntos).toBe(2);
  });

  it('detecta faltantes y relaciones de más, y no empareja dos veces la misma relación', () => {
    const r = compararReconstruccion([u('1', 'a', 'b', 'usa'), u('2', 'a', 'b', 'es un tipo de'), u('3', 'a', 'c', 'usa')], reales);
    expect(r.aciertos.map((a) => a.usuario.id)).toEqual(['2']);
    expect(r.aciertos[0].verboOk).toBe(true);
    expect(r.deMas.map((d) => d.id).sort()).toEqual(['1', '3']);
    expect(r.faltantes.map((f) => f.id)).toEqual(['r1']);
    expect(r.puntos).toBe(2);
  });

  it('sin aristas: todo falta', () => {
    const r = compararReconstruccion([], reales);
    expect(r.faltantes).toHaveLength(2);
    expect(r.puntos).toBe(0);
  });
});

describe('geometría', () => {
  it('grilla aleatoria ubica todos los ids sin repetir celdas', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `n${i}`);
    const g = grillaAleatoria(ids, semilla(2), { jitter: 0 });
    expect(g.size).toBe(12);
    expect(new Set([...g.values()].map((p) => `${p.x},${p.y}`)).size).toBe(12);
  });

  it('despegar elimina superposiciones', () => {
    const r = despegar(
      [
        { id: 'a', x: 0, y: 0, ancho: 100, alto: 40 },
        { id: 'b', x: 10, y: 5, ancho: 100, alto: 40 },
        { id: 'c', x: 20, y: 10, ancho: 100, alto: 40 },
      ],
      10,
    );
    for (let i = 0; i < r.length; i++)
      for (let j = i + 1; j < r.length; j++) {
        const a = r[i];
        const b = r[j];
        const solapa = a.x < b.x + b.ancho && b.x < a.x + a.ancho && a.y < b.y + b.alto && b.y < a.y + a.alto;
        expect(solapa).toBe(false);
      }
  });

  it('aristas paralelas reciben desvíos distintos; una sola va recta', () => {
    const d = desviosParalelos([
      { id: '1', origen: 'a', destino: 'b' },
      { id: '2', origen: 'b', destino: 'a' },
      { id: '3', origen: 'a', destino: 'c' },
    ]);
    expect(d.get('3')).toBe(0);
    expect(d.get('1')).toBe(-0.5);
    // invertida: mismo signo relativo → queda del otro lado en coordenadas absolutas
    expect(d.get('2')).toBe(-0.5);
  });
});
