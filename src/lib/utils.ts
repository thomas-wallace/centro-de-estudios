import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pct(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

export function plural(n: number, singular: string, pluralForma = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralForma}`;
}

const fmtFecha = new Intl.DateTimeFormat('es-UY', { day: 'numeric', month: 'short' });
const fmtFechaLarga = new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });

export function fechaCorta(d: Date | number) {
  return fmtFecha.format(d);
}

export function fechaLarga(d: Date | number) {
  return fmtFechaLarga.format(d);
}

/** Inicio del día local. */
export function inicioDelDia(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function diasEntre(a: Date, b: Date): number {
  return Math.round((inicioDelDia(b).getTime() - inicioDelDia(a).getTime()) / 86_400_000);
}

/** Convierte "YYYY-MM-DD" a Date local (sin corrimiento por zona horaria). */
export function parsearFechaISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function aFechaISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
