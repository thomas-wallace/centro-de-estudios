import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

const ID_VIRTUAL = 'virtual:materias';
const ID_RESUELTO = '\0' + ID_VIRTUAL;

interface Opciones {
  dir: string;
  /** Si se indica, solo se incluye esa materia y se importa de forma estática (build de un solo archivo). */
  soloSlug?: string;
}

/**
 * Expone `virtual:materias` con la lista de materias encontradas en `materias/<slug>/datos.json`.
 * Agregar una carpeta nueva alcanza para que aparezca en la app: no hay que tocar código.
 */
export function materiasPlugin({ dir, soloSlug }: Opciones): Plugin {
  const descubrir = () => {
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'datos.json')))
      .filter((e) => !soloSlug || e.name === soloSlug)
      .map((e) => {
        const ruta = join(dir, e.name, 'datos.json').replace(/\\/g, '/');
        let nombre = e.name;
        let descripcion = '';
        try {
          const json = JSON.parse(readFileSync(ruta, 'utf8'));
          nombre = json?.materia?.nombre ?? nombre;
          descripcion = json?.materia?.descripcion ?? '';
        } catch {
          /* el error se reporta al cargarla */
        }
        return { slug: e.name, nombre, descripcion, ruta };
      });
  };

  return {
    name: 'centro-de-estudio:materias',
    resolveId(id) {
      if (id === ID_VIRTUAL) return ID_RESUELTO;
    },
    load(id) {
      if (id !== ID_RESUELTO) return;
      const materias = descubrir();
      if (soloSlug && materias.length === 0) {
        this.error(`No existe materias/${soloSlug}/datos.json`);
      }
      for (const m of materias) this.addWatchFile(m.ruta);
      if (soloSlug) {
        const [m] = materias;
        return [
          `import datos from ${JSON.stringify(m.ruta)};`,
          `export const materias = [{ slug: ${JSON.stringify(m.slug)}, nombre: ${JSON.stringify(m.nombre)}, descripcion: ${JSON.stringify(m.descripcion)}, cargar: async () => datos }];`,
        ].join('\n');
      }
      const items = materias.map(
        (m) =>
          `{ slug: ${JSON.stringify(m.slug)}, nombre: ${JSON.stringify(m.nombre)}, descripcion: ${JSON.stringify(m.descripcion)}, cargar: () => import(${JSON.stringify(m.ruta)}).then((x) => x.default) }`,
      );
      return `export const materias = [${items.join(',\n')}];`;
    },
    configureServer(server) {
      server.watcher.add(dir);
      const recargar = (archivo: string) => {
        if (!archivo.replace(/\\/g, '/').endsWith('/datos.json')) return;
        const mod = server.moduleGraph.getModuleById(ID_RESUELTO);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', recargar);
      server.watcher.on('unlink', recargar);
    },
  };
}
