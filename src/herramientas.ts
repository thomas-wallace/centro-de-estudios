import type { Datos } from './schema';

export interface Herramienta {
  id: string;
  ruta: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  /** Las base siempre se muestran; las condicionales solo si hay contenido de ese tipo. */
  base: boolean;
  disponible: (d: Datos) => boolean;
}

export const HERRAMIENTAS: Herramienta[] = [
  {
    id: 'mapa',
    ruta: 'mapa',
    nombre: 'Mapa conceptual',
    emoji: '🗺️',
    descripcion: 'Explorá, completá huecos o reconstruí el mapa',
    base: true,
    disponible: () => true,
  },
  {
    id: 'flashcards',
    ruta: 'flashcards',
    nombre: 'Flashcards',
    emoji: '🃏',
    descripcion: 'Repaso espaciado con FSRS',
    base: true,
    disponible: () => true,
  },
  {
    id: 'simulacro',
    ruta: 'simulacro',
    nombre: 'Simulacro',
    emoji: '📝',
    descripcion: 'Examen de práctica con nivel de seguridad',
    base: true,
    disponible: () => true,
  },
  {
    id: 'glosario',
    ruta: 'glosario',
    nombre: 'Glosario',
    emoji: '📖',
    descripcion: 'Términos y siglas con búsqueda',
    base: true,
    disponible: () => true,
  },
  {
    id: 'flujos',
    ruta: 'flujos',
    nombre: 'Flujos',
    emoji: '🔁',
    descripcion: 'Procesos paso a paso',
    base: false,
    disponible: (d) => d.procesos.length > 0,
  },
  {
    id: 'tablas',
    ruta: 'tablas',
    nombre: 'Tablas comparativas',
    emoji: '⚖️',
    descripcion: 'Compará y practicá con celdas ocultas',
    base: false,
    disponible: (d) => d.comparaciones.length > 0,
  },
  {
    id: 'submapas',
    ruta: 'submapas',
    nombre: 'Sub-mapas',
    emoji: '🌳',
    descripcion: 'Clasificaciones como árboles',
    base: false,
    disponible: (d) => d.taxonomias.length > 0,
  },
  {
    id: 'ejercicios',
    ruta: 'ejercicios',
    nombre: 'Ejercicios',
    emoji: '🧩',
    descripcion: 'Resolución guiada con pistas',
    base: false,
    disponible: (d) => d.ejercicios.length > 0,
  },
  {
    id: 'conexiones',
    ruta: 'conexiones',
    nombre: 'Quiz de conexiones',
    emoji: '🎯',
    descripcion: '¿Qué relación hay entre X e Y?',
    base: false,
    disponible: (d) => d.relaciones.length >= 4,
  },
];

export function herramientasDisponibles(d: Datos) {
  return HERRAMIENTAS.filter((h) => h.base || h.disponible(d));
}
