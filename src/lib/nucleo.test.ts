import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Datos, PasoEjercicio, Pregunta } from '../schema';
import { derivarTarjetas } from './flashcards';
import { generarPlan, repartirFases, unidadesPorDia } from './plan';
import { calcularProgreso } from './progreso';
import { calificar, estaAprendida, Rating, State } from './repaso';
import { respuestaCorrecta } from './respuestas';
import { armarSimulacro, repartirPorPeso } from './simulacro';
import { normalizar, semilla } from './texto';
import { validarDatos } from './validacion';

const fuente = { archivo: 'a.md', seccion: 's' };

function concepto(id: string, unidad: string) {
  return { id, nombre: id.toUpperCase(), unidad, definicion: 'd', definicion_extendida: 'de', ejemplo: 'e', por_que_importa: 'p', fuente };
}

function pregunta(id: string, unidad: string, correcta: number, opciones = ['uno', 'dos', 'tres', 'cuatro']): Pregunta {
  const por_que_falla = ['x', 'x', 'x', 'x'];
  por_que_falla[correcta] = '';
  return { id, unidad, enunciado: '¿?', opciones, correcta, explicacion: 'porque', por_que_falla, fuente };
}

function datosMinimos(): Datos {
  return {
    materia: { nombre: 'T', slug: 't', examen: {}, temas_clave: [] },
    unidades: [
      { id: 'u1', nombre: 'U1', archivos: ['a.md'], color: '#ff0000', peso: 50 },
      { id: 'u2', nombre: 'U2', archivos: ['a.md'], color: '#00ff00', peso: 50 },
    ],
    conceptos: [concepto('a', 'u1'), concepto('b', 'u1'), concepto('c', 'u2'), concepto('d', 'u2')],
    relaciones: [
      { origen: 'a', destino: 'b', verbo: 'usa', fuente },
      { origen: 'b', destino: 'c', verbo: 'contrasta con', fuente },
      { origen: 'c', destino: 'd', verbo: 'es parte de', fuente },
    ],
    taxonomias: [],
    procesos: [],
    comparaciones: [],
    ejercicios: [],
    preguntas: [pregunta('p1', 'u1', 0), pregunta('p2', 'u1', 1), pregunta('p3', 'u2', 2), pregunta('p4', 'u2', 3)],
    glosario: [],
    dudas: [],
  };
}

