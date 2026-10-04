import { useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useRef } from 'react';
import type { AristaConceptoT, NodoMapa } from './elementos';

/**
 * Centra la vista en un nodo (o en el punto medio entre dos nodos).
 * Si el nodo todavía no está medido (React Flow recién montado), reintenta un rato.
 */
export function useCentrar() {
  const rf = useReactFlow<NodoMapa, AristaConceptoT>();
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return useCallback(
    (ids: string | [string, string], { zoom }: { zoom?: number } = {}) => {
      const lista = typeof ids === 'string' ? [ids] : ids;
      let intentos = 0;
      let medidoEn = -1;
      const intentar = () => {
        const nodos = lista.map((id) => rf.getInternalNode(id));
        const listos = nodos.every((n) => n?.measured.width);
        if (!listos) {
          if (intentos++ < 40) timer.current = window.setTimeout(intentar, 60);
          return;
        }
        // Dejar pasar el fitView inicial antes de mover la cámara.
        if (medidoEn < 0) {
          medidoEn = intentos;
          timer.current = window.setTimeout(intentar, 120);
          return;
        }
        const cs = nodos.map((n) => ({
          x: n!.internals.positionAbsolute.x + (n!.measured.width ?? 0) / 2,
          y: n!.internals.positionAbsolute.y + (n!.measured.height ?? 0) / 2,
        }));
        const x = cs.reduce((s, c) => s + c.x, 0) / cs.length;
        const y = cs.reduce((s, c) => s + c.y, 0) / cs.length;
        void rf.setCenter(x, y, { zoom: zoom ?? Math.max(rf.getZoom(), 1), duration: 500 });
      };
      window.clearTimeout(timer.current);
      intentar();
    },
    [rf],
  );
}
