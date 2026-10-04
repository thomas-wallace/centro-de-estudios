import type { ReactNode } from 'react';

type Rango = readonly [number, number];

/** Une rangos solapados o contiguos y descarta los muy cortos (ruido de la búsqueda difusa). */
export function unirRangos(rangos: readonly Rango[], minimo = 2): [number, number][] {
  const orden = [...rangos].filter(([a, b]) => b - a + 1 >= minimo).sort((x, y) => x[0] - y[0]);
  const res: [number, number][] = [];
  for (const [a, b] of orden) {
    const ult = res[res.length - 1];
    if (ult && a <= ult[1] + 1) ult[1] = Math.max(ult[1], b);
    else res.push([a, b]);
  }
  return res;
}

/** Envuelve en <mark> las partes de `texto` indicadas por los rangos (inclusivos) de Fuse. */
export function Resaltado({ texto, rangos, minimo }: { texto: string; rangos?: readonly Rango[]; minimo?: number }) {
  if (!rangos || rangos.length === 0) return <>{texto}</>;
  const partes: ReactNode[] = [];
  let i = 0;
  for (const [a, b] of unirRangos(rangos, minimo)) {
    if (a > i) partes.push(texto.slice(i, a));
    partes.push(
      <mark key={a} className="rounded-sm bg-warning/35 px-0.5 text-inherit">
        {texto.slice(a, b + 1)}
      </mark>,
    );
    i = b + 1;
  }
  if (i < texto.length) partes.push(texto.slice(i));
  return <>{partes}</>;
}
