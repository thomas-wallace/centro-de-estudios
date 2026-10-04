import type { PasoEjercicio } from '../schema';
import { normalizar } from './texto';

function normalizarBinario(s: string): string {
  return s.replace(/[\s.\-_]/g, '');
}

function normalizarIp(s: string): string {
  return s.replace(/\s+/g, '').replace(/^\/+/, '/').toLowerCase();
}

function aNumero(s: string): number | null {
  const limpio = s.trim().replace(/\s/g, '').replace(',', '.');
  if (limpio === '' || !/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(limpio)) return null;
  return Number(limpio);
}

/** Devuelve true si `entrada` coincide con la respuesta del paso (o alguna alternativa). */
export function respuestaCorrecta(paso: PasoEjercicio, entrada: string): boolean {
  const validas = [paso.respuesta, ...(paso.alternativas ?? [])];
  switch (paso.tipo_respuesta) {
    case 'numero': {
      const n = aNumero(entrada);
      if (n === null) return false;
      const tol = paso.tolerancia ?? 0;
      return validas.some((v) => {
        const m = aNumero(v);
        return m !== null && Math.abs(m - n) <= tol + 1e-9;
      });
    }
    case 'binario':
      return validas.some((v) => normalizarBinario(v) === normalizarBinario(entrada));
    case 'ip':
      return validas.some((v) => normalizarIp(v) === normalizarIp(entrada));
    case 'opcion':
    case 'texto':
    default:
      return validas.some((v) => normalizar(v) === normalizar(entrada));
  }
}
