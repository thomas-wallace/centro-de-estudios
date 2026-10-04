import { Background, Controls, ReactFlow, type ReactFlowProps } from '@xyflow/react';
import { Loader2Icon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { edgeTypes, nodeTypes, type AristaConceptoT, type NodoMapa } from './elementos';
import { useModoOscuro } from './hooks';

export const ALTO_LIENZO = 'max(420px, calc(100dvh - 12rem))';

const ARIA = {
  'controls.ariaLabel': 'Controles del mapa',
  'controls.zoomIn.ariaLabel': 'Acercar',
  'controls.zoomOut.ariaLabel': 'Alejar',
  'controls.fitView.ariaLabel': 'Ver todo el mapa',
  'controls.interactive.ariaLabel': 'Bloquear o desbloquear',
  'minimap.ariaLabel': 'Minimapa',
  'handle.ariaLabel': 'Punto de conexión',
  'node.a11yDescription.default': 'Pulsá Enter o Espacio para seleccionar el concepto.',
  'node.a11yDescription.keyboardDisabled': 'Concepto del mapa.',
  'edge.a11yDescription.default': 'Pulsá Enter o Espacio para seleccionar la relación.',
};

/**
 * Lienzo de React Flow con el estilo de la app: controles y tema.
 * Mientras `cargando`, no monta React Flow (así el fitView inicial se hace con el layout listo).
 */
export function Lienzo({
  cargando,
  className,
  children,
  ...props
}: ReactFlowProps<NodoMapa, AristaConceptoT> & { cargando?: boolean; children?: ReactNode }) {
  const oscuro = useModoOscuro();
  const esCompleto = className?.includes('h-full');

  return (
    <div
      className={cn('relative w-full min-w-0 overflow-hidden rounded-xl border bg-card', className)}
      style={{ height: esCompleto ? '100%' : ALTO_LIENZO }}
    >
      {!cargando && (
      <ReactFlow<NodoMapa, AristaConceptoT>
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode={oscuro ? 'dark' : 'light'}
        minZoom={0.08}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        ariaLabelConfig={ARIA}
        proOptions={{ hideAttribution: true }}
        {...props}
      >
        <Background gap={28} size={1} />
        <Controls showInteractive={false} position="bottom-left" />
        {children}
      </ReactFlow>
      )}
      {cargando && (
        <div role="status" className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-card/80 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Ordenando el mapa…
        </div>
      )}
    </div>
  );
}
