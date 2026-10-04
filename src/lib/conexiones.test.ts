import { describe, expect, it } from 'vitest';
import demoJson from '../../materias/demo/datos.json';
import type { Concepto, Relacion } from '../schema';
import {
  actualizarRacha,
  conceptosConectados,
  generarBloque,
  GrafoConexiones,
  oracion,
  preguntaComun,
  preguntaRelacion,
  type DatosConexiones,
} from './conexiones';
import { normalizar, semilla } from './texto';

const fuente = { archivo: 'x.md', seccion: '1' };

function c(id: string, unidad = 'u1'): Concepto {
  return {
    id,
    nombre: id.toUpperCase(),
    unidad,
    definicion: `Def de ${id}`,
    definicion_extendida: 'ext',
    ejemplo: 'ej',
    por_que_importa: 'imp',
    fuente,
  };
}

function r(origen: string, verbo: string, destino: string): Relacion {
  return { origen, verbo, destino, fuente };
}

const datos: DatosConexiones = {
  conceptos: [c('a'), c('b'), c('c'), c('d'), c('e'), c('f', 'u2'), c('g', 'u2'), c('h', 'u2')],
  relaciones: [
    r('a', 'usa', 'b'),
    r('a', 'contiene', 'c'),
    r('a', 'contrasta con', 'd'),
    r('b', 'depende de', 'c'),
    r('e', 'reemplaza a', 'a'),
    r('f', 'encapsula', 'g'),
    r('g', 'transporta', 'h'),
    r('f', 'usa', 'h'),
    r('a', 'precede a', 'f'),
    // Relación doble entre a y b (b también "alimenta a" a).
    r('b', 'alimenta a', 'a'),
  ],
};

const demo = demoJson as unknown as DatosConexiones;

describe('GrafoConexiones', () => {
  const g = new GrafoConexiones(datos);

  it('detecta verbos simétricos por significado', () => {
    expect(g.esSimetrico('contrasta con')).toBe(true);
    expect(g.esSimetrico('usa')).toBe(false);
  });

  it('esVerdadera respeta sentido salvo verbos simétricos', () => {
    expect(g.esVerdadera('a', 'usa', 'b')).toBe(true);
    expect(g.esVerdadera('b', 'usa', 'a')).toBe(false);
    expect(g.esVerdadera('d', 'contrasta con', 'a')).toBe(true);
  });

  it('cuenta vecinos distintos', () => {
    expect(g.vecinos.get('a')?.size).toBe(5);
    expect(conceptosConectados(g).map((x) => x.id)).toContain('a');
  });
});

describe('preguntaRelacion', () => {
  const g = new GrafoConexiones(datos);

  it('tiene 4 opciones distintas y una sola correcta', () => {
    for (let s = 0; s < 50; s++) {
      const p = preguntaRelacion(g, datos.relaciones[0], semilla(s))!;
      expect(p).not.toBeNull();
      expect(p.opciones).toHaveLength(4);
      expect(new Set(p.opciones.map(normalizar)).size).toBe(4);
      expect(p.opciones[p.correcta]).toBe('A usa B');
    }
  });

  it('ningún distractor es una relación real entre X e Y', () => {
    for (let s = 0; s < 50; s++) {
      const p = preguntaRelacion(g, datos.relaciones[0], semilla(s))!;
      const distractores = p.opciones.filter((_, i) => i !== p.correcta);
      for (const d of distractores) {
        expect(p.reales).not.toContain(d);
        // "B alimenta a A" es real: nunca puede aparecer como distractor
        expect(d).not.toBe('B alimenta a A');
        // tampoco "A alimenta a B" (es el verbo real de una relación entre A y B)
        expect(d).not.toBe('A alimenta a B');
      }
      expect(p.reales).toEqual(expect.arrayContaining(['A usa B', 'B alimenta a A']));
    }
  });

  it('a veces invierte el sentido de un verbo no simétrico', () => {
    const inversiones = new Set<boolean>();
    for (let s = 0; s < 60; s++) {
      const p = preguntaRelacion(g, datos.relaciones[1], semilla(s))!;
      inversiones.add(p.opciones.includes('C contiene A'));
    }
    expect(inversiones.has(true)).toBe(true);
  });

  it('no invierte verbos simétricos', () => {
    for (let s = 0; s < 60; s++) {
      const p = preguntaRelacion(g, datos.relaciones[2], semilla(s))!;
      expect(p.opciones).not.toContain('D contrasta con A');
    }
  });

  it('devuelve null si no hay verbos suficientes', () => {
    const chico = new GrafoConexiones({ conceptos: [c('a'), c('b')], relaciones: [r('a', 'usa', 'b')] });
    expect(preguntaRelacion(chico, r('a', 'usa', 'b'), semilla(1))).toBeNull();
  });
});

