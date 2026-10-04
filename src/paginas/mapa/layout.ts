import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { despegar, type Punto } from '@/lib/mapa';

/**
 * Layout automático con ELK.
 *
 * Decisión (medida con los datos de demo y de redes):
 * - Grafos chicos (≤ 60 nodos: demo completo o una unidad con sus vecinos): `stress` plano,
 *   con largo de arista deseado generoso (230 px) → mapa compacto, pocas cruces y aristas
 *   cortas donde el verbo entra en el medio. `layered` con etiquetas inline quedaba 3–4 veces
 *   más ancho y con aristas muy largas; `force` y `mrtree` cruzaban mucho más.
 * - Grafos grandes (mapa completo de ~140 nodos): `stress` plano tarda varios segundos con
 *   elk.bundled y queda como una maraña; en cambio cada unidad se ordena con `stress` dentro de
 *   un grupo y los grupos se empaquetan con `rectpacking`. Queda agrupado por unidad (con su
 *   recuadro de color) y tarda < 1 s.
 * Después se separan los nodos que hayan quedado superpuestos.
 */

export interface NodoLayout {
  id: string;
  unidad: string;
  ancho: number;
  alto: number;
}

export interface AristaLayout {
  origen: string;
  destino: string;
}

export interface GrupoLayout {
  unidad: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface Layout {
  posiciones: Map<string, Punto>;
  grupos: GrupoLayout[];
}

const UMBRAL_AGRUPAR = 60;
const LARGO_ARISTA = '230';

let elk: InstanceType<typeof ELK> | null = null;
const motor = () => (elk ??= new ELK());

const cache = new Map<string, Promise<Layout>>();
const resueltos = new Map<string, Layout>();

/** Layout memoizado por `clave` (materia + unidad + modo). */
export function layoutMemo(clave: string, nodos: NodoLayout[], aristas: AristaLayout[]): Promise<Layout> {
  let p = cache.get(clave);
  if (!p) {
    p = calcularLayout(nodos, aristas);
    p.then(
      (l) => resueltos.set(clave, l),
      () => cache.delete(clave),
    );
    cache.set(clave, p);
  }
  return p;
}

/** El layout si ya estaba calculado (así no se vuelve a mostrar "Ordenando el mapa…"). */
export function layoutEnCache(clave: string): Layout | undefined {
  return resueltos.get(clave);
}

const opcionesStress = {
  'elk.algorithm': 'stress',
  'elk.stress.desiredEdgeLength': LARGO_ARISTA,
  'elk.spacing.nodeNode': '60',
};

export async function calcularLayout(nodos: NodoLayout[], aristas: AristaLayout[]): Promise<Layout> {
  // Dejar que el navegador pinte "Ordenando el mapa…" antes de bloquear con ELK.
  await new Promise((r) => setTimeout(r, 30));
  const ids = new Set(nodos.map((n) => n.id));
  const validas = aristas.filter((a) => ids.has(a.origen) && ids.has(a.destino) && a.origen !== a.destino);
  const unidades = new Set(nodos.map((n) => n.unidad));
  return nodos.length > UMBRAL_AGRUPAR && unidades.size > 1 ? agrupado(nodos, validas) : plano(nodos, validas);
}

const hoja = (n: NodoLayout): ElkNode => ({ id: n.id, width: n.ancho, height: n.alto });
const aristasElk = (as: AristaLayout[], pref: string) =>
  as.map((a, i) => ({ id: `${pref}${i}`, sources: [a.origen], targets: [a.destino] }));

async function plano(nodos: NodoLayout[], aristas: AristaLayout[]): Promise<Layout> {
  const r = await motor().layout({
    id: 'raiz',
    layoutOptions: opcionesStress,
    children: nodos.map(hoja),
    edges: aristasElk(aristas, 'e'),
  });
  const rects = despegar(
    (r.children ?? []).map((c) => ({ id: c.id, x: c.x ?? 0, y: c.y ?? 0, ancho: c.width ?? 0, alto: c.height ?? 0 })),
    28,
  );
  return { posiciones: new Map(rects.map((c) => [c.id, { x: c.x, y: c.y }])), grupos: [] };
}

const PAD = { arriba: 56, lado: 32 };

async function agrupado(nodos: NodoLayout[], aristas: AristaLayout[]): Promise<Layout> {
  const unidadDe = new Map(nodos.map((n) => [n.id, n.unidad]));
  const porUnidad = new Map<string, NodoLayout[]>();
  for (const n of nodos) {
    if (!porUnidad.has(n.unidad)) porUnidad.set(n.unidad, []);
    porUnidad.get(n.unidad)!.push(n);
  }

  // 1) Cada unidad por separado (stress) + despegar.
  const internos = new Map<string, { id: string; x: number; y: number; ancho: number; alto: number }[]>();
  for (const [u, ns] of porUnidad) {
    const propias = aristas.filter((a) => unidadDe.get(a.origen) === u && unidadDe.get(a.destino) === u);
    const r = await motor().layout({
      id: `u:${u}`,
      layoutOptions: opcionesStress,
      children: ns.map(hoja),
      edges: aristasElk(propias, `${u}-`),
    });
    const rects = despegar(
      (r.children ?? []).map((c) => ({ id: c.id, x: c.x ?? 0, y: c.y ?? 0, ancho: c.width ?? 0, alto: c.height ?? 0 })),
      28,
    );
    const minX = Math.min(...rects.map((c) => c.x));
    const minY = Math.min(...rects.map((c) => c.y));
    internos.set(
      u,
      rects.map((c) => ({ ...c, x: c.x - minX + PAD.lado, y: c.y - minY + PAD.arriba })),
    );
  }

  // 2) Empaquetar los grupos (como cajas fijas) respetando el orden de las unidades.
  const cajas = [...internos].map(([u, rs]) => ({
    id: u,
    width: Math.max(...rs.map((c) => c.x + c.ancho)) + PAD.lado,
    height: Math.max(...rs.map((c) => c.y + c.alto)) + PAD.lado,
  }));
  const r = await motor().layout({
    id: 'raiz',
    layoutOptions: {
      'elk.algorithm': 'rectpacking',
      'elk.spacing.nodeNode': '90',
      'elk.aspectRatio': '1.5',
    },
    children: cajas,
  });

  const posiciones = new Map<string, Punto>();
  const grupos: GrupoLayout[] = [];
  for (const c of r.children ?? []) {
    const gx = c.x ?? 0;
    const gy = c.y ?? 0;
    grupos.push({ unidad: c.id, x: gx, y: gy, ancho: c.width ?? 0, alto: c.height ?? 0 });
    for (const n of internos.get(c.id) ?? []) posiciones.set(n.id, { x: gx + n.x, y: gy + n.y });
  }
  return { posiciones, grupos };
}
