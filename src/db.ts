import Dexie, { type Table } from 'dexie';
import type { CardSerializada } from './lib/repaso';

/** Estado de repaso espaciado de una flashcard. */
export interface EstadoTarjeta {
  materia: string;
  id: string;
  unidad: string;
  card: CardSerializada;
  due: number;
}

export interface Revision {
  id?: number;
  materia: string;
  tarjeta: string;
  unidad: string;
  rating: number;
  fecha: number;
  /** true si era la primera vez que se veía la tarjeta (cuenta para el límite de nuevas por día). */
  nueva?: boolean;
}

export type Seguridad = 'seguro' | 'dudo' | 'adivino';

export interface RespuestaSimulacro {
  pregunta: string;
  unidad: string;
  elegida: number | null;
  correcta: boolean;
  seguridad: Seguridad | null;
}

export interface Simulacro {
  id?: number;
  materia: string;
  fecha: number;
  modo: 'corto' | 'completo' | 'repaso';
  respuestas: RespuestaSimulacro[];
  aciertos: number;
  total: number;
}

export type Herramienta =
  | 'mapa-huecos'
  | 'mapa-reconstruir'
  | 'flujos'
  | 'tablas'
  | 'ejercicios'
  | 'conexiones';

/** Resultado de una práctica (no simulacro) para el panel de progreso. */
export interface Actividad {
  id?: number;
  materia: string;
  herramienta: Herramienta;
  fecha: number;
  aciertos: number;
  total: number;
  /** Unidad principal de la práctica, si aplica. */
  unidad?: string;
  /** Ids de conceptos involucrados que se acertaron / fallaron (para medir dominio). */
  conceptosOk?: string[];
  conceptosMal?: string[];
  detalle?: string;
}

export interface ConfigMateria {
  materia: string;
  fechaExamen?: string;
  formatoExamen?: string;
  nuevasPorDia: number;
  mejorRacha: number;
}

class BaseDeDatos extends Dexie {
  tarjetas!: Table<EstadoTarjeta, [string, string]>;
  revisiones!: Table<Revision, number>;
  simulacros!: Table<Simulacro, number>;
  actividades!: Table<Actividad, number>;
  config!: Table<ConfigMateria, string>;

  constructor() {
    super('centro-de-estudio');
    this.version(1).stores({
      tarjetas: '[materia+id], materia, [materia+due]',
      revisiones: '++id, materia, [materia+fecha]',
      simulacros: '++id, materia, [materia+fecha]',
      actividades: '++id, materia, [materia+fecha]',
      config: 'materia',
    });
  }
}

export const db = new BaseDeDatos();

export const CONFIG_POR_DEFECTO: Omit<ConfigMateria, 'materia'> = { nuevasPorDia: 20, mejorRacha: 0 };

export async function leerConfig(materia: string): Promise<ConfigMateria> {
  return (await db.config.get(materia)) ?? { materia, ...CONFIG_POR_DEFECTO };
}

export async function guardarConfig(materia: string, cambios: Partial<ConfigMateria>) {
  const actual = await leerConfig(materia);
  await db.config.put({ ...actual, ...cambios, materia });
}

// ── Exportar / importar ──────────────────────────────────────────

export interface Respaldo {
  formato: 'centro-de-estudio';
  version: 1;
  exportado: string;
  materia: string | null;
  tarjetas: EstadoTarjeta[];
  revisiones: Revision[];
  simulacros: Simulacro[];
  actividades: Actividad[];
  config: ConfigMateria[];
}

export async function exportarProgreso(materia: string | null): Promise<Respaldo> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtro = <T extends { materia: string }>(t: Table<T, any>) =>
    materia ? t.where('materia').equals(materia).toArray() : t.toArray();
  return {
    formato: 'centro-de-estudio',
    version: 1,
    exportado: new Date().toISOString(),
    materia,
    tarjetas: await filtro(db.tarjetas),
    revisiones: await filtro(db.revisiones),
    simulacros: await filtro(db.simulacros),
    actividades: await filtro(db.actividades),
    config: await filtro(db.config),
  };
}

export async function importarProgreso(r: Respaldo): Promise<{ materias: string[] }> {
  if (r?.formato !== 'centro-de-estudio') throw new Error('El archivo no es un respaldo del centro de estudio');
  const sinId = <T extends { id?: number }>(xs: T[]) => xs.map(({ id: _id, ...x }) => x as T);
  const materias = new Set<string>([
    ...r.tarjetas.map((t) => t.materia),
    ...r.simulacros.map((s) => s.materia),
    ...r.config.map((c) => c.materia),
  ]);
  await db.transaction('rw', [db.tarjetas, db.revisiones, db.simulacros, db.actividades, db.config], async () => {
    for (const m of materias) {
      await Promise.all([
        db.tarjetas.where('materia').equals(m).delete(),
        db.revisiones.where('materia').equals(m).delete(),
        db.simulacros.where('materia').equals(m).delete(),
        db.actividades.where('materia').equals(m).delete(),
        db.config.where('materia').equals(m).delete(),
      ]);
    }
    await db.tarjetas.bulkPut(r.tarjetas);
    await db.revisiones.bulkAdd(sinId(r.revisiones));
    await db.simulacros.bulkAdd(sinId(r.simulacros));
    await db.actividades.bulkAdd(sinId(r.actividades));
    await db.config.bulkPut(r.config);
  });
  return { materias: [...materias] };
}

export async function borrarProgreso(materia: string) {
  await db.transaction('rw', [db.tarjetas, db.revisiones, db.simulacros, db.actividades, db.config], async () => {
    await Promise.all([
      db.tarjetas.where('materia').equals(materia).delete(),
      db.revisiones.where('materia').equals(materia).delete(),
      db.simulacros.where('materia').equals(materia).delete(),
      db.actividades.where('materia').equals(materia).delete(),
      db.config.where('materia').equals(materia).delete(),
    ]);
  });
}

export async function registrarActividad(a: Omit<Actividad, 'id' | 'fecha'>) {
  try {
    await db.actividades.add({ ...a, fecha: Date.now() });
  } catch (e) {
    console.warn('No se pudo guardar la actividad', e);
  }
}