describe('preguntaComun', () => {
  const g = new GrafoConexiones(datos);
  const a = g.conceptos.get('a')!;

  it('muestra 2–3 vecinos reales y distractores que no conectan con todos', () => {
    for (let s = 0; s < 50; s++) {
      const p = preguntaComun(g, a, semilla(s))!;
      expect(p).not.toBeNull();
      expect(p.pistas.length).toBeGreaterThanOrEqual(2);
      expect(p.pistas.length).toBeLessThanOrEqual(3);
      expect(p.opciones).toHaveLength(4);
      expect(p.opcionesConceptos[p.correcta].id).toBe('a');
      const pistaIds = p.pistas.map((x) => x.concepto.id);
      for (const id of pistaIds) expect(g.vecinos.get('a')!.has(id)).toBe(true);
      p.opcionesConceptos.forEach((o, i) => {
        if (i === p.correcta) return;
        expect(pistaIds).not.toContain(o.id);
        expect(pistaIds.every((v) => g.vecinos.get(o.id)?.has(v))).toBe(false);
      });
    }
  });

  it('prefiere distractores de la misma unidad', () => {
    // En u1 hay b, c, d, e (4 candidatos posibles); con 3 vecinos elegidos quedan al menos los no elegidos de u1.
    const p = preguntaComun(g, a, semilla(3))!;
    const distractores = p.opcionesConceptos.filter((_, i) => i !== p.correcta);
    const enU1 = distractores.filter((x) => x.unidad === 'u1').length;
    const candidatosU1 = ['b', 'c', 'd', 'e'].filter((id) => !p.pistas.some((x) => x.concepto.id === id)).length;
    expect(enU1).toBe(Math.min(3, candidatosU1));
  });

  it('null si el concepto tiene menos de 3 vecinos', () => {
    expect(preguntaComun(g, g.conceptos.get('d')!, semilla(1))).toBeNull();
  });
});

describe('generarBloque', () => {
  it('es determinístico con la misma semilla', () => {
    const p1 = generarBloque(demo, { rnd: semilla(42) });
    const p2 = generarBloque(demo, { rnd: semilla(42) });
    expect(p1.map((p) => p.clave)).toEqual(p2.map((p) => p.clave));
  });

  it('genera 10 preguntas válidas de ambos tipos sin repetir', () => {
    const g = new GrafoConexiones(demo);
    for (let s = 0; s < 20; s++) {
      const ps = generarBloque(demo, { rnd: semilla(s) });
      expect(ps).toHaveLength(10);
      expect(new Set(ps.map((p) => p.clave)).size).toBe(10);
      for (const p of ps) {
        expect(new Set(p.opciones.map(normalizar)).size).toBe(4);
        expect(p.correcta).toBeGreaterThanOrEqual(0);
        if (p.tipo === 'relacion') {
          expect(g.esVerdadera(p.relacion.origen, p.relacion.verbo, p.relacion.destino)).toBe(true);
          p.opciones.forEach((o, i) => {
            if (i === p.correcta) return;
            // Ningún distractor coincide con una relación real entre X e Y.
            expect(p.reales.map(normalizar)).not.toContain(normalizar(o));
          });
        }
      }
    }
    const tipos = new Set(
      Array.from({ length: 10 }, (_, s) => generarBloque(demo, { rnd: semilla(s) }).map((p) => p.tipo)).flat(),
    );
    expect(tipos).toEqual(new Set(['relacion', 'comun']));
  });

  it('respeta el filtro de unidad', () => {
    const ps = generarBloque(datos, { unidad: 'u2', rnd: semilla(7) });
    expect(ps.length).toBeGreaterThan(0);
    for (const p of ps) {
      if (p.tipo === 'comun') expect(p.objetivo.unidad).toBe('u2');
      else expect([p.a.unidad, p.b.unidad]).toContain('u2');
    }
  });

  it('devuelve menos preguntas si no alcanzan', () => {
    const ps = generarBloque(datos, { cantidad: 50, rnd: semilla(1) });
    expect(ps.length).toBeLessThan(50);
    expect(ps.length).toBeGreaterThan(0);
  });
});

describe('utilidades', () => {
  it('oracion arma "X verbo Y"', () => {
    expect(oracion('Sol', 'es un tipo de', 'Estrella')).toBe('Sol es un tipo de Estrella');
  });

  it('actualizarRacha', () => {
    expect(actualizarRacha({ actual: 2, mejor: 2 }, true)).toEqual({ actual: 3, mejor: 3, nuevoRecord: true });
    expect(actualizarRacha({ actual: 3, mejor: 5 }, true)).toEqual({ actual: 4, mejor: 5, nuevoRecord: false });
    expect(actualizarRacha({ actual: 3, mejor: 5 }, false)).toEqual({ actual: 0, mejor: 5, nuevoRecord: false });
  });
});
