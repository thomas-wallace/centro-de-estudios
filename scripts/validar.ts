/**
 * Valida el paquete de contenido de una materia.
 *
 *   npm run validar -- <slug>                        valida materias/<slug>/datos.json
 *   npm run validar -- <slug> --parte <archivo>      valida una parte contra base.json (modo parcial)
 */
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validarDatos, type ResultadoValidacion } from '../src/lib/validacion';
import { argumentoSlug, DIR_MATERIAS, leerJson, listarPartes, rutaDatos, unir } from './materias';

const slug = argumentoSlug();
const idx = process.argv.indexOf('--parte');
const rutaParte = idx > -1 ? process.argv[idx + 1] : undefined;

let resultado: ResultadoValidacion;

if (rutaParte) {
  const base = leerJson(join(DIR_MATERIAS, slug, 'base.json')) as Record<string, unknown>;
  const parte = leerJson(resolve(rutaParte)) as Record<string, unknown[]>;
  const externos = new Set<string>();
  const rutaAnclas = join(DIR_MATERIAS, slug, 'anclas.json');
  if (existsSync(rutaAnclas)) {
    for (const [k, v] of Object.entries(leerJson(rutaAnclas) as Record<string, unknown>)) {
      if (!k.startsWith('_') && Array.isArray(v)) v.forEach((i) => externos.add(String(i)));
    }
  }
  for (const otra of listarPartes(slug)) {
    if (resolve(otra) === resolve(rutaParte)) continue;
    const p = leerJson(otra) as { conceptos?: { id: string }[] };
    p.conceptos?.forEach((c) => externos.add(c.id));
  }
  resultado = validarDatos(unir(base, [parte]), { parcial: true, conceptosExternos: externos });
  if (existsSync(rutaAnclas)) {
    const anclas = leerJson(rutaAnclas) as Record<string, string[]>;
    const propios = new Set((parte.conceptos as { id: string; unidad: string }[] | undefined)?.map((c) => c.id));
    const unidadesParte = new Set((parte.conceptos as { unidad: string }[] | undefined)?.map((c) => c.unidad));
    for (const u of unidadesParte) {
      for (const a of anclas[u] ?? []) {
        if (!propios.has(a)) resultado.errores.push(`Falta el concepto ancla "${a}" de la unidad ${u}`);
      }
    }
    resultado.ok = resultado.errores.length === 0;
  }
  console.log(`\nValidando la parte ${rutaParte} (modo parcial)\n`);
} else {
  const ruta = rutaDatos(slug);
  if (!existsSync(ruta)) {
    console.error(`No existe ${ruta}. Si la materia está en partes, corré primero: npm run unir -- ${slug}`);
    process.exit(1);
  }
  resultado = validarDatos(leerJson(ruta));
  console.log(`\nValidando ${ruta}\n`);
}

const d = resultado.datos;
if (d) {
  console.log(
    `Conteos: ${d.conceptos.length} conceptos · ${d.relaciones.length} relaciones · ${d.taxonomias.length} taxonomías · ` +
      `${d.procesos.length} procesos · ${d.comparaciones.length} comparaciones · ${d.ejercicios.length} ejercicios · ` +
      `${d.preguntas.length} preguntas · ${d.glosario.length} glosario · ${d.dudas.length} dudas\n`,
  );

  const filas = resultado.cobertura.filter((f) => !rutaParte || f.conceptos + f.preguntas > 0);
  console.log('Cobertura por unidad');
  console.table(
    filas.map((f) => ({
      unidad: f.unidad,
      peso: `${f.peso} %`,
      conceptos: `${f.conceptos} (${f.pctConceptos.toFixed(1)} %)`,
      preguntas: `${f.preguntas} (${f.pctPreguntas.toFixed(1)} %)`,
      flashcards: `${f.tarjetas} (${f.pctTarjetas.toFixed(1)} %)`,
    })),
  );

  const n = d.preguntas.length || 1;
  const letras = Object.entries(resultado.distribucionLetras)
    .map(([l, c]) => `${l}: ${c} (${((c / n) * 100).toFixed(0)} %)`)
    .join(' · ');
  console.log(`Correctas por letra → ${letras}`);
  console.log(`Correcta = opción más larga → ${resultado.pctCorrectaMasLarga.toFixed(1)} % (máx. 40 %)\n`);
}

for (const a of resultado.advertencias) console.warn(`⚠  ${a}`);
if (resultado.errores.length) {
  console.error(`\n✖ ${resultado.errores.length} error(es):`);
  for (const e of resultado.errores) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✔ Validación OK');
