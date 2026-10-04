import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const RAIZ = resolve(import.meta.dirname, '..');
export const DIR_MATERIAS = join(RAIZ, 'materias');

export function leerJson(ruta: string): unknown {
  try {
    return JSON.parse(readFileSync(ruta, 'utf8'));
  } catch (e) {
    throw new Error(`No pude leer ${ruta}: ${(e as Error).message}`);
  }
}

export function rutaDatos(slug: string) {
  return join(DIR_MATERIAS, slug, 'datos.json');
}

export function listarPartes(slug: string): string[] {
  const dir = join(DIR_MATERIAS, slug, 'partes');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => join(dir, f));
}

const COLECCIONES = [
  'conceptos',
  'relaciones',
  'taxonomias',
  'procesos',
  'comparaciones',
  'ejercicios',
  'preguntas',
  'glosario',
  'dudas',
] as const;

type Parte = Partial<Record<(typeof COLECCIONES)[number], unknown[]>>;

/** Une `base.json` (materia + unidades) con las partes indicadas. */
export function unir(base: Record<string, unknown>, partes: Parte[]): Record<string, unknown> {
  const salida: Record<string, unknown> = { materia: base.materia, unidades: base.unidades };
  for (const col of COLECCIONES) {
    salida[col] = [...((base[col] as unknown[]) ?? []), ...partes.flatMap((p) => p[col] ?? [])];
  }
  // Dos partes pueden relacionar el mismo par de conceptos (una desde cada unidad): se conserva la primera.
  const pares = new Set<string>();
  salida.relaciones = (salida.relaciones as { origen: string; destino: string }[]).filter((r) => {
    const par = [r.origen, r.destino].sort().join('|');
    if (pares.has(par)) return false;
    pares.add(par);
    return true;
  });
  return salida;
}

export function argumentoSlug(): string {
  const slug = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!slug) {
    const disponibles = existsSync(DIR_MATERIAS) ? readdirSync(DIR_MATERIAS).join(', ') : '(ninguna)';
    console.error(`Falta el slug de la materia. Disponibles: ${disponibles}`);
    process.exit(1);
  }
  return slug;
}
