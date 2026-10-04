import { aFechaISO, diasEntre, inicioDelDia } from './utils';

export type Fase = 'entender' | 'memorizar' | 'aplicar' | 'medirse';

export const FASES: { id: Fase; nombre: string; emoji: string; descripcion: string }[] = [
  { id: 'entender', nombre: 'Entender', emoji: '🧠', descripcion: 'Recorré el mapa, los flujos y las clasificaciones de cada unidad.' },
  { id: 'memorizar', nombre: 'Memorizar', emoji: '🃏', descripcion: 'Flashcards nuevas, mapa con huecos y glosario.' },
  { id: 'aplicar', nombre: 'Aplicar', emoji: '🧩', descripcion: 'Ejercicios, tablas, reconstruir el mapa y conexiones.' },
  { id: 'medirse', nombre: 'Medirse', emoji: '📝', descripcion: 'Simulacros, repaso de lo fallado y de lo pendiente.' },
];

export interface TareaPlan {
  herramienta: string;
  texto: string;
  unidad?: string;
}

export interface DiaPlan {
  fecha: string;
  fase: Fase;
  unidades: string[];
  tareas: TareaPlan[];
}

export interface EntradaPlan {
  hoy: Date;
  /** Fecha del examen (YYYY-MM-DD). Sin fecha se planifican 14 días. */
  fechaExamen?: string;
  unidades: { id: string; nombre: string; peso: number }[];
  /** Ids de herramientas disponibles en la materia. */
  herramientas: string[];
  /** Unidades débiles (se priorizan en "medirse"). */
  debiles?: string[];
}

export const DIAS_SIN_FECHA = 14;

/** Cantidad de días por fase. Siempre termina en "medirse". */
export function repartirFases(dias: number): Record<Fase, number> {
  if (dias <= 1) return { entender: 0, memorizar: 0, aplicar: 0, medirse: 1 };
  if (dias === 2) return { entender: 0, memorizar: 1, aplicar: 0, medirse: 1 };
  if (dias === 3) return { entender: 1, memorizar: 0, aplicar: 1, medirse: 1 };
  const medirse = Math.max(1, Math.round(dias * 0.15));
  const aplicar = Math.max(1, Math.round(dias * 0.25));
  const memorizar = Math.max(1, Math.round(dias * 0.3));
  const entender = Math.max(1, dias - medirse - aplicar - memorizar);
  // Ajuste por redondeo
  const exceso = entender + memorizar + aplicar + medirse - dias;
  return { entender, memorizar: memorizar - Math.max(0, exceso), aplicar, medirse };
}

/** Asigna unidades a `d` días según su peso: cada unidad ocupa un tramo proporcional del período. */
export function unidadesPorDia(unidades: { id: string; peso: number }[], d: number): string[][] {
  const total = unidades.reduce((s, u) => s + u.peso, 0) || 1;
  const tramos: { id: string; desde: number; hasta: number }[] = [];
  let acc = 0;
  for (const u of unidades) {
    tramos.push({ id: u.id, desde: acc / total, hasta: (acc + u.peso) / total });
    acc += u.peso;
  }
  return Array.from({ length: d }, (_, j) => {
    const a = j / d;
    const b = (j + 1) / d;
    const solapan = tramos.filter((t) => Math.min(b, t.hasta) - Math.max(a, t.desde) > 1e-9);
    // Si una unidad apenas roza el día, se la deja para el día en que tiene más presencia.
    return solapan
      .filter((t) => {
        const solape = Math.min(b, t.hasta) - Math.max(a, t.desde);
        return solape >= Math.min((t.hasta - t.desde) * 0.25, (b - a) * 0.25) || solapan.length === 1;
      })
      .map((t) => t.id);
  });
}

