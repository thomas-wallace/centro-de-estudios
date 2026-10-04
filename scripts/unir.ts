/**
 * Arma materias/<slug>/datos.json a partir de base.json + partes/*.json.
 * Útil cuando el contenido se genera por unidad.
 *
 *   npm run unir -- <slug>
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { argumentoSlug, DIR_MATERIAS, leerJson, listarPartes, rutaDatos, unir } from './materias';

const slug = argumentoSlug();
const base = leerJson(join(DIR_MATERIAS, slug, 'base.json')) as Record<string, unknown>;
const partes = listarPartes(slug);
const datos = unir(
  base,
  partes.map((p) => leerJson(p) as Record<string, unknown[]>),
);
writeFileSync(rutaDatos(slug), JSON.stringify(datos, null, 2) + '\n', 'utf8');
console.log(`✔ ${rutaDatos(slug)} generado a partir de ${partes.length} parte(s)`);
