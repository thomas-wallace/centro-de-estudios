import { create } from 'zustand';
import type { Datos } from './schema';

export type Tema = 'claro' | 'oscuro' | 'sistema';

function leerTema(): Tema {
  try {
    const t = localStorage.getItem('tema');
    if (t === 'claro' || t === 'oscuro' || t === 'sistema') return t;
  } catch {
    /* almacenamiento bloqueado */
  }
  return 'sistema';
}

export function aplicarTema(tema: Tema) {
  const oscuro =
    tema === 'oscuro' || (tema === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', oscuro);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#0f172a' : '#f8fafc');
}

interface EstadoApp {
  tema: Tema;
  setTema: (t: Tema) => void;
  /** Datos ya cargados y validados, por slug. */
  cache: Record<string, Datos>;
  guardarEnCache: (slug: string, d: Datos) => void;
}

export const useApp = create<EstadoApp>((set) => ({
  tema: leerTema(),
  setTema: (tema) => {
    try {
      localStorage.setItem('tema', tema);
    } catch {
      /* no persiste, pero se aplica igual */
    }
    aplicarTema(tema);
    set({ tema });
  },
  cache: {},
  guardarEnCache: (slug, d) => set((s) => ({ cache: { ...s.cache, [slug]: d } })),
}));