describe('validarDatos', () => {
  it('acepta datos válidos', () => {
    const r = validarDatos(datosMinimos());
    expect(r.errores).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('detecta conceptos aislados y relaciones rotas', () => {
    const d = datosMinimos();
    d.conceptos.push(concepto('e', 'u2'));
    d.relaciones.push({ origen: 'a', destino: 'zz', verbo: 'usa', fuente });
    const r = validarDatos(d);
    expect(r.errores.some((e) => e.includes('aislado') && e.includes('"e"'))).toBe(true);
    expect(r.errores.some((e) => e.includes('destino inexistente'))).toBe(true);
  });

  it('detecta ids duplicados', () => {
    const d = datosMinimos();
    d.conceptos.push(concepto('a', 'u2'));
    expect(validarDatos(d).errores.some((e) => e.includes('duplicado'))).toBe(true);
  });

  it('exige reparto de letras y que la correcta no sea siempre la más larga', () => {
    const d = datosMinimos();
    d.preguntas = d.preguntas.map((p) => ({
      ...pregunta(p.id, p.unidad, 0, ['la respuesta correcta y larguísima', 'b', 'c', 'd']),
    }));
    const r = validarDatos(d);
    expect(r.errores.some((e) => e.includes('letra A'))).toBe(true);
    expect(r.errores.some((e) => e.includes('más larga'))).toBe(true);
  });

  it('exige cobertura proporcional al peso', () => {
    const d = datosMinimos();
    d.unidades[0].peso = 90;
    d.unidades[1].peso = 10;
    d.preguntas = [pregunta('p1', 'u2', 0), pregunta('p2', 'u2', 1), pregunta('p3', 'u2', 2), pregunta('p4', 'u1', 3)];
    const r = validarDatos(d);
    expect(r.errores.some((e) => e.includes('"u1"') && e.includes('preguntas'))).toBe(true);
  });
});

describe('materias reales', () => {
  const dir = resolve(import.meta.dirname, '../../materias');
  const slugs = existsSync(dir) ? readdirSync(dir).filter((s) => existsSync(join(dir, s, 'datos.json'))) : [];
  it.each(slugs)('materias/%s/datos.json pasa la validación', (slug) => {
    const r = validarDatos(JSON.parse(readFileSync(join(dir, slug, 'datos.json'), 'utf8')));
    expect(r.errores).toEqual([]);
  });
});

describe('respuestaCorrecta', () => {
  const paso = (p: Partial<PasoEjercicio>): PasoEjercicio => ({
    consigna: 'c',
    respuesta: 'x',
    tipo_respuesta: 'texto',
    explicacion: 'e',
    ...p,
  });
  it('compara texto sin tildes ni mayúsculas', () => {
    expect(respuestaCorrecta(paso({ respuesta: 'Capa de Enlace' }), '  capa de  enlace ')).toBe(true);
    expect(normalizar('Árbol')).toBe('arbol');
  });
  it('compara números con coma y tolerancia', () => {
    const p = paso({ respuesta: '101.81', tipo_respuesta: 'numero', tolerancia: 0.05 });
    expect(respuestaCorrecta(p, '101,8')).toBe(true);
    expect(respuestaCorrecta(p, '100')).toBe(false);
    expect(respuestaCorrecta(p, 'abc')).toBe(false);
  });
  it('compara binarios ignorando espacios', () => {
    expect(respuestaCorrecta(paso({ respuesta: '1101001', tipo_respuesta: 'binario' }), '1101 001')).toBe(true);
  });
  it('compara IPs y alternativas', () => {
    const p = paso({ respuesta: '192.168.1.0/25', tipo_respuesta: 'ip', alternativas: ['192.168.1.0 /25'] });
    expect(respuestaCorrecta(p, ' 192.168.1.0/25 ')).toBe(true);
    expect(respuestaCorrecta(p, '192.168.1.128/25')).toBe(false);
  });
});

describe('flashcards', () => {
  it('deriva 3 tarjetas por concepto y 1 por relación', () => {
    const d = datosMinimos();
    const t = derivarTarjetas(d);
    expect(t).toHaveLength(d.conceptos.length * 3 + d.relaciones.length);
    expect(new Set(t.map((x) => x.id)).size).toBe(t.length);
  });

  it('FSRS: "Bien" repetido lleva la tarjeta a repaso', () => {
    let c = undefined as ReturnType<typeof calificar> | undefined;
    let ahora = new Date('2026-01-01T10:00:00');
    for (let i = 0; i < 4; i++) {
      c = calificar(c, Rating.Good, ahora);
      ahora = new Date(c.due + 1000);
    }
    expect(c!.state).toBe(State.Review);
    expect(c!.due).toBeGreaterThan(new Date('2026-01-02').getTime());
    expect(estaAprendida(c)).toBe(c!.stability >= 3);
  });
});

describe('simulacro', () => {
  it('reparte por peso con mayor resto y respeta disponibles', () => {
    const u = [
      { id: 'a', peso: 50 },
      { id: 'b', peso: 30 },
      { id: 'c', peso: 20 },
    ];
    expect(repartirPorPeso(u, { a: 100, b: 100, c: 100 }, 10)).toEqual({ a: 5, b: 3, c: 2 });
    const r = repartirPorPeso(u, { a: 2, b: 100, c: 100 }, 10);
    expect(r.a).toBe(2);
    expect(r.a + r.b + r.c).toBe(10);
  });

  it('arma la cantidad pedida con opciones permutadas', () => {
    const d = datosMinimos();
    const s = armarSimulacro(d.preguntas, d.unidades, 3, semilla(1));
    expect(s).toHaveLength(3);
    for (const p of s) expect([...p.orden].sort()).toEqual([0, 1, 2, 3]);
  });
});

describe('plan de estudio', () => {
  it('reparte fases que suman los días y terminan en medirse', () => {
    for (const n of [1, 2, 3, 4, 7, 10, 14, 30]) {
      const f = repartirFases(n);
      expect(f.entender + f.memorizar + f.aplicar + f.medirse).toBe(n);
      expect(f.medirse).toBeGreaterThan(0);
    }
  });

  it('cubre todas las unidades en cada fase', () => {
    const u = [
      { id: 'a', peso: 50 },
      { id: 'b', peso: 30 },
      { id: 'c', peso: 20 },
    ];
    for (const d of [1, 2, 3, 5, 8]) {
      const dias = unidadesPorDia(u, d);
      expect(new Set(dias.flat())).toEqual(new Set(['a', 'b', 'c']));
    }
  });

  it('genera un día por cada día hasta el examen', () => {
    const p = generarPlan({
      hoy: new Date(2026, 9, 3),
      fechaExamen: '2026-10-13',
      unidades: [
        { id: 'a', nombre: 'A', peso: 60 },
        { id: 'b', nombre: 'B', peso: 40 },
      ],
      herramientas: ['mapa', 'flashcards', 'simulacro', 'glosario'],
    });
    expect(p.dias).toHaveLength(10);
    expect(p.dias[0].fecha).toBe('2026-10-03');
    expect(p.dias.at(-1)!.fase).toBe('medirse');
    expect(p.dias.every((d) => d.tareas.length > 0)).toBe(true);
  });
});

describe('progreso', () => {
  it('marca débil una unidad con simulacros flojos', () => {
    const d = datosMinimos();
    const p = calcularProgreso({
      unidades: d.unidades,
      conceptos: d.conceptos,
      tarjetas: derivarTarjetas(d),
      estados: [],
      simulacros: [
        {
          materia: 't',
          fecha: 1,
          modo: 'corto',
          aciertos: 1,
          total: 4,
          respuestas: [
            { pregunta: 'p1', unidad: 'u1', elegida: 1, correcta: false, seguridad: 'seguro' },
            { pregunta: 'p2', unidad: 'u1', elegida: 0, correcta: false, seguridad: 'dudo' },
            { pregunta: 'p3', unidad: 'u2', elegida: 2, correcta: true, seguridad: 'seguro' },
            { pregunta: 'p4', unidad: 'u2', elegida: 3, correcta: true, seguridad: 'seguro' },
          ],
        },
      ],
      actividades: [],
    });
    expect(p.porUnidad.find((u) => u.unidad === 'u1')!.debil).toBe(true);
    expect(p.porUnidad.find((u) => u.unidad === 'u2')!.aciertoSimulacro).toBe(100);
  });
});
