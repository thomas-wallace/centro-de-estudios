/// <reference types="vite/client" />

declare const __SINGLE__: boolean;

declare module 'virtual:materias' {
  export interface MateriaDisponible {
    slug: string;
    nombre: string;
    descripcion: string;
    cargar: () => Promise<unknown>;
  }
  export const materias: MateriaDisponible[];
}
