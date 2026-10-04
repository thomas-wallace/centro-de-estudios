/** Normaliza texto para comparar: minúsculas, sin tildes, espacios colapsados. */
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[“”"«»'’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Mezcla un arreglo (Fisher–Yates) con un generador opcional. */
export function mezclar<T>(arr: readonly T[], rnd: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generador pseudoaleatorio determinístico (mulberry32), útil para tests y semillas. */
export function semilla(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const LETRAS = ['A', 'B', 'C', 'D'] as const;
