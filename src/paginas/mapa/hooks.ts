import { useEffect, useState, useSyncExternalStore } from 'react';
import { layoutEnCache, layoutMemo, type AristaLayout, type Layout, type NodoLayout } from './layout';

const CONSULTA_DESKTOP = '(min-width: 768px)';

export function useEsDesktop(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(CONSULTA_DESKTOP);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(CONSULTA_DESKTOP).matches,
    () => true,
  );
}

/** true si <html> tiene la clase .dark (la pone el store según el tema elegido). */
export function useModoOscuro(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const obs = new MutationObserver(cb);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => obs.disconnect();
    },
    () => document.documentElement.classList.contains('dark'),
    () => false,
  );
}

/** Layout ELK asíncrono y memoizado por `clave`. */
export function useLayout(
  clave: string,
  nodos: NodoLayout[],
  aristas: AristaLayout[],
): { layout: Layout | null; error: string | null } {
  const [estado, setEstado] = useState<{ clave: string; layout: Layout | null; error: string | null }>(() => ({
    clave,
    layout: layoutEnCache(clave) ?? null,
    error: null,
  }));

  useEffect(() => {
    let vivo = true;
    const ya = layoutEnCache(clave);
    if (ya) {
      setEstado({ clave, layout: ya, error: null });
      return;
    }
    setEstado({ clave, layout: null, error: null });
    layoutMemo(clave, nodos, aristas).then(
      (l) => vivo && setEstado({ clave, layout: l, error: null }),
      (e: unknown) => vivo && setEstado({ clave, layout: null, error: String(e) }),
    );
    return () => {
      vivo = false;
    };
    // nodos/aristas se derivan de la clave: no hace falta re-ejecutar si cambian de identidad.
  }, [clave]);

  if (estado.clave !== clave) return { layout: layoutEnCache(clave) ?? null, error: null };
  return { layout: estado.layout, error: estado.error };
}
