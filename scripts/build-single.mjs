/**
 * Genera un único HTML autocontenido de una materia (se abre con doble clic).
 *
 *   npm run build:single -- <slug>   →   dist-single/<slug>.html
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const raiz = resolve(import.meta.dirname, '..');
const slug = process.argv[2];
if (!slug) {
  console.error('Uso: npm run build:single -- <slug>');
  process.exit(1);
}
if (!existsSync(join(raiz, 'materias', slug, 'datos.json'))) {
  console.error(`No existe materias/${slug}/datos.json`);
  process.exit(1);
}

const salida = join(raiz, 'dist-single');
mkdirSync(salida, { recursive: true });
rmSync(join(salida, 'index.html'), { force: true });

const r = spawnSync('npx', ['vite', 'build', '--mode', 'single'], {
  cwd: raiz,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, MATERIA: slug },
});
if (r.status !== 0) process.exit(r.status ?? 1);

const destino = join(salida, `${slug}.html`);
rmSync(destino, { force: true });
renameSync(join(salida, 'index.html'), destino);
console.log(`\n✔ ${destino}`);