function tareasDe(fase: Fase, unidades: string[], nombre: (u: string) => string, hay: (h: string) => boolean): TareaPlan[] {
  const t: TareaPlan[] = [];
  const lista = unidades.map(nombre).join(', ');
  switch (fase) {
    case 'entender':
      for (const u of unidades) t.push({ herramienta: 'mapa', unidad: u, texto: `Explorá el mapa de «${nombre(u)}»` });
      if (hay('flujos')) t.push({ herramienta: 'flujos', texto: `Mirá los flujos de ${lista}` });
      if (hay('submapas')) t.push({ herramienta: 'submapas', texto: 'Recorré las clasificaciones (sub-mapas)' });
      t.push({ herramienta: 'flashcards', texto: 'Empezá las flashcards nuevas de esas unidades' });
      break;
    case 'memorizar':
      t.push({ herramienta: 'flashcards', texto: `Flashcards de ${lista} (pendientes + nuevas)` });
      for (const u of unidades) t.push({ herramienta: 'mapa', unidad: u, texto: `Mapa con huecos de «${nombre(u)}»` });
      t.push({ herramienta: 'glosario', texto: 'Repasá siglas y términos en el glosario' });
      break;
    case 'aplicar':
      if (hay('ejercicios')) t.push({ herramienta: 'ejercicios', texto: `Ejercicios de ${lista}` });
      if (hay('tablas')) t.push({ herramienta: 'tablas', texto: 'Practicá las tablas comparativas con celdas ocultas' });
      for (const u of unidades) t.push({ herramienta: 'mapa', unidad: u, texto: `Reconstruí el mapa de «${nombre(u)}»` });
      if (hay('conexiones')) t.push({ herramienta: 'conexiones', texto: 'Quiz de conexiones (buscá una racha de 10)' });
      t.push({ herramienta: 'flashcards', texto: 'Flashcards pendientes de hoy' });
      break;
    case 'medirse':
      t.push({ herramienta: 'simulacro', texto: 'Simulacro completo, marcando tu seguridad' });
      t.push({ herramienta: 'simulacro', texto: 'Reintentá las preguntas falladas' });
      if (unidades.length) t.push({ herramienta: 'mapa', unidad: unidades[0], texto: `Reforzá «${nombre(unidades[0])}»` });
      t.push({ herramienta: 'flashcards', texto: 'Flashcards pendientes de hoy' });
      break;
  }
  return t;
}

export function generarPlan(e: EntradaPlan): { dias: DiaPlan[]; totalDias: number; conFecha: boolean } {
  const hoy = inicioDelDia(e.hoy);
  let dias = DIAS_SIN_FECHA;
  let conFecha = false;
  if (e.fechaExamen) {
    const [y, m, d] = e.fechaExamen.split('-').map(Number);
    dias = Math.max(1, diasEntre(hoy, new Date(y, m - 1, d)));
    conFecha = true;
  }
  const reparto = repartirFases(dias);
  const nombre = (u: string) => e.unidades.find((x) => x.id === u)?.nombre ?? u;
  const hay = (h: string) => e.herramientas.includes(h);
  const ordenMedirse = [
    ...(e.debiles ?? []),
    ...[...e.unidades].sort((a, b) => b.peso - a.peso).map((u) => u.id),
  ].filter((u, i, arr) => arr.indexOf(u) === i);

  const salida: DiaPlan[] = [];
  let k = 0;
  for (const f of FASES) {
    const n = reparto[f.id];
    if (n === 0) continue;
    const asignacion = f.id === 'medirse' ? Array.from({ length: n }, (_, i) => [ordenMedirse[i % ordenMedirse.length]]) : unidadesPorDia(e.unidades, n);
    for (let i = 0; i < n; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + k++);
      const unidades = asignacion[i].filter(Boolean);
      salida.push({ fecha: aFechaISO(fecha), fase: f.id, unidades, tareas: tareasDe(f.id, unidades, nombre, hay) });
    }
  }
  return { dias: salida, totalDias: dias, conFecha };
}
