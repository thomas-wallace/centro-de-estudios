import { useLiveQuery } from 'dexie-react-hooks';
import { materias } from 'virtual:materias';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CONFIG_POR_DEFECTO, db, type ConfigMateria } from './db';
import { derivarTarjetas, type Tarjeta } from './lib/flashcards';
import { DatosSchema, type Concepto, type Datos, type Unidad } from './schema';
import { useApp } from './store';

export interface Vecino {
  concepto: Concepto;
  verbo: string;
  /** "sale": este concepto es el origen; "entra": es el destino. */
  sentido: 'sale' | 'entra';
}

export interface MateriaCtx {
  slug: string;
  datos: Datos;
  unidades: Map<string, Unidad>;
  conceptos: Map<string, Concepto>;
  vecinos: Map<string, Vecino[]>;
  tarjetas: Tarjeta[];
  color: (unidad: string) => string;
  nombreUnidad: (unidad: string) => string;
  /** Configuración del usuario (fecha y formato del examen, etc.), con los valores de datos.json por defecto. */
  config: ConfigMateria & { fechaExamenEfectiva?: string; formatoExamenEfectivo?: string };
}

const Ctx = createContext<MateriaCtx | null>(null);

export function useMateria(): MateriaCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useMateria debe usarse dentro de <MateriaProvider>');
  return c;
}

type Carga = { estado: 'cargando' } | { estado: 'error'; mensajes: string[] } | { estado: 'ok'; datos: Datos };

export function useCargaMateria(slug: string): Carga {
  const enCache = useApp((s) => s.cache[slug]);
  const guardar = useApp((s) => s.guardarEnCache);
  const [carga, setCarga] = useState<Carga>(enCache ? { estado: 'ok', datos: enCache } : { estado: 'cargando' });

  useEffect(() => {
    if (enCache) {
      setCarga({ estado: 'ok', datos: enCache });
      return;
    }
    const m = materias.find((x) => x.slug === slug);
    if (!m) {
      setCarga({ estado: 'error', mensajes: [`No existe la materia "${slug}".`] });
      return;
    }
    let vivo = true;
    setCarga({ estado: 'cargando' });
    m.cargar()
      .then((json) => {
        const r = DatosSchema.safeParse(json);
        if (!vivo) return;
        if (!r.success) {
          setCarga({
            estado: 'error',
            mensajes: r.error.issues.slice(0, 20).map((i) => `${i.path.join('.')}: ${i.message}`),
          });
          return;
        }
        guardar(slug, r.data);
        setCarga({ estado: 'ok', datos: r.data });
      })
      .catch((e: unknown) => vivo && setCarga({ estado: 'error', mensajes: [String(e)] }));
    return () => {
      vivo = false;
    };
  }, [slug, enCache, guardar]);

  return carga;
}

export function MateriaProvider({ slug, datos, children }: { slug: string; datos: Datos; children: ReactNode }) {
  const configGuardada = useLiveQuery(() => db.config.get(slug).catch(() => undefined), [slug]);

  const base = useMemo(() => {
    const unidades = new Map(datos.unidades.map((u) => [u.id, u]));
    const conceptos = new Map(datos.conceptos.map((c) => [c.id, c]));
    const vecinos = new Map<string, Vecino[]>();
    const agregar = (id: string, v: Vecino) => {
      if (!vecinos.has(id)) vecinos.set(id, []);
      vecinos.get(id)!.push(v);
    };
    for (const r of datos.relaciones) {
      const o = conceptos.get(r.origen);
      const d = conceptos.get(r.destino);
      if (!o || !d) continue;
      agregar(o.id, { concepto: d, verbo: r.verbo, sentido: 'sale' });
      agregar(d.id, { concepto: o, verbo: r.verbo, sentido: 'entra' });
    }
    return {
      unidades,
      conceptos,
      vecinos,
      tarjetas: derivarTarjetas(datos),
      color: (u: string) => unidades.get(u)?.color ?? '#94a3b8',
      nombreUnidad: (u: string) => unidades.get(u)?.nombre ?? u,
    };
  }, [datos]);

  const valor = useMemo<MateriaCtx>(() => {
    const cfg = configGuardada ?? { materia: slug, ...CONFIG_POR_DEFECTO };
    return {
      slug,
      datos,
      ...base,
      config: {
        ...cfg,
        fechaExamenEfectiva: cfg.fechaExamen || datos.materia.examen.fecha,
        formatoExamenEfectivo: cfg.formatoExamen || datos.materia.examen.formato,
      },
    };
  }, [slug, datos, base, configGuardada]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
